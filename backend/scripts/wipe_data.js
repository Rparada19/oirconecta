/**
 * Wipe destructivo de datos operativos.
 *
 * PRESERVA:
 *   - User admin@oirconecta.com (único login que sobrevive)
 *   - Blog posts, analytics, marketing histórico
 *   - Plans, NotificationTemplates
 *   - Semillas del sistema (Profession, Department, City)
 *   - Seed retail (se recrea al boot; DirectoryProfile prof_1 se borra aquí
 *     pero volverá en el próximo `npm start` por seed_oirconecta_retail.js)
 *
 * BORRA:
 *   - Todos los pacientes, leads, citas, controles, conversaciones WA,
 *     recordatorios, notificaciones, ventas, cotizaciones, reviews,
 *     conversaciones IA, agendas de profesionales, blocked slots,
 *     Directory* excepto el reseed automático, TODOS los Users
 *     salvo admin.
 *
 * Requiere DATABASE_URL apuntando a la DB que quieres limpiar.
 * Uso: node scripts/wipe_data.js --yes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRESERVED_EMAIL = 'admin@oirconecta.com';

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error('SEGURIDAD: agrega --yes para confirmar. Este script BORRA datos.');
    process.exit(1);
  }

  const url = process.env.DATABASE_URL || '';
  const host = url.match(/@([^\/]+)/)?.[1] || '???';
  console.log(`\n>>> Wipe contra host: ${host}`);
  console.log(`>>> Único user preservado: ${PRESERVED_EMAIL}\n`);

  const admin = await prisma.user.findFirst({ where: { email: PRESERVED_EMAIL } });
  if (!admin) {
    console.warn(`⚠️  No se encontró ${PRESERVED_EMAIL}. Continúo igual (todos los users serán borrados).`);
  } else {
    console.log(`✓ Admin conservado: id=${admin.id}\n`);
  }

  // Orden FK-safe: primero hijos, luego padres.
  const steps = [
    // WhatsApp / IA
    ['whatsAppMessage', {}],
    ['whatsAppConversation', {}],
    ['iaAgentDocumentChunk', {}],
    ['iaAgentDocument', {}],
    ['iaAgentFaq', {}],
    ['iaAgentConfig', {}],
    ['iaMessage', {}],
    ['iaConversation', {}],
    ['iaConversationPack', {}],
    ['professionalWhatsAppChannel', {}],

    // Notificaciones y tareas
    ['reminder', {}],
    ['notification', {}],
    ['task', {}],
    ['salesActivity', {}],
    ['salesTask', {}],
    ['salesLead', {}],

    // Citas y controles
    ['patientFollowUp', {}],
    ['appointment', {}],
    ['blockedSlot', {}],
    ['appointmentType', {}],
    ['professionalBlock', {}],
    ['professionalAvailability', {}],
    ['professionalScheduleConfig', {}],
    ['googleCalendarChannel', {}],

    // Ventas / cotizaciones / e-commerce
    ['shopOrderItem', {}],
    ['shopOrder', {}],
    ['shopCustomer', {}],
    ['quoteHistory', {}],
    ['quote', {}],
    ['sale', {}],
    ['payment', {}],
    ['invoice', {}],
    ['comparadorLead', {}],
    ['comparadorItem', {}],
    ['contactMessage', {}],

    // Consultas / interacciones / mantenimientos
    ['consultation', {}],
    ['interaction', {}],
    ['maintenance', {}],
    ['patientPreferences', {}],
    ['patientProfessionalRelation', {}],

    // Pacientes y leads
    ['lead', {}],
    ['patient', {}],

    // Reviews / vistas / campañas del profesional (no marketing global)
    ['review', {}],
    ['report', {}],
    ['profileView', {}],
    ['campaign', {}],

    // Directory (perfil de Piedad y cualquier otro; el seed lo repone en boot)
    ['directoryEvent', {}],
    ['directoryInquiry', {}],
    ['directoryWorkplace', {}],
    ['directoryProfile', {}],
    ['directoryAccount', {}],

    // Suscripciones (dejamos plans intactos)
    ['subscriptionEvent', {}],
    ['subscription', {}],

    // Sedes / consentimientos / auditoría (opcional; limpia todo)
    ['sede', {}],
    ['consent', {}],
    ['dataAccessLog', {}],
    ['auditLog', {}],

    // Usuarios: todo menos admin
    ['user', { where: { email: { not: PRESERVED_EMAIL } } }],
  ];

  for (const [model, args] of steps) {
    try {
      const res = await prisma[model].deleteMany(args);
      console.log(`  ✓ ${model.padEnd(40)} -${res.count}`);
    } catch (e) {
      console.warn(`  ⚠ ${model}: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\n✓ Wipe completo.');
  console.log('  → Al reiniciar el backend, el seed recreará DirectoryProfile prof_1 (Piedad) y las plantillas.');
  console.log('  → Blog, analytics, marketing e histórico de campañas quedan intactos.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
