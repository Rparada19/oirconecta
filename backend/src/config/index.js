/**
 * OirConecta Backend - Configuración centralizada
 */

const config = {
  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,

  // Base de datos
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Frontend URL (para CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',

  // Admin inicial
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@oirconecta.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
};

// Validar configuración requerida en producción
if (config.nodeEnv === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }
}

module.exports = config;
