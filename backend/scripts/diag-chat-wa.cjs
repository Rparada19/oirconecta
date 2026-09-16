/**
 * Diagnóstico de una conversación de WhatsApp — de solo lectura.
 *
 * Uso (la URL de Neon sale de tu entorno, no del repo):
 *   DATABASE_URL="$(pbpaste)" node backend/scripts/diag-chat-wa.cjs 3022056827
 *
 * Imprime la conversación, el paciente vinculado, sus citas y los mensajes.
 */
const { PrismaClient } = require('@prisma/client');

const telefono = (process.argv[2] || '').replace(/\D/g, '').slice(-10);
if (!telefono) {
  console.error('Falta el teléfono. Ej: node backend/scripts/diag-chat-wa.cjs 3022056827');
  process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
  const conv = await prisma.whatsAppConversation.findFirst({
    where: { phone: { contains: telefono } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, phone: true, contactName: true, contactType: true, status: true,
      patientId: true, agendarBookedAt: true, adHeadline: true, updatedAt: true,
    },
  });
  if (!conv) { console.log('No hay conversación con ese número.'); return; }
  console.log('── CONVERSACIÓN ──');
  console.log(conv);

  console.log('\n── ¿YA TIENE CITA? ──');
  const desde = new Date(); desde.setHours(0, 0, 0, 0);
  const citas = await prisma.appointment.findMany({
    where: {
      OR: [
        ...(conv.patientId ? [{ patientId: conv.patientId }] : []),
        { patient: { telefono: { contains: telefono } } },
      ],
    },
    orderBy: { fecha: 'desc' },
    take: 10,
    select: { id: true, fecha: true, estado: true, tipoConsulta: true, canalRegistro: true, patientId: true },
  });
  if (!citas.length) console.log('Ninguna cita en la agenda para ese teléfono.');
  citas.forEach((c) => {
    const futura = new Date(c.fecha) >= desde ? ' ← vigente' : '';
    console.log(`· ${new Date(c.fecha).toLocaleString('es-CO')} — ${c.estado} — ${c.tipoConsulta} — ${c.canalRegistro || 's/canal'}${futura}`);
  });
  console.log('patientId de la conversación:', conv.patientId || '(SIN VINCULAR — el bot no sabía que tenía cita)');

  console.log('\n── MENSAJES ──');
  const msgs = await prisma.whatsAppMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'asc' },
    select: { direction: true, body: true, createdAt: true, sentByBot: true },
  });
  msgs.forEach((m) => {
    const quien = String(m.direction).toUpperCase().startsWith('IN') ? '<< paciente' : (m.sentByBot ? '>> bot     ' : '>> humano  ');
    const hora = new Date(m.createdAt).toLocaleTimeString('es-CO');
    console.log(`${quien} ${hora}  ${String(m.body || '').replace(/\n/g, ' | ').slice(0, 300)}`);
  });
})()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
