/**
 * Servicio de productos (cotizaciones, ventas) conectado a la API.
 * Resolución de paciente por email vía patientService.
 */

import { api } from './apiClient';
import { getPatientByEmail, ensurePatient } from './patientService';

const PRODUCTS_KEY = 'oirconecta_patient_products';

// --- Mapeo API → frontend "product" ---

function mapQuoteToProduct(q) {
  const email = q.patient?.email || '';
  const dateStr = q.createdAt ? (typeof q.createdAt === 'string' ? q.createdAt.slice(0, 10) : q.createdAt.toISOString?.().slice(0, 10)) : '';
  const status = (q.estado || 'PENDING').toLowerCase();
  return {
    id: q.id,
    type: 'quote',
    productName: q.marca,
    brand: q.marca,
    model: [q.tecnologia, q.plataforma].filter(Boolean).join(' - ') || '',
    category: 'hearing-aid',
    quantity: q.cantidad ?? 1,
    unitPrice: q.valorUnitario ?? 0,
    totalPrice: q.valorTotal ?? 0,
    discount: q.descuento ?? 0,
    status,
    quoteDate: dateStr,
    patientEmail: email,
    metadata: {
      technology: q.tecnologia,
      platform: q.plataforma,
      warrantyYears: q.anosGarantia,
      rechargeable: q.recargable,
      seguroPerdidaRobo: q.seguroPerdida,
      seguroRotura: q.seguroRotura,
      campaignId: q.campaignId ?? null,
      campaignNombre: q.campaign?.nombre,
      fabricante: q.campaign?.fabricante,
      images: Array.isArray(q.metadata?.images) ? q.metadata.images : [],
    },
    notes: q.notas || '',
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

function mapSaleToProduct(s) {
  const email = s.patient?.email || '';
  const dateStr = s.fechaVenta ? (typeof s.fechaVenta === 'string' ? s.fechaVenta.slice(0, 10) : s.fechaVenta.toISOString?.().slice(0, 10)) : (s.createdAt ? (typeof s.createdAt === 'string' ? s.createdAt.slice(0, 10) : s.createdAt.toISOString?.().slice(0, 10)) : '');
  const cat = (s.categoria || 'HEARING_AID').toLowerCase().replace('_', '-');
  const category = cat === 'hearing-aid' ? 'hearing-aid' : cat === 'service' ? 'service' : 'accessory';
  return {
    id: s.id,
    type: 'sale',
    productName: category === 'service' ? (s.descripcionConsulta || 'Consulta') : (s.marca || (category === 'accessory' ? 'Accesorios' : '')),
    brand: s.marca || '',
    model: s.modelo || '',
    category,
    quantity: s.cantidad ?? 1,
    unitPrice: s.valorUnitario ?? 0,
    totalPrice: s.valorTotal ?? 0,
    discount: s.descuento ?? 0,
    status: 'completed',
    saleDate: dateStr,
    patientEmail: email,
    adaptationDate: s.fechaAdaptacion ? (typeof s.fechaAdaptacion === 'string' ? s.fechaAdaptacion.slice(0, 10) : s.fechaAdaptacion.toISOString?.().slice(0, 10)) : null,
    warrantyStartDate: null,
    warrantyEndDate: s.fechaFinGarantia ? (typeof s.fechaFinGarantia === 'string' ? s.fechaFinGarantia.slice(0, 10) : s.fechaFinGarantia.toISOString?.().slice(0, 10)) : null,
    metadata: {
      technology: s.tecnologia,
      platform: s.plataforma,
      warrantyYears: s.anosGarantia,
      rechargeable: s.recargable,
      seguroPerdidaRobo: s.seguroPerdida,
      seguroRotura: s.seguroRotura,
      campaignId: s.campaignId ?? null,
      campaignNombre: s.campaign?.nombre,
      fabricante: s.campaign?.fabricante,
      descripcionConsulta: s.descripcionConsulta,
      fechaConsulta: s.fechaConsulta ? (typeof s.fechaConsulta === 'string' ? s.fechaConsulta.slice(0, 10) : s.fechaConsulta.toISOString?.().slice(0, 10)) : null,
      accesoriosItems: s.accesoriosItems || [],
      accessories: s.accesoriosItems || [],
      images: Array.isArray(s.metadata?.images) ? s.metadata.images : [],
    },
    notes: s.notas || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// --- API ---

/**
 * @returns {Promise<{ [email: string]: Array }>}
 */
export async function getAllPatientProducts() {
  try {
    const [quotesRes, salesRes] = await Promise.all([
      api.get('/api/products/quotes'),
      api.get('/api/products/sales'),
    ]);
    const quotes = quotesRes.data?.data ?? [];
    const sales = salesRes.data?.data ?? [];
    const byEmail = {};

    const push = (email, product) => {
      const e = (email || '').trim().toLowerCase();
      if (!e) return;
      if (!byEmail[e]) byEmail[e] = [];
      byEmail[e].push(product);
    };

    quotes.forEach((q) => push(q.patient?.email, mapQuoteToProduct(q)));
    sales.forEach((s) => push(s.patient?.email, mapSaleToProduct(s)));

    Object.keys(byEmail).forEach((e) => {
      byEmail[e].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    });

    return byEmail;
  } catch (e) {
    console.error('[productService] getAllPatientProducts:', e);
    return {};
  }
}

/**
 * @param {string} patientEmail
 * @returns {Promise<Array>}
 */
export async function getPatientProducts(patientEmail) {
  if (!patientEmail?.trim()) return [];
  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return [];
  try {
    const [quotesRes, salesRes] = await Promise.all([
      api.get(`/api/products/quotes?patientId=${patient.id}`),
      api.get(`/api/products/sales?patientId=${patient.id}`),
    ]);
    const quotes = quotesRes.data?.data ?? [];
    const sales = salesRes.data?.data ?? [];
    const list = [...quotes.map(mapQuoteToProduct), ...sales.map(mapSaleToProduct)];
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  } catch (e) {
    console.error('[productService] getPatientProducts:', e);
    return [];
  }
}

/**
 * @param {string} patientEmail
 * @param {Object} quoteData - { brand, quantity, unitPrice, totalPrice, discount, metadata, notes, ... }
 * @returns {Promise<{ success: boolean, product?: object, error?: string }>}
 */
export async function createQuote(patientEmail, quoteData) {
  const nombre = quoteData.metadata?.patientName || '';
  const telefono = quoteData.metadata?.patientPhone || '';
  const patient = await ensurePatient({ nombre, email: patientEmail, telefono });
  if (!patient) return { success: false, product: null, error: 'No se pudo obtener o crear el paciente' };

  const md = quoteData.metadata || {};
  const campaignId = md.campaignId && /^[0-9a-f-]{36}$/i.test(String(md.campaignId)) ? md.campaignId : null;
  const payload = {
    patientId: patient.id,
    marca: quoteData.brand || '',
    cantidad: quoteData.quantity ?? 1,
    tecnologia: md.technology || quoteData.model || null,
    plataforma: md.platform || null,
    recargable: (md.rechargeable || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    anosGarantia: md.warrantyYears ?? 1,
    seguroPerdida: (md.seguroPerdidaRobo || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    seguroRotura: (md.seguroRotura || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    valorUnitario: quoteData.unitPrice ?? 0,
    descuento: quoteData.discount ?? 0,
    valorTotal: quoteData.totalPrice ?? quoteData.unitPrice * (quoteData.quantity || 1),
    campaignId,
    metadata: md.images?.length ? { images: md.images } : null,
    notas: quoteData.notes || null,
  };

  const { data, error } = await api.post('/api/products/quotes', payload);
  if (error) return { success: false, product: null, error };
  const q = data?.data;
  return { success: !!q, product: q ? mapQuoteToProduct(q) : null, error: q ? null : 'Error al crear cotización' };
}

/**
 * Actualiza una cotización existente.
 * @param {string} quoteId - UUID de la cotización
 * @param {Object} quoteData - Datos a actualizar (brand, quantity, unitPrice, totalPrice, discount, metadata, notas, etc.)
 * @returns {Promise<{ success: boolean, product?: object, error?: string }>}
 */
export async function updateQuote(quoteId, quoteData) {
  if (!quoteId || !/^[0-9a-f-]{36}$/i.test(String(quoteId))) {
    return { success: false, product: null, error: 'ID de cotización inválido' };
  }
  const md = quoteData.metadata || {};
  const campaignId = md.campaignId && /^[0-9a-f-]{36}$/i.test(String(md.campaignId)) ? md.campaignId : null;
  const payload = {
    marca: quoteData.brand || quoteData.productName,
    cantidad: quoteData.quantity ?? 1,
    tecnologia: md.technology || quoteData.model || null,
    plataforma: md.platform || null,
    recargable: (md.rechargeable || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    anosGarantia: md.warrantyYears ?? 1,
    seguroPerdida: (md.seguroPerdidaRobo || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    seguroRotura: (md.seguroRotura || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : 'NO',
    valorUnitario: quoteData.unitPrice ?? 0,
    descuento: quoteData.discount ?? 0,
    valorTotal: quoteData.totalPrice ?? quoteData.unitPrice * (quoteData.quantity || 1),
    campaignId,
    metadata: md.images?.length ? { images: md.images } : null,
    notas: quoteData.notes || null,
  };

  const { data, error } = await api.put(`/api/products/quotes/${quoteId}`, payload);
  if (error) return { success: false, product: null, error };
  const q = data?.data;
  return { success: !!q, product: q ? mapQuoteToProduct(q) : null, error: q ? null : 'Error al actualizar cotización' };
}

/**
 * Obtiene el historial de cambios de una cotización.
 * @param {string} quoteId - UUID de la cotización
 * @returns {Promise<{ success: boolean, quote?: object, history?: Array, error?: string }>}
 */
export async function getQuoteHistory(quoteId) {
  if (!quoteId || !/^[0-9a-f-]{36}$/i.test(String(quoteId))) {
    return { success: false, quote: null, history: [], error: 'ID de cotización inválido' };
  }
  const { data, error } = await api.get(`/api/products/quotes/${quoteId}/history`);
  if (error) return { success: false, quote: null, history: [], error };
  const r = data?.data;
  return {
    success: true,
    quote: r?.quote ? mapQuoteToProduct(r.quote) : null,
    history: r?.history ?? [],
    error: null,
  };
}

/**
 * @param {string} patientEmail
 * @param {Object} saleData - { category, productName, unitPrice, totalPrice, metadata, ... }
 * @returns {Promise<{ success: boolean, product?: object, error?: string }>}
 */
export async function recordSale(patientEmail, saleData) {
  const md = saleData.metadata || {};
  const nombre = md.patientName || '';
  const telefono = md.patientPhone || '';
  const patient = await ensurePatient({ nombre, email: patientEmail, telefono });
  if (!patient) return { success: false, product: null, error: 'No se pudo obtener o crear el paciente' };

  const cat = (saleData.category || 'hearing-aid').toLowerCase();
  const categoria = cat === 'service' ? 'SERVICE' : cat === 'accessory' ? 'ACCESSORY' : 'HEARING_AID';

  const base = {
    patientId: patient.id,
    categoria,
    valorUnitario: saleData.unitPrice ?? 0,
    valorTotal: saleData.totalPrice ?? saleData.unitPrice * (saleData.quantity || 1),
    descuento: saleData.discount ?? 0,
    notas: saleData.notes || null,
  };

  if (categoria === 'SERVICE') {
    const payload = {
      ...base,
      marca: null,
      modelo: null,
      cantidad: 1,
      descripcionConsulta: md.descripcionConsulta || saleData.model || '',
      fechaConsulta: md.fechaConsulta ? (md.fechaConsulta.includes('T') ? md.fechaConsulta : `${md.fechaConsulta}T12:00:00.000Z`) : null,
    };
    const { data, error } = await api.post('/api/products/sales', payload);
    if (error) return { success: false, product: null, error };
    const s = data?.data;
    return { success: !!s, product: s ? mapSaleToProduct(s) : null, error: s ? null : 'Error al crear venta' };
  }

  if (categoria === 'ACCESSORY') {
    const acc = md.accesoriosItems || [];
    const payload = {
      ...base,
      marca: null,
      modelo: saleData.model || (acc.map((a) => a.nombre).join(', ')),
      cantidad: saleData.quantity ?? acc.reduce((sum, a) => sum + (a.cantidad || 1), 0),
      accesoriosItems: acc,
    };
    const { data, error } = await api.post('/api/products/sales', payload);
    if (error) return { success: false, product: null, error };
    const s = data?.data;
    return { success: !!s, product: s ? mapSaleToProduct(s) : null, error: s ? null : 'Error al crear venta' };
  }

  // HEARING_AID
  const warrantyStart = saleData.adaptationDate || saleData.saleDate || new Date().toISOString().slice(0, 10);
  const we = saleData.warrantyEndDate || null;
  const payload = {
    ...base,
    marca: saleData.brand || '',
    modelo: saleData.model || '',
    cantidad: saleData.quantity ?? 1,
    tecnologia: md.technology || null,
    plataforma: md.platform || null,
    recargable: (md.rechargeable || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : null,
    anosGarantia: md.warrantyYears ?? null,
    seguroPerdida: (md.seguroPerdidaRobo || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : null,
    seguroRotura: (md.seguroRotura || 'NO').toUpperCase().slice(0, 2) === 'SI' ? 'SI' : null,
    campaignId: md.campaignId && /^[0-9a-f-]{36}$/i.test(String(md.campaignId)) ? md.campaignId : null,
    fechaAdaptacion: saleData.adaptationDate ? (saleData.adaptationDate.includes('T') ? saleData.adaptationDate : `${saleData.adaptationDate}T12:00:00.000Z`) : null,
    fechaFinGarantia: we ? (we.includes('T') ? we : `${we}T12:00:00.000Z`) : null,
    fechaPrimerControl: md.firstControlDate ? (String(md.firstControlDate).includes('T') ? md.firstControlDate : `${md.firstControlDate}T12:00:00.000Z`) : null,
    fechaPrimerMantenimiento: md.firstMaintenanceDate ? (String(md.firstMaintenanceDate).includes('T') ? md.firstMaintenanceDate : `${md.firstMaintenanceDate}T12:00:00.000Z`) : null,
    accesoriosItems: md.accesoriosItems || md.accessories || null,
    metadata: md.images?.length ? { images: md.images } : null,
  };

  const { data, error } = await api.post('/api/products/sales', payload);
  if (error) return { success: false, product: null, error };
  const s = data?.data;
  return { success: !!s, product: s ? mapSaleToProduct(s) : null, error: s ? null : 'Error al crear venta' };
}

/**
 * @param {string} _patientEmail - No usado en API; se mantiene por compatibilidad.
 * @param {string} quoteId - UUID de la cotización
 * @param {Object} saleData - { fechaAdaptacion, fechaFinGarantia, fechaPrimerControl, fechaPrimerMantenimiento, notas }
 * @returns {Promise<{ success: boolean, sale?: object, error?: string }>}
 */
export async function convertQuoteToSale(_patientEmail, quoteId, saleData = {}) {
  if (!quoteId || !/^[0-9a-f-]{36}$/i.test(String(quoteId))) {
    return { success: false, sale: null, error: 'ID de cotización inválido' };
  }
  const body = {};
  if (saleData.fechaAdaptacion) body.fechaAdaptacion = saleData.fechaAdaptacion.includes('T') ? saleData.fechaAdaptacion : `${saleData.fechaAdaptacion}T12:00:00.000Z`;
  if (saleData.fechaFinGarantia) body.fechaFinGarantia = saleData.fechaFinGarantia.includes('T') ? saleData.fechaFinGarantia : `${saleData.fechaFinGarantia}T12:00:00.000Z`;
  if (saleData.fechaPrimerControl) body.fechaPrimerControl = saleData.fechaPrimerControl.includes('T') ? saleData.fechaPrimerControl : `${saleData.fechaPrimerControl}T12:00:00.000Z`;
  if (saleData.fechaPrimerMantenimiento) body.fechaPrimerMantenimiento = saleData.fechaPrimerMantenimiento.includes('T') ? saleData.fechaPrimerMantenimiento : `${saleData.fechaPrimerMantenimiento}T12:00:00.000Z`;
  if (saleData.notas != null) body.notas = saleData.notas;

  const { data, error } = await api.post(`/api/products/quotes/${quoteId}/convert`, body);
  if (error) return { success: false, sale: null, error };
  const s = data?.data;
  return { success: !!s, sale: s ? mapSaleToProduct(s) : null, error: s ? null : 'Error al convertir cotización' };
}

// --- localStorage (legacy / adaptaciones) ---

const load = () => {
  try {
    const raw = typeof window !== 'undefined' && localStorage && localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const save = (obj) => {
  try {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(obj));
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      return true;
    }
  } catch (e) {
    console.error('productService save:', e);
  }
  return false;
};

export function addPatientProduct(patientEmail, productData) {
  const all = load();
  if (!all[patientEmail]) all[patientEmail] = [];
  const product = {
    id: `product_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    patientEmail,
    ...productData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all[patientEmail].push(product);
  all[patientEmail].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return save(all) ? { success: true, product, error: null } : { success: false, product: null, error: 'Error al guardar' };
}

export function updateProduct(patientEmail, productId, updates) {
  const all = load();
  const arr = all[patientEmail];
  if (!arr) return { success: false, product: null, error: 'Paciente no encontrado' };
  const i = arr.findIndex((p) => p.id === productId);
  if (i === -1) return { success: false, product: null, error: 'Producto no encontrado' };
  arr[i] = { ...arr[i], ...updates, updatedAt: new Date().toISOString() };
  return save(all) ? { success: true, product: arr[i], error: null } : { success: false, product: null, error: 'Error al actualizar' };
}

export function deleteProduct(patientEmail, productId) {
  const all = load();
  if (!all[patientEmail]) return { success: false, error: 'Paciente no encontrado' };
  all[patientEmail] = all[patientEmail].filter((p) => p.id !== productId);
  return save(all) ? { success: true, error: null } : { success: false, error: 'Error al eliminar' };
}

export function recordAdaptation(patientEmail, adaptationData) {
  return addPatientProduct(patientEmail, {
    type: 'adaptation',
    productName: adaptationData.productName || '',
    brand: adaptationData.brand,
    model: adaptationData.model,
    category: adaptationData.category || 'hearing-aid',
    quantity: adaptationData.quantity ?? 1,
    status: 'adapted',
    adaptationDate: adaptationData.adaptationDate || new Date().toISOString().slice(0, 10),
    notes: adaptationData.notes || '',
    metadata: adaptationData.metadata || {},
  });
}
