/**
 * T5 — Buzón de plantillas editables desde el admin.
 *
 * Wrapper sobre NotificationTemplate para que email.service pueda:
 *   1. Buscar template en DB por code (channel='EMAIL', locale='es-CO')
 *   2. Interpolar variables {{nombre}} en subject y body
 *   3. Fallback a valor hardcoded si no hay row en DB (backward compatible)
 *
 * Los templates definidos en HARDCODED se auto-seedan en la primera lectura
 * si no existe row para ese code. Idempotente.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Interpolación de variables ─────────────────────────────
// {{nombre}} → payload.nombre
// {{fecha}}  → payload.fecha
function render(str, payload = {}) {
  if (!str) return '';
  return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = payload[key];
    return v == null ? '' : String(v);
  });
}

// ─── Grupos de flujo de negocio (para agrupar en la UI del buzón) ────
// El orden aquí determina el orden de las secciones en el admin.
const GROUPS = {
  CRM_CONTROLES:        { label: 'CRM — Controles de adaptación',   order: 1, description: 'Funnel post-venta de audífono en centros propios.' },
  CITAS_TRANSACCIONALES: { label: 'Citas — Confirmaciones y recordatorios', order: 2, description: 'Comunicaciones alrededor de una cita agendada.' },
  DIRECTORIO_POST_CITA: { label: 'Directorio — Post-cita',           order: 3, description: 'Acompañamiento tras la consulta con un profesional del directorio.' },
  DIRECTORIO_NURTURE:   { label: 'Directorio — Nurture de leads',    order: 4, description: 'Secuencia de emails a leads sin cita.' },
  DIRECTORIO_RETENCION: { label: 'Directorio — Retención',           order: 5, description: 'Cumpleaños y referidos.' },
  OTROS:                { label: 'Otros',                            order: 99, description: 'Sin agrupar.' },
};

// ─── Catálogo de defaults hardcoded ─────────────────────────
// Cada código tiene subject + body (HTML) + variables + group + label legible + orden.
// Si el admin no ha editado nada, se usa esto. Al editar, se sobrescribe
// en DB pero este dict siempre queda como "restaurar por defecto".
const HARDCODED = {
  LEAD_NURTURE_1: {
    subject: '{{nombre}}, ¿sabías esto sobre tu audición?',
    preheader: 'Un dato que muchos no conocen sobre pérdida auditiva',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Gracias por consultarnos sobre "{{interes}}". Queremos que sepas que dar el primer paso es lo más difícil — y ya lo diste.</p>
<p><strong>Un dato que muchos no conocen:</strong> el 90% de los problemas de audición son tratables si se detectan temprano. La mayoría de personas espera 7 años antes de consultar. Tú acabas de adelantarte.</p>
<p>En OírConecta encontrarás profesionales verificados en toda Colombia, con precios y horarios reales. Puedes explorar sin compromiso.</p>
<p><a href="https://oirconecta.com/directorio">Explorar profesionales cercanos →</a></p>`,
    variables: ['nombre', 'interes'],
    category: 'MARKETING',
    label: 'Nurture #1 · 24 horas',
    group: 'DIRECTORIO_NURTURE',
    orderInGroup: 1,
    description: 'Nurture email #1 — 24h después de crear el lead. Educativo, sin venta.',
  },
  LEAD_NURTURE_2: {
    subject: '{{nombre}}, así fue la historia de María',
    preheader: 'Un testimonio real de un paciente OírConecta',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>María Camila (52 años, Bogotá) llevaba <strong>4 años</strong> pidiendo a su familia que "hablaran más duro". Pensaba que era normal a su edad.</p>
<blockquote>"Cuando entré por primera vez a la valoración, tenía miedo. Al final me sentí escuchada por primera vez en años. Salí con un plan claro y ganas de intentarlo."</blockquote>
<p>Ese primer paso — la valoración — dura 45 minutos y te da respuestas concretas. No compromiso, no venta forzada. Solo información honesta sobre tu audición.</p>
<p><a href="https://oirconecta.com/directorio">Agendar mi valoración →</a></p>`,
    variables: ['nombre'],
    category: 'MARKETING',
    label: 'Nurture #2 · 3 días',
    group: 'DIRECTORIO_NURTURE',
    orderInGroup: 2,
    description: 'Nurture email #2 — 3 días después. Testimonial de un paciente real.',
  },
  LEAD_NURTURE_3: {
    subject: '{{nombre}}, tu valoración auditiva te está esperando',
    preheader: 'Un último recordatorio con los beneficios de OírConecta',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Hace una semana consultaste sobre "{{interes}}". Sabemos que la vida se atraviesa y a veces los proyectos importantes quedan en pausa.</p>
<p><strong>Solo queremos recordarte:</strong> agendar tu valoración con un profesional verificado toma menos de 2 minutos.</p>
<ul>
  <li>Profesionales <strong>verificados</strong> (RETHUS + tarjeta profesional)</li>
  <li>Precios <strong>reales antes de agendar</strong> — sin sorpresas</li>
  <li>Recordatorios automáticos por email y WhatsApp</li>
  <li>Cancelar o reagendar en 1 clic</li>
</ul>
<p><a href="https://oirconecta.com/directorio">Ver profesionales disponibles →</a></p>`,
    variables: ['nombre', 'interes'],
    category: 'MARKETING',
    label: 'Nurture #3 · 7 días',
    group: 'DIRECTORIO_NURTURE',
    orderInGroup: 3,
    description: 'Nurture email #3 — 7 días después. CTA final con beneficios.',
  },
  BIRTHDAY: {
    subject: '¡Feliz cumpleaños, {{nombre}}!',
    preheader: 'Te deseamos un año lleno de sonidos hermosos',
    body: `<p>Feliz cumpleaños, <strong>{{nombre}}</strong>.</p>
<p>Hoy es tu día. Desde OírConecta y todo el equipo que te acompaña queremos desearte un año lleno de las conversaciones, la música y los sonidos que amas.</p>
<p>Cuidar tu audición es cuidar tus recuerdos, tus vínculos y las risas que están por venir. Gracias por confiar en nosotros para acompañarte en ese camino.</p>
<p>Con cariño,<br/>El equipo OírConecta</p>`,
    variables: ['nombre', 'referralCode'],
    category: 'TRANSACTIONAL',
    label: 'Cumpleaños',
    group: 'DIRECTORIO_RETENCION',
    orderInGroup: 1,
    description: 'Email de cumpleaños. Enviado automáticamente cada año.',
  },
  REVIEW_REQUEST: {
    subject: '¿Cómo fue tu consulta con {{professionalName}}?',
    preheader: 'Tu opinión ayuda a otros pacientes a decidir',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Gracias por confiar en <strong>{{professionalName}}</strong> para tu {{tipoConsulta}} del {{fecha}}. Nos encantaría saber cómo te fue.</p>
<p>Tu reseña ayuda a otros pacientes a encontrar el profesional adecuado y le da a los profesionales el reconocimiento que merecen.</p>
<p><a href="{{reviewUrl}}">Dejar mi reseña →</a></p>
<p>Toma menos de 1 minuto. Tu reseña será revisada antes de publicarse.</p>`,
    variables: ['nombre', 'professionalName', 'tipoConsulta', 'fecha', 'reviewUrl'],
    category: 'TRANSACTIONAL',
    label: 'Solicitud de reseña',
    group: 'DIRECTORIO_POST_CITA',
    orderInGroup: 2,
    description: 'Solicitud de reseña al paciente, se envía cuando el profesional marca la cita como COMPLETED.',
  },
  CONTROL_15D: {
    subject: '{{nombre}}, ¿cómo va tu adaptación?',
    preheader: 'Un check-in a 15 días de tu consulta',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Han pasado dos semanas desde tu {{tipoConsulta}} con <strong>{{professionalName}}</strong>. Queríamos saber cómo te has sentido.</p>
<p>La adaptación auditiva es un proceso: los primeros días el cerebro está aprendiendo a interpretar sonidos que había olvidado. Algunas personas se sienten cómodas en una semana, otras necesitan uno o dos meses. Ambos son ritmos normales.</p>
<p><strong>Si algo no se siente bien:</strong> no esperes. Contactar a {{professionalName}} y ajustar el plan es parte del proceso, no un signo de fracaso.</p>
<p>Si prefieres compartir tu experiencia con nosotros, respondemos a este correo. También puedes dejar una reseña que ayude a otras personas a decidir.</p>
<p>Con cariño,<br/>El equipo OírConecta</p>`,
    variables: ['nombre', 'professionalName', 'tipoConsulta'],
    category: 'TRANSACTIONAL',
    label: 'Check-in 15 días post-cita',
    group: 'DIRECTORIO_POST_CITA',
    orderInGroup: 1,
    description: 'Check-in 15 días después de completar cita. Acompañamiento post-consulta.',
  },
  CONTROL_T7: {
    subject: '{{nombre}}, tu {{controlLabel}} se acerca',
    preheader: 'Faltan 7 días — reserva tu control ahora',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Han pasado casi <strong>{{diasDesdeAdaptacion}}</strong> días desde que empezaste a usar tus audífonos. Se acerca tu <strong>{{controlLabel}}</strong>, un momento importante para ajustar cualquier detalle y asegurar que sigas escuchando lo mejor posible.</p>
<p><strong>¿Por qué importa este control?</strong> A esta altura ya identificaste qué te funciona y qué no. Podemos ajustar programación, revisar el estado del equipo y responder tus dudas.</p>
<p style="text-align:center;margin:24px 0">
  <a href="{{bookingUrl}}" style="display:inline-block;padding:14px 32px;background:#0F2A4A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Agendar mi control</a>
</p>
<p>Si prefieres coordinarlo por teléfono, llámanos al {{telefonoCentro}}.</p>
<p>Con cariño,<br/>El equipo OírConecta</p>`,
    variables: ['nombre', 'controlLabel', 'diasDesdeAdaptacion', 'bookingUrl', 'telefonoCentro'],
    category: 'TRANSACTIONAL',
    label: 'Control · 7 días antes',
    group: 'CRM_CONTROLES',
    orderInGroup: 1,
    description: 'F8 T-7d — recordatorio anticipado del control de adaptación (CRM centros propios).',
  },
  CONTROL_T1: {
    subject: 'Mañana es tu {{controlLabel}}',
    preheader: 'Recordatorio final — te esperamos',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Mañana es tu <strong>{{controlLabel}}</strong>. Si aún no has agendado, puedes hacerlo ahora mismo o contactarnos.</p>
<p style="text-align:center;margin:24px 0">
  <a href="{{bookingUrl}}" style="display:inline-block;padding:14px 32px;background:#0F2A4A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Agendar ahora</a>
</p>
<p>Te esperamos.<br/>El equipo OírConecta</p>`,
    variables: ['nombre', 'controlLabel', 'bookingUrl'],
    category: 'TRANSACTIONAL',
    label: 'Control · el día antes',
    group: 'CRM_CONTROLES',
    orderInGroup: 2,
    description: 'F8 T-1d — último recordatorio del control (CRM centros propios).',
  },
  CONTROL_OVERDUE: {
    subject: '{{nombre}}, tu control quedó pendiente',
    preheader: 'Reagenda cuando puedas — es rápido',
    body: `<p>Hola <strong>{{nombre}}</strong>,</p>
<p>Tu <strong>{{controlLabel}}</strong> quedó sin agendar. Sabemos que la vida se atraviesa — pero estos controles son la mejor forma de aprovechar al máximo tus audífonos.</p>
<p><strong>Toma menos de 2 minutos</strong> reagendarlo:</p>
<p style="text-align:center;margin:24px 0">
  <a href="{{bookingUrl}}" style="display:inline-block;padding:14px 32px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Reagendar mi control</a>
</p>
<p>Si prefieres que te llamemos para coordinarlo, respóndenos este email o escríbenos al WhatsApp.</p>
<p>Con cariño,<br/>El equipo OírConecta</p>`,
    variables: ['nombre', 'controlLabel', 'bookingUrl'],
    category: 'TRANSACTIONAL',
    label: 'Control · vencido (reagendar)',
    group: 'CRM_CONTROLES',
    orderInGroup: 3,
    description: 'F8 T+3d vencido — invitación a reagendar el control (CRM centros propios).',
  },
  REFERRAL_USED: {
    subject: 'Gracias, {{referrerName}}. Alguien usó tu invitación.',
    preheader: 'Un amigo tuyo acaba de agendar una cita en OírConecta',
    body: `<p>Hola <strong>{{referrerName}}</strong>,</p>
<p>{{newPatientName}} usó tu enlace único y acaba de agendar una cita con un profesional del directorio. Gracias por ayudar a que más personas cuiden su audición.</p>
<p>Cuando {{newPatientName}} complete su valoración, activaremos un beneficio en tu próxima consulta como agradecimiento por la recomendación.</p>
<p>Con aprecio,<br/>El equipo OírConecta</p>`,
    variables: ['referrerName', 'newPatientName'],
    category: 'TRANSACTIONAL',
    label: 'Alguien usó tu invitación',
    group: 'DIRECTORIO_RETENCION',
    orderInGroup: 2,
    description: 'Se envía al referidor cuando el paciente que él invitó completa su primera cita.',
  },
};

// ─── Metadata de templates legacy que están en DB pero no en HARDCODED ────
// Solo agrega label + group para que la UI los muestre agrupados y con nombre
// legible. NO tienen defaults hardcoded (no se pueden "restaurar").
const LEGACY_META = {
  cita_agendada:   { label: 'Cita agendada · confirmación',   group: 'CITAS_TRANSACCIONALES', orderInGroup: 1 },
  recordatorio_24h:{ label: 'Recordatorio 24h antes',         group: 'CITAS_TRANSACCIONALES', orderInGroup: 2 },
  cancelacion:     { label: 'Cita cancelada',                 group: 'CITAS_TRANSACCIONALES', orderInGroup: 3 },
};

const HARDCODED_CODES = Object.keys(HARDCODED);

// ─── Seed idempotente ───────────────────────────────────────
// Se llama on-read: si no hay row en DB para ese code, la crea con el default.
// Al editar desde admin, se sobrescribe y no vuelve a crear.
async function ensureSeeded(code) {
  const def = HARDCODED[code];
  if (!def) return null;
  const exists = await prisma.notificationTemplate.findFirst({
    where: { code, channel: 'EMAIL', locale: 'es-CO' },
  });
  if (exists) return exists;
  try {
    return await prisma.notificationTemplate.create({
      data: {
        code,
        channel: 'EMAIL',
        locale: 'es-CO',
        subject: def.subject,
        body: def.body,
        variables: def.variables || [],
        category: def.category || 'TRANSACTIONAL',
        optOutAllowed: def.category === 'MARKETING',
        activo: true,
      },
    });
  } catch (e) {
    // Race entre múltiples request paralelos: si otro proceso creó primero, lee.
    return prisma.notificationTemplate.findFirst({
      where: { code, channel: 'EMAIL', locale: 'es-CO' },
    });
  }
}

// ─── API pública ────────────────────────────────────────────

/**
 * Renderiza subject + body de un template. Prioriza DB, cae a hardcoded.
 */
async function renderEmail(code, payload = {}) {
  const hardcoded = HARDCODED[code];
  let tpl = null;
  try {
    tpl = await ensureSeeded(code);
  } catch (e) {
    console.warn('[templates] no pude leer DB, uso hardcoded:', e.message);
  }

  const subject = render(tpl?.subject || hardcoded?.subject || '', payload);
  const body = render(tpl?.body || hardcoded?.body || '', payload);
  return { subject, body };
}

/**
 * Lista todos los templates disponibles (DB + hardcoded no seedeados).
 * Uso: admin panel.
 */
function metaFor(code) {
  const hc = HARDCODED[code];
  if (hc) return { label: hc.label || code, group: hc.group || 'OTROS', orderInGroup: hc.orderInGroup ?? 99, description: hc.description || null };
  const lg = LEGACY_META[code];
  if (lg) return { label: lg.label, group: lg.group, orderInGroup: lg.orderInGroup, description: null };
  return { label: code, group: 'OTROS', orderInGroup: 99, description: null };
}

async function listAll() {
  const dbRows = await prisma.notificationTemplate.findMany({
    where: { channel: 'EMAIL', locale: 'es-CO' },
    orderBy: { code: 'asc' },
  });
  const dbCodes = new Set(dbRows.map((r) => r.code));

  // Añade hardcoded que aún no están en DB (aparecen como "por defecto")
  const missing = HARDCODED_CODES.filter((c) => !dbCodes.has(c)).map((c) => {
    const meta = metaFor(c);
    return {
      id: null,
      code: c,
      channel: 'EMAIL',
      locale: 'es-CO',
      subject: HARDCODED[c].subject,
      body: HARDCODED[c].body,
      variables: HARDCODED[c].variables || [],
      category: HARDCODED[c].category || 'TRANSACTIONAL',
      activo: true,
      isDefault: true,
      label: meta.label,
      group: meta.group,
      orderInGroup: meta.orderInGroup,
      description: meta.description,
    };
  });

  const enriched = [
    ...dbRows.map((r) => ({ ...r, isDefault: false, ...metaFor(r.code) })),
    ...missing,
  ];

  // Orden: grupo (según GROUPS.order), luego orderInGroup, luego label
  enriched.sort((a, b) => {
    const ga = GROUPS[a.group]?.order ?? 99;
    const gb = GROUPS[b.group]?.order ?? 99;
    if (ga !== gb) return ga - gb;
    if (a.orderInGroup !== b.orderInGroup) return (a.orderInGroup || 99) - (b.orderInGroup || 99);
    return String(a.label || a.code).localeCompare(String(b.label || b.code));
  });

  return enriched;
}

function listGroups() {
  return Object.entries(GROUPS).map(([key, v]) => ({ key, ...v }));
}

/**
 * Devuelve un template por code (para el editor del admin).
 */
async function getByCode(code) {
  const row = await ensureSeeded(code);
  return {
    ...(row || {}),
    hardcodedDefault: HARDCODED[code] || null,
  };
}

/**
 * Actualiza subject/body/activo/category/variables de un template.
 * Crea el row si no existe (upsert por code+channel+locale).
 */
async function updateByCode(code, patch) {
  const data = {};
  if (patch.subject !== undefined) data.subject = String(patch.subject || '').slice(0, 500);
  if (patch.body !== undefined) data.body = String(patch.body || '').slice(0, 20000);
  if (patch.activo !== undefined) data.activo = !!patch.activo;
  if (patch.category !== undefined) data.category = String(patch.category);
  if (Array.isArray(patch.variables)) data.variables = patch.variables.map(String);

  return prisma.notificationTemplate.upsert({
    where: {
      code_channel_locale: { code, channel: 'EMAIL', locale: 'es-CO' },
    },
    create: {
      code,
      channel: 'EMAIL',
      locale: 'es-CO',
      subject: data.subject || HARDCODED[code]?.subject || '',
      body: data.body || HARDCODED[code]?.body || '',
      variables: data.variables || HARDCODED[code]?.variables || [],
      category: data.category || HARDCODED[code]?.category || 'TRANSACTIONAL',
      activo: data.activo !== undefined ? data.activo : true,
      optOutAllowed: (data.category || HARDCODED[code]?.category) === 'MARKETING',
    },
    update: data,
  });
}

/**
 * Restaura un template a su valor hardcoded original.
 */
async function restoreDefault(code) {
  const def = HARDCODED[code];
  if (!def) throw new Error(`Template ${code} no tiene default`);
  return prisma.notificationTemplate.upsert({
    where: { code_channel_locale: { code, channel: 'EMAIL', locale: 'es-CO' } },
    create: {
      code, channel: 'EMAIL', locale: 'es-CO',
      subject: def.subject, body: def.body, variables: def.variables || [],
      category: def.category || 'TRANSACTIONAL', activo: true,
      optOutAllowed: def.category === 'MARKETING',
    },
    update: {
      subject: def.subject, body: def.body, variables: def.variables || [],
      category: def.category || 'TRANSACTIONAL',
    },
  });
}

module.exports = {
  render,
  renderEmail,
  listAll,
  listGroups,
  getByCode,
  updateByCode,
  restoreDefault,
  HARDCODED,
  HARDCODED_CODES,
  GROUPS,
};
