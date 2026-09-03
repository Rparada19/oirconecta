/**
 * Cara interna de los aliados — /api/aliados-admin/*
 *
 * Esto SÍ es del CRM: auth de `User`, solo ADMIN. Es donde el equipo revisa el
 * corte del mes y marca las comisiones como liquidadas o pagadas. El portal del
 * aliado (/api/aliado/*) solo lee; mover plata se hace desde acá.
 */

const express = require('express');
const crypto = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');
const comisiones = require('../services/partnerCommissions.service');
const portal = require('../services/partnerPortal.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

/** Código para el QR de las tarjetas: corto y legible, va impreso. */
function codigoDesdeNombre(nombre) {
  const base = String(nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base.slice(0, 20) || `ALIADO-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

/** Código de invitación: secreto, no se imprime. */
function nuevoCodigoRegistro(code) {
  return `${code.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const WA_NUMBER = (process.env.CENTRO_WHATSAPP || '573171503944').replace(/\D/g, '');

/** El enlace exacto que debe llevar el QR de las tarjetas del aliado. */
function enlaceQr(nombre) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Vengo de ${nombre}`)}`;
}

router.get('/', async (req, res) => {
  try {
    const aliados = await prisma.referralPartner.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true, nombre: true, code: true, comisionPct: true, activo: true,
        // El de invitación se muestra aquí y solo aquí: es lo que el equipo
        // le pasa al aliado para que su gente se cree cuenta.
        registroCode: true,
        contactoNombre: true, contactoEmail: true, notas: true, createdAt: true,
        _count: { select: { patients: true, leads: true, commissions: true, accounts: true } },
      },
    });
    res.json({
      success: true,
      data: aliados.map((a) => ({ ...a, enlaceQr: enlaceQr(a.nombre) })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** Alta de un aliado. Los dos códigos se generan solos. */
router.post('/', async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });

    const pct = req.body?.comisionPct === undefined ? 10 : Number(req.body.comisionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ success: false, error: 'El porcentaje debe ir entre 0 y 100' });
    }

    const code = String(req.body?.code || '').trim().toUpperCase() || codigoDesdeNombre(nombre);
    const repetido = await prisma.referralPartner.findUnique({ where: { code } });
    if (repetido) {
      return res.status(409).json({ success: false, error: `Ya existe un aliado con el código ${code}` });
    }

    const aliado = await prisma.referralPartner.create({
      data: {
        nombre,
        code,
        comisionPct: pct,
        registroCode: nuevoCodigoRegistro(code),
        contactoNombre: req.body?.contactoNombre || null,
        contactoEmail: req.body?.contactoEmail || null,
        notas: req.body?.notas || null,
      },
    });

    res.status(201).json({ success: true, data: { ...aliado, enlaceQr: enlaceQr(aliado.nombre) } });
  } catch (e) {
    console.error('[aliados-admin] crear falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/** Edición: nombre, %, activo. Y rotación del código de invitación. */
router.patch('/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body?.nombre !== undefined) data.nombre = String(req.body.nombre).trim();
    if (req.body?.activo !== undefined) data.activo = !!req.body.activo;
    if (req.body?.contactoNombre !== undefined) data.contactoNombre = req.body.contactoNombre || null;
    if (req.body?.contactoEmail !== undefined) data.contactoEmail = req.body.contactoEmail || null;
    if (req.body?.notas !== undefined) data.notas = req.body.notas || null;
    if (req.body?.comisionPct !== undefined) {
      const pct = Number(req.body.comisionPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, error: 'El porcentaje debe ir entre 0 y 100' });
      }
      // Solo afecta ventas futuras: lo ya causado quedó congelado al causarse.
      data.comisionPct = pct;
    }

    // Rotar el código de invitación deja fuera a quien ya no está en el equipo
    // del aliado. No toca el `code` del QR: ese ya está impreso en tarjetas.
    if (req.body?.rotarCodigoRegistro) {
      const actual = await prisma.referralPartner.findUnique({
        where: { id: req.params.id }, select: { code: true },
      });
      if (!actual) return res.status(404).json({ success: false, error: 'Aliado no encontrado' });
      data.registroCode = nuevoCodigoRegistro(actual.code);
    }

    const aliado = await prisma.referralPartner.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: { ...aliado, enlaceQr: enlaceQr(aliado.nombre) } });
  } catch (e) {
    console.error('[aliados-admin] editar falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Los referidos de un aliado, vista interna: con nombre completo, contacto y
 * lo clínico. Es la misma gente que ve el aliado, pero aquí estamos adentro.
 */
router.get('/:id/referidos', async (req, res) => {
  try {
    const data = await portal.listarReferidosParaCrm(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[aliados-admin] referidos falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/comisiones', async (req, res) => {
  try {
    const data = await comisiones.listarParaCrm({
      partnerId: req.query.partnerId || undefined,
      periodo: req.query.periodo || undefined,
      estado: req.query.estado || undefined,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.patch('/comisiones/:id', async (req, res) => {
  try {
    const row = await comisiones.marcarEstado(req.params.id, req.body?.estado, req.body?.notas);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, error: e.message });
  }
});

/** Pasa las ventas viejas por el cálculo. Idempotente: se puede correr cuantas
 *  veces haga falta, por ejemplo tras marcar a mano el aliado de un paciente. */
router.post('/comisiones/backfill', async (req, res) => {
  try {
    res.json({ success: true, data: await comisiones.backfill() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
