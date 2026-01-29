/**
 * Rutas de campañas de marketing
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const campaignsController = require('../controllers/campaigns.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/campaigns - Listar campañas
router.get(
  '/',
  [
    query('estado').optional().isIn(['ACTIVA', 'PAUSADA', 'FINALIZADA']),
    query('fabricante').optional(),
  ],
  validateRequest,
  campaignsController.getAll
);

// GET /api/campaigns/active - Campañas activas (para selects)
router.get('/active', campaignsController.getActive);

// GET /api/campaigns/:id - Obtener campaña por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  campaignsController.getById
);

// POST /api/campaigns - Crear campaña
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('tipo').notEmpty().withMessage('Tipo requerido'),
    body('fechaInicio').isISO8601().withMessage('Fecha de inicio inválida'),
    body('fechaFin').isISO8601().withMessage('Fecha de fin inválida'),
    body('fabricante').optional(),
    body('descuentoAprobado').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  campaignsController.create
);

// PUT /api/campaigns/:id - Actualizar campaña
router.put(
  '/:id',
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('estado').optional().isIn(['ACTIVA', 'PAUSADA', 'FINALIZADA']),
  ],
  validateRequest,
  campaignsController.update
);

// DELETE /api/campaigns/:id - Eliminar campaña
router.delete(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validateRequest,
  campaignsController.remove
);

module.exports = router;
