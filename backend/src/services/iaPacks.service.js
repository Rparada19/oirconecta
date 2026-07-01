/**
 * F5.4 — Gestión comercial de paquetes de conversaciones IA.
 *
 * Catálogo fijo (definido por producto, no vendible fuera de esto):
 *  - PACK_100:  100 conversaciones, $80.000 COP, 40 días de vigencia
 *  - PACK_300:  300 conversaciones, $200.000 COP, 60 días de vigencia
 *
 * En esta primera versión el admin "vende" el pack manualmente (marca ACTIVE
 * directo). Cuando conectemos Wompi, el flujo self-service creará Payment
 * PENDING y activará el pack al recibir webhook APPROVED.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PACK_CATALOG = {
  PACK_100: { code: 'PACK_100', totalConversations: 100, priceCOP: 80000,  durationDays: 40, label: 'Paquete 100 conversaciones' },
  PACK_300: { code: 'PACK_300', totalConversations: 300, priceCOP: 200000, durationDays: 60, label: 'Paquete 300 conversaciones' },
};

class PackError extends Error {
  constructor(message, { status = 400, code } = {}) {
    super(message);
    this.status = status; this.code = code;
  }
}

function listCatalog() {
  return Object.values(PACK_CATALOG);
}

/**
 * Crea un pack ACTIVE para una suscripción. Uso admin (venta manual sin gateway).
 * `paymentId` opcional para trazabilidad futura con la pasarela.
 */
async function sellPackAdmin(subscriptionId, packCode, { paymentId } = {}) {
  const catalog = PACK_CATALOG[packCode];
  if (!catalog) throw new PackError('Código de paquete inválido');

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!sub) throw new PackError('Suscripción no encontrada', { status: 404 });
  const feats = sub.plan?.features || {};
  if (!feats.ia) throw new PackError('Esta suscripción no tiene IA en su plan', { status: 400, code: 'IA_NOT_INCLUDED' });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + catalog.durationDays * 24 * 60 * 60 * 1000);

  const pack = await prisma.iaConversationPack.create({
    data: {
      subscriptionId,
      totalConversations: catalog.totalConversations,
      priceCOP: catalog.priceCOP,
      expiresAt,
      status: 'ACTIVE',
      paymentId: paymentId || null,
      metadata: { code: catalog.code, soldBy: 'admin_manual' },
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId,
      tipo: 'IA_PACK_SOLD',
      notas: `${catalog.label} — $${catalog.priceCOP.toLocaleString('es-CO')} COP · vence ${expiresAt.toISOString().slice(0,10)}`,
      metadata: { packCode: catalog.code, packId: pack.id, priceCOP: catalog.priceCOP },
    },
  });

  return pack;
}

/** Lista packs de una suscripción (todos los estados). Para admin y para /me. */
async function listPacks(subscriptionId) {
  return prisma.iaConversationPack.findMany({
    where: { subscriptionId },
    orderBy: { purchasedAt: 'desc' },
  });
}

/** Vista resumen para el profesional. */
async function getBalanceForProfile(profileId) {
  const sub = await prisma.subscription.findUnique({
    where: { profileId },
    include: { plan: true },
  });
  if (!sub) throw new PackError('Sin suscripción', { status: 404, code: 'NO_SUBSCRIPTION' });
  const ia = require('./iaAgent.service');
  return ia.getBalance(sub);
}

module.exports = {
  PACK_CATALOG,
  PackError,
  listCatalog,
  sellPackAdmin,
  listPacks,
  getBalanceForProfile,
};
