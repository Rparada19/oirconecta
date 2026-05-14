/**
 * Catálogo marketplace (config local): etiquetas y marca para UI.
 * Las marcas coinciden con `MARCAS` en campaignService.js.
 */

import { MARCAS } from '../services/campaignService';

export { MARCAS as MARCAS_CATALOGO };

/** Clave interna para agrupar productos sin marca. */
export const MARCA_CATALOGO_SIN_MARCA = '__SIN_MARCA__';

/** Clave interna para agrupar por plataforma vacía. */
export const PLATAFORMA_CATALOGO_SIN = '__SIN_PLATAFORMA__';

/** Clave interna: todos los accesorios de la marca van en esta pestaña. */
export const PLATAFORMA_CATALOGO_ACCESORIOS = '__ACCESORIOS__';

/** Valores persistidos en `tipoCatalogo` del ítem del catálogo. */
export const TIPO_CATALOGO_AUDIFONO = 'AUDIFONO';
export const TIPO_CATALOGO_ACCESORIO = 'ACCESORIO';

/** Normaliza tipo de catálogo (compat. productos antiguos sin campo). */
export function tipoCatalogoNorm(p) {
  const t = String(p?.tipoCatalogo ?? '').trim().toUpperCase();
  return t === TIPO_CATALOGO_ACCESORIO ? TIPO_CATALOGO_ACCESORIO : TIPO_CATALOGO_AUDIFONO;
}

export function esProductoAccesorio(p) {
  return tipoCatalogoNorm(p) === TIPO_CATALOGO_ACCESORIO;
}

/** Texto corto para listas (marca · tecnología · plataforma). */
export function etiquetaProductoCatalogo(p) {
  if (!p) return '—';
  if (esProductoAccesorio(p)) {
    const d = (p.descripcion || '').trim();
    if (d) return d.length > 96 ? `${d.slice(0, 96)}…` : d;
    const parts = [p.marca, p.tecnologia].map((x) => (x != null ? String(x).trim() : '')).filter(Boolean);
    return parts.length ? `Accesorio · ${parts.join(' · ')}` : 'Accesorio';
  }
  const parts = [p.marca, p.tecnologia, p.plataforma]
    .map((x) => (x != null ? String(x).trim() : ''))
    .filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (p.nombre && String(p.nombre).trim()) return String(p.nombre).trim();
  return p.id || 'Producto';
}

/** Valor del Select de marca: clave de MARCAS o '__OTRA__'. */
export function marcaProductoSelectValue(marca) {
  const m = (marca || '').trim();
  if (!m) return '';
  return MARCAS.includes(m) ? m : '__OTRA__';
}

/** Precio del ítem en catálogo (`valor`; compat. con `valorUnitario` / `valorTotal` antiguos). */
export function valorCatalogoProducto(p) {
  if (!p) return null;
  if (p.valor != null && p.valor !== '') {
    const n = Number(p.valor);
    return Number.isFinite(n) ? n : null;
  }
  if (p.valorUnitario != null && p.valorUnitario !== '') {
    const n = Number(p.valorUnitario);
    return Number.isFinite(n) ? n : null;
  }
  if (p.valorTotal != null && p.valorTotal !== '') {
    const n = Number(p.valorTotal);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Orden en disco / UI: por marca (sin marca al final), luego por id. */
export function sortProductosPorMarcaCatalog(productos) {
  const list = Array.isArray(productos) ? productos : [];
  return [...list].sort((a, b) => {
    const rawA = (a.marca || '').trim();
    const rawB = (b.marca || '').trim();
    const kA = rawA || MARCA_CATALOGO_SIN_MARCA;
    const kB = rawB || MARCA_CATALOGO_SIN_MARCA;
    if (kA === MARCA_CATALOGO_SIN_MARCA && kB !== MARCA_CATALOGO_SIN_MARCA) return 1;
    if (kB === MARCA_CATALOGO_SIN_MARCA && kA !== MARCA_CATALOGO_SIN_MARCA) return -1;
    const c = kA.localeCompare(kB, 'es', { sensitivity: 'base' });
    if (c !== 0) return c;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

/** Agrupa productos del catálogo por marca (cajón por marca). */
export function groupProductosPorMarcaCatalog(productos) {
  const list = Array.isArray(productos) ? productos : [];
  const map = new Map();
  for (const p of list) {
    const raw = (p.marca || '').trim();
    const key = raw || MARCA_CATALOGO_SIN_MARCA;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === MARCA_CATALOGO_SIN_MARCA) return 1;
    if (b === MARCA_CATALOGO_SIN_MARCA) return -1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });
  return keys.map((key) => ({
    key,
    label: key === MARCA_CATALOGO_SIN_MARCA ? 'Sin marca' : key,
    items: map.get(key),
  }));
}

/** Clave estable para agrupar por plataforma (accesorios comparten una pestaña). */
export function plataformaCatalogoKey(p) {
  if (esProductoAccesorio(p)) return PLATAFORMA_CATALOGO_ACCESORIOS;
  const t = (p?.plataforma || '').trim();
  return t || PLATAFORMA_CATALOGO_SIN;
}

export function plataformaCatalogoLabel(key) {
  if (key === PLATAFORMA_CATALOGO_SIN) return 'Sin plataforma';
  if (key === PLATAFORMA_CATALOGO_ACCESORIOS) return 'Accesorios';
  return key;
}

/** Lista ordenada de claves de plataforma presentes en `items`. */
export function plataformasKeysSorted(items) {
  const list = Array.isArray(items) ? items : [];
  const keys = [...new Set(list.map(plataformaCatalogoKey))];
  const rank = (k) => {
    if (k === PLATAFORMA_CATALOGO_SIN) return 2;
    if (k === PLATAFORMA_CATALOGO_ACCESORIOS) return 1;
    return 0;
  };
  keys.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });
  return keys;
}
