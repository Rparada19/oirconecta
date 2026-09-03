/**
 * Aliados referidores — plug-e y los que sigan.
 *
 * El QR de la tarjeta impresa apunta a
 *   https://wa.me/<numero>?text=Vengo%20de%20Plug-e
 * y ese texto llega como PRIMER mensaje de la conversación. Meta solo manda el
 * objeto `referral` en anuncios click-to-WhatsApp, no en un QR de wa.me, así
 * que el mensaje prellenado es la única señal confiable con papel impreso.
 *
 * Regla de atribución acordada con el aliado: no caduca. Una vez el paciente
 * queda marcado con un aliado, cualquier venta suya es de ese aliado. Por eso
 * nunca se sobreescribe un partnerId ya asignado.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Normaliza para comparar: sin tildes, sin signos, minúsculas. */
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * ¿El texto de este mensaje viene del QR de algún aliado activo?
 * Compara contra el código normalizado, así "Vengo de Plug-e" y "vengo de
 * pluge" caen igual. Devuelve el aliado o null.
 */
async function detectarEnTexto(texto) {
  const plano = normalizar(texto);
  if (!plano) return null;

  const activos = await prisma.referralPartner.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, code: true, comisionPct: true },
  });
  return activos.find((p) => plano.includes(normalizar(p.code))) || null;
}

/**
 * Marca la conversación con el aliado. Idempotente y no destructivo: si la
 * conversación ya tenía aliado, se respeta el primero.
 */
async function marcarConversacion(conversationId, partnerId) {
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, partnerId: true, contactType: true },
  });
  if (!conv) return null;

  // Ya atribuida Y en la rama correcta: escaneó otra vez, no hay nada que hacer.
  if (conv.partnerId === partnerId && conv.contactType === 'REFERIDO_ALIADO') {
    return { partnerId, primeraVez: false };
  }

  // Escanear el QR manda sobre cualquier tipificación anterior. Antes se
  // respetaba la rama previa para no reiniciarle la toma de datos a quien ya
  // estaba conversando, y el efecto fue peor: alguien tipificado como
  // profesional en una prueba vieja escaneaba la tarjeta y el bot le hablaba
  // de "tu paciente". La intención de hoy pesa más que la deducción de ayer.
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      // Solo se asigna el aliado si no tenía: el primero que lo trajo se queda
      // con él. Pero la rama y el saludo sí se corrigen siempre.
      ...(conv.partnerId ? {} : { partnerId }),
      contactType: 'REFERIDO_ALIADO',
      businessLine: 'CRM',
      intent: 'CITA_PACIENTE',
      status: 'BOT',
      // El resumen viejo diría que es profesional o proveedor y contaminaría
      // el prompt aunque la rama ya sea la correcta.
      botSummary: null,
      botSummaryAt: null,
      botSummaryCount: 0,
    },
  });
  return { partnerId: conv.partnerId || partnerId, primeraVez: true };
}

/**
 * Copia la atribución al paciente. Se llama al cerrar la cita o al registrar
 * el lead de otra ciudad. No pisa un aliado anterior.
 */
async function atribuirPaciente(patientId, partnerId) {
  if (!patientId || !partnerId) return null;
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, partnerId: true, createdAt: true },
  });
  if (!p || p.partnerId) return p?.partnerId || null;

  await prisma.patient.update({ where: { id: patientId }, data: { partnerId } });
  await programarAudiometrias(patientId, p.createdAt);
  return partnerId;
}

/**
 * Todo referido de un aliado tiene derecho a una audiometría anual por 5 años.
 * El reloj arranca cuando llegó, no en una adaptación que quizá nunca ocurra.
 *
 * No lanza: si esto falla, la atribución igual quedó hecha y la comisión no
 * depende de ello.
 */
async function programarAudiometrias(patientId, desde) {
  try {
    return await require('./followUps.service').ensureFunnelReferido({
      patientId,
      desde: desde || new Date(),
    });
  } catch (e) {
    console.error('[aliados] no pude programar las audiometrías:', e.message);
    return null;
  }
}

/**
 * Mete al referido en el newsletter, segmento PACIENTE.
 *
 * Se le avisa en el primer mensaje del bot, antes de que entregue un solo
 * dato, y todo correo lleva enlace de baja: es el mismo esquema de aviso y
 * oposición con que opera el resto del sitio (Ley 1581).
 *
 * No pisa a quien ya está: si alguien se dio de baja por su cuenta, se queda
 * de baja. Nunca lanza — un fallo aquí no puede tumbar una cita.
 */
async function suscribirAlNewsletter({ nombre, email, telefono, ciudad }) {
  try {
    const correo = String(email || '').trim().toLowerCase();
    if (!correo || !correo.includes('@')) return null;

    const existente = await prisma.newsletterSubscriber.findUnique({ where: { email: correo } });
    if (existente) return existente;

    return await prisma.newsletterSubscriber.create({
      data: {
        nombre: String(nombre || '').trim() || 'Paciente',
        email: correo,
        telefono: telefono || null,
        ciudad: ciudad || null,
        tipo: 'PACIENTE',
        status: 'ACTIVE',
        source: 'aliado-qr',
      },
    });
  } catch (e) {
    console.error('[aliados] suscripción al newsletter falló:', e.message);
    return null;
  }
}

module.exports = {
  normalizar,
  detectarEnTexto,
  marcarConversacion,
  atribuirPaciente,
  programarAudiometrias,
  suscribirAlNewsletter,
};
