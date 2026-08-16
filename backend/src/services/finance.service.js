/**
 * Finanzas — salud del negocio consolidado (centro auditivo + portal profesional).
 *
 * Gastos e inversiones se capturan a mano; los ingresos los trae el sistema:
 *   - Centro auditivo → Sale.valorTotal por fechaVenta
 *   - Portal profesional → Payment.montoCOP (sin IVA) aprobados, por paidAt
 *
 * Todos los montos en COP.
 */

const prisma = require('../db');

/** 'YYYY-MM' del mes de una fecha */
const toPeriodo = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Rango [inicio, fin] de un periodo 'YYYY-MM' */
const rangoPeriodo = (periodo) => {
  const [y, m] = periodo.split('-').map(Number);
  return { inicio: new Date(y, m - 1, 1, 0, 0, 0, 0), fin: new Date(y, m, 0, 23, 59, 59, 999) };
};

/** Los 12 meses del año calendario (enero → diciembre). */
const periodosDelAno = (year) =>
  Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

// ─────────────────────────── Gastos ───────────────────────────

const listExpenses = async ({ tipo, periodo } = {}) => {
  const where = {};
  if (tipo) where.tipo = tipo;
  if (periodo) where.periodo = periodo;
  return prisma.financeExpense.findMany({
    where,
    orderBy: [{ tipo: 'asc' }, { categoria: 'asc' }, { concepto: 'asc' }],
  });
};

const createExpense = async (data, createdById) => {
  const tipo = data.tipo === 'FIJO' ? 'FIJO' : 'VARIABLE';
  return prisma.financeExpense.create({
    data: {
      tipo,
      concepto: String(data.concepto || '').trim(),
      categoria: data.categoria || 'otros',
      linea: ['CENTRO', 'PORTAL', 'COMPARTIDO'].includes(data.linea) ? data.linea : 'COMPARTIDO',
      montoCOP: Number(data.montoCOP) || 0,
      // Tanto fijos como variables se registran mes a mes: los fijos cambian
      // de valor (nómina, arriendo con IPC) y hay que poder ajustarlos.
      periodo: data.periodo || toPeriodo(new Date()),
      vigenteDesde: null,
      vigenteHasta: null,
      notas: data.notas || null,
      createdById: createdById || null,
    },
  });
};

const updateExpense = async (id, data) => {
  const body = {};
  for (const k of ['concepto', 'categoria', 'periodo', 'notas']) {
    if (data[k] !== undefined) body[k] = data[k];
  }
  if (data.tipo !== undefined) body.tipo = data.tipo === 'FIJO' ? 'FIJO' : 'VARIABLE';
  if (data.linea !== undefined && ['CENTRO', 'PORTAL', 'COMPARTIDO'].includes(data.linea)) {
    body.linea = data.linea;
  }
  if (data.montoCOP !== undefined) body.montoCOP = Number(data.montoCOP) || 0;
  return prisma.financeExpense.update({ where: { id }, data: body });
};

const deleteExpense = async (id) => prisma.financeExpense.delete({ where: { id } });

/**
 * Un gasto aplica a un periodo si fue registrado para ese mes. Los fijos
 * antiguos (sin periodo) caen a su ventana de vigencia por compatibilidad.
 */
const fijoAplica = (gasto, periodo) => {
  if (gasto.periodo) return gasto.periodo === periodo;
  const desde = gasto.vigenteDesde || '0000-00';
  const hasta = gasto.vigenteHasta || '9999-99';
  return periodo >= desde && periodo <= hasta;
};

/**
 * Copia todos los gastos de un mes al siguiente para no retipearlos.
 * No duplica los conceptos que ya existan en el mes destino.
 */
const copyExpensesFromPreviousMonth = async (periodo, createdById) => {
  const [y, m] = periodo.split('-').map(Number);
  const anterior = toPeriodo(new Date(y, m - 2, 1));
  const [origen, destino] = await Promise.all([
    prisma.financeExpense.findMany({ where: { periodo: anterior } }),
    prisma.financeExpense.findMany({ where: { periodo }, select: { concepto: true, tipo: true } }),
  ]);
  const yaExiste = new Set(destino.map((d) => `${d.tipo}|${d.concepto.toLowerCase()}`));
  const nuevos = origen.filter((g) => !yaExiste.has(`${g.tipo}|${g.concepto.toLowerCase()}`));
  if (nuevos.length === 0) return { copiados: 0, desde: anterior };
  await prisma.financeExpense.createMany({
    data: nuevos.map((g) => ({
      tipo: g.tipo, concepto: g.concepto, categoria: g.categoria, linea: g.linea,
      montoCOP: g.montoCOP, periodo, notas: g.notas, createdById: createdById || null,
    })),
  });
  return { copiados: nuevos.length, desde: anterior };
};

/**
 * Replica los gastos de un mes a otros meses (útil para cargar el histórico).
 * `excluirConceptos` permite omitir lo que no existía todavía.
 * No duplica conceptos que ya estén en el mes destino.
 */
const replicateExpenses = async ({ origen, destinos = [], excluirConceptos = [] }, createdById) => {
  const base = await prisma.financeExpense.findMany({ where: { periodo: origen } });
  if (base.length === 0) return { creados: 0, meses: 0 };
  const excluir = new Set(excluirConceptos.map((c) => String(c).toLowerCase().trim()));
  const plantilla = base.filter((g) => !excluir.has(g.concepto.toLowerCase().trim()));

  const existentes = await prisma.financeExpense.findMany({
    where: { periodo: { in: destinos } },
    select: { periodo: true, tipo: true, concepto: true },
  });
  const yaHay = new Set(existentes.map((e) => `${e.periodo}|${e.tipo}|${e.concepto.toLowerCase()}`));

  const filas = [];
  for (const periodo of destinos) {
    for (const g of plantilla) {
      if (yaHay.has(`${periodo}|${g.tipo}|${g.concepto.toLowerCase()}`)) continue;
      filas.push({
        tipo: g.tipo, concepto: g.concepto, categoria: g.categoria, linea: g.linea,
        montoCOP: g.montoCOP, periodo, createdById: createdById || null,
        notas: `Replicado de ${origen} — verificar el valor real del mes`,
      });
    }
  }
  if (filas.length === 0) return { creados: 0, meses: destinos.length };
  await prisma.financeExpense.createMany({ data: filas });
  return { creados: filas.length, meses: destinos.length };
};

// ─────────────────────────── Activos ───────────────────────────

const listAssets = async () =>
  prisma.financeAsset.findMany({ orderBy: { fechaCompra: 'desc' } });

const createAsset = async (data, createdById) =>
  prisma.financeAsset.create({
    data: {
      nombre: String(data.nombre || '').trim(),
      categoria: data.categoria || 'equipos',
      valorCompra: Number(data.valorCompra) || 0,
      valorResidual: Number(data.valorResidual) || 0,
      fechaCompra: new Date(data.fechaCompra || Date.now()),
      vidaUtilMeses: Number(data.vidaUtilMeses) || 60,
      notas: data.notas || null,
      createdById: createdById || null,
    },
  });

const updateAsset = async (id, data) => {
  const body = {};
  for (const k of ['nombre', 'categoria', 'notas']) if (data[k] !== undefined) body[k] = data[k];
  if (data.valorCompra !== undefined) body.valorCompra = Number(data.valorCompra) || 0;
  if (data.valorResidual !== undefined) body.valorResidual = Number(data.valorResidual) || 0;
  if (data.vidaUtilMeses !== undefined) body.vidaUtilMeses = Number(data.vidaUtilMeses) || 60;
  if (data.fechaCompra !== undefined) body.fechaCompra = new Date(data.fechaCompra);
  if (data.dadoDeBajaAt !== undefined) body.dadoDeBajaAt = data.dadoDeBajaAt ? new Date(data.dadoDeBajaAt) : null;
  return prisma.financeAsset.update({ where: { id }, data: body });
};

const deleteAsset = async (id) => prisma.financeAsset.delete({ where: { id } });

/**
 * Depreciación lineal mensual del activo, solo dentro de su vida útil.
 * (valorCompra − valorResidual) / vidaUtilMeses
 */
const depreciacionEnPeriodo = (asset, periodo) => {
  const vida = Number(asset.vidaUtilMeses) || 0;
  if (vida <= 0) return 0;
  const compra = new Date(asset.fechaCompra);
  const inicio = toPeriodo(compra);
  if (periodo < inicio) return 0;
  const finDate = new Date(compra.getFullYear(), compra.getMonth() + vida - 1, 1);
  if (periodo > toPeriodo(finDate)) return 0;
  if (asset.dadoDeBajaAt && periodo > toPeriodo(new Date(asset.dadoDeBajaAt))) return 0;
  return Math.max(0, (asset.valorCompra - asset.valorResidual) / vida);
};

// ─────────────────────────── Resumen ───────────────────────────

/**
 * Resumen financiero de los últimos `months` meses.
 * Devuelve serie mensual + totales + punto de equilibrio del mes actual.
 */
const getSummary = async ({ year } = {}) => {
  const anio = Number(year) || new Date().getFullYear();
  const periodos = periodosDelAno(anio);
  const desde = rangoPeriodo(periodos[0]).inicio;
  const hasta = rangoPeriodo(periodos[periodos.length - 1]).fin;

  const [gastos, activos, ventas, pagos] = await Promise.all([
    prisma.financeExpense.findMany(),
    prisma.financeAsset.findMany(),
    prisma.sale.findMany({
      where: { fechaVenta: { gte: desde, lte: hasta } },
      select: {
        valorTotal: true, fechaVenta: true, categoria: true,
        costoUnitario: true, cantidad: true,
      },
    }),
    prisma.payment.findMany({
      where: { status: 'APPROVED', paidAt: { gte: desde, lte: hasta } },
      select: { montoCOP: true, paidAt: true },
    }),
  ]);

  const fijos = gastos.filter((g) => g.tipo === 'FIJO');
  const variables = gastos.filter((g) => g.tipo === 'VARIABLE');

  const serie = periodos.map((periodo) => {
    const { inicio, fin } = rangoPeriodo(periodo);

    const ingresosCentro = ventas
      .filter((v) => v.fechaVenta >= inicio && v.fechaVenta <= fin)
      .reduce((s, v) => s + (v.valorTotal || 0), 0);

    const ingresosPortal = pagos
      .filter((p) => p.paidAt >= inicio && p.paidAt <= fin)
      .reduce((s, p) => s + (p.montoCOP || 0), 0);

    // Causación: el costo entra al mes en que se vendió, no al que se compró.
    const ventasDelMes = ventas.filter((v) => v.fechaVenta >= inicio && v.fechaVenta <= fin);
    const costoVentas = ventasDelMes
      .reduce((s, v) => s + (v.costoUnitario || 0) * (v.cantidad || 1), 0);
    // Ventas sin costo cargado: el margen bruto sale inflado hasta completarlas.
    const ventasSinCosto = ventasDelMes.filter((v) => v.costoUnitario == null).length;
    const unidadesVendidas = ventasDelMes.reduce((s, v) => s + (v.cantidad || 1), 0);

    const gastosFijos = fijos
      .filter((g) => fijoAplica(g, periodo))
      .reduce((s, g) => s + g.montoCOP, 0);

    const gastosVariables = variables
      .filter((g) => fijoAplica(g, periodo))
      .reduce((s, g) => s + g.montoCOP, 0);

    const depreciacion = activos.reduce((s, a) => s + depreciacionEnPeriodo(a, periodo), 0);

    const ingresos = ingresosCentro + ingresosPortal;
    // Utilidad bruta = ingresos − costo de lo vendido. El portal no tiene costo
    // de mercancía: su margen bruto es el ingreso completo.
    const utilidadBruta = ingresos - costoVentas;
    const gastosOperativos = gastosFijos + gastosVariables;
    const utilidadOperativa = utilidadBruta - gastosOperativos;
    const utilidadNeta = utilidadOperativa - depreciacion;

    return {
      periodo,
      ingresosCentro,
      ingresosPortal,
      ingresos,
      costoVentas,
      utilidadBruta,
      unidadesVendidas,
      ventasSinCosto,
      gastosFijos,
      gastosVariables,
      gastosOperativos,
      depreciacion,
      // Suma de todo lo que sale. No se llama "gastos" a propósito: el costo
      // de ventas es costo, no gasto, y mezclarlos rompe el estado de
      // resultados. Solo se usa para el punto de equilibrio.
      egresosTotales: costoVentas + gastosOperativos + depreciacion,
      utilidadOperativa,
      utilidadNeta,
      margenBruto: ingresos > 0 ? (utilidadBruta / ingresos) * 100 : null,
      margenOperativo: ingresos > 0 ? (utilidadOperativa / ingresos) * 100 : null,
      margenNeto: ingresos > 0 ? (utilidadNeta / ingresos) * 100 : null,
    };
  });

  // "Actual" es el mes en curso si el año consultado es el vigente; si no,
  // el último mes del año que tenga movimiento.
  const hoy = new Date();
  const idxActual = anio === hoy.getFullYear()
    ? hoy.getMonth()
    : Math.max(0, serie.map((m, i) => (m.ingresos || m.egresosTotales ? i : -1)).reduce((a, b) => Math.max(a, b), 0));
  const actual = serie[idxActual];
  const anterior = idxActual > 0 ? serie[idxActual - 1] : null;

  // Margen de contribución: cuánto deja cada unidad después de su costo. Con
  // él, el equilibrio se puede expresar en unidades, que es accionable.
  const margenContribUnitario = actual.unidadesVendidas > 0
    ? actual.utilidadBruta / actual.unidadesVendidas
    : null;
  const gastosACubrir = actual.gastosOperativos + actual.depreciacion;
  const unidadesEquilibrio = margenContribUnitario > 0
    ? Math.ceil(gastosACubrir / margenContribUnitario)
    : null;

  // Punto de equilibrio del mes en curso: cuánto falta facturar para cubrir todo.
  const puntoEquilibrio = {
    periodo: actual.periodo,
    meta: actual.egresosTotales,
    facturado: actual.ingresos,
    faltante: Math.max(0, actual.egresosTotales - actual.ingresos),
    avancePct: actual.egresosTotales > 0
      ? Math.min(100, (actual.ingresos / actual.egresosTotales) * 100)
      : null,
    cubierto: actual.ingresos >= actual.egresosTotales,
    // Segunda lectura del mismo equilibrio, en unidades vendidas.
    margenContribUnitario,
    unidadesEquilibrio,
    unidadesVendidas: actual.unidadesVendidas,
    ventasSinCosto: actual.ventasSinCosto,
  };

  // Desglose de gastos del mes actual por categoría (fijos vigentes + variables del mes)
  const porCategoria = {};
  fijos.filter((g) => fijoAplica(g, actual.periodo)).forEach((g) => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.montoCOP;
  });
  variables.filter((g) => fijoAplica(g, actual.periodo)).forEach((g) => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.montoCOP;
  });
  const depActual = activos.reduce((s, a) => s + depreciacionEnPeriodo(a, actual.periodo), 0);
  if (depActual > 0) porCategoria.depreciacion = depActual;

  // Resultado por línea de negocio. Los gastos COMPARTIDO no se imputan a
  // ninguna línea: se muestran aparte para no inflar ni desinflar ninguna.
  const gastoLineaEnPeriodo = (linea, periodo) => gastos
    .filter((g) => g.linea === linea && fijoAplica(g, periodo))
    .reduce((s, g) => s + g.montoCOP, 0);

  const porLinea = ['CENTRO', 'PORTAL', 'COMPARTIDO'].map((linea) => {
    const ingresos = linea === 'CENTRO'
      ? serie.reduce((s, m) => s + m.ingresosCentro, 0)
      : linea === 'PORTAL'
        ? serie.reduce((s, m) => s + m.ingresosPortal, 0)
        : 0;
    const gastosLinea = serie.reduce((s, m) => s + gastoLineaEnPeriodo(linea, m.periodo), 0);
    return {
      linea,
      ingresos,
      gastos: gastosLinea,
      resultado: ingresos - gastosLinea,
      margen: ingresos > 0 ? ((ingresos - gastosLinea) / ingresos) * 100 : null,
    };
  });

  // Acumulado del año hasta el mes en curso (no incluye meses futuros, que
  // pueden tener gastos ya cargados y falsearían el corrido).
  const sumar = (meses) => meses.reduce((acc, m) => ({
    ingresos: acc.ingresos + m.ingresos,
    ingresosCentro: acc.ingresosCentro + m.ingresosCentro,
    ingresosPortal: acc.ingresosPortal + m.ingresosPortal,
    gastosFijos: acc.gastosFijos + m.gastosFijos,
    gastosVariables: acc.gastosVariables + m.gastosVariables,
    depreciacion: acc.depreciacion + m.depreciacion,
    egresosTotales: acc.egresosTotales + m.egresosTotales,
    utilidadOperativa: acc.utilidadOperativa + m.utilidadOperativa,
    utilidadNeta: acc.utilidadNeta + m.utilidadNeta,
    costoVentas: acc.costoVentas + m.costoVentas,
    utilidadBruta: acc.utilidadBruta + m.utilidadBruta,
    unidadesVendidas: acc.unidadesVendidas + m.unidadesVendidas,
  }), {
    ingresos: 0, ingresosCentro: 0, ingresosPortal: 0, gastosFijos: 0,
    gastosVariables: 0, depreciacion: 0, egresosTotales: 0,
    utilidadOperativa: 0, utilidadNeta: 0,
    costoVentas: 0, utilidadBruta: 0, unidadesVendidas: 0,
  });

  const mesesCorridos = serie.slice(0, idxActual + 1);
  const acumulado = {
    ...sumar(mesesCorridos),
    desde: mesesCorridos[0]?.periodo || null,
    hasta: actual.periodo,
    meses: mesesCorridos.length,
  };
  acumulado.margenBruto = acumulado.ingresos > 0
    ? (acumulado.utilidadBruta / acumulado.ingresos) * 100 : null;
  acumulado.margenNeto = acumulado.ingresos > 0
    ? (acumulado.utilidadNeta / acumulado.ingresos) * 100 : null;
  acumulado.margenOperativo = acumulado.ingresos > 0
    ? (acumulado.utilidadOperativa / acumulado.ingresos) * 100 : null;

  const totales = serie.reduce((acc, m) => ({
    ingresos: acc.ingresos + m.ingresos,
    ingresosCentro: acc.ingresosCentro + m.ingresosCentro,
    ingresosPortal: acc.ingresosPortal + m.ingresosPortal,
    egresosTotales: acc.egresosTotales + m.egresosTotales,
    utilidadNeta: acc.utilidadNeta + m.utilidadNeta,
    gastosFijos: acc.gastosFijos + m.gastosFijos,
    gastosVariables: acc.gastosVariables + m.gastosVariables,
    depreciacion: acc.depreciacion + m.depreciacion,
    utilidadOperativa: acc.utilidadOperativa + m.utilidadOperativa,
    costoVentas: acc.costoVentas + m.costoVentas,
    utilidadBruta: acc.utilidadBruta + m.utilidadBruta,
    unidadesVendidas: acc.unidadesVendidas + m.unidadesVendidas,
  }), {
    ingresos: 0, ingresosCentro: 0, ingresosPortal: 0, egresosTotales: 0,
    utilidadNeta: 0, gastosFijos: 0, gastosVariables: 0, depreciacion: 0,
    utilidadOperativa: 0, costoVentas: 0, utilidadBruta: 0, unidadesVendidas: 0,
  });

  return {
    anio,
    serie,
    actual,
    anterior,
    acumulado,
    porLinea,
    puntoEquilibrio,
    gastosPorCategoria: Object.entries(porCategoria)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto),
    totales,
    activos: {
      cantidad: activos.filter((a) => !a.dadoDeBajaAt).length,
      valorCompra: activos.reduce((s, a) => s + a.valorCompra, 0),
      depreciacionMensual: depActual,
    },
  };
};

module.exports = {
  listExpenses,
  copyExpensesFromPreviousMonth,
  replicateExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getSummary,
  toPeriodo,
};
