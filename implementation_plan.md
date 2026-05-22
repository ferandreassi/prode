# Inicialización del Frontend de PRODE-U con el nuevo diseño Sleek Sport-Tech

El objetivo es inicializar la aplicación real del frontend en `/frontend` utilizando **React + Vite + TypeScript**, configurando el sistema de diseño visual **Sleek Sport-Tech** y portando todas las pantallas, modales y flujos simulados del prototipo a componentes React modernos, modulares e interactivos.

## User Review Required

> [!IMPORTANT]
> **Enfoque de Navegación Nativa Mobile-First**: 
> Para replicar el comportamiento de transición súper fluida y el rendimiento de una aplicación nativa PWA en móviles (como se ve en el prototipo con transiciones CSS rápidas), utilizaremos un estado global de navegación (`currentScreen`). Esto asegura transiciones de pantalla instantáneas y soporte de animaciones fluido, sin el overhead ni parpadeos de carga de rutas tradicionales de escritorio.

> [!TIP]
> **Dicebear Avatars e Iconos FontAwesome**:
> Utilizaremos el CDN de FontAwesome para cargar los íconos de forma limpia y mantendremos la integración con la API de Dicebear (`https://api.dicebear.com/7.x/bottts/svg`) para generar avatares robóticos interactivos instantáneamente en base al nickname del usuario, tal como en el prototipo.

## Open Questions

No hay preguntas abiertas pendientes por el momento. La estructura se basará estrictamente en el prototipo estático que ya aprobaste, portando la lógica y el diseño 1:1 en componentes React de TypeScript de alta fidelidad.

---

## Proposed Changes

### 1. Inicialización y Configuración Base

Crearemos el directorio `/frontend` e inicializaremos un proyecto moderno de React + Vite + TypeScript de manera no interactiva usando el template oficial `react-ts`.

#### [NEW] [package.json](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/package.json)
Configurará las dependencias principales del proyecto de React:
- React 18+
- TypeScript
- Vite para compilación ultra-rápida.

#### [NEW] [index.html](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/index.html)
Punto de entrada de la aplicación que cargará las Google Fonts oficiales (`Space Grotesk` y `Plus Jakarta Sans`) y los estilos de FontAwesome para el diseño deportivo tecnológico.

#### [NEW] [vite.config.ts](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/vite.config.ts)
Configuración de desarrollo y build de Vite, optimizada para puerto local.

---

### 2. Estilos Globales y Diseño Sleek Sport-Tech

#### [NEW] [index.css](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/src/index.css)
Heredará la paleta de colores Midnight-Neon de nuestro prototipo aprobado:
- **Primario**: `#00E5FF` (Cian eléctrico / Blue)
- **Secundario**: `#00FF87` (Verde tecnológico / Green)
- **Fondo**: `#0B0C10` a `#1A1D29` (Gradiente Midnight)
- **Cards**: Glassmorphism con bordes traslúcidos y micro-glows.
- **Botones**: Planos con acentos neón elegantes sin relieve 3D exagerado.

---

### 3. Estado Global de la Aplicación

#### [NEW] [store.ts](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/src/store.ts)
Un manejador de estado ligero (usando un custom hook o Context) para coordinar:
- Usuario actual (`currentUser` con su nickname y puntos).
- Pantalla activa (`currentScreen`).
- Listado de grupos (incluyendo el grupo creado o unido dinámicamente).
- Listado de predicciones y partidos con soporte para hacer predicciones en tiempo real.
- Tabla comparativa de resultados por partido (`MOCK_MATCH_LEADERBOARDS`).

---

### 4. Componentes y Pantallas React

Portaremos las 8 pantallas principales del prototipo a componentes modulares dentro de `/src/screens/` y `/src/components/`:

#### [NEW] [App.tsx](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/src/App.tsx)
Componente contenedor principal de la PWA que encapsula el marco del dispositivo móvil, las burbujas decorativas animadas de fondo, la barra de navegación inferior y el renderizado condicional de las pantallas activas con efectos de transición suaves.

#### [NEW] [Screens](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/src/screens)
- `SplashScreen.tsx`: Pantalla de bienvenida con logo animado y entrada táctil interactiva.
- `AuthScreen.tsx`: Login y registro con tabs modernas y selección dinámica de avatar.
- `DashboardScreen.tsx`: Vista principal con widgets informativos, cuenta regresiva del partido inaugural y scroll horizontal de grupos.
- `PredictionsScreen.tsx`: Hub completo de predicciones por fases del Mundial con filtros dinámicos (Todos / Pendientes / Realizados).
- `GroupsScreen.tsx`: Listado de grupos del usuario con botones flotantes para crear o unirse.
- `GroupDetailScreen.tsx`: Detalle de grupo con pestañas interactivas (🏆 Leaderboard, ⚽ Partidos, 👥 Miembros, ⚙️ Configuración del grupo).
- `ProfileScreen.tsx`: Estadísticas detalladas de puntos, partidos predichos y aciertos exactos, cambio de idioma y de avatar.
- `MatchLeaderboardScreen.tsx`: Tabla comparativa detallada de puntuaciones post-partido entre amigos de un grupo.

#### [NEW] [Modals & Utilities](file:///Users/fernandoandreassi/.gemini/antigravity/worktrees/Prode/redesign-ui-modern-style/frontend/src/components)
- `PredictModal.tsx`: Spinner interactivo futurista de +/- goles para realizar predicciones.
- `CreateGroupModal.tsx`: Formulario de creación de grupos con código auto-generado.
- `JoinGroupModal.tsx`: Formulario de unión a grupo con validación de código de 8 caracteres.
- `GroupSettingsModal.tsx`: Gestión administrativa del grupo (editar nombre, borrar grupo).
- `Header.tsx` y `BottomNav.tsx`: Barras de navegación superior e inferior de la PWA.

---

## Verification Plan

### Manual Verification
1. Inicializar la app usando `npm run dev` en un puerto local como `3000` o `3005`.
2. Validar en el navegador la perfecta coherencia visual:
   - Tipografías cargadas correctamente (`Space Grotesk` para títulos, `Plus Jakarta Sans` para textos).
   - Fondos degradados y círculos decorativos flotantes activos.
   - Glassmorphism de las tarjetas con transparencias de fondo fluidas.
   - Micro-animaciones al presionar botones (efecto de escala) y al interactuar.
3. Testear el flujo completo de la app:
   - Transición del Splash al Auth.
   - Login/Registro con actualización de avatar dinámico (Dicebear).
   - Crear un grupo nuevo y verificar que aparezca inmediatamente en el Dashboard y la pantalla de Grupos.
   - Unirse a un grupo con un código simulado y validar su adición.
   - Entrar al hub de predicciones, filtrar por estado y usar el modal de goles para editar o crear una predicción con los botones +/-.
   - Navegar al detalle de un partido finalizado para ver la tabla comparativa detallada.
   - Modificar avatar desde la pantalla de perfil y confirmar que se propague a todos los componentes de la interfaz.
