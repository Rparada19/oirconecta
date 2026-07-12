/**
 * Seed idempotente: crea el DirectoryProfile "OírConecta Bogotá" que usa
 * el bot corporativo (RETAIL_PROFESSIONAL_ID) para agendar citas por WhatsApp.
 *
 * El CRM propio de OírConecta consume el pipeline del directorio como un
 * tenant premium (PLAN_3_MENSUAL) siempre activo. Este perfil interno es
 * el que resuelve `loadContext(profileId)` en professionalBooking.service.
 *
 * Se puede correr varias veces sin duplicar (upsert por email + slugs).
 *
 * Uso: cd backend && node scripts/seed_oirconecta_retail.js
 * Al final imprime el profileId. Con ese ID:
 *   1) Ponerlo en env RETAIL_PROFESSIONAL_ID (Render + .env local)
 *   2) El bot ya lo usa vía config.retail.professionalId
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const subService = require('../src/services/subscription.service');

const prisma = new PrismaClient();

// Debe coincidir con el fallback de retail.service.js
const RETAIL_EMAIL = (process.env.RETAIL_PROFESSIONAL_EMAIL || 'admin@oirconecta.com').toLowerCase();
const RETAIL_PASSWORD = process.env.RETAIL_ACCOUNT_PASSWORD || 'Admin123!';
const RETAIL_NOMBRE = 'OírConecta · Centro Bogotá';

async function main() {
  console.log('▶ Sembrando perfil retail OírConecta Bogotá…\n');

  // 1. Asegurar planes en DB
  await subService.ensurePlans();
  const planPremium = await prisma.plan.findUnique({ where: { code: 'PLAN_3_MENSUAL' } });
  if (!planPremium) throw new Error('PLAN_3_MENSUAL no existe tras ensurePlans');
  console.log('[1] Plan premium:', planPremium.code, '→', planPremium.id);

  // 2. DirectoryAccount (upsert por email). Reafirma password en cada deploy
  // para garantizar acceso consistente al portal profesional del retail.
  const passwordHash = await bcrypt.hash(RETAIL_PASSWORD, 10);
  const account = await prisma.directoryAccount.upsert({
    where: { email: RETAIL_EMAIL },
    create: {
      email: RETAIL_EMAIL,
      password: passwordHash,
      nombre: RETAIL_NOMBRE,
      activo: true,
      mustChangePassword: false,
    },
    update: {
      nombre: RETAIL_NOMBRE,
      activo: true,
      password: passwordHash,
      mustChangePassword: false,
    },
  });
  console.log('[2] DirectoryAccount:', account.id, '(email=' + RETAIL_EMAIL + ')');

  // 3. DirectoryProfile.
  //    En CREATE (primer arranque) sembramos datos ricos para que el perfil
  //    salga listo. En UPDATE solo forzamos lo crítico para operar: status
  //    y personaTipo. NO tocamos bio, servicios, allies, direcciones ni
  //    teléfonos: esos son editables desde el portal y el usuario ya los
  //    personaliza — sobrescribirlos en cada deploy sería frustrante.
  const profileCreateData = {
    status: 'APPROVED',
    personaTipo: 'JURIDICA',
    direccionPublica: 'Cr 10 #96-25 Cons. 320, Bogotá',
    telefonoPublico: '+57 317 150 3944',
    emailPublico: 'contacto@oirconecta.com',
    nombreConsultorio: 'OírConecta Bogotá',
    profesion: 'Audiología',
    profesionesAdicionales: ['Audiología', 'Fonoaudiología'],
    whatsappPublico: '573171503944',
    idiomas: ['es'],
    polizasAceptadas: [],
    descripcion:
      'Centro auditivo en Bogotá especializado en diseñar planes de audición personalizados: '
      + 'evaluación auditiva inicial gratuita, adaptación de audífonos multimarca y '
      + 'acompañamiento post-venta con controles periódicos. Atendemos con calidez y sin apuros.',
    anosExperiencia: 10,
    servicios: [
      { nombre: 'Valoración auditiva',       descripcion: 'Audiometría, logoaudiometría y consejería inicial. Sin costo.', precio: 0,   duracion: '45 min' },
      { nombre: 'Adaptación de audífonos',   descripcion: 'Selección y programación personalizada según tu perfil auditivo.', precio: null, duracion: '60 min' },
      { nombre: 'Control post-adaptación',   descripcion: 'Seguimiento para asegurar comodidad y beneficio auditivo real.',   precio: null, duracion: '30 min' },
      { nombre: 'Otoemisiones acústicas',    descripcion: 'Prueba objetiva para tamizaje auditivo (neonatal y pediátrico).',  precio: null, duracion: '20 min' },
    ],
    allies: ['Widex', 'Phonak', 'Signia', 'Oticon', 'ReSound', 'Starkey', 'Bernafon', 'Unitron'],
  };
  let profile = await prisma.directoryProfile.findUnique({ where: { accountId: account.id } });
  if (!profile) {
    profile = await prisma.directoryProfile.create({ data: { accountId: account.id, ...profileCreateData } });
    console.log('[3] DirectoryProfile CREADO:', profile.id);
  } else {
    profile = await prisma.directoryProfile.update({
      where: { id: profile.id },
      data: { status: 'APPROVED', personaTipo: 'JURIDICA' },
    });
    console.log('[3] DirectoryProfile ya existía; solo aseguré status=APPROVED y personaTipo=JURIDICA:', profile.id);
  }

  // 4. Subscription (upsert por profileId)
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 3600 * 1000); // 1 año adelante
  const sub = await prisma.subscription.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      planId: planPremium.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      commitmentEnd: periodEnd,
      metadata: { internalTenant: true, note: 'Centro propio OírConecta; plan premium siempre activo' },
    },
    update: {
      planId: planPremium.id,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
  });
  console.log('[4] Subscription:', sub.id, '·', sub.status);

  // 5. ProfessionalScheduleConfig
  const psc = await prisma.professionalScheduleConfig.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      defaultSlotMinutes: 30,
      bufferMinutes: 10,
      bookingWindowDays: 45,
      minNoticeHours: 2,
      autoConfirm: true,
      timezone: 'America/Bogota',
      agendaActiva: true,
    },
    update: { agendaActiva: true, timezone: 'America/Bogota' },
  });
  console.log('[5] ScheduleConfig:', psc.id, '· agendaActiva =', psc.agendaActiva);

  // 6. AppointmentTypes (idempotente por nombre + profileId)
  const tiposDeseados = [
    { nombre: 'Valoración auditiva',           descripcion: 'Evaluación auditiva inicial (audiometría). Sin costo.', durationMinutes: 45, priceCOP: 0,      color: '#0ea5e9', orden: 1 },
    { nombre: 'Programación de audífono',      descripcion: 'Ajuste y programación de audífono.',                    durationMinutes: 45, priceCOP: null,   color: '#22c55e', orden: 2 },
    { nombre: 'Control post-adaptación',       descripcion: 'Seguimiento tras la adaptación de audífonos.',          durationMinutes: 30, priceCOP: null,   color: '#a855f7', orden: 3 },
  ];
  for (const t of tiposDeseados) {
    const existing = await prisma.appointmentType.findFirst({
      where: { profileId: profile.id, nombre: t.nombre },
    });
    if (existing) {
      await prisma.appointmentType.update({
        where: { id: existing.id },
        data: { ...t, activo: true },
      });
      console.log('  ↻ AppointmentType actualizado:', t.nombre);
    } else {
      const created = await prisma.appointmentType.create({
        data: { ...t, profileId: profile.id, activo: true },
      });
      console.log('  ＋ AppointmentType creado:', t.nombre, '→', created.id);
    }
  }

  // 7. ProfessionalAvailability: Lun-Vie 8-13 y 14-18 (con almuerzo)
  await prisma.professionalAvailability.deleteMany({ where: { profileId: profile.id } });
  const bloques = [];
  for (let dow = 1; dow <= 5; dow++) {
    bloques.push({ profileId: profile.id, dayOfWeek: dow, startTime: '08:00', endTime: '13:00', active: true });
    bloques.push({ profileId: profile.id, dayOfWeek: dow, startTime: '14:00', endTime: '18:00', active: true });
  }
  await prisma.professionalAvailability.createMany({ data: bloques });
  console.log('[7] Availability creada:', bloques.length, 'bloques (Lun-Vie 8-13 y 14-18)');

  // 8. IaAgentConfig — bot IA del directorio (widget en ficha pública).
  //    El CRM propio consume el mismo servicio, por eso lo dejamos configurado
  //    con la persona OírConecta.
  const iaConfig = await prisma.iaAgentConfig.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      agentName: 'Aura',
      agentColor: '#085946',
      agentIcon: 'spa',
      welcomeMessage: '¡Hola! 👋 Soy Aura, asistente de OírConecta. Te puedo ayudar a agendar tu valoración auditiva o resolver dudas sobre audífonos. ¿En qué te ayudo hoy?',
      personality: 'Cálida, empática, colombiana neutro, tuteo. Evita jerga clínica; explica en términos que un paciente promedio entienda.',
      expertise: 'Valoración auditiva inicial, adaptación de audífonos multimarca (Widex, Phonak, Signia, Oticon, ReSound), programación y controles post-adaptación, orientación a familiares de pacientes con hipoacusia.',
      signature: '— Aura de OírConecta 🎧',
      avoidTopics: 'Diagnósticos médicos específicos, precios exactos de audífonos, promociones puntuales. Redirige siempre a la valoración auditiva gratuita.',
    },
    update: {
      agentName: 'Aura',
      agentColor: '#085946',
      agentIcon: 'spa',
    },
  });
  console.log('[8] IaAgentConfig:', iaConfig.id, '· agente=', iaConfig.agentName);

  console.log('\n✅ Perfil OírConecta Bogotá listo.');
  console.log('\n👉 PROFILE ID (usar en env RETAIL_PROFESSIONAL_ID):');
  console.log('   ' + profile.id);
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
