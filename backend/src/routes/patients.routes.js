/**
 * Rutas de pacientes
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const patientsController = require('../controllers/patients.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/patients - Listar pacientes
router.get(
  '/',
  [
    query('search').optional(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  patientsController.getAll
);

// GET /api/patients/stats - Estadísticas de pacientes
router.get('/stats', patientsController.getStats);

// GET /api/patients/:id - Obtener paciente por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getById
);

// GET /api/patients/:id/profile - Perfil completo del paciente
router.get(
  '/:id/profile',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getProfile
);

// POST /api/patients - Crear paciente
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
  ],
  validateRequest,
  patientsController.create
);

// PUT /api/patients/:id - Actualizar paciente
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('email').optional().isEmail(),
  ],
  validateRequest,
  patientsController.update
);

module.exports = router;
