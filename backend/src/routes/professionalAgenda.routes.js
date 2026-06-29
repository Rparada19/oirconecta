/**
 * F2.2 — Endpoints de gestión de agenda del profesional (auto-servicio).
 *
 * Todos los endpoints requieren JWT de DirectoryAccount + plan con feature `agenda`.
 * `req.directoryAccount.id` → DirectoryProfile.id (resuelto on-handler).
 *
 *  GET  /api/professional-agenda/me/config
 *  PUT  /api/professional-agenda/me/config
 *
 *  GET    /api/professional-agenda/me/types
 *  POST   /api/professional-agenda/me/types
 *  PATCH  /api/professional-agenda/me/types/:id
 *  DELETE /api/professional-agenda/me/types/:id    (soft: activo=false)
 *
 *  GET    /api/professional-agenda/me/availability
 *  POST   /api/professional-agenda/me/availability
 *  PATCH  /api/professional-agenda/me/availability/:id
 *  DELETE /api/professional-agenda/me/availability/:id
 *  PUT    /api/professional-agenda/me/availability/weekly    { rows: [...] } reemplazo atómico
 *
 *  GET    /api/professional-agenda/me/blocks?from=YYYY-MM-DD&to=YYYY-MM-DD
 *  POST   /api/professional-agenda/me/blocks
 *  PATCH  /api/professional-agenda/me/blocks/:id
 *  DELETE /api/professional-agenda/me/blocks/:id
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const agenda = require('../services/professionalSchedule.service');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Middleware compuesto: resuelve profileId desde el JWT, valida feature `agenda`,
 * deja `req.profileId` listo para los handlers.
 */
async function withAgendaAccess(req, res, next) {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    await agenda.assertAgendaFeature(profile.id);
    req.profileId = profile.id;
    next();
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ success: false, error: e.message, code: e.code });
  }
}

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message, code: e.code }),
  );
}

router.use(authenticateDirectoryAccount, withAgendaAccess);

// ── Config ──
router.get('/me/config',  (req, res) => send(res, () => agenda.getConfig(req.profileId)));
router.put('/me/config',  (req, res) => send(res, () => agenda.updateConfig(req.profileId, req.body || {})));

// ── Tipos de consulta ──
router.get('/me/types',          (req, res) => send(res, () => agenda.listAppointmentTypes(req.profileId, { includeInactive: req.query.includeInactive === '1' })));
router.post('/me/types',         (req, res) => send(res, () => agenda.createAppointmentType(req.profileId, req.body || {})));
router.patch('/me/types/:id',    (req, res) => send(res, () => agenda.updateAppointmentType(req.profileId, req.params.id, req.body || {})));
router.delete('/me/types/:id',   (req, res) => send(res, () => agenda.deleteAppointmentType(req.profileId, req.params.id)));

// ── Horario semanal ──
router.get('/me/availability',          (req, res) => send(res, () => agenda.listAvailability(req.profileId)));
router.post('/me/availability',         (req, res) => send(res, () => agenda.createAvailability(req.profileId, req.body || {})));
router.patch('/me/availability/:id',    (req, res) => send(res, () => agenda.updateAvailability(req.profileId, req.params.id, req.body || {})));
router.delete('/me/availability/:id',   (req, res) => send(res, () => agenda.deleteAvailability(req.profileId, req.params.id)));
router.put('/me/availability/weekly',   (req, res) => send(res, () => agenda.replaceWeeklyAvailability(req.profileId, req.body?.rows || [])));

// ── Bloqueos ──
router.get('/me/blocks',          (req, res) => send(res, () => agenda.listBlocks(req.profileId, { from: req.query.from, to: req.query.to })));
router.post('/me/blocks',         (req, res) => send(res, () => agenda.createBlock(req.profileId, req.body || {})));
router.patch('/me/blocks/:id',    (req, res) => send(res, () => agenda.updateBlock(req.profileId, req.params.id, req.body || {})));
router.delete('/me/blocks/:id',   (req, res) => send(res, () => agenda.deleteBlock(req.profileId, req.params.id)));

module.exports = router;
