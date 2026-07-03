/**
 * F5.1 — Agente IA del Plan 3.
 *
 * Modelo: Claude Haiku 4.5 (claude-haiku-4-5-20251001).
 * Capacidades vía tool use:
 *   - list_appointment_types
 *   - get_availability
 *   - create_appointment
 *   - get_professional_info
 *   - cancel_appointment (sólo si paciente da rescheduleToken)
 *
 * Quota: 300 conversaciones/mes por profesional (Plan 3). Cuenta una conversación
 * cuando el cliente llama POST /chat sin conversationId. Las llamadas subsiguientes
 * dentro del mismo conversationId no incrementan cuota.
 *
 * Persistencia: cada turno (mensaje user + respuesta assistant) se guarda en
 * ia_messages. Los tool_use/tool_result se guardan también para poder reconstruir
 * el historial al continuar la conversación.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const subService = require('./subscription.service');
const booking = require('./professionalBooking.service');

const prisma = new PrismaClient();
const MODEL = 'claude-haiku-4-5-20251001';

class IaError extends Error {
  constructor(message, { status = 400, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ─────────────────────────────────────────────────────────────
// Tool definitions (Anthropic format)
// ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_appointment_types',
    description: 'Lista los tipos de consulta que el profesional ofrece (nombre, duración, precio).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_professional_info',
    description: 'Obtiene la información pública del profesional: nombre, profesión, dirección, teléfono, modalidades, idiomas.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_availability',
    description: 'Devuelve los horarios disponibles del profesional para una fecha específica. Devuelve un array de slots con "time" en HH:MM (24h).',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (zona horaria del profesional)' },
        appointmentTypeId: { type: 'string', description: 'ID del tipo de consulta (opcional, usa duración por defecto si no se pasa)' },
      },
      required: ['date'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Crea una cita confirmada. Antes de llamar SIEMPRE confirma con el paciente: tipo de consulta, fecha, hora exacta, y sus datos. Si falta algún dato del paciente, pregúntalo primero.',
    input_schema: {
      type: 'object',
      properties: {
        appointmentTypeId: { type: 'string', description: 'ID del tipo de consulta' },
        scheduledAt: { type: 'string', description: 'YYYY-MM-DDTHH:MM (hora local profesional)' },
        patientName: { type: 'string' },
        patientPhone: { type: 'string' },
        patientEmail: { type: 'string', description: 'Opcional, recomendado para enviar confirmación' },
        tipoDocumento: { type: 'string', description: 'CC | CE | TI | PP. Opcional.' },
        numeroDocumento: { type: 'string', description: 'Opcional pero recomendado' },
        notas: { type: 'string', description: 'Motivo o información adicional, opcional' },
      },
      required: ['appointmentTypeId', 'scheduledAt', 'patientName', 'patientPhone'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancela una cita existente. Requiere el rescheduleToken que recibió el paciente por email al agendar.',
    input_schema: {
      type: 'object',
      properties: {
        rescheduleToken: { type: 'string' },
        motivo: { type: 'string', description: 'Opcional' },
      },
      required: ['rescheduleToken'],
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Tool implementations
// ─────────────────────────────────────────────────────────────

const toolImpls = {
  async list_appointment_types({ profileId }) {
    const types = await booking.publicListTypes(profileId);
    return { types };
  },

  async get_professional_info({ profileId }) {
    const p = await prisma.directoryProfile.findUnique({
      where: { id: profileId },
      select: {
        account: { select: { nombre: true } },
        profession: { select: { nombre: true } },
        city: { select: { nombre: true } },
        direccionPublica: true, telefonoPublico: true, emailPublico: true,
        modalidadAtencion: true, idiomas: true, anosExperiencia: true,
        poblacionAtiende: true, polizasAceptadas: true, qaList: true,
        nombreConsultorio: true,
      },
    });
    if (!p) throw new IaError('Profesional no encontrado', { status: 404 });
    return {
      nombre: p.account?.nombre || p.nombreConsultorio || 'Profesional',
      profesion: p.profession?.nombre,
      ciudad: p.city?.nombre,
      direccion: p.direccionPublica,
      telefono: p.telefonoPublico,
      email: p.emailPublico,
      modalidades: p.modalidadAtencion,
      idiomas: p.idiomas,
      anosExperiencia: p.anosExperiencia,
      poblacionAtiende: p.poblacionAtiende,
      polizas: p.polizasAceptadas,
      faq: p.qaList,
    };
  },

  async get_availability({ profileId }, { date, appointmentTypeId }) {
    const out = await booking.computeSlotsForDay(profileId, date, { appointmentTypeId });
    return out;
  },

  async create_appointment({ profileId, conversation }, input) {
    const res = await booking.createPublicAppointment(profileId, {
      appointmentTypeId: input.appointmentTypeId,
      scheduledAt: input.scheduledAt,
      notas: input.notas,
      patient: {
        nombre: input.patientName,
        telefono: input.patientPhone,
        email: input.patientEmail,
        tipoDocumento: input.tipoDocumento,
        numeroDocumento: input.numeroDocumento,
      },
    });
    // Persistir referencia en la conversación
    if (conversation?.id) {
      await prisma.iaConversation.update({
        where: { id: conversation.id },
        data: { resultedInAppointmentId: res.id },
      }).catch(() => {});
    }
    return {
      id: res.id, fecha: res.fecha, hora: res.hora, durationMinutes: res.durationMinutes,
      rescheduleToken: res.rescheduleToken,
      mensaje: `Cita confirmada para ${res.hora}. Recibirás email con detalles y enlace para reagendar.`,
    };
  },

  async cancel_appointment(_ctx, { rescheduleToken, motivo }) {
    if (!rescheduleToken) throw new IaError('rescheduleToken requerido');
    const appt = await prisma.appointment.findUnique({ where: { rescheduleToken } });
    if (!appt) return { error: 'No encontré una cita con ese código.' };
    if (appt.estado === 'CANCELLED') return { error: 'Esa cita ya está cancelada.' };
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { estado: 'CANCELLED', notas: motivo ? `${appt.notas || ''}\n[Cancelada vía IA]: ${motivo}`.trim() : appt.notas },
    });
    return { cancelled: true, mensaje: 'Cita cancelada correctamente.' };
  },
};

// ─────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(profileInfo, hoyLocal, education = {}) {
  const agentName = education.agentName || 'Asistente';
  const nameLine = agentName && agentName !== 'Asistente'
    ? `Tu nombre es ${agentName}. `
    : '';

  // Bloques de educación personalizados por el profesional (opcionales)
  const custom = [];
  if (education.personality) {
    custom.push(`── Tono y personalidad definidos por ${profileInfo.nombre}:\n${education.personality}`);
  }
  if (education.expertise) {
    custom.push(`── Áreas de expertise específicas del profesional (menciónalas cuando aporten valor, sin inventar):\n${education.expertise}`);
  }
  if (education.avoidTopics) {
    custom.push(`── Temas que NUNCA debes tocar (si el paciente insiste, redirige a consulta directa con el profesional):\n${education.avoidTopics}`);
  }
  if (Array.isArray(education.faqs) && education.faqs.length > 0) {
    const faqBlock = education.faqs
      .map((f, i) => `${i + 1}. P: ${f.q}\n   R: ${f.a}`)
      .join('\n');
    custom.push(`── Preguntas frecuentes VERIFICADAS por ${profileInfo.nombre}. Úsalas como fuente confiable antes de improvisar. Si la pregunta del paciente coincide con alguna, responde con base en la respuesta verificada:\n${faqBlock}`);
  }
  if (education.signature) {
    custom.push(`── Frase de firma/cierre habitual. Úsala solo cuando cierres la conversación o al despedirte:\n"${education.signature}"`);
  }

  const customSection = custom.length > 0
    ? `\n\n═══ EDUCACIÓN ESPECÍFICA DE ESTE CONSULTORIO ═══\n${custom.join('\n\n')}\n═══════════════════════════════════════════════`
    : '';

  return `${nameLine}Eres el asistente virtual de ${profileInfo.nombre}${profileInfo.profesion ? ` (${profileInfo.profesion})` : ''}${profileInfo.ciudad ? ` en ${profileInfo.ciudad}` : ''}. Tu rol es ayudar a sus pacientes a agendar, reagendar o cancelar citas, y responder preguntas frecuentes.

Hoy es ${hoyLocal}.

Reglas estrictas:
1. Hablas en español, tono cálido y profesional. Tutea solo si el paciente lo hace primero.
2. Para agendar, sigue SIEMPRE este orden:
   a) Si no conoces los tipos de consulta, llama list_appointment_types.
   b) Pregunta al paciente qué tipo necesita.
   c) Pregunta una fecha tentativa.
   d) Llama get_availability con esa fecha y el appointmentTypeId.
   e) Ofrece los horarios disponibles (NO inventes horarios — solo los que devuelve get_availability).
   f) Pide nombre completo y teléfono. Email es opcional pero recomendado para enviarles la confirmación.
   g) RESUME tipo + fecha + hora + datos antes de llamar create_appointment.
   h) Confirma el agendamiento con el id y rescheduleToken que devuelve create_appointment.
3. Para preguntas sobre el profesional (precios, dirección, modalidades, experiencia), llama get_professional_info — no las inventes.
4. NO ofrezcas tratamientos médicos, diagnósticos, ni recomendaciones clínicas. Si el paciente lo pide, redirige: "Esto lo evalúa ${profileInfo.nombre} directamente en consulta."
5. Si el paciente quiere cancelar y te da un código (rescheduleToken), usa cancel_appointment. Sin código, dile que revise el email de confirmación de la cita.
6. Sé breve. Máximo 3-4 líneas por respuesta. Sin emojis salvo que el paciente los use.
7. Si el paciente pide algo que no puedes hacer (cobrar, cambiar precios, atender urgencias) di claramente que un humano del consultorio debe ayudarle, y comparte el teléfono del profesional si está disponible.${customSection}`;
}

// ─────────────────────────────────────────────────────────────
// Quota helpers
// ─────────────────────────────────────────────────────────────

async function loadSubscriptionWithIa(profileId) {
  const sub = await prisma.subscription.findUnique({
    where: { profileId },
    include: { plan: true },
  });
  if (!sub) throw new IaError('Sin suscripción activa', { status: 402, code: 'NO_SUBSCRIPTION' });
  if (!subService.hasFeature(sub, subService.FEATURES.IA)) {
    throw new IaError('Este profesional no tiene asistente IA en su plan.', { status: 402, code: 'IA_NOT_INCLUDED' });
  }
  return sub;
}

/**
 * Verifica/inicializa la ventana mensual de cuota.
 * Retorna { used, limit, periodAt } actualizado.
 */
async function ensureQuotaWindow(sub) {
  const now = new Date();
  const periodAt = sub.iaConversationsPeriodAt ? new Date(sub.iaConversationsPeriodAt) : null;
  const limit = sub.plan?.monthlyConversationLimit ?? 0;

  const needsReset = !periodAt || (now - periodAt) >= 30 * 24 * 3600 * 1000;
  if (needsReset) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { iaConversationsUsed: 0, iaConversationsPeriodAt: now },
    });
    return { used: 0, limit, periodAt: now };
  }
  return { used: sub.iaConversationsUsed || 0, limit, periodAt };
}

async function incrementQuota(subId) {
  await prisma.subscription.update({
    where: { id: subId },
    data: { iaConversationsUsed: { increment: 1 } },
  });
}

/**
 * Marca como EXPIRED los packs cuyo expiresAt ya pasó. No lanza si falla.
 * Se llama on-read para evitar necesidad de cron.
 */
async function expirePastPacks(subscriptionId) {
  const now = new Date();
  await prisma.iaConversationPack.updateMany({
    where: { subscriptionId, status: 'ACTIVE', expiresAt: { lt: now } },
    data: { status: 'EXPIRED' },
  }).catch(() => {});
}

/**
 * Devuelve el saldo total disponible: base restante + suma de packs ACTIVE
 * (restantes no expirados). También el detalle de cada pack.
 */
async function getBalance(sub) {
  const quota = await ensureQuotaWindow(sub);
  await expirePastPacks(sub.id);
  const packs = await prisma.iaConversationPack.findMany({
    where: { subscriptionId: sub.id, status: 'ACTIVE' },
    orderBy: { expiresAt: 'asc' },
  });
  const baseRemaining = Math.max(0, quota.limit - quota.used);
  const packsRemaining = packs.reduce((acc, p) => acc + Math.max(0, p.totalConversations - p.usedConversations), 0);
  return {
    base: { limit: quota.limit, used: quota.used, remaining: baseRemaining, periodAt: quota.periodAt },
    packs: packs.map((p) => ({
      id: p.id, totalConversations: p.totalConversations, usedConversations: p.usedConversations,
      remaining: Math.max(0, p.totalConversations - p.usedConversations),
      priceCOP: p.priceCOP, expiresAt: p.expiresAt, purchasedAt: p.purchasedAt, status: p.status,
    })),
    totalRemaining: baseRemaining + packsRemaining,
  };
}

/**
 * Consume 1 conversación. Prioridad:
 *  1) Base si aún queda.
 *  2) Pack ACTIVE con menor expiresAt y remaining > 0 (marca DEPLETED si llega a total).
 *  3) Si nada disponible → throw QUOTA_EXCEEDED.
 * Retorna { source: 'base'|'pack', packId? }.
 */
async function consumeConversation(sub) {
  const quota = await ensureQuotaWindow(sub);
  if (quota.used < quota.limit) {
    await incrementQuota(sub.id);
    return { source: 'base' };
  }
  await expirePastPacks(sub.id);
  // Toma pack ACTIVE con remaining>0 y menor expiresAt
  const pack = await prisma.iaConversationPack.findFirst({
    where: {
      subscriptionId: sub.id,
      status: 'ACTIVE',
      usedConversations: { lt: prisma.iaConversationPack.fields?.totalConversations || undefined },
    },
    orderBy: { expiresAt: 'asc' },
  });
  // Prisma no permite comparar dos columnas fácilmente en where — filtro en JS:
  if (!pack || pack.usedConversations >= pack.totalConversations) {
    // Fallback: busca a mano el primer pack con capacidad
    const packs = await prisma.iaConversationPack.findMany({
      where: { subscriptionId: sub.id, status: 'ACTIVE' },
      orderBy: { expiresAt: 'asc' },
    });
    const usable = packs.find((p) => p.usedConversations < p.totalConversations);
    if (!usable) {
      throw new IaError(
        'Cuota mensual agotada y sin paquetes disponibles. Compra un paquete adicional para continuar.',
        { status: 429, code: 'QUOTA_EXCEEDED' },
      );
    }
    return consumePack(usable);
  }
  return consumePack(pack);
}

async function consumePack(pack) {
  const newUsed = pack.usedConversations + 1;
  const nextStatus = newUsed >= pack.totalConversations ? 'DEPLETED' : 'ACTIVE';
  await prisma.iaConversationPack.update({
    where: { id: pack.id },
    data: { usedConversations: newUsed, status: nextStatus },
  });
  return { source: 'pack', packId: pack.id, packDepleted: nextStatus === 'DEPLETED' };
}

// ─────────────────────────────────────────────────────────────
// Conversation helpers
// ─────────────────────────────────────────────────────────────

async function loadConversationMessages(conversationId) {
  const msgs = await prisma.iaMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
  // Reconstruye en formato Anthropic. Los "tool" se reconstruyen como tool_result
  // dentro de un user message que sigue al assistant tool_use.
  const out = [];
  for (const m of msgs) {
    if (m.role === 'tool') {
      // El último mensaje en `out` debe ser assistant con tool_use; le añadimos el tool_result en user
      try {
        const parsed = JSON.parse(m.content);
        out.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: parsed.toolUseId,
            content: typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output),
            is_error: !!parsed.isError,
          }],
        });
      } catch { /* ignora mensajes corruptos */ }
    } else if (m.role === 'assistant') {
      // El assistant puede ser texto puro o tool_use
      try {
        const blocks = JSON.parse(m.content);
        if (Array.isArray(blocks)) {
          out.push({ role: 'assistant', content: blocks });
          continue;
        }
      } catch {}
      out.push({ role: 'assistant', content: m.content });
    } else {
      out.push({ role: 'user', content: m.content });
    }
  }
  return out;
}

async function saveUserMessage(conversationId, text) {
  await prisma.iaMessage.create({ data: { conversationId, role: 'user', content: text } });
  await prisma.iaConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
}

async function saveAssistantBlocks(conversationId, blocks, usage) {
  // Suma completa incluye cache creation + cache read + input normal + output
  const input = usage?.input_tokens || 0;
  const cacheRead = usage?.cache_read_input_tokens || 0;
  const cacheCreate = usage?.cache_creation_input_tokens || 0;
  const output = usage?.output_tokens || 0;
  const tokens = input + cacheRead + cacheCreate + output;
  await prisma.iaMessage.create({
    data: { conversationId, role: 'assistant', content: JSON.stringify(blocks), tokens },
  });
  await prisma.iaConversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), totalTokens: { increment: tokens } },
  });
}

async function saveToolResult(conversationId, toolUseId, toolName, output, isError = false) {
  await prisma.iaMessage.create({
    data: {
      conversationId,
      role: 'tool',
      toolName,
      content: JSON.stringify({ toolUseId, output, isError }),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

async function getIaInfo(profileId) {
  try {
    const sub = await loadSubscriptionWithIa(profileId);
    const balance = await getBalance(sub);
    return {
      available: true,
      // Compatibilidad hacia atrás: campos que ya usaba el widget
      conversationsUsed: balance.base.used,
      conversationsLimit: balance.base.limit,
      remaining: balance.totalRemaining, // incluye packs
      // Detalle nuevo
      base: balance.base,
      packs: balance.packs,
      totalRemaining: balance.totalRemaining,
    };
  } catch (e) {
    return { available: false, reason: e.code || 'UNKNOWN', message: e.message };
  }
}

/**
 * Procesa un turno de chat. Crea conversación si conversationId es null.
 *
 * Devuelve: { conversationId, reply, finishReason, quota }
 */
async function chat(profileId, { conversationId, message, metadata }) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new IaError('message requerido');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new IaError('ANTHROPIC_API_KEY no configurada en el servidor', { status: 503 });
  }

  const sub = await loadSubscriptionWithIa(profileId);

  let conversation;
  let isNew = false;
  let consumption = null; // { source, packId? }
  if (conversationId) {
    conversation = await prisma.iaConversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.profileId !== profileId) {
      throw new IaError('Conversación no encontrada', { status: 404 });
    }
    if (conversation.status !== 'ACTIVE') {
      throw new IaError('La conversación está cerrada. Inicia una nueva.', { status: 409, code: 'CONV_CLOSED' });
    }
  } else {
    // Consume 1 conversación (base primero, después packs). Puede lanzar QUOTA_EXCEEDED.
    consumption = await consumeConversation(sub);
    conversation = await prisma.iaConversation.create({
      data: {
        profileId, channel: 'web',
        metadata: { ...(metadata || {}), consumedFrom: consumption.source, packId: consumption.packId || null },
      },
    });
    isNew = true;
  }

  // Construye contexto: system prompt + historial + nuevo mensaje
  const profileInfo = await toolImpls.get_professional_info({ profileId });
  const tzNow = new Date().toLocaleString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Bogota',
  });
  // Nombre + educación custom del profesional (persona, FAQs, temas a evitar).
  const education = await require('./iaAgentConfig.service').getEducationForPrompt(profileId);
  const system = buildSystemPrompt(profileInfo, tzNow, education);

  await saveUserMessage(conversation.id, message);
  const history = await loadConversationMessages(conversation.id);

  const client = new Anthropic();
  let finalText = '';
  let finishReason = 'end_turn';
  const ctx = { profileId, conversation };

  // Bucle hasta que la IA responda solo con texto (sin tool_use). Tope 5 iteraciones.
  for (let iter = 0; iter < 5; iter++) {
    // Prompt caching: marca system + tools con cache_control ephemeral.
    // Cache hit reduce el input de ~1,400 tokens estables a $0.10/MTok (10× más barato).
    // TTL ~5 min; se re-usa entre turnos de la misma conversación y entre
    // conversaciones distintas de cualquier profesional (siempre que system sea
    // idéntico dentro de esa ventana).
    const systemBlocks = [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
    const cachedTools = TOOLS.map((t, i) =>
      i === TOOLS.length - 1 ? { ...t, cache_control: { type: 'ephemeral' } } : t,
    );

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemBlocks,
      tools: cachedTools,
      messages: history,
    });

    await saveAssistantBlocks(conversation.id, resp.content, resp.usage);

    const toolUses = resp.content.filter((b) => b.type === 'tool_use');
    const textBlocks = resp.content.filter((b) => b.type === 'text');
    finalText = textBlocks.map((b) => b.text).join('\n').trim();
    finishReason = resp.stop_reason;

    if (toolUses.length === 0) break;

    // Añadir assistant al history local y ejecutar tools
    history.push({ role: 'assistant', content: resp.content });
    const toolResults = [];
    for (const tu of toolUses) {
      let output, isError = false;
      try {
        const impl = toolImpls[tu.name];
        if (!impl) throw new IaError(`Tool desconocida: ${tu.name}`);
        output = await impl(ctx, tu.input || {});
      } catch (e) {
        output = { error: e.message || 'Error en herramienta' };
        isError = true;
      }
      await saveToolResult(conversation.id, tu.id, tu.name, output, isError);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: typeof output === 'string' ? output : JSON.stringify(output),
        is_error: isError,
      });
    }
    history.push({ role: 'user', content: toolResults });
    // continúa el loop hasta tener texto sin tool_use
  }

  const refreshedSub = await prisma.subscription.findUnique({
    where: { id: sub.id }, include: { plan: true },
  });
  const balance = await getBalance(refreshedSub);

  return {
    conversationId: conversation.id,
    isNew,
    reply: finalText || '(Respuesta vacía. Intenta reformular tu pregunta.)',
    finishReason,
    consumption, // { source: 'base'|'pack', packId? } — null si es continuación
    // Compatibilidad hacia atrás
    quota: {
      used: balance.base.used,
      limit: balance.base.limit,
      remaining: balance.totalRemaining, // incluye packs
    },
    balance,
  };
}

module.exports = { IaError, getIaInfo, chat, getBalance, consumeConversation, TOOLS };
