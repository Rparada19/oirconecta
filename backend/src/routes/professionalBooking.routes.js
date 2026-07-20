/**
 * F2.3 — Endpoints públicos para reservar con un profesional del directorio.
 * Todos los endpoints son sin autenticación (paciente público).
 *
 *  GET  /api/booking/public/:profileId/types
 *  GET  /api/booking/public/:profileId/slots?date=YYYY-MM-DD&appointmentTypeId=...
 *  GET  /api/booking/public/:profileId/slots/range?from=YYYY-MM-DD&to=YYYY-MM-DD&appointmentTypeId=...
 *  POST /api/booking/public/:profileId/appointments
 */

const express = require('express');
const booking = require('../services/professionalBooking.service');
const metaCapi = require('../services/metaCapi.service');

const router = express.Router();

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message, code: e.code }),
  );
}

router.get('/public/:profileId/types', (req, res) =>
  send(res, () => booking.publicListTypes(req.params.profileId)));

router.get('/public/:profileId/slots', (req, res) =>
  send(res, () => booking.computeSlotsForDay(req.params.profileId, req.query.date, {
    appointmentTypeId: req.query.appointmentTypeId || null,
  })));

router.get('/public/:profileId/slots/range', (req, res) =>
  send(res, () => booking.computeSlotsForRange(req.params.profileId, req.query.from, req.query.to, {
    appointmentTypeId: req.query.appointmentTypeId || null,
  })));

router.post('/public/:profileId/appointments', async (req, res) => {
  try {
    const data = await booking.createPublicAppointment(req.params.profileId, req.body || {});
    const patient = req.body?.patient || {};
    metaCapi.sendEvent('Schedule', {
      user: {
        email: patient.email,
        phone: patient.telefono,
        firstName: (patient.nombre || '').split(' ')[0],
        ip: req.ip,
        userAgent: req.get('user-agent') || undefined,
      },
      customData: {
        content_name: data.tipoConsulta || 'cita',
        currency: 'COP',
        value: data.priceCOP || 0,
      },
      eventSourceUrl: req.get('referer') || undefined,
      // Si el frontend envió metaEventId, se usa para dedupe pixel↔CAPI.
      eventId: req.body?.metaEventId || `schedule_${data.id}`,
    }).catch(() => {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message, code: e.code });
  }
});

module.exports = router;
