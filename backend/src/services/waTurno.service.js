/**
 * Turno de respuesta del bot — una sola respuesta por tanda de mensajes.
 *
 * El paciente escribe como habla: "vivo en cúcuta", enter, "gracias". Antes
 * cada mensaje disparaba su propia llamada al modelo, en paralelo y sin ver
 * la del otro, así que el bot contestaba dos veces y se contradecía.
 *
 * Aquí se junta todo lo que llega dentro de una ventana (WA_BOT_ESPERA_MS) y
 * se responde una vez. Si mientras el bot responde entra otro mensaje, no se
 * lanza una segunda respuesta: espera a que la primera termine.
 *
 * Es memoria del proceso: con un solo servicio en Render alcanza. Si algún día
 * hay varias instancias, esto hay que moverlo a Redis.
 */

const ESPERA_MS = Number(process.env.WA_BOT_ESPERA_MS || 9000);

/** conversationId → { textos, desdeAudio, timer, corriendo, ejecutar } */
const turnos = new Map();

/**
 * Acumula un mensaje del paciente y programa la respuesta.
 * @param {string} conversationId
 * @param {string} texto
 * @param {{ desdeAudio?: boolean }} opts
 * @param {(textoJunto: string, opts: { desdeAudio: boolean }) => Promise<void>} ejecutar
 */
function encolar(conversationId, texto, opts, ejecutar) {
  const id = String(conversationId);
  let t = turnos.get(id);
  if (!t) {
    t = { textos: [], desdeAudio: false, timer: null, corriendo: false, ejecutar: null };
    turnos.set(id, t);
  }
  t.textos.push(String(texto || '').trim());
  t.desdeAudio = t.desdeAudio || !!opts?.desdeAudio;
  t.ejecutar = ejecutar;
  if (t.timer) clearTimeout(t.timer);
  t.timer = setTimeout(() => { disparar(id).catch(() => {}); }, ESPERA_MS);
  if (typeof t.timer.unref === 'function') t.timer.unref();
}

async function disparar(id) {
  const t = turnos.get(id);
  if (!t) return;
  t.timer = null;
  // Ya hay una respuesta en vuelo: al terminar ella misma vuelve a programar.
  if (t.corriendo) return;
  if (!t.textos.length) { turnos.delete(id); return; }

  const textoJunto = t.textos.splice(0).filter(Boolean).join('\n');
  const desdeAudio = t.desdeAudio;
  t.desdeAudio = false;
  t.corriendo = true;
  try {
    await t.ejecutar(textoJunto, { desdeAudio });
  } catch (e) {
    console.error('[wa-turno] respuesta falló para conv', id, '-', e.message);
  } finally {
    t.corriendo = false;
    if (t.textos.length) {
      if (!t.timer) {
        t.timer = setTimeout(() => { disparar(id).catch(() => {}); }, ESPERA_MS);
        if (typeof t.timer.unref === 'function') t.timer.unref();
      }
    } else if (!t.timer) {
      turnos.delete(id);
    }
  }
}

module.exports = { encolar, ESPERA_MS };
