/**
 * Rutas del CRM Sales (captación outbound).
 * Acceso: ADMIN o EJECUTIVO_COMERCIAL.
 *
 * Endpoints:
 *   GET    /api/sales/leads
 *   POST   /api/sales/leads
 *   GET    /api/sales/leads/:id
 *   PATCH  /api/sales/leads/:id
 *   DELETE /api/sales/leads/:id              (solo ADMIN)
 *   GET    /api/sales/leads/:id/activities
 *   POST   /api/sales/leads/:id/activities
 *   POST   /api/sales/leads/:id/tasks
 *   POST   /api/sales/leads/:id/convert
 *   POST   /api/sales/leads/import-csv
 *   GET    /api/sales/tasks/mine
 *   PATCH  /api/sales/tasks/:id
 *   GET    /api/sales/stats
 *   POST   /api/sales/admin/users           (solo ADMIN — crea EJECUTIVO_COMERCIAL)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const sales = require('../services/sales.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Todas las rutas requieren autenticación.
router.use(authenticate);
// Solo ADMIN o EJECUTIVO_COMERCIAL pueden tocar Sales.
router.use(authorize('ADMIN', 'EJECUTIVO_COMERCIAL'));

const isOwnerOfLeadOrAdmin = async (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  const lead = await prisma.salesLead.findUnique({
    where: { id: req.params.id }, select: { ownerId: true },
  });
  if (!lead) return res.status(404).json({ success: false, error: 'Lead no existe' });
  if (lead.ownerId && lead.ownerId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Lead asignado a otro ejecutivo' });
  }
  next();
};

/* ─── Leads ─────────────────────────────────────────────── */

router.get('/leads', async (req, res) => {
  try {
    // Ejecutivo solo ve sus leads; ADMIN ve todos (puede filtrar por owner).
    const ownerId = req.user.role === 'ADMIN' ? (req.query.ownerId || undefined) : req.user.id;
    const data = await sales.listLeads({
      ownerId,
      status: req.query.status,
      ciudad: req.query.ciudad,
      q: req.query.q,
      includeClosed: req.query.includeClosed !== 'false',
      limit: req.query.limit ? Number(req.query.limit) : 200,
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/leads', async (req, res) => {
  try {
    const lead = await sales.createLead(req.body, req.user.id);
    res.json({ success: true, data: lead });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/leads/:id', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const lead = await sales.getLead(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead no existe' });
    res.json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch('/leads/:id', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const lead = await sales.updateLead(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.delete('/leads/:id', authorize('ADMIN'), async (req, res) => {
  try {
    await sales.deleteLead(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── Actividades ───────────────────────────────────────── */

router.get('/leads/:id/activities', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const data = await sales.listActivities(req.params.id, Number(req.query.limit) || 100);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/leads/:id/activities', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const created = await sales.logActivity(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: created });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── Tareas ────────────────────────────────────────────── */

router.post('/leads/:id/tasks', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const task = await sales.createTask(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: task });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/tasks/mine', async (req, res) => {
  try {
    const data = await sales.listMyTasks(req.user.id, {
      onlyPending: req.query.onlyPending !== 'false',
      dueBefore:   req.query.dueBefore,
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch('/tasks/:id', async (req, res) => {
  try {
    // Ejecutivo solo puede tocar sus tareas; ADMIN cualquiera.
    if (req.user.role !== 'ADMIN') {
      const t = await prisma.salesTask.findUnique({ where: { id: req.params.id }, select: { assigneeId: true } });
      if (!t) return res.status(404).json({ success: false, error: 'Tarea no existe' });
      if (t.assigneeId !== req.user.id) return res.status(403).json({ success: false, error: 'Tarea no asignada' });
    }
    const task = await sales.updateTask(req.params.id, req.body);
    res.json({ success: true, data: task });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── Conversión ────────────────────────────────────────── */

router.post('/leads/:id/convert', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const { account, lead } = await sales.convertLeadToTrial(req.params.id);
    res.json({ success: true, data: { account, lead } });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── Import CSV ────────────────────────────────────────── */

router.post('/leads/import-csv', async (req, res) => {
  try {
    const rows = req.body?.rows;
    if (!Array.isArray(rows)) return res.status(400).json({ success: false, error: 'rows debe ser array de arrays' });
    const ownerId = req.body?.ownerId || req.user.id;
    const result = await sales.importCsv(rows, ownerId);
    res.json({ success: true, data: result });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── KPIs ──────────────────────────────────────────────── */

router.get('/stats', async (req, res) => {
  try {
    const ownerId = req.user.role === 'ADMIN' ? (req.query.ownerId || undefined) : req.user.id;
    const data = await sales.stats({ ownerId });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ─── Admin: crear usuario EJECUTIVO_COMERCIAL ──────────── */

router.post('/admin/users', authorize('ADMIN'), async (req, res) => {
  try {
    const { email, nombre, password } = req.body || {};
    if (!email || !nombre || !password) {
      return res.status(400).json({ success: false, error: 'email, nombre y password son requeridos' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        nombre,
        password: hash,
        role: 'EJECUTIVO_COMERCIAL',
        activo: true,
      },
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, error: 'Email ya registrado' });
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/admin/users', authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['EJECUTIVO_COMERCIAL', 'ADMIN'] } },
      select: { id: true, email: true, nombre: true, role: true, activo: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
