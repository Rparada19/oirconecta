/**
 * F9 — Endpoints de la bandeja de WhatsApp corporativo.
 *
 *   GET    /api/wa/conversations                  → lista con filtros
 *   GET    /api/wa/conversations/summary          → contadores (para badge)
 *   GET    /api/wa/conversations/:id              → detalle + últimos mensajes
 *   POST   /api/wa/conversations/:id/messages     → enviar texto libre (dentro de ventana 24h)
 *   POST   /api/wa/conversations/:id/read         → marca como leído (unreadCount=0)
 *   POST   /api/wa/conversations/:id/assign       → asigna a usuario (o desasigna con userId=null)
 *   POST   /api/wa/conversations/:id/status       → cambia status (HUMAN/CLOSED/ESCALATED)
 *   POST   /api/wa/conversations/:id/link-patient → vincula la conversación a un Patient existente
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const corp = require('../services/waCorporate.service');
const catalog = require('../services/waTemplates.catalog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ─── Plantillas HSM disponibles ────────────────────────────
router.get('/templates', async (req, res, next) => {
  try {
    const { businessLine } = req.query;
    const templates = catalog.listTemplates({ businessLine });
    // Devolvemos sin exponer metaName exacto (por si acaso)
    res.json({
      success: true,
      data: templates.map((t) => ({
        key: t.key,
        label: t.label,
        description: t.description,
        category: t.category,
        businessLine: t.businessLine,
        variables: t.variables,
        preview: t.preview,
      })),
    });
  } catch (e) { next(e); }
});

// ─── Nueva conversación ────────────────────────────────────
router.post('/conversations/new', async (req, res, next) => {
  try {
    const { phone, contactName, templateKey, variables, businessLine } = req.body || {};
    if (!phone) return res.status(400).json({ success: false, error: 'phone requerido' });
    if (!templateKey) return res.status(400).json({ success: false, error: 'templateKey requerido' });

    const result = await corp.startNewConversation({
      phone,
      contactName: contactName || null,
      templateKey,
      variables: variables || {},
      businessLine: (businessLine || 'CRM').toUpperCase(),
      sentByUserId: req.user?.id || null,
    });
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    if (['INVALID_PHONE', 'TEMPLATE_NOT_FOUND', 'MISSING_VARIABLE', 'TEMPLATE_BUSINESS_MISMATCH'].includes(e.code)) {
      return res.status(400).json({ success: false, error: e.message, code: e.code });
    }
    if (e.code === 'SEND_FAILED') {
      return res.status(502).json({
        success: false, error: e.message, code: 'SEND_FAILED',
        conversationId: e.conversationId, messageId: e.messageId,
      });
    }
    next(e);
  }
});

// ─── Listar ────────────────────────────────────────────────
router.get('/conversations', async (req, res, next) => {
  try {
    const {
      businessLine, status, assignedTo, unassigned, mine, q,
      limit = 50, cursor,
    } = req.query;

    const where = {};
    if (businessLine) where.businessLine = String(businessLine).toUpperCase();
    if (status) where.status = String(status).toUpperCase();
    if (unassigned === 'true') where.assignedToId = null;
    else if (mine === 'true' && req.user?.id) where.assignedToId = req.user.id;
    else if (assignedTo) where.assignedToId = String(assignedTo);

    if (q) {
      where.OR = [
        { phone: { contains: String(q).replace(/\D/g, '') } },
        { contactName: { contains: String(q), mode: 'insensitive' } },
        { lastMessagePreview: { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const take = Math.min(200, parseInt(limit, 10) || 50);
    const rows = await prisma.whatsAppConversation.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: String(cursor) } } : {}),
      include: {
        assignedTo: { select: { id: true, nombre: true, email: true } },
        patient: { select: { id: true, nombre: true } },
      },
    });

    const hasMore = rows.length > take;
    const data = hasMore ? rows.slice(0, take) : rows;
    res.json({
      success: true,
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    });
  } catch (e) { next(e); }
});

// ─── Resumen (contadores badge) ────────────────────────────
router.get('/conversations/summary', async (req, res, next) => {
  try {
    const [crmTotal, crmUnread, crmUnassigned, dirTotal, dirUnread, dirUnassigned] = await Promise.all([
      prisma.whatsAppConversation.count({ where: { businessLine: 'CRM', status: { not: 'CLOSED' } } }),
      prisma.whatsAppConversation.count({ where: { businessLine: 'CRM', status: { not: 'CLOSED' }, unreadCount: { gt: 0 } } }),
      prisma.whatsAppConversation.count({ where: { businessLine: 'CRM', status: { not: 'CLOSED' }, assignedToId: null } }),
      prisma.whatsAppConversation.count({ where: { businessLine: 'DIRECTORIO', status: { not: 'CLOSED' } } }),
      prisma.whatsAppConversation.count({ where: { businessLine: 'DIRECTORIO', status: { not: 'CLOSED' }, unreadCount: { gt: 0 } } }),
      prisma.whatsAppConversation.count({ where: { businessLine: 'DIRECTORIO', status: { not: 'CLOSED' }, assignedToId: null } }),
    ]);
    res.json({
      success: true,
      data: {
        crm: { total: crmTotal, unread: crmUnread, unassigned: crmUnassigned },
        directorio: { total: dirTotal, unread: dirUnread, unassigned: dirUnassigned },
      },
    });
  } catch (e) { next(e); }
});

// ─── Detalle + mensajes ────────────────────────────────────
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, nombre: true, email: true } },
        patient: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });
    if (!conv) return res.status(404).json({ success: false, error: 'No encontrada' });

    const limit = Math.min(500, parseInt(req.query.limit || '200', 10));
    const messages = await prisma.whatsAppMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { timestamp: 'asc' },
      take: limit,
      include: { sentByUser: { select: { id: true, nombre: true } } },
    });

    const windowOpen = !conv.windowExpiresAt || conv.windowExpiresAt > new Date();
    res.json({ success: true, data: { conversation: conv, messages, windowOpen } });
  } catch (e) { next(e); }
});

// ─── Enviar texto libre ────────────────────────────────────
router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ success: false, error: 'text requerido' });

    const result = await corp.sendTextToConversation({
      conversationId: req.params.id,
      text: String(text).trim(),
      sentByUserId: req.user?.id || null,
      sentByBot: false,
    });
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    if (e.code === 'WINDOW_CLOSED') {
      return res.status(409).json({ success: false, error: e.message, code: 'WINDOW_CLOSED' });
    }
    if (e.code === 'SEND_FAILED') {
      return res.status(502).json({ success: false, error: e.message, code: 'SEND_FAILED', messageId: e.messageId });
    }
    next(e);
  }
});

// ─── Marcar como leído ─────────────────────────────────────
router.post('/conversations/:id/read', async (req, res, next) => {
  try {
    await corp.markConversationRead(req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// ─── Asignar / desasignar ──────────────────────────────────
router.post('/conversations/:id/assign', async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    const targetUserId = userId === null || userId === '' ? null : String(userId || '');
    const updated = await prisma.whatsAppConversation.update({
      where: { id: req.params.id },
      data: { assignedToId: targetUserId || null },
      include: { assignedTo: { select: { id: true, nombre: true } } },
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// ─── Cambiar status ────────────────────────────────────────
router.post('/conversations/:id/status', async (req, res, next) => {
  try {
    const { status, intent, businessLine } = req.body || {};
    const data = {};
    if (status) data.status = String(status).toUpperCase();
    if (intent) data.intent = String(intent).toUpperCase();
    if (businessLine) data.businessLine = String(businessLine).toUpperCase();
    if (Object.keys(data).length === 0) return res.status(400).json({ success: false, error: 'nada para actualizar' });
    const updated = await prisma.whatsAppConversation.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// ─── Vincular a Patient ────────────────────────────────────
router.post('/conversations/:id/link-patient', async (req, res, next) => {
  try {
    const { patientId } = req.body || {};
    if (!patientId) return res.status(400).json({ success: false, error: 'patientId requerido' });
    const patient = await prisma.patient.findUnique({ where: { id: String(patientId) }, select: { id: true } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient no encontrado' });
    const updated = await prisma.whatsAppConversation.update({
      where: { id: req.params.id },
      data: { patientId: patient.id },
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

module.exports = router;
