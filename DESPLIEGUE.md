# Guía de despliegue — OírConecta

Esta guía te lleva paso a paso desde tu código local hasta tener
**oirconecta.com** funcionando en producción.

## Arquitectura del despliegue

```
┌──────────────────────────┐      ┌────────────────────────┐      ┌─────────────────────┐
│  Usuario (navegador)     │ ───► │  oirconecta.com        │ ───► │  API en Render      │
│                          │      │  (DreamHost Shared)    │      │  (Node + Express)   │
│                          │      │  Archivos estáticos:   │      │                     │
│                          │      │  index.html, JS, CSS   │      │                     │
└──────────────────────────┘      └────────────────────────┘      └──────────┬──────────┘
                                                                              │
                                                                              ▼
                                                                  ┌─────────────────────┐
                                                                  │  PostgreSQL en Neon │
                                                                  └─────────────────────┘
```

- **Frontend (React)** → DreamHost Shared, en la carpeta del dominio.
- **Backend (Node/Express)** → Render.com (plan gratuito).
- **Base de datos (PostgreSQL)** → Neon.tech (plan gratuito).

---

## PASO 1 · Crear base de datos en Neon

1. Entra a https://neon.tech y crea cuenta (con GitHub es el más rápido).
2. Crea un proyecto:
   - **Project name**: `oirconecta`
   - **Region**: la más cercana a tus usuarios (ej. *AWS US East* o *Europe*).
   - **Postgres version**: la que viene por defecto.
3. Cuando termine, Neon te muestra una **Connection string**. Cópiala completa, se ve así:
   ```
   postgresql://usuario:password@ep-xxxxx.neon.tech/neondb?sslmode=require
   ```
4. **Guárdala** en un lugar seguro (Notas, gestor de contraseñas). La vas a necesitar en el Paso 2.

> Neon "duerme" la BD tras 5 min de inactividad en el plan gratis. La primera petición tras dormir tarda ~3 segundos. Para producción real conviene plan pago, pero para empezar va bien.

---

## PASO 2 · Desplegar backend en Render

1. Entra a https://render.com y crea cuenta con GitHub.
2. Da permiso a Render para ver tu repo `OirConecta` (o como se llame).
3. En el dashboard de Render: **New → Web Service**.
4. Selecciona tu repo.
5. Configura el servicio:
   - **Name**: `oirconecta-api`
   - **Region**: la misma de Neon (importante para latencia).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. **Environment Variables** (botón "Advanced"), añade una por una:

   | Variable           | Valor                                                         |
   |--------------------|---------------------------------------------------------------|
   | `NODE_ENV`         | `production`                                                  |
   | `DATABASE_URL`     | *(la connection string de Neon del Paso 1)*                   |
   | `JWT_SECRET`       | *(genera uno largo y aleatorio, ver abajo)*                   |
   | `FRONTEND_URL`     | `https://oirconecta.com,https://www.oirconecta.com`           |
   | `ADMIN_EMAIL`      | tu email de admin                                             |
   | `ADMIN_PASSWORD`   | una contraseña fuerte (cámbiala tras el primer login)         |

   **Para generar el JWT_SECRET**, en tu terminal local corre:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copia el resultado (128 caracteres).

7. Haz clic en **Create Web Service**. Render compila y arranca el servidor. Tarda ~3-5 min la primera vez.
8. Cuando termine, Render te da una URL pública:
   ```
   https://oirconecta-api.onrender.com
   ```
   **Anótala**. La necesitas en el Paso 3.
9. Verifica que funciona abriendo en el navegador:
   ```
   https://oirconecta-api.onrender.com/health
   ```
   Debe responder un JSON con `"success": true`.

10. **Poblar la base con datos iniciales** (admin user, etc.). En Render, ve a tu servicio → pestaña **Shell** → ejecuta:
    ```bash
    npm run db:seed
    ```

> El plan gratuito de Render duerme el servicio tras 15 min sin tráfico. La primera petición tras dormir tarda ~30 seg. Si esto es un problema, sube al plan de $7/mes o usa un servicio que mantenga el servidor "caliente" haciendo pings periódicos.

---

## PASO 3 · Configurar el frontend

1. En tu máquina local, en la raíz del proyecto, crea el archivo `oirconecta/.env.production`:
   ```bash
   cp oirconecta/.env.production.example oirconecta/.env.production
   ```
2. Edita `oirconecta/.env.production` y pon la URL de Render:
   ```
   VITE_API_URL=https://oirconecta-api.onrender.com
   ```
3. Compila el frontend:
   ```bash
   cd oirconecta
   npm install
   npm run build
   cd ..
   ```
4. Esto crea la carpeta `oirconecta/dist/` con todos los archivos listos para subir.

---

## PASO 4 · Configurar el dominio en DreamHost

1. Entra al panel de DreamHost: https://panel.dreamhost.com
2. Ve a **Websites → Manage Websites**.
3. Asegúrate de que `oirconecta.com` está apuntando a una carpeta. Normalmente:
   ```
   /home/TU_USUARIO/oirconecta.com/
   ```
4. Habilita HTTPS gratis: **Websites → Manage Websites → tu dominio → Manage → Security tab → Add free Let's Encrypt certificate**. Tarda unos minutos en activarse.
5. Habilita **SSH access** si no lo has hecho: **Manage Users → editar tu usuario → marcar "Shell user"**.

---

## PASO 5 · Subir archivos a DreamHost

Tienes dos opciones. **Opción A (SFTP)** es la más fácil si nunca has usado SSH.

### Opción A · SFTP con FileZilla (recomendada para empezar)

1. Descarga **FileZilla**: https://filezilla-project.org
2. Conéctate:
   - **Host**: `sftp://TU_DOMINIO.com` (lo encuentras en DreamHost panel)
   - **Usuario**: tu usuario SSH de DreamHost
   - **Contraseña**: la de tu usuario
   - **Puerto**: `22`
3. En el panel derecho navega a `/home/TU_USUARIO/oirconecta.com/`.
4. **Borra el contenido viejo** de esa carpeta (si hubiera).
5. En el panel izquierdo navega a `oirconecta/dist/` en tu máquina.
6. Selecciona **TODO** el contenido de `dist/` (incluido el archivo oculto `.htaccess`).
7. Arrastra al panel derecho para subirlo.

> En FileZilla: **Server → Force showing hidden files** para ver `.htaccess`.

### Opción B · SSH + rsync (más rápida una vez configurada)

```bash
# Reemplaza TU_USUARIO y la ruta por los tuyos
rsync -avz --delete oirconecta/dist/ TU_USUARIO@oirconecta.com:~/oirconecta.com/
```

---

## PASO 6 · Verificación final

1. Abre `https://oirconecta.com` en el navegador. Debe cargar el sitio.
2. Abre las **DevTools** (F12) → pestaña **Network**.
3. Navega por el sitio: las peticiones a la API deben ir a `oirconecta-api.onrender.com` y responder 200.
4. Prueba el **login del CRM** con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` que pusiste en Render.
5. Si todo funciona: **cambia la contraseña del admin** de inmediato.

---

## Cómo actualizar después de un cambio

### Cambios en el backend
```bash
git add . && git commit -m "tu mensaje" && git push
```
Render detecta el push y redespliega automáticamente (~2 min).

### Cambios en el frontend
```bash
cd oirconecta
npm run build
cd ..
# Luego subir oirconecta/dist/ por FileZilla o rsync
```

---

## Solución de problemas comunes

| Síntoma                                       | Causa probable                                              | Solución                                                                                       |
|-----------------------------------------------|-------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Página en blanco, consola dice "404 index.js" | Falta `.htaccess` o no se subió                             | Verifica que `.htaccess` está en la raíz del dominio. En FileZilla activa archivos ocultos.    |
| "CORS error" en consola                       | `FRONTEND_URL` en Render no incluye el dominio              | Edita la variable en Render: `https://oirconecta.com,https://www.oirconecta.com`. Redeploy.    |
| Login falla con "Network Error"               | `VITE_API_URL` mal configurada en el build                  | Revisa `oirconecta/.env.production`, recompila, vuelve a subir `dist/`.                        |
| "502 Bad Gateway" desde Render                | El servidor crasheó al arrancar                             | Revisa logs en Render → suele ser `DATABASE_URL` mal copiada.                                  |
| Las rutas internas (ej. `/crm/dashboard`) dan 404 al recargar | `.htaccess` no se aplica                    | Confirma que `.htaccess` está subido y que DreamHost tiene `mod_rewrite` activo (por defecto sí).|
| Backend tarda 30 seg en la primera petición   | Render Free duerme tras 15 min                              | Normal en plan gratis. Sube de plan o usa un cron para mantenerlo caliente.                    |
