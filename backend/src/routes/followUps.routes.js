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
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// ─── Endpoints públicos (por token, sin auth) ─────────────
// Info del follow-up para prellenar la página de agendamiento
router.get('/by-token/:token', async (req, res, next) => {
  try {
    const fu = await followUps.findByToken(req.params.token);
    if (!fu) return res.status(404).json({ success: false, error: 'Token inválido' });
    res.json({
      success: true,
      data: {
        id: fu.id,
        step: fu.step,
        stepLabel: followUps.stepLabel(fu.step),
        offsetDays: fu.offsetDays,
        dueDate: fu.dueDate,
        status: fu.status,
        alreadyScheduled: fu.status === 'SCHEDULED' || fu.status === 'COMPLETED',
        patient: {
          nombre: fu.patient?.nombre || '',
          email: fu.patient?.email || '',
          telefono: fu.patient?.telefono || '',
        },
      },
    });
  } catch (e) { next(e); }
});

// Agendar el control (crea Appointment y hace attach al follow-up)
router.post('/by-token/:token/book', async (req, res, next) => {
  try {
    const { fecha, hora, notas } = req.body || {};
    if (!fecha || !hora) return res.status(400).json({ success: false, error: 'fecha y hora requeridas' });

    const fu = await followUps.findByToken(req.params.token);
    if (!fu) return res.status(404).json({ success: false, error: 'Token inválido' });
    if (fu.status === 'SCHEDULED' || fu.status === 'COMPLETED') {
      return res.status(409).json({ success: false, error: 'Este control ya está agendado', code: 'ALREADY_SCHEDULED' });
    }

    const stepLabel = followUps.stepLabel(fu.step);
    const appointmentsService = require('../services/appointments.service');
    const appt = await appointmentsService.create({
      fecha, hora,
      patientId: fu.patient?.id,
      patientName: fu.patient?.nombre,
      patientEmail: fu.patient?.email,
      patientPhone: fu.patient?.telefono,
      motivo: `${stepLabel} (control de adaptación)`,
      durationMinutes: 30,
      procedencia: 'control-adaptacion',
      tipoConsulta: stepLabel,
      notas: notas || null,
    }, null);

    await followUps.attachAppointment({ followUpId: fu.id, appointmentId: appt.id });

    res.status(201).json({
      success: true,
      data: {
        appointmentId: appt.id,
        fecha: appt.fecha, hora: appt.hora,
        rescheduleToken: appt.rescheduleToken || null,
      },
    });
  } catch (e) {
    if (e.statusCode === 409 || e.code === 'SLOT_TAKEN') {
      return res.status(409).json({ success: false, error: e.message || 'Ese horario ya no está disponible', code: 'SLOT_TAKEN' });
    }
    next(e);
  }
});

// ─── Endpoints CRM (auth requerido) ────────────────────────
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
