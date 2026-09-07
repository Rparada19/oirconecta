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
    // Lo que agendaba el bot y la reserva pública quedaba con estos valores,
    // que no estaban en la lista y caían al cajón por defecto: "visita médica".
    // Le atribuía al trabajo comercial las citas que trajo el canal digital.
    'directorio-publico': 'sitio-web',
    'whatsapp-ia': 'sitio-web',
    'whatsapp': 'sitio-web',
  };
  // Atribución de anuncio: la venta la trajo la pauta, sin importar la
  // campaña puntual (`anuncio-wa:<id>`).
  if (s.startsWith('anuncio-wa')) return 'leads-marketing-digital';
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
  evaluados: 0,
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

  const [leads, citas, pacientes, consultas, cotizaciones, ventas] = await Promise.all([
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
    // Las consultas del período, no las de siempre: el embudo responde por un
    // rango de fechas y una evaluación de hace un año no es de este mes.
    prisma.consultation.findMany({
      where: rangoFecha('fecha'),
      select: { patientId: true, perdidaAuditiva: true },
    }),
    prisma.quote.findMany({
      where: rangoFecha('createdAt'),
      select: { patientId: true },
    }),
    prisma.sale.findMany({
      where: rangoFecha('fechaVenta'),
      select: { patientId: true, valorTotal: true, categoria: true },
    }),
  ]);

  const grupos = {};
  const get = (proc) => {
    const k = normalizar(proc);
    if (!grupos[k]) grupos[k] = { procedencia: k, ...vacio() };
    return grupos[k];
  };

  leads.forEach((l) => { get(l.procedencia).leads += 1; });

  citas.forEach((c) => {
    const g = get(c.procedencia);
    g.agendados += 1;
    // Una cita cancelada es un cupo perdido: cuenta como "no asistió".
    if (c.estado === 'COMPLETED' || c.estado === 'PATIENT') g.asistidos += 1;
    else if (c.estado === 'NO_SHOW' || c.estado === 'CANCELLED') {
      g.noAsistidos += 1;
      if (c.estado === 'CANCELLED') g.cancelados += 1;
    } else g.porRealizar += 1;
  });

  // El diagnóstico solo cuenta si el paciente FUE EVALUADO.
  // `tienePerdidaAuditiva` es false por defecto: sin evidencia, "audición
  // normal" sería una conclusión inventada.
  const evaluados = new Set(consultas.map((c) => c.patientId).filter(Boolean));

  // A nadie se le venden audífonos con la audición normal. Cuando hay venta de
  // audífonos, hubo evaluación y hubo pérdida — aunque el equipo no haya
  // alcanzado a evolucionar la consulta en el CRM. Antes esos pacientes
  // desaparecían de las columnas de diagnóstico justo después de comprar, que
  // es cuando más se les debería ver.
  const conAudifonos = new Set(
    ventas.filter((v) => v.categoria === 'HEARING_AID').map((v) => v.patientId).filter(Boolean)
  );
  // Y el que la consulta marcó con pérdida, aunque la ficha diga otra cosa.
  const perdidaEnConsulta = new Set(
    consultas.filter((c) => c.perdidaAuditiva).map((c) => c.patientId).filter(Boolean)
  );

  const procDePaciente = {};
  pacientes.forEach((p) => {
    procDePaciente[p.id] = normalizar(p.procedencia);
    // Antes se exigía además una cita asistida DENTRO DEL RANGO. Con eso, un
    // paciente evaluado en agosto se caía del embudo de septiembre aunque su
    // consulta estuviera ahí: la consulta ya es prueba de que asistió.
    const evaluado = evaluados.has(p.id) || conAudifonos.has(p.id);
    if (!evaluado) return;
    const g = get(p.procedencia);
    g.evaluados += 1;
    if (p.tienePerdidaAuditiva || perdidaEnConsulta.has(p.id) || conAudifonos.has(p.id)) {
      g.conPerdidaAuditiva += 1;
    } else {
      g.audicionNormal += 1;
    }
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

  // Todas las procedencias se exponen siempre, aunque estén en cero: un canal
  // sin actividad también es información.
  PROCEDENCIAS.forEach((p) => get(p));
  const lista = PROCEDENCIAS
    .map((p) => grupos[p])
    .sort((a, b) => (b.agendados + b.leads) - (a.agendados + a.leads));

  const totales = lista.reduce((acc, g) => {
    Object.keys(vacio()).forEach((k) => { acc[k] = (acc[k] || 0) + g[k]; });
    return acc;
  }, { procedencia: 'total', ...vacio() });

  return { procedencias: lista, totales };
};

module.exports = { getFunnelPorProcedencia, normalizar, PROCEDENCIAS };
