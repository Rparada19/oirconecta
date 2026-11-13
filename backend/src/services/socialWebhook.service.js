/**
 * Webhook de Instagram y Facebook (Messenger + comentarios).
 *
 * Meta manda aquí lo mismo que en WhatsApp pero con otra forma:
 *   object = 'instagram' → DMs de Instagram y comentarios de las publicaciones
 *   object = 'page'      → Messenger y comentarios de la página de Facebook
 *
 * Los mensajes se traducen a la forma de un mensaje de WhatsApp y entran por
 * el mismo camino (procesarMensajeCorporativo): quedan en la bandeja del CRM y
 * los atiende Aura con las mismas reglas. Ver socialChannel.service.
 *
 * Comentarios: a quien comenta una publicación se le escribe por privado
 * ("respuesta privada" de Meta) para llevarlo a hablar con Aura, y se le deja
 * una respuesta pública corta para que se vea que se atendió.
 */

const { PrismaClient } = require('@prisma/client');
const social = require('./socialChannel.service');

const prisma = new PrismaClient();

// Lo que ya se procesó, para los reintentos de Meta. Render corre una sola
// instancia; si se reinicia, el dedup por id en la base cubre los mensajes.
const vistos = new Map();
function yaVisto(clave) {
  const ahora = Date.now();
  if (vistos.size > 5000) {
    for (const [k, t] of vistos) if (ahora - t > 24 * 3600 * 1000) vistos.delete(k);
  }
  if (vistos.has(clave)) return true;
  vistos.set(clave, ahora);
  return false;
}

function idsPropios(entryId) {
  return new Set([entryId, process.env.META_PAGE_ID, process.env.META_IG_ACCOUNT_ID].filter(Boolean).map(String));
}

// ─── Mensajes directos ─────────────────────────────────────────────

/**
 * Convierte un evento de Messenger/Instagram en un mensaje con la forma que
 * entiende el bot de WhatsApp. Devuelve null si no hay nada que responder.
 */
function aMensajeWhatsApp(ev, phone) {
  const m = ev.message || null;
  const ts = Math.floor(Number(ev.timestamp || Date.now()) / 1000);
  const base = { from: phone, timestamp: String(ts) };

  // Anuncio de clic a Messenger / Instagram. Se pasa como el `referral` de
  // WhatsApp para que la atribución y el saludo del anuncio funcionen igual.
  const ref = ev.referral || m?.referral || ev.postback?.referral || null;
  const referral = ref && (ref.ad_id || ref.source === 'ADS')
    ? {
      source_type: 'ad',
      source_id: ref.ad_id || null,
      headline: ref.ads_context_data?.ad_title || null,
      body: null,
      source_url: ref.ads_context_data?.photo_url || ref.ads_context_data?.video_url || null,
    }
    : null;
  if (referral) base.referral = referral;

  if (m) {
    if (m.is_deleted || m.is_unsupported) return null;
    const id = m.mid;
    // Toque en una respuesta rápida: su payload es el id del botón que mandó Aura.
    if (m.quick_reply?.payload) {
      return { ...base, id, type: 'interactive', interactive: { button_reply: { id: m.quick_reply.payload, title: m.text || '' } } };
    }
    const adj = (m.attachments || [])[0];
    if (adj && !m.text) {
      const url = adj.payload?.url || null;
      if (adj.type === 'image' && url) return { ...base, id, type: 'image', image: { id: url, mime_type: 'image/jpeg' } };
      if (adj.type === 'audio' && url) return { ...base, id, type: 'audio', audio: { id: url } };
      if (adj.type === 'file' && url) return { ...base, id, type: 'document', document: { id: url, filename: 'archivo' } };
      const que = {
        video: '[video]',
        story_mention: '[te mencionó en su historia]',
        share: '[compartió una publicación]',
        ig_reel: '[compartió un reel]',
        reel: '[compartió un reel]',
        ig_post: '[compartió una publicación]',
        like_heart: '❤️',
        sticker: '👍',
      }[adj.type] || `[${adj.type || 'adjunto'}]`;
      return { ...base, id, type: 'text', text: { body: que } };
    }
    if (m.text) return { ...base, id, type: 'text', text: { body: m.text } };
    return null;
  }

  // Botón "Empezar" o una pregunta frecuente del perfil: se trata como si lo
  // hubiera escrito. Aura no manda botones de postback, así que no son suyos.
  if (ev.postback) {
    const texto = ev.postback.title || ev.postback.payload || '';
    const id = ev.postback.mid || `postback:${phone}:${ev.timestamp}`;
    return { ...base, id, type: 'text', text: { body: texto } };
  }

  // Abrió el chat desde un anuncio o un enlace sin escribir: lo saludamos.
  if (ev.referral) {
    return { ...base, id: `referral:${phone}:${ev.timestamp}`, type: 'request_welcome' };
  }
  return null;
}

async function nombreDe(canal, senderId, phone) {
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { phone }, select: { contactName: true },
  }).catch(() => null);
  if (conv?.contactName) return conv.contactName;
  return social.perfil(canal, senderId);
}

async function manejarMensaje(canal, entryId, ev) {
  if (ev.message?.is_echo) {
    // Espera unos segundos adentro: no se bloquea el resto de la tanda.
    manejarEco(canal, ev).catch((e) => console.error('[social] eco falló:', e.message));
    return;
  }
  if (!ev.message && !ev.postback && !ev.referral) return; // leído, entregado, reacción…

  const senderId = String(ev.sender?.id || '');
  if (!senderId || idsPropios(entryId).has(senderId)) return;

  const phone = social.codificar(canal, senderId);
  const msg = aMensajeWhatsApp(ev, phone);
  if (!msg || yaVisto(`msg:${msg.id}`)) return;

  const contactName = await nombreDe(canal, senderId, phone);
  const { procesarMensajeCorporativo } = require('./whatsappAgent.service');
  await procesarMensajeCorporativo({
    msg,
    phoneNumberId: null,
    contactByWaId: { [phone]: contactName },
    soloGuardar: !social.botHabilitado(),
  });
}

/**
 * Meta nos devuelve copia de cada mensaje que sale de la página o la cuenta.
 * Si no lo mandó Aura, lo escribió una persona del equipo desde Instagram o
 * desde Meta Business Suite: se guarda en la bandeja y Aura deja de responder
 * en ese chat, para no escribir encima.
 */
async function manejarEco(canal, ev) {
  const mid = ev.message?.mid;
  const recipientId = ev.recipient?.id;
  if (!mid || !recipientId) return;
  // La copia puede llegar antes de que guardemos lo que mandamos: se espera un poco.
  await new Promise((r) => setTimeout(r, 6000));
  if (social.esPropio(mid)) return;
  const nuestro = await prisma.whatsAppMessage.findFirst({ where: { wamid: mid }, select: { id: true } }).catch(() => null);
  if (nuestro) return;

  const phone = social.codificar(canal, recipientId);
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { phone }, select: { id: true, status: true },
  }).catch(() => null);
  if (!conv) return;

  const texto = ev.message.text || ((ev.message.attachments || []).length ? '[archivo]' : '');
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conv.id, wamid: mid, direction: 'OUTBOUND', type: 'text',
      body: texto || null, sentByBot: false, deliveryStatus: 'sent', timestamp: new Date(),
    },
  }).catch(() => {});
  await prisma.whatsAppConversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: `Equipo (${social.nombreCanal(phone)}): ${texto.slice(0, 120)}`,
      ...(conv.status === 'BOT' ? { status: 'HUMAN' } : {}),
    },
  }).catch(() => {});
  if (conv.status === 'BOT') {
    console.log('[social] alguien del equipo respondió desde', social.nombreCanal(phone), '— Aura se aparta de', conv.id);
  }
}

// ─── Comentarios ───────────────────────────────────────────────────

/** Solo emojis, menciones a amigos o una palabra suelta: no se le escribe. */
function vale(comentario) {
  const sinMenciones = String(comentario || '').replace(/@[\w.]+/g, '').trim();
  return /\p{L}{2,}/u.test(sinMenciones);
}

const PUBLICAS = {
  instagram: [
    '¡Hola! Te escribimos por mensaje directo 💬',
    '¡Gracias por comentar! Te enviamos un DM 😊',
    'Te respondimos por mensaje directo 💙',
  ],
  messenger: [
    '¡Hola! Te escribimos por Messenger 💬',
    '¡Gracias por comentar! Te enviamos un mensaje privado 😊',
    'Te respondimos por mensaje privado 💙',
  ],
};

function textoPrivado(nombre, comentario) {
  const hola = `¡Hola${nombre ? `, ${nombre}` : ''}! 👋 Soy Aura, de OírConecta. Vi tu comentario y te escribo por aquí para ayudarte mejor.`;
  if (/precio|cu[aá]nto|valor|cost|vale|tarifa/i.test(comentario)) {
    return `${hola}\n\nCon gusto te cuento los precios. ¿Es para ti o para alguien de tu familia? Y ¿estás en Bogotá?`;
  }
  if (/d[oó]nde|direcci[oó]n|ubica|sede|queda/i.test(comentario)) {
    return `${hola}\n\nEstamos en Bogotá y con gusto te explico cómo llegar. ¿Te gustaría agendar una valoración auditiva?`;
  }
  return `${hola}\n\n¿Qué te gustaría saber? Te puedo contar de la valoración auditiva, los audífonos y los precios, y si quieres te agendo una cita.`;
}

async function manejarComentario(canal, entryId, { commentId, texto, autorId, autorNombre }) {
  const modo = process.env.SOCIAL_COMENTARIOS || 'dm+publico';
  if (modo === 'off' || !social.botHabilitado()) return;
  if (!commentId || !autorId || idsPropios(entryId).has(String(autorId))) return;
  if (!vale(texto) || yaVisto(`comment:${commentId}`)) return;

  const nombre = canal === 'messenger' ? String(autorNombre || '').split(/\s+/)[0] : null;
  const privado = textoPrivado(nombre, texto);
  let enviado;
  try {
    enviado = await social.respuestaPrivada(commentId, privado);
  } catch (e) {
    // Lo normal: ya se le respondió por privado (Meta deja una sola vez) o
    // el comentario tiene más de 7 días.
    console.warn('[social] respuesta privada al comentario', commentId, 'no salió:', e.message);
    return;
  }

  if (modo === 'dm+publico') {
    const opciones = PUBLICAS[canal];
    social.respuestaPublica(canal, commentId, opciones[Math.floor(Math.random() * opciones.length)])
      .catch((e) => console.warn('[social] respuesta pública no salió:', e.message));
  }

  // Meta devuelve el id de la persona en el chat: se abre la conversación ya
  // con el comentario y nuestro mensaje, para que cuando conteste Aura sepa de
  // dónde viene y no vuelva a saludar como si nada.
  const destinatario = enviado?.recipient_id;
  if (!destinatario) return;
  try {
    const phone = social.codificar(canal, destinatario);
    const nombreCompleto = canal === 'messenger' ? autorNombre : await social.perfil(canal, destinatario);
    const existente = await prisma.whatsAppConversation.findUnique({ where: { phone }, select: { id: true } });
    const conv = existente || await prisma.whatsAppConversation.create({
      data: {
        phone,
        contactName: nombreCompleto || null,
        businessLine: 'CRM',
        intent: 'SIN_CLASIFICAR',
        // Quien comenta una publicación del centro es, casi siempre, paciente.
        contactType: 'PACIENTE_BOGOTA',
        status: process.env.WA_BOT_ENABLED === 'true' ? 'BOT' : 'HUMAN',
      },
    });
    const ahora = new Date();
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id, direction: 'INBOUND', type: 'text',
        body: `[comentó en una publicación de ${canal === 'instagram' ? 'Instagram' : 'Facebook'}] ${texto}`,
        timestamp: new Date(ahora.getTime() - 1000),
      },
    });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id, wamid: enviado.message_id || null, direction: 'OUTBOUND', type: 'text',
        body: privado, sentByBot: true, deliveryStatus: 'sent', timestamp: ahora,
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: ahora, lastMessagePreview: `Bot: ${privado.slice(0, 140)}` },
    });
    require('./alertaEquipo.service').avisar({
      titulo: 'Comentario en redes — Aura le escribió por privado',
      quien: nombreCompleto || autorNombre || 'Sin nombre',
      telefono: phone,
      texto,
    }).catch(() => {});
  } catch (e) {
    console.error('[social] no pude guardar la conversación del comentario:', e.message);
  }
}

async function manejarCambio(canal, entryId, ch) {
  const v = ch?.value || {};
  // Comentario en una publicación de Instagram.
  if (canal === 'instagram' && ch.field === 'comments') {
    if (v.parent_id) return; // respuesta a otro comentario (también a las nuestras)
    return manejarComentario(canal, entryId, {
      commentId: v.id, texto: v.text, autorId: v.from?.id, autorNombre: v.from?.username,
    });
  }
  // Comentario en una publicación de la página de Facebook.
  if (canal === 'messenger' && ch.field === 'feed' && v.item === 'comment' && v.verb === 'add') {
    if (v.parent_id && v.parent_id !== v.post_id) return; // respuesta a otro comentario
    return manejarComentario(canal, entryId, {
      commentId: v.comment_id, texto: v.message, autorId: v.from?.id, autorNombre: v.from?.name,
    });
  }
}

// ─── Entrada ───────────────────────────────────────────────────────

async function processSocialEvent(body) {
  const canal = body?.object === 'instagram' ? 'instagram' : body?.object === 'page' ? 'messenger' : null;
  if (!canal) return { ok: true, ignored: 'OBJECT_MISMATCH' };
  let procesados = 0;
  for (const entry of (body.entry || [])) {
    const entryId = String(entry.id || '');
    // Resumen sin contenido: qué tipo de evento llegó, para diagnosticar.
    const tipos = (entry.messaging || []).map((ev) => (ev.message?.is_echo ? 'eco'
      : ev.message ? 'mensaje' : ev.postback ? 'postback' : ev.referral ? 'referral'
        : Object.keys(ev).filter((k) => !['sender', 'recipient', 'timestamp'].includes(k)).join('+') || 'otro'));
    console.log('[social] llegó', canal, 'entry', entryId,
      'messaging:', tipos.join(',') || '-',
      'standby:', (entry.standby || []).length,
      'changes:', (entry.changes || []).map((c) => c.field).join(',') || '-');
    for (const ev of (entry.messaging || [])) {
      try {
        await manejarMensaje(canal, entryId, ev);
        procesados++;
      } catch (e) {
        console.error('[social] mensaje de', canal, 'falló:', e.message);
      }
    }
    for (const ch of (entry.changes || [])) {
      try {
        await manejarCambio(canal, entryId, ch);
      } catch (e) {
        console.error('[social] cambio', ch?.field, 'de', canal, 'falló:', e.message);
      }
    }
  }
  return { ok: true, canal, procesados };
}

module.exports = { processSocialEvent, aMensajeWhatsApp, vale, textoPrivado };
