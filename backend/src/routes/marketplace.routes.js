const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authenticateDirectoryAccount } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Público: listar servicios activos ──
router.get('/', async (req, res) => {
  try {
    const { categoria, modalidad, limit = 24, offset = 0 } = req.query;
    const where = { estado: 'ACTIVO' };
    if (categoria) where.categoria = categoria;
    if (modalidad) where.modalidad = modalidad;
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where, orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
        take: parseInt(limit), skip: parseInt(offset),
        include: {
          profile: {
            select: { id: true, nombreConsultorio: true, profesion: true,
              fotoPerfilUrl: true, telefonoPublico: true, status: true },
          },
        },
      }),
      prisma.marketplaceListing.count({ where }),
    ]);
    res.json({ success: true, data: listings, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: todos los listings ──
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    const where = estado ? { estado } : {};
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: parseInt(limit), skip: parseInt(offset),
        include: { profile: { select: { id: true, nombreConsultorio: true, profesion: true } } },
      }),
      prisma.marketplaceListing.count({ where }),
    ]);
    res.json({ success: true, data: listings, total });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: destacar / cambiar estado ──
router.patch('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { estado, destacado } = req.body;
    const listing = await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { ...(estado && { estado }), ...(destacado !== undefined && { destacado }) },
    });
    res.json({ success: true, data: listing });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Admin: eliminar ──
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.marketplaceListing.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Profesional: sus propios listings ──
router.get('/me', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({ where: { accountId: req.account.id } });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    const listings = await prisma.marketplaceListing.findMany({
      where: { profileId: profile.id }, orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: listings });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Profesional: crear listing ──
router.post('/me', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({ where: { accountId: req.account.id } });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    const { titulo, descripcion, categoria, precio, precioDesde, precioHasta, modalidad, imageUrls } = req.body;
    if (!titulo || !categoria) return res.status(400).json({ success: false, error: 'Título y categoría requeridos' });
    const listing = await prisma.marketplaceListing.create({
      data: { profileId: profile.id, titulo, descripcion, categoria,
        precio, precioDesde, precioHasta, modalidad: modalidad || 'presencial',
        imageUrls: imageUrls || [] },
    });
    res.status(201).json({ success: true, data: listing });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Profesional: actualizar listing ──
router.patch('/me/:id', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({ where: { accountId: req.account.id } });
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id: req.params.id, profileId: profile?.id },
    });
    if (!listing) return res.status(404).json({ success: false, error: 'Servicio no encontrado' });
    const updated = await prisma.marketplaceListing.update({
      where: { id: req.params.id }, data: req.body,
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Profesional: eliminar listing ──
router.delete('/me/:id', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({ where: { accountId: req.account.id } });
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id: req.params.id, profileId: profile?.id },
    });
    if (!listing) return res.status(404).json({ success: false, error: 'Servicio no encontrado' });
    await prisma.marketplaceListing.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
