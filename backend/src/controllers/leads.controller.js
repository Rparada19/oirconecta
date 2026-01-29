/**
 * Controlador de leads
 */

const leadsService = require('../services/leads.service');

const getAll = async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 50, search } = req.query;
    const result = await leadsService.getAll({ estado, page: parseInt(page), limit: parseInt(limit), search });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await leadsService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const lead = await leadsService.getById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado',
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const lead = await leadsService.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const lead = await leadsService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await leadsService.remove(req.params.id);
    
    res.json({
      success: true,
      message: 'Lead eliminado',
    });
  } catch (error) {
    next(error);
  }
};

const convertToPatient = async (req, res, next) => {
  try {
    const result = await leadsService.convertToPatient(req.params.id, req.body);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkDuplicate = async (req, res, next) => {
  try {
    const { email, telefono, excludeId } = req.query;
    const duplicate = await leadsService.findByEmailOrPhone(email, telefono, excludeId);
    
    res.json({
      success: true,
      data: {
        isDuplicate: !!duplicate,
        existingLead: duplicate,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getStats,
  getById,
  create,
  update,
  remove,
  convertToPatient,
  checkDuplicate,
};
