/**
 * Verifica que el webhook venga de Meta y no de cualquiera.
 *
 * Meta firma cada POST con HMAC-SHA256 del cuerpo crudo usando el App Secret,
 * y lo manda en `X-Hub-Signature-256: sha256=<hex>`.
 *
 * Sin esto, la URL del webhook es una puerta abierta: quien la conozca puede
 * inventar mensajes entrantes, hacer que el bot responda gastando tokens, y
 * —lo más serio— confirmar citas ajenas, porque el handler acepta
 * `confirm_appt:<token>` sin más validación que el propio payload.
 *
 * ROLL-OUT: si META_APP_SECRET no está configurado, deja pasar y avisa fuerte
 * en el log. Rechazar sin la clave dejaría el WhatsApp mudo en el instante del
 * despliegue. Apenas se configure la variable, la verificación se vuelve
 * obligatoria sola.
 */

const crypto = require('crypto');

function verifyMetaSignature(req, res, next) {
  const secret = process.env.META_APP_SECRET;

  if (!secret) {
    console.warn('[wa-webhook] META_APP_SECRET no configurado — el webhook acepta cualquier origen. Configúralo en Render para cerrarlo.');
    return next();
  }

  const firma = req.get('x-hub-signature-256') || '';
  if (!firma.startsWith('sha256=')) {
    console.warn('[wa-webhook] rechazado: sin cabecera de firma');
    return res.status(403).send('forbidden');
  }
  if (!req.rawBody) {
    console.warn('[wa-webhook] rechazado: no se capturó el cuerpo crudo');
    return res.status(403).send('forbidden');
  }

  const esperada = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  // timingSafeEqual exige buffers del mismo largo; si difieren, ya no coincide.
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn('[wa-webhook] rechazado: firma inválida');
    return res.status(403).send('forbidden');
  }

  return next();
}

module.exports = verifyMetaSignature;
