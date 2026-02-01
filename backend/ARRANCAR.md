# Cómo arrancar OirConecta Backend

El error "Can't reach database server at localhost:5432" indica que **PostgreSQL no está corriendo**.

## Paso 1: Iniciar PostgreSQL

### Si usas Homebrew (Mac):
```bash
brew services start postgresql@15
```
O si instalaste "postgresql" sin versión:
```bash
brew services start postgresql
```

### Si usas Postgres.app (Mac):
Abre Postgres.app y haz clic en "Start" en el servidor.

### Si usas pg_ctl manualmente:
```bash
pg_ctl -D /usr/local/var/postgres start
```

---

## Paso 2: Crear la base de datos (solo la primera vez)

```bash
cd backend
psql -U postgres -c "CREATE DATABASE oirconecta_db;"
```

Si te pide contraseña, usa la de tu usuario `postgres`. Si no tienes usuario postgres, prueba:
```bash
createdb oirconecta_db
```

---

## Paso 3: Configurar .env

Verifica que `backend/.env` tenga (ajusta usuario/contraseña según tu PostgreSQL):

```
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/oirconecta_db"
JWT_SECRET=algun_secreto_seguro
PORT=3001
```

---

## Paso 4: Aplicar el esquema y crear el admin

```bash
cd backend
npx prisma db push
npm run db:seed
```

---

## Paso 5: Iniciar el backend

```bash
npm run dev
```

Deberías ver:
```
✅ Conectado a la base de datos PostgreSQL
🚀 Servidor corriendo en http://localhost:3001
```

---

## Paso 6: Iniciar el frontend (otra terminal)

```bash
cd oirconecta
npm run dev
```

Luego abre http://localhost:5174 y entra al CRM con:
- Email: admin@oirconecta.com
- Contraseña: Admin123!
