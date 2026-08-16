/**
 * Oportunidades (cotizaciones abiertas y su seguimiento).
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const service = require('../services/oportunidades.service');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

router.get(
  '/',
  [query('incluirCerradas').optional().isBoolean()],
  validateRequest,
  async (req, res, next) => {
    try {
      const data = await service.listar({ incluirCerradas: req.query.incluirCerradas === 'true' });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
);

router.post(
  '/:id/cerrar',
  [param('id').isUUID(), body('resultado').isIn(['ganada', 'perdida'])],
  validateRequest,
  async (req, res, next) => {
    try {
      const quote = await service.cerrar(req.params.id, req.body.resultado);
      res.json({ success: true, data: quote });
    } catch (error) { next(error); }
  }
);

module.exports = router;
