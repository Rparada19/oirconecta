/**
 * Servicio de consultas (historia clínica)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener consultas de un paciente por email
 */
const getByPatientEmail = async (patientEmail) => {
  const key = (patientEmail || '').trim().toLowerCase();
  const patient = await prisma.patient.findUnique({
    where: { email: key },
    include: {
      consultations: {
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: true,
        },
      },
    },
  });
  return patient?.consultations ?? [];
};

/**
 * Registrar consulta (cuando se marca cita como asistida)
 * Crea Consultation en DB, actualiza Patient.anamnesisClinica/anamnesisSocial si es primera vez
 */
const create = async (data, userId = null) => {
  const {
    appointmentId,
    patientEmail,
    patientId: providedPatientId,
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
  } = data;

  if (!appointmentId) {
    const err = new Error('appointmentId es requerido');
    err.statusCode = 400;
    throw err;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true },
  });

  if (!appointment) {
    const err = new Error('Cita no encontrada');
    err.statusCode = 404;
    throw err;
  }

  let patient = providedPatientId
    ? await prisma.patient.findUnique({ where: { id: providedPatientId } })
    : appointment.patient;

  if (!patient) {
    const email = (patientEmail || appointment.patientEmail || '').trim().toLowerCase();
    if (!email) {
      const err = new Error('No se encontró paciente ni email para asociar la consulta');
      err.statusCode = 400;
      throw err;
    }
    patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          nombre: appointment.patientName || 'Paciente',
          email,
          telefono: appointment.patientPhone || '',
          procedencia: appointment.procedencia || 'visita-medica',
          notas: notes || null,
          tienePerdidaAuditiva: hearingLoss ?? false,
        },
      });
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { patientId: patient.id },
      });
    } else {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { patientId: patient.id },
      });
    }
  }

  const consultation = await prisma.consultation.create({
    data: {
      patientId: patient.id,
      appointmentId,
      tipoConsulta: appointmentType || appointment.tipoConsulta || 'primera-vez',
      notasConsulta: notes || null,
      perdidaAuditiva: hearingLoss ?? null,
      proximosPasos: nextSteps || null,
      formData: formData && typeof formData === 'object' ? formData : null,
    },
    include: {
      appointment: true,
      patient: true,
    },
  });

  const isPrimeraVez = String(consultation.tipoConsulta || '').toLowerCase().includes('primera');

  if (isPrimeraVez && (anamnesisClinica || anamnesisSocial || (formData && (formData.anamnesisClinica || formData.anamnesisSocial)))) {
    const ac = anamnesisClinica || (formData && formData.anamnesisClinica) || {};
    const as = anamnesisSocial || (formData && formData.anamnesisSocial) || {};
    const fd = formData || {};
    const res = ac.resultadosEvaluacion || {};
    const acForPatient = {
      ...ac,
      resultadoConsulta: ac.resultadoConsulta ?? fd.conclusiones ?? fd.informeMedico ?? ac.resultadoConsulta,
      resultadosEvaluacion: {
        ...res,
        otoscopia: fd.otoscopiaImpedanciometria ?? res.otoscopia ?? '',
        audiometria: (fd.audiograma && (fd.audiograma.od || fd.audiograma.oi)) ? fd.audiograma : (res.audiometria || { od: {}, oi: {}, observaciones: '' }),
        logoaudiometria: fd.logoaudiometria ?? res.logoaudiometria ?? '',
        impedanciometria: fd.otoscopiaImpedanciometria ?? res.impedanciometria ?? '',
        pruebaAudifonos: fd.pruebasAudifonos ?? res.pruebaAudifonos ?? '',
      },
    };
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        tienePerdidaAuditiva: hearingLoss ?? patient.tienePerdidaAuditiva ?? false,
        anamnesisClinica: Object.keys(acForPatient).length ? acForPatient : undefined,
        anamnesisSocial: Object.keys(as).length ? as : undefined,
      },
    });
  } else if (hearingLoss != null) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { tienePerdidaAuditiva: hearingLoss },
    });
  }

  return consultation;
};

/**
 * Actualizar consulta
 */
const update = async (id, data) => {
  const existing = await prisma.consultation.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Consulta no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return prisma.consultation.update({
    where: { id },
    data: {
      notasConsulta: data.notes ?? existing.notasConsulta,
      perdidaAuditiva: data.hearingLoss ?? existing.perdidaAuditiva,
      proximosPasos: data.nextSteps ?? existing.proximosPasos,
      formData: data.formData && typeof data.formData === 'object' ? data.formData : existing.formData,
    },
    include: { appointment: true, patient: true },
  });
};

module.exports = {
  getByPatientEmail,
  create,
  update,
};
