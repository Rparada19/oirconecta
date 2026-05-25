const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Público: listar fichas activas (con filtros opcionales) ──
router.get('/', async (req, res) => {
  try {
    const { marca, tecnologia, plataforma } = req.query;
    const where = { activo: true };
    if (marca) where.marca = marca;
    if (tecnologia) where.tecnologia = tecnologia;
    if (plataforma) where.plataforma = plataforma;
    const items = await prisma.comparadorItem.findMany({
      where, orderBy: [{ marca: 'asc' }, { precio: 'asc' }],
    });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: valores disponibles para los filtros ──
router.get('/facetas', async (_req, res) => {
  try {
    const items = await prisma.comparadorItem.findMany({
      where: { activo: true }, select: { marca: true, tecnologia: true, plataforma: true },
    });
    const uniq = (k) => [...new Set(items.map((i) => i[k]).filter(Boolean))].sort();
    res.json({ success: true, data: { marcas: uniq('marca'), tecnologias: uniq('tecnologia'), plataformas: uniq('plataforma') } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: listar todas ──
router.get('/admin/all', authenticate, async (_req, res) => {
  try {
    const items = await prisma.comparadorItem.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const sanitize = (b) => ({
  marca: b.marca ? String(b.marca).trim() : undefined,
  tecnologia: b.tecnologia ? String(b.tecnologia).trim() : undefined,
  plataforma: b.plataforma ? String(b.plataforma).trim() : undefined,
  modelo: b.modelo !== undefined ? (b.modelo ? String(b.modelo).trim() : null) : undefined,
  fortalezas: b.fortalezas !== undefined ? (b.fortalezas || null) : undefined,
  debilidades: b.debilidades !== undefined ? (b.debilidades || null) : undefined,
  uso: b.uso !== undefined ? (b.uso || null) : undefined,
  consejos: b.consejos !== undefined ? (b.consejos || null) : undefined,
  precio: b.precio !== undefined ? (b.precio === '' || b.precio == null ? null : Number(b.precio)) : undefined,
  imageUrl: b.imageUrl !== undefined ? (b.imageUrl || null) : undefined,
  activo: b.activo !== undefined ? !!b.activo : undefined,
});

// ── Admin: crear ──
router.post('/admin', authenticate, async (req, res) => {
  try {
    const b = req.body;
    if (!b.marca || !b.tecnologia || !b.plataforma) {
      return res.status(400).json({ success: false, error: 'Marca, tecnología y plataforma son requeridos' });
    }
    const data = sanitize(b);
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const item = await prisma.comparadorItem.create({ data });
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: actualizar ──
router.patch('/admin/:id', authenticate, async (req, res) => {
  try {
    const data = sanitize(req.body);
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const item = await prisma.comparadorItem.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: eliminar ──
router.delete('/admin/:id', authenticate, async (req, res) => {
  try {
    await prisma.comparadorItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
