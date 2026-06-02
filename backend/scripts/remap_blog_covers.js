/**
 * Remapea coverUrl de los 26 artículos sembrados (slugs sin prefijo numérico)
 * a fotografía real verificada (Unsplash/Pexels). Idempotente: sobrescribe SIEMPRE
 * para reemplazar las imágenes IA originales de Pollinations.
 *
 * Uso: node scripts/remap_blog_covers.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const U = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
const P = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?w=${w}&auto=compress&cs=tinysrgb&fit=crop`;

const COVERS = {
  'tipos-de-perdida-auditiva':              P(5206951),
  'causas-perdida-auditiva-adultos':        U('1576669801945-7a346954da5a'),
  'perdida-auditiva-ninos':                 U('1632053002928-1919605ee6f7'),
  'valoracion-auditiva-completa':           U('1505751172876-fa1923c5c528'),
  'implante-coclear-guia':                  P(14682242),
  'adaptacion-audifonos-primeras-semanas':  U('1576669801945-7a346954da5a'),
  'tinnitus-zumbido-oido':                  P(6319017),
  'perdida-auditiva-subita':                U('1631558556874-1d127211f574'),
  'higiene-del-oido':                       P(5206946),
  'presbiacusia':                           P(16852335),
  'limpieza-diaria-audifonos':              P(5206946),
  'baterias-vs-recargables-audifonos':      P(3921830),
  'humedad-secado-audifonos':               P(3921830),
  'audifonos-deporte-sudor':                P(6293191),
  'vida-util-audifono':                     P(14682242),
  'audifono-mojado-que-hacer':              P(9130517),
  'moldes-cupulas-audifonos':               P(6319017),
  'audifonos-ninos-cuidado-especial':       U('1632053002928-1919605ee6f7'),
  'viajar-con-audifonos':                   P(7009459),
  'problemas-audifono-soluciones-rapidas':  U('1631558556874-1d127211f574'),
  'guia-elegir-primer-audifono':            U('1576669801945-7a346954da5a'),
  'que-es-la-audiometria':                  P(5206951),
  'vida-con-hipoacusia-consejos':           P(27567505),
  'audifonos-recargables-vs-pilas':         P(9130517),
  'proteger-tu-audicion-ruido':             P(29988954),
  'comunicacion-familiar-perdida-auditiva': P(8958906),
};

async function main() {
  let updated = 0, skipped = 0;
  for (const [slug, url] of Object.entries(COVERS)) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) {
      console.log(`⊘ ${slug}: no existe`);
      skipped++;
      continue;
    }
    await prisma.blogPost.update({ where: { slug }, data: { coverUrl: url } });
    console.log(`✓ ${slug}`);
    updated++;
  }
  console.log(`\n${updated} actualizados, ${skipped} omitidos.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
