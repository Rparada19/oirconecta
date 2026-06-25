#!/usr/bin/env node
/**
 * Refresca la información estructurada de cada marca de audífonos e implantes
 * llamando a la Claude API con la herramienta web_search. Cada marca queda
 * en backend/content/brands/<slug>.json.
 *
 * Uso:
 *   node scripts/refresh-brand-data.js                 # todas las marcas
 *   node scripts/refresh-brand-data.js --brand widex   # una sola
 *   node scripts/refresh-brand-data.js --skip-existing # solo las que no tienen json
 *   node scripts/refresh-brand-data.js --dry-run       # imprime sin escribir
 *
 * Requiere ANTHROPIC_API_KEY en el entorno.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BRANDS_DIR = path.join(ROOT, 'content', 'brands');
const CONFIG_FILE = path.join(BRANDS_DIR, '_brands.config.json');

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const MAX_SEARCH_USES = Number(process.env.WEB_SEARCH_MAX_USES || 6);

const argv = process.argv.slice(2);
const onlyBrand = argv.find((a) => a.startsWith('--brand='))?.split('=')[1]
  || (argv.includes('--brand') ? argv[argv.indexOf('--brand') + 1] : null);
const skipExisting = argv.includes('--skip-existing');
const dryRun = argv.includes('--dry-run');

function buildPrompt({ slug, nombre, fabricante, origen, sitio_oficial, categoria }) {
  const tipoTexto = categoria === 'implantes' ? 'implantes auditivos (cocleares, oído medio, conducción ósea)' : 'audífonos';
  return `Eres un investigador especializado en salud auditiva. Tu tarea es preparar un perfil estructurado y actualizado de la marca **${nombre}** (${fabricante}, ${origen}), enfocado en sus ${tipoTexto} disponibles en el mercado colombiano.

Usa la herramienta web_search para consultar:
1. Sitio oficial: ${sitio_oficial}
2. Distribuidores y centros auditivos en Colombia que vendan la marca
3. Catálogo actual de modelos (no descontinuados)
4. Tecnologías clave (las propietarias y las estándar)
5. Rangos de precio referenciales en pesos colombianos cuando estén disponibles públicamente
6. FAQ comunes sobre la marca (en español)

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin texto antes o después) con este schema exacto:

{
  "slug": "${slug}",
  "nombre": "${nombre}",
  "categoria": "${categoria === 'implantes' ? 'implante' : 'audifono'}",
  "metadata": {
    "actualizado": "ISO_DATE_NOW",
    "fuente": "claude con web_search",
    "version": 1
  },
  "marca": {
    "fabricante": "${fabricante}",
    "origen_pais": "${origen}",
    "año_fundacion": null,
    "sitio_oficial": "${sitio_oficial}",
    "sitio_oficial_co": null,
    "fuerza_principal": "una frase",
    "publico_objetivo": "una frase"
  },
  "lineas_actuales": [
    {
      "nombre": "string",
      "tipo": "RIC|BTE|ITC|CIC|ITE|Procesador externo|Implante interno|Conducción ósea",
      "año_lanzamiento": null,
      "descripcion_corta": "1 frase",
      "tecnologias_clave": ["string", "string"],
      "niveles_perdida": ["leve|moderada|severa|profunda"],
      "conectividad": ["string"],
      "bateria": { "tipo": "recargable|pila", "horas_max": null },
      "resistencia": "string o null",
      "rango_precio_cop": { "min": null, "max": null, "nota": "string o null" }
    }
  ],
  "tecnologias_destacadas": [
    { "nombre": "string", "descripcion": "1-2 frases", "patentado": true }
  ],
  "presencia_colombia": {
    "distribuidor_oficial": "string o null",
    "ciudades_principales": ["Bogotá", "Medellín"],
    "centros_afiliados": "string o null",
    "soporte_post_venta": "string o null"
  },
  "preguntas_frecuentes": [
    { "q": "string", "a": "string" }
  ]
}

Reglas:
- 3 a 6 entradas en lineas_actuales (las más vendidas y actuales)
- 3 a 5 tecnologias_destacadas
- 3 a 5 preguntas_frecuentes
- No inventes precios exactos. Si no encuentras precio público, deja "min" y "max" en null y usa "nota" con un rango aproximado ("entre X y Y millones por par" si es razonable)
- Si no encuentras la info, usa null en ese campo, NUNCA inventes
- Texto en español colombiano
- JSON estricto. Sin trailing commas. Sin markdown. Sin comentarios.`;
}

async function callClaudeForBrand(brand, categoria) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está definida');

  const prompt = buildPrompt({ ...brand, categoria });

  const body = {
    model: MODEL,
    max_tokens: 5000,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: MAX_SEARCH_USES,
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API ${res.status}: ${t}`);
  }
  const json = await res.json();

  // Última respuesta de texto del modelo
  const textBlock = (json.content || []).filter((b) => b.type === 'text').pop();
  if (!textBlock?.text) throw new Error('Respuesta sin contenido de texto');

  // Limpiar fences si los hubiera
  let raw = textBlock.text.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  // Reemplazar placeholder de fecha
  raw = raw.replace('ISO_DATE_NOW', new Date().toISOString());

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`No se pudo parsear JSON: ${e.message}\n---\n${raw.slice(0, 600)}`);
  }
  return data;
}

async function main() {
  if (!fs.existsSync(CONFIG_FILE)) throw new Error(`Falta ${CONFIG_FILE}`);
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

  const all = [
    ...config.audifonos.map((b) => ({ ...b, _categoria: 'audifonos' })),
    ...config.implantes.map((b) => ({ ...b, _categoria: 'implantes' })),
  ];
  const targets = onlyBrand ? all.filter((b) => b.slug === onlyBrand) : all;
  if (!targets.length) throw new Error(onlyBrand ? `Marca desconocida: ${onlyBrand}` : 'Nada que procesar');

  console.log(`→ Procesando ${targets.length} marca(s) con ${MODEL}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const b of targets) {
    const out = path.join(BRANDS_DIR, `${b.slug}.json`);
    if (skipExisting && fs.existsSync(out)) {
      console.log(`↪︎ ${b.slug} ya existe — skip`);
      skip++;
      continue;
    }
    process.stdout.write(`· ${b.slug.padEnd(22)} `);
    try {
      const data = await callClaudeForBrand(b, b._categoria);
      if (dryRun) {
        console.log(`OK (dry-run, ${JSON.stringify(data).length} chars)`);
      } else {
        fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`OK · ${out.replace(ROOT + '/', '')}`);
      }
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message.split('\n')[0]}`);
      fail++;
    }
    // Pausa para no abusar de la API
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nResumen: ${ok} ok · ${skip} skip · ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
