// Servicio para gestionar todas las interacciones con pacientes (llamadas, mensajes, correos, recordatorios)

const INTERACTIONS_KEY = 'oirconecta_patient_interactions';

/**
 * Obtiene todas las interacciones
 * @returns {Object} Objeto con email como clave y array de interacciones como valor
 */
export const getAllInteractions = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(INTERACTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error al obtener interacciones:', error);
    return {};
  }
};

/**
 * Guarda todas las interacciones
 * @param {Object} interactions - Objeto con interacciones
 * @returns {boolean} true si se guardó correctamente
 */
const saveInteractions = (interactions) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
    // Disparar evento personalizado para actualización en tiempo real
    window.dispatchEvent(new CustomEvent('interactionsUpdated'));
    return true;
  } catch (error) {
    console.error('Error al guardar interacciones:', error);
    return false;
  }
};

/**
 * Obtiene las interacciones de un paciente específico
 * @param {string} patientEmail - Email del paciente
 * @returns {Array} Array de interacciones del paciente
 */
export const getPatientInteractions = (patientEmail) => {
  const allInteractions = getAllInteractions();
  return allInteractions[patientEmail] || [];
};

/**
 * Agrega una interacción a un paciente
 * @param {string} patientEmail - Email del paciente
 * @param {Object} interactionData - Datos de la interacción
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const addInteraction = (patientEmail, interactionData) => {
  const {
    type, // 'call', 'message', 'email', 'reminder', 'appointment', 'other'
    title,
    description,
    duration, // Para llamadas (minutos)
    direction, // 'inbound' o 'outbound' para llamadas
    channel, // 'phone', 'whatsapp', 'sms', 'email', 'system'
    status, // 'completed', 'missed', 'scheduled', 'sent', 'failed'
    scheduledDate, // Para recordatorios y llamadas programadas
    scheduledTime,
    relatedAppointmentId,
    relatedProductId,
    metadata, // Objeto con datos adicionales según el tipo
  } = interactionData;

  if (!patientEmail || !type || !title) {
    return {
      success: false,
      interaction: null,
      error: 'Email, tipo y título son obligatorios',
    };
  }

  const interaction = {
    id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientEmail,
    type,
    title,
    description: description || '',
    duration: duration || null,
    direction: direction || 'outbound',
    channel: channel || 'phone',
    status: status || 'completed',
    scheduledDate: scheduledDate || null,
    scheduledTime: scheduledTime || null,
    relatedAppointmentId: relatedAppointmentId || null,
    relatedProductId: relatedProductId || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    createdBy: 'system', // En el futuro podría ser el usuario actual
  };

  const allInteractions = getAllInteractions();
  if (!allInteractions[patientEmail]) {
    allInteractions[patientEmail] = [];
  }
  allInteractions[patientEmail].push(interaction);
  
  // Ordenar por fecha de creación (más reciente primero)
  allInteractions[patientEmail].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (saveInteractions(allInteractions)) {
    return {
      success: true,
      interaction,
      error: null,
    };
  } else {
    return {
      success: false,
      interaction: null,
      error: 'Error al guardar la interacción',
    };
  }
};

/**
 * Registra una llamada
 * @param {string} patientEmail - Email del paciente
 * @param {Object} callData - Datos de la llamada
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const recordCall = (patientEmail, callData) => {
  return addInteraction(patientEmail, {
    type: 'call',
    title: `Llamada ${callData.direction === 'inbound' ? 'Entrante' : 'Saliente'}`,
    description: callData.notes || '',
    duration: callData.duration || null,
    direction: callData.direction || 'outbound',
    channel: 'phone',
    status: callData.status || 'completed',
    scheduledDate: callData.scheduledDate || null,
    scheduledTime: callData.scheduledTime || null,
    relatedAppointmentId: callData.relatedAppointmentId || null,
    metadata: {
      phoneNumber: callData.phoneNumber || '',
      outcome: callData.outcome || '', // 'answered', 'no-answer', 'busy', 'voicemail'
      notes: callData.notes || '',
    },
  });
};

/**
 * Registra un mensaje (SMS, WhatsApp)
 * @param {string} patientEmail - Email del paciente
 * @param {Object} messageData - Datos del mensaje
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const recordMessage = (patientEmail, messageData) => {
  return addInteraction(patientEmail, {
    type: 'message',
    title: `Mensaje ${messageData.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`,
    description: messageData.content || '',
    channel: messageData.channel || 'sms',
    status: messageData.status || 'sent',
    relatedAppointmentId: messageData.relatedAppointmentId || null,
    metadata: {
      phoneNumber: messageData.phoneNumber || '',
      content: messageData.content || '',
      template: messageData.template || null,
    },
  });
};

/**
 * Registra un correo electrónico
 * @param {string} patientEmail - Email del paciente
 * @param {Object} emailData - Datos del correo
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const recordEmail = (patientEmail, emailData) => {
  return addInteraction(patientEmail, {
    type: 'email',
    title: emailData.subject || 'Correo Electrónico',
    description: emailData.body || '',
    channel: 'email',
    status: emailData.status || 'sent',
    relatedAppointmentId: emailData.relatedAppointmentId || null,
    relatedProductId: emailData.relatedProductId || null,
    metadata: {
      to: emailData.to || patientEmail,
      from: emailData.from || '',
      subject: emailData.subject || '',
      body: emailData.body || '',
      attachments: emailData.attachments || [],
      template: emailData.template || null,
    },
  });
};

/**
 * Registra un recordatorio
 * @param {string} patientEmail - Email del paciente
 * @param {Object} reminderData - Datos del recordatorio
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const recordReminder = (patientEmail, reminderData) => {
  return addInteraction(patientEmail, {
    type: 'reminder',
    title: reminderData.title || 'Recordatorio',
    description: reminderData.description || '',
    channel: reminderData.channel || 'system',
    status: reminderData.status || 'scheduled',
    scheduledDate: reminderData.scheduledDate,
    scheduledTime: reminderData.scheduledTime,
    relatedAppointmentId: reminderData.relatedAppointmentId || null,
    metadata: {
      reminderType: reminderData.reminderType || 'appointment', // 'appointment', 'maintenance', 'follow-up'
      sent: reminderData.sent || false,
      sentAt: reminderData.sentAt || null,
    },
  });
};

/**
 * Registra un agendamiento
 * @param {string} patientEmail - Email del paciente
 * @param {Object} appointmentData - Datos del agendamiento
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const recordAppointmentInteraction = (patientEmail, appointmentData) => {
  return addInteraction(patientEmail, {
    type: 'appointment',
    title: appointmentData.title || 'Cita Agendada',
    description: appointmentData.description || '',
    channel: appointmentData.channel || 'system',
    status: appointmentData.status || 'completed',
    scheduledDate: appointmentData.scheduledDate,
    scheduledTime: appointmentData.scheduledTime,
    relatedAppointmentId: appointmentData.relatedAppointmentId || null,
    metadata: {
      action: appointmentData.action || 'created', // 'created', 'rescheduled', 'cancelled', 'completed'
      oldDate: appointmentData.oldDate || null,
      oldTime: appointmentData.oldTime || null,
    },
  });
};

/**
 * Actualiza el estado de una interacción
 * @param {string} patientEmail - Email del paciente
 * @param {string} interactionId - ID de la interacción
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} {success: boolean, interaction: Object|null, error: string|null}
 */
export const updateInteraction = (patientEmail, interactionId, updates) => {
  const allInteractions = getAllInteractions();
  if (!allInteractions[patientEmail]) {
    return {
      success: false,
      interaction: null,
      error: 'Paciente no encontrado',
    };
  }

  const interactionIndex = allInteractions[patientEmail].findIndex(i => i.id === interactionId);
  if (interactionIndex === -1) {
    return {
      success: false,
      interaction: null,
      error: 'Interacción no encontrada',
    };
  }

  allInteractions[patientEmail][interactionIndex] = {
    ...allInteractions[patientEmail][interactionIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (saveInteractions(allInteractions)) {
    return {
      success: true,
      interaction: allInteractions[patientEmail][interactionIndex],
      error: null,
    };
  } else {
    return {
      success: false,
      interaction: null,
      error: 'Error al actualizar la interacción',
    };
  }
};

/**
 * Elimina una interacción
 * @param {string} patientEmail - Email del paciente
 * @param {string} interactionId - ID de la interacción
 * @returns {Object} {success: boolean, error: string|null}
 */
export const deleteInteraction = (patientEmail, interactionId) => {
  const allInteractions = getAllInteractions();
  if (!allInteractions[patientEmail]) {
    return {
      success: false,
      error: 'Paciente no encontrado',
    };
  }

  allInteractions[patientEmail] = allInteractions[patientEmail].filter(i => i.id !== interactionId);

  if (saveInteractions(allInteractions)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al eliminar la interacción',
    };
  }
};
