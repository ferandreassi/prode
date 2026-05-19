# PRODE-U — Sync Worker 🔄⏱️

Este microservicio gestiona la sincronización de información con **API-Football** y ejecuta de forma autónoma el cálculo de puntos y la calificación de las predicciones de los usuarios almacenadas en **Cloudflare D1**.

---

## ⚙️ Funcionamiento Core

### 1. Trigger Cron Job
El worker cuenta con un disparador calendarizado en su `wrangler.toml` configurado para correr **cada 30 minutos**:
- Consume `https://v3.football.api-sports.io` para descargar los últimos partidos y marcadores.
- Mapea y guarda la estructura en caché global dentro de **Cloudflare KV**.

### 2. Motor de Calificación Automática (D1 Engine)
Al finalizar la sincronización, el worker filtra todos los partidos marcados como terminados (`FT`, `AET`, `PEN`). Para cada partido finalizado:
- Escanea todas las predicciones de los usuarios asociadas a dicho partido en **D1**.
- Calcula los puntos aplicando las reglas y los guarda en la tabla `scores`:
  - **7 puntos**: Marcador exacto (`EXACT`).
  - **4 puntos**: Ganador + diferencia de goles idéntica (`WINNER_DIFF`).
  - **3 puntos**: Ganador o empate simple acertado (`WINNER`).
  - **1 punto**: Acierto parcial de los goles de un solo equipo (`PARTIAL`).
  - **0 puntos**: Sin aciertos (`MISS`).

---

## 🛠️ Instrucciones de Inicialización y Desarrollo

### 1. Instalar dependencias
```bash
npm install
```

### 2. Disparar Sincronización Manualmente en Local
Inicia el simulador de Wrangler:
```bash
npm run dev
```
Luego envía un método `GET` a la siguiente ruta para ejecutar la sincronización y la calificación local de pruebas:
```url
http://localhost:8789/sync
```

---

## 📦 Despliegue en Producción

### 1. Configurar Secretos en la Nube
Debes agregar tu clave secreta de suscripción a `API-Football` para permitir la comunicación real del Cron Job en producción:
```bash
npx wrangler secret put API_FOOTBALL_TOKEN
```

### 2. Desplegar el Worker
Despliega el worker con su cron configurado para ejecutarse en el Edge:
```bash
npm run deploy
```
