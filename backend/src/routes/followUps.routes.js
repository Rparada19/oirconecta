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
// Cliente compartido: pasa por la auditoría y no abre otro pool contra Neon.
const prisma = require('../db');

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
        stepLabel: followUps.stepLabelCompleto(fu.step),
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

    const stepLabel = followUps.stepLabelCompleto(fu.step);
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

/**
 * Marcar que la visita tiene costo para el paciente. Mientras no esté
 * autorizada, el sistema NO le escribe: notificar antes de que autorice el
 * gasto es la vía rápida a un reclamo.
 */
router.post('/:id/marcar-costo', async (req, res, next) => {
  try {
    const fu = await prisma.patientFollowUp.update({
      where: { id: req.params.id },
      data: {
        tieneCosto: req.body?.tieneCosto !== false,
        costoDescripcion: req.body?.descripcion || null,
        // Marcar costo revoca una autorización previa: si cambió lo que se le
        // va a cobrar, la autorización anterior ya no vale.
        autorizadoAt: null,
        autorizadoPorId: null,
      },
    });
    res.json({ success: true, data: fu });
  } catch (e) { next(e); }
});

/** El asesor confirma que el paciente autoriza el costo. Libera los avisos. */
router.post('/:id/autorizar', async (req, res, next) => {
  try {
    const fu = await prisma.patientFollowUp.update({
      where: { id: req.params.id },
      data: { autorizadoAt: new Date(), autorizadoPorId: req.user?.id || null },
    });
    res.json({ success: true, data: fu });
  } catch (e) { next(e); }
});

/**
 * Pausar el seguimiento: deja de mandar recordatorios sin borrar el hito ni
 * perder el cupo. Para cuando el paciente pide que no lo contacten, viajó, o
 * el asesor lo está gestionando por fuera.
 */
router.post('/:id/pausar', async (req, res, next) => {
  try {
    const fu = await followUps.markSkipped({
      followUpId: req.params.id,
      reason: req.body?.motivo || 'Pausado por el asesor',
      byUserId: req.user?.id || null,
    });
    res.json({ success: true, data: fu });
  } catch (e) { next(e); }
});

/**
 * El paciente agendó por teléfono y recepción lo creó a mano: se marca el hito
 * como agendado y se corta la insistencia.
 */
router.post('/:id/agendado-manual', async (req, res, next) => {
  try {
    const fu = await prisma.patientFollowUp.update({
      where: { id: req.params.id },
      data: {
        status: 'SCHEDULED',
        ...(req.body?.appointmentId ? { scheduledAppointmentId: req.body.appointmentId } : {}),
      },
    });
    res.json({ success: true, data: fu });
  } catch (e) { next(e); }
});

module.exports = router;
