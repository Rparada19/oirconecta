/**
 * Agenda del comercial de captación, expuesta al PORTAL DE CAPTACIÓN (/api/sales).
 *
 * Se monta bajo sales.routes, que YA aplica authenticate + authorize('ADMIN',
 * 'EJECUTIVO_COMERCIAL'). Por eso aquí no re-autenticamos ni ponemos gates de rol:
 * cualquier usuario del portal comercial puede gestionar su propia agenda.
 *
 * Misma agenda (mismo profileId interno del comercial) que consume el bot de
 * captación y /api/crm/comercial-agenda. Fuente única.
 */

const express = require('express');
const agenda = require('../services/professionalSchedule.service');
const comercial = require('../services/comercial.service');

const router = express.Router();

async function withComercialProfile(req, res, next) {
  try {
    const profileId = await comercial.getComercialProfileId();
    if (!profileId) {
      return res.status(503).json({ success: false, error: 'Agenda del comercial no inicializada.', code: 'COMERCIAL_NOT_RESOLVED' });
    }
    req.profileId = profileId;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message, code: e.code }),
  );
}

router.use(withComercialProfile);

router.get('/config', (req, res) => send(res, () => agenda.getConfig(req.profileId)));
router.put('/config', (req, res) => send(res, () => agenda.updateConfig(req.profileId, req.body || {})));

router.get('/types', (req, res) => send(res, () => agenda.listAppointmentTypes(req.profileId, { includeInactive: req.query.includeInactive === '1' })));
router.post('/types', (req, res) => send(res, () => agenda.createAppointmentType(req.profileId, req.body || {})));
router.patch('/types/:id', (req, res) => send(res, () => agenda.updateAppointmentType(req.profileId, req.params.id, req.body || {})));
router.delete('/types/:id', (req, res) => send(res, () => agenda.deleteAppointmentType(req.profileId, req.params.id)));

router.get('/availability', (req, res) => send(res, () => agenda.listAvailability(req.profileId)));
router.put('/availability/weekly', (req, res) => send(res, () => agenda.replaceWeeklyAvailability(req.profileId, req.body?.rows || [])));

router.get('/blocks', (req, res) => send(res, () => agenda.listBlocks(req.profileId, { from: req.query.from, to: req.query.to })));
router.post('/blocks', (req, res) => send(res, () => agenda.createBlock(req.profileId, req.body || {})));
router.patch('/blocks/:id', (req, res) => send(res, () => agenda.updateBlock(req.profileId, req.params.id, req.body || {})));
router.delete('/blocks/:id', (req, res) => send(res, () => agenda.deleteBlock(req.profileId, req.params.id)));

router.get('/appointments', (req, res) => send(res, () => agenda.listAppointments(req.profileId, {
  from: req.query.from, to: req.query.to, status: req.query.status,
  limit: req.query.limit ? parseInt(req.query.limit) : 500,
})));
router.patch('/appointments/:id', (req, res) => send(res, () => agenda.updateAppointmentStatus(req.profileId, req.params.id, {
  estado: req.body?.estado, notas: req.body?.notas,
})));

module.exports = router;
