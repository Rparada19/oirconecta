/**
 * Servicio de bloqueos de horario (API backend)
 * Solicitudes requieren aprobación del admin
 */

import { api } from './apiClient';

/**
 * Solicitar bloqueo de horario (envía al admin para aprobar)
 * @param {Object} data - { fecha, horaInicio, horaFin, motivo }
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function requestBlock(data) {
  const { fecha, horaInicio, horaFin, motivo } = data;
  if (!fecha || !horaInicio || !horaFin || !motivo?.trim()) {
    return { success: false, error: 'Fecha, hora inicio, hora fin y motivo son obligatorios' };
  }
  const dateStr = typeof fecha === 'string' && fecha.includes('T')
    ? fecha.slice(0, 10)
    : (fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha);
  const { data: res, error } = await api.post('/api/blocked-slots', {
    fecha: `${dateStr}T12:00:00.000Z`,
    horaInicio: horaInicio.trim(),
    horaFin: horaFin.trim(),
    motivo: motivo.trim(),
  });
  if (error) return { success: false, error };
  return { success: true, data: res?.data, error: null };
}

/**
 * Listar bloqueos (según rol: admin ve todos, otros solo aprobados + suyos)
 */
export async function getAllBlockedSlots(params = {}) {
  const q = new URLSearchParams(params).toString();
  const { data, error } = await api.get(`/api/blocked-slots${q ? `?${q}` : ''}`);
  if (error) return { success: false, data: [], error };
  return { success: true, data: data?.data ?? [], error: null };
}

/**
 * Obtener bloqueos pendientes (solo admin)
 */
export async function getPendingBlockedSlots() {
  const { data, error } = await api.get('/api/blocked-slots/pending');
  if (error) return { success: false, data: [], error };
  return { success: true, data: data?.data ?? [], error: null };
}

/**
 * Aprobar bloqueo (solo admin)
 */
export async function approveBlock(id) {
  const { data, error } = await api.patch(`/api/blocked-slots/${id}/approve`, {});
  if (error) return { success: false, error };
  return { success: true, data: data?.data, error: null };
}

/**
 * Rechazar bloqueo (solo admin)
 */
export async function rejectBlock(id) {
  const { data, error } = await api.patch(`/api/blocked-slots/${id}/reject`, {});
  if (error) return { success: false, error };
  return { success: true, data: data?.data, error: null };
}
