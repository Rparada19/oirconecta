/**
 * Middleware de manejo de errores centralizado
 */

const config = require('../config');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Ya existe un registro con esos datos únicos',
      field: err.meta?.target?.[0] || 'campo',
    });
  }

  // Error de registro no encontrado (Prisma)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro no encontrado',
    });
  }

  // Error de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: err.array(),
    });
  }

  // Error personalizado con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Error de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON malformado en el cuerpo de la solicitud',
    });
  }

  // Error genérico
  const statusCode = err.status || 500;
  const message = config.nodeEnv === 'production' 
    ? 'Error interno del servidor' 
    : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
