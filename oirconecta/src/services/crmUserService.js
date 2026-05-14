import { api } from './apiClient';

/**
 * Lista todos los usuarios del CRM (incluye inactivos; solo ADMIN en backend).
 */
export async function fetchCrmUsers() {
  const { data, error } = await api.get('/api/auth/users');
  if (error) return { success: false, error, users: [] };
  const users = Array.isArray(data?.data) ? data.data : [];
  return { success: true, users, error: null };
}

/**
 * Crea usuario (solo ADMIN en backend).
 * @param {{ email: string, password: string, nombre: string, role?: string }} payload
 */
export async function createCrmUser(payload) {
  const { data, error } = await api.post('/api/auth/register', payload);
  if (error) return { success: false, error, user: null };
  return { success: true, user: data?.data?.user || null, error: null };
}

/**
 * Actualiza rol, activo o professionalConfigId (solo ADMIN).
 */
export async function updateCrmUser(userId, payload) {
  const { data, error } = await api.patch(`/api/auth/users/${userId}`, payload);
  if (error) return { success: false, error, user: null };
  return { success: true, user: data?.data || null, error: null };
}
