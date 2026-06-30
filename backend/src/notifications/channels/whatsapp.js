/**
 * Canal WHATSAPP — Meta WhatsApp Cloud API.
 * Requiere:
 *   WHATSAPP_PHONE_NUMBER_ID  (Meta: ID del número del bot)
 *   WHATSAPP_ACCESS_TOKEN     (system user token permanente)
 *   WHATSAPP_API_VERSION      (opcional, default v21.0)
 *
 * Sin estos vars: simula envío (log) y retorna éxito. Útil mientras se
 * tramita el número y la aprobación de plantillas.
 *
 * Para Fase 1 usamos SIEMPRE plantillas pre-aprobadas (HSM). Mensajes de
 * texto libre solo dentro de la ventana de 24h tras respuesta del paciente
 * (no implementado en F1).
 */

/**
 * @param {object} p
 * @param {string} p.to                  número E.164 sin +, ej "573157939569"
 * @param {string} p.metaTemplateName    nombre exacto registrado en Meta
 * @param {string} [p.locale='es_CO']    código BCP-47 → Meta usa "es_CO"
 * @param {string[]} [p.bodyParams=[]]   parámetros posicionales del cuerpo
 * @param {string[]} [p.buttonParams=[]] (opcional) parámetros para botones quick-reply
 * @returns {Promise<{providerMessageId:string|null, raw:any}>}
 */
async function sendWhatsAppTemplate({
  to,
  metaTemplateName,
  locale = 'es_CO',
  bodyParams = [],
  buttonParams = [],
}) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!phoneId || !token) {
    console.warn('[whatsapp] credenciales no configuradas, simulando envío a', to, 'plantilla', metaTemplateName);
    return { providerMessageId: null, raw: { simulated: true } };
  }
  if (!metaTemplateName) {
    throw new Error('whatsapp: metaTemplateName requerido');
  }

  const components = [];
  if (bodyParams.length) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((v) => ({ type: 'text', text: String(v) })),
    });
  }
  if (buttonParams.length) {
    buttonParams.forEach((v, i) => {
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index: String(i),
        parameters: [{ type: 'payload', payload: String(v) }],
      });
    });
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: String(to).replace(/^\+/, ''),
    type: 'template',
    template: {
      name: metaTemplateName,
      language: { code: locale },
      components,
    },
  };

  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`whatsapp ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);
    err.code = data?.error?.code ? `META_${data.error.code}` : `HTTP_${res.status}`;
    err.raw = data;
    throw err;
  }
  return { providerMessageId: data?.messages?.[0]?.id || null, raw: data };
}

/**
 * Envía texto libre por WhatsApp (válido solo dentro de la ventana de 24h
 * después de que el paciente respondió). Para iniciar conversación usa templates.
 *
 * @param {object} p
 * @param {string} p.to              número E.164 sin '+'
 * @param {string} p.text            cuerpo del mensaje
 * @param {string} [p.phoneNumberId] override del número remitente (multi-tenant);
 *                                    si no se pasa, usa WHATSAPP_PHONE_NUMBER_ID (legacy/global).
 */
async function sendWhatsAppText({ to, text, phoneNumberId }) {
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  if (!phoneId || !token) {
    console.warn('[whatsapp] credenciales no configuradas, simulando texto a', to, ':', String(text).slice(0, 60));
    return { providerMessageId: null, raw: { simulated: true } };
  }
  if (!text || typeof text !== 'string') throw new Error('whatsapp.sendText: text requerido');

  const payload = {
    messaging_product: 'whatsapp',
    to: String(to).replace(/^\+/, ''),
    type: 'text',
    text: { body: String(text).slice(0, 4096) },
  };
  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`whatsapp ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);
    err.code = data?.error?.code ? `META_${data.error.code}` : `HTTP_${res.status}`;
    err.raw = data;
    throw err;
  }
  return { providerMessageId: data?.messages?.[0]?.id || null, raw: data };
}

module.exports = { sendWhatsAppTemplate, sendWhatsAppText };
