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
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta quedó agendada para el {{fecha_cita}} a las {{hora_cita}}.\n\nMotivo: {{tipo_consulta}}\nSede: {{sede}}\n\nTe enviaremos un recordatorio el día anterior.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'cita_agendada', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita en OÍR Conecta — {{fecha_cita}} {{hora_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita quedó confirmada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n📍 {{sede}}\n\nSi necesitas reagendar: {{link_reagendar}}\n\nGracias por confiar en OÍR Conecta.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── RECORDATORIO_24H ──────────────────────────────────────────────
  {
    code: 'recordatorio_24h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'recordatorio_24h',
    body: 'Hola {{nombre}}, te recordamos tu cita mañana {{fecha_cita}} a las {{hora_cita}} en OÍR Conecta.\n\n¿Asistirás?',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'recordatorio_24h', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Recordatorio: tu cita mañana en OÍR Conecta',
    body: 'Hola {{nombre}},\n\nTe recordamos tu cita mañana:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n\nConfirmar asistencia: {{link_confirm}}\nReagendar: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'link_confirm', 'link_reagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── RECORDATORIO_2H ───────────────────────────────────────────────
  {
    code: 'recordatorio_2h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'recordatorio_2h',
    body: 'Hola {{nombre}}, te esperamos en OÍR Conecta hoy a las {{hora_cita}}. Si necesitas cancelar, escríbenos.',
    variables: ['nombre', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'recordatorio_2h', channel: 'SMS', locale: 'es-CO',
    body: 'OÍR Conecta: {{nombre}}, te esperamos hoy a las {{hora_cita}}. Si no puedes asistir avísanos.',
    variables: ['nombre', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── REPROGRAMACION ────────────────────────────────────────────────
  {
    code: 'reprogramacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'reprogramacion',
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta fue reprogramada para el {{fecha_cita}} a las {{hora_cita}}.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'reprogramacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita fue reprogramada — {{fecha_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita en OÍR Conecta fue reprogramada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n\nSi no puedes asistir: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'link_reagendar'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ─── CANCELACION ───────────────────────────────────────────────────
  {
    code: 'cancelacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'cancelacion',
    body: 'Hola {{nombre}}, tu cita del {{fecha_cita}} a las {{hora_cita}} fue cancelada. Si quieres reagendar, escríbenos.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },
  {
    code: 'cancelacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita fue cancelada',
    body: 'Hola {{nombre}},\n\nTu cita del {{fecha_cita}} a las {{hora_cita}} fue cancelada.\n\nSi deseas reagendar, escríbenos.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL',
    optOutAllowed: false,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FASE 2 — Duplicados por audiencia (crm_* y directorio_*).
  // Los códigos legacy (arriba) se mantienen para compat pero los
  // disparadores nuevos usan estos prefijados. Copy inicial = mismo copy
  // del legacy con la sede/marca correspondiente; editable desde cada
  // buzón (CRM o Admin) por separado.
  // ═══════════════════════════════════════════════════════════════════

  // ─── CRM_CITA_AGENDADA (centro propio OírConecta) ───────────────────
  {
    code: 'crm_cita_agendada', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'crm_cita_agendada',
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta quedó agendada para el {{fecha_cita}} a las {{hora_cita}}.\n\nMotivo: {{tipo_consulta}}\nSede: {{sede}}\n\nTe enviaremos un recordatorio el día anterior.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'crm_cita_agendada', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita en OÍR Conecta — {{fecha_cita}} {{hora_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita quedó confirmada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n📍 {{sede}}\n\nSi necesitas reagendar: {{link_reagendar}}\n\nGracias por confiar en OÍR Conecta.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── DIRECTORIO_CITA_AGENDADA (profesional adscrito) ────────────────
  {
    code: 'directorio_cita_agendada', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'directorio_cita_agendada',
    body: 'Hola {{nombre}}, tu cita con {{sede}} quedó agendada para el {{fecha_cita}} a las {{hora_cita}}.\n\nMotivo: {{tipo_consulta}}\n\nTe enviaremos un recordatorio el día anterior.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'directorio_cita_agendada', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita con {{sede}} — {{fecha_cita}} {{hora_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita quedó confirmada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n👤 {{sede}}\n\nSi necesitas reagendar: {{link_reagendar}}\n\nGracias por usar OírConecta.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── CRM_RECORDATORIO_24H ───────────────────────────────────────────
  {
    code: 'crm_recordatorio_24h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'crm_recordatorio_24h',
    body: 'Hola {{nombre}}, te recordamos tu cita mañana {{fecha_cita}} a las {{hora_cita}} en OÍR Conecta.\n\n¿Asistirás?',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'crm_recordatorio_24h', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Recordatorio: tu cita mañana en OÍR Conecta',
    body: 'Hola {{nombre}},\n\nTe recordamos tu cita mañana:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n\nConfirmar asistencia: {{link_confirm}}\nReagendar: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'link_confirm', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── DIRECTORIO_RECORDATORIO_24H ────────────────────────────────────
  {
    code: 'directorio_recordatorio_24h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'directorio_recordatorio_24h',
    body: 'Hola {{nombre}}, te recordamos tu cita mañana {{fecha_cita}} a las {{hora_cita}} con {{sede}}.\n\n¿Asistirás?',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'directorio_recordatorio_24h', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Recordatorio: tu cita mañana con {{sede}}',
    body: 'Hola {{nombre}},\n\nTe recordamos tu cita mañana con {{sede}}:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n📋 {{tipo_consulta}}\n\nConfirmar asistencia: {{link_confirm}}\nReagendar: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'tipo_consulta', 'sede', 'link_confirm', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── CRM_RECORDATORIO_2H ────────────────────────────────────────────
  {
    code: 'crm_recordatorio_2h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'crm_recordatorio_2h',
    body: 'Hola {{nombre}}, te esperamos en OÍR Conecta hoy a las {{hora_cita}}. Si necesitas cancelar, escríbenos.',
    variables: ['nombre', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'crm_recordatorio_2h', channel: 'SMS', locale: 'es-CO',
    body: 'OÍR Conecta: {{nombre}}, te esperamos hoy a las {{hora_cita}}. Si no puedes asistir avísanos.',
    variables: ['nombre', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── DIRECTORIO_RECORDATORIO_2H ─────────────────────────────────────
  {
    code: 'directorio_recordatorio_2h', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'directorio_recordatorio_2h',
    body: 'Hola {{nombre}}, {{sede}} te espera hoy a las {{hora_cita}}. Si necesitas cancelar, escríbenos.',
    variables: ['nombre', 'hora_cita', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'directorio_recordatorio_2h', channel: 'SMS', locale: 'es-CO',
    body: 'OírConecta: {{nombre}}, {{sede}} te espera hoy a las {{hora_cita}}.',
    variables: ['nombre', 'hora_cita', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── CRM_REPROGRAMACION ─────────────────────────────────────────────
  {
    code: 'crm_reprogramacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'crm_reprogramacion',
    body: 'Hola {{nombre}}, tu cita en OÍR Conecta fue reprogramada para el {{fecha_cita}} a las {{hora_cita}}.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'crm_reprogramacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita en OÍR Conecta fue reprogramada — {{fecha_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita en OÍR Conecta fue reprogramada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n\nSi no puedes asistir: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── DIRECTORIO_REPROGRAMACION ──────────────────────────────────────
  {
    code: 'directorio_reprogramacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'directorio_reprogramacion',
    body: 'Hola {{nombre}}, tu cita con {{sede}} fue reprogramada para el {{fecha_cita}} a las {{hora_cita}}.',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'sede'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'directorio_reprogramacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita con {{sede}} fue reprogramada — {{fecha_cita}}',
    body: 'Hola {{nombre}},\n\nTu cita con {{sede}} fue reprogramada:\n\n📅 {{fecha_cita}}\n🕐 {{hora_cita}}\n\nSi no puedes asistir: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── CRM_CANCELACION ────────────────────────────────────────────────
  {
    code: 'crm_cancelacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'crm_cancelacion',
    body: 'Hola {{nombre}}, tu cita del {{fecha_cita}} a las {{hora_cita}} en OÍR Conecta fue cancelada. Si quieres reagendar, escríbenos.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'crm_cancelacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita en OÍR Conecta fue cancelada',
    body: 'Hola {{nombre}},\n\nTu cita del {{fecha_cita}} a las {{hora_cita}} en OÍR Conecta fue cancelada.\n\nSi deseas reagendar, escríbenos.',
    variables: ['nombre', 'fecha_cita', 'hora_cita'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── DIRECTORIO_CANCELACION ─────────────────────────────────────────
  {
    code: 'directorio_cancelacion', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'directorio_cancelacion',
    body: 'Hola {{nombre}}, tu cita del {{fecha_cita}} a las {{hora_cita}} con {{sede}} fue cancelada. Si quieres reagendar: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },
  {
    code: 'directorio_cancelacion', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Tu cita con {{sede}} fue cancelada',
    body: 'Hola {{nombre}},\n\nTu cita del {{fecha_cita}} a las {{hora_cita}} con {{sede}} fue cancelada.\n\nSi deseas reagendar: {{link_reagendar}}',
    variables: ['nombre', 'fecha_cita', 'hora_cita', 'sede', 'link_reagendar'],
    category: 'TRANSACTIONAL', optOutAllowed: false,
  },

  // ─── AGRADECIMIENTO_POST_CITA (T+18h tras marcar COMPLETED) ─────────
  {
    code: 'agradecimiento_post_cita', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'agradecimiento_post_cita',
    body: '¡Gracias por tu visita, {{nombre}}! Esperamos que tu experiencia con {{tipo_consulta}} en OÍR Conecta haya sido buena. Estamos aquí para lo que necesites.',
    variables: ['nombre', 'tipo_consulta'],
    category: 'MARKETING',
    optOutAllowed: true,
  },
  {
    code: 'agradecimiento_post_cita', channel: 'EMAIL', locale: 'es-CO',
    subject: 'Gracias por tu visita a OÍR Conecta',
    body: 'Hola {{nombre}},\n\nGracias por confiar en nosotros para tu {{tipo_consulta}}. Esperamos que la experiencia haya sido buena.\n\nSi tienes cualquier pregunta o inquietud, responde este correo y te atenderemos.\n\nEl equipo de OÍR Conecta.',
    variables: ['nombre', 'tipo_consulta'],
    category: 'MARKETING',
    optOutAllowed: true,
  },

  // ─── ENCUESTA_POST_CITA (T+3d tras COMPLETED) ───────────────────────
  {
    code: 'encuesta_post_cita', channel: 'WHATSAPP', locale: 'es-CO',
    metaTemplateName: 'encuesta_post_cita',
    body: 'Hola {{nombre}}, ¿nos regalas 30 segundos? Cuéntanos cómo te fue con tu {{tipo_consulta}}: {{link_encuesta}}\n\nTu opinión ayuda a otros pacientes.',
    variables: ['nombre', 'tipo_consulta', 'link_encuesta'],
    category: 'MARKETING',
    optOutAllowed: true,
  },
  {
    code: 'encuesta_post_cita', channel: 'EMAIL', locale: 'es-CO',
    subject: '¿Cómo te fue en tu cita? — OÍR Conecta',
    body: 'Hola {{nombre}},\n\nHan pasado unos días desde tu {{tipo_consulta}}. Nos encantaría saber cómo te fue.\n\nDéjanos tu opinión en 30 segundos: {{link_encuesta}}\n\nCada respuesta nos ayuda a mejorar y guía a otros pacientes en su búsqueda.',
    variables: ['nombre', 'tipo_consulta', 'link_encuesta'],
    category: 'MARKETING',
    optOutAllowed: true,
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
