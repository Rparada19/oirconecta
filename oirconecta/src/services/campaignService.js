/**
 * Servicio de campañas de marketing conectado a la API.
 */

import { api } from './apiClient';

export const MARCAS = [
  'Widex', 'Audioservice', 'Oticon', 'Resound', 'Starkey',
  'Beltone', 'Sonic', 'Hansaton', 'Bernafon',
];

const toFrontend = (c) => {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    estado: (c.estado || '').toLowerCase(),
    fechaInicio: c.fechaInicio ? (typeof c.fechaInicio === 'string' ? c.fechaInicio.slice(0, 10) : c.fechaInicio.toISOString?.().slice(0, 10)) : '',
    fechaFin: c.fechaFin ? (typeof c.fechaFin === 'string' ? c.fechaFin.slice(0, 10) : c.fechaFin.toISOString?.().slice(0, 10)) : '',
    fabricante: c.fabricante || '',
    descuentoAprobado: c.descuentoAprobado ?? 0,
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

/**
 * @param {Object} payload - { nombre, tipo, fechaInicio, fechaFin, fabricante?, descuentoAprobado? }
 * @returns {Promise<{ success: boolean, campaign?: object, error?: string }>}
 */
export async function createCampaign(payload) {
  const { nombre, tipo, fechaInicio, fechaFin, fabricante, descuentoAprobado } = payload;
  if (!nombre?.trim() || !fechaInicio || !fechaFin) {
    return { success: false, campaign: null, error: 'Nombre, fecha inicio y fecha fin son obligatorios' };
  }
  const body = {
    nombre: nombre.trim(),
    tipo: tipo || 'Email',
    fechaInicio: fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T12:00:00.000Z`,
    fechaFin: fechaFin.includes('T') ? fechaFin : `${fechaFin}T12:00:00.000Z`,
    fabricante: fabricante?.trim() || undefined,
    descuentoAprobado: descuentoAprobado ?? 0,
  };
  const { data, error } = await api.post('/api/campaigns', body);
  if (error) return { success: false, campaign: null, error };
  const campaign = data?.data ? toFrontend(data.data) : null;
  return { success: !!campaign, campaign, error: campaign ? null : 'Error al crear campaña' };
}
