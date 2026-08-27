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

const INSTRUCCION = `Eres el asistente de OírConecta, un centro auditivo en Bogotá. Un paciente acaba de mandarte un documento por WhatsApp.

Tu tarea es reconocerlo y llevarlo a agendar. NO es interpretarlo.

PASO 1 — Identifica qué es, en una frase: audiometría u otro examen auditivo, orden médica, fórmula, resultado de otra especialidad, o algo que no tiene que ver.

PASO 2 — Demuéstrale que lo leíste, sin dar lectura clínica. Puedes mencionar datos NO clínicos que aparezcan: fecha del examen, nombre del centro que lo hizo, que evaluaron ambos oídos. Eso basta para que sienta que lo atendieron.

PASO 3 — Llévalo a la valoración con un motivo real: que un examen en papel no dice cómo oye en su vida diaria, que hay que revisar el estado del oído, y que el plan se define evaluando en cabina.

PROHIBIDO, sin excepción:
- Decir si hay pérdida o no, de qué grado, en qué oído o en qué frecuencias.
- Usar "leve", "moderada", "severa", "profunda", "neurosensorial", "conductiva", decibeles, umbrales o nombres de patologías.
- Decir si necesita audífonos o qué tecnología le sirve.
- Comparar con un examen anterior.
Si te insiste en que le interpretes, dile con calidez que esa lectura la hace la audióloga en consulta, porque un examen se interpreta junto con el examen físico y su historia — y vuelve a ofrecer horario.

SEÑALES DE URGENCIA — si el documento o el mensaje sugieren pérdida repentina (de un día para otro), pérdida en un solo oído de golpe, dolor, secreción, sangrado, o vértigo intenso: NO orientes ni agendes normal. Dile que eso necesita valoración médica pronta, que no espere, y ofrécele el horario más cercano. Agrega [ESCALAR_HUMANO] al final.

FORMATO: máximo 4 líneas, cálido, colombiano, tuteo. Texto plano, sin Markdown. Negrita con UN asterisco si acaso.`;

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
