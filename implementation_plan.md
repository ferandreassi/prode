# PRODE-U — Plan de Implementación

## Visión General

**PRODE-U** — Una PWA mobile-first con estética **futurista y tecnológica** que permite a usuarios crear grupos de amigos, hacer predicciones de partidos del Mundial 2026 y competir en un leaderboard en tiempo real.

---

## 🏷️ Nombre de la App

**PRODE-U** ✅ — Combinación de "Prode" (jerga rioplatense para quiniela deportiva) + "U" (universo, unión, usuarios). Corto, memorables y con identidad propia.

---

## 🎨 Identidad Visual

### Paleta de Colores
- **Primario**: `#00E5FF` (Cyan eléctrico) — tecnológico, vibrante
- **Secundario**: `#7B2FFF` (Violeta neón) — premium, futurista
- **Fondo**: `#080B14` (Azul noche profundo) — dark mode base
- **Superficie**: `#0F1629` (Azul carbón) — cards y paneles
- **Acento**: `#FF3D71` (Rojo coral) — alertas, eliminación, peligro
- **Texto primario**: `#FFFFFF`
- **Texto secundario**: `#8899B4`

### Tipografía
- **Display / Headlines**: `Orbitron` (Google Fonts) — futurista, perfecta para marcadores
- **Body / UI**: `Inter` — legible, moderna, profesional

### Estética
- Dark mode obligatorio con glassmorphism en cards
- Gradientes de `#00E5FF` a `#7B2FFF`
- Micro-animaciones en predicciones y puntuaciones
- Líneas de grid/scan sutiles como fondo (estilo HUD futurista)
- Efectos de glow en elementos activos

---

## 🗂️ Arquitectura del Proyecto

```
/prode-u/
├── workers/
│   ├── sync-worker/          # Cron job - sincroniza API-Football → KV
│   ├── data-worker/          # Expone datos cacheados del KV
│   └── api-worker/           # API principal (auth, grupos, predicciones)
├── frontend/                 # React PWA (Vite) — app principal
└── admin/                    # React app separada — panel de administración
```

---

## 🗄️ Servicios Backend

### Worker 1: `sync-worker` (Cron cada 30 min)

**Responsabilidades:**
- Consume API-Football con token secret en env var `API_FOOTBALL_TOKEN`
- Sincroniza fixtures del Mundial 2026 (ID de torneo: 1)
- Guarda en KV: matches, resultados, equipos, logos
- Cuando un partido termina, **dispara el cálculo de puntos** en D1

**KV Keys:**
```
wc2026:fixtures              → Lista completa de partidos
wc2026:fixture:{id}          → Detalle de un partido
wc2026:teams                 → Lista de equipos con logos
wc2026:standings             → Tabla de posiciones por grupo
wc2026:last_sync             → Timestamp del último sync
```

---

### Worker 2: `data-worker` (API pública de datos)

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/fixtures` | Todos los partidos (con filtros: status, round, date) |
| `GET` | `/fixtures/:id` | Detalle de un partido |
| `GET` | `/teams` | Equipos del torneo |
| `GET` | `/standings` | Tabla de posiciones |

---

### Worker 3: `api-worker` (API principal con D1)

#### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registro con nickname + password |
| `POST` | `/auth/login` | Login, retorna JWT |
| `POST` | `/auth/refresh` | Refresh token |

#### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users/me` | Perfil del usuario actual |
| `PUT` | `/users/me` | Editar nickname, avatar |
| `GET` | `/users/me/groups` | Grupos a los que pertenece |
| `GET` | `/users/me/stats` | Estadísticas globales del usuario |

#### Grupos
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/groups` | Crear grupo (genera código 4L+4N) |
| `GET` | `/groups/:id` | Detalle del grupo |
| `PUT` | `/groups/:id` | Editar nombre/imagen (solo admin) |
| `DELETE` | `/groups/:id` | Eliminar grupo (solo admin) |
| `POST` | `/groups/join` | Unirse con código |
| `DELETE` | `/groups/:id/members/:userId` | Expulsar miembro (solo admin) |
| `GET` | `/groups/:id/members` | Lista de miembros |
| `GET` | `/groups/:id/leaderboard` | Tabla de posiciones del grupo |
| `GET` | `/groups/:id/predictions/:fixtureId` | Predicciones de todos los miembros para un partido |

#### Predicciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/predictions/me` | Todas mis predicciones |
| `POST` | `/predictions` | Crear/actualizar predicción (cierre: -1h del partido) |
| `GET` | `/predictions/fixture/:id` | Mi predicción para un partido |

#### Puntuaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/scores/me` | Mis puntos por partido |
| `GET` | `/scores/group/:id` | Puntos de todos en un grupo |

#### Admin Panel
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/admin/fixtures` | Ver todos los fixtures |
| `PUT` | `/admin/fixtures/:id` | Editar resultado manualmente |
| `POST` | `/admin/fixtures/:id/recalculate` | Recalcular puntos de un partido |

---

## 🗃️ Esquema de Base de Datos (D1 - SQLite)

```sql
-- Usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  nickname TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Grupos
CREATE TABLE groups (
  id TEXT PRIMARY KEY,                    -- UUID
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,              -- 4 letras + 4 números
  image_url TEXT,
  admin_user_id TEXT NOT NULL,
  max_members INTEGER DEFAULT 50,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

-- Miembros de grupos
CREATE TABLE group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Predicciones
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fixture_id INTEGER NOT NULL,           -- ID de API-Football
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, fixture_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Puntuaciones (calculadas al finalizar el partido)
CREATE TABLE scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fixture_id INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,     -- 0, 1, 3, 4, 7
  score_type TEXT,                       -- EXACT, WINNER_DIFF, WINNER, PARTIAL, MISS
  calculated_at INTEGER NOT NULL,
  UNIQUE (user_id, fixture_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📱 Pantallas de la App

### 1. **Splash Screen**
- Logo animado con efecto glow
- Tagline de la app
- Transición automática a Login/Register

### 2. **Auth Screen**
- Tabs: Login / Registro
- Login: Nickname + Password
- Registro: Nickname + Password + Confirmar password
- Avatar placeholder seleccionable al registrarse

### 3. **Home / Dashboard**
- Greeting con nombre del usuario
- **Próximo partido** con countdown animado
- Mis grupos (cards horizontales con scroll)
- Predicciones pendientes (badge con número)
- Resultado de últimos partidos que predije

### 4. **Mis Grupos**
- Lista de grupos con foto, nombre, posición en el ranking y miembros
- FAB para crear o unirse a grupo

### 5. **Crear Grupo**
- Nombre del grupo
- Upload de imagen del grupo
- Se genera el código automáticamente (copiable)

### 6. **Unirse a Grupo**
- Input con formato de código (4 letras + 4 números)
- Preview del grupo antes de confirmar

### 7. **Detalle de Grupo**
- Header con imagen, nombre y código
- Tabs:
  - **🏆 Leaderboard**: ranking animado de miembros con puntos
  - **⚽ Partidos**: todos los partidos con estado de predicción por miembro
  - **👥 Miembros**: lista de integrantes (con opción de expulsar si eres admin)
  - **⚙️ Config** (solo admin): editar nombre, imagen

### 8. **Hub de Predicciones**
- Partidos agrupados por ronda (Grupo A, B... Octavos, Cuartos, etc.)
- Filtros: Todos / Pendientes / Realizados
- Cada partido muestra:
  - Equipos con banderas
  - Fecha y hora (local)
  - Mi predicción (si existe) o botón "Predecir"
  - Tiempo restante para cerrar predicción
  - Estado: `OPEN` / `LOCKED` / `FINISHED`

### 9. **Hacer Predicción**
- Modal o pantalla dedicada
- Selección de goles con +/- buttons (estilo futurista)
- Preview del resultado predicho con los escudos
- Indicador de tiempo límite
- Botón confirmar con animación

### 10. **Detalle de Partido** (post-match)
- Resultado final destacado
- Mi predicción y puntos obtenidos con animación
- Predicciones de todos en mi grupo (tabla comparativa)

### 11. **Perfil de Usuario**
- Avatar editable
- Nickname
- Estadísticas: partidos predichos, puntos totales, aciertos exactos
- Lista de grupos

### 12. **Admin Panel** (acceso especial)
- Lista de fixtures del torneo
- Edición manual de resultados
- Botón para recalcular puntos de un partido

---

## 🔐 Seguridad

- **JWT tokens** (access: 1h, refresh: 7 días)
- Contraseñas hasheadas con **bcrypt** (implementado en el Worker con WebCrypto API)
- Rate limiting en endpoints de auth
- Validación de cierre de predicciones en el servidor (no solo en frontend)

---

## 🧮 Lógica de Puntuación

```typescript
function calculatePoints(
  prediction: { home: number; away: number },
  result: { home: number; away: number }
): { points: number; type: ScoreType } {
  // Exact score (7 pts)
  if (prediction.home === result.home && prediction.away === result.away)
    return { points: 7, type: 'EXACT' };

  const predDiff = prediction.home - prediction.away;
  const resDiff = result.home - result.away;
  const predOutcome = Math.sign(predDiff);
  const resOutcome = Math.sign(resDiff);

  // Winner + Goal Difference (4 pts)
  if (predOutcome === resOutcome && predDiff === resDiff)
    return { points: 4, type: 'WINNER_DIFF' };

  // Winner / Draw (3 pts)
  if (predOutcome === resOutcome)
    return { points: 3, type: 'WINNER' };

  // Partial: one team's goals correct (1 pt)
  if (prediction.home === result.home || prediction.away === result.away)
    return { points: 1, type: 'PARTIAL' };

  return { points: 0, type: 'MISS' };
}
```

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend (main) | React + Vite + TypeScript — PWA mobile-first |
| Frontend (admin) | React + Vite + TypeScript — app separada |
| Estilos | Vanilla CSS (CSS Variables + diseño propio) |
| PWA | Vite PWA Plugin + Service Worker |
| State | Zustand + TanStack Query |
| Routing | React Router v6 |
| Backend | Cloudflare Workers (Hono framework) |
| Base de datos | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 (avatares de usuarios e imágenes de grupos) |
| Fuente de datos | API-Football |
| Auth | JWT (Jose library para Workers) |
| Deploy | Cloudflare Pages + Workers (dominio interno `*.workers.dev` / `*.pages.dev`) |

---

## 📋 Fases de Implementación

### Fase 1 — Backend Core
- [ ] Setup del monorepo `/prode-u/` con Wrangler (3 workers + D1 + KV + R2)
- [ ] Schema de D1 + migraciones
- [ ] `sync-worker`: cron job de API-Football → KV
- [ ] `data-worker`: endpoints de fixtures/equipos
- [ ] `api-worker`: auth + usuarios
- [ ] R2 bucket para imágenes (upload endpoint con signed URLs)

### Fase 2 — Grupos y Predicciones
- [ ] CRUD de grupos con generación de código (4L+4N)
- [ ] Sistema de predicciones con validación de cierre (1h antes)
- [ ] Motor de puntuación y cálculo automático post-partido
- [ ] Leaderboard por grupo

### Fase 3 — Frontend Principal (PRODE-U)
- [ ] Setup Vite + React + PWA (`/frontend`)
- [ ] Design system PRODE-U (CSS variables, tokens, componentes base)
- [ ] Splash + Auth screens (Login / Registro)
- [ ] Home Dashboard + Mis Grupos

### Fase 4 — Features Principales
- [ ] Pantallas de grupos (crear, unirse, detalle, leaderboard)
- [ ] Hub de predicciones + formulario de predicción animado
- [ ] Detalle de partido post-match
- [ ] Perfil de usuario + edición de avatar (R2)

### Fase 5 — Admin App & Polish
- [ ] App de admin separada (`/admin`) con Vite + React
- [ ] Gestión de fixtures y resultados manuales
- [ ] Recálculo de puntos
- [ ] Micro-animaciones y polish
- [ ] PWA offline support
- [ ] i18n (ES / EN)

---

## ✅ Decisiones Confirmadas

| Decisión | Elección |
|----------|----------|
| Nombre | **PRODE-U** |
| Storage de imágenes | **Cloudflare R2** |
| Admin Panel | **App separada** (`/admin`) |
| Dominio | **Cloudflare interno** (`*.workers.dev` / `*.pages.dev`) |
