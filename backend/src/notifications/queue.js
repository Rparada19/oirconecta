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
  // Un Redis caído no puede colgar el agendamiento de una cita. Antes esto
  // tenía maxRetriesPerRequest: null y cola offline, así que con la URL de
  // Upstash muerta cada `add` esperaba para siempre.
  connection = new IORedis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 3000)),
  });
  connection.on('error', (e) => {
    // Sin spam: un host muerto emite este error cada pocos segundos.
    if (!connection.__loggedError) {
      console.error('[redis]', e.message, '— los recordatorios quedan en PENDING para el cron');
      connection.__loggedError = true;
    }
  });
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
  // El Reminder ya está en DB: si la cola falla, el cron de pendingReminders lo
  // recoge igual. Nunca dejamos que esto tumbe ni cuelgue al que llamó.
  const job = await withTimeout(q.add(
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
  ), 5000).catch((e) => {
    console.warn('[queue] no pude encolar Reminder', reminderId, '—', e.message,
      '— queda en PENDING para el cron');
    return null;
  });
  return job ? job.id : null;
}

/** Rechaza si la promesa no resuelve a tiempo. */
function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout tras ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

module.exports = { getQueue, getConnection, enqueueReminder };
