/**
 * Seed inicial de NotificationTemplate para Fase 1.
 * Cubre el flujo de cita: agendada, recordatorio 24h y 2h, reprogramación, cancelación.
 *
 * Para WhatsApp: `metaTemplateName` debe coincidir EXACTAMENTE con el nombre
 * registrado en Meta Business Manager (case-sensitive, snake_case, sin espacios).
 *
 * Para Email: el `body` es texto plano; el canal lo envuelve en HTML.
 *
 * Idempotente: usa upsert por (code, channel, locale).
 *
 * Ejecutar:  node prisma/seeds/notification-templates.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEMPLATES = [
  // ─── CITA_AGENDADA ─────────────────────────────────────────────────
  {
    code: 'cita_agendada', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'cita_agendada',
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta quedó agendada para el {{fechaCita}} a las {{horaCita}}.\n\nMotivo: {{tipoConsulta}}\nSede: {{sede}}\n\nTe enviaremos un recordatorio el día anterior.',
    variables: ['nombre', 'fechaCita', 'horaCita', 'tipoConsulta', 'sede'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'cita_agendada', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita en OÍR Conecta — {{fechaCita}} {{horaCita}}',
    body: 'Hola {{nombre}},\n\nTu cita quedó confirmada:\n\n📅 {{fechaCita}}\n🕐 {{horaCita}}\n📋 {{tipoConsulta}}\n📍 {{sede}}\n\nSi necesitas reagendar: {{linkReagendar}}\n\nGracias por confiar en OÍR Conecta.',
    variables: ['nombre', 'fechaCita', 'horaCita', 'tipoConsulta', 'sede', 'linkReagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── RECORDATORIO_24H ──────────────────────────────────────────────
  {
    code: 'recordatorio_24h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'recordatorio_24h',
    body: 'Hola {{nombre}}, te recordamos tu cita mañana {{fechaCita}} a las {{horaCita}} en OÍR Conecta.\n\n¿Asistirás?',
    variables: ['nombre', 'fechaCita', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'recordatorio_24h', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Recordatorio: tu cita mañana en OÍR Conecta',
    body: 'Hola {{nombre}},\n\nTe recordamos tu cita mañana:\n\n📅 {{fechaCita}}\n🕐 {{horaCita}}\n📋 {{tipoConsulta}}\n\nConfirmar asistencia: {{linkConfirm}}\nReagendar: {{linkReagendar}}',
    variables: ['nombre', 'fechaCita', 'horaCita', 'tipoConsulta', 'linkConfirm', 'linkReagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── RECORDATORIO_2H ───────────────────────────────────────────────
  {
    code: 'recordatorio_2h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'recordatorio_2h',
    body: 'Hola {{nombre}}, te esperamos en OÍR Conecta hoy a las {{horaCita}}. Si necesitas cancelar, escríbenos.',
    variables: ['nombre', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'recordatorio_2h', channel: 'SMS', locale: 'es-CO',
    body: 'OÍR Conecta: {{nombre}}, te esperamos hoy a las {{horaCita}}. Si no puedes asistir avísanos.',
    variables: ['nombre', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── REPROGRAMACION ────────────────────────────────────────────────
  {
    code: 'reprogramacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'reprogramacion',
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta fue reprogramada para el {{fechaCita}} a las {{horaCita}}.',
    variables: ['nombre', 'fechaCita', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'reprogramacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita fue reprogramada — {{fechaCita}}',
    body: 'Hola {{nombre}},\n\nTu cita en OÍR Conecta fue reprogramada:\n\n📅 {{fechaCita}}\n🕐 {{horaCita}}\n\nSi no puedes asistir: {{linkReagendar}}',
    variables: ['nombre', 'fechaCita', 'horaCita', 'linkReagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── CANCELACION ───────────────────────────────────────────────────
  {
    code: 'cancelacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'cancelacion',
    body: 'Hola {{nombre}}, tu cita del {{fechaCita}} a las {{horaCita}} fue cancelada. Si quieres reagendar, escríbenos.',
    variables: ['nombre', 'fechaCita', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'cancelacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita fue cancelada',
    body: 'Hola {{nombre}},\n\nTu cita del {{fechaCita}} a las {{horaCita}} fue cancelada.\n\nSi deseas reagendar, escríbenos.',
    variables: ['nombre', 'fechaCita', 'horaCita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
];

async function main() {
  let upserts = 0;
  for (const t of TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: {
        code_channel_locale: { code: t.code, channel: t.channel, locale: t.locale },
      },
      create: t,
      update: {
        subject: t.subject || null,
        body: t.body,
        metaTemplateName: t.metaTemplateName || null,
        variables: t.variables || [],
        category: t.category || 'TRANSACTIONAL',
        optOutAllowed: !!t.optOutAllowed,
        activo: true,
      },
    });
    upserts += 1;
  }
  console.log(`[seed] ${upserts} plantillas insertadas/actualizadas`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
