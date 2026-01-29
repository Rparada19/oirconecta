/**
 * Rutas de autenticación
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// POST /api/auth/login - Iniciar sesión
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validateRequest,
  authController.login
);

// POST /api/auth/register - Registrar usuario (solo admin)
router.post(
  '/register',
  authenticate,
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('role').optional().isIn(['ADMIN', 'VENDEDOR', 'AUDIOLOGA', 'RECEPCION', 'SOLO_LECTURA']),
  ],
  validateRequest,
  authController.register
);

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authenticate, authController.me);

// POST /api/auth/change-password - Cambiar contraseña
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  validateRequest,
  authController.changePassword
);

module.exports = router;
