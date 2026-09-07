/**
 * Notas de voz entrantes de WhatsApp.
 *
 * Mucho paciente mayor no escribe: manda audios. Hasta ahora el bot se quedaba
 * mudo ante uno —el webhook no reconocía el tipo, el mensaje se guardaba como
 * "[audio]" sin contenido y nadie respondía—, justo con la gente que más nos
 * necesita.
 *
 * Se transcribe con Whisper (misma OPENAI_API_KEY que ya usan los documentos
 * del cerebro) y la transcripción entra al bot como si la hubiera escrito.
 *
 * Lo que se guarda es el TEXTO, no el audio: así la bandeja se puede leer sin
 * reproducir nada, y del archivo solo queda el id de Meta. Una nota de voz
 * sobre la salud de alguien es dato sensible; mientras menos copias, mejor.
 */

const MAX_BYTES = 16 * 1024 * 1024;   // el techo de Whisper es 25 MB
const MODELO = 'whisper-1';

let cachedClient = null;
function cliente() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cachedClient) {
    const OpenAI = require('openai');
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cachedClient;
}

/**
 * Transcribe una nota de voz.
 * @param {{buffer: Buffer, mimeType: string}} archivo — lo que devuelve waMedia.descargar
 * @returns {Promise<string|null>} el texto, o null si no se pudo
 */
async function transcribir(archivo) {
  const client = cliente();
  if (!client) {
    console.warn('[wa-audio] OPENAI_API_KEY no configurada — no puedo transcribir');
    return null;
  }
  if (!archivo?.buffer?.length) return null;
  if (archivo.buffer.length > MAX_BYTES) {
    console.warn('[wa-audio] audio de', archivo.buffer.length, 'bytes — demasiado grande');
    return null;
  }

  // WhatsApp manda ogg/opus. Whisper lo acepta, pero necesita el nombre del
  // archivo con extensión para saber qué está recibiendo.
  const ext = (archivo.mimeType || '').includes('mp4') ? 'mp4'
    : (archivo.mimeType || '').includes('mpeg') ? 'mp3'
    : (archivo.mimeType || '').includes('wav') ? 'wav'
    : 'ogg';

  try {
    const { toFile } = require('openai');
    const file = await toFile(archivo.buffer, `nota.${ext}`, { type: archivo.mimeType });
    const r = await client.audio.transcriptions.create({
      file,
      model: MODELO,
      language: 'es',
      // El contexto sube mucho la precisión en los términos del oficio, que es
      // justo lo que Whisper suele destrozar.
      prompt: 'Consulta de audiología en Colombia. Términos frecuentes: audiometría, audífonos, impedanciometría, otorrino, tapón de cerumen, zumbido, tinnitus, valoración auditiva, adaptación, molde, pila, OírConecta.',
    });
    const texto = String(r?.text || '').trim();
    if (!texto) return null;
    console.log('[wa-audio] transcritos', texto.length, 'caracteres');
    return texto;
  } catch (e) {
    console.error('[wa-audio] transcripción falló:', e.message);
    return null;
  }
}

module.exports = { transcribir };
