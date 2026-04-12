/**
 * Servicio de interacciones CRM: API (backend) con fallback a localStorage.
 */

import { api } from './apiClient';

const INTERACTIONS_KEY = 'oirconecta_patient_interactions';

const getAllLocal = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const data = localStorage.getItem(INTERACTIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveLocal = (interactions) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
    window.dispatchEvent(new CustomEvent('interactionsUpdated'));
    return true;
  } catch {
    return false;
  }
};

/**
 * Lista interacciones del paciente (async).
 * Combina datos de API con localStorage para mostrar también seguimientos guardados localmente si la API falló.
 * @param {string} patientEmail
 * @returns {Promise<Array>}
 */
export const getPatientInteractions = async (patientEmail) => {
  const localList = getAllLocal()[patientEmail] || [];
  try {
    const { data, error } = await api.get(`/api/interactions?patientEmail=${encodeURIComponent(patientEmail || '')}`);
    if (error || !data?.data) return localList;
    const apiList = Array.isArray(data.data) ? data.data : [];
    const apiIds = new Set(apiList.map((i) => i.id));
    const localOnly = localList.filter((i) => !apiIds.has(i.id));
    const merged = [...apiList, ...localOnly].sort(
      (a, b) => new Date(b.occurredAt || b.createdAt || 0) - new Date(a.occurredAt || a.createdAt || 0)
    );
    return merged;
  } catch {
    return localList;
  }
};

/**
 * Métricas CRM del paciente (async): totales y últimas fechas.
 * @param {string} patientEmail
 * @returns {Promise<{ totalLlamadas, totalMensajes, totalCorreos, totalVisitas, totalCitas, ultimaLlamada, ultimoMensaje, ultimoCorreo, ultimaVisita }>}
 */
export const getPatientInteractionsMetrics = async (patientEmail) => {
  try {
    const { data, error } = await api.get(`/api/interactions/metrics?patientEmail=${encodeURIComponent(patientEmail || '')}`);
    if (error || !data?.data) return computeMetricsLocal(patientEmail);
    return data.data;
  } catch {
    return computeMetricsLocal(patientEmail);
  }
};

function computeMetricsLocal(patientEmail) {
  const list = getAllLocal()[patientEmail] || [];
  const byType = (t) => list.filter((i) => i.type === t);
  const last = (t) => {
    const arr = byType(t);
    if (arr.length === 0) return null;
    const d = arr.sort((a, b) => new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt))[0];
    return d?.occurredAt || d?.createdAt || null;
  };
  return {
    totalLlamadas: byType('call').length,
    totalMensajes: byType('message').length,
    totalCorreos: byType('email').length,
    totalVisitas: byType('visit').length,
    totalRecordatorios: byType('reminder').length,
    totalSeguimientoConsumibles: byType('follow_up_consumables').length,
    ultimaLlamada: last('call'),
    ultimoMensaje: last('message'),
    ultimoCorreo: last('email'),
    ultimaVisita: last('visit'),
  };
}

/**
 * Acciones del día: alertas que requieren atención (consumibles vencidos/próximos, garantías en reclamación, recordatorios hoy).
 * @param {number} daysAhead - Días hacia adelante para considerar "próximo" en consumibles
 * @returns {Promise<Array<{ id, type, kind, title, description, patientEmail, patientName, dueDate?, metadata? }>>}
 */
export const getDailyActions = async (daysAhead = 7) => {
  try {
    const { data, error } = await api.get(`/api/interactions/daily-actions?daysAhead=${daysAhead}`);
    if (error || !data?.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
};

/**
 * Métricas de acciones del día: activas, vencidas, cumplidas
 */
export const getDailyActionsMetrics = async (daysAhead = 7) => {
  try {
    const { data, error } = await api.get(`/api/interactions/daily-actions-metrics?daysAhead=${daysAhead}`);
    if (error || !data?.data) return { activas: 0, vencidas: 0, cumplidas: 0, total: 0 };
    return data.data;
  } catch {
    return { activas: 0, vencidas: 0, cumplidas: 0, total: 0 };
  }
};

/**
 * Métricas de acciones del día para un paciente específico: activas, vencidas, cumplidas
 */
export const getDailyActionsMetricsByPatient = async (patientEmail, daysAhead = 7) => {
  if (!patientEmail) return { activas: 0, vencidas: 0, cumplidas: 0, total: 0 };
  try {
    const params = new URLSearchParams({ daysAhead, patientEmail });
    const { data, error } = await api.get(`/api/interactions/daily-actions-metrics?${params}`);
    if (error || !data?.data) return { activas: 0, vencidas: 0, cumplidas: 0, total: 0 };
    return data.data;
  } catch {
    return { activas: 0, vencidas: 0, cumplidas: 0, total: 0 };
  }
};

/**
 * Listar usuarios del centro (para dropdown Responsable)
 */
export const getListUsers = async () => {
  try {
    const { data, error } = await api.get('/api/auth/users');
    if (error || !data?.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
};

/**
 * Agregar interacción (async).
 */
export const addInteraction = async (patientEmail, interactionData) => {
  const {
    type, title, description, channel, status, direction, duration,
    scheduledDate, scheduledTime, relatedAppointmentId, relatedMaintenanceId, metadata,
  } = interactionData;

  if (!patientEmail || !type || !title) {
    return { success: false, interaction: null, error: 'Email, tipo y título son obligatorios' };
  }

  const payload = {
    patientEmail,
    type,
    title,
    description: description || '',
    channel: channel || null,
    status: status || 'completed',
    direction: direction || null,
    duration: duration != null ? duration : null,
    occurredAt: interactionData.occurredAt || new Date().toISOString(),
    scheduledDate: scheduledDate || null,
    scheduledTime: scheduledTime || null,
    relatedAppointmentId: relatedAppointmentId || null,
    relatedMaintenanceId: relatedMaintenanceId || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  };

  try {
    const { data, error } = await api.post('/api/interactions', payload);
    if (error || !data?.data) {
      return { success: false, interaction: null, error: error || 'Error al registrar en el servidor' };
    }
    return { success: true, interaction: data.data, error: null };
  } catch (err) {
    const msg = /fetch|network|failed to fetch/i.test(String(err?.message))
      ? 'No se pudo conectar con el servidor. Comprueba que el backend esté en marcha (ej. http://localhost:3001).'
      : (err?.message || 'Error de conexión');
    return { success: false, interaction: null, error: msg };
  }
}

/**
 * Obtener una interacción por ID (para editar / añadir comentarios).
 */
export const getInteractionById = async (interactionId) => {
  try {
    const { data, error } = await api.get(`/api/interactions/${interactionId}`);
    if (error || !data?.data) return null;
    return data.data;
  } catch {
    return null;
  }
};

/**
 * Actualizar interacción (async).
 */
export const updateInteraction = async (patientEmail, interactionId, updates) => {
  try {
    const { data, error } = await api.patch(`/api/interactions/${interactionId}`, updates);
    if (error || !data?.data) return updateInteractionLocal(patientEmail, interactionId, updates);
    return { success: true, interaction: data.data, error: null };
  } catch {
    return updateInteractionLocal(patientEmail, interactionId, updates);
  }
};

function updateInteractionLocal(patientEmail, interactionId, updates) {
  const all = getAllLocal();
  if (!all[patientEmail]) return { success: false, interaction: null, error: 'Paciente no encontrado' };
  const idx = all[patientEmail].findIndex((i) => i.id === interactionId);
  if (idx === -1) return { success: false, interaction: null, error: 'Interacción no encontrada' };
  all[patientEmail][idx] = { ...all[patientEmail][idx], ...updates, updatedAt: new Date().toISOString() };
  return saveLocal(all) ? { success: true, interaction: all[patientEmail][idx], error: null } : { success: false, interaction: null, error: 'Error al actualizar' };
}

/**
 * Eliminar interacción (async).
 */
export const deleteInteraction = async (patientEmail, interactionId) => {
  try {
    const { error } = await api.delete(`/api/interactions/${interactionId}`);
    if (error) return deleteInteractionLocal(patientEmail, interactionId);
    return { success: true, error: null };
  } catch {
    return deleteInteractionLocal(patientEmail, interactionId);
  }
};

function deleteInteractionLocal(patientEmail, interactionId) {
  const all = getAllLocal();
  if (!all[patientEmail]) return { success: false, error: 'Paciente no encontrado' };
  all[patientEmail] = all[patientEmail].filter((i) => i.id !== interactionId);
  return saveLocal(all) ? { success: true, error: null } : { success: false, error: 'Error al eliminar' };
}

export const recordCall = (patientEmail, callData) =>
  addInteraction(patientEmail, {
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
    metadata: { phoneNumber: callData.phoneNumber || '', outcome: callData.outcome || '', notes: callData.notes || '' },
  });

export const recordMessage = (patientEmail, messageData) =>
  addInteraction(patientEmail, {
    type: 'message',
    title: `Mensaje ${messageData.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`,
    description: messageData.content || '',
    channel: messageData.channel || 'sms',
    status: messageData.status || 'sent',
    relatedAppointmentId: messageData.relatedAppointmentId || null,
    metadata: { phoneNumber: messageData.phoneNumber || '', content: messageData.content || '', template: messageData.template || null },
  });

export const recordEmail = (patientEmail, emailData) =>
  addInteraction(patientEmail, {
    type: 'email',
    title: emailData.subject || 'Correo Electrónico',
    description: emailData.body || '',
    channel: 'email',
    status: emailData.status || 'sent',
    relatedAppointmentId: emailData.relatedAppointmentId || null,
    metadata: { to: emailData.to || patientEmail, subject: emailData.subject || '', body: emailData.body || '' },
  });

export const recordReminder = (patientEmail, reminderData) =>
  addInteraction(patientEmail, {
    type: 'reminder',
    title: reminderData.title || 'Recordatorio',
    description: reminderData.description || '',
    channel: reminderData.channel || 'system',
    status: reminderData.status || 'scheduled',
    scheduledDate: reminderData.scheduledDate,
    scheduledTime: reminderData.scheduledTime,
    relatedAppointmentId: reminderData.relatedAppointmentId || null,
    metadata: {
      reminderType: reminderData.reminderType || 'appointment',
      sent: reminderData.sent || false,
      sentAt: reminderData.sentAt || null,
      responsibleName: reminderData.responsibleName || null,
    },
  });

export const recordAppointmentInteraction = (patientEmail, appointmentData) =>
  addInteraction(patientEmail, {
    type: 'appointment',
    title: appointmentData.title || 'Cita Agendada',
    description: appointmentData.description || '',
    channel: appointmentData.channel || 'system',
    status: appointmentData.status || 'completed',
    scheduledDate: appointmentData.scheduledDate,
    scheduledTime: appointmentData.scheduledTime,
    relatedAppointmentId: appointmentData.relatedAppointmentId || null,
    metadata: { action: appointmentData.action || 'created', oldDate: appointmentData.oldDate || null, oldTime: appointmentData.oldTime || null },
  });

/** Solo local: todas las interacciones (compatibilidad) */
export const getAllInteractions = () => getAllLocal();
