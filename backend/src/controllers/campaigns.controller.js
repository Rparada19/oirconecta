/**
 * Controlador de campañas
 */

const campaignsService = require('../services/campaigns.service');

const getAll = async (req, res, next) => {
  try {
    const { estado, fabricante } = req.query;
    const campaigns = await campaignsService.getAll({ estado, fabricante });
    
    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

const getActive = async (req, res, next) => {
  try {
    const { fabricante } = req.query;
    const campaigns = await campaignsService.getActive(fabricante);
    
    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const campaign = await campaignsService.getById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaña no encontrada',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const campaign = await campaignsService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const campaign = await campaignsService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await campaignsService.remove(req.params.id);
    
    res.json({
      success: true,
      message: 'Campaña eliminada',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  remove,
};
