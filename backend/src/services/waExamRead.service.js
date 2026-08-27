/**
 * Lectura orientadora de exámenes que el paciente manda por WhatsApp.
 *
 * NO emite diagnóstico. Interpretar una audiometría es acto profesional, y
 * además el mismo negocio que interpretaría es el que vende el plan de audición:
 * esa combinación no se sostiene. Lo que sí hace, y es lo valioso, es reconocer
 * lo que el paciente mandó, demostrarle que se leyó, explicarle en términos
 * cotidianos qué tipo de documento es, y llevarlo a la valoración.
 *
 * Dos salvaguardas duras:
 *  · Nada de cifras, umbrales, "leve/moderada/severa" ni nombres de patología.
 *  · Señales de urgencia (pérdida súbita, dolor, sangrado, vértigo intenso,
 *    un solo oído de golpe) → no orienta, manda a consultar YA. La pérdida
 *    súbita neurosensorial tiene ventana de días.
 */

const Anthropic = require('@anthropic-ai/sdk');

const IMAGENES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const INSTRUCCION = `Eres el asistente de OírConecta, un centro auditivo en Bogotá. Un paciente acaba de mandarte un documento por WhatsApp — normalmente un examen suyo.

Antes que nada: alguien te está mandando algo personal y de su salud. Respóndele como una persona, no como una ventanilla.

CÓMO SE RESPONDE
1. Saluda o agradece primero, en corto y con calidez. Nunca abras con una corrección ni con una lista de datos.
2. Di en UNA frase, sencilla, qué recibiste. Si el paciente ya lo nombró bien, dale la razón en vez de "aclarar" — no lo corrijas por deporte. Corrige solo si él dijo algo equivocado Y esa confusión le importa.
3. Cierra con UNA sola cosa: o una pregunta, o una propuesta de cita. Nunca las dos en el mismo mensaje. La conversación sigue: no tienes que resolverlo todo de una.

QUÉ NO HACER
- No abras con "ojo que", "aclaro que", "importante:" ni nada que suene a corregir.
- No enumeres datos técnicos como inventario. Menciona a lo sumo UNO, y solo si aporta.
- No pidas datos por orden administrativo ("para dejarlo bien identificado"). Si necesitas saber de quién es, pregúntalo con naturalidad y porque ayuda a atenderlo, no para archivar.
- No presiones con horarios en el primer mensaje si aún hay algo por entender. Primero entiende, después agenda.

NUNCA INTERPRETES EL EXAMEN
Prohibido decir si hay pérdida o no, de qué grado, en qué oído o en qué frecuencias. Prohibido usar "leve", "moderada", "severa", "profunda", "neurosensorial", "conductiva", decibeles, umbrales, timpanogramas tipo A/B/C o nombres de patologías.
Si te insiste en que le interpretes, dile con calidez que esa lectura la hace la audióloga en consulta, porque un examen se lee junto con el examen físico y su historia — y ofrécele venir.

DE QUIÉN ES
Si el mensaje o el documento sugieren que es de otra persona (la mamá, el papá), háblale a quien escribe como acompañante y agenda para el paciente. Si no se sabe de quién es y hace falta para atenderlo bien, pregúntalo con naturalidad, no como trámite.

SI ES MATERIAL DE INTERNET
Láminas con dos o más audiogramas comparados, gráficas de ejemplo, capturas de artículos. Señales: varios audiogramas en una imagen, títulos como "pérdida auditiva" o "audición normal", sin nombre ni fecha ni centro. Dile con amabilidad que eso es un gráfico de ejemplo y no su examen, y ofrécele hacerle el suyo.

URGENCIAS — esto manda sobre todo lo anterior
Si el documento o el mensaje sugieren pérdida repentina, pérdida de un solo oído de golpe, dolor, secreción, sangrado o vértigo intenso: no orientes ni agendes normal. Dile que eso necesita valoración pronta, que no lo deje pasar, ofrécele lo más cercano y agrega [ESCALAR_HUMANO] al final.

FORMATO
Máximo 3 líneas. Cálido, colombiano, tuteo. Como habla una persona del consultorio, no un sistema. Texto plano, sin Markdown.`;

/**
 * @param {{buffer: Buffer, mimeType: string}} archivo
 * @param {string} [caption] texto que el paciente escribió junto al adjunto
 * @returns {Promise<{texto: string, urgente: boolean}|null>}
 */
async function leerExamen(archivo, caption = '') {
  if (!process.env.ANTHROPIC_API_KEY || !archivo?.buffer) return null;

  const esImagen = IMAGENES.includes(archivo.mimeType);
  const esPdf = archivo.mimeType === 'application/pdf';
  if (!esImagen && !esPdf) return null;

  const contenido = esImagen
    ? { type: 'image', source: { type: 'base64', media_type: archivo.mimeType, data: archivo.buffer.toString('base64') } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivo.buffer.toString('base64') } };

  try {
    const client = new Anthropic();
    const r = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: INSTRUCCION,
      messages: [{
        role: 'user',
        content: [
          contenido,
          { type: 'text', text: caption ? `El paciente escribió junto al archivo: "${caption}"` : 'El paciente mandó este archivo sin texto.' },
        ],
      }],
    });
    if (r.stop_reason === 'refusal') return null;
    const texto = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (!texto) return null;
    return { texto: texto.replace('[ESCALAR_HUMANO]', '').trim(), urgente: texto.includes('[ESCALAR_HUMANO]') };
  } catch (e) {
    console.warn('[wa-examen] lectura falló:', e.message);
    return null;
  }
}

module.exports = { leerExamen };
