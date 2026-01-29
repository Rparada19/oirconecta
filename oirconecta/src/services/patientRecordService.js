// Servicio para gestionar registros de pacientes: contactos, notas, consultas, cancelaciones

const PATIENT_RECORDS_KEY = 'oirconecta_patient_records';

/**
 * Obtiene todos los registros de pacientes
 * @returns {Object} Objeto con email como clave y array de registros como valor
 */
export const getAllPatientRecords = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(PATIENT_RECORDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error al obtener registros de pacientes:', error);
    return {};
  }
};

/**
 * Guarda todos los registros de pacientes
 * @param {Object} records - Objeto con registros
 * @returns {boolean} true si se guardó correctamente
 */
const savePatientRecords = (records) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Error al guardar registros de pacientes:', error);
    return false;
  }
};

/**
 * Obtiene los registros de un paciente específico
 * @param {string} patientEmail - Email del paciente
 * @returns {Array} Array de registros del paciente
 */
export const getPatientRecords = (patientEmail) => {
  const allRecords = getAllPatientRecords();
  return allRecords[patientEmail] || [];
};

/**
 * Agrega un registro de contacto/nota a un paciente
 * @param {string} patientEmail - Email del paciente
 * @param {Object} recordData - Datos del registro
 * @returns {Object} {success: boolean, record: Object|null, error: string|null}
 */
export const addPatientRecord = (patientEmail, recordData) => {
  const {
    type, // 'contact', 'note', 'consultation', 'cancellation', 'reschedule'
    title,
    description,
    appointmentId,
    date,
    time,
    relatedAppointmentId, // Para re-agendamientos
    newDate,
    newTime,
    cancellationReason,
    consultationNotes,
    hearingLoss,
    nextSteps,
    appointmentType, // tipo de cita: primera-vez, adaptacion, prueba-audifonos, etc.
    formData, // datos del formulario de historia clínica según tipo de cita
  } = recordData;

  if (!patientEmail || !type || !title) {
    return {
      success: false,
      record: null,
      error: 'Email, tipo y título son obligatorios',
    };
  }

  const record = {
    id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientEmail,
    type,
    title,
    description: description || '',
    appointmentId: appointmentId || null,
    date: date || new Date().toISOString().split('T')[0],
    time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
    createdAt: new Date().toISOString(),
    // Datos específicos según tipo
    relatedAppointmentId: relatedAppointmentId || null,
    newDate: newDate || null,
    newTime: newTime || null,
    cancellationReason: cancellationReason || null,
    consultationNotes: consultationNotes || null,
    hearingLoss: hearingLoss || null,
    nextSteps: nextSteps || null,
    appointmentType: appointmentType || null,
    formData: formData && typeof formData === 'object' ? formData : null,
  };

  const allRecords = getAllPatientRecords();
  if (!allRecords[patientEmail]) {
    allRecords[patientEmail] = [];
  }
  allRecords[patientEmail].push(record);
  
  // Ordenar por fecha de creación (más reciente primero)
  allRecords[patientEmail].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (savePatientRecords(allRecords)) {
    return {
      success: true,
      record,
      error: null,
    };
  } else {
    return {
      success: false,
      record: null,
      error: 'Error al guardar el registro',
    };
  }
};

/**
 * Registra una consulta (cuando se marca como asistida)
 * @param {string} patientEmail - Email del paciente
 * @param {string} appointmentId - ID de la cita
 * @param {Object} consultationData - Datos de la consulta (notes, hearingLoss, nextSteps, appointmentType, formData)
 * @returns {Object} {success: boolean, record: Object|null, error: string|null}
 */
export const recordConsultation = (patientEmail, appointmentId, consultationData) => {
  return addPatientRecord(patientEmail, {
    type: 'consultation',
    title: 'Consulta Realizada',
    description: `Consulta realizada el ${new Date().toLocaleDateString('es-ES')}`,
    appointmentId,
    date: new Date().toISOString().split('T')[0],
    consultationNotes: consultationData.notes || '',
    hearingLoss: consultationData.hearingLoss ?? false,
    nextSteps: consultationData.nextSteps || '',
    appointmentType: consultationData.appointmentType || null,
    formData: consultationData.formData && typeof consultationData.formData === 'object' ? consultationData.formData : null,
  });
};

/**
 * Registra una cancelación
 * @param {string} patientEmail - Email del paciente
 * @param {string} appointmentId - ID de la cita
 * @param {string} reason - Motivo de cancelación
 * @returns {Object} {success: boolean, record: Object|null, error: string|null}
 */
export const recordCancellation = (patientEmail, appointmentId, reason) => {
  return addPatientRecord(patientEmail, {
    type: 'cancellation',
    title: 'Cita Cancelada',
    description: `Cita cancelada - Motivo: ${reason}`,
    appointmentId,
    date: new Date().toISOString().split('T')[0],
    cancellationReason: reason,
  });
};

/**
 * Registra un re-agendamiento
 * @param {string} patientEmail - Email del paciente
 * @param {string} originalAppointmentId - ID de la cita original
 * @param {string} newAppointmentId - ID de la nueva cita
 * @param {string} oldDate - Fecha anterior
 * @param {string} oldTime - Hora anterior
 * @param {string} newDate - Nueva fecha
 * @param {string} newTime - Nueva hora
 * @returns {Object} {success: boolean, record: Object|null, error: string|null}
 */
export const recordReschedule = (patientEmail, originalAppointmentId, newAppointmentId, oldDate, oldTime, newDate, newTime) => {
  return addPatientRecord(patientEmail, {
    type: 'reschedule',
    title: 'Cita Re-agendada',
    description: `Cita re-agendada de ${oldDate} ${oldTime} a ${newDate} ${newTime}`,
    appointmentId: originalAppointmentId,
    relatedAppointmentId: newAppointmentId,
    date: new Date().toISOString().split('T')[0],
    oldDate,
    oldTime,
    newDate,
    newTime,
  });
};

/**
 * Obtiene el historial de re-agendamientos de una cita
 * @param {string} appointmentId - ID de la cita
 * @param {string} patientEmail - Email del paciente
 * @returns {Array} Array de registros de re-agendamiento
 */
export const getRescheduleHistory = (appointmentId, patientEmail) => {
  const records = getPatientRecords(patientEmail);
  return records.filter(
    (record) =>
      record.type === 'reschedule' &&
      (record.appointmentId === appointmentId || record.relatedAppointmentId === appointmentId)
  );
};
