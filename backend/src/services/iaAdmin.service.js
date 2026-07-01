/**
 * F4 — Vistas admin del agente IA (Plan 3).
 *
 * Todos los endpoints son de solo lectura; el mensaje de un paciente NO se
 * modera desde acá, solo se puede auditar.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function startOfMonth() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * KPIs globales de IA — para el header del dashboard admin.
 * Incluye desglose Plan 3 activos, consumo del mes, top consumidores.
 */
async function getGlobalStats() {
  const since = startOfMonth();
  const [
    plan3Count, convTotal, convThisMonth, msgTotal,
    tokensAgg, topByUsage, resultedInAppt,
  ] = await Promise.all([
    prisma.subscription.count({
      where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] }, plan: { is: { code: 'PLAN_3_MENSUAL' } } },
    }),
    prisma.iaConversation.count(),
    prisma.iaConversation.count({ where: { startedAt: { gte: since } } }),
    prisma.iaMessage.count(),
    prisma.iaConversation.aggregate({ _sum: { totalTokens: true } }),
    prisma.subscription.findMany({
      where: { plan: { is: { code: 'PLAN_3_MENSUAL' } } },
      orderBy: { iaConversationsUsed: 'desc' },
      take: 8,
      select: {
        id: true, iaConversationsUsed: true, iaConversationsPeriodAt: true,
        plan: { select: { monthlyConversationLimit: true } },
        profile: {
          select: {
            id: true, nombreConsultorio: true,
            account: { select: { nombre: true, email: true } },
          },
        },
      },
    }),
    prisma.iaConversation.count({ where: { resultedInAppointmentId: { not: null } } }),
  ]);

  const conversionRate = convTotal > 0 ? Math.round((resultedInAppt / convTotal) * 1000) / 10 : 0;

  return {
    plan3Activos: plan3Count,
    conversacionesTotal: convTotal,
    conversacionesEsteMes: convThisMonth,
    mensajesTotal: msgTotal,
    tokensTotal: tokensAgg._sum.totalTokens || 0,
    citasGeneradas: resultedInAppt,
    conversionRate,
    topConsumidores: topByUsage.map((s) => ({
      subscriptionId: s.id,
      profileId: s.profile.id,
      nombre: s.profile.account?.nombre || s.profile.nombreConsultorio,
      email: s.profile.account?.email,
      usadas: s.iaConversationsUsed || 0,
      limite: s.plan?.monthlyConversationLimit || 300,
      periodoAt: s.iaConversationsPeriodAt,
      restantes: Math.max(0, (s.plan?.monthlyConversationLimit || 300) - (s.iaConversationsUsed || 0)),
    })),
  };
}

/**
 * Lista conversaciones con filtros básicos. Paginada.
 */
async function listConversations({ profileId, status, from, to, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (profileId) where.profileId = profileId;
  if (status) where.status = status;
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to)   where.startedAt.lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    prisma.iaConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true, profileId: true, channel: true, status: true,
        startedAt: true, lastMessageAt: true, totalTokens: true,
        resultedInAppointmentId: true,
        patient: { select: { id: true, nombre: true, telefono: true, email: true } },
        profile: {
          select: {
            id: true, nombreConsultorio: true,
            account: { select: { nombre: true, email: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.iaConversation.count({ where }),
  ]);

  return {
    items: items.map((c) => ({
      id: c.id,
      profileId: c.profileId,
      profesionalNombre: c.profile?.account?.nombre || c.profile?.nombreConsultorio,
      profesionalEmail: c.profile?.account?.email,
      pacienteNombre: c.patient?.nombre,
      pacienteTelefono: c.patient?.telefono,
      canal: c.channel,
      status: c.status,
      startedAt: c.startedAt,
      lastMessageAt: c.lastMessageAt,
      totalTokens: c.totalTokens,
      messageCount: c._count.messages,
      resultedInAppointmentId: c.resultedInAppointmentId,
    })),
    total,
  };
}

/**
 * Detalle de una conversación con todos sus mensajes (para auditoría).
 * Filtra los blocks JSON para exponer texto legible.
 */
async function getConversationDetail(conversationId) {
  const conv = await prisma.iaConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      patient: { select: { id: true, nombre: true, telefono: true, email: true } },
      profile: {
        select: {
          id: true, nombreConsultorio: true,
          account: { select: { nombre: true, email: true } },
        },
      },
    },
  });
  if (!conv) return null;

  const messages = conv.messages.map((m) => {
    let displayContent = m.content;
    if (m.role === 'assistant') {
      // El content del assistant es JSON de blocks (text + tool_use).
      try {
        const parsed = JSON.parse(m.content);
        if (Array.isArray(parsed)) {
          const textBlocks = parsed.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
          const toolCalls = parsed.filter((b) => b.type === 'tool_use').map((b) => `[Tool: ${b.name}(${JSON.stringify(b.input)})]`).join('\n');
          displayContent = [textBlocks, toolCalls].filter(Boolean).join('\n\n');
        }
      } catch { /* si no es JSON, dejar tal cual */ }
    } else if (m.role === 'tool') {
      try {
        const parsed = JSON.parse(m.content);
        displayContent = `[${m.toolName || 'tool'}] → ${typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output)}`;
      } catch {}
    }
    return {
      id: m.id,
      role: m.role,
      toolName: m.toolName,
      content: displayContent,
      rawContent: m.content,
      tokens: m.tokens,
      createdAt: m.createdAt,
    };
  });

  return {
    id: conv.id,
    profileId: conv.profileId,
    profesionalNombre: conv.profile?.account?.nombre || conv.profile?.nombreConsultorio,
    pacienteNombre: conv.patient?.nombre,
    pacienteTelefono: conv.patient?.telefono,
    canal: conv.channel,
    status: conv.status,
    startedAt: conv.startedAt,
    lastMessageAt: conv.lastMessageAt,
    totalTokens: conv.totalTokens,
    resultedInAppointmentId: conv.resultedInAppointmentId,
    messages,
  };
}

/**
 * Suspende una suscripción (perfil oculto del directorio, sin cargos).
 * Diferente a cancelar: se puede reactivar sin trámite adicional.
 */
async function suspendSubscription(subscriptionId, { motivo } = {}) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error('Suscripción no encontrada');
  if (sub.status === 'SUSPENDED') return sub;

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'SUSPENDED',
      metadata: { ...(sub.metadata || {}), motivoSuspension: motivo || null, suspendedAt: new Date() },
    },
  });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId,
      tipo: 'SUSPENDED',
      fromStatus: sub.status,
      toStatus: 'SUSPENDED',
      notas: `Admin · ${motivo || 'sin motivo'}`,
      metadata: { motivo, source: 'admin_manual' },
    },
  });
  return updated;
}

module.exports = {
  getGlobalStats,
  listConversations,
  getConversationDetail,
  suspendSubscription,
};
