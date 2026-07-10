/**
 * F10c — Generación de embeddings vía OpenAI text-embedding-3-small (1536 dims).
 *
 * Requiere OPENAI_API_KEY en el entorno. Sin la clave, devuelve un vector cero
 * (no rompe la ingesta pero el retrieval no funciona hasta que se configure).
 *
 * Costo: ~$0.00002 por 1K tokens. Un documento de 20 páginas cuesta ~$0.0004.
 */

const OpenAI = require('openai');

const MODEL = 'text-embedding-3-small';
const DIMS = 1536;

let cachedClient = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cachedClient) cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cachedClient;
}

/** Devuelve un vector de ceros (fallback cuando no hay API key). */
function zeroVector() {
  return new Array(DIMS).fill(0);
}

/**
 * Genera embeddings en batch.
 * @param {string[]} texts - lista de textos.
 * @returns {Promise<number[][]>} lista de vectores 1536-d.
 */
async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const client = getClient();
  if (!client) {
    console.warn('[embeddings] OPENAI_API_KEY no configurada — devuelvo vectores cero');
    return texts.map(() => zeroVector());
  }

  // OpenAI acepta hasta 2048 inputs por llamada, pero conservamos margen.
  const BATCH = 100;
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const resp = await client.embeddings.create({
      model: MODEL,
      input: slice,
    });
    for (const item of resp.data) out.push(item.embedding);
  }
  return out;
}

/** Embed de una sola query. */
async function embedQuery(text) {
  const [vec] = await embedTexts([String(text || '').slice(0, 8000)]);
  return vec || zeroVector();
}

/**
 * Convierte un vector JS a literal para pgvector.
 * pgvector acepta `'[0.1,0.2,...]'::vector`.
 */
function toVectorLiteral(vec) {
  return `[${vec.join(',')}]`;
}

module.exports = { embedTexts, embedQuery, toVectorLiteral, DIMS, MODEL };
