/**
 * Rutas de finanzas (solo ADMIN — es información de toda la empresa).
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const financeService = require('../services/finance.service');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate, authorize('ADMIN'));

const wrap = (fn) => async (req, res, next) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    next(error);
  }
};

router.get(
  '/summary',
  [query('year').optional().isInt({ min: 2020, max: 2100 })],
  validateRequest,
  wrap((req) => financeService.getSummary({ year: parseInt(req.query.year) || undefined }))
);

// ── Gastos ──
router.get(
  '/expenses',
  [query('tipo').optional().isIn(['FIJO', 'VARIABLE']), query('periodo').optional()],
  validateRequest,
  wrap((req) => financeService.listExpenses({ tipo: req.query.tipo, periodo: req.query.periodo }))
);

router.post(
  '/expenses',
  [
    body('tipo').isIn(['FIJO', 'VARIABLE']),
    body('concepto').notEmpty().trim(),
    body('montoCOP').isFloat({ min: 0 }),
  ],
  validateRequest,
  wrap((req) => financeService.createExpense(req.body, req.user.id))
);

router.post(
  '/expenses/copy-previous',
  [body('periodo').matches(/^\d{4}-\d{2}$/)],
  validateRequest,
  wrap((req) => financeService.copyExpensesFromPreviousMonth(req.body.periodo, req.user.id))
);

router.post(
  '/expenses/replicate',
  [
    body('origen').matches(/^\d{4}-\d{2}$/),
    body('destinos').isArray({ min: 1, max: 24 }),
  ],
  validateRequest,
  wrap((req) => financeService.replicateExpenses({
    origen: req.body.origen,
    destinos: req.body.destinos,
    excluirConceptos: req.body.excluirConceptos || [],
  }, req.user.id))
);

router.put(
  '/expenses/:id',
  [param('id').isUUID()],
  validateRequest,
  wrap((req) => financeService.updateExpense(req.params.id, req.body))
);

router.delete(
  '/expenses/:id',
  [param('id').isUUID()],
  validateRequest,
  wrap((req) => financeService.deleteExpense(req.params.id))
);

// ── Activos / depreciación ──
router.get('/assets', wrap(() => financeService.listAssets()));

router.post(
  '/assets',
  [
    body('nombre').notEmpty().trim(),
    body('valorCompra').isFloat({ min: 0 }),
    body('fechaCompra').notEmpty(),
  ],
  validateRequest,
  wrap((req) => financeService.createAsset(req.body, req.user.id))
);

router.put(
  '/assets/:id',
  [param('id').isUUID()],
  validateRequest,
  wrap((req) => financeService.updateAsset(req.params.id, req.body))
);

router.delete(
  '/assets/:id',
  [param('id').isUUID()],
  validateRequest,
  wrap((req) => financeService.deleteAsset(req.params.id))
);

module.exports = router;
