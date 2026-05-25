/**
 * Generación con IA de la comparación de audífonos (Claude / Anthropic).
 *
 * - Precio SIEMPRE viene de la BD (lo carga el admin); la IA NO inventa precios.
 * - La IA sintetiza fortalezas/debilidades/bondades, uso y un consejo según la
 *   pérdida auditiva declarada en el test.
 * - Salida estructurada (JSON schema) para respuesta parseable y estable.
 * - Caché en memoria por (candidatos + test) para no repetir llamadas.
 */
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-4-7';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map(); // key -> { at, data }

const SYSTEM_PROMPT = [
  'Eres un asesor audiológico independiente en Colombia. Comparas audífonos de forma',
  'objetiva y honesta para ayudar a un paciente a decidir. Reglas:',
  '- NO inventes ni estimes precios: los precios reales se te entregan como dato y no debes alterarlos.',
  '- Sé equilibrado: cada opción debe tener fortalezas y debilidades reales.',
  '- Usa los datos de referencia que te da el editor cuando existan; complementa con conocimiento general',
  '  de la marca/tecnología/plataforma. No exageres ni hagas promesas médicas.',
  '- El consejo final debe considerar el grado de pérdida y el estilo de vida declarados en el test.',
  '- Responde en español de Colombia, claro y breve. No uses jerga innecesaria.',
].join('\n');

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    candidatos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          etiqueta: { type: 'string' },
          fortalezas: { type: 'array', items: { type: 'string' } },
          debilidades: { type: 'array', items: { type: 'string' } },
          bondades: { type: 'array', items: { type: 'string' } },
          usoRecomendado: { type: 'string' },
        },
        required: ['etiqueta', 'fortalezas', 'debilidades', 'bondades', 'usoRecomendado'],
      },
    },
    recomendacion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ganadorEtiqueta: { type: 'string' },
        razon: { type: 'string' },
        consejoPorPerdida: { type: 'string' },
      },
      required: ['ganadorEtiqueta', 'razon', 'consejoPorPerdida'],
    },
  },
  required: ['candidatos', 'recomendacion'],
};

const etiquetaDe = (c) => [c.marca, c.tecnologia, c.plataforma].filter(Boolean).join(' · ');

function buildUserPrompt(candidatos, test) {
  const bloques = candidatos.map((c, i) => {
    const ref = c.ref || {};
    const lineas = [
      `Candidato ${i + 1}: ${etiquetaDe(c)}`,
      c.modelo ? `Modelo: ${c.modelo}` : null,
      ref.precio != null ? `Precio real (no modificar): ${ref.precio} COP` : 'Precio: no disponible',
      ref.fortalezas ? `Notas del editor (fortalezas): ${ref.fortalezas}` : null,
      ref.debilidades ? `Notas del editor (debilidades): ${ref.debilidades}` : null,
      ref.uso ? `Notas del editor (uso): ${ref.uso}` : null,
      ref.consejos ? `Notas del editor (consejos): ${ref.consejos}` : null,
    ].filter(Boolean);
    return lineas.join('\n');
  });

  const t = test || {};
  const testTxt = [
    `Grado de pérdida: ${t.perdida || 'no indicado'}`,
    `Estilo de vida: ${t.estiloVida || 'no indicado'}`,
    `Prioridad: ${t.prioridad || 'no indicada'}`,
    `Presupuesto: ${t.presupuesto || 'no indicado'}`,
    `Destreza/manejo: ${t.destreza || 'no indicado'}`,
    `Conectividad importante: ${t.conectividad || 'no indicado'}`,
  ].join('\n');

  return [
    'Compara estos audífonos y recomienda el más adecuado para el paciente.',
    '',
    bloques.join('\n\n'),
    '',
    'Respuestas del test del paciente:',
    testTxt,
    '',
    'Para cada candidato entrega fortalezas, debilidades, bondades y uso recomendado.',
    'Luego elige un ganador (por su etiqueta exacta), explica la razón y da un consejo según la pérdida.',
  ].join('\n');
}

function cacheKey(candidatos, test) {
  return JSON.stringify({
    c: candidatos.map((c) => [c.marca, c.tecnologia, c.plataforma, c.ref?.precio ?? null]),
    t: test || {},
  });
}

async function generarComparacion(candidatos, test) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('La comparación con IA no está configurada (falta ANTHROPIC_API_KEY).');
    err.statusCode = 503;
    throw err;
  }

  const key = cacheKey(candidatos, test);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: buildUserPrompt(candidatos, test) }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Respuesta de IA vacía');
  const data = JSON.parse(textBlock.text);

  cache.set(key, { at: Date.now(), data });
  return data;
}

// ── Recomendador (sin candidatos): la IA sugiere opciones por conocimiento general ──
const SYSTEM_RECO = [
  'Eres un asesor audiológico independiente en Colombia. Un paciente no eligió marcas;',
  'según su test (pérdida, estilo de vida, prioridad, presupuesto, destreza, conectividad)',
  'recomienda 2 o 3 opciones de audífonos (marca/tecnología/plataforma o tipo) que le sirvan.',
  'Reglas:',
  '- Usa tu conocimiento general del mercado. NO afirmes precios exactos como hechos:',
  '  da un rango aproximado y aclara que debe confirmarse con un profesional.',
  '- Respeta el presupuesto declarado: prioriza opciones acordes.',
  '- Considera el grado de pérdida para el consejo.',
  '- Español de Colombia, claro y breve. Cierra invitando a agendar valoración para confirmar.',
].join('\n');

const SCHEMA_RECO = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recomendaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          opcion: { type: 'string' },
          porque: { type: 'string' },
          idealPara: { type: 'string' },
          rangoPrecioAprox: { type: 'string' },
        },
        required: ['opcion', 'porque', 'idealPara', 'rangoPrecioAprox'],
      },
    },
    consejoPorPerdida: { type: 'string' },
    resumen: { type: 'string' },
  },
  required: ['recomendaciones', 'consejoPorPerdida', 'resumen'],
};

async function generarRecomendacion(test) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('La recomendación con IA no está configurada (falta ANTHROPIC_API_KEY).');
    err.statusCode = 503;
    throw err;
  }
  const t = test || {};
  const userPrompt = [
    'Recomienda audífonos para este paciente según su test:',
    `Grado de pérdida: ${t.perdida || 'no indicado'}`,
    `Estilo de vida: ${t.estiloVida || 'no indicado'}`,
    `Prioridad: ${t.prioridad || 'no indicada'}`,
    `Presupuesto disponible: ${t.presupuestoCOP ? `${t.presupuestoCOP} COP` : (t.presupuesto || 'no indicado')}`,
    `Destreza/manejo: ${t.destreza || 'no indicado'}`,
    `Conectividad importante: ${t.conectividad || 'no indicado'}`,
    '',
    'Entrega 2 o 3 recomendaciones con rango de precio aproximado (aclarando que es referencial).',
  ].join('\n');

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3072,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA_RECO } },
    system: [{ type: 'text', text: SYSTEM_RECO, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Respuesta de IA vacía');
  return JSON.parse(textBlock.text);
}

module.exports = { generarComparacion, generarRecomendacion, etiquetaDe };
