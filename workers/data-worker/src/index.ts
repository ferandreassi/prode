import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DATA_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', worker: 'data-worker' }));

// MOCK DATA FOR LOCAL DEVELOPMENT / FALLBACK
const MOCK_FIXTURES = [
  {
    id: 101,
    date: '2026-06-20T21:00:00Z',
    status: 'NS', // Not Started
    round: 'Fase de Grupos — Fecha 1',
    homeTeam: { name: 'USA', flag: '🇺🇸', code: 'USA' },
    awayTeam: { name: 'Marruecos', flag: '🇲🇦', code: 'MAR' },
    goals: { home: null, away: null }
  },
  {
    id: 102,
    date: '2026-06-21T15:00:00Z',
    status: 'NS',
    round: 'Fase de Grupos — Fecha 1',
    homeTeam: { name: 'España', flag: '🇪🇸', code: 'ESP' },
    awayTeam: { name: 'Japón', flag: '🇯🇵', code: 'JPN' },
    goals: { home: null, away: null }
  },
  {
    id: 103,
    date: '2026-06-18T18:00:00Z',
    status: 'FT', // Finished
    round: 'Fase de Grupos — Fecha 1',
    homeTeam: { name: 'Francia', flag: '🇫🇷', code: 'FRA' },
    awayTeam: { name: 'Australia', flag: '🇦🇺', code: 'AUS' },
    goals: { home: 3, away: 0 }
  },
  {
    id: 104,
    date: '2026-06-18T20:30:00Z',
    status: 'FT',
    round: 'Fase de Grupos — Fecha 1',
    homeTeam: { name: 'Alemania', flag: '🇩🇪', code: 'GER' },
    awayTeam: { name: 'México', flag: '🇲🇽', code: 'MEX' },
    goals: { home: 1, away: 1 }
  },
  {
    id: 105,
    date: '2026-06-20T19:00:00Z',
    status: 'NS',
    round: 'Fase de Grupos — Fecha 1',
    homeTeam: { name: 'Argentina', flag: '🇦🇷', code: 'ARG' },
    awayTeam: { name: 'Brasil', flag: '🇧🇷', code: 'BRA' },
    goals: { home: null, away: null }
  }
];

const MOCK_TEAMS = [
  { id: 1, name: 'Argentina', flag: '🇦🇷', code: 'ARG' },
  { id: 2, name: 'Brasil', flag: '🇧🇷', code: 'BRA' },
  { id: 3, name: 'USA', flag: '🇺🇸', code: 'USA' },
  { id: 4, name: 'Marruecos', flag: '🇲🇦', code: 'MAR' },
  { id: 5, name: 'España', flag: '🇪🇸', code: 'ESP' },
  { id: 6, name: 'Japón', flag: '🇯🇵', code: 'JPN' },
  { id: 7, name: 'Francia', flag: '🇫🇷', code: 'FRA' },
  { id: 8, name: 'Australia', flag: '🇦🇺', code: 'AUS' },
  { id: 9, name: 'Alemania', flag: '🇩🇪', code: 'GER' },
  { id: 10, name: 'México', flag: '🇲🇽', code: 'MEX' }
];

const MOCK_STANDINGS = [
  {
    group: 'Grupo A',
    teams: [
      { rank: 1, team: 'Argentina', played: 0, points: 0, goalsFor: 0, goalsAgainst: 0 },
      { rank: 2, team: 'Brasil', played: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }
    ]
  }
];

// GET /fixtures
app.get('/fixtures', async (c) => {
  try {
    let fixturesData = await c.env.DATA_KV.get('wc2026:fixtures', 'json') as any[];
    
    // Fallback if KV is empty
    if (!fixturesData) {
      fixturesData = MOCK_FIXTURES;
    }

    const round = c.req.query('round');
    const status = c.req.query('status');

    let filtered = fixturesData;
    if (round) {
      filtered = filtered.filter(f => f.round.toLowerCase().includes(round.toLowerCase()));
    }
    if (status) {
      filtered = filtered.filter(f => f.status === status);
    }

    return c.json({ fixtures: filtered });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener fixtures: ' + err.message }, 500);
  }
});

// GET /fixtures/:id
app.get('/fixtures/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    let fixture = await c.env.DATA_KV.get(`wc2026:fixture:${id}`, 'json');

    if (!fixture) {
      // Fallback
      fixture = MOCK_FIXTURES.find(f => f.id === id);
    }

    if (!fixture) {
      return c.json({ error: 'Partido no encontrado.' }, 404);
    }

    return c.json({ fixture });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener partido: ' + err.message }, 500);
  }
});

// GET /teams
app.get('/teams', async (c) => {
  try {
    let teams = await c.env.DATA_KV.get('wc2026:teams', 'json') as any[];
    if (!teams) {
      teams = MOCK_TEAMS;
    }
    return c.json({ teams });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener equipos: ' + err.message }, 500);
  }
});

// GET /standings
app.get('/standings', async (c) => {
  try {
    let standings = await c.env.DATA_KV.get('wc2026:standings', 'json') as any[];
    if (!standings) {
      standings = MOCK_STANDINGS;
    }
    return c.json({ standings });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener tabla de posiciones: ' + err.message }, 500);
  }
});

export default app;
