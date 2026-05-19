# PRODE-U — Data Worker 🌐⚡

Este servicio actúa como un proxy ultrarrápido y distribuidor de caché para todos los recursos globales y públicos del Mundial 2026 (partidos, escudos, posiciones). Está construido con **Hono** y consume datos almacenados en **Cloudflare KV**.

---

## 🧭 Endpoints Soportados

- `GET /fixtures` — Lista completa de partidos. Soporta filtros opcionales query parameters: `round` y `status`.
- `GET /fixtures/:id` — Detalle del partido seleccionado.
- `GET /teams` — Catálogo de los equipos participantes con banderas y códigos de 3 letras.
- `GET /standings` — Tabla de posiciones del torneo organizada por grupos.

*Nota: Cuenta con un sistema interno de **datos de desarrollo** (mock data) que entra en acción si el KV local está vacío. Esto permite al frontend funcionar y renderizar componentes interactivos inmediatamente sin sincronizar con API-Football.*

---

## 🛠️ Instrucciones de Inicialización y Desarrollo

### 1. Instalar dependencias
```bash
npm install
```

### 2. Levantar Servidor de Desarrollo Local
Inicia el servidor local de desarrollo en el puerto `8788`:
```bash
npm run dev
```

---

## 📦 Despliegue en Producción

### 1. Crear el KV Namespace en Cloudflare
Si aún no posees un KV Namespace creado en la nube:
```bash
npx wrangler kv:namespace create DATA_KV
```
Copia el `id` resultante y pégalo en tu `wrangler.toml` reemplazando el valor correspondiente.

### 2. Desplegar el Worker
```bash
npm run deploy
```
