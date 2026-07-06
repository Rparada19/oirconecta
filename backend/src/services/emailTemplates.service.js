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

// ─── Catálogo de defaults hardcoded ─────────────────────────
// Cada código tiene subject + body (HTML) + variables esperadas.
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
    description: 'Check-in 15 días después de completar cita. Acompañamiento post-consulta.',
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
    description: 'Se envía al referidor cuando el paciente que él invitó completa su primera cita.',
  },
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
async function listAll() {
  const dbRows = await prisma.notificationTemplate.findMany({
    where: { channel: 'EMAIL', locale: 'es-CO' },
    orderBy: { code: 'asc' },
  });
  const dbCodes = new Set(dbRows.map((r) => r.code));

  // Añade hardcoded que aún no están en DB (aparecen como "por defecto")
  const missing = HARDCODED_CODES.filter((c) => !dbCodes.has(c)).map((c) => ({
    id: null,
    code: c,
    channel: 'EMAIL',
    locale: 'es-CO',
    subject: HARDCODED[c].subject,
    body: HARDCODED[c].body,
    variables: HARDCODED[c].variables || [],
    category: HARDCODED[c].category || 'TRANSACTIONAL',
    activo: true,
    isDefault: true, // no está guardado, muestra hardcoded
    description: HARDCODED[c].description,
  }));

  return [
    ...dbRows.map((r) => ({
      ...r,
      isDefault: false,
      description: HARDCODED[r.code]?.description || null,
    })),
    ...missing,
  ].sort((a, b) => a.code.localeCompare(b.code));
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
  getByCode,
  updateByCode,
  restoreDefault,
  HARDCODED,
  HARDCODED_CODES,
};
