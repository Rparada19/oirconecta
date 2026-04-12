/**
 * Autenticación JWT para cuentas del directorio público (`DirectoryAccount`).
 * No usa el middleware `authenticate` del CRM.
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

const authenticateDirectoryAccount = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token de directorio requerido' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.directoryJwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expirado' });
      }
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    if (decoded.typ !== 'directory' || !decoded.directoryAccountId) {
      return res.status(401).json({ success: false, error: 'Token no válido para el directorio' });
    }

    const account = await prisma.directoryAccount.findUnique({
      where: { id: decoded.directoryAccountId },
      select: { id: true, email: true, nombre: true, activo: true },
    });

    if (!account || !account.activo) {
      return res.status(401).json({ success: false, error: 'Cuenta no encontrada o inactiva' });
    }

    req.directoryAccount = account;
    next();
  } catch (error) {
    console.error('Error en autenticación de directorio:', error);
    return res.status(500).json({ success: false, error: 'Error interno de autenticación' });
  }
};

module.exports = {
  authenticateDirectoryAccount,
};
