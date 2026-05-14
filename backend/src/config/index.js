/**
 * OirConecta Backend - Configuración centralizada
 */

/** Orígenes CORS en desarrollo (localhost + 127.0.0.1). `CORS_DEV_PORTS`: lista de puertos separados por coma. */
function developmentCorsOriginUrls() {
  const defaults = '5173,5174,5175,5176,5177,5178,5180,5181,5182,5200';
  const ports = (process.env.CORS_DEV_PORTS || defaults)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = [];
  for (const port of ports) {
    if (!/^\d+$/.test(port)) continue;
    origins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
  }
  const extras = (process.env.CORS_DEV_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...origins, ...extras])];
}

const config = {
  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,

  // Base de datos
  databaseUrl: process.env.DATABASE_URL,

  // JWT (portal CRM)
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // JWT del directorio público (cuentas `DirectoryAccount`; no mezclar con tokens de User)
  directoryJwt: {
    secret:
      process.env.DIRECTORY_JWT_SECRET ||
      `${process.env.JWT_SECRET || 'default_secret_change_in_production'}_oirconecta_directory_v1`,
    expiresIn: process.env.DIRECTORY_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '30d',
  },

  // Orígenes del front para CORS (producción: varios separados por coma, ej. https://app.com,https://www.app.com)
  frontendOrigins: (process.env.FRONTEND_URL || 'http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Admin inicial
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@oirconecta.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },

  developmentCorsOriginUrls,
};

// Validar configuración requerida en producción
if (config.nodeEnv === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }

  if (!config.jwt.secret || config.jwt.secret === 'default_secret_change_in_production') {
    throw new Error('JWT_SECRET debe ser un secreto único y seguro en producción (no el valor por defecto)');
  }
}

module.exports = config;
