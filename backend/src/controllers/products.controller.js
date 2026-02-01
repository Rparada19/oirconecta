/**
 * Controlador de productos (cotizaciones y ventas)
 */

const productsService = require('../services/products.service');

// ===========================================
// COTIZACIONES
// ===========================================

const getAllQuotes = async (req, res, next) => {
  try {
    const { patientId, estado } = req.query;
    const quotes = await productsService.getAllQuotes({ patientId, estado });
    
    res.json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
};

const getQuoteById = async (req, res, next) => {
  try {
    const quote = await productsService.getQuoteById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada',
      });
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const createQuote = async (req, res, next) => {
  try {
    const quote = await productsService.createQuote(req.body);
    
    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    const quote = await productsService.updateQuote(req.params.id, req.body, req.user?.id);
    
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const getQuoteHistory = async (req, res, next) => {
  try {
    const result = await productsService.getQuoteHistory(req.params.id);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const convertQuoteToSale = async (req, res, next) => {
  try {
    const sale = await productsService.convertQuoteToSale(req.params.id, req.body, req.user.id);
    
    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// ===========================================
// VENTAS
// ===========================================

const getAllSales = async (req, res, next) => {
  try {
    const { patientId, categoria } = req.query;
    const sales = await productsService.getAllSales({ patientId, categoria });
    
    res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesStats = async (req, res, next) => {
  try {
    const stats = await productsService.getSalesStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await productsService.getSaleById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada',
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const createSale = async (req, res, next) => {
  try {
    const sale = await productsService.createSale(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const sale = await productsService.updateSale(req.params.id, req.body);
    
    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  getQuoteHistory,
  convertQuoteToSale,
  getAllSales,
  getSalesStats,
  getSaleById,
  createSale,
  updateSale,
};
