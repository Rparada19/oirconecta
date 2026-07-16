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

/**
 * T2-Gap4 — Cumpleaños. Se ejecuta solo entre 8am-9am hora Colombia (UTC-5).
 * Un envío por paciente por año (guard birthdayLastSentAt).
 * Genera referralCode si el paciente aún no tiene uno.
 */
async function processBirthdays() {
  // Hora Colombia (UTC-5) sin depender de tz local del server.
  const now = new Date();
  const coHour = (now.getUTCHours() - 5 + 24) % 24;
  // Solo actúa en la ventana 8-9 AM Colombia. Fuera de esa ventana, no-op.
  if (coHour < 8 || coHour >= 9) return { scanned: 0, sent: 0, skipped: 0 };

  const emailService = require('../services/email.service');
  const nowMonth = now.getUTCMonth() + 1;
  const nowDay = now.getUTCDate();
  const oneYearAgo = new Date(now.getTime() - 340 * 24 * 3600 * 1000); // ~11 meses guard

  // Filtramos por mes/día vía SQL crudo (fechaNacimiento puede ser cualquier año)
  const due = await prisma.$queryRaw`
    SELECT id, nombre, email, "referralCode"
    FROM patients
    WHERE "archivedAt" IS NULL
      AND email IS NOT NULL AND email != ''
      AND "fechaNacimiento" IS NOT NULL
      AND EXTRACT(MONTH FROM "fechaNacimiento") = ${nowMonth}
      AND EXTRACT(DAY FROM "fechaNacimiento") = ${nowDay}
      AND ("birthdayLastSentAt" IS NULL OR "birthdayLastSentAt" < ${oneYearAgo})
    LIMIT 100
  `;

  let sent = 0;
  for (const p of due) {
    try {
      const claim = await prisma.patient.updateMany({
        where: {
          id: p.id,
          OR: [{ birthdayLastSentAt: null }, { birthdayLastSentAt: { lt: oneYearAgo } }],
        },
        data: { birthdayLastSentAt: now },
      });
      if (claim.count === 0) continue;

      // Asigna referralCode si el paciente no tiene uno (aprovechamos el email
      // de cumpleaños para invitarlo a compartir).
      let code = p.referralCode;
      if (!code) {
        code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
        await prisma.patient.update({ where: { id: p.id }, data: { referralCode: code } });
      }

      await emailService.sendBirthday({
        to: p.email,
        nombre: p.nombre,
        referralCode: code,
      });
      sent++;
    } catch (e) {
      console.error('[cron/birthday] paciente', p.id, 'falló:', e.message);
    }
  }

  return { scanned: due.length, sent, skipped: due.length - sent };
}

/**
 * T2-Gap3 — Control 15d post-cita.
 * Escanea citas COMPLETED entre 14 y 16 días atrás sin control15SentAt.
 * Un email por cita. Optimistic claim para evitar dobles envíos.
 */
async function processControl15d() {
  const emailService = require('../services/email.service');
  const now = new Date();
  const d14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const d16 = new Date(now.getTime() - 16 * 24 * 3600 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      estado: 'COMPLETED',
      control15SentAt: null,
      patientEmail: { not: '' },
      fecha: { gte: d16, lte: d14 },
    },
    select: {
      id: true, patientEmail: true, patientName: true,
      tipoConsulta: true, directoryProfileId: true,
    },
    take: 100,
  });

  let sent = 0, failed = 0;
  for (const appt of due) {
    if (!appt.patientEmail) continue;
    try {
      const claim = await prisma.appointment.updateMany({
        where: { id: appt.id, control15SentAt: null },
        data: { control15SentAt: now },
      });
      if (claim.count === 0) continue;

      // Buscar nombre del profesional (best-effort)
      let professionalName = null;
      if (appt.directoryProfileId) {
        const prof = await prisma.directoryProfile.findUnique({
          where: { id: appt.directoryProfileId },
          select: { account: { select: { nombre: true } } },
        });
        professionalName = prof?.account?.nombre || null;
      }

      await emailService.sendControl15d({
        to: appt.patientEmail,
        patientName: appt.patientName,
        professionalName,
        tipoConsulta: appt.tipoConsulta,
      });
      sent++;
    } catch (e) {
      console.error('[cron/control15d] cita', appt.id, 'falló:', e.message);
      try {
        await prisma.appointment.updateMany({
          where: { id: appt.id, control15SentAt: { not: null } },
          data: { control15SentAt: null },
        });
      } catch {}
      failed++;
    }
  }
  return { scanned: due.length, sent, failed };
}

/**
 * F8 — Funnel de controles post-adaptación (CRM centros propios).
 * Escanea PatientFollowUp:
 *   - T-7: envía email "tu control se acerca" al paciente
 *   - T-1: envía email "mañana es tu control"
 *   - T+3 sin agendar: marca OVERDUE + envía email "quedó pendiente"
 * Solo actúa 8-9am hora Colombia. Registra Interaction en la HC.
 */
async function processFollowUpReminders() {
  const now = new Date();
  const coHour = (now.getUTCHours() - 5 + 24) % 24;
  // Solo actúa en la ventana 8-9 AM Colombia. Fuera de esa ventana, no-op.
  if (coHour < 8 || coHour >= 9) return { scanned: 0, sent: 0 };

  const emailService = require('../services/email.service');
  const followUps = require('../services/followUps.service');

  const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://oirconecta.com';

  // ─── T-7 días ───
  const t7Start = new Date(now.getTime() + 6 * 24 * 3600 * 1000);
  const t7End = new Date(now.getTime() + 8 * 24 * 3600 * 1000);
  const dueT7 = await prisma.patientFollowUp.findMany({
    where: {
      status: { in: ['PENDING'] },
      reminder7dSentAt: null,
      dueDate: { gte: t7Start, lte: t7End },
    },
    include: { patient: { select: { id: true, nombre: true, email: true, telefono: true } } },
    take: 100,
  });

  // ─── T-1 día ───
  const t1Start = new Date(now.getTime() + 0.5 * 24 * 3600 * 1000);
  const t1End = new Date(now.getTime() + 1.5 * 24 * 3600 * 1000);
  const dueT1 = await prisma.patientFollowUp.findMany({
    where: {
      status: { in: ['PENDING', 'REMINDED'] },
      reminder1dSentAt: null,
      dueDate: { gte: t1Start, lte: t1End },
    },
    include: { patient: { select: { id: true, nombre: true, email: true, telefono: true } } },
    take: 100,
  });

  // ─── T+3 días sin agendar ───
  const overdueBefore = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const dueOverdue = await prisma.patientFollowUp.findMany({
    where: {
      status: { in: ['PENDING', 'REMINDED'] },
      overdueSentAt: null,
      dueDate: { lt: overdueBefore },
    },
    include: { patient: { select: { id: true, nombre: true, email: true, telefono: true } } },
    take: 100,
  });

  let sent = 0, failed = 0;

  async function sendAndRecord(fu, stage, sentField) {
    if (!fu.patient?.email) {
      // Sin email → solo marcamos que "se intentó" para no reintentar cada minuto.
      await prisma.patientFollowUp.update({
        where: { id: fu.id },
        data: { [sentField]: now, status: stage === 'OVERDUE' ? 'OVERDUE' : 'REMINDED' },
      });
      return { skipped: 'no-email' };
    }
    const claim = await prisma.patientFollowUp.updateMany({
      where: { id: fu.id, [sentField]: null },
      data: { [sentField]: now, status: stage === 'OVERDUE' ? 'OVERDUE' : 'REMINDED' },
    });
    if (claim.count === 0) return { skipped: 'already-claimed' };

    try {
      // Asegura token para el link mágico (backfill idempotente)
      const token = await followUps.ensureToken(fu.id);
      const bookingUrl = token ? `${SITE_URL}/agendar-control/${token}` : `${SITE_URL}/agendar`;
      await emailService.sendControlReminder({
        stage,
        to: fu.patient.email,
        patientName: fu.patient.nombre,
        controlLabel: followUps.stepLabel(fu.step),
        diasDesdeAdaptacion: fu.offsetDays,
        bookingUrl,
      });
      // Interaction en HC (email)
      await prisma.interaction.create({
        data: {
          patientId: fu.patient.id,
          type: 'follow_up_control',
          channel: 'email',
          direction: 'outbound',
          title: `${followUps.stepLabel(fu.step)} — recordatorio ${stage}`,
          description: `Email enviado a ${fu.patient.email}`,
          status: 'sent',
          metadata: { followUpId: fu.id, step: fu.step, stage },
        },
      });
      // Best-effort WA: si el paciente tiene teléfono, mandamos plantilla HSM
      // 'control_recordatorio' (requiere aprobación en Meta). Fallo silencioso.
      if (fu.patient.telefono) {
        try {
          const { sendWhatsAppTemplate } = require('../notifications/channels/whatsapp');
          const wa = await sendWhatsAppTemplate({
            to: String(fu.patient.telefono).replace(/\D/g, ''),
            metaTemplateName: 'control_recordatorio',
            bodyParams: [
              fu.patient.nombre?.split(' ')[0] || 'Hola',
              followUps.stepLabel(fu.step),
              bookingUrl,
            ],
          });
          await prisma.interaction.create({
            data: {
              patientId: fu.patient.id,
              type: 'follow_up_control',
              channel: 'whatsapp',
              direction: 'outbound',
              title: `${followUps.stepLabel(fu.step)} — recordatorio ${stage} (WA)`,
              description: wa.raw?.simulated ? 'WA simulado (credenciales no configuradas)' : `WA enviado a ${fu.patient.telefono}`,
              status: 'sent',
              metadata: { followUpId: fu.id, step: fu.step, stage, providerMessageId: wa.providerMessageId },
            },
          });
        } catch (waErr) {
          console.warn('[cron/followup WA]', fu.id, waErr.message);
        }
      }
      return { sent: true };
    } catch (e) {
      // Revertir claim para reintento en próximo tick
      try {
        await prisma.patientFollowUp.updateMany({
          where: { id: fu.id, [sentField]: { not: null } },
          data: { [sentField]: null },
        });
      } catch {}
      throw e;
    }
  }

  for (const fu of dueT7) {
    try { const r = await sendAndRecord(fu, 'T7', 'reminder7dSentAt'); if (r.sent) sent++; } catch (e) { console.error('[cron/followup T7]', fu.id, e.message); failed++; }
  }
  for (const fu of dueT1) {
    try { const r = await sendAndRecord(fu, 'T1', 'reminder1dSentAt'); if (r.sent) sent++; } catch (e) { console.error('[cron/followup T1]', fu.id, e.message); failed++; }
  }
  for (const fu of dueOverdue) {
    try { const r = await sendAndRecord(fu, 'OVERDUE', 'overdueSentAt'); if (r.sent) sent++; } catch (e) { console.error('[cron/followup OVERDUE]', fu.id, e.message); failed++; }
  }

  return { scanned: dueT7.length + dueT1.length + dueOverdue.length, sent, failed };
}

/**
 * Blog IA semanal — genera un post con Claude a partir del siguiente tema
 * de la cola. Solo actúa lunes 8-9am hora Colombia (UTC-5). Guard de 6 días
 * evita dobles envíos si el tick se solapa. Requiere env BLOG_AUTO_ENABLED=true
 * para activarse en producción.
 */
async function processBlogWeekly() {
  if (process.env.BLOG_AUTO_ENABLED !== 'true') return { skipped: 'disabled' };

  const now = new Date();
  const coHour = (now.getUTCHours() - 5 + 24) % 24;
  // (UTC-5) Colombia: día de la semana en hora local
  const coDate = new Date(now.getTime() - 5 * 3600 * 1000);
  const coDay = coDate.getUTCDay(); // 0=Dom, 1=Lun

  // Solo lunes 8-9am CO
  if (coDay !== 1 || coHour < 8 || coHour >= 9) return { skipped: 'out-of-window' };

  try {
    const gen = require('../services/blogGenerator.service');
    const result = await gen.generateOne({ minDaysBetween: 6 });
    if (result.post) {
      console.log(`[cron/blog] ✓ generado "${result.post.titulo}" (${result.post.estado})`);
      return { generated: 1, postId: result.post.id, titulo: result.post.titulo };
    }
    return { generated: 0, reason: result.reason };
  } catch (e) {
    console.error('[cron/blog] falló:', e.message);
    return { error: e.message };
  }
}

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

    // 4) T2-Gap4 — Cumpleaños (solo actúa 8-9am CO, no-op el resto del día)
    let birthdayResult = null;
    try {
      birthdayResult = await processBirthdays();
    } catch (e) {
      console.error('[cron] processBirthdays falló:', e.message);
    }

    // 5) T2-Gap3 — Control 15d post-cita
    let control15Result = null;
    try {
      control15Result = await processControl15d();
    } catch (e) {
      console.error('[cron] processControl15d falló:', e.message);
    }

    // 6) Blog IA semanal (solo lunes 8-9am CO si BLOG_AUTO_ENABLED=true)
    let blogResult = null;
    try {
      blogResult = await processBlogWeekly();
    } catch (e) {
      console.error('[cron] processBlogWeekly falló:', e.message);
    }

    // 7) F8 — Funnel controles post-adaptación (T-7 / T-1 / OVERDUE) 8-9am CO
    let followUpResult = null;
    try {
      followUpResult = await processFollowUpReminders();
    } catch (e) {
      console.error('[cron] processFollowUpReminders falló:', e.message);
    }

    // 8) A1 — Nudge de agendamiento post-link /agendar (WhatsApp)
    let waNudgeResult = null;
    try {
      const waNudge = require('../services/waNudge.service');
      waNudgeResult = await waNudge.processWaAgendarNudges();
    } catch (e) {
      console.error('[cron] processWaAgendarNudges falló:', e.message);
    }

    const hasActivity =
      (apptResult?.sent || 0) > 0 ||
      (remindersResult?.sent || 0) > 0 ||
      (remindersResult?.failed || 0) > 0 ||
      (nurtureResult?.sent || 0) > 0 ||
      (nurtureResult?.failed || 0) > 0 ||
      (birthdayResult?.sent || 0) > 0 ||
      (control15Result?.sent || 0) > 0 ||
      (blogResult?.generated || 0) > 0 ||
      (followUpResult?.sent || 0) > 0 ||
      (waNudgeResult?.total?.sent || 0) > 0 ||
      (waNudgeResult?.total?.booked || 0) > 0;
    if (hasActivity) {
      const ms = Date.now() - started;
      const waSent = waNudgeResult?.nudge?.sent || 0;
      const waEsc = waNudgeResult?.escalate?.escalated || 0;
      const waBook = waNudgeResult?.total?.booked || 0;
      console.log(`[cron] tick ${ms}ms · citas ${apptResult?.sent || 0}/${apptResult?.processed || 0} · reminders ${remindersResult?.sent || 0}/${remindersResult?.processed || 0} · nurture ${nurtureResult?.sent || 0}/${nurtureResult?.scanned || 0} · birthdays ${birthdayResult?.sent || 0}/${birthdayResult?.scanned || 0} · control15 ${control15Result?.sent || 0}/${control15Result?.scanned || 0} · blog ${blogResult?.generated || 0} · followups ${followUpResult?.sent || 0}/${followUpResult?.scanned || 0} · wa-nudge ${waSent} + esc ${waEsc} + booked ${waBook}`);
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

module.exports = { start, stop, tick, processPendingReminders, processLeadNurture, processBirthdays, processControl15d, processBlogWeekly, processFollowUpReminders };
