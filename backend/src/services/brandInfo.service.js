/**
 * Contenido editorial por marca de audífonos, generado con IA (sin scraping).
 * Alimenta las landings /audifonos/<slug> con una sección de texto que hoy no
 * existe (mejor profundidad de contenido => mejor indexación). Guardado en
 * BrandInfo; la landing hace fallback al contenido estático si falta.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MODEL = process.env.BRAND_CLAUDE_MODEL || process.env.BLOG_CLAUDE_MODEL || 'claude-sonnet-4-6';

// Marcas conocidas (espejo del sitemap en app.js).
const BRANDS = [
  ...['widex','oticon','signia','phonak','resound','starkey','beltone','rexton','audioservice','bernafon','hansaton','sonic','unitron']
    .map((slug) => ({ slug, categoria: 'audifonos' })),
  ...['cochlear','advanced-bionics','med-el']
    .map((slug) => ({ slug, categoria: 'implantes' })),
];

const nombreDe = (slug) => slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

function buildPrompt(nombre, categoria) {
  const tipo = categoria === 'implantes' ? 'implantes auditivos' : 'audífonos';
  return `Eres redactor del sitio OírConecta (Colombia), que conecta pacientes con audiólogos y centros auditivos verificados. Voz cálida, directa, en español colombiano neutro, honesta sobre lo que la tecnología puede y no puede hacer.

Escribe una sección editorial sobre la marca de ${tipo} "${nombre}" para su landing pública. Reglas estrictas:
- NUNCA digas que es "la mejor marca" ni la compares como superior a otras.
- Habla por categorías (RIC, BTE, CIC, recargables, conectividad), no prometas resultados.
- No inventes precios ni modelos específicos que no conozcas con certeza; si mencionas gamas, hazlo de forma referencial.
- Recuerda al lector que la elección correcta depende de una evaluación profesional.
- Colombia: menciona que la adaptación debe hacerse con un profesional de la audición.

Devuelve SOLO markdown con exactamente estas 3 secciones (usa ## para los títulos):
## Sobre ${nombre}
(2 párrafos: historia breve y filosofía de sonido de la marca)
## Tecnología y enfoque
(2 párrafos: en qué se enfoca su tecnología, por categorías, sin prometer)
## ¿Para quién es?
(1 párrafo + una lista de 3-4 viñetas de perfiles de usuario para quienes suele encajar)

Sin preámbulo, sin cierre publicitario, sin recomendar comprarla.`;
}

async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está definida');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) throw new Error('Respuesta de Claude sin contenido');
  return text.trim();
}

function resumenDe(md) {
  const firstPara = md.split('\n').find((l) => l.trim() && !l.startsWith('#'));
  return firstPara ? firstPara.slice(0, 180).replace(/[*_]/g, '').trim() : null;
}

/** Genera/actualiza una marca. Devuelve el registro upsertado. */
async function generate(slug) {
  const meta = BRANDS.find((b) => b.slug === slug) || { slug, categoria: 'audifonos' };
  const nombre = nombreDe(slug);
  const contenidoMd = await callClaude(buildPrompt(nombre, meta.categoria));
  const data = {
    nombre, categoria: meta.categoria, contenidoMd,
    resumen: resumenDe(contenidoMd), generatedAt: new Date(),
  };
  return prisma.brandInfo.upsert({ where: { slug }, update: data, create: { slug, ...data } });
}

/** Lectura pública para la landing. */
async function get(slug) {
  return prisma.brandInfo.findUnique({ where: { slug } });
}

async function list() {
  return prisma.brandInfo.findMany({ orderBy: { slug: 'asc' } });
}

/**
 * Cron mensual: refresca la marca más antigua (o una nunca generada) por tick.
 * Gated por BRAND_AUTO_ENABLED=true. Solo día 1 del mes, 8-9am CO.
 */
async function refreshStaleOne() {
  if (process.env.BRAND_AUTO_ENABLED !== 'true') return { skipped: 'disabled' };
  const now = new Date();
  const coHour = (now.getUTCHours() - 5 + 24) % 24;
  const coDate = new Date(now.getTime() - 5 * 3600 * 1000);
  if (coDate.getUTCDate() !== 1 || coHour < 8 || coHour >= 9) return { skipped: 'out-of-window' };

  // Marca sin registro tiene prioridad; si todas existen, la más antigua.
  const existing = await prisma.brandInfo.findMany({ select: { slug: true, generatedAt: true } });
  const known = new Set(existing.map((e) => e.slug));
  const missing = BRANDS.find((b) => !known.has(b.slug));
  const target = missing
    ? missing.slug
    : existing.sort((a, b) => new Date(a.generatedAt || 0) - new Date(b.generatedAt || 0))[0]?.slug;
  if (!target) return { skipped: 'nothing' };
  const rec = await generate(target);
  return { generated: 1, slug: rec.slug };
}

module.exports = { generate, get, list, refreshStaleOne, BRANDS };
