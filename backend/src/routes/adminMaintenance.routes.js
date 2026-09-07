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

/**
 * POST /api/admin/maintenance/reatribuir-whatsapp
 *
 * Arregla hacia atrás lo que ya está mal guardado: todo lo que entró por
 * WhatsApp quedaba con procedencia 'directorio-publico', que el embudo no
 * reconoce y manda a "visita médica". Y quien llegó por un anuncio nunca se
 * registró como lead, así que las campañas parecían no traer a nadie.
 *
 * Recorre las conversaciones, y para cada una:
 *   · le pone al paciente y a sus citas la procedencia que corresponde
 *     (anuncio → marketing digital, aliado → recomendación, resto → sitio web),
 *   · le crea el lead si no existe.
 *
 * No borra nada y se puede correr las veces que haga falta.
 */
router.post('/reatribuir-whatsapp', async (req, res) => {
  try {
    const corp = require('../services/waCorporate.service');
    const convs = await prisma.whatsAppConversation.findMany({
      where: { businessLine: 'CRM' },
      select: { id: true, phone: true, adSourceId: true, partnerId: true },
    });

    let pacientes = 0, citas = 0, leads = 0;
    for (const c of convs) {
      const proc = c.partnerId ? 'recomendacion'
        : c.adSourceId ? 'leads-marketing-digital'
        : 'sitio-web';
      const last10 = String(c.phone || '').replace(/\D/g, '').slice(-10);
      if (!last10) continue;

      // Solo se reescribe lo que quedó con el valor genérico: si alguien
      // corrigió la procedencia a mano, esa mano manda.
      const p = await prisma.patient.updateMany({
        where: {
          telefono: { contains: last10 },
          procedencia: { in: ['directorio-publico', 'whatsapp-ia', 'visita-medica'] },
        },
        data: { procedencia: proc },
      });
      pacientes += p.count;

      const a = await prisma.appointment.updateMany({
        where: {
          patientPhone: { contains: last10 },
          procedencia: { in: ['directorio-publico', 'whatsapp-ia', 'visita-medica'] },
        },
        data: { procedencia: proc },
      });
      citas += a.count;

      const lead = await corp.asegurarLead(c.id).catch(() => null);
      if (lead) leads += 1;
    }

    res.json({
      success: true,
      data: {
        conversacionesRevisadas: convs.length,
        pacientesCorregidos: pacientes,
        citasCorregidas: citas,
        leadsCreados: leads,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

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
