/**
 * One-shot: borra todos los DirectoryProfile y DirectoryAccount excepto el
 * del retail (admin@oirconecta.com por default). Útil antes de lanzar el
 * directorio en producción cuando quedan perfiles de prueba/demo sueltos.
 *
 * GUARD: solo se ejecuta si env PRUNE_ORPHAN_DIRECTORY_ACCOUNTS=true.
 * Después de correr, quita esa env de Render para que no borre profesionales
 * legítimos en deploys futuros.
 *
 * Corre desde el `start` script (antes del seed retail) de package.json.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Guard: solo corre con env explícita. Ya no se ejecuta automáticamente
  // desde `start`; ejecutar manualmente si se necesita otra ronda.
  if (process.env.PRUNE_ORPHAN_DIRECTORY_ACCOUNTS !== 'true') return;

  const retailEmail = (process.env.RETAIL_PROFESSIONAL_EMAIL || 'admin@oirconecta.com').toLowerCase();
  console.log('▶ Prune: mantengo solo el DirectoryAccount de', retailEmail);

  const keep = await prisma.directoryAccount.findUnique({
    where: { email: retailEmail },
    select: { id: true, profile: { select: { id: true } } },
  });
  const keepAccountId = keep?.id || null;
  const keepProfileId = keep?.profile?.id || null;
  console.log('  keepAccountId =', keepAccountId, '· keepProfileId =', keepProfileId);

  // Contadores antes
  const beforeAccounts = await prisma.directoryAccount.count();
  const beforeProfiles = await prisma.directoryProfile.count();
  console.log('  before:', beforeAccounts, 'accounts /', beforeProfiles, 'profiles');

  // Borra profiles primero (cascadea a subscriptions, schedules, appointments,
  // reviews, etc. según onDelete: Cascade del schema Prisma).
  const delProfiles = await prisma.directoryProfile.deleteMany({
    where: keepProfileId ? { id: { not: keepProfileId } } : {},
  });
  console.log('  profiles borrados:', delProfiles.count);

  // Borra accounts sobrantes (las que aún tenían profile ya cascadearon; esto
  // limpia accounts huérfanas sin profile).
  const delAccounts = await prisma.directoryAccount.deleteMany({
    where: keepAccountId ? { id: { not: keepAccountId } } : {},
  });
  console.log('  accounts borradas:', delAccounts.count);

  const afterAccounts = await prisma.directoryAccount.count();
  const afterProfiles = await prisma.directoryProfile.count();
  console.log('  after:', afterAccounts, 'accounts /', afterProfiles, 'profiles');
  console.log('✅ Prune completo. RECUERDA quitar PRUNE_ORPHAN_DIRECTORY_ACCOUNTS de Render.');
}

main()
  .catch((e) => { console.error('❌ prune error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
