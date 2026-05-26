# PRODE-U — Frontend PWA 💻📱

Este es el cliente web frontend de **PRODE-U**, la aplicación de predicciones deportivas mobile-first para el Mundial 2026. Está construida bajo una estética futurista, tecnológica y sumamente interactiva (inspirada en la interfaz alegre de *Gartic Phone* y tableros cyberpunk).

Se implementa como una **PWA (Progressive Web App)** con soporte sin conexión, interfaz 100% responsiva para celulares y animaciones fluidas que potencian la experiencia del usuario.

---

## 🚀 Tecnologías Clave

*   **React 19 & TypeScript:** Estructura de componentes segura, veloz y tipada.
*   **Vite:** Herramienta de compilación ultrarrápida y servidor de desarrollo instantáneo.
*   **Zustand:** Manejo de estado global ligero y reactivo (autenticación y controles de interfaz de usuario).
*   **TanStack Query v5:** Sincronización de datos del servidor, reintentos inteligentes y almacenamiento en caché persistente.
*   **Vite PWA Plugin:** Configura de manera automatizada el Service Worker para almacenamiento en caché de activos estáticos y soporte Offline.
*   **Lucide React:** Set premium de íconos vectoriales modernos y estilizados.
*   **Vanilla CSS:** Diseño completamente a medida mediante variables de CSS personalizadas (`index.css`), sin frameworks pesados, garantizando un rendimiento óptimo.

---

## 🗂️ Estructura de Directorios

```
/frontend/
├── public/                 # Iconos de PWA, manifiesto y recursos estáticos
├── src/
│   ├── assets/             # Logos y recursos gráficos locales
│   ├── components/         # Componentes compartidos y reutilizables
│   │   ├── Navbar.tsx            # Barra de navegación inferior móvil
│   │   ├── PWAInstallBanner.tsx  # Banner interactivo de instalación de PWA
│   │   ├── PredictModal.tsx      # Modal animado para registrar/editar predicciones
│   │   ├── RulesModal.tsx        # Modal con el reglamento y lógica de puntuación
│   │   └── TeamFlag.tsx          # Componente dinámico para banderas de selecciones
│   ├── pages/              # Vistas principales de la aplicación
│   │   ├── Splash.tsx            # Pantalla de carga animada (glow logo)
│   │   ├── Auth.tsx              # Autenticación (Login y Registro)
│   │   ├── Dashboard.tsx         # Pantalla principal (próximo partido, resumen de grupos)
│   │   ├── PredictionsHub.tsx    # Hub de predicciones por fases y estados
│   │   ├── GroupsHub.tsx         # Gestión de ligas de amigos (crear, unirse, lista)
│   │   ├── GroupDetail.tsx       # Detalle de liga (Leaderboard, partidos, configuración)
│   │   ├── Profile.tsx           # Estadísticas personales y edición de perfil
│   │   └── AdminDashboard.tsx    # Panel analítico y de control exclusivo para administradores
│   ├── services/           # Clientes HTTP y hooks de integración
│   │   ├── api.ts                # Configuración de Axios/Fetch y adjuntado de JWT
│   │   └── usePWAInstall.ts      # Hook personalizado para controlar la instalación de la PWA
│   ├── store/              # Stores globales de Zustand
│   │   ├── authStore.ts          # Estado del usuario, tokens y sesiones
│   │   └── uiStore.ts            # Estado de modales, pestañas activas y notificaciones (Toast)
│   ├── App.tsx             # Componente raíz con el ruteo basado en pestañas y QueryClient
│   ├── index.css           # Sistema de diseño centralizado (variables, glow effects, resets)
│   └── main.tsx            # Punto de entrada de renderizado de React
├── .env                    # Configuración de entorno para desarrollo local
├── .env.production         # Configuración de entorno para producción en la nube
├── vite.config.ts          # Configuración de empaquetado de Vite y PWA
└── package.json            # Scripts de ejecución y dependencias
```

---

## ⚙️ Configuración del Entorno (`.env`)

La aplicación requiere apuntar a las URLs de los microservicios desplegados en Cloudflare. Crea archivos `.env` (desarrollo local) y `.env.production` (producción) con las siguientes variables:

```env
VITE_API_BASE=http://localhost:8787
VITE_DATA_BASE=http://localhost:8788
VITE_ADMIN_NICKNAMES=fernando,admin,testadmin
```

*   `VITE_API_BASE`: Endpoint de la API principal (`api-worker`).
*   `VITE_DATA_BASE`: Endpoint del distribuidor de fixtures y posiciones (`data-worker`).
*   `VITE_ADMIN_NICKNAMES`: Lista de nicknames separados por coma que tienen permitido acceder a la pestaña de **Administración**.

---

## 🛠️ Comandos de Desarrollo y Compilación

Instala primero todas las dependencias en la carpeta del frontend:
```bash
npm install
```

### Iniciar Servidor de Desarrollo
Levanta el servidor local de Vite en el puerto `5173`:
```bash
npm run dev
```

### Compilar para Producción
Compila y optimiza el bundle estático (genera la carpeta `dist/` con el Service Worker registrado):
```bash
npm run build
```

### Previsualizar Compilación
Prueba la build de producción de manera local:
```bash
npm run preview
```

### Ejecutar Linter
Valida la consistencia de estilos de código de TypeScript y React:
```bash
npm run lint
```
