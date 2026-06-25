/**
 * Worker BullMQ. Procesa jobs `send` de la cola `reminders`.
 * Cada job tiene { reminderId }. El worker:
 *   1. Carga el Reminder
 *   2. Verifica que sigue PENDING (idempotencia)
 *   3. Llama a sendNow del facade
 *   4. Marca SENT / FAILED / reintenta
 *
 * Arrancar como proceso aparte:
 *   node src/notifications/worker.js
 * O integrar al backend con un flag (NOTIFICATIONS_WORKER_INPROCESS=true).
 */

const { PrismaClient } = require('@prisma/client');
const { getConnection } = require('./queue');
const { sendNow } = require('./index');

const prisma = new PrismaClient();

function start() {
  const conn = getConnection();
  if (!conn) {
    console.warn('[worker] REDIS_URL no configurado, worker no arranca');
    return null;
  }
  const { Worker } = require('bullmq');
  const worker = new Worker(
    'reminders',
    async (job) => {
      const { reminderId } = job.data;
      const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
      if (!reminder) {
        console.warn('[worker] reminder', reminderId, 'no existe');
        return { skipped: 'missing' };
      }
      if (reminder.status !== 'PENDING' && reminder.status !== 'QUEUED') {
        return { skipped: reminder.status };
      }

      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'QUEUED', attempts: { increment: 1 } },
      });

      try {
        const notif = await sendNow({
          patientId: reminder.patientId,
          eventCode: reminder.eventCode,
          channel: reminder.channel,
          templateCode: reminder.templateCode,
          payload: reminder.payload || {},
        });
        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            notificationId: notif.id,
            lastError: null,
          },
        });
        return { ok: true, notificationId: notif.id };
      } catch (e) {
        // Si BullMQ tiene reintentos pendientes lo dejamos como PENDING;
        // en el último intento queda FAILED.
        const isLast = job.attemptsMade + 1 >= (job.opts.attempts || 1);
        await prisma.reminder.update({
          where: { id: reminderId },
          data: {
            status: isLast ? 'FAILED' : 'PENDING',
            lastError: e.message.slice(0, 500),
          },
        });
        throw e;
      }
    },
    { connection: conn, concurrency: 4 }
  );

  worker.on('completed', (job) => console.log('[worker] ok', job.id));
  worker.on('failed', (job, err) => console.error('[worker] fail', job?.id, err.message));
  console.log('[worker] notifications worker arriba');
  return worker;
}

// Si se ejecuta directo (node src/notifications/worker.js)
if (require.main === module) {
  require('dotenv').config();
  start();
}

module.exports = { start };
