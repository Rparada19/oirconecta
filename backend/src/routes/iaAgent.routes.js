/**
 * F5.1 — Endpoints públicos del agente IA del profesional (Plan 3).
 *
 *  GET  /api/ia/public/:profileId/info   — verifica disponibilidad + cuota visible
 *  POST /api/ia/public/:profileId/chat   — { conversationId?, message } → { conversationId, reply, quota }
 */

const express = require('express');
const ia = require('../services/iaAgent.service');
const iaAdmin = require('../services/iaAdmin.service');
const iaPacks = require('../services/iaPacks.service');
const iaConfig = require('../services/iaAgentConfig.service');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message, code: e.code }),
  );
}

router.get('/public/:profileId/info', (req, res) =>
  send(res, async () => {
    const info = await ia.getIaInfo(req.params.profileId);
    if (info.available) {
      const cfg = await iaConfig.getConfigOrDefaults(req.params.profileId);
      info.agent = {
        name: cfg.agentName,
        color: cfg.agentColor,
        icon: cfg.agentIcon,
        welcomeMessage: cfg.welcomeMessage,
      };
    }
    return info;
  }));

// Catálogo público de íconos disponibles (para el picker del profesional)
router.get('/agent-config/icons', (req, res) =>
  send(res, () => iaConfig.AGENT_ICONS));

router.post('/public/:profileId/chat', (req, res) => {
  // Captura mínima de metadata sin PII: IP truncada + user-agent corto
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const ipMasked = ip.replace(/\.\d+$/, '.X'); // anonimiza octeto final IPv4
  const ua = (req.headers['user-agent'] || '').toString().slice(0, 80);
  send(res, () => ia.chat(req.params.profileId, {
    conversationId: req.body?.conversationId,
    message: req.body?.message,
    metadata: { ipMasked, ua },
  }));
});

// ─── Catálogo público de paquetes ───
router.get('/packs/catalog', (req, res) =>
  send(res, () => iaPacks.listCatalog()));

// ─── Profesional (propio) ───
async function withProfile(req, res, next) {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    req.profileId = profile.id;
    const sub = await prisma.subscription.findUnique({ where: { profileId: profile.id }, select: { id: true } });
    req.subscriptionId = sub?.id || null;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

router.get('/me/balance', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaPacks.getBalanceForProfile(req.profileId)));

// Configuración del agente (nombre, color, welcome)
router.get('/me/agent-config', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaConfig.getConfigOrDefaults(req.profileId)));

router.put('/me/agent-config', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaConfig.upsertConfig(req.profileId, req.body || {})));

// Límites y catálogos (para el UI)
router.get('/agent-config/limits', (req, res) =>
  send(res, () => ({
    text: iaConfig.TEXT_LIMITS,
    faqs: { max: iaConfig.MAX_FAQS, questionMax: iaConfig.FAQ_Q_MAX, answerMax: iaConfig.FAQ_A_MAX },
  })));

// FAQs — CRUD por profesional
router.get('/me/agent-faqs', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaConfig.listFaqs(req.profileId)));

router.post('/me/agent-faqs', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaConfig.createFaq(req.profileId, req.body || {})));

router.patch('/me/agent-faqs/:faqId', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaConfig.updateFaq(req.profileId, req.params.faqId, req.body || {})));

router.delete('/me/agent-faqs/:faqId', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, async () => {
    await iaConfig.deleteFaq(req.profileId, req.params.faqId);
    return { ok: true };
  }));

router.get('/me/packs', authenticateDirectoryAccount, withProfile, (req, res) => {
  if (!req.subscriptionId) return res.json({ success: true, data: [] });
  return send(res, () => iaPacks.listPacks(req.subscriptionId));
});

// Conversaciones del propio profesional (auditoría obligatoria por ley)
router.get('/me/conversations', authenticateDirectoryAccount, withProfile, (req, res) =>
  send(res, () => iaAdmin.listConversations({
    profileId: req.profileId,
    status: req.query.status,
    from: req.query.from, to: req.query.to,
    limit: req.query.limit || 200, offset: req.query.offset,
  })));

router.get('/me/conversations/:id', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const detail = await iaAdmin.getConversationDetail(req.params.id);
    if (!detail) return res.status(404).json({ success: false, error: 'Conversación no encontrada' });
    // Aislamiento multi-tenant: profesional solo ve sus propias conversaciones
    if (detail.profileId !== req.profileId) return res.status(403).json({ success: false, error: 'Acceso denegado' });
    res.json({ success: true, data: detail });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Export XLSX de conversaciones (compliance / habeas data)
router.get('/me/conversations.xlsx', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { items } = await iaAdmin.listConversations({
      profileId: req.profileId,
      from: req.query.from, to: req.query.to,
      limit: 10000,
    });
    // Para cada conversación, extraer mensajes en formato legible
    const rows = [];
    for (const c of items) {
      const detail = await iaAdmin.getConversationDetail(c.id);
      if (!detail) continue;
      for (const m of detail.messages) {
        rows.push({
          'Conversación ID': c.id,
          'Paciente': c.pacienteNombre || 'Anónimo',
          'Teléfono': c.pacienteTelefono || '',
          'Canal': c.canal,
          'Inicio conversación': c.startedAt ? new Date(c.startedAt).toLocaleString('es-CO') : '',
          'Fecha mensaje': m.createdAt ? new Date(m.createdAt).toLocaleString('es-CO') : '',
          'Rol': m.role === 'user' ? 'Paciente' : m.role === 'assistant' ? 'Asistente IA' : `Tool: ${m.toolName || ''}`,
          'Contenido': m.content,
          'Tokens': m.tokens || 0,
          'Terminó en cita': c.resultedInAppointmentId ? 'Sí' : 'No',
        });
      }
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 80 }, { wch: 8 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Conversaciones');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `conversaciones-ia-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (e) {
    console.error('[export xlsx]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Admin (F4) ───
router.get('/admin/stats', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.getGlobalStats()));

router.get('/admin/conversations', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.listConversations({
    profileId: req.query.profileId,
    status: req.query.status,
    from: req.query.from, to: req.query.to,
    limit: req.query.limit, offset: req.query.offset,
  })));

router.get('/admin/conversations/:id', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.getConversationDetail(req.params.id)));

// Admin vende un paquete manualmente (mientras no hay pasarela)
router.post('/admin/subscriptions/:subscriptionId/packs', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaPacks.sellPackAdmin(req.params.subscriptionId, req.body?.packCode, { paymentId: req.body?.paymentId })));

// Admin lista paquetes de una suscripción
router.get('/admin/subscriptions/:subscriptionId/packs', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaPacks.listPacks(req.params.subscriptionId)));

// ─── F10 — Documentos del bot (RAG) ─────────────────────────
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
});
const ingestion = require('../services/documentIngestion.service');

/** Helper: obtiene o crea el config del profesional (para tener configId). */
async function getConfigId(profileId) {
  const cfg = await prisma.iaAgentConfig.upsert({
    where: { profileId },
    create: { profileId },
    update: {},
    select: { id: true },
  });
  return cfg.id;
}

// Lista documentos del profesional
router.get('/me/agent-documents', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const configId = await getConfigId(req.profileId);
    const docs = await prisma.iaAgentDocument.findMany({
      where: { configId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, filename: true, mimeType: true, sizeBytes: true,
        status: true, errorMessage: true, chunkCount: true, totalChars: true,
        isActive: true, createdAt: true,
      },
    });
    res.json({ success: true, data: docs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Sube un documento nuevo (procesa async)
router.post('/me/agent-documents',
  authenticateDirectoryAccount, withProfile, upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: 'Archivo requerido' });
      const configId = await getConfigId(req.profileId);
      const doc = await prisma.iaAgentDocument.create({
        data: {
          configId,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          status: 'PENDING',
        },
      });
      // Fire-and-forget: procesa en background
      ingestion.processDocument({
        documentId: doc.id,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
        configId,
      }).catch((e) => console.error('[ingestion] doc', doc.id, 'falló:', e.message));
      res.status(202).json({ success: true, data: { id: doc.id, status: 'PENDING' } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });

// Toggle activo/inactivo (excluye del retrieval sin borrar)
router.patch('/me/agent-documents/:id', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const configId = await getConfigId(req.profileId);
    const existing = await prisma.iaAgentDocument.findFirst({
      where: { id: req.params.id, configId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'No encontrado' });
    const data = {};
    if (typeof req.body?.isActive === 'boolean') data.isActive = req.body.isActive;
    const updated = await prisma.iaAgentDocument.update({
      where: { id: existing.id }, data,
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Elimina documento + sus chunks
router.delete('/me/agent-documents/:id', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const configId = await getConfigId(req.profileId);
    const existing = await prisma.iaAgentDocument.findFirst({
      where: { id: req.params.id, configId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'No encontrado' });
    await ingestion.deleteDocument(existing.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
