/**
 * Consentimientos informados (Habeas Data / Res. 2003 de 2014).
 * Sin un consent CLINICAL vigente el servidor rechaza registrar consultas.
 */

import { api } from './apiClient';

/** Consents vigentes del paciente. */
export async function getActiveConsents(patientId) {
  if (!patientId) return [];
  const { data, error } = await api.get(`/api/consents/${encodeURIComponent(patientId)}`);
  if (error) return [];
  return Array.isArray(data?.data) ? data.data : [];
}

export async function hasClinicalConsent(patientId) {
  const list = await getActiveConsents(patientId);
  return list.some((c) => c.type === 'CLINICAL' && !c.revokedAt);
}

/**
 * @param {{ patientId: string, type?: string, method?: string }} payload
 */
export async function createConsent({ patientId, type = 'CLINICAL', method = 'IN_PERSON' }) {
  const { data, error } = await api.post('/api/consents', { patientId, type, method });
  return error ? { success: false, error } : { success: true, consent: data?.data };
}
