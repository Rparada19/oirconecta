/**
 * Oportunidades: cotizaciones abiertas y su seguimiento.
 *
 * Una cotización sin decisión es plata en juego. Aquí se ve cuánta hay,
 * hace cuánto está esperando y cuándo fue el último contacto, que es lo
 * que decide a quién llamar hoy.
 */

const prisma = require('../db');

const ABIERTAS = ['PENDING', 'APPROVED'];

const diasDesde = (fecha) => Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);

/**
 * @param {{ incluirCerradas?: boolean }} opts
 */
const listar = async ({ incluirCerradas = false } = {}) => {
  const cotizaciones = await prisma.quote.findMany({
    where: incluirCerradas ? {} : { estado: { in: ABIERTAS } },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: {
        select: { id: true, nombre: true, telefono: true, email: true, procedencia: true },
      },
      campaign: { select: { id: true, nombre: true } },
    },
    take: 300,
  });

  const patientIds = [...new Set(cotizaciones.map((q) => q.patientId).filter(Boolean))];

  // Último contacto real con cada paciente: interacción registrada o mensaje
  // automático. Sin esto no se sabe si alguien ya le hizo seguimiento.
  const [interacciones, notificaciones, ventas] = await Promise.all([
    prisma.interaction.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { occurredAt: 'desc' },
      select: { patientId: true, occurredAt: true, title: true, type: true },
    }),
    prisma.notification.findMany({
      where: { patientId: { in: patientIds } },
      orderBy: { sentAt: 'desc' },
      select: { patientId: true, sentAt: true, eventCode: true },
    }),
    prisma.sale.findMany({
      where: { patientId: { in: patientIds } },
      select: { patientId: true },
    }),
  ]);

  const ultimoPorPaciente = {};
  const registrar = (patientId, fecha, detalle) => {
    if (!patientId || !fecha) return;
    const actual = ultimoPorPaciente[patientId];
    if (!actual || new Date(fecha) > new Date(actual.fecha)) {
      ultimoPorPaciente[patientId] = { fecha, detalle };
    }
  };
  interacciones.forEach((i) => registrar(i.patientId, i.occurredAt, i.title || i.type));
  notificaciones.forEach((n) => registrar(n.patientId, n.sentAt, 'mensaje automático'));

  const compró = new Set(ventas.map((v) => v.patientId));

  const items = cotizaciones.map((q) => {
    const ultimo = ultimoPorPaciente[q.patientId];
    return {
      id: q.id,
      estado: q.estado,
      marca: q.marca,
      tecnologia: q.tecnologia,
      cantidad: q.cantidad,
      valorTotal: q.valorTotal,
      createdAt: q.createdAt,
      diasAbierta: diasDesde(q.createdAt),
      campana: q.campaign?.nombre || null,
      paciente: q.patient,
      ultimoContacto: ultimo?.fecha || null,
      diasSinContacto: ultimo ? diasDesde(ultimo.fecha) : null,
      detalleUltimoContacto: ultimo?.detalle || null,
      yaCompro: compró.has(q.patientId),
    };
  });

  const abiertas = items.filter((i) => ABIERTAS.includes(i.estado));
  const enJuego = abiertas.reduce((s, i) => s + (i.valorTotal || 0), 0);

  return {
    items,
    resumen: {
      abiertas: abiertas.length,
      enJuego,
      ticketPromedio: abiertas.length ? Math.round(enJuego / abiertas.length) : 0,
      // Prioridad operativa: lo que lleva más de una semana sin respuesta.
      frias: abiertas.filter((i) => i.diasAbierta > 7).length,
      sinContactoReciente: abiertas.filter((i) => i.diasSinContacto == null || i.diasSinContacto > 7).length,
    },
  };
};

/** Cierra una cotización como ganada o perdida, sin tocar el resto. */
const cerrar = async (quoteId, resultado) => {
  const estado = resultado === 'ganada' ? 'CONVERTED' : 'REJECTED';
  return prisma.quote.update({ where: { id: quoteId }, data: { estado } });
};

module.exports = { listar, cerrar };
