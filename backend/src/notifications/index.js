/**
 * Facade del sistema de notificaciones.
 *
 * - `scheduleReminder(...)` crea fila en `reminders` + encola job en BullMQ.
 * - `sendNow(...)` resuelve plantilla, llama al canal y escribe `notifications`.
 *   No usar para batch; usar la cola.
 *
 * Eventos canónicos están en src/notifications/events/*.js.
 */

const { PrismaClient } = require('@prisma/client');
const { render } = require('./render');
const { enqueueReminder } = require('./queue');
const { isWithinQuietHours, nextAllowedSendAt } = require('./quietHours');

const { sendEmail } = require('./channels/email');
const { sendWhatsAppTemplate } = require('./channels/whatsapp');
const { sendSms } = require('./channels/sms');

const prisma = new PrismaClient();

const TRANSACTIONAL_EVENTS = new Set([
  'CITA_AGENDADA', 'RECORDATORIO_24H', 'RECORDATORIO_2H',
  'REPROGRAMACION', 'CANCELACION',
  'RESUMEN_CONSULTA', 'COTIZACION_LISTA',
  'ENTREGA_AUDIFONO', 'REPARACION_RECIBIDA', 'REPARACION_LISTA',
  'CONTROL_7D', 'CONTROL_30D', 'CONTROL_90D', 'CONTROL_ANUAL',
  'GARANTIA_60D', 'GARANTIA_30D', 'GARANTIA_7D',
  'SEGURO_PERDIDA_30D', 'MANTENIMIENTO_90D',
]);

function isTransactional(eventCode) {
  return TRANSACTIONAL_EVENTS.has(eventCode);
}

/**
 * Crea un Reminder en DB y lo encola.
 * Si scheduledFor <= now, se procesa inmediato (delay=0).
 */
async function scheduleReminder({
  patientId,
  eventCode,
  channel,             // WHATSAPP | EMAIL | SMS | VOICE_IVR
  templateCode,
  targetType,
  targetId,
  payload = {},
  scheduledFor = new Date(),
}) {
  // Carga preferencias y consent del paciente
  const prefs = await prisma.patientPreferences.findUnique({ where: { patientId } });
  const transactional = isTransactional(eventCode);

  // Hard opt-out absoluto: solo bloquea no-transaccional
  if (!transactional && prefs?.hardOptOutAt) {
    await prisma.reminder.create({
      data: {
        patientId, eventCode, channel, templateCode,
        targetType, targetId, payload,
        scheduledFor, status: 'SKIPPED',
        lastError: 'paciente con hard opt-out',
      },
    });
    return null;
  }

  // Marketing requiere opt-in
  if (!transactional && prefs && prefs.marketingOptIn === false) {
    await prisma.reminder.create({
      data: {
        patientId, eventCode, channel, templateCode,
        targetType, targetId, payload,
        scheduledFor, status: 'SKIPPED',
        lastError: 'sin opt-in de marketing',
      },
    });
    return null;
  }

  // Quiet hours: solo aplica a no-transaccional
  let finalScheduled = new Date(scheduledFor);
  if (!transactional) {
    const start = prefs?.quietHoursStart || '20:00';
    const end = prefs?.quietHoursEnd || '07:00';
    if (finalScheduled.getTime() <= Date.now() && isWithinQuietHours(start, end)) {
      finalScheduled = nextAllowedSendAt(start, end);
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
      patientId,
      templateCode,
      channel,
      targetType,
      targetId,
      eventCode,
      payload,
      scheduledFor: finalScheduled,
      status: 'PENDING',
    },
  });

  await enqueueReminder(reminder.id, finalScheduled);
  return reminder;
}

/**
 * Resuelve plantilla + canal y envía YA. Escribe Notification.
 * Si la plantilla no existe, lanza error.
 */
async function sendNow({ patientId, eventCode, channel, templateCode, payload = {}, toOverride = null }) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, nombre: true, email: true, telefono: true },
  });
  if (!patient) throw new Error(`paciente ${patientId} no existe`);

  const tpl = await prisma.notificationTemplate.findUnique({
    where: { code_channel_locale: { code: templateCode, channel, locale: 'es-CO' } },
  });
  if (!tpl || !tpl.activo) throw new Error(`plantilla ${templateCode}/${channel} no existe o inactiva`);

  // Variables disponibles
  const vars = {
    nombre: patient.nombre,
    ...payload,
  };

  let to = toOverride;
  if (!to) {
    if (channel === 'EMAIL') to = patient.email;
    else if (channel === 'WHATSAPP' || channel === 'SMS' || channel === 'VOICE_IVR') to = patient.telefono;
  }
  if (!to) throw new Error(`paciente ${patientId} sin destino para ${channel}`);

  const subject = tpl.subject ? render(tpl.subject, vars) : null;
  const body = render(tpl.body, vars);

  let providerMessageId = null;
  let provider = 'unknown';
  let raw = null;
  let status = 'SENT';
  let errorCode = null;
  let errorMessage = null;

  try {
    if (channel === 'EMAIL') {
      provider = 'resend';
      const r = await sendEmail({ to, subject, body });
      providerMessageId = r.providerMessageId;
      raw = r.raw;
    } else if (channel === 'WHATSAPP') {
      provider = 'meta_whatsapp_cloud';
      if (!tpl.metaTemplateName) throw new Error(`plantilla ${templateCode} sin metaTemplateName`);
      const bodyParams = (tpl.variables || []).map((v) => vars[v] ?? '');
      const r = await sendWhatsAppTemplate({
        to,
        metaTemplateName: tpl.metaTemplateName,
        locale: 'es_CO',
        bodyParams,
      });
      providerMessageId = r.providerMessageId;
      raw = r.raw;
    } else if (channel === 'SMS') {
      provider = 'twilio_sms';
      const r = await sendSms({ to, body });
      providerMessageId = r.providerMessageId;
      raw = r.raw;
    } else if (channel === 'VOICE_IVR') {
      // Implementado en Fase 2
      throw new Error('VOICE_IVR no implementado en Fase 1');
    } else {
      throw new Error(`canal ${channel} no soportado`);
    }
  } catch (e) {
    status = 'FAILED';
    errorCode = e.code || 'ERROR';
    errorMessage = e.message;
  }

  const notif = await prisma.notification.create({
    data: {
      patientId,
      templateCode,
      channel,
      eventCode,
      toAddress: to,
      renderedPayload: { subject, body, vars },
      provider,
      providerMessageId,
      status,
      errorCode,
      errorMessage,
      webhookEvents: raw ? [raw] : null,
    },
  });

  if (status === 'FAILED') {
    const err = new Error(errorMessage);
    err.notificationId = notif.id;
    throw err;
  }
  return notif;
}

module.exports = { scheduleReminder, sendNow, isTransactional };
