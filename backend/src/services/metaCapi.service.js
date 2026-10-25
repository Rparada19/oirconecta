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
 * Si falta cualquiera, sendEvent() es no-op (no rompe la request). Al arrancar
 * se avisa una vez en el log, porque sin token Meta no recibe ninguna cita.
 *
 * Citas que no nacen en la web (bot de WhatsApp, CRM): ver
 * sendAppointmentSchedule(). Para que Meta atribuya la cita al anuncio de
 * click-to-WhatsApp hacen falta además:
 *   META_WABA_ID         id de la cuenta de WhatsApp Business
 *   META_WA_DATASET_ID   dataset conectado a esa WABA (por defecto el pixel)
 */

const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID || '1056565756928195';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || '';
const API_VERSION = 'v21.0';
const WABA_ID = process.env.META_WABA_ID || '';
const WA_DATASET_ID = process.env.META_WA_DATASET_ID || PIXEL_ID;

if (!ACCESS_TOKEN) {
  console.warn('[metaCapi] META_CAPI_ACCESS_TOKEN no está configurado: no se envían eventos a Meta (Schedule/Lead).');
}

function sha256(v) {
  if (!v) return undefined;
  return crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
}

function hashUserData({ email, phone, firstName, lastName, city, country = 'co', ip, userAgent, ctwaClid, wabaId }) {
  const ud = {};
  // Identificadores de click-to-WhatsApp: van sin hashear.
  if (ctwaClid) ud.ctwa_clid = ctwaClid;
  if (wabaId) ud.whatsapp_business_account_id = wabaId;
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
    messagingChannel,
    datasetId = PIXEL_ID,
  } = opts;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: actionSource,
        ...(messagingChannel ? { messaging_channel: messagingChannel } : {}),
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
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${datasetId}/events?access_token=${ACCESS_TOKEN}`, {
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

/**
 * Schedule server-side para citas que NO pasan por la agenda web (esas ya lo
 * mandan desde la ruta pública, con el eventId del pixel para dedupe).
 *
 * Casi todas las citas entran por WhatsApp desde anuncios de click-to-WhatsApp.
 * Si la conversación de ese teléfono trae ctwa_clid, el evento sale como
 * business_messaging y Meta lo asigna al anuncio que trajo a la persona. Si no,
 * sale como system_generated y Meta solo puede cruzarlo por teléfono/correo.
 */
async function sendAppointmentSchedule(appointment, { prisma } = {}) {
  if (!ACCESS_TOKEN || !appointment) return { skipped: true, reason: 'no_token' };

  let conv = null;
  const digits = String(appointment.patientPhone || '').replace(/\D/g, '');
  if (prisma && digits.length >= 10) {
    try {
      conv = await prisma.whatsAppConversation.findFirst({
        where: { phone: { endsWith: digits.slice(-10) }, adCtwaClid: { not: null } },
        orderBy: { adSeenAt: 'desc' },
        select: { adCtwaClid: true },
      });
    } catch (e) {
      console.warn('[metaCapi] buscar conversación de anuncio:', e.message);
    }
  }

  const porAnuncio = !!(conv?.adCtwaClid && WABA_ID);
  return sendEvent('Schedule', {
    user: {
      email: appointment.patientEmail,
      phone: digits.length === 10 ? `57${digits}` : digits,
      firstName: (appointment.patientName || '').split(' ')[0],
      ...(porAnuncio ? { ctwaClid: conv.adCtwaClid, wabaId: WABA_ID } : {}),
    },
    customData: {
      content_name: appointment.tipoConsulta || 'cita',
      content_category: appointment.canalRegistro || 'cita',
    },
    eventId: `schedule_${appointment.id}`,
    actionSource: porAnuncio ? 'business_messaging' : 'system_generated',
    messagingChannel: porAnuncio ? 'whatsapp' : undefined,
    datasetId: porAnuncio ? WA_DATASET_ID : PIXEL_ID,
  });
}

module.exports = { sendEvent, sendAppointmentSchedule };
