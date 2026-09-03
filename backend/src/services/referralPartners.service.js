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
  if (conv.partnerId) return conv.partnerId;

  // Si alguien que ya nos había escrito escanea el QR después, la atribución
  // vale igual. Solo le cambiamos la rama si no estaba en una específica:
  // no vamos a reiniciar la toma de datos de quien ya está agendando.
  const cambiaRama = !conv.contactType || conv.contactType === 'INFO_GENERAL' || conv.contactType === 'OTROS';

  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      partnerId,
      ...(cambiaRama ? { contactType: 'REFERIDO_ALIADO' } : {}),
    },
  });
  return partnerId;
}

/**
 * Copia la atribución al paciente. Se llama al cerrar la cita o al registrar
 * el lead de otra ciudad. No pisa un aliado anterior.
 */
async function atribuirPaciente(patientId, partnerId) {
  if (!patientId || !partnerId) return null;
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, partnerId: true },
  });
  if (!p || p.partnerId) return p?.partnerId || null;

  await prisma.patient.update({ where: { id: patientId }, data: { partnerId } });
  return partnerId;
}

module.exports = {
  normalizar,
  detectarEnTexto,
  marcarConversacion,
  atribuirPaciente,
};
