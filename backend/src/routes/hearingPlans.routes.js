/**
 * Planes de audición — lo que se le vende al paciente.
 *
 * No confundir con /api/plans, que son las suscripciones de los profesionales
 * del directorio. Estos son los 6 planes de las fichas comerciales.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

/** Catálogo para el selector del diálogo de venta. */
router.get('/', authenticate, async (req, res) => {
  try {
    const planes = await prisma.hearingPlan.findMany({
      where: req.query.todos === 'true' ? {} : { activo: true },
      orderBy: { orden: 'asc' },
    });
    res.json({ success: true, data: planes });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/** Cuántos se han vendido de cada uno, para los KPI. */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [planes, porPlan] = await Promise.all([
      prisma.hearingPlan.findMany({ orderBy: { orden: 'asc' } }),
      prisma.sale.groupBy({
        by: ['hearingPlanId'],
        where: { hearingPlanId: { not: null } },
        _count: { _all: true },
        _sum: { valorTotal: true },
      }),
    ]);
    const porId = Object.fromEntries(porPlan.map((p) => [p.hearingPlanId, p]));
    const items = planes.map((p) => ({
      id: p.id, code: p.code, nombre: p.nombre, linea: p.linea,
      precioCOP: p.precioCOP, activo: p.activo,
      vendidos: porId[p.id]?._count?._all || 0,
      ingresos: porId[p.id]?._sum?.valorTotal || 0,
    }));
    // Ventas de audífono suelto: el contraste que interesa, porque la meta es
    // vender planes.
    const sueltos = await prisma.sale.count({
      where: { categoria: 'HEARING_AID', hearingPlanId: null },
    });
    const conPlan = items.reduce((a, i) => a + i.vendidos, 0);
    res.json({
      success: true,
      data: {
        items,
        totales: {
          conPlan,
          sueltos,
          ingresosPlanes: items.reduce((a, i) => a + i.ingresos, 0),
          // Qué tanto del total de audífonos sale con plan.
          porcentajeConPlan: (conPlan + sueltos) > 0
            ? Math.round((conPlan / (conPlan + sueltos)) * 100) : 0,
        },
      },
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

/** Editar un plan (cupos, precio, activo). Solo ADMIN. */
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const permitidos = [
      'nombre', 'precioCOP', 'activo', 'orden', 'controlesMeses', 'controlesAdaptacion',
      'audiometrias', 'mantenimientos', 'terapias', 'anosGarantia', 'nivelTecnologia',
      'plataforma', 'formatos', 'seguroPerdidaMeses', 'seguroRoturaMeses',
      'filtrosAnticerumen', 'bateriasIncluidas', 'cargadorReposicion', 'cambioReceptores',
      'satisfaccionDias', 'audifonoRestitucion', 'dctoReparaciones', 'dctoAccesorios',
      'dctoSiguientePlan', 'lineaExclusiva', 'videoconsulta', 'recargable',
    ];
    const data = {};
    for (const k of permitidos) if (req.body[k] !== undefined) data[k] = req.body[k];
    const plan = await prisma.hearingPlan.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: plan });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
