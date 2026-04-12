/**
 * Controlador de consultas (historia clínica)
 */

const consultationsService = require('../services/consultations.service');

const getByPatientEmail = async (req, res, next) => {
  try {
    const { patientEmail } = req.query;
    if (!patientEmail) {
      return res.status(400).json({
        success: false,
        error: 'patientEmail es requerido',
      });
    }
    const consultations = await consultationsService.getByPatientEmail(patientEmail);
    res.json({
      success: true,
      data: consultations,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      appointmentId,
      patientEmail,
      patientId,
      notes,
      hearingLoss,
      nextSteps,
      appointmentType,
      formData,
      diagnosticos,
      pronostico,
      tratamiento,
      signosVitales,
      anamnesisClinica,
      anamnesisSocial,
    } = req.body;

    const consultation = await consultationsService.create({
      appointmentId,
      patientEmail,
      patientId,
      notes,
      hearingLoss,
      nextSteps,
      appointmentType,
      formData,
      diagnosticos,
      pronostico,
      tratamiento,
      signosVitales,
      anamnesisClinica,
      anamnesisSocial,
    }, req.user?.id);

    res.status(201).json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const consultation = await consultationsService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

module.exports = {
  getByPatientEmail,
  create,
  update,
};
