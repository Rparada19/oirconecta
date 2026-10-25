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

const INSTRUCCION_ANALISIS = `Clasificas archivos sueltos del catálogo de un centro auditivo (audífonos, implantes, cargadores, accesorios).
Cada archivo es UNA de estas cosas:
- "ficha": ficha técnica / folleto con texto y especificaciones.
- "foto": fotografía o render del producto (audífono, cargador, estuche), con poco o ningún texto.
- "otro": nada de lo anterior.
Devuelve SOLO un objeto JSON:
{
  "tipo": "ficha" | "foto" | "otro",
  "marca": "",          // Widex, Phonak, Oticon, Signia, ReSound, Starkey... si se puede saber
  "nombre": "",         // marca + familia + nivel si se sabe, p. ej. "Widex Allure 220". Si es foto y no se puede saber el modelo, déjalo vacío.
  "plataforma": "",     // familia: Allure, Moment, SmartRIC, Lumity...
  "tecnologia": "",     // nivel: 440, 330, 220, 110... si aparece
  "color": "",          // solo para fotos, si se distingue
  "confianza": "alta" | "media" | "baja"
  // Solo si tipo = "ficha", agrega también: "linea", "sub", "etiqueta", "recargable", "atributos" (mismas reglas de abajo)
}
Para fichas: "linea" máx. 30 caracteres (estilo + rasgo clave), "sub" máx. 35, "etiqueta" 2-3 palabras, "recargable" "SI"/"NO", "atributos" 4 a 6 objetos {"i","t","d"} con "i" en: ${ICONOS.join(', ')}; títulos de máx. 4 palabras y descripciones de máx. 12 palabras, en español claro.
Usa el nombre del archivo como pista. No inventes: si un dato no se ve, déjalo vacío y baja la confianza.`;

function subirImagen(buffer, mimetype) {
  if (!isConfigured) return Promise.resolve(`data:${mimetype};base64,${buffer.toString('base64')}`);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'catalogo/fotos', public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      (err, res) => (err ? reject(err) : resolve(res.secure_url)),
    );
    stream.end(buffer);
  });
}

/**
 * Clasifica un archivo suelto (foto o ficha) y lee de qué producto es.
 * Las fichas se guardan de una vez; las fotos se suben después, ya sin fondo.
 */
async function analizarArchivo(file) {
  if (!file?.buffer) throw Object.assign(new Error('No llegó ningún archivo'), { status: 400 });
  if (!TIPOS.includes(file.mimetype)) throw Object.assign(new Error('Formato no soportado'), { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return { archivo: file.originalname, tipo: file.mimetype === 'application/pdf' ? 'ficha' : 'foto', producto: {}, aviso: 'Lectura automática no configurada' };
  }
  const contenido = file.mimetype === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.buffer.toString('base64') } }
    : { type: 'image', source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') } };
  const client = new Anthropic();
  const r = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1500,
    system: INSTRUCCION_ANALISIS,
    messages: [{ role: 'user', content: [contenido, { type: 'text', text: `Nombre del archivo: ${file.originalname || 'sin nombre'}` }] }],
  });
  const texto = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const i = texto.indexOf('{'); const j = texto.lastIndexOf('}');
  const raw = i >= 0 && j > i ? JSON.parse(texto.slice(i, j + 1)) : {};
  const tipo = ['ficha', 'foto', 'otro'].includes(raw.tipo) ? raw.tipo : 'otro';
  const producto = limpiarJson(JSON.stringify(raw));
  const out = { archivo: file.originalname, tipo, confianza: raw.confianza || 'baja', color: String(raw.color || '').slice(0, 30), producto };
  if (tipo === 'ficha') {
    const url = file.mimetype === 'application/pdf' ? await subirArchivo(file.buffer, file.originalname) : await subirImagen(file.buffer, file.mimetype).catch(() => null);
    out.ficha = { nombre: file.originalname || 'Ficha técnica', url, subidaEl: new Date().toISOString(), tipo: file.mimetype };
  }
  return out;
}

module.exports = { leerFicha, limpiarJson, analizarArchivo, subirImagen };
