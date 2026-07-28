/**
 * Seed idempotente: crea el DirectoryProfile INTERNO del comercial de captación.
 *
 * Es un recurso agendable (reutiliza todo el motor de agenda + booking + Google
 * Calendar) pero `listedPublic = false`, así que NO aparece en el directorio
 * público. El bot de captación reserva reuniones aquí y el comercial lo gestiona
 * desde el CRM (/api/crm/comercial-agenda).
 *
 * Por ahora el "comercial" es el propio admin; cuando se contrate uno, se le da
 * acceso a esta cuenta (comercial@oirconecta.com) o se migra el profileId.
 *
 * Se puede correr varias veces sin duplicar (upsert por email).
 * Uso: cd backend && node scripts/seed_oirconecta_comercial.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const subService = require('../src/services/subscription.service');

const prisma = new PrismaClient();

const COMERCIAL_EMAIL = (process.env.COMERCIAL_PROFESSIONAL_EMAIL || 'comercial@oirconecta.com').toLowerCase();
const COMERCIAL_PASSWORD = process.env.COMERCIAL_ACCOUNT_PASSWORD || 'Comercial123!';
const COMERCIAL_NOMBRE = 'OírConecta · Comercial';

async function main() {
  console.log('▶ Sembrando perfil interno del comercial de captación…\n');

  await subService.ensurePlans();
  const planPremium = await prisma.plan.findUnique({ where: { code: 'PLAN_3_MENSUAL' } });
  if (!planPremium) throw new Error('PLAN_3_MENSUAL no existe tras ensurePlans');

  const passwordHash = await bcrypt.hash(COMERCIAL_PASSWORD, 10);
  const account = await prisma.directoryAccount.upsert({
    where: { email: COMERCIAL_EMAIL },
    create: {
      email: COMERCIAL_EMAIL,
      password: passwordHash,
      nombre: COMERCIAL_NOMBRE,
      activo: true,
      mustChangePassword: false,
    },
    update: { nombre: COMERCIAL_NOMBRE, activo: true },
  });
  console.log('[1] DirectoryAccount:', account.id, '(email=' + COMERCIAL_EMAIL + ')');

  // DirectoryProfile interno: APPROVED (para pasar el gate del motor de booking)
  // pero listedPublic=false (invisible en el directorio público).
  let profile = await prisma.directoryProfile.findUnique({ where: { accountId: account.id } });
  if (!profile) {
    profile = await prisma.directoryProfile.create({
      data: {
        accountId: account.id,
        status: 'APPROVED',
        listedPublic: false,
        personaTipo: 'JURIDICA',
        nombreConsultorio: COMERCIAL_NOMBRE,
        descripcion: 'Agenda interna del equipo comercial de captación de OírConecta. No visible al público.',
      },
    });
    console.log('[2] DirectoryProfile CREADO (interno):', profile.id);
  } else {
    profile = await prisma.directoryProfile.update({
      where: { id: profile.id },
      data: { status: 'APPROVED', listedPublic: false, personaTipo: 'JURIDICA' },
    });
    console.log('[2] DirectoryProfile ya existía; aseguré APPROVED + listedPublic=false:', profile.id);
  }

  const now = new Date();
  const periodEnd = new Date('2099-12-31T23:59:59.000Z');
  await prisma.subscription.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      planId: planPremium.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      commitmentEnd: null,
      metadata: { internalTenant: true, note: 'Agenda interna del comercial de captación' },
    },
    update: { planId: planPremium.id, status: 'ACTIVE', currentPeriodEnd: periodEnd, commitmentEnd: null },
  });
  console.log('[3] Subscription premium activa (sin vencimiento).');

  await prisma.professionalScheduleConfig.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      defaultSlotMinutes: 30,
      bufferMinutes: 10,
      bookingWindowDays: 30,
      minNoticeHours: 2,
      autoConfirm: true,
      timezone: 'America/Bogota',
      agendaActiva: true,
    },
    update: { agendaActiva: true, timezone: 'America/Bogota' },
  });
  console.log('[4] ScheduleConfig lista.');

  // Único tipo: "Reunión comercial" (30 min)
  const tipo = { nombre: 'Reunión comercial', descripcion: 'Reunión de captación con profesional prospecto.', durationMinutes: 30, priceCOP: 0, color: '#6d28d9', orden: 1 };
  const existing = await prisma.appointmentType.findFirst({ where: { profileId: profile.id, nombre: tipo.nombre } });
  if (existing) {
    await prisma.appointmentType.update({ where: { id: existing.id }, data: { ...tipo, activo: true } });
    console.log('[5] AppointmentType actualizado:', tipo.nombre);
  } else {
    const created = await prisma.appointmentType.create({ data: { ...tipo, profileId: profile.id, activo: true } });
    console.log('[5] AppointmentType creado:', tipo.nombre, '→', created.id);
  }

  // Disponibilidad por defecto: Lun-Vie 9-13 y 14-17 (solo si aún no hay horario)
  const yaTiene = await prisma.professionalAvailability.count({ where: { profileId: profile.id } });
  if (yaTiene === 0) {
    const bloques = [];
    for (let dow = 1; dow <= 5; dow++) {
      bloques.push({ profileId: profile.id, dayOfWeek: dow, startTime: '09:00', endTime: '13:00', active: true });
      bloques.push({ profileId: profile.id, dayOfWeek: dow, startTime: '14:00', endTime: '17:00', active: true });
    }
    await prisma.professionalAvailability.createMany({ data: bloques });
    console.log('[6] Disponibilidad por defecto creada (Lun-Vie 9-13 y 14-17).');
  } else {
    console.log('[6] Ya había disponibilidad configurada; no la toco.');
  }

  console.log('\n✅ Perfil interno del comercial listo. PROFILE ID:');
  console.log('   ' + profile.id + '\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
