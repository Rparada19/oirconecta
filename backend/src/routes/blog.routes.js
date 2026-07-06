const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { BLOG_SECTIONS, normalizeSection } = require('../config/blogSections');

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

// ── Público: secciones del blog con conteo de posts publicados ──
// IMPORTANTE: debe ir ANTES de `/:slug` para que no lo capture esa ruta.
router.get('/sections', async (_req, res) => {
  try {
    const grouped = await prisma.blogPost.groupBy({
      by: ['categoria'],
      where: { estado: 'PUBLICADO' },
      _count: { _all: true },
    });
    const counts = Object.fromEntries(grouped.map((g) => [g.categoria, g._count._all]));
    const data = BLOG_SECTIONS.map((s) => ({ ...s, count: counts[s.slug] || 0 }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
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
    const { titulo, resumen, contenido, cierre, ctaTexto, ctaUrl, coverUrl, categoria, tags, estado, destacado, autorNombre, slug } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ success: false, error: 'Título y contenido son requeridos' });
    const finalSlug = slug || titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post = await prisma.blogPost.create({
      data: {
        slug: finalSlug, titulo, resumen, contenido,
        cierre: cierre || null, ctaTexto: ctaTexto || null, ctaUrl: ctaUrl || null,
        coverUrl,
        categoria: normalizeSection(categoria), tags: tags || [],
        estado: estado || 'BORRADOR', destacado: destacado || false,
        autorNombre: autorNombre || 'OírConecta',
        publishedAt: estado === 'PUBLICADO' ? new Date() : null,
      },
    });
    // Hook PageRegistry
    if (post.estado === 'PUBLICADO') {
      try {
        const pageReg = require('../services/pageRegistry.service');
        pageReg.upsert({
          type: 'blog_articulo',
          name: `Blog: ${post.titulo}`,
          path: `/blog/${post.slug}`,
          entityId: post.id, entityType: 'BlogPost',
        }).catch(() => {});
      } catch {}
    }
    res.status(201).json({ success: true, data: post });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, error: 'El slug ya existe' });
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Admin: actualizar post ──
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { titulo, resumen, contenido, cierre, ctaTexto, ctaUrl, coverUrl, categoria, tags, estado, destacado, autorNombre } = req.body;
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Post no encontrado' });
    const wasPublished = existing.estado === 'PUBLICADO';
    const nowPublished = estado === 'PUBLICADO';
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(titulo && { titulo }), ...(resumen !== undefined && { resumen }),
        ...(contenido && { contenido }),
        ...(cierre !== undefined && { cierre }),
        ...(ctaTexto !== undefined && { ctaTexto }),
        ...(ctaUrl !== undefined && { ctaUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(categoria && { categoria: normalizeSection(categoria) }), ...(tags && { tags }),
        ...(estado && { estado }), ...(destacado !== undefined && { destacado }),
        ...(autorNombre && { autorNombre }),
        ...(!wasPublished && nowPublished ? { publishedAt: new Date() } : {}),
      },
    });
    // Hook PageRegistry
    try {
      const pageReg = require('../services/pageRegistry.service');
      if (!wasPublished && nowPublished) {
        pageReg.upsert({
          type: 'blog_articulo',
          name: `Blog: ${post.titulo}`,
          path: `/blog/${post.slug}`,
          entityId: post.id, entityType: 'BlogPost',
        }).catch(() => {});
      } else if (wasPublished && !nowPublished) {
        pageReg.deactivateByEntity('BlogPost', post.id).catch(() => {});
      }
    } catch {}
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

// ── Admin: generar 1 post con IA bajo demanda (ignora guard de 6 días) ──
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { authorize } = require('../middleware/auth');
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Solo ADMIN' });
    }
    const gen = require('../services/blogGenerator.service');
    const result = await gen.generateOne({ minDaysBetween: 0 });
    if (!result.post) {
      return res.status(409).json({ success: false, error: `No se generó: ${result.reason}` });
    }
    res.status(201).json({ success: true, data: result.post });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
