/**
 * Bitácora de mensajes automáticos (Notification + Reminder pendientes).
 * Sirve para verificar que los flujos se están cumpliendo de verdad.
 */

const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.use(authenticate);

// GET /api/notifications-log — enviados + programados
router.get(
  '/',
  [
    query('dias').optional().isInt({ min: 1, max: 90 }),
    query('eventCode').optional(),
    query('status').optional(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const dias = parseInt(req.query.dias) || 14;
      const desde = new Date(Date.now() - dias * 24 * 3600 * 1000);

      const whereEnviados = { sentAt: { gte: desde } };
      if (req.query.eventCode) whereEnviados.eventCode = req.query.eventCode;
      if (req.query.status) whereEnviados.status = req.query.status;

      const [enviados, programados] = await Promise.all([
        prisma.notification.findMany({
          where: whereEnviados,
          orderBy: { sentAt: 'desc' },
          take: 300,
          select: {
            id: true, eventCode: true, channel: true, templateCode: true,
            status: true, toAddress: true, sentAt: true, deliveredAt: true,
            readAt: true, errorMessage: true,
            patient: { select: { id: true, nombre: true } },
          },
        }),
        // Lo que está en cola: si algo no llegó, aquí se ve si quedó agendado.
        prisma.reminder.findMany({
          where: { status: { in: ['PENDING', 'QUEUED'] } },
          orderBy: { scheduledFor: 'asc' },
          take: 100,
          select: {
            id: true, eventCode: true, channel: true, templateCode: true,
            scheduledFor: true, status: true, attempts: true, lastError: true,
            patient: { select: { id: true, nombre: true } },
          },
        }),
      ]);

      // Resumen por evento para ver de un vistazo si un flujo dejó de correr.
      const porEvento = {};
      enviados.forEach((n) => {
        const e = (porEvento[n.eventCode] = porEvento[n.eventCode]
          || { eventCode: n.eventCode, total: 0, entregados: 0, leidos: 0, fallidos: 0, ultimo: null });
        e.total += 1;
        if (n.status === 'DELIVERED') e.entregados += 1;
        if (n.status === 'READ') { e.entregados += 1; e.leidos += 1; }
        if (n.status === 'FAILED') e.fallidos += 1;
        if (!e.ultimo || n.sentAt > e.ultimo) e.ultimo = n.sentAt;
      });

      res.json({
        success: true,
        data: {
          dias,
          enviados,
          programados,
          porEvento: Object.values(porEvento).sort((a, b) => b.total - a.total),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
