import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from './auth';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
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

export default app;

