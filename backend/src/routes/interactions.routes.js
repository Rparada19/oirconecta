/**
 * Rutas de interacciones CRM
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const interactionsController = require('../controllers/interactions.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

// GET /api/interactions/daily-actions?daysAhead=7
router.get('/daily-actions', interactionsController.getDailyActions);
// GET /api/interactions/daily-actions-metrics?daysAhead=7
router.get('/daily-actions-metrics', interactionsController.getDailyActionsMetrics);

// GET /api/interactions/metrics?patientEmail=...
router.get(
  '/metrics',
  [query('patientEmail').notEmpty().trim().withMessage('patientEmail requerido')],
  validateRequest,
  interactionsController.getMetrics
);

// GET /api/interactions?patientEmail=...
router.get(
  '/',
  [query('patientEmail').notEmpty().trim().withMessage('patientEmail requerido')],
  validateRequest,
  interactionsController.listByPatientEmail
);

// GET /api/interactions/:id - Obtener una interacción (para editar / añadir comentarios)
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  interactionsController.getById
);

// POST /api/interactions
router.post(
  '/',
  [
    body('patientEmail').notEmpty().trim(),
    body('type').notEmpty().trim(),
    body('title').notEmpty().trim(),
    body('channel').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().trim(),
    body('direction').optional().trim(),
    body('duration')
      .optional()
      .custom((val) => val == null || val === '' || (Number.isInteger(Number(val)) && Number(val) >= 0))
      .withMessage('duration debe ser un número entero >= 0'),
    body('occurredAt').optional(),
    body('scheduledDate').optional(),
    body('scheduledTime').optional().trim(),
    body('relatedAppointmentId').optional().trim(),
    body('relatedMaintenanceId').optional().trim(),
    body('metadata')
      .optional()
      .custom((val) => val == null || (typeof val === 'object' && !Array.isArray(val)))
      .withMessage('metadata debe ser un objeto'),
  ],
  validateRequest,
  interactionsController.create
);

// PATCH /api/interactions/:id
router.patch(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  interactionsController.update
);

// DELETE /api/interactions/:id
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  interactionsController.remove
);

module.exports = router;
