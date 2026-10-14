/**
 * Cifras de la consola de Aura: dónde se queda la gente y qué está fallando.
 *
 * Todo sale de los chats y las citas reales, nunca de un contador aparte que
 * se pueda desfasar. Solo lectura.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const n = (v) => Number(v || 0);

async function resumen({ dias = 30 } = {}) {
  const desde = new Date(Date.now() - dias * 24 * 3600 * 1000);

  const [embudo] = await prisma.$queryRaw`
    WITH c AS (
      SELECT id FROM whatsapp_conversations
      WHERE "createdAt" >= ${desde} AND "businessLine" = 'CRM'
    )
    SELECT
      (SELECT count(*) FROM c) AS conversaciones,
      (SELECT count(DISTINCT m."conversationId") FROM whatsapp_messages m JOIN c ON c.id = m."conversationId"
        WHERE m.direction = 'OUTBOUND' AND (m.body LIKE '%1️⃣%' OR (m.body LIKE '%(botones:%' AND m.body ~ '\d:\d\d [ap]\.m\.'))) AS vieron_horarios,
      (SELECT count(DISTINCT m."conversationId") FROM whatsapp_messages m JOIN c ON c.id = m."conversationId"
        WHERE m.direction = 'INBOUND' AND lower(trim(m.body)) = 'otra ciudad') AS otra_ciudad
  `;

  const [citas] = await prisma.$queryRaw`
    SELECT
      count(*) AS agendadas,
      count(*) FILTER (WHERE estado = 'COMPLETED') AS asistieron,
      count(*) FILTER (WHERE estado = 'NO_SHOW') AS no_llegaron,
      count(*) FILTER (WHERE estado = 'CANCELLED') AS canceladas,
      count(*) FILTER (WHERE estado = 'CONFIRMED') AS por_venir,
      count(*) FILTER (WHERE coalesce("patientEmail", '') = '') AS sin_correo
    FROM appointments
    WHERE "canalRegistro" = 'bot-whatsapp' AND "createdAt" >= ${desde}
  `;

  // "El equipo te escribe": promesas del bot que ninguna persona cumplió.
  const [promesas] = await prisma.$queryRaw`
    WITH p AS (
      SELECT m."conversationId", min(m.timestamp) AS t
      FROM whatsapp_messages m
      WHERE m.direction = 'OUTBOUND' AND m."sentByBot" AND m.timestamp >= ${desde}
        AND m.body ~* 'te escriben? por (este mismo|este|ac[aá])|el equipo te (escribe|busca|llama)'
      GROUP BY 1
    )
    SELECT count(*) AS hechas,
      count(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM whatsapp_messages h
        WHERE h."conversationId" = p."conversationId" AND h.direction = 'OUTBOUND'
          AND NOT coalesce(h."sentByBot", false) AND h.timestamp > p.t
      )) AS sin_cumplir
    FROM p
  `;

  // Seguimientos automáticos: cuántos salieron y cuántos tuvieron respuesta.
  const seguimiento = async (patron) => {
    const [r] = await prisma.$queryRaw`
      SELECT count(*) AS enviados,
        count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM whatsapp_messages i
          WHERE i."conversationId" = m."conversationId" AND i.direction = 'INBOUND' AND i.timestamp > m.timestamp
        )) AS respondidos
      FROM whatsapp_messages m
      WHERE m.direction = 'OUTBOUND' AND m."sentByBot" AND m.timestamp >= ${desde} AND m.body LIKE ${patron}
    `;
    return { enviados: n(r.enviados), respondidos: n(r.respondidos) };
  };

  const [recordatorios] = await prisma.$queryRaw`
    SELECT
      count(*) FILTER (WHERE "templateCode" LIKE '%recordatorio_24h' AND status = 'SENT') AS r24_ok,
      count(*) FILTER (WHERE "templateCode" LIKE '%recordatorio_24h' AND status = 'FAILED') AS r24_fallo,
      count(*) FILTER (WHERE "templateCode" LIKE '%recordatorio_2h' AND channel = 'WHATSAPP' AND status = 'SENT') AS r2_ok,
      count(*) FILTER (WHERE "templateCode" LIKE '%recordatorio_2h' AND channel = 'WHATSAPP' AND status = 'FAILED') AS r2_fallo,
      max("lastError") FILTER (WHERE "templateCode" LIKE '%recordatorio_2h' AND channel = 'WHATSAPP' AND status = 'FAILED') AS r2_error
    FROM reminders
    WHERE "createdAt" >= ${desde} AND "templateCode" LIKE 'crm_%'
  `;

  return {
    dias,
    embudo: {
      conversaciones: n(embudo.conversaciones),
      otraCiudad: n(embudo.otra_ciudad),
      vieronHorarios: n(embudo.vieron_horarios),
      agendadas: n(citas.agendadas),
      asistieron: n(citas.asistieron),
      noLlegaron: n(citas.no_llegaron),
      canceladas: n(citas.canceladas),
      porVenir: n(citas.por_venir),
      sinCorreo: n(citas.sin_correo),
    },
    promesas: { hechas: n(promesas.hechas), sinCumplir: n(promesas.sin_cumplir) },
    seguimientos: {
      retoma: await seguimiento('%Tengo espacio para tu valoración%'),
      ultimoToque: await seguimiento('No quiero insistir%'),
      maduracion: await seguimiento('%Hace unos días%'),
    },
    recordatorios: {
      dia: { enviados: n(recordatorios.r24_ok), fallidos: n(recordatorios.r24_fallo) },
      dosHoras: { enviados: n(recordatorios.r2_ok), fallidos: n(recordatorios.r2_fallo), error: recordatorios.r2_error || null },
    },
  };
}

module.exports = { resumen };
