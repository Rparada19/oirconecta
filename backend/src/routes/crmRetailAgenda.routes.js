/**
 * Agenda matriz de OírConecta (centro propio) desde el CRM.
 *
 * Es la MISMA agenda que consume /agendar, la ficha pública del directorio y el
 * bot de WhatsApp: opera sobre el DirectoryProfile del retail (resuelto por
 * retail.service). Reutiliza professionalSchedule.service tal cual — solo inyecta
 * el profileId del retail en lugar del que viene del JWT del profesional.
 *
 * Autenticación: JWT del CRM (middleware auth.authenticate). Los cambios
 * estructurales (config, horario semanal, tipos) requieren rol ADMIN; los
 * bloqueos puntuales los puede crear cualquier usuario del CRM (recepción cierra
 * un espacio, etc.).
 *
 * Fuente única de bloqueos: escribe en ProfessionalBlock (lo que el motor de
 * slots ya lee), reemplazando el sistema legacy blocked_slots para OírConecta.
 *
 *  GET  /api/crm/retail-agenda/config            PUT (ADMIN)
 *  GET  /api/crm/retail-agenda/types             POST/PATCH/DELETE (ADMIN)
 *  GET  /api/crm/retail-agenda/availability       PUT weekly (ADMIN)
 *  GET  /api/crm/retail-agenda/blocks             POST/PATCH/DELETE
 *  GET  /api/crm/retail-agenda/appointments?from&to&status
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const agenda = require('../services/professionalSchedule.service');
const retail = require('../services/retail.service');

const router = express.Router();

/** Resuelve el profileId del retail y lo deja en req.profileId. */
async function withRetailProfile(req, res, next) {
  try {
    const profileId = await retail.getRetailProfileId();
    if (!profileId) {
      return res.status(503).json({
        success: false,
        error: 'No se pudo resolver el perfil de OírConecta (retail). Revisa RETAIL_PROFESSIONAL_ID / seed.',
        code: 'RETAIL_NOT_RESOLVED',
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

router.use(authenticate, withRetailProfile);

// ── Config ──
router.get('/config', (req, res) => send(res, () => agenda.getConfig(req.profileId)));
router.put('/config', authorize('ADMIN'), (req, res) => send(res, () => agenda.updateConfig(req.profileId, req.body || {})));

// ── Tipos de consulta ──
router.get('/types', (req, res) => send(res, () => agenda.listAppointmentTypes(req.profileId, { includeInactive: req.query.includeInactive === '1' })));
router.post('/types', authorize('ADMIN'), (req, res) => send(res, () => agenda.createAppointmentType(req.profileId, req.body || {})));
router.patch('/types/:id', authorize('ADMIN'), (req, res) => send(res, () => agenda.updateAppointmentType(req.profileId, req.params.id, req.body || {})));
router.delete('/types/:id', authorize('ADMIN'), (req, res) => send(res, () => agenda.deleteAppointmentType(req.profileId, req.params.id)));

// ── Horario semanal ──
router.get('/availability', (req, res) => send(res, () => agenda.listAvailability(req.profileId)));
router.put('/availability/weekly', authorize('ADMIN'), (req, res) => send(res, () => agenda.replaceWeeklyAvailability(req.profileId, req.body?.rows || [])));

// ── Bloqueos (ProfessionalBlock — fuente única) ──
router.get('/blocks', (req, res) => send(res, () => agenda.listBlocks(req.profileId, { from: req.query.from, to: req.query.to })));
router.post('/blocks', (req, res) => send(res, () => agenda.createBlock(req.profileId, req.body || {})));
router.patch('/blocks/:id', (req, res) => send(res, () => agenda.updateBlock(req.profileId, req.params.id, req.body || {})));
router.delete('/blocks/:id', (req, res) => send(res, () => agenda.deleteBlock(req.profileId, req.params.id)));

// ── Citas (lectura para el calendario + cambio de estado multi-tenant safe) ──
router.get('/appointments', (req, res) => send(res, () => agenda.listAppointments(req.profileId, {
  from: req.query.from, to: req.query.to, status: req.query.status,
  limit: req.query.limit ? parseInt(req.query.limit) : 500,
})));
router.patch('/appointments/:id', (req, res) => send(res, () => agenda.updateAppointmentStatus(req.profileId, req.params.id, {
  estado: req.body?.estado, notas: req.body?.notas,
})));

module.exports = router;
