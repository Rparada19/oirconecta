/**
 * Asigna coverUrl a artículos huérfanos del blog (sembrados antes
 * de que existieran los .md). Idempotente: solo actualiza si está null.
 *
 * Uso: node scripts/seed_blog_covers.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COVERS = {
  'comunicacion-familiar-perdida-auditiva': 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1600&q=80',
  'proteger-tu-audicion-ruido': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1600&q=80',
  'audifonos-recargables-vs-pilas': 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1600&q=80',
  'vida-con-hipoacusia-consejos': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1600&q=80',
  'que-es-la-audiometria': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1600&q=80',
  'guia-elegir-primer-audifono': 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=1600&q=80',
};

async function main() {
  let updated = 0;
  for (const [slug, url] of Object.entries(COVERS)) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) {
      console.log(`⊘ ${slug}: no existe en DB`);
      continue;
    }
    if (post.coverUrl) {
      console.log(`· ${slug}: ya tiene cover`);
      continue;
    }
    await prisma.blogPost.update({ where: { slug }, data: { coverUrl: url } });
    console.log(`✓ ${slug}: cover asignado`);
    updated++;
  }
  console.log(`\n${updated} covers asignados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
