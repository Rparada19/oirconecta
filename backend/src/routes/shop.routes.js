const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getPaymentProvider } = require('../services/payment');

const prisma = new PrismaClient();

const CATEGORIAS = ['BATERIAS', 'FILTROS', 'OLIVAS', 'CONECTIVIDAD', 'ACCESORIOS'];

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
    const { nombre, descripcion, categoria, marca, sku, precio, precioAntes, stock, activo, destacado, imageUrls } = req.body;
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
    const product = await prisma.shopProduct.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: product });
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
      if (p.stock < cantidad) {
        return res.status(409).json({ success: false, error: `Stock insuficiente de ${p.nombre} (disponible: ${p.stock})` });
      }
      lineItems.push({ product: p, cantidad, subtotal: p.precio * cantidad });
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
              precioUnitario: li.product.precio,
              cantidad: li.cantidad,
              subtotal: li.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const li of lineItems) {
        await tx.shopProduct.update({
          where: { id: li.product.id },
          data: { stock: { decrement: li.cantidad } },
        });
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
