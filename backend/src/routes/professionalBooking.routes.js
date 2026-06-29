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

router.post('/public/:profileId/appointments', (req, res) =>
  send(res, () => booking.createPublicAppointment(req.params.profileId, req.body || {})));

module.exports = router;
