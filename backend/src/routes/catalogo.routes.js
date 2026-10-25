/**
 * Catálogo de productos para cotizar y su relación con campañas.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const service = require('../services/catalogo.service');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    if (e.code === 'P2025') return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    next(e);
  }
};

router.get('/', [query('incluirInactivos').optional().isBoolean()], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.listar({ incluirInactivos: req.query.incluirInactivos === 'true' }) });
}));

router.post('/', [body('marca').isString().notEmpty(), body('nombre').isString().notEmpty(), body('valor').optional().isNumeric()],
  validateRequest, wrap(async (req, res) => {
    res.status(201).json({ success: true, data: await service.crear(req.body) });
  }));

router.post('/importar', [body('filas').isArray({ min: 1, max: 500 })], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.importar(req.body.filas) });
}));

router.put('/:id', [param('id').isUUID()], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.actualizar(req.params.id, req.body) });
}));

router.put('/:id/campanas', [param('id').isUUID(), body('campaignIds').isArray()], validateRequest, wrap(async (req, res) => {
  await service.asignarCampanas(req.params.id, req.body.campaignIds);
  res.json({ success: true });
}));

router.delete('/:id', [param('id').isUUID()], validateRequest, wrap(async (req, res) => {
  res.json({ success: true, data: await service.eliminar(req.params.id) });
}));

module.exports = router;
