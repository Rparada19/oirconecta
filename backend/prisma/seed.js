/**
 * Seed de la base de datos
 * Crea el usuario administrador inicial y datos de prueba
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

/** Cuenta demo del directorio público (no es usuario CRM). Ver README o consola del seed para la contraseña. */
const DIRECTORY_DEMO_EMAIL = 'directorio.demo@oirconecta.com';
const DIRECTORY_DEMO_PASSWORD = 'DemoDirect2026!';

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // Configuración del admin (desde .env o valores por defecto)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@oirconecta.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminNombre = 'Administrador';

  // Verificar si ya existe el admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const usersToCreate = [
    { email: adminEmail, password: adminPassword, nombre: adminNombre, role: 'ADMIN' },
    { email: 'recepcion@oirconecta.com', password: 'Recepcion123!', nombre: 'Recepción', role: 'RECEPCION' },
    { email: 'audiologa@oirconecta.com', password: 'Audiologa123!', nombre: 'Audióloga', role: 'AUDIOLOGA' },
  ];

  for (const u of usersToCreate) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`✅ Usuario ya existe: ${u.email} (${u.role})`);
    } else {
      const hashedPassword = await bcrypt.hash(u.password, 12);
      const user = await prisma.user.create({
        data: {
          email: u.email,
          password: hashedPassword,
          nombre: u.nombre,
          role: u.role,
          activo: true,
        },
      });
      console.log(`✅ Usuario creado: ${user.email} | ${user.nombre} | ${u.role} | Password: ${u.password}`);
    }
  }
  console.log('');

  // Crear campañas de marketing de ejemplo
  const existingCampaigns = await prisma.campaign.count();
  
  if (existingCampaigns === 0) {
    const campaigns = await prisma.campaign.createMany({
      data: [
        {
          nombre: 'Promoción Audífonos Enero',
          tipo: 'Email',
          estado: 'ACTIVA',
          fechaInicio: new Date('2026-01-01'),
          fechaFin: new Date('2026-01-31'),
          fabricante: 'Widex',
          descuentoAprobado: 15,
          destinatarios: 1250,
          abiertos: 850,
          clicks: 320,
        },
        {
          nombre: 'Descuento Consultas',
          tipo: 'Redes Sociales',
          estado: 'ACTIVA',
          fechaInicio: new Date('2026-01-15'),
          fechaFin: new Date('2026-02-15'),
          fabricante: 'Oticon',
          descuentoAprobado: 10,
          destinatarios: 5000,
          abiertos: 3200,
          clicks: 890,
        },
        {
          nombre: 'Campaña Implantes',
          tipo: 'SMS',
          estado: 'PAUSADA',
          fechaInicio: new Date('2025-12-01'),
          fechaFin: new Date('2025-12-31'),
          fabricante: 'Cochlear',
          descuentoAprobado: 5,
          destinatarios: 800,
          abiertos: 600,
          clicks: 150,
        },
      ],
    });

    console.log(`✅ Campañas de marketing creadas: ${campaigns.count}`);
  } else {
    console.log(`✅ Ya existen ${existingCampaigns} campañas de marketing`);
  }

  // Cuenta demo del directorio público (login en /login-directorio → panel Mi directorio).
  // Si el email ya existía (registro manual u otro seed), se restablece la contraseña demo para que el acceso sea predecible.
  const hashedDirDemo = await hashPassword(DIRECTORY_DEMO_PASSWORD);
  let dirDemoAccount = await prisma.directoryAccount.findUnique({
    where: { email: DIRECTORY_DEMO_EMAIL },
  });
  if (!dirDemoAccount) {
    dirDemoAccount = await prisma.directoryAccount.create({
      data: {
        email: DIRECTORY_DEMO_EMAIL,
        password: hashedDirDemo,
        nombre: 'Profesional Demo Directorio',
        activo: true,
      },
    });
    await prisma.directoryProfile.create({
      data: {
        accountId: dirDemoAccount.id,
        status: 'APPROVED',
        nombreConsultorio: 'Consultorio Demo Oír Conecta',
        profesion: 'Audiología',
        polizasAceptadas: ['Sura', 'Sanitas'],
        photoUrls: [],
      },
    });
    console.log(`\n✅ Cuenta demo DIRECTORIO creada:`);
  } else {
    await prisma.directoryAccount.update({
      where: { email: DIRECTORY_DEMO_EMAIL },
      data: {
        password: hashedDirDemo,
        nombre: 'Profesional Demo Directorio',
        activo: true,
      },
    });
    const existingProf = await prisma.directoryProfile.findUnique({
      where: { accountId: dirDemoAccount.id },
    });
    if (!existingProf) {
      await prisma.directoryProfile.create({
        data: {
          accountId: dirDemoAccount.id,
          status: 'APPROVED',
          nombreConsultorio: 'Consultorio Demo Oír Conecta',
          profesion: 'Audiología',
          polizasAceptadas: ['Sura', 'Sanitas'],
          photoUrls: [],
        },
      });
    }
    console.log(`\n✅ Cuenta demo DIRECTORIO sincronizada (contraseña restablecida a la demo):`);
  }
  console.log(`   Email:    ${DIRECTORY_DEMO_EMAIL}`);
  console.log(`   Password: ${DIRECTORY_DEMO_PASSWORD}`);
  console.log('   (Acceso: /login-directorio. No uses esta cuenta en producción.)');

  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
