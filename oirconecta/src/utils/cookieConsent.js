/**
 * Gestión del consentimiento de cookies (Ley 1581/2012).
 *
 * Estados posibles:
 *   'accepted'  — usuario aceptó cookies de marketing/analítica.
 *   'rejected'  — usuario rechazó todo lo no esencial.
 *   null        — aún no ha decidido (mostrar banner).
 *
 * Consecuencias:
 *   - Meta Pixel: fbq('consent', 'grant'|'revoke'). Sin grant, Meta encola
 *     eventos y no los envía hasta que se otorgue.
 *   - Analytics propio (utils/analytics.js): sólo trackea si consent==='accepted'.
 *
 * El banner escribe aquí; los tracks leen aquí.
 */

const LS_KEY = 'oirconecta_cookie_consent';
const EVT = 'oirconecta:cookie-consent-changed';

export function getConsent() {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

export function hasConsent() {
  return getConsent() === 'accepted';
}

function applyToMetaPixel(value) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try { window.fbq('consent', value === 'accepted' ? 'grant' : 'revoke'); } catch {}
}

function applyToGoogle(value) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const state = value === 'accepted' ? 'granted' : 'denied';
  try {
    // analytics_storage manda a GA4; los ad_* mandan a Google Ads (conversiones
    // y remarketing de las campañas). Sin ellos el tag AW- no mide nada.
    window.gtag('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    });
  } catch {}
}

export function setConsent(value) {
  if (value !== 'accepted' && value !== 'rejected') return;
  try { localStorage.setItem(LS_KEY, value); } catch {}
  applyToMetaPixel(value);
  applyToGoogle(value);
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: { value } })); } catch {}
}

export function clearConsent() {
  try { localStorage.removeItem(LS_KEY); } catch {}
  applyToMetaPixel('rejected');
  applyToGoogle('rejected');
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: { value: null } })); } catch {}
}

/** Al montar la app: re-aplica el estado guardado al pixel y a Google (por si el
 *  snippet de index.html se cargó antes de tiempo). */
export function initConsent() {
  const v = getConsent();
  if (v === 'accepted') { applyToMetaPixel('accepted'); applyToGoogle('accepted'); }
}

/** Suscribirse a cambios (para reaccionar desde React sin re-render manual). */
export function onConsentChange(handler) {
  const fn = (e) => handler(e.detail?.value ?? getConsent());
  try { window.addEventListener(EVT, fn); } catch {}
  return () => { try { window.removeEventListener(EVT, fn); } catch {} };
}
