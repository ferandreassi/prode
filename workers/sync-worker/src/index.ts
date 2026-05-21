export type Env = {
  DATA_KV: KVNamespace;
  DB: D1Database;
  API_FOOTBALL_TOKEN: string;
};

export default {
  // Fetch handler allows manually triggering the sync via HTTP
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/sync') {
        const stats = await performSync(env);
        return new Response(JSON.stringify({ status: 'success', stats }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('Sync Worker is running. Send GET /sync to trigger manually.', { status: 200 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Cron trigger scheduled handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`);
    ctx.waitUntil(performSync(env));
  }
};

// Main Sync Logic
async function performSync(env: Env) {
  console.log('Starting sync from API-Football...');
  let fixtures: any[] = [];

  // 1. Fetch from API-Football if token is real, else use simulated data update
  const token = env.API_FOOTBALL_TOKEN;
  if (token && token !== 'dummy_token_for_api_football') {
    try {
      // API-Football endpoint for World Cup 2026
      // League ID: 1 (World Cup), Season: 2026
      const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
        headers: {
          'x-apisports-key': token
        }
      });
      const data: any = await res.json();
      if (data.response && Array.isArray(data.response)) {
        fixtures = data.response.map((item: any) => ({
          id: item.fixture.id,
          date: item.fixture.date,
          status: item.fixture.status.short, // FT, NS, PST, etc.
          round: item.league.round,
          homeTeam: {
            name: item.teams.home.name,
            flag: item.teams.home.logo, // Logo URL
            code: item.teams.home.code
          },
          awayTeam: {
            name: item.teams.away.name,
            flag: item.teams.away.logo,
            code: item.teams.away.code
          },
          goals: {
            home: item.goals.home,
            away: item.goals.away
          }
        }));
      }
    } catch (fetchErr) {
      console.error('Failed to fetch from API-Football, falling back to mock update:', fetchErr);
    }
  }

  // If no data was fetched from the API, abort the sync
  if (fixtures.length === 0) {
    throw new Error('No se pudo obtener datos de API Football. Verificá el token y la conectividad.');
  }

  // 2. Save complete list to KV
  await env.DATA_KV.put('wc2026:fixtures', JSON.stringify(fixtures));

  // Save each fixture individually to KV for detail lookup
  for (const fixture of fixtures) {
    await env.DATA_KV.put(`wc2026:fixture:${fixture.id}`, JSON.stringify(fixture));
  }

  // Save last sync timestamp
  await env.DATA_KV.put('wc2026:last_sync', Date.now().toString());

  // 3. Process finished matches to grade user predictions in D1 SQLite
  let gradedCount = 0;
  const finishedFixtures = fixtures.filter(f => f.status === 'FT' || f.status === 'AET' || f.status === 'PEN');

  for (const fixture of finishedFixtures) {
    const homeActual = fixture.goals.home;
    const awayActual = fixture.goals.away;

    if (homeActual === null || awayActual === null) continue;

    // Fetch all predictions for this finished match
    const { results: preds } = await env.DB.prepare(
      'SELECT user_id, home_goals, away_goals FROM predictions WHERE fixture_id = ?'
    ).bind(fixture.id).all();

    for (const pred of preds as any[]) {
      const predHome = pred.home_goals;
      const predAway = pred.away_goals;

      // Calculate score points using our grading algorithm
      const score = calculatePoints(
        { home: predHome, away: predAway },
        { home: homeActual, away: awayActual }
      );

      const scoreId = `${pred.user_id}:${fixture.id}`;
      const now = Date.now();

      // Insert or Update the calculated score in D1
      await env.DB.prepare(`
        INSERT INTO scores (id, user_id, fixture_id, points, score_type, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, fixture_id) DO UPDATE SET
          points = excluded.points,
          score_type = excluded.score_type,
          calculated_at = excluded.calculated_at
      `).bind(scoreId, pred.user_id, fixture.id, score.points, score.type, now).run();

      gradedCount++;
    }
  }

  console.log(`Sync complete. Graded ${gradedCount} predictions.`);
  return { fixturesSynced: fixtures.length, predictionsGraded: gradedCount };
}

// Prediction Points Calculator
function calculatePoints(
  prediction: { home: number; away: number },
  result: { home: number; away: number }
): { points: number; type: string } {
  // 1. Exact score (7 pts)
  if (prediction.home === result.home && prediction.away === result.away) {
    return { points: 7, type: 'EXACT' };
  }

  const predDiff = prediction.home - prediction.away;
  const resDiff = result.home - result.away;
  const predOutcome = Math.sign(predDiff);
  const resOutcome = Math.sign(resDiff);

  // 2. Winner + Goal Difference (4 pts)
  if (predOutcome === resOutcome && predDiff === resDiff) {
    return { points: 4, type: 'WINNER_DIFF' };
  }

  // 3. Winner / Draw (3 pts)
  if (predOutcome === resOutcome) {
    return { points: 3, type: 'WINNER' };
  }

  // 4. Partial: one team's goals correct (1 pt)
  if (prediction.home === result.home || prediction.away === result.away) {
    return { points: 1, type: 'PARTIAL' };
  }

  // 5. Miss (0 pts)
  return { points: 0, type: 'MISS' };
}
