/**
 * Tracking de eventos de contacto en la ficha pública.
 *
 * Decisión de producto: NO copiamos los mensajes al buzón central para no
 * ser "juez y parte" entre el paciente y el profesional. En su lugar, cada
 * acción (WhatsApp, llamada, email, agendar) registra un evento por
 * profesional → contadores anónimos visibles solo para el profesional dueño.
 *
 * Fire-and-forget: nunca bloquea al usuario si la red falla.
 */

import { DIRECTORY_API } from '../config/directoryApi';
import { directoryRequest } from './directoryAccountApi';
import { trackEntityEvent } from '../utils/analytics';

const DEDICATED_ENDPOINTS = {
  whatsapp: DIRECTORY_API.profileWhatsappStat,
  call:     DIRECTORY_API.profileCallStat,
  email:    DIRECTORY_API.profileEmailStat,
  agendar:  DIRECTORY_API.profileAgendarStat,
};

const GENERIC_EVENTS = new Set(['share', 'favorite', 'map', 'segunda_opinion']);

/**
 * @param {string} profileId
 * @param {'whatsapp'|'call'|'email'|'agendar'|'share'|'favorite'|'map'|'segunda_opinion'} kind
 */
export function trackContactEvent(profileId, kind) {
  if (!profileId) return;
  try {
    if (DEDICATED_ENDPOINTS[kind]) {
      directoryRequest(DEDICATED_ENDPOINTS[kind](profileId), {
        method: 'POST', skipAuth: true,
      }).catch(() => {});
    } else if (GENERIC_EVENTS.has(kind)) {
      directoryRequest(`/api/directory/profiles/${encodeURIComponent(profileId)}/stats/event`, {
        method: 'POST', skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind.toUpperCase() }),
      }).catch(() => {});
    }
    // D2 — evento analytics enriquecido (ciudad, device, fuente)
    trackEntityEvent('profile_cta_click', {
      entityType: 'DirectoryProfile',
      entityId: profileId,
      properties: { cta: kind },
    });
  } catch {
    /* no-op */
  }
}
