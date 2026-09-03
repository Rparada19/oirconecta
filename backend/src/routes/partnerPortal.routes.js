/**
 * API de la sección del aliado referidor — /api/aliado/*
 *
 * Superficie mínima a propósito: login, quién soy, mis referidos, mi resumen.
 * Todo lo demás del CRM queda fuera. Ninguna ruta acepta un partnerId del
 * cliente: sale siempre del token (ver middleware/partnerAuth).
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const { authenticatePartner, matchPartnerCode } = require('../middleware/partnerAuth');
const portal = require('../services/partnerPortal.service');

const prisma = new PrismaClient();
const router = express.Router();

// El login es la única puerta: 10 intentos cada 15 min por IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Espera 15 minutos.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos' });
    }

    const account = await prisma.referralPartnerAccount.findUnique({
      where: { email },
      include: { partner: { select: { id: true, code: true, nombre: true, activo: true } } },
    });

    // Mismo mensaje para cuenta inexistente y clave errada: no confirmamos
    // quién tiene cuenta.
    const ok = account && account.activo && account.partner?.activo
      && await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { typ: 'partner', accountId: account.id, partnerId: account.partner.id },
      config.partnerJwt.secret,
      { expiresIn: config.partnerJwt.expiresIn },
    );

    await prisma.referralPartnerAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        token,
        aliado: {
          code: account.partner.code,
          nombre: account.partner.nombre,
          usuario: account.nombre || account.email,
        },
      },
    });
  } catch (e) {
    console.error('[aliado] login falló:', e.message);
    res.status(500).json({ success: false, error: 'No se pudo iniciar sesión' });
  }
});

router.get('/me', authenticatePartner, (req, res) => {
  res.json({
    success: true,
    data: {
      code: req.partner.code,
      nombre: req.partner.partnerNombre,
      usuario: req.partner.nombre || req.partner.email,
    },
  });
});

router.get('/:code/referidos', authenticatePartner, matchPartnerCode, async (req, res) => {
  try {
    const filas = await portal.listarReferidos(req.partner.partnerId);
    res.json({ success: true, data: filas });
  } catch (e) {
    console.error('[aliado] referidos falló:', e.message);
    res.status(500).json({ success: false, error: 'No se pudieron cargar los referidos' });
  }
});

router.get('/:code/resumen', authenticatePartner, matchPartnerCode, async (req, res) => {
  try {
    const data = await portal.resumen(req.partner.partnerId);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[aliado] resumen falló:', e.message);
    res.status(500).json({ success: false, error: 'No se pudo cargar el resumen' });
  }
});

module.exports = router;
