/**
 * Cara interna de los aliados — /api/aliados-admin/*
 *
 * Esto SÍ es del CRM: auth de `User`, solo ADMIN. Es donde el equipo revisa el
 * corte del mes y marca las comisiones como liquidadas o pagadas. El portal del
 * aliado (/api/aliado/*) solo lee; mover plata se hace desde acá.
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const comisiones = require('../services/partnerCommissions.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res) => {
  try {
    const aliados = await prisma.referralPartner.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true, nombre: true, code: true, comisionPct: true, activo: true,
        // El de invitación se muestra aquí y solo aquí: es lo que el equipo
        // le pasa al aliado para que su gente se cree cuenta.
        registroCode: true,
        _count: { select: { patients: true, leads: true, commissions: true } },
      },
    });
    res.json({ success: true, data: aliados });
  } catch (e) {
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
