/**
 * Rutas de mantenimientos
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const maintenancesController = require('../controllers/maintenances.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

// GET /api/maintenances/upcoming?patientEmail=...&daysAhead=30 (debe ir antes de /:id)
router.get(
  '/upcoming',
  [query('patientEmail').optional().trim(), query('daysAhead').optional().isInt({ min: 1, max: 365 })],
  validateRequest,
  maintenancesController.getUpcoming
);

// GET /api/maintenances?patientEmail=... - Listar por paciente
router.get(
  '/',
  [query('patientEmail').notEmpty().trim().withMessage('patientEmail requerido')],
  validateRequest,
  maintenancesController.listByPatientEmail
);

// POST /api/maintenances - Crear
router.post(
  '/',
  [
    body('patientEmail').notEmpty().trim().withMessage('patientEmail requerido'),
    body('type').notEmpty().trim().withMessage('Tipo requerido'),
    body('scheduledDate').notEmpty().withMessage('Fecha programada requerida'),
    body('scheduledTime').optional().trim(),
    body('status').optional().trim(),
    body('description').optional().trim(),
    body('workPerformed').optional().trim(),
    body('cost').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('nextMaintenanceDate').optional(),
    body('relatedAppointmentId').optional().trim(),
    body('processSteps').optional().isArray(),
    body('metadata').optional().isObject(),
  ],
  validateRequest,
  maintenancesController.create
);

// PATCH /api/maintenances/:id - Actualizar
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('ID inválido'),
    body('type').optional().trim(),
    body('scheduledDate').optional(),
    body('scheduledTime').optional().trim(),
    body('status').optional().trim(),
    body('description').optional().trim(),
    body('workPerformed').optional().trim(),
    body('cost').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('nextMaintenanceDate').optional(),
    body('relatedAppointmentId').optional().trim(),
    body('processSteps').optional().isArray(),
    body('addProcessStep').optional().isObject(),
    body('metadata').optional().isObject(),
  ],
  validateRequest,
  maintenancesController.update
);

// DELETE /api/maintenances/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('ID inválido')],
  validateRequest,
  maintenancesController.remove
);

module.exports = router;
