/**
 * Rutas de consultas (historia clínica)
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const consultationsController = require('../controllers/consultations.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

// GET /api/consultations?patientEmail=...
router.get(
  '/',
  [query('patientEmail').notEmpty().withMessage('patientEmail requerido')],
  validateRequest,
  consultationsController.getByPatientEmail
);

// POST /api/consultations - Registrar consulta (cita asistida)
router.post(
  '/',
  [body('appointmentId').notEmpty().withMessage('appointmentId requerido')],
  validateRequest,
  consultationsController.create
);

// PATCH /api/consultations/:id - Actualizar consulta
router.patch(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  consultationsController.update
);

module.exports = router;
