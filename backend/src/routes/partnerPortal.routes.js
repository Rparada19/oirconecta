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
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const { authenticatePartner, matchPartnerCode } = require('../middleware/partnerAuth');
const portal = require('../services/partnerPortal.service');
const { normalizar } = require('../services/referralPartners.service');

const prisma = new PrismaClient();
const router = express.Router();

const CLAVE_MINIMA = 10;
const RESET_MINUTOS = 30;

// Puertas sin sesión: 10 intentos cada 15 min por IP. Aplica a login, registro
// y recuperación por igual — las tres se pueden usar para tantear correos.
const puertaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Espera 15 minutos.' },
});
const loginLimiter = puertaLimiter;

/** Hash del token de recuperación. Guardamos esto, nunca el token en claro. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** URL de la sección del aliado, para armar el enlace del correo. */
function urlDelAliado(code, query = '') {
  return `https://oirconecta.com/portal-crm/aliado/${normalizar(code)}${query}`;
}

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

/**
 * Alta de una cuenta del equipo del aliado.
 *
 * Exige el código de invitación del aliado. Sin esa condición, esta ruta sería
 * una puerta abierta a los datos de referidos para cualquiera que diera con la
 * URL. El código lo entrega OírConecta al aliado una vez, y el aliado lo
 * reparte internamente.
 */
router.post('/registro', puertaLimiter, async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const codigo = String(req.body?.codigoInvitacion || '').trim();

    if (!nombre || !email || !password || !codigo) {
      return res.status(400).json({ success: false, error: 'Faltan datos' });
    }
    if (password.length < CLAVE_MINIMA) {
      return res.status(400).json({ success: false, error: `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres` });
    }

    // El código se compara normalizado, igual que el del QR.
    const activos = await prisma.referralPartner.findMany({
      where: { activo: true, registroCode: { not: null } },
      select: { id: true, code: true, nombre: true, registroCode: true },
    });
    const partner = activos.find((p) => normalizar(p.registroCode) === normalizar(codigo));
    if (!partner) {
      return res.status(403).json({ success: false, error: 'El código de invitación no es válido' });
    }

    const yaExiste = await prisma.referralPartnerAccount.findUnique({ where: { email } });
    if (yaExiste) {
      return res.status(409).json({ success: false, error: 'Ya hay una cuenta con ese correo. Usa "Olvidé mi contraseña".' });
    }

    const account = await prisma.referralPartnerAccount.create({
      data: { email, nombre, passwordHash: await bcrypt.hash(password, 10), partnerId: partner.id },
    });

    const token = jwt.sign(
      { typ: 'partner', accountId: account.id, partnerId: partner.id },
      config.partnerJwt.secret,
      { expiresIn: config.partnerJwt.expiresIn },
    );

    res.status(201).json({
      success: true,
      data: { token, aliado: { code: partner.code, nombre: partner.nombre, usuario: nombre } },
    });
  } catch (e) {
    console.error('[aliado] registro falló:', e.message);
    res.status(500).json({ success: false, error: 'No se pudo crear la cuenta' });
  }
});

/**
 * Pide el enlace de recuperación. Responde igual exista o no la cuenta: si
 * dijéramos "ese correo no existe" tendríamos un detector de correos válidos.
 */
router.post('/recuperar', puertaLimiter, async (req, res) => {
  const respuesta = {
    success: true,
    data: { mensaje: 'Si ese correo tiene una cuenta, le llegará un enlace en unos minutos.' },
  };
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, error: 'Correo requerido' });

    const account = await prisma.referralPartnerAccount.findUnique({
      where: { email },
      include: { partner: { select: { code: true, activo: true } } },
    });
    if (!account || !account.activo || !account.partner?.activo) return res.json(respuesta);

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.referralPartnerAccount.update({
      where: { id: account.id },
      data: {
        resetTokenHash: hashToken(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_MINUTOS * 60 * 1000),
      },
    });

    await require('../services/email.service').sendPasswordReset({
      email: account.email,
      nombre: account.nombre || '',
      resetUrl: urlDelAliado(account.partner.code, `?reset=${token}`),
      expiresInMinutes: RESET_MINUTOS,
    });

    res.json(respuesta);
  } catch (e) {
    console.error('[aliado] recuperar falló:', e.message);
    // Tampoco aquí revelamos nada: el que pide no debe saber si falló el envío
    // porque el correo no existe o porque se cayó el proveedor.
    res.json(respuesta);
  }
});

/** Fija la clave nueva con el token del correo. */
router.post('/restablecer', puertaLimiter, async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Faltan datos' });
    }
    if (password.length < CLAVE_MINIMA) {
      return res.status(400).json({ success: false, error: `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres` });
    }

    const account = await prisma.referralPartnerAccount.findFirst({
      where: { resetTokenHash: hashToken(token), resetTokenExpiresAt: { gt: new Date() } },
    });
    if (!account) {
      return res.status(400).json({ success: false, error: 'El enlace venció o ya se usó. Pide uno nuevo.' });
    }

    await prisma.referralPartnerAccount.update({
      where: { id: account.id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({ success: true, data: { mensaje: 'Contraseña actualizada. Ya puedes entrar.' } });
  } catch (e) {
    console.error('[aliado] restablecer falló:', e.message);
    res.status(500).json({ success: false, error: 'No se pudo cambiar la contraseña' });
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
