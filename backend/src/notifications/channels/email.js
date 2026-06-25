/**
 * Canal EMAIL via Resend HTTP API. Sin SDK (usa fetch).
 * Requiere: RESEND_API_KEY, EMAIL_FROM ("OÍR Conecta <no-reply@oirconecta.com>")
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function htmlWrap(subject, bodyText) {
  // Cuerpo plano → HTML básico. Si la plantilla trae HTML completo,
  // el caller debe poner `html: true` y mandarlo en `body`.
  const safe = String(bodyText || '').replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${subject || 'OÍR Conecta'}</title></head>
<body style="margin:0;padding:24px;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
<table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
<tr><td>
<h1 style="font-size:20px;margin:0 0 16px;color:#085946;">${subject || 'OÍR Conecta'}</h1>
<div style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${safe}</div>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
<p style="font-size:12px;color:#64748b;margin:0;">OÍR Conecta · <a href="https://oirconecta.com" style="color:#085946;">oirconecta.com</a></p>
</td></tr></table></body></html>`;
}

/**
 * @param {object} p
 * @param {string} p.to
 * @param {string} p.subject
 * @param {string} p.body            texto plano (o HTML si html=true)
 * @param {boolean} [p.html=false]
 * @returns {Promise<{providerMessageId:string|null, raw:any}>}
 */
async function sendEmail({ to, subject, body, html = false }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'OÍR Conecta <no-reply@oirconecta.com>';
  if (!apiKey) {
    // Modo dev: sin clave, log y éxito simulado.
    console.warn('[email] RESEND_API_KEY no configurado, simulando envío a', to);
    return { providerMessageId: null, raw: { simulated: true } };
  }
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject: subject || '(sin asunto)',
    html: html ? body : htmlWrap(subject, body),
  };
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Resend ${res.status}: ${data.message || JSON.stringify(data)}`);
    err.code = data.name || `HTTP_${res.status}`;
    err.raw = data;
    throw err;
  }
  return { providerMessageId: data.id || null, raw: data };
}

module.exports = { sendEmail };
