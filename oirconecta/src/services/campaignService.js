/**
 * Servicio de campañas de marketing conectado a la API.
 */

import { api } from './apiClient';

export const MARCAS = [
  'Widex', 'Audioservice', 'Oticon', 'Resound', 'Starkey',
  'Beltone', 'Sonic', 'Hansaton', 'Bernafon', 'Phonak', 'Unitron', 'Signia',
];

export const ALIMENTACION_AUDIFONO = [
  { value: 'BATERIA', label: 'Audífonos de pila / batería' },
  { value: 'RECARGABLE', label: 'Audífonos recargables' },
  { value: 'AMBOS', label: 'Aplica a ambos' },
];

/** UNO = solo 1 audífono | DOS = solo par (2) | UNO_O_DOS = válido para 1 o 2 */
export const VALIDEZ_CANTIDAD_AUDIFONOS = [
  {
    value: 'UNO',
    label: 'Solo 1 audífono (no aplica al segundo)',
    detalleSegundo: 'El beneficio no es válido para el segundo audífono; solo una unidad.',
  },
  {
    value: 'DOS',
    label: 'Solo par: primer y segundo audífono (2 unidades)',
    detalleSegundo: 'Válido únicamente si se cotizan o venden ambos: incluye explícitamente el segundo audífono.',
  },
  {
    value: 'UNO_O_DOS',
    label: '1 o 2 audífonos (incluye el segundo en un par)',
    detalleSegundo: 'Aplica con una unidad o con dos; si lleva par, también cubre el segundo audífono.',
  },
];

export function labelValidezCantidadAudifonos(value) {
  const v = VALIDEZ_CANTIDAD_AUDIFONOS.find((x) => x.value === value);
  return v ? v.label : value || '—';
}

/** Texto aclaratorio centrado en el 2.º audífono (cotización, venta, ayudas). */
export function detalleValidezSegundoAudifono(value) {
  const v = VALIDEZ_CANTIDAD_AUDIFONOS.find((x) => x.value === value);
  return v?.detalleSegundo || '';
}

/** Cómo se reparte el % de descuento aprobado en cotización/venta de audífonos. */
export const APLICACION_DESCUENTO_CAMPAIGN = [
  {
    value: 'TOTAL_VENTA',
    label: 'Sobre el total de la venta',
    detalle: 'El porcentaje se aplica a todas las unidades (cada una con el mismo descuento sobre el precio de lista).',
  },
  {
    value: 'SEGUNDO_AUDIFONO',
    label: 'Solo sobre el segundo audífono',
    detalle: 'El 1.er audífono queda a precio pleno; el % de campaña solo reduce el valor del 2.º audífono.',
  },
];

export function aplicacionDescuentoNorm(value) {
  return value === 'SEGUNDO_AUDIFONO' ? 'SEGUNDO_AUDIFONO' : 'TOTAL_VENTA';
}

export function labelAplicacionDescuento(value) {
  const v = APLICACION_DESCUENTO_CAMPAIGN.find((x) => x.value === aplicacionDescuentoNorm(value));
  return v ? v.label : 'Sobre el total de la venta';
}

export function detalleAplicacionDescuento(value) {
  const v = APLICACION_DESCUENTO_CAMPAIGN.find((x) => x.value === aplicacionDescuentoNorm(value));
  return v?.detalle || '';
}

/**
 * Total de línea de audífonos según campaña (precio lista × cantidad y reglas de descuento).
 * @param {{ unitPrice: number, quantity: number, discountPercent: number, aplicacionDescuento?: string|null }} p
 */
export function computeAudifonosCampaignTotal(p) {
  const P = Math.max(0, Number(p.unitPrice) || 0);
  const q = Math.max(0, Math.floor(Number(p.quantity) || 0));
  const d = Math.max(0, Math.min(100, Number(p.discountPercent) || 0));
  const mode = aplicacionDescuentoNorm(p.aplicacionDescuento);

  if (P <= 0 || q <= 0) {
    return {
      total: 0,
      averagePerUnit: 0,
      sinDescuentoPorUnidad: false,
      breakdown: '',
      mode,
    };
  }

  if (d <= 0) {
    const total = P * q;
    return {
      total,
      averagePerUnit: total / q,
      sinDescuentoPorUnidad: false,
      breakdown: '',
      mode,
    };
  }

  if (mode === 'SEGUNDO_AUDIFONO') {
    if (q < 2) {
      const total = P * q;
      return {
        total,
        averagePerUnit: q ? total / q : 0,
        sinDescuentoPorUnidad: true,
        breakdown: `Con ${q} audífono(s) el descuento de campaña no reduce el total (solo aplica al 2.º).`,
        mode,
      };
    }
    const u1 = P;
    const u2 = P * (1 - d / 100);
    let total = u1 + u2;
    if (q > 2) total += P * (q - 2);
    return {
      total,
      averagePerUnit: total / q,
      sinDescuentoPorUnidad: false,
      breakdown: `1.er: $${Math.round(u1).toLocaleString('es-CO')} · 2.º (${d}%): $${Math.round(u2).toLocaleString('es-CO')}${
        q > 2 ? ` · unidades adicionales (${q - 2}) a precio pleno` : ''
      }`,
      mode,
    };
  }

  const vu = P * (1 - d / 100);
  const total = vu * q;
  return {
    total,
    averagePerUnit: vu,
    sinDescuentoPorUnidad: false,
    breakdown: q > 1 ? `Cada unidad con ${d}%: $${Math.round(vu).toLocaleString('es-CO')}` : '',
    mode,
  };
}

const toFrontend = (c) => {
  if (!c) return null;
  const fi = c.fechaInicio
    ? (typeof c.fechaInicio === 'string' ? c.fechaInicio.slice(0, 10) : c.fechaInicio.toISOString?.().slice(0, 10))
    : '';
  const ff = c.fechaFin
    ? (typeof c.fechaFin === 'string' ? c.fechaFin.slice(0, 10) : c.fechaFin.toISOString?.().slice(0, 10))
    : '';
  return {
    ...c,
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    estado: (c.estado || '').toLowerCase(),
    fechaInicio: fi,
    fechaFin: ff,
    fabricante: c.fabricante || '',
    descuentoAprobado: c.descuentoAprobado ?? 0,
    proveedorNombre: c.proveedorNombre || '',
    referenciaDescuento: c.referenciaDescuento || '',
    tecnologiaDescuento: c.tecnologiaDescuento || '',
    alimentacionAudifono: c.alimentacionAudifono || '',
    validezCantidadAudifonos: c.validezCantidadAudifonos || '',
    aplicacionDescuento: aplicacionDescuentoNorm(c.aplicacionDescuento),
    catalogProductIds: Array.isArray(c.catalogProductIds) ? [...c.catalogProductIds] : [],
    plataformaCampana:
      !c.plataformaCampana || String(c.plataformaCampana).trim() === '' || c.plataformaCampana === 'TODAS'
        ? 'TODAS'
        : String(c.plataformaCampana).trim(),
    descripcion: c.descripcion || '',
    incluye: c.incluye || '',
    noIncluye: c.noIncluye || '',
    destinatarios: c.destinatarios ?? 0,
    abiertos: c.abiertos ?? 0,
    clicks: c.clicks ?? 0,
  };
};

/**
 * @returns {Promise<Array>}
 */
export async function getCampaigns() {
  const { data, error } = await api.get('/api/campaigns');
  if (error) return [];
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map(toFrontend);
}

export async function getCampaignStats(id) {
  const { data, error } = await api.get(`/api/campaigns/${id}/stats`);
  if (error || !data?.data) return null;
  return data.data;
}

/** Panel CRM: KPI y desgloses (solo ADMIN / API). */
export async function getCampaignDashboard() {
  const { data, error } = await api.get('/api/campaigns/dashboard');
  if (error || data?.success === false) return null;
  return data?.data ?? null;
}

function isoDate(d) {
  if (!d) return '';
  const s = String(d);
  if (s.includes('T')) return s;
  return `${s}T12:00:00.000Z`;
}

/**
 * @param {Object} payload
 */
export async function createCampaign(payload) {
  const {
    nombre,
    tipo,
    fechaInicio,
    fechaFin,
    fabricante,
    descuentoAprobado,
    proveedorNombre,
    referenciaDescuento,
    tecnologiaDescuento,
    alimentacionAudifono,
    validezCantidadAudifonos,
    aplicacionDescuento,
    catalogProductIds,
    plataformaCampana,
    descripcion,
    incluye,
    noIncluye,
  } = payload;
  if (!nombre?.trim() || !fechaInicio || !fechaFin) {
    return { success: false, campaign: null, error: 'Nombre, fecha inicio y fecha fin son obligatorios' };
  }
  const body = {
    nombre: nombre.trim(),
    tipo: (tipo || 'Audífonos').trim(),
    fechaInicio: isoDate(fechaInicio),
    fechaFin: isoDate(fechaFin),
    fabricante: fabricante?.trim() || undefined,
    descuentoAprobado: descuentoAprobado ?? 0,
    proveedorNombre: proveedorNombre?.trim() || undefined,
    referenciaDescuento: referenciaDescuento?.trim() || undefined,
    tecnologiaDescuento: tecnologiaDescuento?.trim() || undefined,
    alimentacionAudifono: alimentacionAudifono || undefined,
    validezCantidadAudifonos: validezCantidadAudifonos || undefined,
    aplicacionDescuento: aplicacionDescuentoNorm(aplicacionDescuento),
    ...(() => {
      const s = plataformaCampana != null ? String(plataformaCampana).trim() : '';
      if (!s || s === 'TODAS') return {};
      return { plataformaCampana: s };
    })(),
    descripcion: descripcion?.trim() || undefined,
    incluye: incluye?.trim() || undefined,
    noIncluye: noIncluye?.trim() || undefined,
  };
  if (catalogProductIds !== undefined) {
    body.catalogProductIds = Array.isArray(catalogProductIds)
      ? catalogProductIds.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
  }
  const { data, error } = await api.post('/api/campaigns', body);
  if (error) return { success: false, campaign: null, error: typeof error === 'string' ? error : 'Error al crear campaña' };
  const campaign = data?.data ? toFrontend(data.data) : null;
  return { success: !!campaign, campaign, error: campaign ? null : 'Error al crear campaña' };
}

export async function updateCampaign(id, payload) {
  const body = {};
  const copy = [
    'nombre', 'tipo', 'estado', 'fechaInicio', 'fechaFin', 'fabricante', 'descuentoAprobado',
    'proveedorNombre', 'referenciaDescuento', 'tecnologiaDescuento', 'alimentacionAudifono',
    'validezCantidadAudifonos',
    'aplicacionDescuento',
    'plataformaCampana',
    'descripcion', 'incluye', 'noIncluye', 'catalogProductIds',
  ];
  for (const k of copy) {
    if (payload[k] !== undefined) body[k] = payload[k];
  }
  if (body.fechaInicio) body.fechaInicio = isoDate(body.fechaInicio);
  if (body.fechaFin) body.fechaFin = isoDate(body.fechaFin);
  if (body.estado) body.estado = String(body.estado).toUpperCase();
  if (body.aplicacionDescuento !== undefined) {
    body.aplicacionDescuento = aplicacionDescuentoNorm(body.aplicacionDescuento);
  }
  if (body.catalogProductIds !== undefined) {
    body.catalogProductIds = Array.isArray(body.catalogProductIds)
      ? body.catalogProductIds.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
  }
  if (body.plataformaCampana !== undefined) {
    const s = body.plataformaCampana == null ? '' : String(body.plataformaCampana).trim();
    body.plataformaCampana = !s || s === 'TODAS' ? null : s;
  }
  const { data, error } = await api.put(`/api/campaigns/${id}`, body);
  if (error) return { success: false, campaign: null, error: typeof error === 'string' ? error : 'Error al actualizar' };
  const campaign = data?.data ? toFrontend(data.data) : null;
  return { success: !!campaign, campaign, error: campaign ? null : 'Error al actualizar' };
}

export async function deleteCampaign(id) {
  const { data, error } = await api.delete(`/api/campaigns/${id}`);
  if (error) return { success: false, error: typeof error === 'string' ? error : 'Error al eliminar' };
  return { success: data?.success !== false, error: null };
}
