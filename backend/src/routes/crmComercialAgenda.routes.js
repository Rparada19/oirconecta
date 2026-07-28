/**
 * Agenda del COMERCIAL de captación de OírConecta desde el CRM.
 *
 * Misma mecánica que crmRetailAgenda: reutiliza professionalSchedule.service tal
 * cual, pero inyecta el profileId del comercial (recurso interno, no listado en el
 * directorio público). Es la agenda donde el comercial coordina reuniones con
 * profesionales prospecto, y donde el bot de captación reserva automáticamente.
 *
 *  GET/PUT  /api/crm/comercial-agenda/config
 *  GET/POST/PATCH/DELETE  /types
 *  GET/PUT  /availability, /availability/weekly
 *  GET/POST/PATCH/DELETE  /blocks
 *  GET/PATCH  /appointments
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const agenda = require('../services/professionalSchedule.service');
const comercial = require('../services/comercial.service');

const router = express.Router();

/** Resuelve el profileId del comercial y lo deja en req.profileId. */
async function withComercialProfile(req, res, next) {
  try {
    const profileId = await comercial.getComercialProfileId();
    if (!profileId) {
      return res.status(503).json({
        success: false,
        error: 'No se pudo resolver el perfil del comercial. Revisa el seed seed_oirconecta_comercial.js.',
        code: 'COMERCIAL_NOT_RESOLVED',
      });
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

router.use(authenticate, withComercialProfile);

// ── Config ──
router.get('/config', (req, res) => send(res, () => agenda.getConfig(req.profileId)));
router.put('/config', authorize('ADMIN'), (req, res) => send(res, () => agenda.updateConfig(req.profileId, req.body || {})));

// ── Tipos de reunión ──
router.get('/types', (req, res) => send(res, () => agenda.listAppointmentTypes(req.profileId, { includeInactive: req.query.includeInactive === '1' })));
router.post('/types', authorize('ADMIN'), (req, res) => send(res, () => agenda.createAppointmentType(req.profileId, req.body || {})));
router.patch('/types/:id', authorize('ADMIN'), (req, res) => send(res, () => agenda.updateAppointmentType(req.profileId, req.params.id, req.body || {})));
router.delete('/types/:id', authorize('ADMIN'), (req, res) => send(res, () => agenda.deleteAppointmentType(req.profileId, req.params.id)));

// ── Horario semanal ──
router.get('/availability', (req, res) => send(res, () => agenda.listAvailability(req.profileId)));
router.put('/availability/weekly', authorize('ADMIN'), (req, res) => send(res, () => agenda.replaceWeeklyAvailability(req.profileId, req.body?.rows || [])));

// ── Bloqueos ──
router.get('/blocks', (req, res) => send(res, () => agenda.listBlocks(req.profileId, { from: req.query.from, to: req.query.to })));
router.post('/blocks', (req, res) => send(res, () => agenda.createBlock(req.profileId, req.body || {})));
router.patch('/blocks/:id', (req, res) => send(res, () => agenda.updateBlock(req.profileId, req.params.id, req.body || {})));
router.delete('/blocks/:id', (req, res) => send(res, () => agenda.deleteBlock(req.profileId, req.params.id)));

// ── Reuniones (citas) ──
router.get('/appointments', (req, res) => send(res, () => agenda.listAppointments(req.profileId, {
  from: req.query.from, to: req.query.to, status: req.query.status,
  limit: req.query.limit ? parseInt(req.query.limit) : 500,
})));
router.patch('/appointments/:id', (req, res) => send(res, () => agenda.updateAppointmentStatus(req.profileId, req.params.id, {
  estado: req.body?.estado, notas: req.body?.notas,
})));

module.exports = router;
