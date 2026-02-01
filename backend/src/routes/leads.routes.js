/**
 * Rutas de leads
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const leadsController = require('../controllers/leads.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/leads - Listar leads
router.get(
  '/',
  [
    query('estado').optional().isIn(['NUEVO', 'CONTACTADO', 'AGENDADO', 'CALIFICADO', 'CONVERTIDO', 'PERDIDO', 'PACIENTE']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  leadsController.getAll
);

// GET /api/leads/stats - Estadísticas de leads (para funnel)
router.get('/stats', leadsController.getStats);

// GET /api/leads/check-duplicate - Verificar duplicados (antes de /:id)
router.get(
  '/check-duplicate',
  [
    query('email').optional().isEmail(),
    query('telefono').optional(),
    query('excludeId').optional().isUUID(),
  ],
  validateRequest,
  leadsController.checkDuplicate
);

// GET /api/leads/:id - Obtener lead por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  leadsController.getById
);

// POST /api/leads - Crear lead
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('procedencia').optional(),
    body('interes').optional(),
  ],
  validateRequest,
  leadsController.create
);

// PUT /api/leads/:id - Actualizar lead
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('telefono').optional().notEmpty(),
    body('estado').optional().isIn(['NUEVO', 'CONTACTADO', 'AGENDADO', 'CALIFICADO', 'CONVERTIDO', 'PERDIDO', 'PACIENTE']),
  ],
  validateRequest,
  leadsController.update
);

// DELETE /api/leads/:id - Eliminar lead
router.delete(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validateRequest,
  leadsController.remove
);

// POST /api/leads/:id/convert-to-patient - Convertir lead a paciente
router.post(
  '/:id/convert-to-patient',
  [param('id').isUUID()],
  validateRequest,
  leadsController.convertToPatient
);

module.exports = router;
