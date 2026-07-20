/**
 * Meta Conversions API (server-side).
 *
 * Manda eventos al pixel 1056565756928195 desde el backend, duplicando los
 * eventos del navegador. Sirve para recuperar ~30% de eventos que se pierden
 * por adblockers / iOS 14+ / cookies bloqueadas.
 *
 * Deduplicación: si el mismo eventId sale por pixel Y por CAPI, Meta los
 * cuenta como uno solo. Por eso el eventId debe coincidir entre ambos lados
 * cuando se puedan enlazar (por ahora solo mandamos por CAPI, no hace falta).
 *
 * Env vars requeridas:
 *   META_PIXEL_ID
 *   META_CAPI_ACCESS_TOKEN
 *
 * Si falta cualquiera, sendEvent() es no-op silenciosa (no rompe la request).
 */

const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID || '1056565756928195';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || '';
const API_VERSION = 'v21.0';

function sha256(v) {
  if (!v) return undefined;
  return crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
}

function hashUserData({ email, phone, firstName, lastName, city, country = 'co', ip, userAgent }) {
  const ud = {};
  if (email) ud.em = [sha256(email)];
  if (phone) {
    // Meta espera E.164 sin '+' ni espacios
    const digits = String(phone).replace(/\D/g, '');
    if (digits) ud.ph = [sha256(digits)];
  }
  if (firstName) ud.fn = [sha256(firstName)];
  if (lastName) ud.ln = [sha256(lastName)];
  if (city) ud.ct = [sha256(city)];
  if (country) ud.country = [sha256(country)];
  if (ip) ud.client_ip_address = ip;
  if (userAgent) ud.client_user_agent = userAgent;
  return ud;
}

/**
 * Manda un evento server-side a Meta.
 * @param {string} eventName - Schedule | Lead | Subscribe | Contact | ViewContent
 * @param {object} opts
 *   - user: { email, phone, firstName, lastName, city, ip, userAgent } (sin hashear; se hashea aquí)
 *   - customData: { content_name, value, currency, ... }
 *   - eventSourceUrl: URL donde ocurrió el evento
 *   - eventId: id único para dedupe con el pixel del navegador
 */
async function sendEvent(eventName, opts = {}) {
  if (!ACCESS_TOKEN) return { skipped: true, reason: 'no_token' };
  const {
    user = {},
    customData = {},
    eventSourceUrl,
    eventId = crypto.randomUUID(),
    actionSource = 'website',
  } = opts;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: actionSource,
        event_source_url: eventSourceUrl,
        user_data: hashUserData(user),
        custom_data: customData,
      },
    ],
  };
  // Solo en staging/QA: hace que el evento aparezca en la pestaña
  // "Probar eventos" del Administrador de Eventos.
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      console.warn('[metaCapi] error', res.status, json?.error?.message || JSON.stringify(json));
      return { ok: false, error: json?.error };
    }
    return { ok: true, events_received: json?.events_received, fbtrace_id: json?.fbtrace_id };
  } catch (e) {
    console.warn('[metaCapi] network error:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { sendEvent };
