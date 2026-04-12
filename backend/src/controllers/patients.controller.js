/**
 * Controlador de pacientes
 */

const patientsService = require('../services/patients.service');

const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    let createdByUserId = undefined;
    let appointmentProfessionalId = undefined;
    if (req.user.role !== 'ADMIN') {
      appointmentProfessionalId = req.user.professionalConfigId || undefined;
      if (!appointmentProfessionalId) createdByUserId = req.user.id;
    }
    const result = await patientsService.getAll({
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      createdByUserId,
      appointmentProfessionalId,
    });
    
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

    if (req.user.role !== 'ADMIN') {
      let canAccess = false;
      if (req.user.professionalConfigId) {
        canAccess = await patientsService.patientHasAppointmentsForProfessional(patient.id, req.user.professionalConfigId);
      }
      if (!canAccess) canAccess = await patientsService.patientHasSalesByUser(patient.id, req.user.id);
      if (!canAccess) {
        return res.status(404).json({
          success: false,
          error: 'Paciente no encontrado',
        });
      }
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

    if (req.user.role !== 'ADMIN') {
      let canAccess = false;
      if (req.user.professionalConfigId) {
        canAccess = await patientsService.patientHasAppointmentsForProfessional(profile.id, req.user.professionalConfigId);
      }
      if (!canAccess) canAccess = await patientsService.patientHasSalesByUser(profile.id, req.user.id);
      if (!canAccess) {
        return res.status(404).json({
          success: false,
          error: 'Paciente no encontrado',
        });
      }
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

const reassign = async (req, res, next) => {
  try {
    const { newProfessionalId } = req.body;
    if (!newProfessionalId || typeof newProfessionalId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'newProfessionalId es requerido',
      });
    }
    const result = await patientsService.reassignToProfessional(req.params.id, newProfessionalId.trim());
    res.json({
      success: true,
      data: result,
      message: `Paciente reasignado. ${result.updatedSalesCount} venta(s) actualizada(s).`,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
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
  reassign,
};
