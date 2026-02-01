/**
 * Servicio de citas conectado a la API.
 * Bloqueos (blockTimeSlot, unblockTimeSlot, getBlockedSlots) siguen en localStorage.
 */

import { api } from './apiClient';
import { validarYNormalizarProcedencia } from '../utils/procedenciaNormalizer';

const BLOCKED_SLOTS_KEY = 'oirconecta_blocked_slots';
const DEFAULT_DURATION_MINUTES = 50;
const BREAK_MINUTES = 10;

const STATUS_MAP = {
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  NO_SHOW: 'no-show',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  PATIENT: 'patient',
};

const toFrontend = (a) => {
  if (!a) return null;
  const dateStr = a.fecha ? (typeof a.fecha === 'string' ? a.fecha.slice(0, 10) : a.fecha.toISOString?.().slice(0, 10)) : '';
  return {
    ...a,
    id: a.id,
    date: dateStr,
    time: a.hora,
    reason: a.motivo || '',
    status: STATUS_MAP[a.estado] || (a.estado || '').toLowerCase(),
    patientName: a.patientName,
    patientEmail: a.patientEmail,
    patientPhone: a.patientPhone,
    procedencia: a.procedencia || 'visita-medica',
    durationMinutes: a.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
};

// --- Bloqueos (localStorage, sin cambios) ---

export const getBlockedSlots = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BLOCKED_SLOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveBlockedSlots = (list) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

export const blockTimeSlot = (date, time = null, durationMinutes = DEFAULT_DURATION_MINUTES) => {
  const blocked = getBlockedSlots();
  const exists = blocked.some((b) => b.date === date && (time ? b.time === time : !b.time));
  if (exists) return { success: false, error: 'Este horario ya está bloqueado' };
  blocked.push({
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    date,
    time: time || null,
    durationMinutes: time ? durationMinutes : null,
    blockedAt: new Date().toISOString(),
  });
  return saveBlockedSlots(blocked) ? { success: true, error: null } : { success: false, error: 'Error al bloquear' };
};

export const unblockTimeSlot = (blockId) => {
  const blockedSlots = getBlockedSlots();
  const filtered = blockedSlots.filter((b) => b.id !== blockId);
  if (filtered.length === blockedSlots.length) return { success: false, error: 'Bloqueo no encontrado' };
  return saveBlockedSlots(filtered) ? { success: true, error: null } : { success: false, error: 'Error al desbloquear' };
};

// --- API ---

/**
 * @returns {Promise<Array>}
 */
export async function getAllAppointments() {
  const { data, error } = await api.get('/api/appointments?limit=100');
  if (error) return [];
  const list = data?.data?.appointments ?? [];
  return list.map(toFrontend);
}

/**
 * @param {string} appointmentId
 * @returns {Promise<Object|null>}
 */
export async function getAppointmentById(appointmentId) {
  if (!appointmentId) return null;
  const { data, error } = await api.get(`/api/appointments/${appointmentId}`);
  if (error || !data?.data) return null;
  return toFrontend(data.data);
}

/**
 * @param {Object} appointmentData
 * @returns {Promise<{ success: boolean, appointment?: Object, error?: string }>}
 */
export async function createAppointment(appointmentData) {
  const { date, time, patientName, patientEmail, patientPhone, reason, procedencia, appointmentType } = appointmentData;
  if (!date || !time || !patientName || !patientEmail || !patientPhone) {
    return { success: false, appointment: null, error: 'Todos los campos son obligatorios' };
  }
  const slots = await getAvailableTimeSlots(date, '07:00', '18:00');
  if (!slots.includes(time)) {
    return { success: false, appointment: null, error: 'El horario seleccionado no está disponible. Elige otro.' };
  }
  const payload = {
    fecha: date.includes('T') ? date : `${date}T12:00:00.000Z`,
    hora: time,
    patientName,
    patientEmail: (patientEmail || '').trim().toLowerCase(),
    patientPhone,
    motivo: reason || '',
    procedencia: validarYNormalizarProcedencia(procedencia || 'visita-medica'),
    tipoConsulta: appointmentType || null,
  };
  const { data, error } = await api.post('/api/appointments', payload);
  if (error) return { success: false, appointment: null, error };
  const apt = data?.data ? toFrontend(data.data) : null;
  return { success: !!apt, appointment: apt, error: apt ? null : 'Error al crear la cita' };
}

/**
 * @param {string} appointmentId
 * @param {string} newStatus - 'confirmed'|'completed'|'no-show'|'cancelled'|'rescheduled'|'patient'
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateAppointmentStatus(appointmentId, newStatus) {
  const valid = ['confirmed', 'completed', 'no-show', 'cancelled', 'rescheduled', 'patient'];
  if (!valid.includes(newStatus)) return { success: false, error: 'Estado no válido' };
  const estado = newStatus.replace(/-/g, '_').toUpperCase();
  const { data, error } = await api.patch(`/api/appointments/${appointmentId}/status`, { estado });
  if (error) return { success: false, error };
  return { success: !!(data?.data), error: data?.data ? null : 'Error al actualizar' };
}

/**
 * @param {string} appointmentId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function cancelAppointment(appointmentId) {
  return updateAppointmentStatus(appointmentId, 'cancelled');
}

/**
 * @param {string} date YYYY-MM-DD
 * @param {string} startTime
 * @param {string} endTime
 * @returns {Promise<string[]>} Horas disponibles HH:MM
 */
export async function getAvailableTimeSlots(date, startTime = '07:00', endTime = '18:00') {
  const { data, error } = await api.get(`/api/appointments/available-slots?fecha=${date}`);
  let list = [];
  if (!error && data?.data?.availableSlots) list = data.data.availableSlots;

  const toMin = (t) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const start = toMin(startTime);
  const end = toMin(endTime);
  list = list.filter((slot) => {
    const m = toMin(slot);
    return m >= start && m <= end;
  });

  const blocked = getBlockedSlots().filter((b) => b.date === date);
  const dayBlocked = blocked.some((b) => !b.time);
  if (dayBlocked) return [];
  const blockedSet = new Set(blocked.filter((b) => b.time).map((b) => b.time));
  return list.filter((s) => !blockedSet.has(s));
}

/**
 * @param {string} date YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getAppointmentsByDate(date) {
  const all = await getAllAppointments();
  return all.filter((a) => a.date === date && a.status !== 'cancelled');
}

/**
 * @param {string} appointmentId
 * @param {string} newDate YYYY-MM-DD
 * @param {string} newTime HH:MM
 * @returns {Promise<{ success: boolean, newAppointment?: Object, error?: string }>}
 */
export async function rescheduleAppointment(appointmentId, newDate, newTime) {
  const original = await getAppointmentById(appointmentId);
  if (!original) return { success: false, newAppointment: null, error: 'Cita no encontrada' };
  const slots = await getAvailableTimeSlots(newDate, '07:00', '18:00');
  if (!slots.includes(newTime)) {
    return { success: false, newAppointment: null, error: 'El nuevo horario no está disponible.' };
  }
  const createResult = await createAppointment({
    date: newDate,
    time: newTime,
    patientName: original.patientName,
    patientEmail: original.patientEmail,
    patientPhone: original.patientPhone,
    reason: original.reason,
    procedencia: original.procedencia,
    appointmentType: original.appointmentType,
  });
  if (!createResult.success) return { success: false, newAppointment: null, error: createResult.error };
  await updateAppointmentStatus(appointmentId, 'rescheduled');
  return { success: true, newAppointment: createResult.appointment, error: null };
}
