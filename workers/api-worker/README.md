# PRODE-U — API Worker 🛡️⚙️

Este servicio es el motor backend principal de **PRODE-U**. Está construido con el framework **Hono**, base de datos serverless **Cloudflare D1 (SQLite)**, sistema de autenticación **Jose JWT** y hasheo criptográfico nativo en el Edge con **WebCrypto**.

---

## 🧭 Endpoints Soportados

### Autenticación y Cuentas
- `POST /auth/register` — Registro con nickname y contraseña. Hashea con PBKDF2 y crea avatares de DiceBear.
- `POST /auth/login` — Verifica credenciales de usuario y retorna un JWT.
- `GET /users/me` — Recupera el perfil del usuario autenticado actual.
- `PUT /users/me` — Actualiza el perfil del usuario.
- `GET /users/me/groups` — Obtiene los grupos del usuario actual con recuento de integrantes.

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

### 1. Crear la Base de Datos Remota en D1
Si es la primera vez que despliegas en la nube, debes crear el D1 en Cloudflare:
```bash
npx wrangler d1 create prode_u_db
```
Copia el `database_id` que te proporcione la terminal e insértalo en tu `wrangler.toml` bajo el campo `database_id`.

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
