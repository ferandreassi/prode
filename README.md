# PRODE-U — Predictions World Cup 2026 ⚽👾

¡Bienvenido a **PRODE-U**, la PWA mobile-first definitiva de predicciones deportivas para el Mundial de Fútbol 2026, inspirada en la colorida y divertida estética de **Gartic Phone** y tableros cyberpunk/HUD futuristas!

Este repositorio está estructurado como un monorepo modular potenciado por la infraestructura serverless y de alto rendimiento de **Cloudflare**.

---

## 🗂️ Arquitectura del Proyecto

```
/prode-u/
├── frontend/                 # Cliente PWA principal en React 19 + Vite + TypeScript + Zustand
├── workers/
│   ├── api-worker/           # API central Hono (Autenticación, Ligas, Predicciones en D1 y carga en R2)
│   ├── data-worker/          # API de alto rendimiento en Hono para fixtures, equipos y posiciones en KV
│   └── sync-worker/          # Cron Job recurrente que descarga de API-Football → KV y califica en D1
├── prototype/                # Prototipo interactivo estático original (HTML5 + Gartic CSS)
├── start_local.sh            # Script de automatización para levantar todo el entorno de desarrollo local
├── deploy_production.sh      # Script interactivo paso a paso para el despliegue a Cloudflare en producción
└── README.md                 # Guía general de arquitectura
```

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de comenzar:
*   **Node.js** (v18 o superior recomendado)
*   **npm** (v9 o superior)
*   **Cloudflare Wrangler** (instalado automáticamente como dependencia de desarrollo)

---

## ⚡ Automatización: Iniciar y Desplegar de Forma Premium

Hemos diseñado dos scripts automatizados (`.sh`) para simplificar tu flujo de trabajo diario en macOS:

### 1. Desarrollo Local Multitarea
Para levantar todo el ecosistema local (API, Caché de Datos y PWA de React) con un solo comando, simplemente ejecuta desde la raíz:
```bash
chmod +x start_local.sh
./start_local.sh
```
*Este script abrirá automáticamente 3 pestañas dedicadas en tu terminal de macOS, levantando cada servicio en su puerto correspondiente:*
*   **Cliente Frontend (Vite):** [http://localhost:5173](http://localhost:5173)
*   **API Principal (Worker + SQLite Local):** [http://localhost:8787](http://localhost:8787)
*   **Data Worker (KV Caché Local):** [http://localhost:8788](http://localhost:8788)

### 2. Despliegue Automatizado a Producción (Cloudflare Cloud)
Para publicar toda la infraestructura en la nube de Cloudflare, ejecuta:
```bash
chmod +x deploy_production.sh
./deploy_production.sh
```
*El script te guiará de manera interactiva paso a paso a través de:*
1.  Verificación e inicio de sesión con Wrangler CLI.
2.  Ejecución de migraciones y esquemas SQL en la base de datos remota D1.
3.  Configuración e inserción segura de secretos (`JWT_SECRET` y `API_FOOTBALL_TOKEN`).
4.  Despliegue simultáneo de los 3 Cloudflare Workers (`api`, `data` y `sync`).
5.  Compilación óptima de producción del bundle React PWA.
6.  Publicación directa a **Cloudflare Pages**.

---

## 🚀 Guía Manual de Configuración (Paso a Paso)

Si prefieres realizar las instalaciones y despliegues de forma manual paso a paso, sigue las instrucciones a continuación:

### 1. Instalar Dependencias en el Monorepo
Entra en la carpeta de cada servicio e instala sus paquetes de Node:

```bash
# Frontend
cd frontend && npm install && cd ..

# API Worker
cd workers/api-worker && npm install && cd ../..

# Data Worker
cd workers/data-worker && npm install && cd ../..

# Sync Worker
cd workers/sync-worker && npm install && cd ../..
```

### 2. Configurar la Base de Datos Local (D1 SQLite)
El `api-worker` requiere inicializar y estructurar la base de datos local SQLite para desarrollo. Ejecuta lo siguiente desde la carpeta del worker:
```bash
cd workers/api-worker
npx wrangler d1 execute prode_u_db --local --file=schema.sql
```

### 3. Configurar Almacenamientos y Recursos en Cloudflare (Producción)
Para desplegar de manera global y productiva en la red Edge de Cloudflare, primero debes configurar los recursos en tu cuenta de Cloudflare:

```bash
# Crear Base de Datos D1 (api-worker)
npx wrangler d1 create prode_u_db

# Crear KV Namespace para caché de fixtures (data-worker & sync-worker)
npx wrangler kv:namespace create DATA_KV

# Crear Bucket R2 para imágenes y avatares (api-worker)
npx wrangler r2 bucket create prode-u-images
```

*Nota: Recuerda actualizar los valores de `database_id` en `workers/api-worker/wrangler.toml`, `kv_namespaces` en `workers/data-worker/wrangler.toml` y `workers/sync-worker/wrangler.toml` con los IDs reales devueltos por la terminal de Wrangler.*

### 4. Configurar Variables de Entorno del Frontend
En la carpeta `/frontend`, asegúrate de configurar los archivos `.env` y `.env.production` con las URLs reales de tus microservicios y listados de administradores:
```env
VITE_API_BASE=https://api-worker.<tu-subdominio>.workers.dev
VITE_DATA_BASE=https://data-worker.<tu-subdominio>.workers.dev
VITE_ADMIN_NICKNAMES=fernando,admin
```

---

## 🎨 Prototipo Visual
Para levantar y visualizar el diseño interactivo estático tipo Gartic Phone del prototipo de forma aislada:
```bash
npx http-server ./prototype -p 3000 -c-1
```
Y abre [http://localhost:3000](http://localhost:3000) en tu navegador.
