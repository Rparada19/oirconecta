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

const ENDPOINTS = {
  whatsapp: DIRECTORY_API.profileWhatsappStat,
  call:     DIRECTORY_API.profileCallStat,
  email:    DIRECTORY_API.profileEmailStat,
  agendar:  DIRECTORY_API.profileAgendarStat,
};

const VALID = new Set(Object.keys(ENDPOINTS));

/**
 * @param {string} profileId
 * @param {'whatsapp'|'call'|'email'|'agendar'} kind
 */
export function trackContactEvent(profileId, kind) {
  if (!profileId || !VALID.has(kind)) return;
  const url = ENDPOINTS[kind](profileId);
  try {
    // Anónimo: no enviamos token. El endpoint es público.
    directoryRequest(url, { method: 'POST', skipAuth: true }).catch(() => {});
  } catch {
    /* no-op */
  }
}
