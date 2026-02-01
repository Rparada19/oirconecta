/**
 * OirConecta Backend - Configuración de Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ===========================================
// MIDDLEWARE DE SEGURIDAD
// ===========================================

// Helmet para cabeceras de seguridad
app.use(helmet());

// CORS (en dev aceptar localhost y 127.0.0.1)
const corsOrigins = config.nodeEnv === 'development'
  ? ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173']
  : config.frontendUrl;
app.use(cors({
  origin: Array.isArray(corsOrigins) ? corsOrigins : [corsOrigins],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: desactivado en desarrollo (evita "Demasiadas solicitudes" con polling)
if (config.nodeEnv !== 'development') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  });
  app.use('/api/', limiter);
} else {
  console.log('[OirConecta] Rate limiting desactivado (entorno development)');
}

// ===========================================
// MIDDLEWARE GENERAL
// ===========================================

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// RUTAS
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OirConecta API está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api', routes);

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// ===========================================
// MANEJO DE ERRORES
// ===========================================

app.use(errorHandler);

module.exports = app;
