/**
 * Catálogo de productos para cotizar, guardado en la base de datos para que
 * todos los usuarios del CRM vean lo mismo.
 *
 * La relación con campañas usa Campaign.catalogProductIds (ya existente):
 * un producto pertenece a una campaña si su id está en ese arreglo.
 */

const prisma = require('../db');

const SEMILLA = [
  {
    marca: 'Widex', nombre: 'Widex Allure 220', tecnologia: '220', plataforma: 'Allure', linea: 'RIC R D · Chip W1',
    sub: 'RIC R D · Plataforma 2025', etiqueta: 'Lo más reciente', imagen: '/img/productos/widex/allure.webp', valor: 8314000,
    atributos: [
      { i: 'chip', t: 'Chip W1', d: 'Aprox. 4 veces más velocidad y memoria.' },
      { i: 'onda', t: 'PureSound + ZeroDelay', d: 'Procesamiento de 0,5 ms, sonido natural.' },
      { i: 'enfoque', t: 'Clasificador de entornos', d: 'Se adapta automáticamente en tiempo real.' },
      { i: 'bluetooth', t: 'Bluetooth LE Audio', d: 'Preparado para Auracast (actualización futura).' },
      { i: 'celular', t: 'Llamadas manos libres', d: 'iPhone y Android compatibles.' },
      { i: 'bateria', t: 'Recargable · IP68', d: 'Hasta ~25 h por carga; resistente a polvo y agua.' },
    ],
  },
  {
    marca: 'Widex', nombre: 'Widex SmartRIC 220', tecnologia: '220', plataforma: 'SmartRIC', linea: 'RIC en L · Hasta 37 h',
    sub: 'Diseño en forma de L', etiqueta: 'Mayor autonomía', imagen: '/img/productos/widex/smartric.webp', valor: 7470000,
    atributos: [
      { i: 'oido', t: 'Diseño en L', d: 'Micrófonos alineados con la mirada (~12°) para enfocar la voz.' },
      { i: 'onda', t: 'PureSound + ZeroDelay', d: 'Sonido natural, sin efecto metálico.' },
      { i: 'bateria', t: 'Hasta 37 h por carga', d: 'Más de un día completo de uso.' },
      { i: 'estuche', t: 'Estuche portátil', d: 'Varias cargas completas; USB-C e inalámbrico.' },
      { i: 'ia', t: 'Inteligencia artificial', d: 'MySound / SoundSense Learn personalizan el sonido.' },
      { i: 'celular', t: 'Streaming', d: 'iPhone y Android compatibles; control por app.' },
    ],
  },
  {
    marca: 'Widex', nombre: 'Widex Moment 220', tecnologia: '220', plataforma: 'Moment', linea: 'Sheer sRIC R D',
    sub: 'Sheer sRIC R D', etiqueta: 'Discreto y versátil', imagen: '/img/productos/widex/moment.webp', valor: 6963000,
    atributos: [
      { i: 'onda', t: 'PureSound + ZeroDelay', d: 'Reconocido por su naturalidad sonora.' },
      { i: 'ajustes', t: 'Speech Enhancer', d: 'Habla más clara con reducción de ruido.' },
      { i: 'ia', t: 'SoundSense Adapt', d: 'App Moment con SoundSense Learn.' },
      { i: 'hoja', t: 'Zen / Relax', d: 'Sonidos de apoyo en el manejo de tinnitus.' },
      { i: 'tv', t: 'Streaming', d: 'iOS, Android compatibles y TV PLAY.' },
      { i: 'agua', t: 'Recargable · IP68', d: 'Ion-litio; resistente a polvo y agua.' },
    ],
  },
];

const CAMPOS = ['tipo', 'marca', 'nombre', 'tecnologia', 'plataforma', 'linea', 'sub', 'etiqueta', 'imagen', 'atributos', 'valor', 'anosGarantia', 'recargable', 'fichas', 'fotos', 'activo'];

function limpiar(data) {
  const out = {};
  for (const k of CAMPOS) if (data[k] !== undefined) out[k] = data[k];
  if (out.valor !== undefined) out.valor = Number(out.valor) || 0;
  if (out.anosGarantia !== undefined) out.anosGarantia = Number(out.anosGarantia) || 2;
  if (out.atributos !== undefined && !Array.isArray(out.atributos)) out.atributos = [];
  if (out.nombre !== undefined) out.nombre = String(out.nombre).trim();
  // La foto principal de la galería es la que usa la propuesta.
  if (Array.isArray(out.fotos)) {
    const principal = out.fotos.find((f) => f.principal) || out.fotos[0];
    if (principal && out.imagen === undefined) out.imagen = principal.url;
  }
  if (out.marca !== undefined) out.marca = String(out.marca).trim();
  return out;
}

/** Carga los 3 Widex de base la primera vez que se abre el catálogo. */
async function sembrarSiVacio() {
  const n = await prisma.catalogoProducto.count();
  if (n === 0) await prisma.catalogoProducto.createMany({ data: SEMILLA });
}

async function listar({ incluirInactivos = false } = {}) {
  await sembrarSiVacio();
  const [productos, campanas] = await Promise.all([
    prisma.catalogoProducto.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: [{ marca: 'asc' }, { valor: 'desc' }],
    }),
    prisma.campaign.findMany({
      select: { id: true, nombre: true, estado: true, fechaInicio: true, fechaFin: true, descuentoAprobado: true,
        aplicacionDescuento: true, validezCantidadAudifonos: true, fabricante: true, catalogProductIds: true },
      orderBy: { fechaInicio: 'desc' },
    }),
  ]);
  const ahora = new Date();
  const vigente = (c) => c.estado === 'ACTIVA' && new Date(c.fechaInicio) <= ahora && new Date(c.fechaFin) >= ahora;
  return {
    productos: productos.map((p) => ({
      ...p,
      campanas: campanas.filter((c) => (c.catalogProductIds || []).includes(p.id))
        .map(({ catalogProductIds, ...c }) => ({ ...c, vigente: vigente(c) })),
    })),
    campanas: campanas.map(({ catalogProductIds, ...c }) => ({ ...c, vigente: vigente(c), productos: (catalogProductIds || []).length })),
  };
}

async function crear(data) {
  const d = limpiar(data);
  if (!d.nombre || !d.marca) throw Object.assign(new Error('Marca y nombre son obligatorios'), { status: 400 });
  const p = await prisma.catalogoProducto.create({ data: d });
  if (Array.isArray(data.campaignIds)) await asignarCampanas(p.id, data.campaignIds);
  return p;
}

async function actualizar(id, data) {
  const p = await prisma.catalogoProducto.update({ where: { id }, data: limpiar(data) });
  if (Array.isArray(data.campaignIds)) await asignarCampanas(id, data.campaignIds);
  return p;
}

/** Se desactiva en vez de borrar: las cotizaciones viejas pueden apuntar a él. */
async function eliminar(id) {
  return prisma.catalogoProducto.update({ where: { id }, data: { activo: false } });
}

/** Deja el producto exactamente en las campañas indicadas. */
async function asignarCampanas(productId, campaignIds) {
  const quiero = new Set(campaignIds);
  const campanas = await prisma.campaign.findMany({ select: { id: true, catalogProductIds: true } });
  const cambios = [];
  for (const c of campanas) {
    const ids = c.catalogProductIds || [];
    const tiene = ids.includes(productId);
    if (quiero.has(c.id) && !tiene) cambios.push(prisma.campaign.update({ where: { id: c.id }, data: { catalogProductIds: [...ids, productId] } }));
    if (!quiero.has(c.id) && tiene) cambios.push(prisma.campaign.update({ where: { id: c.id }, data: { catalogProductIds: ids.filter((x) => x !== productId) } }));
  }
  if (cambios.length) await prisma.$transaction(cambios);
}

/**
 * Importa filas (ya leídas del Excel/CSV en el navegador).
 * Si existe un producto activo con la misma marca y nombre, lo actualiza.
 * fila: { marca, nombre, tecnologia, plataforma, linea, sub, etiqueta, valor, anosGarantia, recargable, atributos[], campanas[] (nombres) }
 */
async function importar(filas) {
  const campanas = await prisma.campaign.findMany({ select: { id: true, nombre: true } });
  const porNombre = new Map(campanas.map((c) => [c.nombre.trim().toLowerCase(), c.id]));
  const res = { creados: 0, actualizados: 0, errores: [] };
  for (const [i, f] of filas.entries()) {
    try {
      if (!f.marca || !f.nombre) throw new Error('falta marca o nombre');
      const existente = await prisma.catalogoProducto.findFirst({
        where: { activo: true, marca: { equals: String(f.marca).trim(), mode: 'insensitive' }, nombre: { equals: String(f.nombre).trim(), mode: 'insensitive' } },
      });
      const campaignIds = Array.isArray(f.campanas) && f.campanas.length
        ? f.campanas.map((n) => porNombre.get(String(n).trim().toLowerCase())).filter(Boolean) : undefined;
      if (existente) {
        await actualizar(existente.id, { ...f, marca: existente.marca, nombre: existente.nombre, campaignIds });
        res.actualizados++;
      } else {
        await crear({ ...f, campaignIds });
        res.creados++;
      }
    } catch (e) {
      res.errores.push({ fila: i + 2, error: e.message });
    }
  }
  return res;
}

/**
 * Agrega una ficha a un producto existente. Los datos leídos solo llenan
 * campos vacíos: lo que el equipo ya escribió a mano se respeta.
 */
async function agregarFicha(id, ficha, datos) {
  const p = await prisma.catalogoProducto.findUnique({ where: { id } });
  if (!p) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
  const data = { fichas: [...(Array.isArray(p.fichas) ? p.fichas : []), ficha] };
  if (datos) {
    for (const k of ['plataforma', 'tecnologia', 'linea', 'sub', 'etiqueta']) if (!p[k] && datos[k]) data[k] = datos[k];
    if ((!Array.isArray(p.atributos) || p.atributos.length === 0) && datos.atributos?.length) data.atributos = datos.atributos;
  }
  return prisma.catalogoProducto.update({ where: { id }, data });
}

const unir = (a, b, key) => {
  const out = [...(Array.isArray(a) ? a : [])];
  for (const x of (Array.isArray(b) ? b : [])) if (x && x[key] && !out.some((y) => y[key] === x[key])) out.push(x);
  return out;
};

/**
 * Guarda el resultado de la carga masiva. Cada item crea un producto nuevo o,
 * con existenteId, suma fotos y fichas a uno existente y llena campos vacíos.
 */
async function guardarLote(items) {
  const res = { creados: 0, actualizados: 0, errores: [] };
  for (const it of items) {
    try {
      if (it.existenteId) {
        const p = await prisma.catalogoProducto.findUnique({ where: { id: it.existenteId } });
        if (!p) throw new Error('producto no encontrado');
        const fotos = unir(p.fotos, it.fotos, 'url');
        const data = { fotos, fichas: unir(p.fichas, it.fichas, 'url') };
        for (const k of ['plataforma', 'tecnologia', 'linea', 'sub', 'etiqueta']) if (!p[k] && it[k]) data[k] = it[k];
        if ((!Array.isArray(p.atributos) || !p.atributos.length) && it.atributos?.length) data.atributos = it.atributos;
        if (Number(it.valor) > 0) data.valor = Number(it.valor);
        if (!p.imagen && fotos.length) data.imagen = (fotos.find((f) => f.principal) || fotos[0]).url;
        await prisma.catalogoProducto.update({ where: { id: p.id }, data });
        res.actualizados++;
      } else {
        await crear(it);
        res.creados++;
      }
    } catch (e) {
      res.errores.push({ producto: it.nombre || '(sin nombre)', error: e.message });
    }
  }
  return res;
}

module.exports = { listar, crear, actualizar, eliminar, asignarCampanas, importar, agregarFicha, guardarLote };
