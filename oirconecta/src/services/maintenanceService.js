/**
 * Servicio de mantenimientos: API (backend) con fallback a localStorage.
 */

import { api } from './apiClient';

const MAINTENANCES_KEY = 'oirconecta_patient_maintenances';

// --- LocalStorage (fallback) ---

const getAllMaintenancesLocal = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const data = localStorage.getItem(MAINTENANCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveMaintenancesLocal = (maintenances) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(MAINTENANCES_KEY, JSON.stringify(maintenances));
    window.dispatchEvent(new CustomEvent('maintenancesUpdated'));
    return true;
  } catch {
    return false;
  }
};

/** Estados y pasos (compartidos) */
export const MAINTENANCE_STATUSES = [
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'enviado_a_garantia', label: 'Enviado a garantía' },
  { value: 'enviado_a_revision', label: 'Enviado a revisión' },
];

export const PROCESS_STEP_ACTIONS = [
  { value: 'enviado', label: 'Enviado (a laboratorio/garantía)' },
  { value: 'en_proceso_lab', label: 'En proceso en laboratorio' },
  { value: 'recibido_centro', label: 'Recibido en centro' },
  { value: 'entregado_paciente', label: 'Entregado al paciente (cierre)' },
];

export const isMaintenanceProcessClosed = (maintenance) => {
  if (!maintenance || !maintenance.processSteps || !Array.isArray(maintenance.processSteps)) return false;
  return maintenance.processSteps.some((s) => s.action === 'entregado_paciente');
};

// --- API primero, fallback local ---

/**
 * Obtiene los mantenimientos de un paciente (async).
 * @param {string} patientEmail
 * @returns {Promise<Array>}
 */
export const getPatientMaintenances = async (patientEmail) => {
  const local = () => (getAllMaintenancesLocal()[patientEmail] || []);

  try {
    const { data, error } = await api.get(`/api/maintenances?patientEmail=${encodeURIComponent(patientEmail || '')}`);
    if (error || !data) return local();
    const list = data.data;
    return Array.isArray(list) ? list : local();
  } catch {
    return local();
  }
};

/**
 * Agrega un mantenimiento (async).
 * @param {string} patientEmail
 * @param {Object} maintenanceData
 * @returns {Promise<{ success: boolean, maintenance: Object|null, error: string|null }>}
 */
export const addMaintenance = async (patientEmail, maintenanceData) => {
  const {
    type, productId, scheduledDate, scheduledTime, completedDate, completedTime, status,
    description, workPerformed, cost, notes, nextMaintenanceDate, relatedAppointmentId, metadata, processSteps,
  } = maintenanceData;

  if (!patientEmail || !type || !scheduledDate) {
    return { success: false, maintenance: null, error: 'Email, tipo y fecha programada son obligatorios' };
  }

  try {
    const { data, error } = await api.post('/api/maintenances', {
      patientEmail,
      type: type || 'check-up',
      productId: productId || null,
      scheduledDate,
      scheduledTime: scheduledTime || null,
      completedDate: completedDate || null,
      completedTime: completedTime || null,
      status: status || 'en_proceso',
      description: description || '',
      workPerformed: workPerformed || '',
      cost: cost === '' || cost == null ? 0 : Number(cost),
      notes: notes || '',
      nextMaintenanceDate: nextMaintenanceDate || null,
      relatedAppointmentId: relatedAppointmentId || null,
      processSteps: Array.isArray(processSteps) ? processSteps : [],
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    if (error || !data?.data) {
      return addMaintenanceLocal(patientEmail, maintenanceData);
    }
    return { success: true, maintenance: data.data, error: null };
  } catch {
    return addMaintenanceLocal(patientEmail, maintenanceData);
  }
};

function addMaintenanceLocal(patientEmail, maintenanceData) {
  const { type, scheduledDate, scheduledTime, status, description, workPerformed, cost, notes, nextMaintenanceDate } = maintenanceData;
  const maintenance = {
    id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientEmail,
    type: type || 'check-up',
    scheduledDate,
    scheduledTime: scheduledTime || null,
    status: status || 'en_proceso',
    description: description || '',
    workPerformed: workPerformed || '',
    cost: cost === '' || cost == null ? 0 : Number(cost),
    notes: notes || '',
    nextMaintenanceDate: nextMaintenanceDate || null,
    processSteps: [],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getAllMaintenancesLocal();
  if (!all[patientEmail]) all[patientEmail] = [];
  all[patientEmail].push(maintenance);
  all[patientEmail].sort((a, b) => new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : '')) - new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : '')));
  return saveMaintenancesLocal(all)
    ? { success: true, maintenance, error: null }
    : { success: false, maintenance: null, error: 'Error al guardar' };
}

/**
 * Actualiza un mantenimiento (async).
 */
export const updateMaintenance = async (patientEmail, maintenanceId, updates) => {
  try {
    const { data, error } = await api.patch(`/api/maintenances/${maintenanceId}`, updates);
    if (error || !data?.data) {
      return updateMaintenanceLocal(patientEmail, maintenanceId, updates);
    }
    return { success: true, maintenance: data.data, error: null };
  } catch {
    return updateMaintenanceLocal(patientEmail, maintenanceId, updates);
  }
};

function updateMaintenanceLocal(patientEmail, maintenanceId, updates) {
  const all = getAllMaintenancesLocal();
  if (!all[patientEmail]) return { success: false, maintenance: null, error: 'Paciente no encontrado' };
  const idx = all[patientEmail].findIndex((m) => m.id === maintenanceId);
  if (idx === -1) return { success: false, maintenance: null, error: 'Mantenimiento no encontrado' };
  const current = all[patientEmail][idx];
  const { addProcessStep, processSteps: ups, ...rest } = updates;
  const nextSteps = ups !== undefined ? ups : (addProcessStep ? [...(current.processSteps || []), { date: new Date().toISOString(), action: addProcessStep.action, note: addProcessStep.note || '' }] : (current.processSteps || []));
  all[patientEmail][idx] = { ...current, ...rest, processSteps: nextSteps, updatedAt: new Date().toISOString() };
  if (updates.scheduledDate || updates.scheduledTime) {
    all[patientEmail].sort((a, b) => new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : '')) - new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : '')));
  }
  return saveMaintenancesLocal(all)
    ? { success: true, maintenance: all[patientEmail].find((m) => m.id === maintenanceId), error: null }
    : { success: false, maintenance: null, error: 'Error al actualizar' };
}

/**
 * Elimina un mantenimiento (async).
 */
export const deleteMaintenance = async (patientEmail, maintenanceId) => {
  try {
    const { error } = await api.delete(`/api/maintenances/${maintenanceId}`);
    if (error) return deleteMaintenanceLocal(patientEmail, maintenanceId);
    return { success: true, error: null };
  } catch {
    return deleteMaintenanceLocal(patientEmail, maintenanceId);
  }
};

function deleteMaintenanceLocal(patientEmail, maintenanceId) {
  const all = getAllMaintenancesLocal();
  if (!all[patientEmail]) return { success: false, error: 'Paciente no encontrado' };
  all[patientEmail] = all[patientEmail].filter((m) => m.id !== maintenanceId);
  return saveMaintenancesLocal(all) ? { success: true, error: null } : { success: false, error: 'Error al eliminar' };
}

/**
 * Próximos mantenimientos (async).
 * @param {string|null} patientEmail
 * @param {number} daysAhead
 * @returns {Promise<Array>}
 */
export const getUpcomingMaintenances = async (patientEmail = null, daysAhead = 30) => {
  try {
    const q = new URLSearchParams();
    if (patientEmail) q.set('patientEmail', patientEmail);
    q.set('daysAhead', String(daysAhead));
    const { data, error } = await api.get(`/api/maintenances/upcoming?${q.toString()}`);
    if (error || !data?.data) return getUpcomingMaintenancesLocal(patientEmail, daysAhead);
    return Array.isArray(data.data) ? data.data : getUpcomingMaintenancesLocal(patientEmail, daysAhead);
  } catch {
    return getUpcomingMaintenancesLocal(patientEmail, daysAhead);
  }
};

function getUpcomingMaintenancesLocal(patientEmail, daysAhead) {
  const all = patientEmail ? { [patientEmail]: getAllMaintenancesLocal()[patientEmail] || [] } : getAllMaintenancesLocal();
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysAhead);
  const upcoming = [];
  Object.values(all).forEach((arr) => {
    (arr || []).forEach((m) => {
      const s = m.status || '';
      const pending = ['scheduled', 'rescheduled', 'en_proceso'].includes(s) || (['enviado_a_garantia', 'enviado_a_revision'].includes(s) && !isMaintenanceProcessClosed(m));
      if (pending) {
        const d = new Date(m.scheduledDate);
        if (d >= today && d <= future) upcoming.push(m);
      }
    });
  });
  return upcoming.sort((a, b) => new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : '')) - new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : '')));
}

/** Solo local: todos los mantenimientos (para compatibilidad si algo lo usa) */
export const getAllMaintenances = () => getAllMaintenancesLocal();
