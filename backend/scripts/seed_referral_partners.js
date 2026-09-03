/**
 * Aliados referidores. Idempotente: upsert por `code`.
 *
 * El `code` es lo que viaja en el mensaje prellenado del QR de la tarjeta:
 *   https://wa.me/<numero>?text=Vengo%20de%20Plug-e
 * Se compara sin tildes ni signos, así que "Plug-e", "plug e" y "PLUGE" valen.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
      create: a,
    });
    console.log(`[seed-aliados] ${row.nombre} (${row.code}) → ${row.id}`);
  }
}

main()
  .catch((e) => { console.error('[seed-aliados]', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
