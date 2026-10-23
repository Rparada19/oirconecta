/**
 * Cotizaciones: un solo lugar para las propuestas comerciales y su seguimiento.
 *
 * Una propuesta agrupa 1 a 3 opciones (cada opción es un registro Quote con el
 * mismo propuestaId). Las cotizaciones sueltas que ya existían en el CRM se
 * muestran como propuestas de una opción: no hace falta migrarlas.
 *
 * El seguimiento comercial vive en la propuesta: cada contacto se guarda como
 * Interaction (type 'quote_follow_up', metadata.propuestaId) y la propuesta
 * guarda su etapa y la fecha del próximo contacto.
 */

const crypto = require('crypto');
const prisma = require('../db');

const ETAPAS = ['enviada', 'en_prueba', 'negociacion', 'ganada', 'perdida'];
const ABIERTAS = ['enviada', 'en_prueba', 'negociacion'];

const diasDesde = (f) => Math.max(0, Math.floor((Date.now() - new Date(f).getTime()) / 86400000));
const keyDe = (q) => q.propuestaId || q.id;

/** Etapa efectiva: las cotizaciones viejas solo tienen `estado`. */
function etapaDe(q) {
  if (q.estado === 'CONVERTED') return 'ganada';
  if (q.estado === 'REJECTED') return 'perdida';
  return q.etapa || 'enviada';
}

function codigoFirma(datos) {
  return crypto.createHash('sha256').update(JSON.stringify(datos)).digest('hex')
    .slice(0, 16).toUpperCase().match(/.{4}/g).join('-');
}

function opcionDe(q) {
  const m = q.metadata && typeof q.metadata === 'object' ? q.metadata : {};
  return {
    id: q.id,
    nombre: m.producto || [q.marca, q.tecnologia].filter(Boolean).join(' '),
    marca: q.marca,
    tecnologia: q.tecnologia,
    plataforma: q.plataforma,
    cantidad: q.cantidad,
    valorUnitario: q.valorUnitario,
    descuento: q.descuento,
    valorPorUnidad: q.valorPorUnidad ?? q.valorUnitario * (1 - (q.descuento || 0) / 100),
    valorTotal: q.valorTotal,
    imagen: m.imagen || (Array.isArray(m.images) ? m.images[0] : null) || null,
    atributos: Array.isArray(m.atributos) ? m.atributos : [],
    etiqueta: m.etiqueta || null,
    campana: q.campaign?.nombre || m.campanaNombre || null,
    linea: m.linea || null,
    sub: m.sub || null,
    corto: m.corto || null,
    estado: q.estado,
  };
}

function armarPropuesta(grupo, ultimoContacto, seguimientos = 0) {
  const base = grupo[0];
  const meta = base.metadata && typeof base.metadata === 'object' ? base.metadata : {};
  const etapas = grupo.map(etapaDe);
  const etapa = etapas.includes('ganada') ? 'ganada'
    : etapas.every((e) => e === 'perdida') ? 'perdida'
      : (base.etapa && !['ganada', 'perdida'].includes(base.etapa) ? base.etapa : 'enviada');
  const totales = grupo.map((q) => q.valorTotal || 0);
  return {
    id: keyDe(base),
    numero: meta.numero || `COT-${String(keyDe(base)).slice(0, 8).toUpperCase()}`,
    etapa,
    createdAt: base.createdAt,
    diasAbierta: diasDesde(base.createdAt),
    vigenciaDias: base.vigenciaDias ?? 15,
    venceEl: new Date(new Date(base.createdAt).getTime() + (base.vigenciaDias ?? 15) * 86400000),
    profesional: base.profesional || meta.profesional || null,
    cargo: meta.cargo || null,
    proximoContacto: base.proximoContacto,
    codigoFirma: base.codigoFirma,
    paciente: base.patient,
    campana: base.campaign?.nombre || null,
    opciones: grupo.map(opcionDe),
    valorMin: Math.min(...totales),
    valorMax: Math.max(...totales),
    ultimoContacto: ultimoContacto?.fecha || null,
    detalleUltimoContacto: ultimoContacto?.detalle || null,
    diasSinContacto: ultimoContacto ? diasDesde(ultimoContacto.fecha) : null,
    seguimientos,
    origen: base.propuestaId ? 'propuesta' : 'cotizacion',
  };
}

const INCLUDE = {
  patient: { select: { id: true, nombre: true, telefono: true, email: true, procedencia: true, ciudad: true } },
  campaign: { select: { id: true, nombre: true } },
};

async function listar({ incluirCerradas = false } = {}) {
  const quotes = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, include: INCLUDE, take: 600 });

  const grupos = new Map();
  for (const q of quotes) {
    const k = keyDe(q);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(q);
  }

  const patientIds = [...new Set(quotes.map((q) => q.patientId))];
  const interacciones = await prisma.interaction.findMany({
    where: { patientId: { in: patientIds } },
    orderBy: { occurredAt: 'desc' },
    select: { patientId: true, occurredAt: true, title: true, type: true, metadata: true },
  });
  const ultimoPorPaciente = {};
  const seguimientosPorPropuesta = {};
  for (const i of interacciones) {
    if (!ultimoPorPaciente[i.patientId]) ultimoPorPaciente[i.patientId] = { fecha: i.occurredAt, detalle: i.title || i.type };
    const pid = i.metadata && i.metadata.propuestaId;
    if (i.type === 'quote_follow_up' && pid) seguimientosPorPropuesta[pid] = (seguimientosPorPropuesta[pid] || 0) + 1;
  }

  let items = [...grupos.values()].map((g) =>
    armarPropuesta(g, ultimoPorPaciente[g[0].patientId], seguimientosPorPropuesta[keyDe(g[0])] || 0));
  const abiertas = items.filter((p) => ABIERTAS.includes(p.etapa));
  if (!incluirCerradas) items = abiertas;

  // Orden por urgencia: próximo contacto vencido primero, luego más días sin contacto.
  const hoy = Date.now();
  items.sort((a, b) => {
    const va = a.proximoContacto && new Date(a.proximoContacto).getTime() <= hoy ? 0 : 1;
    const vb = b.proximoContacto && new Date(b.proximoContacto).getTime() <= hoy ? 0 : 1;
    if (va !== vb) return va - vb;
    return (b.diasSinContacto ?? 999) - (a.diasSinContacto ?? 999);
  });

  const enJuego = abiertas.reduce((s, p) => s + p.valorMax, 0);
  const ganadas = [...grupos.values()].filter((g) => g.some((q) => etapaDe(q) === 'ganada')).length;
  const cerradas = [...grupos.values()].filter((g) => g.some((q) => ['ganada', 'perdida'].includes(etapaDe(q)))).length;
  return {
    items,
    resumen: {
      abiertas: abiertas.length,
      enJuego,
      paraHoy: abiertas.filter((p) => p.proximoContacto && new Date(p.proximoContacto).getTime() <= hoy + 86400000).length,
      sinContactoReciente: abiertas.filter((p) => p.diasSinContacto == null || p.diasSinContacto > 7).length,
      tasaCierre: cerradas ? Math.round((ganadas / cerradas) * 100) : null,
    },
  };
}

async function quotesDe(propuestaId) {
  return prisma.quote.findMany({
    where: { OR: [{ propuestaId }, { id: propuestaId }] },
    orderBy: { createdAt: 'asc' },
    include: INCLUDE,
  });
}

async function detalle(propuestaId) {
  const grupo = await quotesDe(propuestaId);
  if (!grupo.length) return null;
  const meta = grupo[0].metadata && typeof grupo[0].metadata === 'object' ? grupo[0].metadata : {};
  const interacciones = await prisma.interaction.findMany({
    where: { patientId: grupo[0].patientId },
    orderBy: { occurredAt: 'desc' },
    take: 60,
  });
  const seguimiento = interacciones
    .filter((i) => i.type === 'quote_follow_up' && i.metadata && i.metadata.propuestaId === propuestaId)
    .map((i) => ({
      id: i.id, fecha: i.occurredAt, canal: i.channel, titulo: i.title, nota: i.description,
      resultado: i.metadata?.resultado || null, etapa: i.metadata?.etapa || null,
    }));
  const otros = interacciones
    .filter((i) => !(i.type === 'quote_follow_up' && i.metadata && i.metadata.propuestaId === propuestaId))
    .slice(0, 10)
    .map((i) => ({ id: i.id, fecha: i.occurredAt, canal: i.channel, titulo: i.title, tipo: i.type }));
  const ultimo = interacciones[0] ? { fecha: interacciones[0].occurredAt, detalle: interacciones[0].title } : null;
  return {
    ...armarPropuesta(grupo, ultimo, seguimiento.length),
    garantias: meta.garantias || null,
    plan: meta.plan || null,
    condiciones: meta.condiciones || null,
    seguimiento,
    otrosContactos: otros,
  };
}

/**
 * Crea una propuesta con 1 a 3 opciones.
 * @param {object} data { patientId, profesional, vigenciaDias, numero, cantidad, opciones[], garantias, plan, condiciones, campaignId }
 */
async function crear(data, user) {
  const opciones = (data.opciones || []).slice(0, 3);
  if (!opciones.length) throw Object.assign(new Error('La propuesta necesita al menos una opción'), { status: 400 });
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw Object.assign(new Error('Paciente no encontrado'), { status: 404 });

  const propuestaId = crypto.randomUUID();
  const cantidad = Number(data.cantidad) || 2;
  const vigenciaDias = Number(data.vigenciaDias) || 15;
  const codigo = codigoFirma({ propuestaId, paciente: patient.nombre, profesional: data.profesional, opciones });
  const comun = {
    garantias: data.garantias || null, plan: data.plan || null, condiciones: data.condiciones || null,
    numero: data.numero || null, profesional: data.profesional || null, cargo: data.cargo || null, creadoPor: user?.email || null,
  };

  // Campañas de cada opción: el descuento lo pone la campaña, no la mano.
  const campIds = [...new Set(opciones.map((o) => o.campaignId).filter(Boolean))];
  const campanas = campIds.length
    ? await prisma.campaign.findMany({ where: { id: { in: campIds } } }) : [];
  const campPorId = new Map(campanas.map((c) => [c.id, c]));

  const creadas = await prisma.$transaction(opciones.map((o, idx) => {
    const unit = Number(o.valorUnitario) || 0;
    const camp = o.campaignId ? campPorId.get(o.campaignId) : null;
    let dto = Number(o.descuento) || 0;
    if (camp) {
      const d = Number(camp.descuentoAprobado) || 0;
      // SEGUNDO_AUDIFONO: el % solo aplica a la 2.ª unidad → descuento promedio por unidad.
      dto = camp.aplicacionDescuento === 'SEGUNDO_AUDIFONO' && cantidad >= 2 ? d / cantidad : d;
      dto = Math.round(dto * 100) / 100;
    }
    const neto = Math.round(unit * (1 - dto / 100));
    return prisma.quote.create({
      data: {
        id: idx === 0 ? propuestaId : undefined,
        propuestaId,
        marca: o.marca || 'Widex',
        tecnologia: o.tecnologia || null,
        plataforma: o.plataforma || null,
        recargable: o.recargable || 'SI',
        cantidad,
        anosGarantia: Number(o.anosGarantia) || 2,
        valorUnitario: unit,
        descuento: dto,
        valorPorUnidad: neto,
        valorTotal: neto * cantidad,
        campaignId: camp?.id || data.campaignId || null,
        patientId: patient.id,
        profesional: data.profesional || null,
        vigenciaDias,
        codigoFirma: codigo,
        etapa: 'enviada',
        proximoContacto: data.proximoContacto ? new Date(data.proximoContacto) : new Date(Date.now() + 2 * 86400000),
        notas: o.notas || null,
        metadata: { ...comun, catalogoProductoId: o.catalogoProductoId || null, campanaNombre: camp?.nombre || null, producto: o.nombre, imagen: o.imagen || null, atributos: o.atributos || [], etiqueta: o.etiqueta || null, linea: o.linea || null, sub: o.sub || null, corto: o.corto || null },
      },
    });
  }));

  await prisma.interaction.create({
    data: {
      patientId: patient.id, type: 'quote_follow_up', channel: 'system', status: 'completed',
      title: `Propuesta creada (${creadas.length} ${creadas.length > 1 ? 'opciones' : 'opción'})`,
      metadata: { propuestaId, etapa: 'enviada' },
    },
  });
  return detalle(propuestaId);
}

/** Registra un contacto de seguimiento y, si viene, actualiza etapa y próximo contacto. */
async function registrarSeguimiento(propuestaId, { canal, nota, resultado, etapa, proximoContacto, opcionGanadaId }, user) {
  const grupo = await quotesDe(propuestaId);
  if (!grupo.length) throw Object.assign(new Error('Propuesta no encontrada'), { status: 404 });
  const titulos = { phone: 'Llamada', whatsapp: 'WhatsApp', email: 'Correo', in_person: 'Visita', system: 'Nota' };

  await prisma.interaction.create({
    data: {
      patientId: grupo[0].patientId,
      type: 'quote_follow_up',
      channel: canal || 'phone',
      status: 'completed',
      title: `${titulos[canal] || 'Seguimiento'} · cotización${resultado ? ` · ${resultado}` : ''}`,
      description: nota || null,
      metadata: { propuestaId, resultado: resultado || null, etapa: etapa || null, por: user?.email || null },
    },
  });
  if (etapa || proximoContacto !== undefined) {
    await actualizar(propuestaId, { etapa, proximoContacto, opcionGanadaId });
  }
  return detalle(propuestaId);
}

async function actualizar(propuestaId, { etapa, proximoContacto, opcionGanadaId }) {
  const grupo = await quotesDe(propuestaId);
  if (!grupo.length) throw Object.assign(new Error('Propuesta no encontrada'), { status: 404 });
  if (etapa && !ETAPAS.includes(etapa)) throw Object.assign(new Error('Etapa inválida'), { status: 400 });

  await prisma.$transaction(grupo.map((q) => {
    const data = {};
    if (proximoContacto !== undefined) data.proximoContacto = proximoContacto ? new Date(proximoContacto) : null;
    if (etapa) {
      data.etapa = etapa;
      if (etapa === 'ganada') {
        const gana = opcionGanadaId ? q.id === opcionGanadaId : q.id === grupo[0].id;
        data.estado = gana ? 'CONVERTED' : 'REJECTED';
        data.proximoContacto = null;
      } else if (etapa === 'perdida') {
        data.estado = 'REJECTED';
        data.proximoContacto = null;
      } else {
        data.estado = 'PENDING';
      }
    }
    return prisma.quote.update({ where: { id: q.id }, data });
  }));
  return detalle(propuestaId);
}

module.exports = { listar, detalle, crear, registrarSeguimiento, actualizar, ETAPAS };
