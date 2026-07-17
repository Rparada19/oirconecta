/**
 * Rutas de mantenimiento admin. Solo ADMIN y con confirmación explícita.
 *
 * POST /api/admin/maintenance/wipe-data
 *   Body: { confirm: "WIPE_ALL_DATA" }
 *   Borra datos operativos preservando admin@oirconecta.com,
 *   blog, analytics, marketing, plans y templates.
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const PRESERVED_EMAIL = 'admin@oirconecta.com';

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Solo administradores' });
  }
  next();
}

router.use(authenticate, requireAdmin);

router.post('/wipe-data', async (req, res) => {
  if (req.body?.confirm !== 'WIPE_ALL_DATA') {
    return res.status(400).json({
      success: false,
      error: 'Falta confirmación: body { confirm: "WIPE_ALL_DATA" }',
    });
  }

  const admin = await prisma.user.findFirst({ where: { email: PRESERVED_EMAIL } });

  const steps = [
    'whatsAppMessage', 'whatsAppConversation',
    'iaAgentDocumentChunk', 'iaAgentDocument', 'iaAgentFaq', 'iaAgentConfig',
    'iaMessage', 'iaConversation', 'iaConversationPack',
    'professionalWhatsAppChannel',
    'reminder', 'notification',
    'task', 'salesActivity', 'salesTask', 'salesLead',
    'patientFollowUp', 'appointment', 'blockedSlot',
    'appointmentType', 'professionalBlock', 'professionalAvailability',
    'professionalScheduleConfig', 'googleCalendarChannel',
    'shopOrderItem', 'shopOrder', 'shopCustomer',
    'quoteHistory', 'quote', 'sale', 'payment', 'invoice',
    'comparadorLead', 'comparadorItem', 'contactMessage',
    'consultation', 'interaction', 'maintenance',
    'patientPreferences', 'patientProfessionalRelation',
    'lead', 'patient',
    'review', 'report', 'profileView', 'campaign',
    'directoryEvent', 'directoryInquiry', 'directoryWorkplace',
    'directoryProfile', 'directoryAccount',
    'subscriptionEvent', 'subscription',
    'sede', 'consent', 'dataAccessLog', 'auditLog',
  ];

  const results = {};
  for (const model of steps) {
    try {
      const { count } = await prisma[model].deleteMany({});
      results[model] = count;
    } catch (e) {
      results[model] = `error: ${e.message.split('\n')[0]}`;
    }
  }

  // Users: borra todos menos el admin
  try {
    const { count } = await prisma.user.deleteMany({
      where: { email: { not: PRESERVED_EMAIL } },
    });
    results.user = count;
  } catch (e) {
    results.user = `error: ${e.message.split('\n')[0]}`;
  }

  res.json({
    success: true,
    preservedAdmin: admin ? { id: admin.id, email: admin.email } : null,
    deleted: results,
    note: 'Reinicia el backend para que el seed recreé DirectoryProfile prof_1 y las plantillas base.',
  });
});

module.exports = router;
