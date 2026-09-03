/**
 * Modelo de lectura de la sección del aliado (/portal-crm/aliado/:code).
 *
 * FRONTERA DE DATOS — no negociable:
 * el aliado ve el ESTADO COMERCIAL de sus referidos, nunca el dato clínico.
 * Nada de diagnósticos, audiometrías, historia clínica ni notas de consulta.
 * Tampoco teléfono ni correo: el aliado no necesita poder contactarlos para
 * cobrar su comisión. "Cotizado" y "Vendido" ya dicen todo lo que su negocio
 * necesita saber. Ver Ley 1581 de 2012: el dato de salud es sensible y plug-e
 * es un tercero comercial.
 *
 * Toda consulta de aquí arranca filtrada por partnerId. Ninguna función recibe
 * el partnerId desde el cliente: sale del token.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ESTADOS = {
  REFERIDO: 'Referido',
  AGENDADO: 'Cita agendada',
  VALORADO: 'Valoración hecha',
  COTIZADO: 'Cotizado',
  VENDIDO: 'Vendido',
};

/** Primer nombre + inicial del apellido. Suficiente para que el aliado
 *  reconozca a quien remitió, sin publicar el nombre completo en una tabla. */
function nombreCorto(completo) {
  const partes = String(completo || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'Sin nombre';
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1][0].toUpperCase()}.`;
}

function estadoDePaciente(p) {
  if (p.sales.length > 0) return 'VENDIDO';
  if (p.quotes.length > 0) return 'COTIZADO';
  const ahora = new Date();
  if (p.appointments.some((a) => a.estado === 'COMPLETED')) return 'VALORADO';
  if (p.appointments.some((a) => a.fecha >= ahora && ['CONFIRMED', 'RESCHEDULED'].includes(a.estado))) return 'AGENDADO';
  return 'REFERIDO';
}

/** Tabla de referidos del aliado, más reciente primero. */
async function listarReferidos(partnerId) {
  const pacientes = await prisma.patient.findMany({
    where: { partnerId, archivedAt: null },
    select: {
      id: true,
      nombre: true,
      ciudad: true,
      createdAt: true,
      appointments: { select: { estado: true, fecha: true } },
      quotes: { select: { id: true, createdAt: true, valorTotal: true }, orderBy: { createdAt: 'desc' } },
      sales: {
        where: { categoria: 'HEARING_AID' },
        select: {
          id: true, fechaVenta: true, valorTotal: true,
          partnerCommission: { select: { monto: true, pct: true, estado: true, periodo: true } },
        },
        orderBy: { fechaVenta: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const filas = pacientes.map((p) => {
    const estado = estadoDePaciente(p);
    const venta = p.sales[0] || null;
    const cotizacion = p.quotes[0] || null;
    return {
      id: p.id,
      nombre: nombreCorto(p.nombre),
      ciudad: p.ciudad || '—',
      fechaReferido: p.createdAt,
      estado,
      estadoLabel: ESTADOS[estado],
      cotizado: cotizacion ? cotizacion.valorTotal : null,
      vendido: venta ? venta.valorTotal : null,
      fechaVenta: venta ? venta.fechaVenta : null,
      comision: venta?.partnerCommission
        ? {
            monto: venta.partnerCommission.monto,
            pct: venta.partnerCommission.pct,
            estado: venta.partnerCommission.estado,
            periodo: venta.partnerCommission.periodo,
          }
        : null,
    };
  });

  // Leads que todavía no son pacientes: referidos de otras ciudades esperando
  // la llamada del equipo. Para el aliado cuentan igual.
  const leads = await prisma.lead.findMany({
    where: { partnerId, archivedAt: null, patient: null },
    select: { id: true, nombre: true, ciudad: true, createdAt: true, estado: true },
    orderBy: { createdAt: 'desc' },
  });

  for (const l of leads) {
    filas.push({
      id: l.id,
      nombre: nombreCorto(l.nombre),
      ciudad: l.ciudad || '—',
      fechaReferido: l.createdAt,
      estado: l.estado === 'AGENDADO' ? 'AGENDADO' : 'REFERIDO',
      estadoLabel: l.estado === 'AGENDADO' ? ESTADOS.AGENDADO : ESTADOS.REFERIDO,
      cotizado: null,
      vendido: null,
      fechaVenta: null,
      comision: null,
    });
  }

  filas.sort((a, b) => new Date(b.fechaReferido) - new Date(a.fechaReferido));
  return filas;
}

/** Totales de la cabecera y corte de comisiones por mes. */
async function resumen(partnerId) {
  const filas = await listarReferidos(partnerId);

  const porEstado = filas.reduce((acc, f) => {
    acc[f.estado] = (acc[f.estado] || 0) + 1;
    return acc;
  }, {});

  const comisiones = await prisma.partnerCommission.findMany({
    where: { partnerId, estado: { not: 'ANULADA' } },
    select: { monto: true, baseFacturada: true, estado: true, periodo: true },
  });

  const periodos = {};
  for (const c of comisiones) {
    const p = (periodos[c.periodo] ||= { periodo: c.periodo, ventas: 0, facturado: 0, comision: 0, pagado: 0 });
    p.ventas += 1;
    p.facturado += c.baseFacturada;
    p.comision += c.monto;
    if (c.estado === 'PAGADA') p.pagado += c.monto;
  }

  const totalComision = comisiones.reduce((s, c) => s + c.monto, 0);
  const totalPagado = comisiones.filter((c) => c.estado === 'PAGADA').reduce((s, c) => s + c.monto, 0);

  return {
    referidos: filas.length,
    porEstado,
    ventas: comisiones.length,
    facturado: comisiones.reduce((s, c) => s + c.baseFacturada, 0),
    comisionTotal: totalComision,
    comisionPagada: totalPagado,
    comisionPendiente: totalComision - totalPagado,
    periodos: Object.values(periodos).sort((a, b) => b.periodo.localeCompare(a.periodo)),
  };
}

module.exports = { ESTADOS, nombreCorto, listarReferidos, resumen };
