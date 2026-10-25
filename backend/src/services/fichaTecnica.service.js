/**
 * Ficha técnica → producto del catálogo.
 *
 * Se sube el PDF (o una imagen) de la ficha del fabricante, se guarda en
 * Cloudinary para poder consultarla después, y Claude extrae los datos que
 * arman la cotización: nombre, plataforma, nivel y hasta 6 atributos cortos.
 * Solo se toma lo que dice el documento; el precio no viene en las fichas.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { isConfigured, cloudinary } = require('./storage.service');

const ICONOS = ['onda', 'bateria', 'celular', 'bluetooth', 'ia', 'agua', 'chip', 'oido', 'enfoque', 'hoja', 'tv', 'ajustes', 'estuche', 'check'];
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const INSTRUCCION = `Lees fichas técnicas de audífonos e implantes para armar cotizaciones de OírConecta (Colombia).
Devuelve SOLO un objeto JSON, sin texto antes ni después, con esta forma:
{
  "marca": "Widex",
  "nombre": "Widex Allure 220",           // marca + familia + nivel/tecnología si aparece
  "plataforma": "Allure",
  "tecnologia": "220",                     // nivel de tecnología si aparece, si no ""
  "linea": "RIC R D · Chip W1",            // máx. 30 caracteres: estilo + rasgo clave
  "sub": "RIC R D · Plataforma 2025",      // máx. 35 caracteres
  "etiqueta": "Lo más reciente",           // 2 a 3 palabras que lo distingan
  "recargable": "SI" | "NO",
  "atributos": [ { "i": "<icono>", "t": "Título corto", "d": "Una frase de beneficio para el paciente." } ]
}
Reglas:
- Usa únicamente datos que estén en el documento. Si algo no aparece, deja "" (no inventes cifras ni funciones).
- "atributos": de 4 a 6, los más útiles para un paciente (sonido, batería, conectividad, resistencia, tinnitus, diseño). Títulos de máx. 4 palabras, descripciones de máx. 12 palabras, en español claro y sin tecnicismos innecesarios.
- Si la ficha cubre varios niveles (440/330/220/110) y no se indica cuál, usa las funciones comunes a todos y deja "tecnologia" vacía.
- "i" debe ser uno de: ${ICONOS.join(', ')}.
- Tono amable, sin exageraciones comerciales.`;

function subirArchivo(buffer, nombre) {
  if (!isConfigured) return Promise.resolve(null);
  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'catalogo/fichas', public_id: `${Date.now()}-${String(nombre || 'ficha').replace(/[^\w.-]+/g, '_').slice(0, 60)}` },
      (err, res) => {
        if (err) { console.warn('[ficha] no se pudo guardar en Cloudinary:', err.message); return resolve(null); }
        resolve(res.secure_url);
      },
    );
    stream.end(buffer);
  });
}

function limpiarJson(texto) {
  const i = texto.indexOf('{'); const j = texto.lastIndexOf('}');
  if (i < 0 || j < i) throw new Error('La lectura no devolvió datos');
  const d = JSON.parse(texto.slice(i, j + 1));
  const s = (v, max) => String(v || '').trim().slice(0, max);
  return {
    marca: s(d.marca, 40),
    nombre: s(d.nombre, 80),
    plataforma: s(d.plataforma, 40),
    tecnologia: s(d.tecnologia, 20),
    linea: s(d.linea, 40),
    sub: s(d.sub, 50),
    etiqueta: s(d.etiqueta, 30),
    recargable: d.recargable === 'NO' ? 'NO' : 'SI',
    atributos: (Array.isArray(d.atributos) ? d.atributos : []).slice(0, 6).map((a) => ({
      i: ICONOS.includes(a?.i) ? a.i : 'check', t: s(a?.t, 40), d: s(a?.d, 120),
    })).filter((a) => a.t),
  };
}

/**
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file
 * @returns {Promise<{ datos: object|null, ficha: { nombre, url, subidaEl } , aviso?: string }>}
 */
async function leerFicha(file) {
  if (!file?.buffer) throw Object.assign(new Error('No llegó ningún archivo'), { status: 400 });
  if (!TIPOS.includes(file.mimetype)) throw Object.assign(new Error('Sube la ficha en PDF, JPG, PNG o WEBP'), { status: 400 });

  const url = await subirArchivo(file.buffer, file.originalname);
  const ficha = { nombre: file.originalname || 'Ficha técnica', url, subidaEl: new Date().toISOString() };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { datos: null, ficha, aviso: 'La ficha se guardó, pero la lectura automática no está configurada (falta ANTHROPIC_API_KEY).' };
  }

  const contenido = file.mimetype === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.buffer.toString('base64') } }
    : { type: 'image', source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') } };

  try {
    const client = new Anthropic();
    const r = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1500,
      system: INSTRUCCION,
      messages: [{ role: 'user', content: [contenido, { type: 'text', text: 'Extrae los datos de esta ficha técnica.' }] }],
    });
    const texto = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    return { datos: limpiarJson(texto), ficha };
  } catch (e) {
    console.warn('[ficha] lectura falló:', e.message);
    return { datos: null, ficha, aviso: 'La ficha se guardó, pero no se pudo leer automáticamente. Completa los datos a mano.' };
  }
}

module.exports = { leerFicha, limpiarJson };
