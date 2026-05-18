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

  // Tres cuentas demo con rol ADMIN: mismo acceso al CRM (API y rutas solo-ADMIN).
  const usersToCreate = [
    { email: adminEmail, password: adminPassword, nombre: adminNombre, role: 'ADMIN' },
    { email: 'recepcion@oirconecta.com', password: 'Recepcion123!', nombre: 'Recepción', role: 'ADMIN' },
    { email: 'audiologa@oirconecta.com', password: 'Audiologa123!', nombre: 'Audióloga', role: 'ADMIN' },
  ];

  for (const u of usersToCreate) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      if (existing.role !== u.role) {
        await prisma.user.update({
          where: { email: u.email },
          data: { role: u.role },
        });
        console.log(`✅ Usuario ${u.email}: rol actualizado → ${u.role} (acceso total CRM)`);
      } else {
        console.log(`✅ Usuario ya existe: ${u.email} (${existing.role})`);
      }
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
      console.log(`✅ Usuario creado: ${user.email} | ${user.nombre} | ${user.role} | Password: ${u.password}`);
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

  // ─────────────────────────────────────────────
  // Profesiones canónicas (Fase 1: directorio)
  // ─────────────────────────────────────────────
  console.log('\n🩺 Sembrando profesiones canónicas...');
  const PROFESSIONS = [
    {
      slug: 'fonoaudiologo',
      nombre: 'Fonoaudiólogo',
      nombreFemenino: 'Fonoaudióloga',
      sinonimos: ['fonoaudiologa', 'fono', 'fonoaudiologia'],
      descripcion:
        'Profesional de la comunicación humana: evaluación, diagnóstico y rehabilitación de audición, voz, habla, lenguaje y deglución.',
      orden: 1,
    },
    {
      slug: 'audiologo',
      nombre: 'Audiólogo',
      nombreFemenino: 'Audióloga',
      sinonimos: ['audiologa', 'audiologia'],
      descripcion:
        'Especialista en evaluación auditiva, adaptación de audífonos y rehabilitación de la pérdida auditiva.',
      orden: 2,
    },
    {
      slug: 'otologo',
      nombre: 'Otólogo',
      nombreFemenino: 'Otóloga',
      sinonimos: ['otologa', 'otologia'],
      descripcion:
        'Médico especialista en enfermedades del oído (medio, interno) y cirugía otológica.',
      orden: 3,
    },
    {
      slug: 'otorrinolaringologo',
      nombre: 'Otorrinolaringólogo',
      nombreFemenino: 'Otorrinolaringóloga',
      sinonimos: ['otorrinolaringologa', 'otorrino', 'orl', 'otorrinolaringologia'],
      descripcion:
        'Médico especialista en oído, nariz y garganta (ORL). Diagnóstico y tratamiento de patologías del área.',
      orden: 4,
    },
  ];
  for (const p of PROFESSIONS) {
    await prisma.profession.upsert({
      where: { slug: p.slug },
      update: {
        nombre: p.nombre,
        nombreFemenino: p.nombreFemenino,
        sinonimos: p.sinonimos,
        descripcion: p.descripcion,
        orden: p.orden,
        activo: true,
      },
      create: p,
    });
  }
  console.log(`   ${PROFESSIONS.length} profesiones canónicas sincronizadas.`);

  // ─────────────────────────────────────────────
  // Ciudades principales de Colombia
  // ─────────────────────────────────────────────
  // Departamentos y municipios de Colombia (33 + ~140 cabeceras y ciudades grandes)
  // Para cargar los ~1100 municipios completos: ver `prisma/data/colombia.js#loadFromDaneCsv`.
  // ─────────────────────────────────────────────
  const { DEPARTMENTS, MUNICIPALITIES } = require('./data/colombia');

  console.log('\n🇨🇴 Sembrando departamentos...');
  for (const d of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: d.slug },
      update: { ...d, activo: true },
      create: d,
    });
  }
  console.log(`   ${DEPARTMENTS.length} departamentos sincronizados.`);

  console.log('\n🏙  Sembrando municipios...');
  // Mapa slug→id para resolver FK departmentId.
  const depIdBySlug = Object.fromEntries(
    (await prisma.department.findMany({ select: { id: true, slug: true, nombre: true } })).map((d) => [
      d.slug,
      { id: d.id, nombre: d.nombre },
    ])
  );
  let count = 0;
  for (const m of MUNICIPALITIES) {
    const dep = depIdBySlug[m.dep];
    await prisma.city.upsert({
      where: { slug: m.slug },
      update: {
        nombre: m.nombre,
        departamento: dep ? dep.nombre : null,
        departmentId: dep ? dep.id : null,
        codigoDane: m.codigoDane || null,
        categoria: m.cat,
        lat: m.lat ?? null,
        lng: m.lng ?? null,
        activo: true,
      },
      create: {
        slug: m.slug,
        nombre: m.nombre,
        departamento: dep ? dep.nombre : null,
        departmentId: dep ? dep.id : null,
        codigoDane: m.codigoDane || null,
        categoria: m.cat,
        lat: m.lat ?? null,
        lng: m.lng ?? null,
      },
    });
    count++;
  }
  console.log(`   ${count} municipios sincronizados.`);

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
