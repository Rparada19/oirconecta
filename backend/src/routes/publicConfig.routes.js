/**
 * Endpoints públicos de configuración del sitio (sin auth).
 * Mantener mínimo: solo lo que el front público necesita conocer.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const emailService = require('../services/email.service');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/public/retail-config
// Devuelve el professionalId del consultorio propio de OírConecta para que
// /agendar consulte y agende contra la agenda real de ese profesional.
router.get('/retail-config', (req, res) => {
  res.json({
    success: true,
    data: {
      professionalId: config.retail.professionalId,
    },
  });
});

// POST /api/public/contact
router.post('/contact',
  body('nombre').trim().notEmpty(),
  body('email').isEmail(),
  body('mensaje').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { nombre, email, telefono, asunto, mensaje } = req.body;

    // 1) Persistir SIEMPRE en BD antes de enviar email
    let message;
    try {
      message = await prisma.contactMessage.create({
        data: {
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono ? String(telefono).trim() : null,
          asunto: asunto ? String(asunto).trim() : null,
          mensaje: mensaje.trim(),
          metadata: {
            userAgent: req.get('user-agent') || null,
            ip: req.ip || req.headers['x-forwarded-for'] || null,
          },
        },
      });
    } catch (e) {
      console.error('[contact] db error:', e.message);
      return res.status(500).json({ success: false, error: 'No se pudo registrar el mensaje' });
    }

    // 2) Enviar email (no bloquea respuesta). Actualizar flag emailSent.
    emailService.sendContactFormNotification({ nombre, email, telefono, asunto, mensaje })
      .then(() => prisma.contactMessage.update({
        where: { id: message.id },
        data: { emailSent: true },
      }).catch(() => {}))
      .catch((e) => {
        console.error('[contact] email error:', e.message);
        prisma.contactMessage.update({
          where: { id: message.id },
          data: { emailError: e.message.slice(0, 500) },
        }).catch(() => {});
      });

    res.json({ success: true, data: { id: message.id } });
  }
);

// ── Admin: listar mensajes de contacto ──
router.get('/admin/contact-messages', authenticate, async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    const where = estado ? { estado } : {};
    const [items, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.contactMessage.count({ where }),
    ]);
    res.json({ success: true, data: items, total });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Admin: actualizar estado/notas de mensaje ──
router.patch('/admin/contact-messages/:id', authenticate, async (req, res) => {
  try {
    const { estado, notas } = req.body;
    const updated = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: {
        ...(estado && { estado }),
        ...(notas !== undefined && { notas }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
