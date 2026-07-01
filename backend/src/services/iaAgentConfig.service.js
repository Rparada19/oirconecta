/**
 * F5.5 — Personalización visible del agente IA por profesional.
 * (nombre + color + welcomeMessage opcional)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULTS = { agentName: 'Asistente', agentColor: '#6d28d9', agentIcon: 'smart_toy', welcomeMessage: null };
const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

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
  const cfg = await prisma.iaAgentConfig.findUnique({ where: { profileId } });
  if (!cfg) return { ...DEFAULTS, profileId, isDefault: true };
  return { ...cfg, isDefault: false };
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
  return prisma.iaAgentConfig.upsert({
    where: { profileId },
    update: data,
    create: { profileId, ...DEFAULTS, ...data },
  });
}

module.exports = {
  DEFAULTS,
  AGENT_ICONS,
  ICON_KEYS,
  ConfigError,
  getConfigOrDefaults,
  upsertConfig,
};
