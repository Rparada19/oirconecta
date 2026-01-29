/**
 * Utilidades para JWT
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Usuario
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Decodifica un token sin verificar (para debug)
 * @param {string} token - Token JWT
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
