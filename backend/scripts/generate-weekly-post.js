#!/usr/bin/env node
/**
 * Genera un artículo semanal del blog OírConecta con la Claude API.
 *
 * - Toma el primer tema no marcado en content/blog_topic_queue.md
 * - Llama a Anthropic con un prompt template afinado al tono OírConecta
 * - Escribe el .md con frontmatter en content/blog/
 * - Marca el tema como usado y lo mueve a la lista de publicados
 *
 * Estado por defecto: BORRADOR (el admin lo aprueba en /admin/blog).
 * Para auto-publicar pasar AUTO_PUBLISH=true.
 *
 * Requiere ANTHROPIC_API_KEY en el entorno.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const QUEUE_FILE = path.join(ROOT, 'content', 'blog_topic_queue.md');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const AUTO_PUBLISH = process.env.AUTO_PUBLISH === 'true';

// Pool de covers locales para no dejar coverUrl en null. Se elige una al azar.
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
  const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
  const lines = raw.split('\n');
  const idx = lines.findIndex((l) => /^- \[ \]/.test(l));
  if (idx === -1) throw new Error('No hay temas pendientes en blog_topic_queue.md');
  const match = lines[idx].match(/^- \[ \] (.+?) · (\w+)\s*$/);
  if (!match) throw new Error(`Línea mal formateada: ${lines[idx]}`);
  return { idx, raw, lines, titulo: match[1].trim(), categoria: match[2].trim() };
}

function markUsed(state, slug, isoDate) {
  state.lines[state.idx] = `- [x] ${state.titulo} · ${state.categoria} (publicado ${isoDate.slice(0, 10)} como ${slug})`;
  const headerIdx = state.lines.findIndex((l) => /^## Ya publicados/.test(l));
  if (headerIdx !== -1) {
    state.lines.splice(headerIdx + 1, 0, `- ${isoDate.slice(0, 10)} → ${slug}`);
  }
  fs.writeFileSync(QUEUE_FILE, state.lines.join('\n'), 'utf8');
}

function nextFileNumber() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => /^\d+-.+\.md$/.test(f));
  let max = 0;
  for (const f of files) {
    const n = parseInt(f.match(/^(\d+)/)[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
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
4. Tono: experto pero cercano. Empático con el lector que llega buscando respuestas, no quiere sentirse tonto ni asustado.
5. Datos: si das cifras, contextualiza con fuente (ej. "según la OMS", "estudios de Lancet 2024"). No inventes números específicos si no estás seguro.
6. Colombia: cuando aplique, menciona realidades locales (EPS, costos en pesos colombianos como rango aproximado, ciudades). NO inventes precios exactos: usa rangos amplios.
7. NUNCA recomiendes una marca específica como "la mejor". Habla por categorías (RIC, BTE, CIC, etc.) o por características.

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
    throw new Error(`Claude API ${res.status}: ${text}`);
  }
  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) throw new Error('Respuesta sin contenido');
  return text.trim();
}

function buildMarkdownFile({ titulo, categoria, body, slug, coverUrl, isoDate }) {
  const estado = AUTO_PUBLISH ? 'PUBLICADO' : 'BORRADOR';
  const publishedAt = AUTO_PUBLISH ? `\npublishedAt: '${isoDate}'` : '';
  const resumen = body.split(/\n+/).find((p) => p.trim().length > 80)?.slice(0, 180).replace(/"/g, "'").trim() || titulo;

  const tagsBase = [categoria, 'audición', 'salud auditiva', 'OírConecta', 'Colombia'];
  const tags = tagsBase.map((t) => `  - ${t}`).join('\n');

  const frontmatter = `---
slug: ${slug}
titulo: "${titulo.replace(/"/g, '\\"')}"
resumen: "${resumen}…"
categoria: ${categoria}
tags:
${tags}
estado: ${estado}
destacado: false
autorNombre: OírConecta${publishedAt}
coverUrl: ${coverUrl}
---

`;
  return frontmatter + body + '\n';
}

async function main() {
  const state = pickNextTopic();
  console.log(`→ Tema: ${state.titulo} (${state.categoria})`);

  const slug = slugify(state.titulo);
  const slugFile = `${String(nextFileNumber()).padStart(2, '0')}-${slug}.md`;
  const isoDate = new Date().toISOString();
  const coverUrl = COVER_POOL[Math.floor(Math.random() * COVER_POOL.length)];

  const body = await callClaude(buildPrompt(state));
  const md = buildMarkdownFile({ titulo: state.titulo, categoria: state.categoria, body, slug, coverUrl, isoDate });

  fs.writeFileSync(path.join(BLOG_DIR, slugFile), md, 'utf8');
  console.log(`✓ ${slugFile} (${md.length} chars)`);

  markUsed(state, slug, isoDate);
  console.log(`✓ Marcado como usado en la cola`);

  console.log(`\nEstado: ${AUTO_PUBLISH ? 'PUBLICADO automáticamente' : 'BORRADOR (apruébalo en /admin/blog)'}`);
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
