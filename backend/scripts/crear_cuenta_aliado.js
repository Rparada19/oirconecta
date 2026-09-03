/**
 * Crea (o actualiza la clave de) una cuenta de aliado referidor.
 *
 *   node scripts/crear_cuenta_aliado.js PLUG-E correo@pluge.com "la-clave"
 *
 * La clave NO se guarda en el repo ni en el seed automático: se pasa por
 * argumento al correrlo, una vez, contra la base que corresponda.
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [code, emailRaw, password, nombre] = process.argv.slice(2);
  if (!code || !emailRaw || !password) {
    console.error('Uso: node scripts/crear_cuenta_aliado.js <CODE> <email> <clave> [nombre]');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('La clave debe tener al menos 10 caracteres.');
    process.exit(1);
  }

  const partner = await prisma.referralPartner.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!partner) {
    console.error(`No existe el aliado con código "${code}". Corre primero scripts/seed_referral_partners.js.`);
    process.exit(1);
  }

  const email = emailRaw.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const account = await prisma.referralPartnerAccount.upsert({
    where: { email },
    update: { passwordHash, partnerId: partner.id, activo: true, ...(nombre ? { nombre } : {}) },
    create: { email, passwordHash, partnerId: partner.id, nombre: nombre || null },
  });

  console.log(`Cuenta lista: ${account.email} → ${partner.nombre} (${partner.code})`);
  console.log(`Entra en https://oirconecta.com/portal-crm/aliado/${partner.code.toLowerCase()}`);
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
