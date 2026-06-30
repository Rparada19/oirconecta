/**
 * F1 — Endpoints de suscripciones.
 *
 * Profesional:
 *  GET  /api/subscriptions/me                 → Mi suscripción + planes disponibles
 *
 * Admin (JWT ADMIN):
 *  GET  /api/subscriptions/admin/stats        → KPIs ejecutivos
 *  GET  /api/subscriptions/admin/list         → Tabla con filtros
 *  GET  /api/subscriptions/admin/export.csv   → CSV export (mismo filtro)
 *  POST /api/subscriptions/admin/backfill     → Crear trial para todos los perfiles sin sub
 *  POST /api/subscriptions/admin/recompute    → Forzar recálculo de estados
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const subService = require('../services/subscription.service');

const prisma = new PrismaClient();
const router = express.Router();

// ─── Profesional ───
router.get('/me', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    const data = await subService.getMySubscription(profile.id);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[subs/me] ', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Profesional cancela su propia suscripción
router.post('/me/cancel', authenticateDirectoryAccount, async (req, res) => {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      include: { subscription: true },
    });
    if (!profile?.subscription) return res.status(404).json({ success: false, error: 'Sin suscripción activa' });
    const { motivo, immediate } = req.body || {};
    const updated = await subService.cancelSubscription(profile.subscription.id, {
      motivo, immediate: !!immediate, canceledByAdmin: false,
    });
    res.json({ success: true, data: { id: updated.id, status: updated.status, cancelAtPeriodEnd: updated.cancelAtPeriodEnd, currentPeriodEnd: updated.currentPeriodEnd } });
  } catch (e) {
    const code = e.code === 'COMMITMENT_ACTIVE' ? 409 : 500;
    res.status(code).json({ success: false, error: e.message, code: e.code });
  }
});

// Profesional cambia de plan (upgrade/downgrade). Pago real lo confirma webhook.
router.post('/me/change-plan', authenticateDirectoryAccount, async (req, res) => {
  try {
    const { planCode } = req.body || {};
    if (!planCode) return res.status(400).json({ success: false, error: 'planCode requerido' });
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    const updated = await subService.changePlan(profile.id, planCode, { changedByAdmin: false });
    res.json({ success: true, data: { id: updated.id, status: updated.status, plan: updated.plan?.code, currentPeriodEnd: updated.currentPeriodEnd, commitmentEnd: updated.commitmentEnd } });
  } catch (e) {
    const code = e.code === 'COMMITMENT_ACTIVE' ? 409 : 400;
    res.status(code).json({ success: false, error: e.message, code: e.code });
  }
});

// ─── Admin ───
router.get('/admin/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const stats = await subService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/admin/list', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { ciudad, profesionSlug, status, plan, limit = 50, offset = 0 } = req.query;
    const data = await subService.listForAdmin({ ciudad, profesionSlug, status, plan, limit, offset });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/admin/export.csv', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { ciudad, profesionSlug, status, plan } = req.query;
    const { items } = await subService.listForAdmin({
      ciudad, profesionSlug, status, plan, limit: 10000, offset: 0,
    });
    const headers = [
      'Nombre', 'Email', 'Especialidad', 'Ciudad', 'Fecha registro',
      'Inicio prueba', 'Fin prueba', 'Plan', 'Estado',
      'Días para vencer', 'Días mora', 'Último pago', 'Próximo cobro',
    ];
    const rows = items.map((s) => [
      s.nombre || '', s.email || '', s.especialidad || '', s.ciudad || '',
      s.fechaRegistro ? new Date(s.fechaRegistro).toISOString().slice(0, 10) : '',
      s.trialStart ? new Date(s.trialStart).toISOString().slice(0, 10) : '',
      s.trialEnd ? new Date(s.trialEnd).toISOString().slice(0, 10) : '',
      s.planNombre || '', s.status,
      s.diasRestantes, s.diasMora,
      s.lastPaymentAt ? new Date(s.lastPaymentAt).toISOString().slice(0, 10) : '',
      s.nextChargeAt ? new Date(s.nextChargeAt).toISOString().slice(0, 10) : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="suscripciones-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/admin/backfill', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await subService.backfillTrialsAll();
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin cancela una suscripción (inmediato por defecto)
router.post('/admin/:id/cancel', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { motivo, immediate = true } = req.body || {};
    const updated = await subService.cancelSubscription(req.params.id, {
      motivo, immediate: !!immediate, canceledByAdmin: true,
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin fuerza cambio de plan (ignora compromiso). Útil para soporte / correcciones.
router.post('/admin/:id/change-plan', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { planCode } = req.body || {};
    if (!planCode) return res.status(400).json({ success: false, error: 'planCode requerido' });
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id }, select: { profileId: true } });
    if (!sub) return res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
    const updated = await subService.changePlan(sub.profileId, planCode, { changedByAdmin: true });
    res.json({ success: true, data: { id: updated.id, status: updated.status, plan: updated.plan?.code, currentPeriodEnd: updated.currentPeriodEnd, commitmentEnd: updated.commitmentEnd } });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Admin reactiva una suscripción cancelada
router.post('/admin/:id/reactivate', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { extendDays = 30 } = req.body || {};
    const updated = await subService.reactivateSubscription(req.params.id, { extendDays: parseInt(extendDays) });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/admin/recompute', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({ include: { plan: true } });
    let changed = 0;
    for (const s of subs) {
      const updated = await subService.recomputeStatus(s);
      if (updated.status !== s.status) changed++;
    }
    res.json({ success: true, data: { scanned: subs.length, changed } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// F5.3 — Admin verifica/activa el canal WhatsApp de un profesional
router.post('/admin/:profileId/whatsapp/verify', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const wa = require('../services/whatsappAgent.service');
    const updated = await wa.adminVerifyChannel(req.params.profileId);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
