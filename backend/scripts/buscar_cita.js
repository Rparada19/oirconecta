/**
 * Busca una cita por nombre o teléfono y dice por qué no se ve en el CRM.
 *
 * Nació de un caso concreto: el bot le confirmó por WhatsApp la valoración a
 * una paciente y en la pantalla de Citas no aparecía. La cita estaba creada;
 * lo que fallaba era la lista. Este script mira la base directo, sin pasar por
 * la API ni por la pantalla, para separar "no se creó" de "no se ve".
 *
 * Requiere DATABASE_URL apuntando a la base que quieres mirar (en Render, la
 * shell del servicio ya la trae).
 *
 * Uso:
 *   node scripts/buscar_cita.js Hellen
 *   node scripts/buscar_cita.js 3164960482
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BOGOTA = 'America/Bogota';

function fechaLegible(valor) {
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor || '—');
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: BOGOTA, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(d);
}

/** Los teléfonos entran de mil formas (+57, espacios, guiones). Comparamos los últimos 10. */
function ultimos10(valor) {
  return String(valor || '').replace(/\D/g, '').slice(-10);
}

async function main() {
  const termino = process.argv.slice(2).join(' ').trim();
  if (!termino) {
    console.error('Uso: node scripts/buscar_cita.js "<nombre o teléfono>"');
    process.exit(1);
  }

  const soloDigitos = ultimos10(termino);
  const where = soloDigitos.length >= 7
    ? {
        OR: [
          { patientPhone: { contains: soloDigitos } },
          { patient: { telefono: { contains: soloDigitos } } },
        ],
      }
    : {
        OR: [
          { patientName: { contains: termino, mode: 'insensitive' } },
          { patient: { nombre: { contains: termino, mode: 'insensitive' } } },
        ],
      };

  const citas = await prisma.appointment.findMany({
    where,
    include: { patient: { select: { id: true, nombre: true, telefono: true, email: true, procedencia: true } } },
    orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
  });

  const total = await prisma.appointment.count();

  console.log(`\nBuscando "${termino}" — ${citas.length} cita(s). La base tiene ${total} en total.\n`);

  if (!citas.length) {
    console.log('No hay ninguna cita con ese nombre ni con ese teléfono.');
    console.log('Si el bot dijo que agendó, la cita no llegó a crearse: revisa el log de');
    console.log('create_appointment en el servicio de WhatsApp.\n');
    return;
  }

  for (const c of citas) {
    // Bajo el orden viejo (de la más antigua a la más nueva) la pantalla pedía
    // 500 y se quedaba con las 500 primeras. Esta es la posición que ocupaba
    // esta cita en esa fila: si pasaba de 500, no se veía.
    const masViejas = await prisma.appointment.count({
      where: { OR: [{ fecha: { lt: c.fecha } }, { fecha: c.fecha, hora: { lt: c.hora } }] },
    });
    const posicion = masViejas + 1;

    console.log('─'.repeat(72));
    console.log(`Cita        ${c.id}`);
    console.log(`Cuándo      ${fechaLegible(c.fecha)} a las ${c.hora}  (${c.durationMinutes ?? '—'} min)`);
    console.log(`Estado      ${c.estado}`);
    console.log(`Tipo        ${c.tipoConsulta || '—'}`);
    console.log(`Paciente    ${c.patientName || '—'}  ·  ${c.patientPhone || 'sin teléfono'}  ·  ${c.patientEmail || 'SIN CORREO'}`);
    console.log(`Ficha       ${c.patientId || 'sin paciente vinculado'}`);
    console.log(`Registro    canal=${c.canalRegistro}  procedencia=${c.procedencia}`);
    console.log(`Creada      ${c.createdAt.toISOString()}`);
    console.log(`Posición    ${posicion} de ${total} en el orden viejo (más antigua primero)`);

    const razones = [];
    if (posicion > 500) {
      razones.push(`quedaba en la posición ${posicion} y la pantalla solo pedía las primeras 500`);
    }
    if (!c.patientEmail) {
      razones.push('no tiene correo: buscarla por nombre en el buscador rompía la lista entera');
    }
    if (c.estado === 'RESCHEDULED') {
      razones.push('está marcada como reagendada y la lista la esconde salvo que pidas ese filtro');
    }
    console.log(razones.length
      ? `Por qué no se veía:\n  · ${razones.join('\n  · ')}`
      : 'Esta cita debería verse en la lista tal como está.');
  }
  console.log('─'.repeat(72) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
