/**
 * El QR que va impreso en las tarjetas del aliado.
 *
 * Se genera aquí y no en el navegador porque lo que necesita el aliado es un
 * archivo para la imprenta, no un dibujo en pantalla. Por eso el formato por
 * defecto es SVG: es vectorial, se amplía a cualquier tamaño sin pixelarse, y
 * es lo que pide cualquier litografía.
 *
 * El contenido del QR es el enlace de WhatsApp con el mensaje prellenado. Si
 * cambia el nombre del aliado cambia el mensaje, pero NO el código de
 * atribución: las tarjetas ya impresas siguen sirviendo.
 */

const QRCode = require('qrcode');

const WA_NUMBER = (process.env.CENTRO_WHATSAPP || '573171503944').replace(/\D/g, '');

function enlaceQr(nombreAliado) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Vengo de ${nombreAliado}`)}`;
}

/** Nombre de archivo amable para la descarga: qr-plug-e.svg */
function nombreArchivo(nombreAliado, ext) {
  const base = String(nombreAliado || 'aliado')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `qr-${base || 'aliado'}.${ext}`;
}

/**
 * Corrección de errores alta (H): un QR impreso se raya, se dobla y se mancha.
 * Con H sigue leyéndose aunque se pierda hasta un 30% del dibujo, que es lo que
 * uno quiere en una tarjeta que va en un bolsillo.
 */
const OPCIONES = { errorCorrectionLevel: 'H', margin: 2 };

async function svg(nombreAliado) {
  return QRCode.toString(enlaceQr(nombreAliado), { ...OPCIONES, type: 'svg' });
}

async function png(nombreAliado, size = 1024) {
  const width = Math.min(Math.max(Number(size) || 1024, 128), 2048);
  return QRCode.toBuffer(enlaceQr(nombreAliado), { ...OPCIONES, type: 'png', width });
}

/** Envía el QR como descarga, en el formato pedido. */
async function responder(res, nombreAliado, { formato = 'svg', size } = {}) {
  if (String(formato).toLowerCase() === 'png') {
    const buf = await png(nombreAliado, size);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo(nombreAliado, 'png')}"`);
    return res.send(buf);
  }
  const texto = await svg(nombreAliado);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo(nombreAliado, 'svg')}"`);
  return res.send(texto);
}

module.exports = { enlaceQr, nombreArchivo, svg, png, responder };
