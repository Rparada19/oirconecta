# OirConecta Backend

Backend API para el CRM de OirConecta, construido con Node.js, Express y PostgreSQL.

## Requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm o yarn

## Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
NODE_ENV=development
PORT=3001

# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/oirconecta_db"

# JWT (genera uno seguro para producción)
JWT_SECRET=tu_secreto_jwt_seguro_aqui
JWT_EXPIRES_IN=7d

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5174

# Admin inicial
ADMIN_EMAIL=admin@oirconecta.com
ADMIN_PASSWORD=Admin123!
```

### 3. Crear la base de datos

Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE oirconecta_db;
```

O usando psql:

```bash
psql -U postgres -c "CREATE DATABASE oirconecta_db;"
```

### 4. Ejecutar migraciones

```bash
# Crear las tablas en la base de datos
npm run db:push

# O usar migraciones (recomendado para producción)
npm run db:migrate
```

### 5. Crear usuario administrador

```bash
npm run db:seed
```

Esto creará:
- Usuario admin con las credenciales del `.env`
- Campañas de marketing de ejemplo

### 6. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3001`

## Endpoints principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (solo admin)
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña

### Leads
- `GET /api/leads` - Listar leads
- `GET /api/leads/stats` - Estadísticas (funnel)
- `POST /api/leads` - Crear lead
- `PUT /api/leads/:id` - Actualizar lead
- `POST /api/leads/:id/convert-to-patient` - Convertir a paciente
- `GET /api/leads/check-duplicate` - Verificar duplicados

### Pacientes
- `GET /api/patients` - Listar pacientes
- `GET /api/patients/:id/profile` - Perfil completo
- `POST /api/patients` - Crear paciente

### Citas
- `GET /api/appointments` - Listar citas
- `GET /api/appointments/available-slots?fecha=YYYY-MM-DD` - Horarios disponibles
- `POST /api/appointments` - Crear cita
- `PATCH /api/appointments/:id/status` - Cambiar estado

### Campañas
- `GET /api/campaigns` - Listar campañas
- `GET /api/campaigns/active` - Campañas activas (para selects)
- `POST /api/campaigns` - Crear campaña

### Productos (Cotizaciones y Ventas)
- `GET /api/products/quotes` - Listar cotizaciones
- `POST /api/products/quotes` - Crear cotización
- `POST /api/products/quotes/:id/convert` - Convertir a venta
- `GET /api/products/sales` - Listar ventas
- `GET /api/products/sales/stats` - Estadísticas de ventas
- `POST /api/products/sales` - Crear venta

## Autenticación

Todas las rutas (excepto login y health) requieren un token JWT.

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@oirconecta.com", "password": "Admin123!"}'

# Usar el token
curl http://localhost:3001/api/leads \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Prisma Studio

Para ver y editar datos directamente:

```bash
npm run db:studio
```

Se abrirá en `http://localhost:5555`

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma    # Esquema de la BD
│   └── seed.js          # Datos iniciales
├── src/
│   ├── config/          # Configuración
│   ├── controllers/     # Controladores (HTTP)
│   ├── middleware/      # Auth, errors, validación
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades (jwt, password)
│   ├── app.js           # Config de Express
│   └── index.js         # Punto de entrada
├── .env.example
├── package.json
└── README.md
```

## Próximos pasos

1. **Conectar el frontend**: Modificar los servicios del frontend para usar esta API en lugar de localStorage
2. **Agregar más roles**: Vendedor, Audióloga, Recepción, etc.
3. **Implementar notificaciones**: Email para citas, etc.
4. **Desplegar**: Railway, Render, AWS, etc.
