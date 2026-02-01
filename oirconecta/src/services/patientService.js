/**
 * Servicio de pacientes (API).
 * Resolución por email para cotizaciones/ventas.
 */

import { api } from './apiClient';

/**
 * Busca paciente por email exacto.
 * @param {string} email
 * @returns {Promise<{ id: string, nombre: string, email: string, telefono: string } | null>}
 */
export async function getPatientByEmail(email) {
  if (!email?.trim()) return null;
  const norm = email.trim().toLowerCase();
  const { data, error } = await api.get(`/api/patients?search=${encodeURIComponent(norm)}&limit=100`);
  if (error || !data?.data?.patients?.length) return null;
  const match = data.data.patients.find((p) => (p.email || '').toLowerCase() === norm);
  return match ? { id: match.id, nombre: match.nombre, email: match.email, telefono: match.telefono } : null;
}

/**
 * Obtiene o crea paciente por email. Crea si no existe.
 * @param {{ nombre: string, email: string, telefono: string }} payload
 * @returns {Promise<{ id: string, nombre: string, email: string, telefono: string } | null>}
 */
export async function ensurePatient(payload) {
  const { nombre, email, telefono } = payload;
  if (!email?.trim()) return null;
  const existing = await getPatientByEmail(email);
  if (existing) return existing;
  const { data, error } = await api.post('/api/patients', {
    nombre: (nombre || '').trim() || 'Sin nombre',
    email: email.trim().toLowerCase(),
    telefono: (telefono || '').trim() || 'Sin teléfono',
  });
  if (error || !data?.data) return null;
  const p = data.data;
  return { id: p.id, nombre: p.nombre, email: p.email, telefono: p.telefono };
}
