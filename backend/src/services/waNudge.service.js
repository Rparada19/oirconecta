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
`No quiero ser inoportuno, así que te escribo por última vez. 🙂

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
  const nombre = conv.contactName ? `, ${String(conv.contactName).split(/\s+/)[0]}` : '';

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
  let retomas = 0, despedidas = 0;

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

      const horas = (ahora - new Date(conv.lastMessageAt)) / 3600000;

      if (!conv.silencio1At) {
        const previo = await prisma.whatsAppMessage.findFirst({
          where: { conversationId: conv.id, direction: 'OUTBOUND' },
          orderBy: { timestamp: 'desc' },
          select: { body: true },
        });
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

  if (retomas || despedidas) {
    console.log('[wa-silencio] retomas:', retomas, 'despedidas:', despedidas);
  }
  return { retomas, despedidas, revisadas: candidatas.length };
}

module.exports = {
  processWaAgendarNudges,
  processSilencios,
  processNudges,
  processEscalations,
  normalizePhone,
  NUDGE_TEXT,
};
