/**
 * Rutas de Consentimientos. Todas autenticadas; CREATE requiere rol clínico
 * (AUDIOLOGA, ADMIN, etc.) o ser el propio paciente vía flow distinto.
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/consents.controller');

const router = express.Router();

router.use(authenticate);

// Firmar
router.post(
  '/',
  authorize('ADMIN', 'AUDIOLOGA', 'RECEPCION'),
  ctrl.create
);

// Consultar vigentes (cualquier rol clínico)
router.get('/:patientId', ctrl.getActive);
router.get('/:patientId/all', ctrl.list);

// Revocar
router.post(
  '/:id/revoke',
  authorize('ADMIN', 'AUDIOLOGA'),
  ctrl.revoke
);

module.exports = router;
