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

// GET /api/campaigns/dashboard — KPI y desgloses CRM (solo ADMIN)
router.get('/dashboard', authorize('ADMIN'), campaignsController.getDashboard);

// GET /api/campaigns/:id/stats — informe cotizaciones/ventas (solo ADMIN)
router.get(
  '/:id/stats',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validateRequest,
  campaignsController.getStats
);

// GET /api/campaigns/:id - Obtener campaña por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  campaignsController.getById
);

// POST /api/campaigns — gestión de campañas: solo ADMIN (CRM)
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('tipo').optional().isString(),
    body('fechaInicio').isISO8601().withMessage('Fecha de inicio inválida'),
    body('fechaFin').isISO8601().withMessage('Fecha de fin inválida'),
    body('fabricante').optional(),
    body('descuentoAprobado').optional().isFloat({ min: 0, max: 100 }),
    body('proveedorNombre').optional().isString(),
    body('referenciaDescuento').optional().isString(),
    body('tecnologiaDescuento').optional().isString(),
    body('alimentacionAudifono').optional().isIn(['BATERIA', 'RECARGABLE', 'AMBOS']),
    body('validezCantidadAudifonos')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['UNO', 'DOS', 'UNO_O_DOS']),
    body('aplicacionDescuento')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['TOTAL_VENTA', 'SEGUNDO_AUDIFONO']),
    body('descripcion').optional().isString(),
    body('incluye').optional().isString(),
    body('noIncluye').optional().isString(),
    body('catalogProductIds').optional().isArray(),
    body('catalogProductIds.*').optional().isString().isLength({ max: 200 }),
    body('plataformaCampana').optional().isString().isLength({ max: 200 }),
  ],
  validateRequest,
  campaignsController.create
);

// PUT /api/campaigns/:id
router.put(
  '/:id',
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('estado').optional().isIn(['ACTIVA', 'PAUSADA', 'FINALIZADA']),
    body('fechaInicio').optional().isISO8601(),
    body('fechaFin').optional().isISO8601(),
    body('fabricante').optional(),
    body('descuentoAprobado').optional().isFloat({ min: 0, max: 100 }),
    body('proveedorNombre').optional().isString(),
    body('referenciaDescuento').optional().isString(),
    body('tecnologiaDescuento').optional().isString(),
    body('alimentacionAudifono').optional().isIn(['BATERIA', 'RECARGABLE', 'AMBOS']),
    body('validezCantidadAudifonos')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['UNO', 'DOS', 'UNO_O_DOS']),
    body('aplicacionDescuento')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['TOTAL_VENTA', 'SEGUNDO_AUDIFONO']),
    body('descripcion').optional().isString(),
    body('incluye').optional().isString(),
    body('noIncluye').optional().isString(),
    body('catalogProductIds').optional().isArray(),
    body('catalogProductIds.*').optional().isString().isLength({ max: 200 }),
    body('plataformaCampana').optional().isString().isLength({ max: 200 }),
  ],
  validateRequest,
  campaignsController.update
);

// DELETE /api/campaigns/:id
router.delete(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validateRequest,
  campaignsController.remove
);

module.exports = router;
