/**
 * Descarga de adjuntos entrantes de WhatsApp.
 *
 * Meta no manda el archivo en el webhook: manda un id. Hay que pedirle la URL
 * temporal y luego bajar el binario, ambas cosas autenticadas. Hasta ahora esto
 * no existía y todo adjunto se guardaba como el texto literal "[image]".
 *
 * Meta retiene el archivo unos 30 días. Guardamos el id, no el binario: no hay
 * almacenamiento de archivos en el proyecto, y una audiometría es dato de salud
 * — mientras menos copias, mejor.
 */

const MAX_BYTES = 8 * 1024 * 1024; // techo defensivo: el vision de Claude no necesita más

/** Baja un adjunto por su media id. Devuelve { buffer, mimeType } o null. */
async function descargar(mediaId) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  if (!token || !mediaId) return null;

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${version}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) {
      console.warn('[wa-media] no pude resolver el media', mediaId, metaRes.status);
      return null;
    }
    const meta = await metaRes.json();
    if (!meta?.url) return null;
    if (meta.file_size && Number(meta.file_size) > MAX_BYTES) {
      console.warn('[wa-media]', mediaId, 'pesa', meta.file_size, '— se omite');
      return null;
    }

    // La URL de descarga también exige el token: no es pública.
    const binRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!binRes.ok) {
      console.warn('[wa-media] descarga falló', mediaId, binRes.status);
      return null;
    }
    const buffer = Buffer.from(await binRes.arrayBuffer());
    if (buffer.length > MAX_BYTES) return null;
    return { buffer, mimeType: meta.mime_type || 'application/octet-stream' };
  } catch (e) {
    console.warn('[wa-media] error con', mediaId, ':', e.message);
    return null;
  }
}

module.exports = { descargar, MAX_BYTES };
