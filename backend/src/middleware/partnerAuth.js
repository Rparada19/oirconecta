/**
 * Autenticación de los aliados referidores (`ReferralPartnerAccount`).
 *
 * Deliberadamente separada de `authenticate` (CRM) y de
 * `authenticateDirectoryAccount` (directorio): tres secretos distintos, tres
 * claims `typ` distintos. Un token de aliado no abre el CRM aunque su pantalla
 * viva bajo /portal-crm/aliado/:code.
 *
 * Deja `req.partner = { accountId, partnerId, code, nombre }`. TODA consulta
 * de las rutas /api/aliado debe filtrar por `req.partner.partnerId`; no hay
 * ningún endpoint que reciba el partnerId por parámetro.
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

async function authenticatePartner(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token de aliado requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], config.partnerJwt.secret);
    } catch (error) {
      const expirado = error.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        error: expirado ? 'Sesión expirada' : 'Token inválido',
      });
    }

    if (decoded.typ !== 'partner' || !decoded.accountId) {
      return res.status(401).json({ success: false, error: 'Token no válido para aliados' });
    }

    const account = await prisma.referralPartnerAccount.findUnique({
      where: { id: decoded.accountId },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        partner: { select: { id: true, code: true, nombre: true, activo: true } },
      },
    });

    if (!account || !account.activo || !account.partner?.activo) {
      return res.status(401).json({ success: false, error: 'Cuenta no encontrada o inactiva' });
    }

    req.partner = {
      accountId: account.id,
      email: account.email,
      nombre: account.nombre,
      partnerId: account.partner.id,
      code: account.partner.code,
      partnerNombre: account.partner.nombre,
    };
    next();
  } catch (error) {
    console.error('[aliado-auth] error:', error.message);
    return res.status(500).json({ success: false, error: 'Error interno de autenticación' });
  }
}

/**
 * La URL trae el code del aliado (/portal-crm/aliado/pluge). Verifica que sea
 * el de la sesión: un aliado no puede mirar la sección de otro cambiando la URL.
 *
 * Compara normalizado porque el code lleva guion ("PLUG-E") y la URL no
 * ("pluge"): la misma normalización que usa el bot para leer el QR.
 */
function matchPartnerCode(req, res, next) {
  const { normalizar } = require('../services/referralPartners.service');
  const enRuta = normalizar(req.params.code || req.query.code || '');
  if (enRuta && enRuta !== normalizar(req.partner.code)) {
    return res.status(403).json({ success: false, error: 'Esta sección no es de tu organización' });
  }
  next();
}

module.exports = { authenticatePartner, matchPartnerCode };
