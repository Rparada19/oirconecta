import { request } from './apiClient';
import { DIRECTORY_API } from '../config/directoryApi';

/**
 * Búsqueda pública del directorio (PostgreSQL / Prisma).
 * @param {{ q?: string; profesion?: string; poliza?: string; ciudad?: string; limit?: number; offset?: number }} params
 */
export async function searchDirectoryPublic(params = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.profesion) sp.set('profesion', params.profesion);
  if (params.poliza) sp.set('poliza', params.poliza);
  if (params.ciudad) sp.set('ciudad', params.ciudad);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  const path = `${DIRECTORY_API.search}${qs ? `?${qs}` : ''}`;
  return request(path, { method: 'GET', skipAuth: true });
}

/**
 * Ficha pública aprobada por id (detalle).
 * @param {string} profileId
 */
export async function fetchDirectoryProfilePublic(profileId) {
  return request(DIRECTORY_API.profilePublic(profileId), { method: 'GET', skipAuth: true });
}

/**
 * Lead público desde la ficha de un profesional (sin sesión CRM).
 * @param {string} profileId
 * @param {{ nombre: string; email: string; telefono: string; mensaje?: string }} body
 */
export async function submitDirectoryProfileInquiry(profileId, body) {
  return request(DIRECTORY_API.profileInquiry(profileId), {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(body),
  });
}

/** Registra un clic en WhatsApp desde la ficha pública (métrica automática; no bloquea la navegación). */
export function trackDirectoryWhatsAppClick(profileId) {
  if (!profileId || typeof profileId !== 'string') return Promise.resolve();
  return request(DIRECTORY_API.profileWhatsappStat(profileId), {
    method: 'POST',
    skipAuth: true,
    body: '{}',
  });
}
