/**
 * Servicio del CRM Sales (captación outbound de profesionales).
 *
 * Toda lógica de negocio (filtros, conversión, importación CSV, KPIs)
 * vive aquí. Los controllers solo orquestan request/response.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
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
 * Genera una clave temporal robusta tipo "Marca-XYZW-2491".
 */
function generateTempPassword() {
  const adjectives = ['Audio','Sonus','Claro','Onda','Voz','Eco','Logos','Ritmo','Aliento','Pulso'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${a}-${s}-${n}`;
}

/**
 * Marca el lead como EN_PRUEBA y crea (si no existe) la DirectoryAccount.
 * El Ejecutivo Comercial define una clave inicial; queda marcada como
 * temporal (mustChangePassword=true). El profesional la cambia al primer
 * login en /portal-profesional.
 *
 * @param {string} leadId
 * @param {{ password?: string, createdByUserId?: string }} opts
 * @returns {{ account, lead, tempPassword, alreadyExisted }}
 */
async function convertLeadToTrial(leadId, opts = {}) {
  const lead = await prisma.salesLead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error('Lead no existe');
  if (!lead.email) throw new Error('Lead sin email — no se puede crear cuenta del directorio');

  const email = lead.email.toLowerCase();
  const existing = await prisma.directoryAccount.findUnique({ where: { email } });
  let account = existing;
  let tempPassword = null;

  if (!existing) {
    tempPassword = (opts.password && String(opts.password).trim()) || generateTempPassword();
    if (tempPassword.length < 8) throw new Error('La clave temporal debe tener mínimo 8 caracteres');
    const hash = await bcrypt.hash(tempPassword, 10);
    account = await prisma.directoryAccount.create({
      data: {
        email,
        nombre: lead.nombre,
        password: hash,
        mustChangePassword: true,
        createdByUserId: opts.createdByUserId || null,
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

  return { account, lead, tempPassword, alreadyExisted: !!existing };
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

/* ─── Rangos de tiempo ──────────────────────────────────── */

function startOf(period) {
  const d = new Date();
  if (period === 'day') { d.setHours(0,0,0,0); return d; }
  if (period === 'week') {
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'biweek') {
    d.setDate(d.getDate() - 14); d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'month') {
    d.setDate(1); d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) * 3;
    d.setMonth(q, 1); d.setHours(0,0,0,0);
    return d;
  }
  if (period === 'year') {
    d.setMonth(0, 1); d.setHours(0,0,0,0);
    return d;
  }
  return d;
}

const RANGE_LABELS = {
  day: 'Hoy', week: 'Esta semana', biweek: 'Últimos 15 días',
  month: 'Este mes', quarter: 'Este trimestre', year: 'Este año', all: 'Histórico',
};

function rangeWhere(range, field = 'ts') {
  if (!range || range === 'all') return {};
  return { [field]: { gte: startOf(range) } };
}

/* ─── KPIs ──────────────────────────────────────────────── */

async function stats({ ownerId, range = 'all' } = {}) {
  const where = ownerId ? { ownerId } : {};
  const activityWhereBase = ownerId ? { userId: ownerId } : {};

  const [byStatus, today, week, month, rangeCount, rangeByType] = await Promise.all([
    prisma.salesLead.groupBy({ by: ['status'], _count: { _all: true }, where }),
    prisma.salesActivity.count({ where: { ...activityWhereBase, ts: { gte: startOf('day') } } }),
    prisma.salesActivity.count({ where: { ...activityWhereBase, ts: { gte: startOf('week') } } }),
    prisma.salesActivity.count({ where: { ...activityWhereBase, ts: { gte: startOf('month') } } }),
    prisma.salesActivity.count({ where: { ...activityWhereBase, ...rangeWhere(range) } }),
    prisma.salesActivity.groupBy({
      by: ['type'], _count: { _all: true },
      where: { ...activityWhereBase, ...rangeWhere(range) },
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));
  const open = PIPELINE_OPEN.reduce((s, k) => s + (counts[k] || 0), 0);
  const closed = PIPELINE_CLOSED.reduce((s, k) => s + (counts[k] || 0), 0);
  const conversionRate = open + closed > 0
    ? Math.round(((counts.CONVERTIDO || 0) / (open + closed)) * 100) : 0;

  const activitiesByType = Object.fromEntries(rangeByType.map((b) => [b.type, b._count._all]));

  return {
    range, rangeLabel: RANGE_LABELS[range] || range,
    byStatus: counts,
    open, closed,
    conversionRate,
    activities: { today, week, month, rangeTotal: rangeCount, byType: activitiesByType },
  };
}

/**
 * Revenue trackeado a través de los profesionales que cada ejecutivo
 * captó: DirectoryAccount.createdByUserId → DirectoryProfile → Subscription
 * → Payments APPROVED.
 */
async function revenue({ ownerId, range = 'all' } = {}) {
  const accountWhere = ownerId ? { createdByUserId: ownerId } : { createdByUserId: { not: null } };
  const accounts = await prisma.directoryAccount.findMany({
    where: accountWhere,
    select: {
      id: true, email: true, nombre: true, createdByUserId: true, createdAt: true,
      profile: {
        select: {
          id: true,
        },
      },
    },
  });
  const accountIds = accounts.map((a) => a.id);
  if (accountIds.length === 0) {
    return { activeAccounts: 0, totalAccounts: 0, paidAccounts: 0, payments: { count: 0, totalCOP: 0 }, breakdown: [] };
  }

  // Buscar las subscriptions de esos accounts (vía profile.id en Subscription.profileId)
  const profiles = await prisma.directoryProfile.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true, accountId: true, status: true },
  });
  const profileIds = profiles.map((p) => p.id);
  const subs = profileIds.length === 0 ? [] : await prisma.subscription.findMany({
    where: { profileId: { in: profileIds } },
    select: { id: true, profileId: true, status: true },
  });
  const subIds = subs.map((s) => s.id);

  const paymentsWhere = {
    status: 'APPROVED',
    subscriptionId: { in: subIds },
    ...rangeWhere(range, 'paidAt'),
  };
  const payments = subIds.length === 0
    ? { _count: { _all: 0 }, _sum: { totalCOP: 0 } }
    : await prisma.payment.aggregate({ where: paymentsWhere, _count: { _all: true }, _sum: { totalCOP: true } });

  // Breakdown por ejecutivo (solo útil cuando ADMIN no filtra ownerId)
  const breakdown = [];
  if (!ownerId) {
    const byExec = {};
    for (const a of accounts) {
      if (!a.createdByUserId) continue;
      byExec[a.createdByUserId] = byExec[a.createdByUserId] || { ownerId: a.createdByUserId, accounts: 0 };
      byExec[a.createdByUserId].accounts += 1;
    }
    breakdown.push(...Object.values(byExec));
  }

  return {
    range, rangeLabel: RANGE_LABELS[range] || range,
    totalAccounts: accounts.length,
    paidAccounts: subs.filter((s) => ['ACTIVE','EXPIRING_SOON'].includes(s.status)).length,
    payments: {
      count: payments._count?._all || 0,
      totalCOP: payments._sum?.totalCOP || 0,
    },
    breakdown,
  };
}

/* ─── Metas ─────────────────────────────────────────────── */

const DEFAULT_GOALS = {
  callsPerDay: 25,
  emailsPerDay: 15,
  whatsappPerDay: 10,
  demosPerWeek: 6,
  conversionsPerMonth: 8,
};

async function getGoals(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { salesGoals: true } });
  return { ...DEFAULT_GOALS, ...(u?.salesGoals || {}) };
}

async function setGoals(userId, goals) {
  const clean = {};
  for (const k of Object.keys(DEFAULT_GOALS)) {
    if (goals[k] != null) {
      const n = Number(goals[k]);
      if (!Number.isFinite(n) || n < 0) throw new Error(`Meta inválida: ${k}`);
      clean[k] = Math.floor(n);
    }
  }
  await prisma.user.update({ where: { id: userId }, data: { salesGoals: clean } });
  return { ...DEFAULT_GOALS, ...clean };
}

/**
 * Progreso del día / semana / mes contra metas.
 */
async function goalsProgress(userId) {
  const goals = await getGoals(userId);
  const [callsToday, emailsToday, whatsappToday, demosWeek, conversionsMonth] = await Promise.all([
    prisma.salesActivity.count({ where: { userId, type: 'CALL',     ts: { gte: startOf('day') } } }),
    prisma.salesActivity.count({ where: { userId, type: 'EMAIL',    ts: { gte: startOf('day') } } }),
    prisma.salesActivity.count({ where: { userId, type: 'WHATSAPP', ts: { gte: startOf('day') } } }),
    prisma.salesActivity.count({ where: { userId, type: 'MEETING',  ts: { gte: startOf('week') } } }),
    prisma.salesLead.count({ where: { ownerId: userId, status: 'CONVERTIDO', convertedAt: { gte: startOf('month') } } }),
  ]);
  const safe = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
  return {
    goals,
    items: [
      { key: 'calls',       label: 'Llamadas hoy',         actual: callsToday,       goal: goals.callsPerDay,        pct: safe(callsToday, goals.callsPerDay) },
      { key: 'emails',      label: 'Emails hoy',           actual: emailsToday,      goal: goals.emailsPerDay,       pct: safe(emailsToday, goals.emailsPerDay) },
      { key: 'whatsapp',    label: 'WhatsApp hoy',         actual: whatsappToday,    goal: goals.whatsappPerDay,     pct: safe(whatsappToday, goals.whatsappPerDay) },
      { key: 'demos',       label: 'Demos esta semana',    actual: demosWeek,        goal: goals.demosPerWeek,       pct: safe(demosWeek, goals.demosPerWeek) },
      { key: 'conversions', label: 'Conversiones del mes', actual: conversionsMonth, goal: goals.conversionsPerMonth, pct: safe(conversionsMonth, goals.conversionsPerMonth) },
    ],
  };
}

module.exports = {
  PIPELINE_OPEN, PIPELINE_CLOSED,
  listLeads, getLead, createLead, updateLead, deleteLead,
  logActivity, listActivities,
  createTask, updateTask, listMyTasks,
  convertLeadToTrial,
  importCsv,
  stats,
  revenue,
  getGoals, setGoals, goalsProgress,
  DEFAULT_GOALS, RANGE_LABELS,
};
