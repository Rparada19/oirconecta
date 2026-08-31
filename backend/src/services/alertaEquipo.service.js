/**
 * Aviso al celular del equipo cuando entra un lead por WhatsApp.
 *
 * El problema: nadie vive con el CRM abierto, así que un mensaje que entra a
 * las 8 de la noche se queda esperando. Con el volumen de hoy cada persona
 * nueva que escribe importa, y perderla por no verla a tiempo es caro.
 *
 * Canal: Telegram. Es el único gratis que llega instantáneo al teléfono sin
 * trámite — SMS lo cobran todas las operadoras, y WhatsApp al número personal
 * exige una plantilla aprobada por Meta (fuera de la ventana de 24h no se puede
 * mandar texto libre ni al dueño del negocio). Cuando esa plantilla exista,
 * se agrega aquí como un canal más y el aviso llega donde está la conversación.
 *
 * El correo va SIEMPRE que esté configurado: el push de Telegram puede fallar
 * en silencio (token revocado, chat borrado) y un lead perdido no se recupera.
 */

const SITE = process.env.SITE_URL || 'https://oirconecta.com';

/** Escapa lo que va en el mensaje de Telegram con parse_mode HTML. */
const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Describe la forma de las credenciales SIN revelarlas, para poder distinguir
 * "el token está mal escrito" de "el token es válido pero fue revocado".
 * Un token de bot es `<números>:<35 caracteres>`.
 */
function diagnostico(token, chatId) {
  const t = String(token || '');
  const partes = t.split(':');
  return {
    tokenLargo: t.length,
    tokenTieneDosPuntos: partes.length === 2,
    tokenEmpiezaConNumeros: /^\d+$/.test(partes[0] || ''),
    tokenConEspacios: /\s/.test(t),
    chatIdLargo: String(chatId || '').length,
    chatIdEsNumero: /^-?\d+$/.test(String(chatId || '').trim()),
  };
}

async function porTelegram({ titulo, quien, telefono, texto }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { skipped: 'sin-telegram' };

  const wa = String(telefono || '').replace(/\D/g, '');
  const cuerpo = [
    `<b>${esc(titulo)}</b>`,
    '',
    `👤 ${esc(quien)}`,
    telefono ? `📱 <a href="https://wa.me/${wa}">+${esc(telefono)}</a>` : null,
    texto ? `\n💬 <i>${esc(String(texto).slice(0, 300))}</i>` : null,
    `\n<a href="${SITE}/portal-crm/whatsapp">Abrir en el CRM</a>`,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text: cuerpo,
        parse_mode: 'HTML', disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      console.warn('[alerta] Telegram rechazó:', d?.description || res.status);
      // "Not Found" siempre es el token; "chat not found" es el chat id. Sin
      // esta pista había que adivinar cuál de los dos estaba mal.
      return {
        error: d?.description || String(res.status),
        pista: diagnostico(token, chatId),
      };
    }
    return { sent: true };
  } catch (e) {
    console.warn('[alerta] Telegram falló:', e.message);
    return { error: e.message };
  }
}

async function porCorreo({ titulo, quien, telefono, texto }) {
  const to = process.env.ALERTAS_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return { skipped: 'sin-correo' };
  try {
    const email = require('./email.service');
    if (typeof email.sendAlertaEquipo !== 'function') return { skipped: 'sin-plantilla' };
    await email.sendAlertaEquipo({ to, titulo, quien, telefono, texto });
    return { sent: true };
  } catch (e) {
    console.warn('[alerta] correo falló:', e.message);
    return { error: e.message };
  }
}

/**
 * @param {{titulo:string, quien:string, telefono?:string, texto?:string}} datos
 */
async function avisar(datos) {
  const [tg, mail] = await Promise.all([porTelegram(datos), porCorreo(datos)]);
  if (tg.skipped === 'sin-telegram' && mail.skipped) {
    console.warn('[alerta] nadie configurado: define TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID o ALERTAS_EMAIL');
  }
  return { telegram: tg, correo: mail };
}

module.exports = { avisar };
