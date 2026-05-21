import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from './auth';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  DATA_KV: KVNamespace;
};

type Variables = {
  user: {
    userId: string;
    nickname: string;
  };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for all routes
app.use('*', cors());

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', worker: 'api-worker' }));

// Auth Middleware
async function authRequired(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Acceso no autorizado. Token faltante.' }, 401);
  }
  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Token inválido o expirado.' }, 401);
  }
  c.set('user', payload);
  await next();
}


// ------------------------------------
// AUTH ROUTES
// ------------------------------------

// POST /auth/register
app.post('/auth/register', async (c) => {
  try {
    const { nickname, password } = await c.req.json();
    if (!nickname || !password) {
      return c.json({ error: 'Faltan campos requeridos (nickname, password).' }, 400);
    }

    if (nickname.length < 3 || nickname.length > 20) {
      return c.json({ error: 'El nickname debe tener entre 3 y 20 caracteres.' }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
    }

    // Check if nickname already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE nickname = ?'
    ).bind(nickname).first();

    if (existing) {
      return c.json({ error: 'El nickname ya está en uso.' }, 409);
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = Date.now();

    // Default avatar using dicebear bottts
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${nickname}`;

    await c.env.DB.prepare(
      'INSERT INTO users (id, nickname, password_hash, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, nickname, passwordHash, avatarUrl, now, now).run();

    const token = await generateJWT(userId, nickname, c.env.JWT_SECRET);

    return c.json({
      message: 'Usuario registrado con éxito.',
      token,
      user: {
        id: userId,
        nickname,
        avatarUrl
      }
    }, 201);

  } catch (err: any) {
    return c.json({ error: 'Error del servidor: ' + err.message }, 500);
  }
});

// POST /auth/login
app.post('/auth/login', async (c) => {
  try {
    const { nickname, password } = await c.req.json();
    if (!nickname || !password) {
      return c.json({ error: 'Nickname y contraseña requeridos.' }, 400);
    }

    const user: any = await c.env.DB.prepare(
      'SELECT id, nickname, password_hash, avatar_url FROM users WHERE nickname = ?'
    ).bind(nickname).first();

    if (!user) {
      return c.json({ error: 'Nickname o contraseña incorrectos.' }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Nickname o contraseña incorrectos.' }, 401);
    }

    const token = await generateJWT(user.id, user.nickname, c.env.JWT_SECRET);

    return c.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url
      }
    });

  } catch (err: any) {
    return c.json({ error: 'Error del servidor: ' + err.message }, 500);
  }
});

// ------------------------------------
// USER PROFILE ROUTES
// ------------------------------------

// GET /users/me
app.get('/users/me', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const user: any = await c.env.DB.prepare(
      'SELECT id, nickname, avatar_url, created_at FROM users WHERE id = ?'
    ).bind(userPayload.userId).first();

    if (!user) {
      return c.json({ error: 'Usuario no encontrado.' }, 404);
    }

    return c.json({ user });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener perfil: ' + err.message }, 500);
  }
});

// PUT /users/me
app.put('/users/me', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const { nickname, avatarUrl } = await c.req.json();

    if (!nickname) {
      return c.json({ error: 'El nickname no puede estar vacío.' }, 400);
    }

    // Check if new nickname is taken by someone else
    if (nickname !== userPayload.nickname) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM users WHERE nickname = ? AND id != ?'
      ).bind(nickname, userPayload.userId).first();

      if (existing) {
        return c.json({ error: 'El nickname ya está en uso.' }, 409);
      }
    }

    const now = Date.now();
    await c.env.DB.prepare(
      'UPDATE users SET nickname = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
    ).bind(nickname, avatarUrl || null, now, userPayload.userId).run();

    // Re-generate JWT because the nickname might have changed
    const newToken = await generateJWT(userPayload.userId, nickname, c.env.JWT_SECRET);

    return c.json({
      message: 'Perfil actualizado con éxito.',
      token: newToken,
      user: {
        id: userPayload.userId,
        nickname,
        avatarUrl
      }
    });

  } catch (err: any) {
    return c.json({ error: 'Error al actualizar perfil: ' + err.message }, 500);
  }
});

// GET /users/me/groups
app.get('/users/me/groups', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');

    const { results } = await c.env.DB.prepare(`
      SELECT g.id, g.name, g.code, g.image_url, g.admin_user_id, g.max_members,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as members_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).bind(userPayload.userId).all();

    return c.json({ groups: results });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener grupos: ' + err.message }, 500);
  }
});

// GET /groups/:id/fixtures/:fixtureId/leaderboard
app.get('/groups/:id/fixtures/:fixtureId/leaderboard', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const fixtureId = parseInt(c.req.param('fixtureId'));
    const userPayload = c.get('user');

    if (isNaN(fixtureId)) {
      return c.json({ error: 'ID de partido inválido.' }, 400);
    }

    // Check membership
    const membership = await c.env.DB.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, userPayload.userId).first();

    if (!membership) {
      return c.json({ error: 'No tienes acceso a este grupo.' }, 403);
    }

    // Fetch leaderboard for this fixture in the group
    const { results } = await c.env.DB.prepare(`
      SELECT 
        u.id as userId,
        u.nickname,
        u.avatar_url as avatarUrl,
        p.home_goals as predHome,
        p.away_goals as predAway,
        COALESCE(s.points, 0) as points,
        s.score_type as scoreType
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN predictions p ON p.user_id = u.id AND p.fixture_id = ?
      LEFT JOIN scores s ON s.user_id = u.id AND s.fixture_id = ?
      WHERE gm.group_id = ?
      ORDER BY points DESC, u.nickname ASC
    `).bind(fixtureId, fixtureId, groupId).all();

    return c.json({ leaderboard: results });

  } catch (err: any) {
    return c.json({ error: 'Error al obtener leaderboard del partido: ' + err.message }, 500);
  }
});

// ------------------------------------
// PREDICTIONS ROUTES
// ------------------------------------

// GET /predictions/me
app.get('/predictions/me', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const { results } = await c.env.DB.prepare(
      'SELECT id, user_id, fixture_id, home_goals, away_goals, created_at, updated_at FROM predictions WHERE user_id = ?'
    ).bind(userPayload.userId).all();

    const predictions = results.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      fixtureId: p.fixture_id,
      homeGoals: p.home_goals,
      awayGoals: p.away_goals,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return c.json({ predictions });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener predicciones: ' + err.message }, 500);
  }
});

// POST /predictions
app.post('/predictions', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const { fixtureId, homeGoals, awayGoals } = await c.req.json();

    if (fixtureId === undefined || homeGoals === undefined || awayGoals === undefined) {
      return c.json({ error: 'Faltan campos requeridos (fixtureId, homeGoals, awayGoals).' }, 400);
    }

    const fId = parseInt(fixtureId);
    const hGoals = parseInt(homeGoals);
    const aGoals = parseInt(awayGoals);

    if (isNaN(fId) || isNaN(hGoals) || isNaN(aGoals)) {
      return c.json({ error: 'Valores numéricos inválidos.' }, 400);
    }

    // Get fixture date from KV to validate deadline
    let fixtureDate: string | null = null;
    try {
      const kvFixture = await c.env.DATA_KV.get(`wc2026:fixture:${fId}`, 'json') as any;
      if (kvFixture && kvFixture.date) {
        fixtureDate = kvFixture.date;
      }
    } catch (e) {
      console.error('Error al obtener partido desde KV:', e);
    }

    if (!fixtureDate) {
      return c.json({ error: 'Partido no encontrado.' }, 404);
    }

    // Validate prediction deadline (1 hour before match kick-off)
    const matchTime = new Date(fixtureDate).getTime();
    const now = Date.now();
    const lockTime = matchTime - 60 * 60 * 1000; // 1 hour before kick-off

    if (now >= lockTime) {
      return c.json({ error: 'El pronóstico está cerrado. Los pronósticos se bloquean 1 hora antes del partido.' }, 400);
    }

    const uuid = crypto.randomUUID();

    // Use INSERT OR REPLACE on predictions table or INSERT ON CONFLICT
    await c.env.DB.prepare(`
      INSERT INTO predictions (id, user_id, fixture_id, home_goals, away_goals, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, fixture_id) DO UPDATE SET
        home_goals = excluded.home_goals,
        away_goals = excluded.away_goals,
        updated_at = excluded.updated_at
    `).bind(uuid, userPayload.userId, fId, hGoals, aGoals, now, now).run();

    return c.json({ message: 'Predicción guardada con éxito.' });

  } catch (err: any) {
    return c.json({ error: 'Error al guardar predicción: ' + err.message }, 500);
  }
});

// GET /predictions/fixture/:id
app.get('/predictions/fixture/:id', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const fixtureId = parseInt(c.req.param('id'));

    if (isNaN(fixtureId)) {
      return c.json({ error: 'ID de partido inválido.' }, 400);
    }

    const p: any = await c.env.DB.prepare(
      'SELECT id, user_id, fixture_id, home_goals, away_goals, created_at, updated_at FROM predictions WHERE user_id = ? AND fixture_id = ?'
    ).bind(userPayload.userId, fixtureId).first();

    if (!p) {
      return c.json({ prediction: null });
    }

    const prediction = {
      id: p.id,
      userId: p.user_id,
      fixtureId: p.fixture_id,
      homeGoals: p.home_goals,
      awayGoals: p.away_goals,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    };

    return c.json({ prediction });
  } catch (err: any) {
    return c.json({ error: 'Error al obtener predicción del partido: ' + err.message }, 500);
  }
});

// ------------------------------------
// STORAGE & R2 IMAGE UPLOAD ROUTES
// ------------------------------------

// POST /upload (Authenticated - max 2MB)
app.post('/upload', authRequired, async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No se subió ningún archivo válido bajo el campo "file".' }, 400);
    }

    // Limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: 'La imagen excede el límite de tamaño de 2MB.' }, 400);
    }

    // Check mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF, SVG).' }, 400);
    }

    // Generate unique clean filename
    const ext = file.name.split('.').pop() || 'png';
    const uuid = crypto.randomUUID();
    const key = `uploads/${uuid}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    await c.env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    // Return key and full relative URL
    return c.json({
      message: 'Archivo subido con éxito.',
      key,
      url: `/images/${key}`
    }, 201);

  } catch (err: any) {
    return c.json({ error: 'Error al subir archivo: ' + err.message }, 500);
  }
});

// GET /images/* (Public serving from R2)
app.get('/images/*', async (c) => {
  try {
    const key = c.req.path.substring('/images/'.length);
    if (!key) {
      return c.json({ error: 'Ruta de imagen inválida.' }, 400);
    }

    const object = await c.env.IMAGES.get(key);
    if (!object) {
      return c.text('Imagen no encontrada.', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });

  } catch (err: any) {
    return c.json({ error: 'Error al servir imagen: ' + err.message }, 500);
  }
});

export default app;

