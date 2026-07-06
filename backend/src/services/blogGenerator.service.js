/**
 * Generador semanal de artículos del blog con Claude.
 *
 * Toma el primer tema no marcado de content/blog_topic_queue.md, llama a
 * Anthropic, y persiste el post directamente en la tabla BlogPost. Estado por
 * defecto BORRADOR (el admin publica desde /portal-admin/blog). Con
 * BLOG_AUTO_PUBLISH=true publica automático.
 *
 * NO escribe archivos .md — el filesystem de Render es efímero y no persiste
 * entre deploys.
 *
 * Cuelga del cron in-process. La ventana la controla el cron (llamador).
 */

const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROOT = path.resolve(__dirname, '..', '..');
const QUEUE_FILE = path.join(ROOT, 'content', 'blog_topic_queue.md');

const MODEL = process.env.BLOG_CLAUDE_MODEL || 'claude-sonnet-4-6';
const AUTO_PUBLISH = process.env.BLOG_AUTO_PUBLISH === 'true';

// Covers para no dejar coverUrl null. Se elige uno al azar.
const COVER_POOL = [
  '/img/clinica-audiologia-tratamiento.jpg',
  '/img/audiologo-prueba-audicion.jpg',
  '/img/audifono-tecnologia-moderna.jpg',
  '/img/audifono-adulto-mayor.jpg',
  '/img/familiar-audifonos-cuidador.jpg',
  '/img/centro-auditivo-colombia.jpg',
  '/img/audiologo-paciente-consulta.jpg',
  '/img/audifono-retroauricular-bte.jpg',
  '/img/audifono-intracanal-itc.jpg',
  '/img/blog/cuidados-audifono.jpg',
  '/img/blog/audifono-receiver-ric.jpg',
  '/img/blog/audifono-vista-cercana.jpg',
  '/img/blog/perdida-auditiva-personas-mayores.jpg',
  '/img/blog/molde-cupula-audifono.jpg',
  '/img/blog/familia-conversando-mesa.jpg',
];

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickNextTopic() {
  if (!fs.existsSync(QUEUE_FILE)) throw new Error(`Cola no existe: ${QUEUE_FILE}`);
  const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
  const lines = raw.split('\n');
  const idx = lines.findIndex((l) => /^- \[ \]/.test(l));
  if (idx === -1) throw new Error('No hay temas pendientes en la cola');
  const match = lines[idx].match(/^- \[ \] (.+?) · (\w+)\s*$/);
  if (!match) throw new Error(`Línea mal formateada: ${lines[idx]}`);
  return { idx, lines, titulo: match[1].trim(), categoria: match[2].trim() };
}

function markUsed(state, slug, isoDate) {
  state.lines[state.idx] = `- [x] ${state.titulo} · ${state.categoria} (publicado ${isoDate.slice(0, 10)} como ${slug})`;
  const headerIdx = state.lines.findIndex((l) => /^## Ya publicados/.test(l));
  if (headerIdx !== -1) {
    state.lines.splice(headerIdx + 1, 0, `- ${isoDate.slice(0, 10)} → ${slug}`);
  }
  try {
    fs.writeFileSync(QUEUE_FILE, state.lines.join('\n'), 'utf8');
  } catch (e) {
    // Filesystem efímero de Render — no bloqueamos si falla la escritura
    console.warn('[blog-gen] no pude actualizar la cola en disco:', e.message);
  }
}

function buildPrompt({ titulo, categoria }) {
  return `Eres redactor del blog de OírConecta — un proyecto colombiano que conecta pacientes con audiólogos, otorrinos y centros auditivos verificados. La voz editorial es cálida, directa, sin tecnicismos innecesarios, respetuosa con el lector y honesta sobre lo que la audiología puede y no puede hacer. Nunca prometes curas. Nunca recomiendas marcas específicas sin disclaimer. Hablas en español colombiano neutro (sin modismos cerrados), tuteo natural.

Escribe un artículo completo del blog sobre:

**Título tentativo**: ${titulo}
**Categoría**: ${categoria}

Reglas de formato (estrictas):

1. Devuelve SOLO el contenido markdown del artículo, empezando por el primer párrafo de cuerpo (sin H1, sin frontmatter, sin comentarios meta).
2. Estructura recomendada:
   - 2-3 párrafos iniciales que enganchan emocionalmente y ubican al lector.
   - H2 (##) para secciones principales (4-7 secciones).
   - H3 (###) cuando una sección se subdivide.
   - Listas con bullets cuando aportan claridad, prosa cuando no.
   - Al final, una sección "## Cuándo consultar con un especialista" o equivalente.
   - Cierra con un párrafo corto que invita a buscar audiólogo en el directorio de OírConecta SIN sonar a venta agresiva.
3. Extensión: entre 1200 y 1800 palabras.
4. Tono: experto pero cercano. Empático con el lector que llega buscando respuestas.
5. Datos: si das cifras, contextualiza con fuente. No inventes números.
6. Colombia: cuando aplique, menciona realidades locales (EPS, rangos en pesos colombianos, ciudades). NO inventes precios exactos.
7. NUNCA recomiendes una marca específica como "la mejor". Habla por categorías (RIC, BTE, CIC).

Devuelve a continuación SOLO el markdown del artículo:`;
}

async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está definida');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) throw new Error('Respuesta de Claude sin contenido');
  return text.trim();
}

function extractResumen(body) {
  const first = body.split(/\n+/).find((p) => p.trim().length > 80);
  return first ? `${first.slice(0, 180).replace(/"/g, "'").trim()}…` : 'Nuevo artículo del blog OírConecta.';
}

/**
 * Genera un post nuevo y lo persiste en BlogPost. Devuelve el registro creado
 * o null si no hay temas / si ya se generó uno recientemente.
 *
 * @param {object} opts
 * @param {number} opts.minDaysBetween - No genera si el último post creado es más nuevo que esto (default 6).
 * @returns {Promise<{ post: object | null, reason?: string }>}
 */
async function generateOne({ minDaysBetween = 6 } = {}) {
  // Guard idempotente: si hay un post creado en los últimos N días, salta.
  const since = new Date(Date.now() - minDaysBetween * 24 * 3600 * 1000);
  const recent = await prisma.blogPost.findFirst({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, titulo: true, createdAt: true },
  });
  if (recent) {
    return { post: null, reason: `skip-recent: ${recent.titulo} creado ${recent.createdAt.toISOString()}` };
  }

  const state = pickNextTopic();
  const slug = slugify(state.titulo);

  // Otra guardia: si ya existe un post con ese slug, no lo duplicamos.
  const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    // Marca el tema como usado igual y sigue con el siguiente en la próxima corrida.
    markUsed(state, slug, new Date().toISOString());
    return { post: null, reason: `skip-existing-slug: ${slug}` };
  }

  const body = await callClaude(buildPrompt(state));
  const coverUrl = COVER_POOL[Math.floor(Math.random() * COVER_POOL.length)];
  const isoDate = new Date().toISOString();

  const post = await prisma.blogPost.create({
    data: {
      slug,
      titulo: state.titulo,
      resumen: extractResumen(body),
      contenido: body,
      cierre: null,
      ctaTexto: null,
      ctaUrl: null,
      coverUrl,
      categoria: state.categoria,
      tags: [state.categoria, 'audición', 'salud auditiva', 'OírConecta'],
      estado: AUTO_PUBLISH ? 'PUBLICADO' : 'BORRADOR',
      destacado: false,
      autorNombre: 'OírConecta',
      publishedAt: AUTO_PUBLISH ? new Date() : null,
    },
  });

  markUsed(state, slug, isoDate);

  // Hook PageRegistry si se publicó directo
  if (post.estado === 'PUBLICADO') {
    try {
      const pageReg = require('./pageRegistry.service');
      await pageReg.upsert({
        type: 'blog_articulo',
        name: `Blog: ${post.titulo}`,
        path: `/blog/${post.slug}`,
        entityId: post.id, entityType: 'BlogPost',
      });
    } catch (e) {
      console.warn('[blog-gen] pageRegistry upsert falló:', e.message);
    }
  }

  return { post };
}

module.exports = { generateOne };
