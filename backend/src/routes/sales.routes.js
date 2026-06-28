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
const emailService = require('../services/email.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/* ─── Templates de email outbound ───────────────────────── */
const TEMPLATES = {
  presentacion: {
    label: 'Presentación inicial',
    subject: 'OírConecta — Espacio para profesionales auditivos en Colombia',
    body: `Hola {nombre},

Te escribo desde OírConecta, la red más grande de profesionales auditivos en Colombia. Estamos contactando especialistas en {ciudad} para ofrecerles un espacio dedicado en nuestro directorio.

Te traemos pacientes que ya están buscando atención: filtran por ciudad, marca de audífono y aseguradora. Tu perfil aparece, te encuentran y te escriben directo.

Lanzamos con 120 días gratis, sin tarjeta. ¿Tienes 10 minutos para una demo esta semana?

Quedo atento.`,
  },
  seguimiento_24h: {
    label: 'Seguimiento 24h',
    subject: 'Te seguimos guardando un cupo en OírConecta',
    body: `Hola {nombre},

Te escribí hace unos días por el espacio para profesionales en OírConecta. Sé que la agenda está apretada, así que solo te recuerdo: tu cupo en el directorio sigue disponible y el trial de 120 días está activo.

Si te interesa, dime un horario para mostrártelo en 10 minutos.`,
  },
  demo: {
    label: 'Confirmación de demo',
    subject: 'Confirmamos demo de OírConecta',
    body: `Hola {nombre},

¡Quedó confirmada nuestra demo! Te muestro cómo aparecen los pacientes en tu perfil, cómo se gestionan las consultas y cómo activas tu trial.

Si necesitas reagendar, respóndeme directo a este correo.`,
  },
  bienvenida_trial: {
    label: 'Bienvenida al trial',
    subject: 'Tu cuenta OírConecta está lista (120 días gratis)',
    body: `Hola {nombre},

Ya activamos tu cuenta. Recibirás un correo aparte para definir tu contraseña y completar tu perfil.

Durante 120 días tienes acceso completo: panel, consultas, estadísticas, sin compromiso. Cualquier duda, escríbeme.`,
  },
};

const renderTemplate = (templateId, lead) => {
  const t = TEMPLATES[templateId];
  if (!t) return null;
  const replace = (s) => String(s || '')
    .replace(/\{nombre\}/g, lead.nombre || 'estimado/a profesional')
    .replace(/\{ciudad\}/g, lead.ciudad || 'tu ciudad')
    .replace(/\{empresa\}/g, lead.empresa || '');
  return { subject: replace(t.subject), body: replace(t.body), label: t.label };
};

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

/* ─── Email outbound ────────────────────────────────────── */

router.get('/email-templates', async (req, res) => {
  const list = Object.entries(TEMPLATES).map(([id, t]) => ({ id, label: t.label, subject: t.subject, body: t.body }));
  res.json({ success: true, data: list });
});

router.post('/leads/:id/render-template', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const { templateId } = req.body || {};
    const lead = await prisma.salesLead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead no existe' });
    const rendered = renderTemplate(templateId, lead);
    if (!rendered) return res.status(400).json({ success: false, error: 'Template no existe' });
    res.json({ success: true, data: rendered });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.post('/leads/:id/send-email', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const { subject, body } = req.body || {};
    if (!subject || !body) return res.status(400).json({ success: false, error: 'subject y body son requeridos' });
    const lead = await prisma.salesLead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead no existe' });
    if (!lead.email) return res.status(400).json({ success: false, error: 'Lead sin email' });
    if (lead.doNotContact) return res.status(403).json({ success: false, error: 'Lead marcado como No-Contactar' });

    await emailService.sendSalesOutreach({
      to: lead.email,
      toName: lead.nombre,
      subject,
      bodyText: body,
      executiveName:  req.user.nombre,
      executiveEmail: req.user.email,
    });

    // Log de actividad
    const activity = await sales.logActivity(req.params.id, req.user.id, {
      type: 'EMAIL',
      subject,
      body,
      outcome: 'Enviado',
      status: 'sent',
    });
    res.json({ success: true, data: { activity } });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

/* ─── Conversión ────────────────────────────────────────── */

router.post('/leads/:id/convert', isOwnerOfLeadOrAdmin, async (req, res) => {
  try {
    const { password, sendEmail = true } = req.body || {};
    const result = await sales.convertLeadToTrial(req.params.id, {
      password: password && String(password).trim() ? password : undefined,
      createdByUserId: req.user.id,
    });
    const { account, lead, tempPassword, alreadyExisted } = result;

    // Si la cuenta acaba de nacer, enviamos credenciales por email.
    if (!alreadyExisted && tempPassword && sendEmail) {
      try {
        await emailService.sendDirectoryWelcomeWithCredentials({
          to: account.email, nombre: account.nombre,
          tempPassword,
          executiveName:  req.user.nombre,
          executiveEmail: req.user.email,
        });
        // Loguea la actividad
        await sales.logActivity(req.params.id, req.user.id, {
          type: 'EMAIL', outcome: 'Bienvenida enviada',
          subject: 'Bienvenido a OírConecta — credenciales',
          body: `Cuenta creada con clave temporal y email enviado a ${account.email}`,
          status: 'sent',
        });
      } catch (mailErr) {
        console.warn('[sales] convert — email no enviado:', mailErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        account: { id: account.id, email: account.email, nombre: account.nombre },
        lead, tempPassword, alreadyExisted,
      },
    });
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
    const data = await sales.stats({ ownerId, range: req.query.range || 'all' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/revenue', async (req, res) => {
  try {
    const ownerId = req.user.role === 'ADMIN' ? (req.query.ownerId || undefined) : req.user.id;
    const data = await sales.revenue({ ownerId, range: req.query.range || 'all' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/* ─── Metas y progreso ──────────────────────────────────── */

router.get('/goals', async (req, res) => {
  try {
    const userId = (req.user.role === 'ADMIN' && req.query.userId) || req.user.id;
    const goals = await sales.getGoals(userId);
    res.json({ success: true, data: goals });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch('/goals', async (req, res) => {
  try {
    // El ejecutivo edita las propias; ADMIN puede pasar userId para editar las de otro.
    const userId = (req.user.role === 'ADMIN' && req.body?.userId) || req.user.id;
    const goals = await sales.setGoals(userId, req.body || {});
    res.json({ success: true, data: goals });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/goals/progress', async (req, res) => {
  try {
    const userId = (req.user.role === 'ADMIN' && req.query.userId) || req.user.id;
    const data = await sales.goalsProgress(userId);
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
