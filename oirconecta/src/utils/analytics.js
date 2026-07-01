/**
 * D1 — Cliente analytics first-party.
 *
 * Uso:
 *   import { initAnalytics, trackPageView, trackEvent } from './utils/analytics';
 *   initAnalytics();                              // en el mount de App.jsx
 *   trackPageView(location.pathname);             // en cada cambio de ruta
 *   trackEvent('profile_cta_click', 'whatsapp', { profileId });
 *
 * Persistencia:
 *   - visitorId → localStorage 1 año (id anónimo)
 *   - sessionId → sessionStorage (nueva sesión cada cierre de tab, o 30 min inactividad)
 *
 * Envío:
 *   - navigator.sendBeacon cuando esté disponible (más confiable al cerrar tab)
 *   - fallback fetch keepalive
 *   - falla silenciosa (analytics NUNCA rompe la app)
 */

import { getApiBaseUrl } from './apiBaseUrl';

const API = getApiBaseUrl().replace(/\/$/, '');
const TRACK_URL = `${API}/api/analytics/track`;
const BATCH_URL = `${API}/api/analytics/track-batch`;

const LS_VISITOR = 'oc_visitor_id';
const SS_SESSION = 'oc_session_id';
const SS_SESSION_TS = 'oc_session_ts';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min inactividad

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getOrCreateVisitor() {
  try {
    let v = localStorage.getItem(LS_VISITOR);
    if (!v) {
      v = uuid();
      localStorage.setItem(LS_VISITOR, v);
    }
    return v;
  } catch { return uuid(); }
}

function getOrCreateSession() {
  try {
    const now = Date.now();
    const s = sessionStorage.getItem(SS_SESSION);
    const ts = parseInt(sessionStorage.getItem(SS_SESSION_TS) || '0', 10);
    if (s && ts && now - ts < SESSION_TTL_MS) {
      sessionStorage.setItem(SS_SESSION_TS, String(now));
      return s;
    }
    const fresh = uuid();
    sessionStorage.setItem(SS_SESSION, fresh);
    sessionStorage.setItem(SS_SESSION_TS, String(now));
    return fresh;
  } catch { return uuid(); }
}

function parseUtms() {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utmSource:   p.get('utm_source') || null,
      utmMedium:   p.get('utm_medium') || null,
      utmCampaign: p.get('utm_campaign') || null,
      utmContent:  p.get('utm_content') || null,
      utmTerm:     p.get('utm_term') || null,
    };
  } catch { return {}; }
}

// Cachea UTMs y referrer de la SESIÓN (persisten para todos los eventos posteriores)
let cachedUtms = null;
let cachedReferrer = null;

function getStoredUtms() {
  if (cachedUtms) return cachedUtms;
  try {
    const raw = sessionStorage.getItem('oc_utms');
    if (raw) {
      cachedUtms = JSON.parse(raw);
      return cachedUtms;
    }
  } catch {}
  const parsed = parseUtms();
  // Solo cachea si alguna UTM viene rellena
  if (Object.values(parsed).some(Boolean)) {
    try { sessionStorage.setItem('oc_utms', JSON.stringify(parsed)); } catch {}
    cachedUtms = parsed;
  } else {
    cachedUtms = {};
  }
  return cachedUtms;
}

function getReferrer() {
  if (cachedReferrer !== null) return cachedReferrer;
  try {
    const ref = document.referrer || '';
    // Excluye referrer del mismo dominio
    if (ref && !ref.startsWith(window.location.origin)) {
      cachedReferrer = ref;
    } else {
      cachedReferrer = '';
    }
  } catch { cachedReferrer = ''; }
  return cachedReferrer;
}

function pageTypeFromPath(path) {
  if (!path || path === '/') return 'home';
  if (path.startsWith('/blog/')) return 'blog_post';
  if (path === '/blog') return 'blog_index';
  if (path.startsWith('/directorio/profesional/')) return 'profile';
  if (path.startsWith('/directorio')) return 'directory';
  if (path === '/agendar') return 'agendar_retail';
  if (path.startsWith('/agendar/reagendar')) return 'reschedule';
  if (path.startsWith('/agendar/cancelar')) return 'cancel';
  if (path.startsWith('/agendar/confirmar')) return 'confirm';
  if (path.startsWith('/audifonos/')) return 'brand_page';
  if (path === '/audifonos') return 'audifonos_index';
  if (path.startsWith('/implantes/')) return 'implante_marca';
  if (path === '/implantes') return 'implantes_index';
  if (path === '/ecommerce') return 'shop';
  if (path === '/comparador') return 'comparador';
  if (path === '/ponte-en-sus-oidos') return 'simulador';
  if (path === '/nosotros') return 'nosotros';
  if (path === '/contacto') return 'contacto';
  if (path === '/legal') return 'legal';
  if (path.startsWith('/portal-profesional')) return 'portal_profesional';
  if (path.startsWith('/portal-admin')) return 'portal_admin';
  if (path.startsWith('/portal-crm')) return 'portal_crm';
  if (path === '/registro-profesional') return 'registro_profesional';
  return 'other';
}

let sessionInitialized = false;

/**
 * Inicializa el estado local. Llámalo una vez al montar la app.
 */
export function initAnalytics() {
  if (sessionInitialized) return;
  sessionInitialized = true;
  getOrCreateVisitor();
  getOrCreateSession();
  getStoredUtms();
  getReferrer();

  // Al salir de la pestaña, cerrar sesión con timestamp final
  try {
    window.addEventListener('pagehide', () => {
      // sendBeacon para asegurar entrega
      _send({
        eventType: 'session_end',
        properties: { at: new Date().toISOString() },
      });
    });
  } catch {}
}

function _basePayload(overrides = {}) {
  const path = overrides.path || (typeof window !== 'undefined' ? window.location.pathname : null);
  const utms = getStoredUtms();
  return {
    sessionId: getOrCreateSession(),
    visitorId: getOrCreateVisitor(),
    path,
    pageType: pageTypeFromPath(path),
    referrer: getReferrer() || null,
    utmSource: utms.utmSource || null,
    utmMedium: utms.utmMedium || null,
    utmCampaign: utms.utmCampaign || null,
    utmContent: utms.utmContent || null,
    utmTerm: utms.utmTerm || null,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : null,
    language: typeof navigator !== 'undefined' ? (navigator.language || null) : null,
    ...overrides,
  };
}

function _send(eventData) {
  const body = _basePayload(eventData);
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      const ok = navigator.sendBeacon(TRACK_URL, blob);
      if (ok) return;
    }
    // Fallback fetch keepalive (no bloquea al cerrar tab)
    fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackPageView(path) {
  _send({ eventType: 'page_view', path });
}

export function trackEvent(eventType, eventName = null, properties = null, extra = {}) {
  _send({
    eventType,
    eventName,
    properties: properties || null,
    ...extra,
  });
}

/**
 * Helper para eventos con entidad (perfil, blog post, producto).
 * Ej: trackEntityEvent('profile_view', { entityType: 'DirectoryProfile', entityId: p.id })
 */
export function trackEntityEvent(eventType, { entityType, entityId, properties } = {}) {
  _send({ eventType, entityType, entityId, properties });
}

/**
 * Helper para eventos de campaña interna (impresión/click de ad OírConecta).
 */
export function trackCampaign(eventType, campaignId, properties = null) {
  _send({ eventType, campaignId, properties });
}

export function getSessionId() { return getOrCreateSession(); }
export function getVisitorId() { return getOrCreateVisitor(); }
