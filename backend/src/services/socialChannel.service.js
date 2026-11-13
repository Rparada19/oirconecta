/**
 * Instagram y Facebook Messenger para Aura.
 *
 * Los mensajes directos de Instagram y de Messenger llegan por la misma
 * plataforma de Meta que WhatsApp, así que Aura los atiende con el mismo bot,
 * el mismo tono y las mismas reglas de agenda. Para no duplicar 3.000 líneas
 * de bot, cada persona de Instagram o Messenger se guarda como una
 * WhatsAppConversation más, con un "phone" que no es un número:
 *
 *    ig:<id>   → Instagram  (id = IGSID, el id de la persona para nuestra cuenta)
 *    fb:<id>   → Messenger  (id = PSID, el id de la persona para nuestra página)
 *
 * El id va con los dígitos cambiados por letras (0→a … 9→j). Es a propósito:
 * el bot busca citas, pacientes y leads por "los últimos 10 dígitos del
 * teléfono" en decenas de sitios. Con letras, esa búsqueda queda vacía y no
 * hay forma de que el id de Instagram de alguien coincida por azar con el
 * celular de otro paciente. El teléfono real lo pide Aura antes de agendar.
 *
 * El envío pasa por notifications/channels/whatsapp: cada función mira si el
 * destino es ig:/fb: y, si lo es, llega aquí. Por eso todo lo que ya manda el
 * bot (texto, botones, listas, fotos, video) funciona sin tocar el bot.
 *
 * Variables en Render:
 *   META_PAGE_ACCESS_TOKEN  token de la página de Facebook (o un token de
 *                           usuario del sistema con la página asignada: si hay
 *                           META_PAGE_ID, se canjea solo por el de la página).
 *   META_PAGE_ID            id de la página de Facebook de OírConecta.
 *   META_IG_ACCOUNT_ID      (opcional) id de la cuenta profesional de Instagram.
 *   SOCIAL_BOT_ENABLED      'false' apaga las respuestas automáticas en redes.
 *   SOCIAL_COMENTARIOS      'dm+publico' (por defecto) | 'dm' | 'off'.
 */

const path = require('path');

const VERSION = () => process.env.WHATSAPP_API_VERSION || 'v21.0';
const GRAPH = () => `https://graph.facebook.com/${VERSION()}`;

// ─── Identificadores ───────────────────────────────────────────────

const A_LETRA = 'abcdefghij';

function codificar(canal, id) {
  const pref = canal === 'instagram' ? 'ig' : 'fb';
  const letras = String(id || '').replace(/\d/g, (d) => A_LETRA[Number(d)]);
  return `${pref}:${letras}`;
}

function esSocial(phone) {
  return /^(ig|fb):/.test(String(phone || ''));
}

/** 'ig:bcd…' → { canal:'instagram', id:'123…' } | null */
function decodificar(phone) {
  const m = String(phone || '').match(/^(ig|fb):([a-j]+)$/);
  if (!m) return null;
  return {
    canal: m[1] === 'ig' ? 'instagram' : 'messenger',
    id: m[2].replace(/[a-j]/g, (l) => String(A_LETRA.indexOf(l))),
  };
}

function nombreCanal(phone) {
  const d = decodificar(phone);
  if (!d) return 'WhatsApp';
  return d.canal === 'instagram' ? 'Instagram' : 'Facebook Messenger';
}

// ─── Token de la página ────────────────────────────────────────────

let tokenCache = null;

/**
 * El token con el que se habla en nombre de la página. Si lo que hay en
 * Render es un token de usuario del sistema, se cambia por el de la página
 * (Meta exige token de página para Messenger e Instagram).
 */
async function tokenPagina() {
  if (tokenCache) return tokenCache;
  const base = process.env.META_PAGE_ACCESS_TOKEN;
  if (!base) return null;
  const pageId = process.env.META_PAGE_ID;
  if (pageId) {
    try {
      const r = await fetch(`${GRAPH()}/${pageId}?fields=access_token&access_token=${encodeURIComponent(base)}`);
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.access_token) {
        tokenCache = d.access_token;
        return tokenCache;
      }
    } catch (_) { /* se usa el que hay */ }
  }
  tokenCache = base;
  return tokenCache;
}

function configurado() {
  return Boolean(process.env.META_PAGE_ACCESS_TOKEN);
}

function botHabilitado() {
  return configurado() && process.env.SOCIAL_BOT_ENABLED !== 'false';
}

async function graph(metodo, ruta, cuerpo) {
  const token = await tokenPagina();
  if (!token) {
    console.warn('[social] META_PAGE_ACCESS_TOKEN no configurado, simulando', metodo, ruta);
    return { simulated: true };
  }
  const sep = ruta.includes('?') ? '&' : '?';
  const url = `${GRAPH()}/${ruta}${sep}access_token=${encodeURIComponent(token)}`;
  const opts = { method: metodo };
  if (cuerpo instanceof FormData) {
    opts.body = cuerpo;
  } else if (cuerpo) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(cuerpo);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`meta-social ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);
    err.code = data?.error?.code ? `META_${data.error.code}` : `HTTP_${res.status}`;
    err.raw = data;
    throw err;
  }
  if (data?.message_id) marcarPropio(data.message_id);
  return data;
}

// Messenger e Instagram (con login de Facebook) usan el mismo endpoint.
const rutaMensajes = () => `${process.env.META_PAGE_ID || 'me'}/messages`;

// ─── Envío ─────────────────────────────────────────────────────────

/**
 * WhatsApp entiende *negrita* y _cursiva_; Instagram y Messenger muestran los
 * asteriscos tal cual. Se quitan para que el mensaje se lea limpio.
 */
function textoPlano(texto) {
  return String(texto || '')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?])/g, '$1$2')
    .replace(/~([^~\n]+)~/g, '$1');
}

function destino(to) {
  const d = decodificar(to);
  if (!d) throw new Error(`destino social inválido: ${to}`);
  return d;
}

// Ids de lo que mandó Aura: Meta devuelve copia de cada mensaje ("eco") y así
// se distingue lo nuestro de lo que escribió una persona desde Instagram.
const propios = new Map();
function marcarPropio(mid) {
  if (!mid) return;
  const ahora = Date.now();
  if (propios.size > 2000) {
    for (const [k, t] of propios) if (ahora - t > 3600 * 1000) propios.delete(k);
  }
  propios.set(mid, ahora);
}
function esPropio(mid) {
  return propios.has(mid);
}

async function enviarMensaje(to, message) {
  const { id } = destino(to);
  const data = await graph('POST', rutaMensajes(), {
    recipient: { id },
    messaging_type: 'RESPONSE',
    message,
  });
  return { providerMessageId: data?.message_id || null, raw: data };
}

async function sendText({ to, text }) {
  if (!text) throw new Error('social.sendText: text requerido');
  // Messenger corta en 2.000 caracteres; Instagram en 1.000.
  const max = destino(to).canal === 'instagram' ? 1000 : 2000;
  return enviarMensaje(to, { text: textoPlano(text).slice(0, max) });
}

/**
 * Los botones y las listas de WhatsApp se vuelven "respuestas rápidas": las
 * burbujas que aparecen bajo el mensaje. Al tocarlas llega su payload, que es
 * el mismo id del botón, así que el bot las entiende igual que en WhatsApp.
 */
function respuestasRapidas(opciones) {
  return opciones.slice(0, 13).map((o) => ({
    content_type: 'text',
    title: String(o.title).slice(0, 20),
    payload: String(o.id).slice(0, 1000),
  }));
}

async function sendButtons({ to, bodyText, buttons }) {
  const max = destino(to).canal === 'instagram' ? 1000 : 2000;
  return enviarMensaje(to, {
    text: textoPlano(bodyText).slice(0, max),
    quick_replies: respuestasRapidas(buttons || []),
  });
}

async function sendList({ to, bodyText, sections }) {
  const filas = (sections || []).flatMap((s) => s.rows || []);
  const max = destino(to).canal === 'instagram' ? 1000 : 2000;
  return enviarMensaje(to, {
    text: textoPlano(bodyText).slice(0, max),
    quick_replies: respuestasRapidas(filas),
  });
}

// El material de Aura (fotos y video del centro) se sirve en una URL pública:
// Instagram no acepta subir el archivo, solo un enlace.
const CARPETA_MATERIAL = path.join(__dirname, '..', '..', 'assets', 'aura');
const MATERIAL_PUBLICO = new Set([
  'bienvenida.jpg', 'como-llegar.jpg', 'cuando-acudir.jpg', 'edificio.jpg',
  'por-que-oirconecta.jpg', 'recepcion.jpg', 'video-audifonos.mp4',
]);

function urlMaterial(filename) {
  const base = (process.env.API_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'https://oirconecta-api.onrender.com').replace(/\/$/, '');
  return `${base}/api/webhooks/aura-material/${encodeURIComponent(filename)}`;
}

async function sendMedia({ to, buffer, mime, filename, caption }) {
  const { canal } = destino(to);
  const tipo = String(mime).startsWith('image/') ? 'image'
    : String(mime).startsWith('video/') ? 'video' : 'file';

  let r;
  if (MATERIAL_PUBLICO.has(filename)) {
    r = await enviarMensaje(to, {
      attachment: { type: tipo, payload: { url: urlMaterial(filename), is_reusable: true } },
    });
  } else if (canal === 'messenger') {
    // Un archivo que manda una persona desde la bandeja: Messenger sí deja subirlo.
    const form = new FormData();
    form.append('recipient', JSON.stringify({ id: destino(to).id }));
    form.append('messaging_type', 'RESPONSE');
    form.append('message', JSON.stringify({ attachment: { type: tipo, payload: { is_reusable: false } } }));
    form.append('filedata', new Blob([buffer], { type: mime }), filename || 'archivo');
    const data = await graph('POST', rutaMensajes(), form);
    r = { providerMessageId: data?.message_id || null, raw: data };
  } else {
    throw new Error('Instagram no permite enviar archivos desde la bandeja. Envíalo desde la app de Instagram.');
  }

  // El pie de foto va como un mensaje aparte: estos canales no tienen caption.
  if (caption) await sendText({ to, text: caption }).catch(() => {});
  return { ...r, mediaId: null, tipo: tipo === 'file' ? 'document' : tipo };
}

/** Nombre de la persona, para saludarla como en WhatsApp. */
async function perfil(canal, id) {
  try {
    const campos = canal === 'instagram' ? 'name,username' : 'first_name,last_name';
    const d = await graph('GET', `${id}?fields=${campos}`);
    if (canal === 'instagram') return d.name || d.username || null;
    return [d.first_name, d.last_name].filter(Boolean).join(' ') || null;
  } catch (e) {
    console.warn('[social] no pude leer el perfil de', canal, e.message);
    return null;
  }
}

// ─── Comentarios ───────────────────────────────────────────────────

/**
 * Responde un comentario por mensaje privado ("respuesta privada" de Meta).
 * Meta permite una sola por comentario, dentro de los 7 días siguientes.
 */
async function respuestaPrivada(commentId, texto) {
  const data = await graph('POST', rutaMensajes(), {
    recipient: { comment_id: commentId },
    message: { text: textoPlano(texto).slice(0, 1000) },
  });
  return data;
}

/** Respuesta pública corta bajo el comentario, para que se vea que se atendió. */
async function respuestaPublica(canal, commentId, texto) {
  const ruta = canal === 'instagram' ? `${commentId}/replies` : `${commentId}/comments`;
  return graph('POST', ruta, { message: texto });
}

/**
 * Suscribe la página a la app para que Meta mande los eventos. Es idempotente:
 * se llama al arrancar y no hace daño repetirlo.
 */
async function suscribirPagina() {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId || !configurado()) return { skipped: true };
  try {
    const campos = 'messages,messaging_postbacks,message_echoes,messaging_referrals,feed';
    const d = await graph('POST', `${pageId}/subscribed_apps?subscribed_fields=${campos}`);
    console.log('[social] página suscrita a la app:', JSON.stringify(d));
    return d;
  } catch (e) {
    console.error('[social] no pude suscribir la página a la app:', e.message);
    return { error: e.message };
  }
}

module.exports = {
  codificar,
  decodificar,
  esSocial,
  nombreCanal,
  configurado,
  botHabilitado,
  sendText,
  sendButtons,
  sendList,
  sendMedia,
  perfil,
  respuestaPrivada,
  respuestaPublica,
  suscribirPagina,
  esPropio,
  textoPlano,
  CARPETA_MATERIAL,
  MATERIAL_PUBLICO,
};
