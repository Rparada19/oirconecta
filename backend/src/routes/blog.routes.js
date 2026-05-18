const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Público: listar posts publicados ──
router.get('/', async (req, res) => {
  try {
    const { categoria, tag, limit = 20, offset = 0 } = req.query;
    const where = { estado: 'PUBLICADO' };
    if (categoria) where.categoria = categoria;
    if (tag) where.tags = { has: tag };
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where, orderBy: { publishedAt: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
        select: { id: true, slug: true, titulo: true, resumen: true, coverUrl: true,
          categoria: true, tags: true, autorNombre: true, publishedAt: true, destacado: true },
      }),
      prisma.blogPost.count({ where }),
    ]);
    res.json({ success: true, data: posts, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Público: obtener post por slug ──
router.get('/:slug', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
    if (!post || post.estado !== 'PUBLICADO') return res.status(404).json({ success: false, error: 'Post no encontrado' });
    res.json({ success: true, data: post });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: listar todos (incluyendo borradores) ──
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    const where = estado ? { estado } : {};
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where, orderBy: { updatedAt: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
      }),
      prisma.blogPost.count({ where }),
    ]);
    res.json({ success: true, data: posts, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: crear post ──
router.post('/', authenticate, async (req, res) => {
  try {
    const { titulo, resumen, contenido, coverUrl, categoria, tags, estado, destacado, autorNombre, slug } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ success: false, error: 'Título y contenido son requeridos' });
    const finalSlug = slug || titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post = await prisma.blogPost.create({
      data: {
        slug: finalSlug, titulo, resumen, contenido, coverUrl,
        categoria: categoria || 'general', tags: tags || [],
        estado: estado || 'BORRADOR', destacado: destacado || false,
        autorNombre: autorNombre || 'OírConecta',
        publishedAt: estado === 'PUBLICADO' ? new Date() : null,
      },
    });
    res.status(201).json({ success: true, data: post });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, error: 'El slug ya existe' });
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Admin: actualizar post ──
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { titulo, resumen, contenido, coverUrl, categoria, tags, estado, destacado, autorNombre } = req.body;
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Post no encontrado' });
    const wasPublished = existing.estado === 'PUBLICADO';
    const nowPublished = estado === 'PUBLICADO';
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(titulo && { titulo }), ...(resumen !== undefined && { resumen }),
        ...(contenido && { contenido }), ...(coverUrl !== undefined && { coverUrl }),
        ...(categoria && { categoria }), ...(tags && { tags }),
        ...(estado && { estado }), ...(destacado !== undefined && { destacado }),
        ...(autorNombre && { autorNombre }),
        ...(!wasPublished && nowPublished ? { publishedAt: new Date() } : {}),
      },
    });
    res.json({ success: true, data: post });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: eliminar post ──
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Post eliminado' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
