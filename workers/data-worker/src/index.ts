import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DATA_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health Check
app.get('/health', (c) => c.json({ status: 'ok', worker: 'data-worker' }));

// GET /fixtures
app.get('/fixtures', async (c) => {
  try {
    const fixturesData = await c.env.DATA_KV.get('wc2026:fixtures', 'json') as any[] | null;

    if (!fixturesData) {
      return c.json({ error: 'Datos de partidos no disponibles aún. Esperá la próxima sincronización.' }, 503);
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

    // Sort chronologically (ascending order)
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return c.json({ fixtures: filtered });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener fixtures: ' + err.message }, 500);
  }
});

// GET /fixtures/:id
app.get('/fixtures/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ error: 'ID de partido inválido.' }, 400);
    }

    const fixturesData = await c.env.DATA_KV.get('wc2026:fixtures', 'json') as any[] | null;
    if (!fixturesData) {
      return c.json({ error: 'Datos de partidos no disponibles aún. Esperá la próxima sincronización.' }, 503);
    }

    const fixture = fixturesData.find((f: any) => (f.id || f.fixtureId) === id);

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
    const teams = await c.env.DATA_KV.get('wc2026:teams', 'json') as any[] | null;
    if (!teams) {
      return c.json({ error: 'Equipos no disponibles aún. Esperá la próxima sincronización.' }, 503);
    }
    return c.json({ teams });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener equipos: ' + err.message }, 500);
  }
});

// GET /standings
app.get('/standings', async (c) => {
  try {
    const standings = await c.env.DATA_KV.get('wc2026:standings', 'json') as any[] | null;
    if (!standings) {
      return c.json({ error: 'Tabla de posiciones no disponible aún. Esperá la próxima sincronización.' }, 503);
    }
    return c.json({ standings });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener tabla de posiciones: ' + err.message }, 500);
  }
});

export default app;
