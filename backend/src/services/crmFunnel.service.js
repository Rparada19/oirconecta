/**
 * Embudo comercial completo por procedencia.
 *
 * Etapas: leads → agendados → asistidos / no asistidos → diagnóstico
 * (pérdida auditiva vs audición normal) → cotizados → vendidos.
 *
 * La procedencia del paciente manda para las etapas clínicas y comerciales;
 * la de la cita manda para agendados/asistidos.
 */

const prisma = require('../db');

const PROCEDENCIAS = [
  'leads-marketing-digital',
  'leads-marketing-offline',
  'visita-medica',
  'renovacion',
  'recomendacion',
  'sitio-web',
];

/** Normaliza cualquier variante histórica a un valor canónico. */
const normalizar = (v) => {
  const s = String(v || '').toLowerCase().trim();
  const mapa = {
    'recomendación': 'recomendacion',
    'sitio web': 'sitio-web',
    'página web': 'sitio-web',
    'pagina-web': 'sitio-web',
    'marketing digital': 'leads-marketing-digital',
    'leads marketing digital': 'leads-marketing-digital',
    'marketing offline': 'leads-marketing-offline',
    'leads marketing offline': 'leads-marketing-offline',
    'visita médica': 'visita-medica',
    'visita medica': 'visita-medica',
    'renovación': 'renovacion',
    // "Agendamiento manual" era canal de registro, no procedencia.
    'agendamiento-manual': 'recomendacion',
    'agendamiento manual': 'recomendacion',
  };
  const n = mapa[s] || s;
  return PROCEDENCIAS.includes(n) ? n : 'visita-medica';
};

const vacio = () => ({
  leads: 0,
  agendados: 0,
  asistidos: 0,
  noAsistidos: 0,
  cancelados: 0,
  porRealizar: 0,
  conPerdidaAuditiva: 0,
  audicionNormal: 0,
  cotizados: 0,
  vendidos: 0,
  ingresos: 0,
});

/**
 * @param {{ desde?: Date, hasta?: Date }} rango
 */
const getFunnelPorProcedencia = async ({ desde, hasta } = {}) => {
  const rangoFecha = (campo) => (desde || hasta
    ? { [campo]: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } }
    : {});

  const [leads, citas, pacientes, cotizaciones, ventas] = await Promise.all([
    prisma.lead.findMany({
      where: { archivedAt: null, ...rangoFecha('createdAt') },
      select: { procedencia: true },
    }),
    prisma.appointment.findMany({
      where: rangoFecha('fecha'),
      select: { procedencia: true, estado: true, patientId: true },
    }),
    prisma.patient.findMany({
      where: { archivedAt: null },
      select: { id: true, procedencia: true, tienePerdidaAuditiva: true, createdViaBooking: true },
    }),
    prisma.quote.findMany({
      where: rangoFecha('createdAt'),
      select: { patientId: true },
    }),
    prisma.sale.findMany({
      where: rangoFecha('fechaVenta'),
      select: { patientId: true, valorTotal: true },
    }),
  ]);

  const grupos = {};
  const get = (proc) => {
    const k = normalizar(proc);
    if (!grupos[k]) grupos[k] = { procedencia: k, ...vacio() };
    return grupos[k];
  };

  leads.forEach((l) => { get(l.procedencia).leads += 1; });

  // Pacientes que ya asistieron alguna vez (los auto-creados al agendar que
  // aún no asisten no cuentan como pacientes reales).
  const asistioAlguna = new Set(
    citas.filter((c) => c.estado === 'COMPLETED' || c.estado === 'PATIENT')
      .map((c) => c.patientId).filter(Boolean)
  );

  citas.forEach((c) => {
    const g = get(c.procedencia);
    g.agendados += 1;
    if (c.estado === 'COMPLETED' || c.estado === 'PATIENT') g.asistidos += 1;
    else if (c.estado === 'NO_SHOW') g.noAsistidos += 1;
    else if (c.estado === 'CANCELLED') g.cancelados += 1;
    else g.porRealizar += 1;
  });

  const procDePaciente = {};
  pacientes.forEach((p) => {
    procDePaciente[p.id] = normalizar(p.procedencia);
    const esReal = !p.createdViaBooking || asistioAlguna.has(p.id);
    if (!esReal) return;
    const g = get(p.procedencia);
    if (p.tienePerdidaAuditiva) g.conPerdidaAuditiva += 1;
    else g.audicionNormal += 1;
  });

  // Cotizados / vendidos: pacientes únicos, no número de documentos.
  const cotizadosPorProc = {};
  cotizaciones.forEach((q) => {
    const proc = procDePaciente[q.patientId];
    if (!proc) return;
    (cotizadosPorProc[proc] = cotizadosPorProc[proc] || new Set()).add(q.patientId);
  });
  Object.entries(cotizadosPorProc).forEach(([proc, set]) => { get(proc).cotizados = set.size; });

  const vendidosPorProc = {};
  ventas.forEach((v) => {
    const proc = procDePaciente[v.patientId];
    if (!proc) return;
    (vendidosPorProc[proc] = vendidosPorProc[proc] || { set: new Set(), ingresos: 0 });
    vendidosPorProc[proc].set.add(v.patientId);
    vendidosPorProc[proc].ingresos += v.valorTotal || 0;
  });
  Object.entries(vendidosPorProc).forEach(([proc, d]) => {
    const g = get(proc);
    g.vendidos = d.set.size;
    g.ingresos = d.ingresos;
  });

  const lista = Object.values(grupos)
    .filter((g) => g.leads + g.agendados + g.conPerdidaAuditiva + g.audicionNormal + g.cotizados + g.vendidos > 0)
    .sort((a, b) => (b.agendados + b.leads) - (a.agendados + a.leads));

  const totales = lista.reduce((acc, g) => {
    Object.keys(vacio()).forEach((k) => { acc[k] = (acc[k] || 0) + g[k]; });
    return acc;
  }, { procedencia: 'total', ...vacio() });

  return { procedencias: lista, totales };
};

module.exports = { getFunnelPorProcedencia, normalizar, PROCEDENCIAS };
