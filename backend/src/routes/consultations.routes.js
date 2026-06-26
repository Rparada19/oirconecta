/**
 * Rutas de consultas (historia clínica)
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const consultationsController = require('../controllers/consultations.controller');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const requireConsent = require('../middleware/requireConsent');

router.use(authenticate);

// GET /api/consultations?patientEmail=...
router.get(
  '/',
  [query('patientEmail').notEmpty().withMessage('patientEmail requerido')],
  validateRequest,
  consultationsController.getByPatientEmail
);

// POST /api/consultations - Registrar consulta (cita asistida)
// Requiere consent CLINICAL vigente del paciente (Res. 2003/2014).
router.post(
  '/',
  [body('appointmentId').notEmpty().withMessage('appointmentId requerido')],
  validateRequest,
  requireConsent('CLINICAL', (req) => req.body.patientId),
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
