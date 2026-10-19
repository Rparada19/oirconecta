/**
 * Lo que Aura (bot del WhatsApp corporativo) dice y cobra, editable desde la
 * consola del Agente IA en el portal profesional.
 *
 * Antes vivía escrito en waCorporateBot.service: el saludo, los botones, los
 * seguimientos y los precios. El dueño entraba al portal, no veía nada de eso,
 * y lo que sí veía (el campo de precios) el código le ordenaba ignorarlo.
 *
 * Se guarda en ia_agent_config.auraSettings del perfil retail. Lo que no se ha
 * editado cae al valor de DEFAULTS, que es exactamente el texto que el bot
 * decía antes: sin ediciones, el bot se comporta igual que siempre.
 */

const { PrismaClient } = require('@prisma/client');
const retailService = require('./retail.service');

const prisma = new PrismaClient();

const DEFAULTS = {
  precios: {
    impresos: '$150.000',
    audifonosDesde: '$800.000',
    promoActiva: true,
    promoProducto: 'audífonos recargables',
    promoPrecio: '$1.800.000',
    promoHasta: '2026-10-31',
  },
  textos: {
    bienvenida: 'Qué bueno que escribes: volver a oír bien cambia las conversaciones de todos los días.\n\nPara orientarte mejor, ¿es para ti o para un familiar?',
    paraMi: 'Perfecto 🙌 Dar este paso ya es avanzar.\n\nAtendemos en *Bogotá*. ¿Estás en Bogotá o cerca?',
    paraFamiliar: 'Qué bien que lo acompañas: ese apoyo hace la diferencia 💙\n\nAtendemos en *Bogotá*. ¿Están en Bogotá o cerca?',
    otraCiudad: 'Nuestro consultorio está solo en Bogotá. ¿En qué ciudad estás? El equipo te busca un profesional de confianza allá.',
    comoFunciona: 'Así funciona: empiezas con una *valoración auditiva* con audióloga, una hora y 4 exámenes. Sales sabiendo cómo está tu audición y qué opciones tienes. *No tiene costo* y no te compromete a nada.\n\n¿Qué prefieres?',
    confirmarHora: 'Listo: *{dia}, {hora}*\n\n¿A nombre de quién dejo la cita? Escríbeme el nombre completo.',
    retoma: 'Hola, {nombre} 🙂 ¿Pudiste pensar en lo que hablamos? Si te quedó alguna duda, cuéntame con confianza.',
    ultimoToque: 'Te dejo esto por si te sirve 🙂\n\nLa valoración es una hora con audióloga, *no tiene costo* y sales sabiendo cómo está tu audición y qué opciones tienes. Cuando quieras, aquí estoy.',
  },
};

// Dónde aparece cada texto y qué variables admite. La consola lo usa para
// dibujar el flujo en orden; el orden de este arreglo es el del chat.
const PASOS = [
  { key: 'bienvenida', titulo: 'Bienvenida', cuando: 'Primer mensaje, salvo que la persona ya haya preguntado el precio. Va después de "¡Hola, {nombre}! 👋 Soy Aura, de OírConecta."', botones: ['Para mí', 'Para un familiar'] },
  { key: 'paraMi', titulo: 'Si toca "Para mí"', cuando: 'Pregunta la ciudad', botones: ['Sí, en Bogotá', 'Otra ciudad'] },
  { key: 'paraFamiliar', titulo: 'Si toca "Para un familiar"', cuando: 'Pregunta la ciudad', botones: ['Sí, en Bogotá', 'Otra ciudad'] },
  { key: 'otraCiudad', titulo: 'Si toca "Otra ciudad"', cuando: 'La persona no vive en Bogotá' },
  { key: 'comoFunciona', titulo: 'Si toca "Sí, en Bogotá"', cuando: 'Explica la valoración y ofrece el menú', botones: ['Agendar valoración', 'Ver precios', 'Tengo exámenes'] },
  { key: 'confirmarHora', titulo: 'Eligió una hora', cuando: 'Pide el nombre para crear la cita', variables: ['dia', 'hora'] },
  { key: 'retoma', titulo: 'Seguimiento a las 3 horas', cuando: 'Si no contesta en 3 horas. Va con un botón para ver horarios', variables: ['nombre'], botones: ['Ver horarios'] },
  { key: 'ultimoToque', titulo: 'Seguimiento a las 20 horas', cuando: 'Último mensaje antes de que cierre la ventana de 24 horas de WhatsApp', botones: ['Ver horarios'] },
];

const MAX_TEXTO = 900;
const PRECIO_RE = /^\$?\s?\d{1,3}(\.\d{3})*$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

class AuraError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

let cache = null;
let cacheAt = 0;
const TTL_MS = 60 * 1000;

function merge(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    precios: { ...DEFAULTS.precios, ...(g.precios || {}) },
    textos: { ...DEFAULTS.textos, ...(g.textos || {}) },
  };
}

/** Lo vigente, leído de la base como mucho una vez por minuto. */
async function refresh({ force = false } = {}) {
  if (!force && cache && Date.now() - cacheAt < TTL_MS) return cache;
  try {
    const profileId = await retailService.getRetailProfileId();
    const cfg = profileId
      ? await prisma.iaAgentConfig.findUnique({ where: { profileId }, select: { auraSettings: true } })
      : null;
    cache = merge(cfg?.auraSettings);
  } catch (e) {
    // Sin base no se calla el bot: sigue con lo último que tuvo o con lo de siempre.
    console.error('[aura-settings] no se pudo leer:', e.message);
    cache = cache || merge(null);
  }
  cacheAt = Date.now();
  return cache;
}

/** Versión síncrona para las funciones que arman texto: lo último leído. */
function current() {
  return cache || merge(null);
}

/** Reemplaza {variables}. Si falta el nombre, "Hola, {nombre} 🙂" queda "Hola 🙂". */
function fill(texto, vars = {}) {
  return String(texto || '')
    .replace(/,?\s*\{nombre\}/g, (m) => (vars.nombre ? m.replace('{nombre}', vars.nombre) : ''))
    .replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

function hoyBogota(fecha = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(fecha);
}

function promoVigente(s = current(), fecha = new Date()) {
  const p = s.precios;
  return !!(p.promoActiva && p.promoPrecio && (!p.promoHasta || hoyBogota(fecha) <= p.promoHasta));
}

/**
 * El prompt del bot trae las cifras de siempre escritas a mano. Aquí se cambian
 * por las de la consola, para que Claude y los mensajes fijos digan lo mismo.
 */
function conPrecios(texto, s = current()) {
  const p = s.precios;
  const d = DEFAULTS.precios;
  // Una sola pasada: si un precio nuevo coincide con otro de los de siempre,
  // no se vuelve a reemplazar.
  const mapa = {
    [d.promoPrecio]: p.promoPrecio || d.promoPrecio,
    [d.audifonosDesde]: p.audifonosDesde || d.audifonosDesde,
    [d.impresos]: p.impresos || d.impresos,
  };
  const re = new RegExp(Object.keys(mapa).map((k) => k.replace(/[$.]/g, '\\$&')).join('|'), 'g');
  return String(texto).replace(re, (m) => mapa[m]);
}

async function isAuraProfile(profileId) {
  const retailId = await retailService.getRetailProfileId();
  return !!retailId && retailId === profileId;
}

function validar(body) {
  const out = { precios: {}, textos: {} };
  const p = body?.precios || {};
  for (const k of ['impresos', 'audifonosDesde', 'promoPrecio']) {
    if (p[k] == null) continue;
    const v = String(p[k]).trim();
    if (!PRECIO_RE.test(v)) throw new AuraError(`El precio "${v}" no se entiende. Escríbelo así: $800.000`);
    out.precios[k] = v.startsWith('$') ? v.replace(/^\$\s?/, '$') : `$${v}`;
  }
  if (p.promoActiva != null) out.precios.promoActiva = !!p.promoActiva;
  if (p.promoProducto != null) {
    const v = String(p.promoProducto).trim();
    if (!v || v.length > 80) throw new AuraError('El producto de la promoción debe tener entre 1 y 80 caracteres');
    out.precios.promoProducto = v;
  }
  if (p.promoHasta != null) {
    const v = String(p.promoHasta).trim();
    if (v && !FECHA_RE.test(v)) throw new AuraError('La fecha de la promoción debe ser AAAA-MM-DD');
    out.precios.promoHasta = v;
  }
  const t = body?.textos || {};
  for (const k of Object.keys(DEFAULTS.textos)) {
    if (t[k] == null) continue;
    const v = String(t[k]).replace(/\r\n/g, '\n').trim();
    if (!v) throw new AuraError('Un mensaje no puede quedar vacío. Usa "Restaurar" para volver al original.');
    if (v.length > MAX_TEXTO) throw new AuraError(`Un mensaje puede tener hasta ${MAX_TEXTO} caracteres`);
    out.textos[k] = v;
  }
  return out;
}

/** Guarda solo lo que difiere de DEFAULTS: así un "Restaurar" vuelve al texto vivo. */
function soloCambios(merged) {
  const out = { precios: {}, textos: {} };
  for (const grupo of ['precios', 'textos']) {
    for (const [k, v] of Object.entries(merged[grupo])) {
      if (v !== DEFAULTS[grupo][k]) out[grupo][k] = v;
    }
  }
  return out;
}

async function save(profileId, body) {
  if (!(await isAuraProfile(profileId))) throw new AuraError('Esta configuración es solo del consultorio de OírConecta', 403);
  const limpio = validar(body);
  const cfg = await prisma.iaAgentConfig.findUnique({ where: { profileId }, select: { auraSettings: true } });
  const actual = merge(cfg?.auraSettings);
  const nuevo = {
    precios: { ...actual.precios, ...limpio.precios },
    textos: { ...actual.textos, ...limpio.textos },
  };
  const guardar = soloCambios(nuevo);
  await prisma.iaAgentConfig.upsert({
    where: { profileId },
    update: { auraSettings: guardar },
    create: { profileId, agentName: 'Aura', auraSettings: guardar },
  });
  return refresh({ force: true });
}

module.exports = {
  DEFAULTS,
  PASOS,
  refresh,
  current,
  fill,
  promoVigente,
  conPrecios,
  isAuraProfile,
  save,
  AuraError,
};
