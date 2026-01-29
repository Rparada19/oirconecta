/**
 * Rutas de citas
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const appointmentsController = require('../controllers/appointments.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/appointments - Listar citas
router.get(
  '/',
  [
    query('fecha').optional().isISO8601(),
    query('estado').optional().isIn(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED', 'PATIENT']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  appointmentsController.getAll
);

// GET /api/appointments/stats - Estadísticas de citas
router.get('/stats', appointmentsController.getStats);

// GET /api/appointments/available-slots - Horarios disponibles
router.get(
  '/available-slots',
  [query('fecha').isISO8601()],
  validateRequest,
  appointmentsController.getAvailableSlots
);

// GET /api/appointments/:id - Obtener cita por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  appointmentsController.getById
);

// POST /api/appointments - Crear cita
router.post(
  '/',
  [
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('hora').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato HH:MM)'),
    body('patientId').optional().isUUID(),
    body('patientName').optional().notEmpty(),
    body('patientEmail').optional().isEmail(),
    body('patientPhone').optional().notEmpty(),
  ],
  validateRequest,
  appointmentsController.create
);

// PUT /api/appointments/:id - Actualizar cita
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('fecha').optional().isISO8601(),
    body('hora').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('estado').optional().isIn(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED', 'PATIENT']),
  ],
  validateRequest,
  appointmentsController.update
);

// PATCH /api/appointments/:id/status - Cambiar estado de cita
router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('estado').isIn(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED', 'PATIENT']),
  ],
  validateRequest,
  appointmentsController.updateStatus
);

// DELETE /api/appointments/:id - Cancelar cita
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  appointmentsController.cancel
);

module.exports = router;
