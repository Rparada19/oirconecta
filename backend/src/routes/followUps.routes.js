/**
 * F8 — Endpoints CRM del funnel de controles post-adaptación.
 *
 *   GET    /api/follow-ups/summary         → contadores para el dashboard
 *   GET    /api/follow-ups/overdue         → lista de vencidos
 *   GET    /api/follow-ups/upcoming        → próximos 7 días
 *   GET    /api/follow-ups/patient/:id     → todos los del paciente (para la HC)
 *   POST   /api/follow-ups/:id/complete    → marca como realizado
 *   POST   /api/follow-ups/:id/skip        → marca como omitido
 *   POST   /api/follow-ups/:id/attach-appt → vincula una cita agendada manualmente
 *   POST   /api/follow-ups/for-patient/:id → activa manualmente el funnel
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const followUps = require('../services/followUps.service');

const router = express.Router();
router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    res.json({ success: true, data: await followUps.summary() });
  } catch (e) { next(e); }
});

router.get('/overdue', async (req, res, next) => {
  try {
    const limit = Math.min(500, parseInt(req.query.limit || '100', 10));
    res.json({ success: true, data: await followUps.listOverdue({ limit }) });
  } catch (e) { next(e); }
});

router.get('/upcoming', async (req, res, next) => {
  try {
    const withinDays = Math.min(60, parseInt(req.query.withinDays || '7', 10));
    const limit = Math.min(500, parseInt(req.query.limit || '100', 10));
    res.json({ success: true, data: await followUps.listUpcoming({ withinDays, limit }) });
  } catch (e) { next(e); }
});

router.get('/patient/:id', async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const rows = await prisma.patientFollowUp.findMany({
      where: { patientId: req.params.id },
      orderBy: { offsetDays: 'asc' },
    });
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post('/:id/complete', async (req, res, next) => {
  try {
    const updated = await followUps.markCompleted({
      followUpId: req.params.id,
      completedById: req.user?.id || null,
      notes: req.body?.notes || null,
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.post('/:id/skip', async (req, res, next) => {
  try {
    const updated = await followUps.markSkipped({
      followUpId: req.params.id,
      reason: req.body?.reason || null,
      byUserId: req.user?.id || null,
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.post('/:id/attach-appt', async (req, res, next) => {
  try {
    const { appointmentId } = req.body || {};
    if (!appointmentId) return res.status(400).json({ success: false, error: 'appointmentId requerido' });
    const updated = await followUps.attachAppointment({ followUpId: req.params.id, appointmentId });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.post('/for-patient/:id', async (req, res, next) => {
  try {
    const { adaptationDate, saleId } = req.body || {};
    if (!adaptationDate) return res.status(400).json({ success: false, error: 'adaptationDate requerido' });
    const result = await followUps.ensureFunnel({
      patientId: req.params.id,
      adaptationDate: new Date(adaptationDate),
      saleId: saleId || null,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;
