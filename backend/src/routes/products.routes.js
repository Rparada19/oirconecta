/**
 * Rutas de productos (cotizaciones y ventas)
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const productsController = require('../controllers/products.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// ===========================================
// COTIZACIONES
// ===========================================

// GET /api/products/quotes - Listar cotizaciones
router.get(
  '/quotes',
  [
    query('patientId').optional().isUUID(),
    query('estado').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'CONVERTED']),
  ],
  validateRequest,
  productsController.getAllQuotes
);

// GET /api/products/quotes/:id - Obtener cotización por ID
router.get(
  '/quotes/:id',
  [param('id').isUUID()],
  validateRequest,
  productsController.getQuoteById
);

// POST /api/products/quotes - Crear cotización
router.post(
  '/quotes',
  [
    body('patientId').isUUID().withMessage('ID de paciente requerido'),
    body('marca').notEmpty().withMessage('Marca requerida'),
    body('cantidad').isInt({ min: 1 }).withMessage('Cantidad inválida'),
    body('valorUnitario').isFloat({ min: 0 }).withMessage('Valor unitario inválido'),
    body('valorTotal').isFloat({ min: 0 }).withMessage('Valor total inválido'),
  ],
  validateRequest,
  productsController.createQuote
);

// PUT /api/products/quotes/:id - Actualizar cotización
router.put(
  '/quotes/:id',
  [param('id').isUUID()],
  validateRequest,
  productsController.updateQuote
);

// POST /api/products/quotes/:id/convert - Convertir cotización a venta
router.post(
  '/quotes/:id/convert',
  [param('id').isUUID()],
  validateRequest,
  productsController.convertQuoteToSale
);

// ===========================================
// VENTAS
// ===========================================

// GET /api/products/sales - Listar ventas
router.get(
  '/sales',
  [
    query('patientId').optional().isUUID(),
    query('categoria').optional().isIn(['HEARING_AID', 'SERVICE', 'ACCESSORY']),
  ],
  validateRequest,
  productsController.getAllSales
);

// GET /api/products/sales/stats - Estadísticas de ventas
router.get('/sales/stats', productsController.getSalesStats);

// GET /api/products/sales/:id - Obtener venta por ID
router.get(
  '/sales/:id',
  [param('id').isUUID()],
  validateRequest,
  productsController.getSaleById
);

// POST /api/products/sales - Crear venta
router.post(
  '/sales',
  [
    body('patientId').isUUID().withMessage('ID de paciente requerido'),
    body('categoria').isIn(['HEARING_AID', 'SERVICE', 'ACCESSORY']).withMessage('Categoría inválida'),
    body('valorUnitario').isFloat({ min: 0 }).withMessage('Valor unitario inválido'),
    body('valorTotal').isFloat({ min: 0 }).withMessage('Valor total inválido'),
  ],
  validateRequest,
  productsController.createSale
);

// PUT /api/products/sales/:id - Actualizar venta
router.put(
  '/sales/:id',
  [param('id').isUUID()],
  validateRequest,
  productsController.updateSale
);

module.exports = router;
