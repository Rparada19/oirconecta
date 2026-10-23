/**
 * Cotizaciones unificadas: propuestas, opciones y seguimiento comercial.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const service = require('../services/cotizaciones.service');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
};

router.get('/', [query('incluirCerradas').optional().isBoolean()], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.listar({ incluirCerradas: req.query.incluirCerradas === 'true' }) });
}));

router.get('/:id', [param('id').isUUID()], validateRequest, wrap(async (req, res) => {
  const data = await service.detalle(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Propuesta no encontrada' });
  res.json({ success: true, data });
}));

router.post('/', [
  body('patientId').isUUID(),
  body('opciones').isArray({ min: 1, max: 3 }),
  body('opciones.*.valorUnitario').isNumeric(),
  body('opciones.*.descuento').optional().isNumeric(),
], validateRequest, wrap(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body, req.user) });
}));

router.post('/:id/seguimiento', [
  param('id').isUUID(),
  body('canal').optional().isIn(['phone', 'whatsapp', 'email', 'in_person', 'system']),
  body('etapa').optional().isIn(service.ETAPAS),
], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.registrarSeguimiento(req.params.id, req.body, req.user) });
}));

router.patch('/:id', [
  param('id').isUUID(),
  body('etapa').optional().isIn(service.ETAPAS),
], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.actualizar(req.params.id, req.body) });
}));

module.exports = router;
