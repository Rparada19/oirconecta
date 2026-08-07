/**
 * Embudo comercial por procedencia (CRM).
 */

const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

const crmFunnelService = require('../services/crmFunnel.service');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

router.get(
  '/procedencia',
  [query('desde').optional().isISO8601(), query('hasta').optional().isISO8601()],
  validateRequest,
  async (req, res, next) => {
    try {
      const data = await crmFunnelService.getFunnelPorProcedencia({
        desde: req.query.desde ? new Date(req.query.desde) : undefined,
        hasta: req.query.hasta ? new Date(req.query.hasta) : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
