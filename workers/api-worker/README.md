# PRODE-U — API Worker 🛡️⚙️

Este servicio es el motor backend principal de **PRODE-U**. Está construido con el framework de alto rendimiento **Hono**, base de datos serverless **Cloudflare D1 (SQLite)**, sistema de autenticación **Jose JWT** y hasheo criptográfico nativo en el Edge con **WebCrypto** de Cloudflare. Además, se integra con **Cloudflare R2** para la gestión y almacenamiento óptimo de imágenes de perfil y portadas de grupos.

---

## 🧭 Endpoints Soportados

Todos los endpoints (excepto el registro y el inicio de sesión) requieren que se adjunte el JWT del usuario en la cabecera `Authorization: Bearer <TOKEN>`.

### Autenticación y Cuentas
*   `POST /auth/register` — Registro de nuevo usuario (nickname + password). Genera automáticamente un avatar aleatorio usando la API de DiceBear y guarda su perfil.
*   `POST /auth/login` — Verifica las credenciales de usuario y retorna un JWT firmado.
*   `GET /users/me` — Recupera la información detallada del perfil del usuario autenticado.
*   `PUT /users/me` — Actualiza campos del perfil (nickname, url del avatar).
*   `PUT /users/me/password` — Permite al usuario cambiar de forma segura su contraseña actual.
*   `GET /users/me/groups` — Lista todas las ligas a las que el usuario actual se ha unido.

### Ligas / Grupos de Amigos
*   `POST /groups` — Crea una liga privada y genera un código de acceso alfanumérico único de 8 caracteres (ej. `ABCD1234`).
*   `POST /groups/join` — Permite al usuario unirse a una liga existente usando su código de acceso.
*   `GET /groups/:id` — Recupera el detalle estructural de una liga en particular.
*   `GET /groups/:id/members` — Devuelve la lista completa de miembros que participan en la liga.
*   `PUT /groups/:id` — Actualiza información de la liga (ej. nombre o logo). *Requiere ser el administrador de la liga.*
*   `DELETE /groups/:id` — Elimina por completo la liga. *Requiere ser el administrador de la liga.*
*   `DELETE /groups/:id/members/:userId` — Expulsa a un miembro específico de la liga. *Requiere ser el administrador de la liga.*
*   `GET /groups/:id/fixtures/:fixtureId/leaderboard` — Obtiene las predicciones y el ranking de todos los miembros en base a un partido específico.

### Predicciones
*   `GET /predictions/me` — Retorna la lista con todas las predicciones realizadas por el usuario.
*   `POST /predictions` — Registra o actualiza una predicción para un partido. El servidor bloquea automáticamente cualquier cambio si falta menos de 1 hora para el pitazo inicial.
*   `GET /predictions/fixture/:id` — Obtiene la predicción del usuario para un partido específico.

### Almacenamiento de Imágenes (R2 Bucket)
*   `POST /upload` — Permite subir un archivo de imagen en formato binario. Retorna la URL pública de almacenamiento en R2.
*   `GET /images/*` — Expone y sirve las imágenes guardadas en el R2 Bucket de manera optimizada y global.

### Administración Global (Analytics)
Estos endpoints verifican mediante variables de entorno si el nickname del usuario solicitante forma parte del listado de administradores globales (`VITE_ADMIN_NICKNAMES`).
*   `GET /admin/analytics/overview` — Resumen global de métricas clave (total usuarios, ligas, predicciones, y porcentaje de aciertos).
*   `GET /admin/analytics/growth` — Histórico estructurado por fechas para graficar el crecimiento de registros y grupos.
*   `GET /admin/analytics/users` — Listado completo y detallado de los usuarios para auditoría.
*   `GET /admin/analytics/groups` — Catálogo de grupos creados, administradores y número de integrantes.
*   `GET /admin/analytics/fixtures` — Información y estado de los partidos del Mundial con fines analíticos.

---

## 🛠️ Instrucciones de Inicialización y Desarrollo

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Base de Datos SQLite Local
Asegúrate de inicializar y correr las tablas de la base de datos D1 localmente:
```bash
npx wrangler d1 execute prode_u_db --local --file=schema.sql
```

### 3. Levantar Servidor de Desarrollo Local
Inicia el entorno de pruebas local en el puerto `8787` (puedes enviar peticiones mediante REST clientes como Postman o cURL):
```bash
npm run dev
```

---

## 📦 Despliegue en Producción

### 1. Crear la Base de Datos Remota en D1 y el Bucket R2
Si es la primera vez que despliegas en la nube, debes crear la base de datos D1 y el bucket de R2 en Cloudflare:

```bash
# Crear la base de datos D1
npx wrangler d1 create prode_u_db

# Crear el bucket R2 para imágenes
npx wrangler r2 bucket create prode-u-images
```
Copia el `database_id` obtenido y pégalo en tu `wrangler.toml` reemplazando la línea `database_id = "..."`.

### 2. Ejecutar Migraciones en Producción
```bash
npx wrangler d1 execute prode_u_db --remote --file=schema.sql
```

### 3. Desplegar el Worker
```bash
npm run deploy
```
*Nota: Agrega tu secreto `JWT_SECRET` en producción ejecutando:*
```bash
npx wrangler secret put JWT_SECRET
```
