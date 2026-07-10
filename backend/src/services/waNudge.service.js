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
`¡Hola de nuevo! 👋 ¿Pudiste ver los horarios?

Los cupos se van rápido esta semana. Si quieres, dime "sí" y te muestro 3 opciones cercanas ahora mismo, o agenda directo aquí:

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

module.exports = {
  processWaAgendarNudges,
  processNudges,
  processEscalations,
  normalizePhone,
  NUDGE_TEXT,
};
