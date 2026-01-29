/**
 * Controlador de pacientes
 */

const patientsService = require('../services/patients.service');

const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const result = await patientsService.getAll({ search, page: parseInt(page), limit: parseInt(limit) });
    
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
    const stats = await patientsService.getStats();
    
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
    const patient = await patientsService.getById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await patientsService.getFullProfile(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const patient = await patientsService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const patient = await patientsService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getStats,
  getById,
  getProfile,
  create,
  update,
};
