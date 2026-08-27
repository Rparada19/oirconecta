/**
 * Avisos de pedido por WhatsApp.
 *
 * La tienda no notificaba nada en ningún estado: el cliente pagaba y quedaba a
 * ciegas hasta que le llegara el paquete. Eso genera la mitad de los "¿ya salió
 * lo mío?" que aterrizan en la línea.
 *
 * Límite de Meta: fuera de la ventana de 24h solo se puede mandar plantilla
 * aprobada. Mientras no exista una plantilla de pedidos aprobada, esto avisa
 * únicamente cuando la ventana está abierta (el cliente escribió hace poco) y
 * deja constancia en el log cuando no puede. Nunca revienta el cambio de estado.
 */

const prisma = require('../db');

const MENSAJES = {
  PAGADO: (n) => `¡Listo! Recibimos el pago de tu pedido #${n}. Ya lo estamos preparando y te avisamos apenas salga. 📦`,
  EN_PREPARACION: (n) => `Tu pedido #${n} está en preparación. Te escribimos cuando salga para entrega.`,
  ENVIADO: (n) => `Tu pedido #${n} va en camino. 🛵 Si no lo recibes en los próximos días, escríbenos por acá y lo rastreamos.`,
  ENTREGADO: (n) => `Tu pedido #${n} figura como entregado. ¿Todo bien con lo que pediste?`,
  CANCELADO: (n) => `Tu pedido #${n} quedó cancelado. Si no fuiste tú o necesitas ayuda, respóndenos por acá.`,
};

/** Últimos 10 dígitos: es como se cruzan teléfonos en todo el proyecto. */
const last10 = (t) => String(t || '').replace(/\D/g, '').slice(-10);

/**
 * Avisa al cliente del cambio de estado. Best-effort: cualquier fallo se loguea
 * y se sigue — un aviso perdido no puede impedir que el pedido avance.
 * @param {string} orderId
 * @param {string} nuevoEstado
 */
async function avisarCambioDeEstado(orderId, nuevoEstado) {
  const texto = MENSAJES[nuevoEstado];
  if (!texto) return { skipped: 'estado-sin-aviso' };

  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      select: { numero: true, customer: { select: { telefono: true, nombre: true } } },
    });
    const tel = last10(order?.customer?.telefono);
    if (!tel) return { skipped: 'sin-telefono' };

    const conv = await prisma.whatsAppConversation.findFirst({
      where: { phone: { contains: tel } },
      select: { id: true, windowExpiresAt: true },
    });
    if (!conv) {
      console.log('[shop-notify] pedido', order.numero, '→', nuevoEstado, ': el cliente nunca ha escrito, no hay a quién responderle');
      return { skipped: 'sin-conversacion' };
    }
    if (!conv.windowExpiresAt || conv.windowExpiresAt < new Date()) {
      console.log('[shop-notify] pedido', order.numero, '→', nuevoEstado, ': ventana de 24h cerrada, hace falta una plantilla aprobada en Meta');
      return { skipped: 'ventana-cerrada' };
    }

    const corp = require('./waCorporate.service');
    await corp.sendTextToConversation({
      conversationId: conv.id,
      text: texto(order.numero),
      sentByBot: true,
    });
    return { sent: true };
  } catch (e) {
    console.warn('[shop-notify] falló para pedido', orderId, ':', e.message);
    return { error: e.message };
  }
}

module.exports = { avisarCambioDeEstado };
