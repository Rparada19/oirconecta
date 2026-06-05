/**
 * Cliente público del módulo de marketing (sin auth).
 * No usa axios para no acoplar; fetch directo.
 */

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

/** sessionId persistente en sessionStorage (se borra al cerrar la pestaña). */
function getSessionId() {
  let id = sessionStorage.getItem('oc_session_id');
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('oc_session_id', id);
  }
  return id;
}

export async function fetchActiveCampaign(actionType) {
  try {
    const r = await fetch(`${API}/api/marketing/public/active?actionType=${encodeURIComponent(actionType)}`);
    const j = await r.json();
    return j?.data || null;
  } catch {
    return null;
  }
}

export function trackImpression(campaignId) {
  if (!campaignId) return;
  fetch(`${API}/api/marketing/tracking/impression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, sessionId: getSessionId() }),
  }).catch(() => {});
}

export function trackClick(campaignId) {
  if (!campaignId) return;
  fetch(`${API}/api/marketing/tracking/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, sessionId: getSessionId() }),
  }).catch(() => {});
}

/** Agrega UTMs al URL de destino y guarda la última campaña activa en sesión. */
export function buildDestinationUrl(camp) {
  if (!camp?.destinationUrl) return null;
  try {
    const url = new URL(camp.destinationUrl);
    if (camp.utm?.source)   url.searchParams.set('utm_source', camp.utm.source);
    if (camp.utm?.medium)   url.searchParams.set('utm_medium', camp.utm.medium);
    if (camp.utm?.campaign) url.searchParams.set('utm_campaign', camp.utm.campaign);
    return url.toString();
  } catch {
    return camp.destinationUrl;
  }
}

/** Persiste la UTM activa en sessionStorage para que los formularios la lean. */
export function rememberUtm(camp) {
  if (!camp?.utm?.campaign) return;
  sessionStorage.setItem('oc_utm', JSON.stringify(camp.utm));
}
export function readUtm() {
  try { return JSON.parse(sessionStorage.getItem('oc_utm') || 'null'); } catch { return null; }
}
