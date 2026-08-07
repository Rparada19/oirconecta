/**
 * Finanzas — gastos, activos y resumen consolidado del negocio.
 */

import { api } from './apiClient';

export async function getFinanceSummary(months = 12) {
  const { data, error } = await api.get(`/api/finance/summary?months=${months}`);
  if (error) return null;
  return data?.data || null;
}

export async function getExpenses() {
  const { data, error } = await api.get('/api/finance/expenses');
  if (error) return [];
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createExpense(payload) {
  const { data, error } = await api.post('/api/finance/expenses', payload);
  return error ? { success: false, error } : { success: true, expense: data?.data };
}

export async function updateExpense(id, payload) {
  const { data, error } = await api.put(`/api/finance/expenses/${id}`, payload);
  return error ? { success: false, error } : { success: true, expense: data?.data };
}

export async function deleteExpense(id) {
  const { error } = await api.delete(`/api/finance/expenses/${id}`);
  return { success: !error, error };
}

export async function getAssets() {
  const { data, error } = await api.get('/api/finance/assets');
  if (error) return [];
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createAsset(payload) {
  const { data, error } = await api.post('/api/finance/assets', payload);
  return error ? { success: false, error } : { success: true, asset: data?.data };
}

export async function deleteAsset(id) {
  const { error } = await api.delete(`/api/finance/assets/${id}`);
  return { success: !error, error };
}
