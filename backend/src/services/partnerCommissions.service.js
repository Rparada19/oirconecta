/**
 * Comisiones de aliados referidores.
 *
 * Regla del convenio (plug-e, 2026-09-02): 10% sobre el valor de factura de la
 * venta de audífonos. Accesorios, consultas y servicios NO comisionan — "los
 * números adicionales se cargan a las cuentas de OírConecta como cualquier
 * venta".
 *
 * La atribución no caduca: si el paciente tiene `partnerId`, cualquier venta
 * suya de audífonos comisiona, sin importar cuánto tiempo pasó desde el QR.
 *
 * El monto se congela al causar. Si mañana se renegocia el porcentaje, lo ya
 * causado no se mueve: se aplica de ahí en adelante.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Solo comisionan los audífonos. */
const CATEGORIA_COMISIONABLE = 'HEARING_AID';

/** Periodo de corte: el mes de la venta, YYYY-MM. */
function periodoDe(fecha) {
  const d = new Date(fecha);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function redondear(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Causa la comisión de una venta. Idempotente: si ya existe para esa venta,
 * la devuelve sin tocarla. Devuelve null cuando la venta no comisiona.
 *
 * Nunca lanza hacia arriba: una venta jamás debe fallar porque la comisión
 * de un aliado no se pudo calcular.
 */
async function causarPorVenta(saleId) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        categoria: true,
        valorTotal: true,
        fechaVenta: true,
        patientId: true,
        patient: { select: { id: true, partnerId: true } },
      },
    });
    if (!sale) return null;
    if (sale.categoria !== CATEGORIA_COMISIONABLE) return null;

    const partnerId = sale.patient?.partnerId;
    if (!partnerId) return null;

    const existente = await prisma.partnerCommission.findUnique({ where: { saleId } });
    if (existente) return existente;

    const partner = await prisma.referralPartner.findUnique({
      where: { id: partnerId },
      select: { id: true, comisionPct: true, activo: true },
    });
    if (!partner) return null;

    const base = Number(sale.valorTotal) || 0;
    const pct = Number(partner.comisionPct) || 0;

    return await prisma.partnerCommission.create({
      data: {
        partnerId,
        saleId: sale.id,
        patientId: sale.patientId,
        baseFacturada: redondear(base),
        pct,
        monto: redondear((base * pct) / 100),
        periodo: periodoDe(sale.fechaVenta),
        estado: 'CAUSADA',
      },
    });
  } catch (e) {
    console.error('[comisiones] causarPorVenta falló para', saleId, '—', e.message);
    return null;
  }
}

/**
 * Reajusta una comisión cuando cambia el valor facturado. Solo mientras esté
 * CAUSADA: una vez liquidada o pagada, el número quedó comprometido con el
 * aliado y se corrige por nota, no por edición silenciosa.
 */
async function recalcularPorVenta(saleId) {
  try {
    const com = await prisma.partnerCommission.findUnique({ where: { saleId } });
    if (!com) return causarPorVenta(saleId);
    if (com.estado !== 'CAUSADA') return com;

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { valorTotal: true, categoria: true },
    });
    if (!sale) return com;

    // La venta cambió de categoría y dejó de comisionar.
    if (sale.categoria !== CATEGORIA_COMISIONABLE) {
      return prisma.partnerCommission.update({
        where: { saleId },
        data: { estado: 'ANULADA', notas: 'La venta dejó de ser de audífonos.' },
      });
    }

    const base = Number(sale.valorTotal) || 0;
    if (redondear(base) === redondear(com.baseFacturada)) return com;

    return prisma.partnerCommission.update({
      where: { saleId },
      data: { baseFacturada: redondear(base), monto: redondear((base * com.pct) / 100) },
    });
  } catch (e) {
    console.error('[comisiones] recalcularPorVenta falló para', saleId, '—', e.message);
    return null;
  }
}

/**
 * Pasa las ventas viejas por el cálculo. Sirve para el arranque del convenio y
 * para cuando se marca a mano el aliado de un paciente que ya había comprado.
 */
async function backfill() {
  const ventas = await prisma.sale.findMany({
    where: {
      categoria: CATEGORIA_COMISIONABLE,
      partnerCommission: { is: null },
      patient: { partnerId: { not: null } },
    },
    select: { id: true },
  });
  let causadas = 0;
  for (const v of ventas) {
    if (await causarPorVenta(v.id)) causadas++;
  }
  return { revisadas: ventas.length, causadas };
}

/**
 * Mueve el estado de una comisión. Es la contraparte interna del portal del
 * aliado: sin esto, "por pagar" solo crece.
 * CAUSADA → LIQUIDADA (revisada y acordada) → PAGADA (girada).
 */
async function marcarEstado(id, estado, notas) {
  const VALIDOS = ['CAUSADA', 'LIQUIDADA', 'PAGADA', 'ANULADA'];
  if (!VALIDOS.includes(estado)) {
    const e = new Error(`Estado inválido. Usa: ${VALIDOS.join(', ')}`);
    e.statusCode = 400;
    throw e;
  }
  return prisma.partnerCommission.update({
    where: { id },
    data: {
      estado,
      ...(estado === 'LIQUIDADA' ? { liquidadaAt: new Date() } : {}),
      ...(estado === 'PAGADA' ? { pagadaAt: new Date() } : {}),
      ...(notas !== undefined ? { notas } : {}),
    },
  });
}

/** Corte de un periodo para el equipo interno (todas las columnas, con nombre
 *  completo del paciente: aquí sí, es el CRM). */
async function listarParaCrm({ partnerId, periodo, estado } = {}) {
  return prisma.partnerCommission.findMany({
    where: {
      ...(partnerId ? { partnerId } : {}),
      ...(periodo ? { periodo } : {}),
      ...(estado ? { estado } : {}),
    },
    orderBy: [{ periodo: 'desc' }, { createdAt: 'desc' }],
    include: {
      partner: { select: { id: true, nombre: true, code: true } },
      sale: {
        select: {
          id: true, fechaVenta: true, valorTotal: true, marca: true,
          patient: { select: { id: true, nombre: true, ciudad: true } },
        },
      },
    },
  });
}

module.exports = {
  CATEGORIA_COMISIONABLE,
  periodoDe,
  causarPorVenta,
  recalcularPorVenta,
  backfill,
  marcarEstado,
  listarParaCrm,
};
