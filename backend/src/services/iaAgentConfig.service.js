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
};
const HEX_RE = /^#([0-9A-Fa-f]{6})$/;
const MAX_FAQS = 30;
const FAQ_Q_MAX = 200;
const FAQ_A_MAX = 1000;
const TEXT_LIMITS = {
  personality: 600,
  expertise: 600,
  signature: 200,
  avoidTopics: 600,
};

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
  if (!cfg) return {
    agentName: DEFAULTS.agentName,
    personality: null, expertise: null, signature: null, avoidTopics: null, faqs: [],
  };
  return {
    agentName: cfg.agentName,
    personality: cfg.personality,
    expertise: cfg.expertise,
    signature: cfg.signature,
    avoidTopics: cfg.avoidTopics,
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
  for (const key of ['personality', 'expertise', 'signature', 'avoidTopics']) {
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
  upsertConfig,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};
