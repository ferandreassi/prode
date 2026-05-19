# PRODE-U — Predictions World Cup 2026 ⚽👾

¡Bienvenido a **PRODE-U**, la PWA mobile-first definitiva de predicciones deportivas para el Mundial de Fútbol 2026, inspirada en la colorida y divertida estética de **Gartic Phone**!

Este repositorio está estructurado como un monorepo modular potenciado por la infraestructura serverless de **Cloudflare**.

---

## 🗂️ Arquitectura del Proyecto

```
/prode-u/
├── workers/
│   ├── api-worker/           # API principal (Autenticación, Perfiles, Grupos, Predicciones en D1)
│   ├── data-worker/          # Caché y API pública de fixtures, equipos y posiciones en KV
│   └── sync-worker/          # Cron Job que sincroniza datos de API-Football → KV y califica en D1
├── prototype/                # Prototipo visual estático interactivo (HTML5 + Gartic CSS)
└── README.md                 # Guía general de arquitectura
```

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de comenzar:
- **Node.js** (v18 o superior recomendado)
- **npm** (v9 o superior)
- **Cloudflare Wrangler** (instalado automáticamente como dependencia de desarrollo)

---

## 🚀 Guía Rápida de Inicio

### 1. Clonar el repositorio e instalar dependencias
Entra en la carpeta de cada Worker e instala sus paquetes de Node:

```bash
# Instalar dependencias en el API Worker
cd workers/api-worker
npm install

# Instalar dependencias en el Data Worker
cd ../data-worker
npm install

# Instalar dependencias en el Sync Worker
cd ../sync-worker
npm install
```

### 2. Configurar la Base de Datos Local (D1 SQLite)
El `api-worker` requiere inicializar y estructurar la base de datos local SQLite para desarrollo. Ejecuta lo siguiente desde la carpeta de `api-worker`:

```bash
cd workers/api-worker
npx wrangler d1 execute prode_u_db --local --file=schema.sql
```

### 3. Ejecutar los Workers en Modo Desarrollo Local
Cada worker puede correr en su respectivo puerto local:

- **api-worker** (puerto `8787`):
  ```bash
  cd workers/api-worker
  npm run dev
  ```
- **data-worker** (puerto `8788`):
  ```bash
  cd workers/data-worker
  npm run dev
  ```
- **sync-worker** (puerto `8789` o default):
  ```bash
  cd workers/sync-worker
  npm run dev
  ```

---

## 🎨 Prototipo Visual
Para levantar y visualizar el diseño interactivo tipo Gartic Phone del prototipo:
```bash
npx http-server ./prototype -p 3000 -c-1
```
Y abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Despliegue en Cloudflare (Producción)

Para desplegar de manera global y productiva en la red Edge de Cloudflare, ejecuta el siguiente comando en la carpeta de cada uno de los workers correspondientes:

```bash
npm run deploy
```

*Nota: Asegúrate de estar logueado en tu cuenta de Cloudflare ejecutando previamente `npx wrangler login`.*
