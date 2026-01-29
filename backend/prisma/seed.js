/**
 * Seed de la base de datos
 * Crea el usuario administrador inicial y datos de prueba
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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

  if (existingAdmin) {
    console.log(`✅ Usuario admin ya existe: ${adminEmail}`);
  } else {
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nombre: adminNombre,
        role: 'ADMIN',
        activo: true,
      },
    });

    console.log(`✅ Usuario admin creado:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.nombre}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: ${adminPassword} (¡cambiar en producción!)\n`);
  }

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
