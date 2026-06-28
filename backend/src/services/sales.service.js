/**
 * Servicio del CRM Sales (captación outbound de profesionales).
 *
 * Toda lógica de negocio (filtros, conversión, importación CSV, KPIs)
 * vive aquí. Los controllers solo orquestan request/response.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIPELINE_OPEN = ['NUEVO','CONTACTADO','INTERESADO','DEMO_AGENDADA','EN_PRUEBA'];
const PIPELINE_CLOSED = ['CONVERTIDO','PERDIDO'];

/* ─── Leads ─────────────────────────────────────────────── */

async function listLeads({ ownerId, status, ciudad, q, limit = 200, includeClosed = true }) {
  const where = {};
  if (ownerId) where.ownerId = ownerId;
  if (status) where.status = status;
  if (ciudad) where.ciudad = ciudad;
  if (!includeClosed) where.status = { in: PIPELINE_OPEN };
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { nombre:    { contains: term, mode: 'insensitive' } },
      { email:     { contains: term, mode: 'insensitive' } },
      { telefono:  { contains: term } },
      { empresa:   { contains: term, mode: 'insensitive' } },
      { profesion: { contains: term, mode: 'insensitive' } },
    ];
  }
  return prisma.salesLead.findMany({
    where,
    orderBy: [{ nextActionAt: 'asc' }, { createdAt: 'desc' }],
    take: Math.min(limit, 500),
    include: {
      owner: { select: { id: true, nombre: true, email: true } },
      _count: { select: { activities: true, tasks: true } },
    },
  });
}

async function getLead(id) {
  return prisma.salesLead.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, nombre: true, email: true } },
      activities: { orderBy: { ts: 'desc' }, take: 50,
        include: { user: { select: { id: true, nombre: true } } } },
      tasks: { orderBy: { dueAt: 'asc' }, take: 50,
        include: { assignee: { select: { id: true, nombre: true } } } },
    },
  });
}

async function createLead(data, currentUserId) {
  return prisma.salesLead.create({
    data: {
      nombre:    String(data.nombre || '').trim(),
      email:     data.email     ? String(data.email).trim().toLowerCase() : null,
      telefono:  data.telefono  ? String(data.telefono).trim() : null,
      profesion: data.profesion || null,
      empresa:   data.empresa   || null,
      ciudad:    data.ciudad    || null,
      source:    data.source    || 'manual',
      notes:     data.notes     || null,
      ownerId:   data.ownerId   || currentUserId,
      status:    data.status    || 'NUEVO',
      nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null,
    },
  });
}

async function updateLead(id, data) {
  const update = {};
  const fields = ['nombre','email','telefono','profesion','empresa','ciudad','status','notes','ownerId','score','doNotContact'];
  for (const f of fields) if (data[f] !== undefined) update[f] = data[f];
  if (data.nextActionAt !== undefined) update.nextActionAt = data.nextActionAt ? new Date(data.nextActionAt) : null;

  // Si cambia a EN_PRUEBA / CONVERTIDO, dejar timestamps
  if (data.status === 'CONVERTIDO' || data.status === 'EN_PRUEBA') {
    update.convertedAt = update.convertedAt || new Date();
  }
  return prisma.salesLead.update({ where: { id }, data: update });
}

async function deleteLead(id) {
  return prisma.salesLead.delete({ where: { id } });
}

/* ─── Actividades ───────────────────────────────────────── */

async function logActivity(leadId, userId, data) {
  const created = await prisma.salesActivity.create({
    data: {
      leadId, userId,
      type:        data.type,
      outcome:     data.outcome || null,
      subject:     data.subject || null,
      body:        data.body    || null,
      durationSec: data.durationSec || null,
      ts:          data.ts ? new Date(data.ts) : new Date(),
      externalRef: data.externalRef || null,
      status:      data.status || null,
    },
  });
  // Toca lastActivityAt del lead
  await prisma.salesLead.update({
    where: { id: leadId },
    data: { lastActivityAt: created.ts },
  });
  // Reglas de avance automático sugerido — el ejecutivo decide el status real.
  return created;
}

async function listActivities(leadId, limit = 100) {
  return prisma.salesActivity.findMany({
    where: { leadId },
    orderBy: { ts: 'desc' },
    take: Math.min(limit, 500),
    include: { user: { select: { id: true, nombre: true } } },
  });
}

/* ─── Tareas ────────────────────────────────────────────── */

async function createTask(leadId, data, currentUserId) {
  return prisma.salesTask.create({
    data: {
      leadId,
      assigneeId: data.assigneeId || currentUserId,
      type:       data.type,
      dueAt:      new Date(data.dueAt),
      notes:      data.notes || null,
      status:     'PENDING',
    },
  });
}

async function updateTask(id, data) {
  const update = {};
  if (data.status) update.status = data.status;
  if (data.status === 'DONE') update.doneAt = new Date();
  if (data.dueAt) update.dueAt = new Date(data.dueAt);
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.assigneeId) update.assigneeId = data.assigneeId;
  return prisma.salesTask.update({ where: { id }, data: update });
}

async function listMyTasks(assigneeId, { onlyPending = true, dueBefore } = {}) {
  const where = { assigneeId };
  if (onlyPending) where.status = 'PENDING';
  if (dueBefore) where.dueAt = { lte: new Date(dueBefore) };
  return prisma.salesTask.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    take: 200,
    include: {
      lead: { select: { id: true, nombre: true, telefono: true, email: true, ciudad: true, status: true } },
    },
  });
}

/* ─── Conversión a profesional del directorio ───────────── */

/**
 * Marca el lead como EN_PRUEBA y crea (si no existe) la DirectoryAccount
 * + DirectoryProfile con trial 120 d. Devuelve la cuenta creada / vinculada.
 * No envía email (lo dispara el servicio de email tras este paso).
 */
async function convertLeadToTrial(leadId) {
  const lead = await prisma.salesLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead no existe');
  if (!lead.email) throw new Error('Lead sin email — no se puede crear cuenta del directorio');

  const email = lead.email.toLowerCase();
  let account = await prisma.directoryAccount.findUnique({ where: { email } });
  if (!account) {
    // Crea cuenta sin password (debe activar con link). El servicio email
    // envía la invitación con set-password.
    account = await prisma.directoryAccount.create({
      data: {
        email,
        nombre: lead.nombre,
        // No seteamos password aquí — el profesional la define al activar.
      },
    });
  }

  await prisma.salesLead.update({
    where: { id: leadId },
    data: {
      status: 'EN_PRUEBA',
      convertedAccountId: account.id,
      convertedAt: new Date(),
    },
  });

  return { account, lead };
}

/* ─── Importación CSV ───────────────────────────────────── */

/**
 * Recibe una matriz [[nombre,email,telefono,profesion,empresa,ciudad], ...]
 * (la primera fila puede ser header — se ignora si contiene 'nombre').
 * Idempotente por email|telefono — si ya existe, no duplica.
 */
async function importCsv(rows, ownerId) {
  if (!Array.isArray(rows) || rows.length === 0) return { imported: 0, skipped: 0 };
  // Detectar header
  const first = rows[0].map((c) => String(c || '').toLowerCase());
  const hasHeader = first.includes('nombre') || first.includes('email');
  const dataRows = hasHeader ? rows.slice(1) : rows;

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const r of dataRows) {
    const [nombre, email, telefono, profesion, empresa, ciudad] = r.map((c) => (c == null ? '' : String(c).trim()));
    if (!nombre) { skipped++; continue; }

    // Evitar duplicado por email o teléfono
    const dup = await prisma.salesLead.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : undefined,
          telefono ? { telefono } : undefined,
        ].filter(Boolean),
      },
    });
    if (dup) { skipped++; continue; }

    try {
      await prisma.salesLead.create({
        data: {
          nombre,
          email:    email ? email.toLowerCase() : null,
          telefono: telefono || null,
          profesion: profesion || null,
          empresa:  empresa || null,
          ciudad:   ciudad || null,
          source:   'csv-import',
          ownerId,
          status:   'NUEVO',
        },
      });
      imported++;
    } catch (e) {
      errors.push({ row: r, error: e.message });
      skipped++;
    }
  }
  return { imported, skipped, errors: errors.slice(0, 10) };
}

/* ─── KPIs ──────────────────────────────────────────────── */

async function stats({ ownerId } = {}) {
  const where = ownerId ? { ownerId } : {};
  const [byStatus, today, week, month] = await Promise.all([
    prisma.salesLead.groupBy({ by: ['status'], _count: { _all: true }, where }),
    prisma.salesActivity.count({
      where: {
        ...(ownerId ? { userId: ownerId } : {}),
        ts: { gte: startOf('day') },
      },
    }),
    prisma.salesActivity.count({
      where: {
        ...(ownerId ? { userId: ownerId } : {}),
        ts: { gte: startOf('week') },
      },
    }),
    prisma.salesActivity.count({
      where: {
        ...(ownerId ? { userId: ownerId } : {}),
        ts: { gte: startOf('month') },
      },
    }),
  ]);
  const counts = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));
  const open = PIPELINE_OPEN.reduce((s, k) => s + (counts[k] || 0), 0);
  const closed = PIPELINE_CLOSED.reduce((s, k) => s + (counts[k] || 0), 0);
  const conversionRate = open + closed > 0 ? Math.round(((counts.CONVERTIDO || 0) / (open + closed)) * 100) : 0;
  return {
    byStatus: counts,
    open, closed,
    conversionRate,
    activities: { today, week, month },
  };
}

function startOf(period) {
  const d = new Date();
  if (period === 'day') { d.setHours(0,0,0,0); return d; }
  if (period === 'week') {
    const day = d.getDay() || 7; // Mon=1, Sun=7
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'month') {
    d.setDate(1); d.setHours(0,0,0,0);
    return d;
  }
  return d;
}

module.exports = {
  PIPELINE_OPEN, PIPELINE_CLOSED,
  listLeads, getLead, createLead, updateLead, deleteLead,
  logActivity, listActivities,
  createTask, updateTask, listMyTasks,
  convertLeadToTrial,
  importCsv,
  stats,
};
