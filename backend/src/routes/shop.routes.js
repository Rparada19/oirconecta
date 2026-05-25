const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getPaymentProvider } = require('../services/payment');

const prisma = new PrismaClient();

const CATEGORIAS = ['BATERIAS', 'FILTROS', 'OLIVAS', 'CONECTIVIDAD', 'ACCESORIOS'];

// Normaliza variantes: [{ nombre, precio?, stock? }]
function normVariantes(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => ({
      nombre: String(v?.nombre ?? '').trim(),
      precio: v?.precio === '' || v?.precio == null ? null : Number(v.precio),
      stock: v?.stock === '' || v?.stock == null ? null : parseInt(v.stock, 10),
    }))
    .filter((v) => v.nombre);
}

// ── Público: listar productos activos ──
router.get('/products', async (req, res) => {
  try {
    const { categoria, q, limit = 48, offset = 0 } = req.query;
    const where = { activo: true };
    if (categoria && CATEGORIAS.includes(categoria)) where.categoria = categoria;
    if (q) where.nombre = { contains: q, mode: 'insensitive' };
    const [products, total] = await Promise.all([
      prisma.shopProduct.findMany({
        where,
        orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
        take: parseInt(limit), skip: parseInt(offset),
      }),
      prisma.shopProduct.count({ where }),
    ]);
    res.json({ success: true, data: products, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: detalle de producto ──
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.shopProduct.findFirst({
      where: { id: req.params.id, activo: true },
    });
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, data: product });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: listar todos ──
router.get('/admin/products', authenticate, async (req, res) => {
  try {
    const { categoria, activo, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (categoria && CATEGORIAS.includes(categoria)) where.categoria = categoria;
    if (activo === 'true') where.activo = true;
    if (activo === 'false') where.activo = false;
    const [products, total] = await Promise.all([
      prisma.shopProduct.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
      }),
      prisma.shopProduct.count({ where }),
    ]);
    res.json({ success: true, data: products, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: crear ──
router.post('/admin/products', authenticate, async (req, res) => {
  try {
    const { nombre, descripcion, categoria, marca, sku, precio, precioAntes, stock, activo, destacado, imageUrls, variantes } = req.body;
    if (!nombre || !categoria || precio == null) {
      return res.status(400).json({ success: false, error: 'Nombre, categoría y precio son requeridos' });
    }
    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ success: false, error: 'Categoría inválida (no se venden audífonos por web)' });
    }
    const product = await prisma.shopProduct.create({
      data: {
        nombre, descripcion: descripcion || null, categoria, marca: marca || null,
        sku: sku || null, precio: Number(precio),
        precioAntes: precioAntes != null && precioAntes !== '' ? Number(precioAntes) : null,
        stock: stock != null ? parseInt(stock) : 0,
        activo: activo !== undefined ? !!activo : true,
        destacado: !!destacado,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        variantes: normVariantes(variantes),
      },
    });
    res.status(201).json({ success: true, data: product });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: actualizar ──
router.patch('/admin/products/:id', authenticate, async (req, res) => {
  try {
    const b = req.body;
    if (b.categoria && !CATEGORIAS.includes(b.categoria)) {
      return res.status(400).json({ success: false, error: 'Categoría inválida (no se venden audífonos por web)' });
    }
    const data = {};
    for (const k of ['nombre', 'descripcion', 'categoria', 'marca', 'sku', 'imageUrls']) {
      if (b[k] !== undefined) data[k] = b[k];
    }
    if (b.precio !== undefined) data.precio = Number(b.precio);
    if (b.precioAntes !== undefined) data.precioAntes = b.precioAntes === '' || b.precioAntes == null ? null : Number(b.precioAntes);
    if (b.stock !== undefined) data.stock = parseInt(b.stock);
    if (b.activo !== undefined) data.activo = !!b.activo;
    if (b.destacado !== undefined) data.destacado = !!b.destacado;
    if (b.variantes !== undefined) data.variantes = normVariantes(b.variantes);
    const product = await prisma.shopProduct.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: product });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: importación masiva ──
router.post('/admin/products/bulk', authenticate, async (req, res) => {
  try {
    const { products } = req.body || {};
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'No se recibieron productos' });
    }
    let created = 0;
    const errors = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const fila = i + 2; // fila en el Excel (asumiendo encabezado en la 1)
      try {
        if (!p.nombre || !p.categoria || p.precio == null || p.precio === '') {
          errors.push(`Fila ${fila}: faltan nombre, categoría o precio`);
          continue;
        }
        if (!CATEGORIAS.includes(p.categoria)) {
          errors.push(`Fila ${fila}: categoría inválida "${p.categoria}" (no se venden audífonos)`);
          continue;
        }
        await prisma.shopProduct.create({
          data: {
            nombre: String(p.nombre).trim(),
            descripcion: p.descripcion ? String(p.descripcion) : null,
            categoria: p.categoria,
            marca: p.marca ? String(p.marca).trim() : null,
            sku: p.sku ? String(p.sku).trim() : null,
            precio: Number(p.precio),
            precioAntes: p.precioAntes != null && p.precioAntes !== '' ? Number(p.precioAntes) : null,
            stock: p.stock != null && p.stock !== '' ? parseInt(p.stock, 10) : 0,
            activo: p.activo !== undefined ? !!p.activo : true,
            destacado: !!p.destacado,
            imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
            variantes: normVariantes(p.variantes),
          },
        });
        created++;
      } catch (err) {
        errors.push(`Fila ${fila}: ${err.message}`);
      }
    }
    res.json({ success: true, data: { created, total: products.length, errors } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: eliminar ──
router.delete('/admin/products/:id', authenticate, async (req, res) => {
  try {
    await prisma.shopProduct.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: crear pedido ──
// Body: { items:[{productId,cantidad}], contacto:{nombre,email,telefono,documento},
//         envio:{direccion,ciudad,departamento,notas} }
router.post('/orders', async (req, res) => {
  try {
    const { items, contacto, envio } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío' });
    }
    if (!contacto?.nombre || !contacto?.email || !contacto?.telefono) {
      return res.status(400).json({ success: false, error: 'Nombre, email y teléfono son requeridos' });
    }
    if (!envio?.direccion || !envio?.ciudad) {
      return res.status(400).json({ success: false, error: 'Dirección y ciudad de envío son requeridas' });
    }

    // Cargar productos reales (precio y stock del servidor, no del cliente)
    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.shopProduct.findMany({ where: { id: { in: ids }, activo: true } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lineItems = [];
    for (const it of items) {
      const p = byId.get(it.productId);
      const cantidad = parseInt(it.cantidad, 10);
      if (!p) return res.status(400).json({ success: false, error: `Producto no disponible: ${it.productId}` });
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return res.status(400).json({ success: false, error: `Cantidad inválida para ${p.nombre}` });
      }

      const variantes = Array.isArray(p.variantes) ? p.variantes : [];
      let precio = p.precio;
      let varNombre = null;
      let usaVarStock = false;

      if (variantes.length) {
        if (!it.variante) {
          return res.status(400).json({ success: false, error: `Debes elegir una variante de ${p.nombre}` });
        }
        const v = variantes.find((x) => x.nombre === it.variante);
        if (!v) return res.status(400).json({ success: false, error: `Variante no válida para ${p.nombre}` });
        varNombre = v.nombre;
        if (v.precio != null) precio = Number(v.precio);
        if (v.stock != null) {
          usaVarStock = true;
          if (Number(v.stock) < cantidad) {
            return res.status(409).json({ success: false, error: `Stock insuficiente de ${p.nombre} (${v.nombre})` });
          }
        } else if (p.stock < cantidad) {
          return res.status(409).json({ success: false, error: `Stock insuficiente de ${p.nombre}` });
        }
      } else if (p.stock < cantidad) {
        return res.status(409).json({ success: false, error: `Stock insuficiente de ${p.nombre} (disponible: ${p.stock})` });
      }

      lineItems.push({ product: p, cantidad, precio, subtotal: precio * cantidad, variante: varNombre, usaVarStock });
    }

    const subtotal = lineItems.reduce((s, li) => s + li.subtotal, 0);
    const envioCosto = 0; // F2: sin cálculo de envío; se coordina manualmente
    const total = subtotal + envioCosto;

    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.shopCustomer.upsert({
        where: { email: contacto.email.toLowerCase().trim() },
        update: {
          nombre: contacto.nombre, telefono: contacto.telefono,
          documento: contacto.documento || null,
          direccion: envio.direccion, ciudad: envio.ciudad,
          departamento: envio.departamento || null,
        },
        create: {
          nombre: contacto.nombre, email: contacto.email.toLowerCase().trim(),
          telefono: contacto.telefono, documento: contacto.documento || null,
          direccion: envio.direccion, ciudad: envio.ciudad,
          departamento: envio.departamento || null,
        },
      });

      const created = await tx.shopOrder.create({
        data: {
          customerId: customer.id,
          estado: 'PENDIENTE_PAGO',
          subtotal, envio: envioCosto, total,
          envioNombre: contacto.nombre,
          envioTelefono: contacto.telefono,
          envioEmail: contacto.email.toLowerCase().trim(),
          envioDireccion: envio.direccion,
          envioCiudad: envio.ciudad,
          envioDepartamento: envio.departamento || null,
          envioNotas: envio.notas || null,
          items: {
            create: lineItems.map((li) => ({
              productId: li.product.id,
              nombre: li.product.nombre,
              variante: li.variante,
              precioUnitario: li.precio,
              cantidad: li.cantidad,
              subtotal: li.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const li of lineItems) {
        if (li.usaVarStock) {
          const fresh = await tx.shopProduct.findUnique({ where: { id: li.product.id } });
          const vs = Array.isArray(fresh.variantes) ? fresh.variantes : [];
          const updated = vs.map((v) =>
            v.nombre === li.variante ? { ...v, stock: Number(v.stock) - li.cantidad } : v,
          );
          await tx.shopProduct.update({ where: { id: li.product.id }, data: { variantes: updated } });
        } else {
          await tx.shopProduct.update({
            where: { id: li.product.id },
            data: { stock: { decrement: li.cantidad } },
          });
        }
      }
      return created;
    });

    res.status(201).json({ success: true, data: { id: order.id, numero: order.numero, total: order.total, estado: order.estado } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: iniciar pago de un pedido ──
router.post('/orders/:id/pay', async (req, res) => {
  try {
    const order = await prisma.shopOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    if (order.estado !== 'PENDIENTE_PAGO') {
      return res.status(409).json({ success: false, error: 'El pedido ya no está pendiente de pago' });
    }
    const provider = getPaymentProvider();
    const intent = await provider.createIntent(order);
    await prisma.shopOrder.update({
      where: { id: order.id },
      data: { pagoProveedor: provider.name, pagoRef: intent.reference, pagoEstado: intent.status, metodoPago: provider.name },
    });
    res.json({ success: true, data: { reference: intent.reference, redirectUrl: intent.redirectUrl, status: intent.status, provider: provider.name } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Webhook de la pasarela (público; el proveedor lo invoca) ──
router.post('/payments/webhook', async (req, res) => {
  try {
    const provider = getPaymentProvider();
    const evt = provider.parseWebhook(req);
    if (!evt || !evt.reference) return res.status(400).json({ success: false, error: 'Evento inválido' });
    const order = await prisma.shopOrder.findFirst({ where: { pagoRef: evt.reference } });
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado para esa referencia' });

    const data = { pagoEstado: evt.status };
    if (evt.status === 'PAID' && order.estado === 'PENDIENTE_PAGO') data.estado = 'PAGADO';
    if (evt.status === 'FAILED' && order.estado === 'PENDIENTE_PAGO') data.estado = 'CANCELADO';
    await prisma.shopOrder.update({ where: { id: order.id }, data });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: ver un pedido (confirmación) ──
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: listar pedidos ──
router.get('/admin/orders', authenticate, async (req, res) => {
  try {
    const { estado, limit = 100, offset = 0 } = req.query;
    const where = estado ? { estado } : {};
    const [orders, total] = await Promise.all([
      prisma.shopOrder.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
        include: { items: true, customer: { select: { id: true, nombre: true, email: true, telefono: true } } },
      }),
      prisma.shopOrder.count({ where }),
    ]);
    res.json({ success: true, data: orders, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: detalle de pedido ──
router.get('/admin/orders/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true, customer: true },
    });
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: cambiar estado del pedido ──
router.patch('/admin/orders/:id', authenticate, async (req, res) => {
  try {
    const ESTADOS = ['PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
    const { estado } = req.body;
    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }
    const order = await prisma.shopOrder.update({
      where: { id: req.params.id },
      data: { ...(estado && { estado }) },
    });
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: analítica de la tienda ──
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const CONFIRMADOS = ['PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'];
    const [totalPedidos, pendientes, confirmados, agg, clientes, recompra, porEstadoRaw, topRaw] = await Promise.all([
      prisma.shopOrder.count(),
      prisma.shopOrder.count({ where: { estado: 'PENDIENTE_PAGO' } }),
      prisma.shopOrder.count({ where: { estado: { in: CONFIRMADOS } } }),
      prisma.shopOrder.aggregate({ _sum: { total: true }, where: { estado: { in: CONFIRMADOS } } }),
      prisma.shopCustomer.count(),
      prisma.shopCustomer.findMany({ select: { _count: { select: { orders: true } } } }),
      prisma.shopOrder.groupBy({ by: ['estado'], _count: { _all: true } }),
      prisma.shopOrderItem.groupBy({
        by: ['nombre'],
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 5,
      }),
    ]);

    const ventasConfirmadas = agg._sum.total || 0;
    const ticketPromedio = confirmados ? ventasConfirmadas / confirmados : 0;
    const clientesRecompra = recompra.filter((c) => c._count.orders > 1).length;

    res.json({
      success: true,
      data: {
        totalPedidos, pendientes, confirmados,
        ventasConfirmadas, ticketPromedio,
        clientes, clientesRecompra,
        tasaRecompra: clientes ? clientesRecompra / clientes : 0,
        porEstado: porEstadoRaw.map((r) => ({ estado: r.estado, count: r._count._all })),
        topProductos: topRaw.map((r) => ({ nombre: r.nombre, cantidad: r._sum.cantidad || 0, ventas: r._sum.subtotal || 0 })),
      },
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: clientes (con métricas de recompra) ──
router.get('/admin/customers', authenticate, async (req, res) => {
  try {
    const customers = await prisma.shopCustomer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { orders: { select: { total: true, createdAt: true, estado: true } } },
    });
    const data = customers.map((c) => {
      const pedidos = c.orders.length;
      const totalGastado = c.orders.reduce((s, o) => s + (o.total || 0), 0);
      const ultimaCompra = c.orders.reduce((max, o) => (o.createdAt > max ? o.createdAt : max), c.orders[0]?.createdAt || null);
      return {
        id: c.id, nombre: c.nombre, email: c.email, telefono: c.telefono,
        ciudad: c.ciudad, departamento: c.departamento,
        pedidos, totalGastado, ultimaCompra, esRecompra: pedidos > 1,
      };
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
