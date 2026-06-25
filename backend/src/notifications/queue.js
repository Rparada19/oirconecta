/**
 * Cola BullMQ para recordatorios. Una sola cola: `reminders`.
 * Cada job tiene `{ reminderId }` y se programa con `delay`.
 *
 * Si REDIS_URL no está definido, expone stubs no-op. Esto permite que el
 * backend levante en local sin Redis; los Reminder se crean en DB y un
 * cron alterno (no implementado aún) puede procesarlos.
 */

let queue = null;
let connection = null;

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (connection) return connection;
  const IORedis = require('ioredis');
  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  connection.on('error', (e) => console.error('[redis]', e.message));
  return connection;
}

function getQueue() {
  if (queue) return queue;
  const conn = getConnection();
  if (!conn) return null;
  const { Queue } = require('bullmq');
  queue = new Queue('reminders', { connection: conn });
  return queue;
}

/**
 * Encola un job que apunta a un Reminder existente en DB.
 * @param {string} reminderId
 * @param {Date} scheduledFor
 */
async function enqueueReminder(reminderId, scheduledFor) {
  const q = getQueue();
  if (!q) {
    console.warn('[queue] sin REDIS_URL, Reminder', reminderId, 'queda en PENDING para cron');
    return null;
  }
  const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now());
  const job = await q.add(
    'send',
    { reminderId },
    {
      delay,
      attempts: 5,
      backoff: { type: 'exponential', delay: 60_000 },
      removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
      removeOnFail: { age: 30 * 24 * 3600 },
      jobId: `reminder:${reminderId}`, // idempotencia
    }
  );
  return job.id;
}

module.exports = { getQueue, getConnection, enqueueReminder };
