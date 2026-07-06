/**
 * T5 — Rutas admin del buzón de templates de email.
 *
 *   GET    /api/email-templates                    → lista de todos
 *   GET    /api/email-templates/:code              → detalle + hardcoded default
 *   PATCH  /api/email-templates/:code              → editar subject/body/activo
 *   POST   /api/email-templates/:code/restore      → restaurar a hardcoded default
 *   POST   /api/email-templates/:code/preview      → render con payload de prueba
 *   POST   /api/email-templates/:code/send-test    → envía email de prueba al admin
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const templates = require('../services/emailTemplates.service');

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const list = await templates.listAll();
    res.json({ success: true, data: list });
  } catch (e) { next(e); }
});

router.get('/:code', async (req, res, next) => {
  try {
    const tpl = await templates.getByCode(req.params.code);
    res.json({ success: true, data: tpl });
  } catch (e) { next(e); }
});

router.patch('/:code', async (req, res, next) => {
  try {
    const updated = await templates.updateByCode(req.params.code, req.body || {});
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

router.post('/:code/restore', async (req, res, next) => {
  try {
    const restored = await templates.restoreDefault(req.params.code);
    res.json({ success: true, data: restored });
  } catch (e) { next(e); }
});

router.post('/:code/preview', async (req, res, next) => {
  try {
    const { subject, body } = await templates.renderEmail(req.params.code, req.body?.payload || {});
    res.json({ success: true, data: { subject, body } });
  } catch (e) { next(e); }
});

// T6 — Asistente de diseño con IA
router.post('/:code/ai-edit', async (req, res, next) => {
  try {
    const assistant = require('../services/emailTemplateAssistant.service');
    const tpl = await templates.getByCode(req.params.code);
    const currentSubject = req.body?.subject ?? tpl?.subject ?? '';
    const currentBody = req.body?.body ?? tpl?.body ?? '';
    const variables = tpl?.variables || [];
    const instruction = req.body?.instruction || '';

    const result = await assistant.editTemplate({
      code: req.params.code,
      currentSubject, currentBody, variables, instruction,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.post('/:code/send-test', async (req, res, next) => {
  try {
    const to = req.body?.to || req.user?.email;
    if (!to) return res.status(400).json({ success: false, error: 'Falta email destino' });
    const email = require('../services/email.service');
    // Envía el correspondiente template real con payload dummy
    const payload = req.body?.payload || { nombre: 'Prueba', interes: 'Consulta general' };
    // Usamos el helper genérico que respeta template DB
    const { subject, body } = await templates.renderEmail(req.params.code, payload);
    if (!subject || !body) return res.status(400).json({ success: false, error: 'Template no tiene contenido' });
    // Envío directo usando el mismo pipeline que el resto
    // Requiere que email.service exporte deliver o baseTemplate — usamos un wrapper
    const { sendTemplatePreview } = email;
    if (sendTemplatePreview) {
      await sendTemplatePreview({ to, subject, body });
    } else {
      // Fallback: usa cualquier función que exista con firma similar
      return res.status(501).json({ success: false, error: 'Envío de prueba no configurado aún' });
    }
    res.json({ success: true, data: { sent: true, to } });
  } catch (e) { next(e); }
});

module.exports = router;
