/**
 * T4 — Cron in-process para procesar recordatorios y jobs programados.
 *
 * Corre dentro del mismo Node del backend con setInterval(60s). Reemplaza
 * al Worker BullMQ cuando no hay Redis disponible (default en Render free).
 *
 * Qué procesa cada tick:
 *  1. Recordatorios de cita 5d/1d/5h (appointments.service.processReminders)
 *  2. Reminder rows con status=PENDING y scheduledFor <= now (sendNow)
 *
 * Deshabilitable con INTERNAL_CRON_ENABLED='false' (útil para tests o si
 * en el futuro se migra a Worker BullMQ dedicado).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TICK_MS = 60 * 1000;
const BATCH_SIZE = 50; // reminders por tick para no ahogar SMTP en un burst
const NURTURE_BATCH = 20; // leads nurture por tick

let running = false;
let tickHandle = null;

// T2-Gap1 — Ventanas del nurture 7d.
// El barrido corre cada minuto; usamos ventanas amplias para que no importe
// si el tick se pierde por cold-start o reinicio.
const NURTURE_STEPS = [
  { step: 1, field: 'nurture1SentAt', minH: 22, maxH: 30 },   // ~24h (22-30h)
  { step: 3, field: 'nurture3SentAt', minH: 68, maxH: 78 },   // ~3d (68-78h)
  { step: 7, field: 'nurture7SentAt', minH: 164, maxH: 176 }, // ~7d (164-176h)
];

async function processLeadNurture() {
  const emailService = require('../services/email.service');
  const now = new Date();
  let total = { scanned: 0, sent: 0, failed: 0 };

  for (const cfg of NURTURE_STEPS) {
    const minAgo = new Date(now.getTime() - cfg.maxH * 3600 * 1000);
    const maxAgo = new Date(now.getTime() - cfg.minH * 3600 * 1000);

    const due = await prisma.lead.findMany({
      where: {
        estado: 'NUEVO',
        appointmentId: null,
        archivedAt: null,
        nurtureOptOut: false,
        email: { not: '' },
        [cfg.field]: null,
        createdAt: { gte: minAgo, lte: maxAgo },
      },
      orderBy: { createdAt: 'asc' },
      take: NURTURE_BATCH,
    });

    for (const lead of due) {
      total.scanned++;
      try {
        // Claim optimista: marca sentAt antes del envío para evitar doble envío
        // si dos ticks corren en paralelo.
        const claim = await prisma.lead.updateMany({
          where: { id: lead.id, [cfg.field]: null },
          data: { [cfg.field]: now },
        });
        if (claim.count === 0) continue;

        const unsubscribeUrl = `https://oirconecta.com/api/leads/nurture/opt-out?token=${lead.id}`;
        await emailService.sendLeadNurture({
          to: lead.email,
          nombre: lead.nombre,
          step: cfg.step,
          interes: lead.interes,
          unsubscribeUrl,
        });
        total.sent++;
      } catch (e) {
        console.error('[cron/nurture] lead', lead.id, 'step', cfg.step, 'falló:', e.message);
        // Revertimos el claim para reintentar en el próximo tick dentro de la ventana
        try {
          await prisma.lead.updateMany({
            where: { id: lead.id, [cfg.field]: { not: null } },
            data: { [cfg.field]: null },
          });
        } catch {}
        total.failed++;
      }
    }
  }

  return total;
}

async function processPendingReminders() {
  const { sendNow } = require('../notifications');
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: {
      status: { in: ['PENDING', 'QUEUED'] },
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
    take: BATCH_SIZE,
  });
  if (due.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const r of due) {
    // Marca QUEUED para evitar doble envío si el tick anterior sigue corriendo
    // (defensivo — el guard `running` ya evita solapamiento, pero por si acaso).
    try {
      const claim = await prisma.reminder.updateMany({
        where: { id: r.id, status: r.status },
        data: { status: 'QUEUED', attempts: { increment: 1 } },
      });
      if (claim.count === 0) continue; // ya lo procesó otro proceso
    } catch (e) {
      console.error('[cron] no pude marcar QUEUED reminder', r.id, e.message);
      continue;
    }

    try {
      const notif = await sendNow({
        patientId: r.patientId,
        eventCode: r.eventCode,
        channel: r.channel,
        templateCode: r.templateCode,
        payload: r.payload || {},
      });
      await prisma.reminder.update({
        where: { id: r.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          notificationId: notif?.id || null,
          lastError: null,
        },
      });
      sent++;
    } catch (e) {
      const isLast = (r.attempts || 0) + 1 >= 5;
      await prisma.reminder.update({
        where: { id: r.id },
        data: {
          status: isLast ? 'FAILED' : 'PENDING',
          lastError: (e.message || 'Error').slice(0, 500),
        },
      });
      failed++;
    }
  }

  return { processed: due.length, sent, failed };
}

async function tick() {
  if (running) return; // no solapar ticks
  running = true;
  const started = Date.now();
  try {
    // 1) Recordatorios de cita (5d/1d/5h) — sistema legacy sin Reminder rows.
    let apptResult = null;
    try {
      const appointmentsService = require('../services/appointments.service');
      if (typeof appointmentsService.processReminders === 'function') {
        apptResult = await appointmentsService.processReminders();
      }
    } catch (e) {
      console.error('[cron] processReminders falló:', e.message);
    }

    // 2) Reminder rows PENDING/QUEUED (sistema nuevo con Reminder model)
    let remindersResult = null;
    try {
      remindersResult = await processPendingReminders();
    } catch (e) {
      console.error('[cron] processPendingReminders falló:', e.message);
    }

    // 3) T2-Gap1 — Nurture 7d de leads sin cita
    let nurtureResult = null;
    try {
      nurtureResult = await processLeadNurture();
    } catch (e) {
      console.error('[cron] processLeadNurture falló:', e.message);
    }

    const hasActivity =
      (apptResult?.sent || 0) > 0 ||
      (remindersResult?.sent || 0) > 0 ||
      (remindersResult?.failed || 0) > 0 ||
      (nurtureResult?.sent || 0) > 0 ||
      (nurtureResult?.failed || 0) > 0;
    if (hasActivity) {
      const ms = Date.now() - started;
      console.log(`[cron] tick ${ms}ms · citas ${apptResult?.sent || 0}/${apptResult?.processed || 0} · reminders ${remindersResult?.sent || 0}/${remindersResult?.processed || 0} · nurture ${nurtureResult?.sent || 0}/${nurtureResult?.scanned || 0}`);
    }
  } catch (e) {
    console.error('[cron] tick falló:', e.message);
  } finally {
    running = false;
  }
}

function start() {
  if (tickHandle) return; // ya arrancado
  console.log(`[cron] in-process scheduler arriba · tick cada ${TICK_MS / 1000}s`);
  // Primer tick a los 20s (dejamos que el server termine de arrancar).
  setTimeout(tick, 20_000);
  tickHandle = setInterval(tick, TICK_MS);
}

function stop() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
}

module.exports = { start, stop, tick, processPendingReminders, processLeadNurture };
