/**
 * Newsletter: suscripción pública, baja, pixel de apertura y panel admin.
 *
 * Público:
 *   POST /api/newsletter/subscribe
 *   GET  /api/newsletter/unsubscribe?token=...
 *   GET  /api/newsletter/track/open/:campaignId/:subscriberId.gif   (pixel 1x1)
 *
 * Admin (JWT CRM + rol ADMIN):
 *   GET  /api/newsletter/admin/subscribers
 *   GET  /api/newsletter/admin/stats
 *   GET  /api/newsletter/admin/campaigns
 *   POST /api/newsletter/admin/campaigns               (crear borrador)
 *   POST /api/newsletter/admin/campaigns/:id/send      (enviar a activos)
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const emailService = require('../services/email.service');

const router = express.Router();
const prisma = new PrismaClient();

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://oirconecta.com';
const API_URL = process.env.PUBLIC_API_URL || 'https://oirconecta-api.onrender.com';

// GIF transparente 1x1 para el pixel de apertura.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

function unsubscribeUrl(token) {
  return `${API_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

// ── Público: suscribirse ──
router.post(
  '/subscribe',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 120 }),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('telefono').optional({ nullable: true }).isString().isLength({ max: 40 }),
    body('ciudad').optional({ nullable: true }).isString().isLength({ max: 120 }),
    body('source').optional().isString().isLength({ max: 60 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { nombre, email, telefono, ciudad, source } = req.body;

      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (existing) {
        // Reactiva si estaba dado de baja; no reenvía bienvenida.
        if (existing.status !== 'ACTIVE') {
          await prisma.newsletterSubscriber.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', unsubscribedAt: null, nombre, telefono, ciudad },
          });
        }
        return res.json({ success: true, data: { alreadySubscribed: true } });
      }

      const sub = await prisma.newsletterSubscriber.create({
        data: { nombre, email, telefono: telefono || null, ciudad: ciudad || null, source: source || 'web' },
      });

      // Bienvenida (no bloquea la respuesta)
      emailService
        .sendNewsletterWelcome({ email: sub.email, nombre: sub.nombre, unsubscribeUrl: unsubscribeUrl(sub.unsubscribeToken) })
        .then(() => prisma.newsletterSubscriber.update({ where: { id: sub.id }, data: { welcomeSentAt: new Date() } }))
        .catch((e) => console.error('[newsletter] bienvenida:', e?.message));

      res.status(201).json({ success: true, data: { id: sub.id } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Público: baja ──
router.get(
  '/unsubscribe',
  [query('token').isString().isLength({ min: 10, max: 80 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const sub = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: req.query.token } });
      if (sub && sub.status === 'ACTIVE') {
        await prisma.newsletterSubscriber.update({
          where: { id: sub.id },
          data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
        });
      }
      res
        .status(200)
        .send(
          `<!doctype html><html lang="es"><meta charset="utf-8"><body style="font-family:system-ui;max-width:480px;margin:60px auto;text-align:center;color:#0f1923;"><h2>Suscripción cancelada</h2><p style="color:#4a5568;">Ya no recibirás más correos del boletín de OírConecta. Puedes volver a suscribirte cuando quieras desde <a href="${SITE_URL}">oirconecta.com</a>.</p></body></html>`
        );
    } catch (e) {
      next(e);
    }
  }
);

// ── Público: pixel de apertura ──
router.get('/track/open/:campaignId/:subscriberId.gif', async (req, res) => {
  try {
    const { campaignId, subscriberId } = req.params;
    const send = await prisma.newsletterSend.findUnique({
      where: { campaignId_subscriberId: { campaignId, subscriberId } },
    });
    if (send) {
      const firstOpen = !send.openedAt;
      await prisma.$transaction([
        prisma.newsletterSend.update({
          where: { id: send.id },
          data: {
            openedAt: send.openedAt || new Date(),
            openCount: { increment: 1 },
            status: send.status === 'sent' ? 'opened' : send.status,
          },
        }),
        ...(firstOpen
          ? [prisma.newsletterCampaign.update({ where: { id: campaignId }, data: { openCount: { increment: 1 } } })]
          : []),
      ]);
    }
  } catch (e) {
    // El pixel nunca debe fallar visiblemente.
    console.error('[newsletter] pixel:', e?.message);
  }
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(PIXEL);
});

// ── Admin: lista de suscriptores ──
router.get(
  '/admin/subscribers',
  authenticate,
  authorize('ADMIN'),
  [
    query('status').optional().isIn(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED']),
    query('q').optional().isString().isLength({ max: 120 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const where = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.q) {
        where.OR = [
          { nombre: { contains: req.query.q, mode: 'insensitive' } },
          { email: { contains: req.query.q, mode: 'insensitive' } },
          { ciudad: { contains: req.query.q, mode: 'insensitive' } },
        ];
      }
      const [items, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
        prisma.newsletterSubscriber.count({ where }),
      ]);
      res.json({ success: true, data: { items, total, limit, offset } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: métricas resumidas ──
router.get('/admin/stats', authenticate, authorize('ADMIN'), async (_req, res, next) => {
  try {
    const [activos, bajas, total, porCiudad, ultimasCampanas] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.groupBy({
        by: ['ciudad'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
        orderBy: { _count: { ciudad: 'desc' } },
        take: 10,
      }),
      prisma.newsletterCampaign.findMany({
        where: { status: 'SENT' },
        orderBy: { sentAt: 'desc' },
        take: 10,
        select: { id: true, asunto: true, sentCount: true, openCount: true, clickCount: true, sentAt: true },
      }),
    ]);
    const campanasConTasa = ultimasCampanas.map((c) => ({
      ...c,
      openRate: c.sentCount ? Math.round((c.openCount / c.sentCount) * 100) : 0,
    }));
    res.json({
      success: true,
      data: { activos, bajas, total, porCiudad, ultimasCampanas: campanasConTasa },
    });
  } catch (e) {
    next(e);
  }
});

// ── Admin: listar campañas ──
router.get('/admin/campaigns', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const items = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

// ── Admin: crear borrador de campaña ──
router.post(
  '/admin/campaigns',
  authenticate,
  authorize('ADMIN'),
  [
    body('asunto').trim().notEmpty().isLength({ max: 200 }),
    body('htmlContent').isString().isLength({ min: 1 }),
    body('preheader').optional().isString().isLength({ max: 200 }),
    body('blogPostId').optional().isString(),
    body('scheduledFor').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { asunto, htmlContent, preheader, blogPostId, scheduledFor } = req.body;
      const campaign = await prisma.newsletterCampaign.create({
        data: {
          asunto,
          htmlContent,
          preheader,
          blogPostId,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
        },
      });
      res.status(201).json({ success: true, data: campaign });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: enviar campaña a todos los activos ──
router.post(
  '/admin/campaigns/:id/send',
  authenticate,
  authorize('ADMIN'),
  [param('id').isString()],
  validateRequest,
  async (req, res, next) => {
    try {
      const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
      if (!campaign) return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
      if (campaign.status === 'SENDING' || campaign.status === 'SENT') {
        return res.status(400).json({ success: false, error: 'La campaña ya fue enviada o está en envío' });
      }

      const subs = await prisma.newsletterSubscriber.findMany({ where: { status: 'ACTIVE' } });
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING', recipientCount: subs.length },
      });

      // Responde de inmediato; el envío continúa en segundo plano.
      res.json({ success: true, data: { recipients: subs.length, status: 'SENDING' } });

      let sent = 0;
      for (const sub of subs) {
        try {
          const send = await prisma.newsletterSend.upsert({
            where: { campaignId_subscriberId: { campaignId: campaign.id, subscriberId: sub.id } },
            update: {},
            create: { campaignId: campaign.id, subscriberId: sub.id, status: 'sent' },
          });
          const pixelUrl = `${API_URL}/api/newsletter/track/open/${campaign.id}/${sub.id}.gif`;
          await emailService.sendNewsletterEdition({
            email: sub.email,
            nombre: sub.nombre,
            subject: campaign.asunto,
            preheader: campaign.preheader,
            contentHtml: campaign.htmlContent,
            pixelUrl,
            unsubscribeUrl: unsubscribeUrl(sub.unsubscribeToken),
          });
          sent += 1;
          await prisma.newsletterSend.update({ where: { id: send.id }, data: { status: 'sent' } });
        } catch (e) {
          console.error('[newsletter] envío a', sub.email, e?.message);
        }
      }

      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentCount: sent, sentAt: new Date() },
      });
      console.log(`[newsletter] campaña ${campaign.id} enviada a ${sent}/${subs.length}`);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
