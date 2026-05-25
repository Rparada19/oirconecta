const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { generarComparacion } = require('../services/comparadorAI');

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

// ── Público: comparación con IA ──
// Body: { candidatos:[{marca,tecnologia,plataforma}], test:{...} } (1–3 candidatos)
router.post('/ai-compare', async (req, res) => {
  try {
    const { candidatos, test } = req.body || {};
    if (!Array.isArray(candidatos) || candidatos.length < 1 || candidatos.length > 3) {
      return res.status(400).json({ success: false, error: 'Selecciona entre 1 y 3 opciones' });
    }
    for (const c of candidatos) {
      if (!c?.marca || !c?.tecnologia || !c?.plataforma) {
        return res.status(400).json({ success: false, error: 'Cada opción requiere marca, tecnología y plataforma' });
      }
    }

    // Adjuntar la ficha real (precio + notas del editor) a cada candidato.
    const enriquecidos = await Promise.all(candidatos.map(async (c) => {
      const item = await prisma.comparadorItem.findFirst({
        where: { marca: c.marca, tecnologia: c.tecnologia, plataforma: c.plataforma, activo: true },
      });
      return {
        ...c,
        modelo: item?.modelo || null,
        ref: item ? {
          precio: item.precio, fortalezas: item.fortalezas, debilidades: item.debilidades,
          uso: item.uso, consejos: item.consejos,
        } : {},
      };
    }));

    const ia = await generarComparacion(enriquecidos, test);
    // Devolvemos también el precio real de cada candidato (fuente: BD, no IA).
    const precios = enriquecidos.map((c) => ({
      etiqueta: [c.marca, c.tecnologia, c.plataforma].join(' · '),
      precio: c.ref?.precio ?? null,
      modelo: c.modelo,
    }));
    res.json({ success: true, data: { ...ia, precios } });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, error: e.message });
  }
});

// ── Público: dejar solicitud de orientación (lead) ──
router.post('/leads', async (req, res) => {
  try {
    const { nombre, telefono, email, ciudad, marcaSugerida, candidatos, test } = req.body || {};
    if (!nombre || !telefono) {
      return res.status(400).json({ success: false, error: 'Nombre y teléfono son requeridos' });
    }
    const lead = await prisma.comparadorLead.create({
      data: {
        nombre: String(nombre).trim(),
        telefono: String(telefono).trim(),
        email: email ? String(email).trim() : null,
        ciudad: ciudad ? String(ciudad).trim() : null,
        marcaSugerida: marcaSugerida || null,
        candidatos: Array.isArray(candidatos) ? candidatos : undefined,
        test: test || undefined,
      },
    });
    res.status(201).json({ success: true, data: { id: lead.id } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: listar solicitudes ──
router.get('/admin/leads', authenticate, async (req, res) => {
  try {
    const { estado } = req.query;
    const where = estado ? { estado } : {};
    const leads = await prisma.comparadorLead.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: leads });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: actualizar solicitud (estado / notas) ──
router.patch('/admin/leads/:id', authenticate, async (req, res) => {
  try {
    const { estado, notas } = req.body;
    const lead = await prisma.comparadorLead.update({
      where: { id: req.params.id },
      data: { ...(estado && { estado }), ...(notas !== undefined && { notas }) },
    });
    res.json({ success: true, data: lead });
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
