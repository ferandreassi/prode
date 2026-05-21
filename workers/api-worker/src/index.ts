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


// Helper function to generate unique 8-character group code (4 letters + 4 digits)
function generateGroupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 4; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
}

// ------------------------------------
// GROUPS ROUTES
// ------------------------------------

// POST /groups (Create group)
app.post('/groups', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const { name, imageUrl } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json({ error: 'El nombre del grupo es obligatorio.' }, 400);
    }

    // Generate unique group invitation code
    let code = '';
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      code = generateGroupCode();
      const existing = await c.env.DB.prepare(
        'SELECT 1 FROM groups WHERE code = ?'
      ).bind(code).first();
      if (!existing) {
        codeExists = false;
      }
      attempts++;
    }

    if (codeExists) {
      return c.json({ error: 'No se pudo generar un código único para el grupo. Inténtalo de nuevo.' }, 500);
    }

    const groupId = crypto.randomUUID();
    const now = Date.now();
    const maxMembers = 50;

    // Create group in D1 database
    await c.env.DB.prepare(
      'INSERT INTO groups (id, name, code, image_url, admin_user_id, max_members, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(groupId, name.trim(), code, imageUrl || null, userPayload.userId, maxMembers, now).run();

    // Auto-join the creator as admin member
    await c.env.DB.prepare(
      'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).bind(groupId, userPayload.userId, now).run();

    return c.json({
      message: 'Grupo creado con éxito.',
      group: {
        id: groupId,
        name: name.trim(),
        code,
        imageUrl: imageUrl || null,
        adminUserId: userPayload.userId,
        maxMembers,
        membersCount: 1
      }
    }, 201);

  } catch (err: any) {
    return c.json({ error: 'Error al crear grupo: ' + err.message }, 500);
  }
});

// POST /groups/join (Join group by code)
app.post('/groups/join', authRequired, async (c) => {
  try {
    const userPayload = c.get('user');
    const { code } = await c.req.json();

    if (!code || code.trim().length !== 8) {
      return c.json({ error: 'El código de invitación debe tener exactamente 8 caracteres.' }, 400);
    }

    const cleanCode = code.trim().toUpperCase();

    // Find group
    const group: any = await c.env.DB.prepare(
      'SELECT id, name, max_members FROM groups WHERE code = ?'
    ).bind(cleanCode).first();

    if (!group) {
      return c.json({ error: 'Grupo no encontrado. Verifica el código de invitación.' }, 404);
    }

    // Check membership
    const membership = await c.env.DB.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(group.id, userPayload.userId).first();

    if (membership) {
      return c.json({ error: 'Ya perteneces a este grupo.' }, 400);
    }

    // Check capacity
    const countRes: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?'
    ).bind(group.id).first();

    if (countRes && countRes.count >= group.max_members) {
      return c.json({ error: 'El grupo ha alcanzado el límite máximo de miembros.' }, 400);
    }

    const now = Date.now();
    await c.env.DB.prepare(
      'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).bind(group.id, userPayload.userId, now).run();

    return c.json({
      message: 'Te has unido al grupo con éxito.',
      group: {
        id: group.id,
        name: group.name
      }
    }, 200);

  } catch (err: any) {
    return c.json({ error: 'Error al unirse al grupo: ' + err.message }, 500);
  }
});

// GET /groups/:id (Get group core details)
app.get('/groups/:id', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const userPayload = c.get('user');

    // Find group
    const group: any = await c.env.DB.prepare(`
      SELECT g.id, g.name, g.code, g.image_url as imageUrl, g.admin_user_id as adminUserId, g.max_members as maxMembers,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as membersCount
      FROM groups g
      WHERE g.id = ?
    `).bind(groupId).first();

    if (!group) {
      return c.json({ error: 'Grupo no encontrado.' }, 404);
    }

    // Check if requester is a member of this group
    const membership = await c.env.DB.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, userPayload.userId).first();

    if (!membership) {
      return c.json({ error: 'No tienes acceso a este grupo. Debes unirte primero.' }, 403);
    }

    return c.json({ group });

  } catch (err: any) {
    return c.json({ error: 'Error al obtener detalles del grupo: ' + err.message }, 500);
  }
});

// GET /groups/:id/members (Get members list and overall leaderboard standings)
app.get('/groups/:id/members', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const userPayload = c.get('user');

    // Verify membership of requester
    const membership = await c.env.DB.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, userPayload.userId).first();

    if (!membership) {
      return c.json({ error: 'No tienes acceso a esta liga.' }, 403);
    }

    // Fetch members with total points sum
    const { results } = await c.env.DB.prepare(`
      SELECT 
        u.id as userId,
        u.nickname,
        u.avatar_url as avatarUrl,
        gm.joined_at as joinedAt,
        COALESCE(SUM(s.points), 0) as totalPoints
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN scores s ON s.user_id = u.id
      WHERE gm.group_id = ?
      GROUP BY u.id
      ORDER BY totalPoints DESC, gm.joined_at ASC
    `).bind(groupId).all();

    return c.json({ members: results });

  } catch (err: any) {
    return c.json({ error: 'Error al obtener clasificación del grupo: ' + err.message }, 500);
  }
});

// PUT /groups/:id (Modify group settings - Admin only)
app.put('/groups/:id', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const userPayload = c.get('user');
    const { name, imageUrl } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json({ error: 'El nombre del grupo es obligatorio.' }, 400);
    }

    // Verify admin
    const group: any = await c.env.DB.prepare(
      'SELECT admin_user_id FROM groups WHERE id = ?'
    ).bind(groupId).first();

    if (!group) {
      return c.json({ error: 'Grupo no encontrado.' }, 404);
    }

    if (group.admin_user_id !== userPayload.userId) {
      return c.json({ error: 'No tienes permisos de administrador para modificar este grupo.' }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE groups SET name = ?, image_url = ? WHERE id = ?'
    ).bind(name.trim(), imageUrl || null, groupId).run();

    return c.json({ message: 'Configuración del grupo actualizada con éxito.' });

  } catch (err: any) {
    return c.json({ error: 'Error al actualizar grupo: ' + err.message }, 500);
  }
});

// DELETE /groups/:id (Delete group - Admin only)
app.delete('/groups/:id', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const userPayload = c.get('user');

    // Verify admin
    const group: any = await c.env.DB.prepare(
      'SELECT admin_user_id FROM groups WHERE id = ?'
    ).bind(groupId).first();

    if (!group) {
      return c.json({ error: 'Grupo no encontrado.' }, 404);
    }

    if (group.admin_user_id !== userPayload.userId) {
      return c.json({ error: 'No tienes permisos de administrador para eliminar este grupo.' }, 403);
    }

    // Cascade delete is configured on database schema for group_members
    await c.env.DB.prepare(
      'DELETE FROM groups WHERE id = ?'
    ).bind(groupId).run();

    return c.json({ message: 'Grupo eliminado permanentemente con éxito.' });

  } catch (err: any) {
    return c.json({ error: 'Error al eliminar grupo: ' + err.message }, 500);
  }
});

// DELETE /groups/:id/members/:userId (Kick member - Admin only)
app.delete('/groups/:id/members/:userId', authRequired, async (c) => {
  try {
    const groupId = c.req.param('id');
    const memberUserId = c.req.param('userId');
    const userPayload = c.get('user');

    // Verify admin
    const group: any = await c.env.DB.prepare(
      'SELECT admin_user_id FROM groups WHERE id = ?'
    ).bind(groupId).first();

    if (!group) {
      return c.json({ error: 'Grupo no encontrado.' }, 404);
    }

    if (group.admin_user_id !== userPayload.userId) {
      return c.json({ error: 'No tienes permisos de administrador para expulsar miembros de este grupo.' }, 403);
    }

    if (group.admin_user_id === memberUserId) {
      return c.json({ error: 'El administrador y creador no puede expulsarse a sí mismo. Considera eliminar el grupo.' }, 400);
    }

    const res = await c.env.DB.prepare(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, memberUserId).run();

    return c.json({ message: 'Miembro expulsado del grupo con éxito.' });

  } catch (err: any) {
    return c.json({ error: 'Error al expulsar miembro del grupo: ' + err.message }, 500);
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

