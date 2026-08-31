/**
 * Aviso al equipo cuando un paciente escribe y hace falta una persona.
 *
 * El problema real: nadie vive con el CRM abierto. Un mensaje que entra a las
 * 8 de la noche, o una conversación que el bot escala, se queda esperando en la
 * bandeja hasta que alguien se acuerde de mirar.
 *
 * Hoy sale por correo, que es el único canal que funciona sin trámite: en el
 * celular llega como notificación igual. Escribirle al WhatsApp personal
 * requiere una plantilla aprobada por Meta — fuera de la ventana de 24h no se
 * puede mandar texto libre ni al dueño del negocio. Cuando exista la plantilla,
 * se cambia el canal aquí y nada más.
 */

const prisma = require('../db');

/// No más de un aviso por conversación en este lapso. Sin esto, alguien que
/// manda seis mensajes seguidos genera seis correos.
const SILENCIO_MIN = 30;

const DESTINO = () => process.env.ALERTAS_WA_EMAIL || process.env.ADMIN_EMAIL || null;

/**
 * @param {string} conversationId
 * @param {{ motivo: 'escalado'|'sin_bot', texto?: string }} ctx
 */
async function avisarMensajeEntrante(conversationId, ctx = {}) {
  const to = DESTINO();
  if (!to) {
    console.warn('[wa-alerta] sin destinatario: configura ALERTAS_WA_EMAIL o ADMIN_EMAIL');
    return { skipped: 'sin-destino' };
  }

  try {
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true, phone: true, contactName: true, status: true,
        unreadCount: true, lastMessagePreview: true, updatedAt: true,
        patient: { select: { nombre: true } },
      },
    });
    if (!conv) return { skipped: 'sin-conversacion' };

    // Silencio: si ya se avisó hace poco por esta conversación, no se repite.
    const desde = new Date(Date.now() - SILENCIO_MIN * 60000);
    const reciente = await prisma.notification.findFirst({
      where: {
        templateCode: 'wa_alerta_interna',
        createdAt: { gte: desde },
        payload: { path: ['conversationId'], equals: conversationId },
      },
      select: { id: true },
    }).catch(() => null);
    if (reciente) return { skipped: 'silencio' };

    const quien = conv.patient?.nombre || conv.contactName || `+${conv.phone}`;
    const asunto = ctx.motivo === 'escalado'
      ? `El bot escaló: ${quien} necesita una persona`
      : `${quien} escribió por WhatsApp`;

    const email = require('./email.service');
    await email.enviarAlertaInterna({
      to,
      asunto,
      quien,
      telefono: conv.phone,
      preview: ctx.texto || conv.lastMessagePreview || '',
      sinLeer: conv.unreadCount || 0,
      motivo: ctx.motivo,
    });

    // Se registra para poder aplicar el silencio en el siguiente mensaje.
    await prisma.notification.create({
      data: {
        templateCode: 'wa_alerta_interna',
        channel: 'EMAIL',
        status: 'SENT',
        to,
        payload: { conversationId, motivo: ctx.motivo },
      },
    }).catch(() => {});

    return { sent: true };
  } catch (e) {
    console.warn('[wa-alerta] falló:', e.message);
    return { error: e.message };
  }
}

module.exports = { avisarMensajeEntrante };
