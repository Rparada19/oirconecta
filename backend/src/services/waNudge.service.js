/**
 * A1 — Follow-up automático post-link /agendar.
 *
 * Cuando el bot le manda al paciente el link https://oirconecta.com/agendar
 * se marca `agendarLinkSentAt` en la conversación. Este servicio corre
 * cada minuto desde el cron y hace dos cosas:
 *
 *   1. NUDGE (25-40 min sin agendar) — reengancha con un texto amistoso
 *      recordándole los horarios y ofreciendo ayuda.
 *   2. ESCALACIÓN (>2h sin agendar) — mueve la conversación a ESCALATED
 *      para que el humano de la bandeja tome el caso.
 *
 * En cualquier momento, si detecta que el paciente ya creó una cita
 * (match por teléfono normalizado en Appointment), marca `agendarBookedAt`
 * y detiene el proceso.
 *
 * Reglas:
 *  - Solo actúa dentro de la ventana Meta de 24h (`windowExpiresAt > now`).
 *    Fuera de la ventana solo se puede mandar HSM, no texto libre.
 *  - Solo dispara si el bot está habilitado (WA_BOT_ENABLED=true).
 *  - Guard optimista: marca el timestamp antes de enviar; si el envío
 *    falla, lo revierte para reintentar en el siguiente tick.
 */

const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppText } = require('../notifications/channels/whatsapp');

const prisma = new PrismaClient();

const NUDGE_MIN_MINUTES = 25;
const NUDGE_MAX_MINUTES = 40;
const ESCALATE_AFTER_MINUTES = 120;
const BATCH_LIMIT = 20;

/** Normaliza teléfonos para matching. Deja solo dígitos y toma los últimos 10. */
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  return digits.slice(-10);
}

/**
 * Busca si el paciente ya agendó una cita después del momento en que se le
 * mandó el link. Match por teléfono normalizado (últimos 10 dígitos).
 */
async function findMatchingAppointment({ waPhone, sinceDate }) {
  const target = normalizePhone(waPhone);
  if (!target) return null;

  // Ventana amplia: cualquier cita creada después del link, aunque la fecha
  // de la cita sea futura. Buscamos por createdAt de la cita.
  const candidates = await prisma.appointment.findMany({
    where: {
      createdAt: { gte: sinceDate },
      patientPhone: { not: null },
      estado: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { id: true, patientPhone: true, fecha: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return candidates.find((a) => normalizePhone(a.patientPhone) === target) || null;
}

const NUDGE_TEXT =
`¿Pudiste abrir el enlace? 👋

Si prefieres, dime qué día te queda mejor y yo te busco los horarios. También puedes agendar directo aquí:

👉 https://oirconecta.com/agendar`;

/**
 * Paso 1: envía nudge a conversaciones que llevan 25-40 min con el link
 * sin agendar. Verifica primero si ya agendaron para no molestar.
 */
async function processNudges() {
  const now = new Date();
  const maxAgo = new Date(now.getTime() - NUDGE_MAX_MINUTES * 60 * 1000);
  const minAgo = new Date(now.getTime() - NUDGE_MIN_MINUTES * 60 * 1000);

  const due = await prisma.whatsAppConversation.findMany({
    where: {
      agendarLinkSentAt: { gte: maxAgo, lte: minAgo },
      agendarNudgeSentAt: null,
      agendarBookedAt: null,
      status: { in: ['BOT', 'ESCALATED'] },
      // Debe haber ventana Meta abierta (última entrada del cliente < 24h)
      windowExpiresAt: { gt: now },
    },
    select: {
      id: true, phone: true, contactType: true, agendarLinkSentAt: true,
    },
    take: BATCH_LIMIT,
  });

  let sent = 0, booked = 0, failed = 0;
  for (const conv of due) {
    try {
      // ¿Ya agendó? → marcamos booked y skip
      const appt = await findMatchingAppointment({
        waPhone: conv.phone, sinceDate: conv.agendarLinkSentAt,
      });
      if (appt) {
        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: { agendarBookedAt: now },
        });
        booked++;
        continue;
      }

      // Claim optimista: marca antes de enviar
      const claim = await prisma.whatsAppConversation.updateMany({
        where: { id: conv.id, agendarNudgeSentAt: null },
        data: { agendarNudgeSentAt: now },
      });
      if (claim.count === 0) continue;

      try {
        const result = await sendWhatsAppText({ to: conv.phone, text: NUDGE_TEXT });
        await prisma.whatsAppMessage.create({
          data: {
            conversationId: conv.id,
            wamid: result?.providerMessageId || null,
            direction: 'OUTBOUND',
            type: 'text',
            body: NUDGE_TEXT,
            sentByBot: true,
            deliveryStatus: 'sent',
            timestamp: now,
          },
        });
        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: {
            lastMessageAt: now,
            lastMessagePreview: 'Bot: nudge de agendamiento (30 min)',
          },
        });
        sent++;
      } catch (e) {
        // Revertir claim para reintentar
        await prisma.whatsAppConversation.updateMany({
          where: { id: conv.id, agendarNudgeSentAt: { not: null } },
          data: { agendarNudgeSentAt: null },
        });
        throw e;
      }
    } catch (e) {
      console.error('[wa-nudge] nudge conv', conv.id, 'falló:', e.message);
      failed++;
    }
  }

  return { scanned: due.length, sent, booked, failed };
}

/**
 * Paso 2: escala a humano las conversaciones que llevan >2h con el link
 * y no agendaron. Cambia status a ESCALATED e incrementa unreadCount.
 */
async function processEscalations() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - ESCALATE_AFTER_MINUTES * 60 * 1000);

  const due = await prisma.whatsAppConversation.findMany({
    where: {
      agendarLinkSentAt: { lte: cutoff },
      agendarEscalatedAt: null,
      agendarBookedAt: null,
      status: 'BOT',
    },
    select: { id: true, phone: true, agendarLinkSentAt: true, contactName: true },
    take: BATCH_LIMIT,
  });

  let escalated = 0, booked = 0, failed = 0;
  for (const conv of due) {
    try {
      // Doble check: ¿ya agendó?
      const appt = await findMatchingAppointment({
        waPhone: conv.phone, sinceDate: conv.agendarLinkSentAt,
      });
      if (appt) {
        await prisma.whatsAppConversation.update({
          where: { id: conv.id },
          data: { agendarBookedAt: now },
        });
        booked++;
        continue;
      }

      const label = conv.contactName ? conv.contactName : conv.phone;
      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          status: 'ESCALATED',
          agendarEscalatedAt: now,
          unreadCount: { increment: 1 },
          lastMessagePreview: `🔔 ${label} no agendó tras 2h — requiere seguimiento`,
        },
      });
      escalated++;
    } catch (e) {
      console.error('[wa-nudge] escalación conv', conv.id, 'falló:', e.message);
      failed++;
    }
  }

  return { scanned: due.length, escalated, booked, failed };
}

/** Barrida completa: nudge + escalación. */
async function processWaAgendarNudges() {
  if (process.env.WA_BOT_ENABLED !== 'true') {
    return { skipped: 'bot-disabled' };
  }
  const nudgeResult = await processNudges();
  const escResult = await processEscalations();
  return {
    nudge: nudgeResult,
    escalate: escResult,
    total: {
      sent: nudgeResult.sent + escResult.escalated,
      booked: nudgeResult.booked + escResult.booked,
      failed: nudgeResult.failed + escResult.failed,
    },
  };
}


// ─── Silencio: escribió el bot y nadie contestó ──────────────
//
// El nudge de arriba solo existe si se mandó el link de agendar. Pero desde
// que el bot agenda dentro del chat, casi nunca lo manda — y entonces quien
// escribe una vez, recibe respuesta y se calla no vuelve a saber de nosotros
// nunca. Con campañas corriendo, ese es el clic que ya se pagó.
//
// Dos reintentos y se suelta:
//   · A las 3h — retomar con una pregunta más fácil que la anterior.
//   · A las 20h — despedida honesta, antes de que se cierre la ventana de 24h
//     de Meta (pasada esa hora solo se puede mandar plantilla aprobada).

const SILENCIO_1_HORAS = 3;
const SILENCIO_2_HORAS = 20;

const DESPEDIDA =
`No quiero incomodarte, así que te escribo por última vez. 🙂

Si en algún momento quieres resolver una duda sobre tu audición —o la de alguien de tu casa— aquí estoy. Escríbeme cuando quieras, sin compromiso.`;

/**
 * Arma el mensaje para retomar.
 *
 * NO lo redacta la IA, y es a propósito. El primer intento sí: se le pasaba la
 * conversación y se le pedía "una pregunta más fácil que la anterior". Con esa
 * instrucción se inventó un tema nuevo — le preguntó a un referido si vivía en
 * Cartagena o en Bogotá, dos ciudades que nunca mencionó, y le habló de "tu
 * cita" cuando no había ninguna. Pedirle originalidad a un mensaje cuyo único
 * trabajo es insistir es pedirle que alucine.
 *
 * Lo que hace ahora: repite la última pregunta que quedó sin respuesta. Es
 * imposible que invente, y además es lo que haría una persona.
 */
function armarRetoma(conv, ultimoTextoBot) {
  const limpio = require('./waCorporateBot.service').nombreParaSaludo(conv.contactName);
  const nombre = limpio ? `, ${limpio}` : '';

  // La última pregunta del bot: se corta el mensaje en frases y se toma la
  // última que termine en "?". Sirve igual con un saludo de cinco párrafos que
  // con una línea suelta.
  const cuerpo = String(ultimoTextoBot || '').replace(/\s+/g, ' ').trim();
  const preguntas = cuerpo.match(/[^.!?\n]*\?/g) || [];
  const pendiente = preguntas.length
    ? preguntas[preguntas.length - 1].trim()
    : null;

  if (pendiente && pendiente.length <= 160) {
    return `Quedé pendiente de tu respuesta${nombre} 🙂\n\n${pendiente}`;
  }
  return `Quedé pendiente de ti${nombre} 🙂\n\nCuéntame en qué te puedo ayudar y seguimos.`;
}

/**
 * ¿Esta conversación ya se cerró bien?
 *
 * Jhonjairo escribió "ok mil gracias", el bot le contestó "un placer, acá estoy
 * cuando me necesites" — y tres horas después le volvió a escribir "quedé
 * pendiente de ti, cuéntame en qué te puedo ayudar y seguimos". No quedó nada
 * pendiente: se despidieron. Insistirle a alguien que ya se despidió no es
 * hacer seguimiento, es no haber leído la conversación.
 *
 * Se mira por los dos lados, porque cerrar lo puede hacer cualquiera de los
 * dos: él dando las gracias, o nosotros despidiéndonos.
 */
const CIERRE_DEL_PACIENTE = /^(ok(ay)?|oki|listo|dale|bueno|perfecto|va|dgracias)?[\s,.!]*((muchas|mil|much[ií]simas)\s+)?gracias|^(ok(ay)?|listo|dale|perfecto|de una)[\s,.!]*$|hasta luego|nos vemos|que est[eé]s bien|buen d[ií]a$/i;

const CIERRE_NUESTRO = /ac[áa] estoy cuando|aqu[ií] estoy cuando|cuando est[eé]s listo|un placer|que te vaya bien|escr[ií]beme cuando quieras|quedo atento|aqu[ií] quedo|ac[áa] quedo|con gusto.{0,20}cuando (quieras|necesites)/i;

// "Te aviso", "lo voy a pensar", "no gracias": también es cerrar, aunque venga
// en un mensaje largo. A José le escribimos "quedé pendiente de ti" tres horas
// después de que dijo "voy a analizar el tema y luego les comento".
const APLAZA_EL_PACIENTE = /\b(te|le|les) (aviso|comento|confirmo)\b|lo (voy a|vamos a) (pensar|consultar|analizar|mirar)|voy a (analizar|consultar|pensar|mirar)|(te|le|les) escribo (luego|despu[eé]s|cuando)|estar[eé] en contacto|por ahora no|no,? gracias|ya resolv[ií]/i;

async function conversacionYaSeDespidio(conversationId) {
  const ultimos = await prisma.whatsAppMessage.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'desc' },
    take: 4,
    select: { direction: true, body: true },
  });

  const ultimoDelPaciente = ultimos.find((m) => m.direction === 'INBOUND');
  const ultimoNuestro = ultimos.find((m) => m.direction === 'OUTBOUND');

  // "Gracias" con una pregunta detrás no es una despedida: es alguien
  // esperando respuesta. Y lo que se despide se despide corto.
  const suyo = String(ultimoDelPaciente?.body || '').trim();
  const seDespidioEl = Boolean(ultimoDelPaciente)
    && !/[?¿]/.test(suyo)
    && suyo.length <= 60
    && CIERRE_DEL_PACIENTE.test(suyo);
  const nosDespedimos = ultimoNuestro
    && CIERRE_NUESTRO.test(String(ultimoNuestro.body || ''));
  const aplazo = APLAZA_EL_PACIENTE.test(suyo);

  return Boolean(seDespidioEl || nosDespedimos || aplazo);
}

async function enviarYGuardar(conv, texto, campo) {
  // Claim optimista: se marca antes de enviar y se revierte si falla.
  const claim = await prisma.whatsAppConversation.updateMany({
    where: { id: conv.id, [campo]: null },
    data: { [campo]: new Date() },
  });
  if (claim.count === 0) return false;
  try {
    const result = await sendWhatsAppText({ to: conv.phone, text: texto });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'text',
        body: texto,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date(), lastMessagePreview: `Bot: ${texto.slice(0, 100)}` },
    });
    return true;
  } catch (e) {
    console.error('[wa-silencio] envío falló:', e.message);
    await prisma.whatsAppConversation.updateMany({
      where: { id: conv.id }, data: { [campo]: null },
    });
    return false;
  }
}

/**
 * Recorre las conversaciones calladas y manda el reintento que toque.
 * Solo actúa si el bot sigue a cargo (status BOT): si un humano tomó la
 * conversación, meterse sería atropellarlo.
 */
async function processSilencios() {
  if (process.env.WA_BOT_ENABLED !== 'true') return { skipped: 'bot-disabled' };
  const ahora = new Date();
  let retomas = 0, despedidas = 0, cerradas = 0;

  const candidatas = await prisma.whatsAppConversation.findMany({
    where: {
      status: 'BOT',
      businessLine: 'CRM',
      agendarBookedAt: null,
      windowExpiresAt: { gt: ahora },      // dentro de la ventana de 24h de Meta
      silencio2At: null,
      lastMessageAt: { lt: new Date(ahora.getTime() - SILENCIO_1_HORAS * 3600 * 1000) },
    },
    select: {
      id: true, phone: true, contactName: true, contactType: true,
      lastMessageAt: true, silencio1At: true, silencio2At: true,
    },
    orderBy: { lastMessageAt: 'asc' },
    take: BATCH_LIMIT,
  });

  for (const conv of candidatas) {
    try {
      // El último mensaje tiene que ser NUESTRO. Si el último es del paciente,
      // no está callado: está esperando respuesta, y eso es otro problema.
      const ultimo = await prisma.whatsAppMessage.findFirst({
        where: { conversationId: conv.id },
        orderBy: { timestamp: 'desc' },
        select: { direction: true },
      });
      if (ultimo?.direction !== 'OUTBOUND') continue;

      // Se despidieron: aquí no hay silencio que retomar. Ni retoma ni
      // despedida — la despedida solo sale después de una retoma, así que
      // saltarse esta conversación la deja en paz de verdad.
      if (await conversacionYaSeDespidio(conv.id)) { cerradas++; continue; }

      // Ya tiene cita: a Hellen le llegó "no quiero ser inoportuno, te escribo
      // por última vez" al día siguiente de agendar. agendarBookedAt no se
      // marca cuando la cita la crea el equipo o la web.
      const cita = await findMatchingAppointment({
        waPhone: conv.phone, sinceDate: new Date(ahora.getTime() - 30 * 86400000),
      });
      if (cita) { cerradas++; continue; }

      // Una persona del equipo ya entró a la conversación: el recordatorio
      // automático encima de ella la atropella.
      const humano = await prisma.whatsAppMessage.findFirst({
        where: {
          conversationId: conv.id, direction: 'OUTBOUND', sentByBot: false, type: 'text',
          timestamp: { gte: new Date(ahora.getTime() - 48 * 3600000) },
        },
        select: { id: true },
      });
      if (humano) { cerradas++; continue; }

      const horas = (ahora - new Date(conv.lastMessageAt)) / 3600000;

      if (!conv.silencio1At) {
        const previo = await prisma.whatsAppMessage.findFirst({
          where: { conversationId: conv.id, direction: 'OUTBOUND' },
          orderBy: { timestamp: 'desc' },
          select: { body: true },
        });
        // Si lo último fue "no pude escuchar tu nota de voz", repetírselo tres
        // horas después no retoma nada.
        if (String(previo?.body || '').startsWith('Me llegó tu nota de voz')) { cerradas++; continue; }
        const texto = armarRetoma(conv, previo?.body);
        if (await enviarYGuardar(conv, texto, 'silencio1At')) retomas++;
      } else if (horas >= SILENCIO_2_HORAS - SILENCIO_1_HORAS) {
        // La segunda se mide desde la primera retoma, no desde el silencio
        // original: si no, las dos caerían casi juntas.
        if (await enviarYGuardar(conv, DESPEDIDA, 'silencio2At')) despedidas++;
      }
    } catch (e) {
      console.error('[wa-silencio] conversación', conv.id, 'falló:', e.message);
    }
  }

  if (retomas || despedidas || cerradas) {
    console.log('[wa-silencio] retomas:', retomas, 'despedidas:', despedidas, 'ya cerradas:', cerradas);
  }
  return { retomas, despedidas, cerradas, revisadas: candidatas.length };
}


// ─── Recuperar los chats abiertos con la oferta ──────────────
//
// Diecisiete personas llegaron por los anuncios y una sola agendó. A la
// mayoría el bot les abrió con "cuesta $150.000" antes de contarles que
// agendando hoy no cuesta nada. Esto les lleva esa información.
//
// El texto NO lo escribe la IA: es un mensaje de una sola frase con un dato
// concreto, y ya aprendimos que pedirle originalidad a un mensaje así es
// pedirle que invente. Aquí además llevaría un número —los cupos— que no puede
// equivocarse.
//
// Solo se manda UNA vez por conversación, y solo dentro de la ventana de 24h
// de Meta: fuera de ella haría falta una plantilla aprobada, que no existe.

function textoRecuperacion(nombre, cupos) {
  const saludo = nombre ? `Hola, ${String(nombre).split(/\s+/)[0]}` : 'Hola';
  const cuantos = cupos?.quedan
    ? `Nos quedan *${cupos.quedan} cupos* de valoración auditiva sin costo esta semana.`
    : 'Tenemos cupos de valoración auditiva sin costo esta semana.';
  return `${saludo} 👋 Te escribo por algo que no te alcancé a contar.

${cuantos} Si dejas tu cita agendada hoy, tomas uno — y la programas para el día que te sirva, no tienes que venir hoy.

¿Te busco un horario?`;
}

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun] — solo cuenta, no envía.
 * @param {boolean} [opts.conPlantilla] — a los que quedaron fuera de la ventana
 *   de 24h, escribirles con la plantilla `cupo_sin_costo`. Requiere que Meta ya
 *   la haya aprobado; si no, el envío falla y se cuenta como fallido.
 */
/**
 * Mensajes que quedaron sin respuesta.
 *
 * Antes de contestar, el bot junta lo que llega dentro de 9 segundos (para no
 * responder tres veces a quien escribe en tres renglones). Esa cola vive en la
 * memoria del proceso: si Render reinicia —un despliegue, o el plan free que
 * se duerme— el mensaje se pierde y nadie lo contesta jamás. Le pasó al aliado
 * que escribió "Vengo de Plug-e" un minuto antes de un deploy.
 *
 * Esto lo recoge: si el último mensaje de la conversación es del paciente y
 * lleva más de dos minutos sin respuesta, se contesta.
 */
const ESPERA_ANTES_DE_RESCATAR_MIN = 2;

async function responderPendientes() {
  if (process.env.WA_BOT_ENABLED !== 'true') return { skipped: 'bot-disabled' };
  const ahora = new Date();
  const candidatas = await prisma.whatsAppConversation.findMany({
    where: {
      status: 'BOT',
      windowExpiresAt: { gt: ahora },
      lastMessageAt: { lt: new Date(ahora.getTime() - ESPERA_ANTES_DE_RESCATAR_MIN * 60000) },
    },
    select: { id: true, phone: true, lastMessagePreview: true },
    // De la más reciente a la más vieja: al revés, las diez conversaciones
    // antiguas y ya contestadas se comían el cupo y la que esperaba respuesta
    // —la última— nunca se miraba.
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });

  let rescatados = 0;
  for (const conv of candidatas) {
    try {
      // Atajo barato: si lo último lo escribimos nosotros, no hay nada que
      // rescatar y nos ahorramos la consulta de mensajes.
      if (/^(Bot|Tú):/.test(String(conv.lastMessagePreview || ''))) continue;
      const ultimo = await prisma.whatsAppMessage.findFirst({
        where: { conversationId: conv.id },
        orderBy: { timestamp: 'desc' },
        select: { direction: true, body: true, type: true },
      });
      if (!ultimo || ultimo.direction !== 'INBOUND' || !ultimo.body) continue;
      console.warn('[wa-rescate] sin responder desde hace rato:', conv.phone);
      await require('./waCorporateBot.service').handleTextForBot({
        conversationId: conv.id,
        incomingText: ultimo.body,
        desdeAudio: ultimo.type === 'audio',
      });
      rescatados++;
    } catch (e) {
      console.error('[wa-rescate] conversación', conv.id, 'falló:', e.message);
    }
  }
  if (rescatados) console.log('[wa-rescate] contestados', rescatados);
  return { rescatados, revisadas: candidatas.length };
}

/**
 * Envío masivo de texto libre a los chats abiertos — para una oferta puntual.
 *
 * Solo llega a quien escribió en las últimas 24h: fuera de esa ventana Meta
 * exige plantilla aprobada, y mandarlo igual quema el número.
 *
 * Quedan por fuera, sin que haya que acordarse: los que ya tienen cita, los
 * que dijeron que viven en otra ciudad, los que pidieron que no les
 * escribiéramos, y los que ya recibieron este mismo mensaje.
 */
const VIVE_EN_OTRA_CIUDAD = /villavicencio|c[úu]cuta|manizales|pereira|medell[íi]n|neiva|duitama|chaparral|popay[áa]n|cartagena|barranquilla|\bcali\b|ibagu[ée]|bucaramanga|santa marta|monter[íi]a|pasto|tunja|armenia|villavo|yopal|valledupar|sincelejo|facatativ[áa]|chaparral|no puedo viajar/i;
const PIDIO_QUE_NO = /no,? gracias|no me interesa|ya resolv[ií]|no vuelvan|no escriban|d[ée]jenme|no quiero/i;

async function envioMasivoTexto({ texto, dryRun = true } = {}) {
  const cuerpo = String(texto || '').trim();
  if (cuerpo.length < 20) throw new Error('El texto está muy corto.');
  const ahora = new Date();
  const huella = cuerpo.slice(0, 40);

  const convs = await prisma.whatsAppConversation.findMany({
    where: {
      businessLine: 'CRM',
      agendarBookedAt: null,
      windowExpiresAt: { gt: ahora },   // dentro de las 24h de Meta
    },
    select: { id: true, phone: true, contactName: true },
  });

  const destinatarios = [];
  const descartados = { conCita: 0, otraCiudad: 0, pidioQueNo: 0, yaRecibio: 0 };
  for (const conv of convs) {
    const suyos = await prisma.whatsAppMessage.findMany({
      where: { conversationId: conv.id, direction: 'INBOUND' },
      select: { body: true },
    });
    const dicho = suyos.map((m) => m.body || '').join(' ');
    if (VIVE_EN_OTRA_CIUDAD.test(dicho)) { descartados.otraCiudad++; continue; }
    if (PIDIO_QUE_NO.test(dicho)) { descartados.pidioQueNo++; continue; }
    if (await findMatchingAppointment({ waPhone: conv.phone, sinceDate: new Date(ahora.getTime() - 120 * 86400000) })) {
      descartados.conCita++; continue;
    }
    const repetido = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: conv.id, direction: 'OUTBOUND', body: { startsWith: huella } },
      select: { id: true },
    });
    if (repetido) { descartados.yaRecibio++; continue; }
    destinatarios.push(conv);
  }

  if (dryRun) return { dryRun: true, destinatarios: destinatarios.length, descartados };

  const bot = require('./waCorporateBot.service');
  const corp = require('./waCorporate.service');
  let enviados = 0; const fallidos = [];
  for (const conv of destinatarios) {
    const nombre = bot.nombreParaSaludo(conv.contactName);
    const personal = cuerpo.replace(/\{\{nombre\}\}/g, nombre ? `, ${nombre}` : '');
    try {
      await corp.sendTextToConversation({ conversationId: conv.id, text: personal, sentByBot: true });
      enviados++;
    } catch (e) {
      fallidos.push({ phone: conv.phone, error: e.message });
    }
  }
  console.log('[wa-masivo] enviados', enviados, 'de', destinatarios.length);
  return { enviados, destinatarios: destinatarios.length, fallidos, descartados };
}

async function recuperarConversaciones({ dryRun = false, conPlantilla = false } = {}) {
  const ahora = new Date();
  const abiertas = await prisma.whatsAppConversation.findMany({
    where: {
      businessLine: 'CRM',
      status: { not: 'CLOSED' },
      recuperadoAt: null,
      agendarBookedAt: null,
      // A quien ya le dijimos "no quiero ser inoportuno, te escribo por
      // última vez" no se le vuelve a escribir. Lo prometimos por escrito, y
      // una campaña encima de esa frase la convierte en mentira.
      silencio2At: null,
      contactType: { in: ['PACIENTE_BOGOTA', 'INFO_GENERAL', 'OTROS'] },
    },
    select: {
      id: true, phone: true, contactName: true, patientId: true,
      windowExpiresAt: true,
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 200,
  });

  let enviados = 0, fueraDeVentana = 0, yaTenianCita = 0, fallidos = 0, porPlantilla = 0;
  const bot = require('./waCorporateBot.service');
  const cupos = await bot.cuposDelBeneficio?.().catch(() => null);

  const corp = require('./waCorporate.service');

  for (const conv of abiertas) {
    // Fuera de la ventana de 24h Meta no acepta texto libre: solo plantilla
    // aprobada. `cupo_sin_costo` existe justo para esto.
    const dentroDeVentana = conv.windowExpiresAt && conv.windowExpiresAt > ahora;
    if (!dentroDeVentana && !conPlantilla) { fueraDeVentana++; continue; }

    // Si ya tiene cita, esto sobra y molesta.
    const last10 = String(conv.phone || '').replace(/\D/g, '').slice(-10);
    if (last10) {
      const cita = await prisma.appointment.findFirst({
        where: {
          patientPhone: { contains: last10 },
          estado: { in: ['CONFIRMED', 'COMPLETED', 'PATIENT'] },
        },
        select: { id: true },
      }).catch(() => null);
      if (cita) { yaTenianCita++; continue; }
    }

    if (dryRun) {
      if (dentroDeVentana) enviados++; else porPlantilla++;
      continue;
    }

    // Fuera de ventana: plantilla. La conversación no se "reabre" hasta que la
    // persona conteste, así que aquí no hay texto libre posible.
    if (!dentroDeVentana) {
      const claimP = await prisma.whatsAppConversation.updateMany({
        where: { id: conv.id, recuperadoAt: null },
        data: { recuperadoAt: ahora },
      });
      if (claimP.count === 0) continue;
      try {
        await corp.sendTemplateToExistingConversation({
          conversationId: conv.id,
          templateKey: 'cupo_sin_costo',
          variables: {
            nombre: (conv.contactName || 'hola').split(/\s+/)[0],
            cupos: String(cupos?.quedan ?? ''),
          },
        });
        porPlantilla++;
      } catch (e) {
        console.error('[wa-recuperar] plantilla falló a', conv.phone, e.message);
        await prisma.whatsAppConversation.updateMany({
          where: { id: conv.id }, data: { recuperadoAt: null },
        });
        fallidos++;
      }
      continue;
    }

    const texto = textoRecuperacion(conv.contactName, cupos);
    const claim = await prisma.whatsAppConversation.updateMany({
      where: { id: conv.id, recuperadoAt: null },
      data: { recuperadoAt: ahora },
    });
    if (claim.count === 0) continue;
    try {
      const result = await sendWhatsAppText({ to: conv.phone, text: texto });
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          wamid: result?.providerMessageId || null,
          direction: 'OUTBOUND',
          type: 'text',
          body: texto,
          sentByBot: true,
          deliveryStatus: 'sent',
          timestamp: new Date(),
        },
      });
      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: 'Bot: recuperación — cupos sin costo',
          status: 'BOT',
        },
      });
      enviados++;
    } catch (e) {
      console.error('[wa-recuperar] envío falló a', conv.phone, e.message);
      await prisma.whatsAppConversation.updateMany({
        where: { id: conv.id }, data: { recuperadoAt: null },
      });
      fallidos++;
    }
  }

  return { revisadas: abiertas.length, enviados, porPlantilla, fueraDeVentana, yaTenianCita, fallidos };
}

module.exports = {
  processWaAgendarNudges,
  recuperarConversaciones,
  envioMasivoTexto,
  responderPendientes,
  processSilencios,
  processNudges,
  processEscalations,
  normalizePhone,
  NUDGE_TEXT,
};
