/**
 * Servicio de consultas (historia clínica) - API backend
 * Guarda consultas en base de datos.
 */

import { api } from './apiClient';

/**
 * Obtener consultas de un paciente por email
 * @param {string} patientEmail
 * @returns {Promise<Array>}
 */
export async function getConsultationsByEmail(patientEmail) {
  if (!patientEmail?.trim()) return [];
  try {
    const { data, error } = await api.get(`/api/consultations?patientEmail=${encodeURIComponent(patientEmail.trim().toLowerCase())}`);
    if (error) return [];
    return Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    console.error('[consultationService] getConsultationsByEmail:', e);
    return [];
  }
}

/**
 * Registrar consulta (cita asistida con historia clínica)
 * @param {Object} payload - { appointmentId, patientEmail?, patientId?, notes, hearingLoss, nextSteps, appointmentType, formData, diagnosticos?, pronostico?, tratamiento?, signosVitales? }
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createConsultation(payload) {
  try {
    const { data, error } = await api.post('/api/consultations', payload);
    if (error) return { success: false, error: error.message || 'Error al registrar consulta' };
    return { success: true, data: data?.data };
  } catch (e) {
    console.error('[consultationService] createConsultation:', e);
    return { success: false, error: e?.message || 'Error al registrar consulta' };
  }
}
