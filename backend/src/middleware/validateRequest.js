/**
 * Middleware de validación de requests
 */

const { validationResult } = require('express-validator');

/**
 * Middleware que verifica los resultados de express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

module.exports = validateRequest;
