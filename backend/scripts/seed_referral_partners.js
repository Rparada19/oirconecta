/**
 * Aliados referidores. Idempotente: upsert por `code`.
 *
 * El `code` es lo que viaja en el mensaje prellenado del QR de la tarjeta:
 *   https://wa.me/<numero>?text=Vengo%20de%20Plug-e
 * Se compara sin tildes ni signos, así que "Plug-e", "plug e" y "PLUGE" valen.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Código de invitación: se genera una vez y no se vuelve a tocar. No va
 *  escrito en el repo a propósito — se consulta desde el CRM en
 *  GET /api/aliados-admin y se le entrega al aliado por fuera. */
function nuevoCodigoRegistro(code) {
  return `${code.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const ALIADOS = [
  {
    code: 'PLUG-E',
    nombre: 'Plug-e',
    comisionPct: 10,
    notas: 'Acuerdo 2026-09-02. Tarjeta con QR en cada venta de protectores auditivos. 10% sobre el valor facturado de la venta de audífonos. Atribución sin caducidad.',
  },
];

async function main() {
  for (const a of ALIADOS) {
    const row = await prisma.referralPartner.upsert({
      where: { code: a.code },
      update: { nombre: a.nombre, comisionPct: a.comisionPct },
      create: { ...a, registroCode: nuevoCodigoRegistro(a.code) },
    });

    // Aliados creados antes de que existiera el registro por invitación.
    if (!row.registroCode) {
      await prisma.referralPartner.update({
        where: { id: row.id },
        data: { registroCode: nuevoCodigoRegistro(row.code) },
      });
    }

    console.log(`[seed-aliados] ${row.nombre} (${row.code}) → ${row.id}`);
  }
}

main()
  .catch((e) => { console.error('[seed-aliados]', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
