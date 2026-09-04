/**
 * F5.5 — Personalización visible del agente IA por profesional.
 * (nombre + color + welcomeMessage opcional)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULTS = {
  agentName: 'Asistente',
  agentColor: '#6d28d9',
  agentIcon: 'smart_toy',
  welcomeMessage: null,
  personality: null,
  expertise: null,
  signature: null,
  avoidTopics: null,
  technologies: null,
  services: null,
  logistics: null,
  differentiators: null,
};
const HEX_RE = /^#([0-9A-Fa-f]{6})$/;
const MAX_FAQS = 30;
const FAQ_Q_MAX = 200;
const FAQ_A_MAX = 1000;
const TEXT_LIMITS = {
  personality: 600,
  expertise: 1200,
  signature: 200,
  avoidTopics: 600,
  technologies: 1200,
  services: 1200,
  logistics: 900,
  differentiators: 900,
  internalKnowledge: 900,
  objections: 1200,
  pricing: 900,
};
const TEXT_FIELDS = Object.keys(TEXT_LIMITS);

// Whitelist de íconos disponibles. El frontend mapea el key a un componente MUI.
// Cambios aquí requieren ampliar el mapa en el widget/portal profesional.
const AGENT_ICONS = [
  { key: 'smart_toy',      label: 'Robot' },
  { key: 'auto_awesome',   label: 'Destellos' },
  { key: 'chat_bubble',    label: 'Burbuja' },
  { key: 'support_agent',  label: 'Agente' },
  { key: 'headset_mic',    label: 'Audífono' },
  { key: 'psychology',     label: 'Mente' },
  { key: 'handshake',      label: 'Saludo' },
  { key: 'favorite',       label: 'Corazón' },
  { key: 'waving_hand',    label: 'Hola' },
  { key: 'star',           label: 'Estrella' },
  { key: 'spa',            label: 'Bienestar' },
  { key: 'bolt',           label: 'Rápido' },
];
const ICON_KEYS = AGENT_ICONS.map((i) => i.key);

class ConfigError extends Error {
  constructor(message, { status = 400 } = {}) {
    super(message);
    this.status = status;
  }
}

/** Devuelve config existente o defaults en memoria (sin crear registro). */
async function getConfigOrDefaults(profileId) {
  const cfg = await prisma.iaAgentConfig.findUnique({
    where: { profileId },
    include: { faqs: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  });
  if (!cfg) return { ...DEFAULTS, profileId, faqs: [], isDefault: true };
  return { ...cfg, isDefault: false };
}

/** Solo campos para inyectar en el system prompt (usado por iaAgent). */
async function getEducationForPrompt(profileId) {
  const cfg = await prisma.iaAgentConfig.findUnique({
    where: { profileId },
    include: {
      faqs: {
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        take: 20,
      },
    },
  });
  if (!cfg) {
    const vacio = Object.fromEntries(TEXT_FIELDS.map((k) => [k, null]));
    return { agentName: DEFAULTS.agentName, ...vacio, faqs: [] };
  }
  return {
    agentName: cfg.agentName,
    ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, cfg[k]])),
    faqs: cfg.faqs.map((f) => ({ q: f.question, a: f.answer })),
  };
}

/** Upsert. Valida nombre 2-30 chars y color hex #RRGGBB. */
async function upsertConfig(profileId, patch) {
  const data = {};
  if (patch.agentName !== undefined) {
    const n = String(patch.agentName || '').trim();
    if (n.length < 2 || n.length > 30) throw new ConfigError('agentName debe tener entre 2 y 30 caracteres');
    data.agentName = n;
  }
  if (patch.agentColor !== undefined) {
    const c = String(patch.agentColor || '').trim();
    if (!HEX_RE.test(c)) throw new ConfigError('agentColor debe ser hex #RRGGBB');
    data.agentColor = c;
  }
  if (patch.agentIcon !== undefined) {
    const k = String(patch.agentIcon || '').trim();
    if (!ICON_KEYS.includes(k)) throw new ConfigError(`agentIcon debe ser uno de: ${ICON_KEYS.join(', ')}`);
    data.agentIcon = k;
  }
  if (patch.welcomeMessage !== undefined) {
    const w = patch.welcomeMessage;
    if (w !== null && (typeof w !== 'string' || w.length > 500)) {
      throw new ConfigError('welcomeMessage máximo 500 caracteres');
    }
    data.welcomeMessage = w || null;
  }
  for (const key of TEXT_FIELDS) {
    if (patch[key] !== undefined) {
      const v = patch[key];
      if (v !== null && v !== '' && typeof v !== 'string') {
        throw new ConfigError(`${key} debe ser texto`);
      }
      if (typeof v === 'string' && v.length > TEXT_LIMITS[key]) {
        throw new ConfigError(`${key} máximo ${TEXT_LIMITS[key]} caracteres`);
      }
      data[key] = v ? v.trim() : null;
    }
  }
  return prisma.iaAgentConfig.upsert({
    where: { profileId },
    update: data,
    create: { profileId, ...DEFAULTS, ...data },
    include: { faqs: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  });
}

/**
 * Formatea la educación como bloque de system prompt.
 *
 * Existe aparte del agente del directorio porque el WhatsApp corporativo
 * es un solo número: la rama de paciente necesita el mismo conocimiento
 * del centro que el widget de la ficha.
 */
function buildEducationSection(education, nombre = 'el centro') {
  if (!education) return '';
  const bloques = [];
  const agregar = (campo, encabezado) => {
    if (education[campo]) bloques.push(`── ${encabezado}:\n${education[campo]}`);
  };
  agregar('personality', `Tono y personalidad definidos por ${nombre}`);
  agregar('expertise', 'Áreas de expertise (menciónalas cuando aporten valor, sin inventar)');
  agregar('technologies', 'Marcas, plataformas y tecnología que se manejan. Si preguntan por una que no está aquí, di que lo consultas');
  agregar('services', 'Servicios que se prestan y qué incluye cada uno. Úsalo para responder "¿ustedes hacen X?" sin inventar');
  agregar('logistics', 'Cómo funciona la atención (sedes, horarios, tiempos, convenios)');
  agregar('differentiators', 'Qué diferencia a este centro. Úsalo si el paciente compara o duda, nunca como venta agresiva');
  agregar('pricing', 'Qué puedes decir sobre precios y qué no. Preguntar el precio es una pregunta legítima: búscala aquí y respóndela antes de proponer nada');
  agregar('objections', 'Cómo responder cuando la persona duda. Reconoce lo que te dice y no insistas dos veces con el mismo argumento. Nunca discutas');
  if (education.internalKnowledge) {
    bloques.push(`── CONOCIMIENTO INTERNO. Esto lo SABES y guía tus recomendaciones, pero NO lo anuncias por iniciativa propia. Si te preguntan de frente, no lo niegues ni mientas: responde con naturalidad y aclara que se define en la valoración:\n${education.internalKnowledge}`);
  }
  agregar('avoidTopics', 'Temas que NUNCA debes tocar (si insisten, ofrece agendar con el profesional)');
  if (Array.isArray(education.faqs) && education.faqs.length > 0) {
    const faqBlock = education.faqs.map((f, i) => `${i + 1}. P: ${f.q}\n   R: ${f.a}`).join('\n');
    bloques.push(`── Preguntas frecuentes VERIFICADAS. Responde con base en ellas antes de improvisar:\n${faqBlock}`);
  }
  if (education.signature) {
    bloques.push(`── Frase de cierre habitual, solo al despedirte:\n"${education.signature}"`);
  }
  if (bloques.length === 0) return '';
  return `\n\n═══ CONOCIMIENTO DEL CENTRO ═══\n${bloques.join('\n\n')}\n═══════════════════════════════`;
}

// ─────────────────────────────────────────────────────────────
// FAQs CRUD (por profileId)
// ─────────────────────────────────────────────────────────────

async function ensureConfig(profileId) {
  let cfg = await prisma.iaAgentConfig.findUnique({ where: { profileId } });
  if (!cfg) cfg = await prisma.iaAgentConfig.create({ data: { profileId, ...DEFAULTS } });
  return cfg;
}

function validateFaqPayload(patch) {
  const out = {};
  if (patch.question !== undefined) {
    const q = String(patch.question || '').trim();
    if (q.length < 3) throw new ConfigError('La pregunta es muy corta (mínimo 3 caracteres).');
    if (q.length > FAQ_Q_MAX) throw new ConfigError(`Pregunta máximo ${FAQ_Q_MAX} caracteres.`);
    out.question = q;
  }
  if (patch.answer !== undefined) {
    const a = String(patch.answer || '').trim();
    if (a.length < 3) throw new ConfigError('La respuesta es muy corta (mínimo 3 caracteres).');
    if (a.length > FAQ_A_MAX) throw new ConfigError(`Respuesta máximo ${FAQ_A_MAX} caracteres.`);
    out.answer = a;
  }
  if (patch.order !== undefined) {
    const n = parseInt(patch.order, 10);
    if (Number.isNaN(n) || n < 0 || n > 999) throw new ConfigError('order fuera de rango.');
    out.order = n;
  }
  if (patch.isActive !== undefined) out.isActive = !!patch.isActive;
  return out;
}

async function listFaqs(profileId) {
  const cfg = await prisma.iaAgentConfig.findUnique({
    where: { profileId },
    include: { faqs: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  });
  return cfg?.faqs || [];
}

async function createFaq(profileId, payload) {
  const cfg = await ensureConfig(profileId);
  const count = await prisma.iaAgentFaq.count({ where: { configId: cfg.id } });
  if (count >= MAX_FAQS) throw new ConfigError(`Máximo ${MAX_FAQS} FAQs. Elimina alguna antes de agregar otra.`);
  const data = validateFaqPayload(payload);
  if (!data.question || !data.answer) throw new ConfigError('question y answer son obligatorios.');
  if (data.order === undefined) data.order = count;
  return prisma.iaAgentFaq.create({ data: { ...data, configId: cfg.id } });
}

async function updateFaq(profileId, faqId, payload) {
  const faq = await prisma.iaAgentFaq.findUnique({ where: { id: faqId }, include: { config: true } });
  if (!faq || faq.config.profileId !== profileId) {
    throw new ConfigError('FAQ no encontrada.', { status: 404 });
  }
  const data = validateFaqPayload(payload);
  return prisma.iaAgentFaq.update({ where: { id: faqId }, data });
}

async function deleteFaq(profileId, faqId) {
  const faq = await prisma.iaAgentFaq.findUnique({ where: { id: faqId }, include: { config: true } });
  if (!faq || faq.config.profileId !== profileId) {
    throw new ConfigError('FAQ no encontrada.', { status: 404 });
  }
  await prisma.iaAgentFaq.delete({ where: { id: faqId } });
}

module.exports = {
  DEFAULTS,
  AGENT_ICONS,
  ICON_KEYS,
  TEXT_LIMITS,
  MAX_FAQS,
  FAQ_Q_MAX,
  FAQ_A_MAX,
  ConfigError,
  getConfigOrDefaults,
  getEducationForPrompt,
  buildEducationSection,
  upsertConfig,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};
