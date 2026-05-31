/**
 * Lee todos los .md en backend/content/blog/, parsea su frontmatter
 * y upsert al modelo BlogPost (Prisma). Idempotente por slug.
 *
 * Uso:
 *   cd backend && node scripts/seed_blog_articles.js
 *
 * Para publicar inmediatamente, marca estado: PUBLICADO y publishedAt: <fecha ISO>
 * en el frontmatter del artículo. Por defecto entran como BORRADOR.
 */

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'blog');

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`No existe ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  if (!files.length) {
    console.log('No hay archivos .md para procesar.');
    return;
  }

  console.log(`Procesando ${files.length} artículo(s)...\n`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const file of files.sort()) {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf8');

    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      console.error(`✗ ${file}: error parseando frontmatter — ${err.message}`);
      errors++;
      continue;
    }

    const fm = parsed.data || {};
    // Cortar el bloque "Notas para el editor (no publicar)" si existe.
    // Convención: una línea con solo "---" seguida de "**Notas para el editor"
    let rawContent = parsed.content || '';
    const cutPattern = /\n---\s*\n\s*\*\*Notas para el editor[\s\S]*$/;
    rawContent = rawContent.replace(cutPattern, '');
    const contenido = rawContent.trim();

    const slug = fm.slug;
    const titulo = fm.titulo;

    if (!slug || !titulo) {
      console.error(`✗ ${file}: falta 'slug' o 'titulo' en frontmatter`);
      errors++;
      continue;
    }

    const data = {
      slug,
      titulo,
      resumen: fm.resumen || null,
      contenido,
      coverUrl: fm.coverUrl || null,
      categoria: fm.categoria || 'general',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      estado: (fm.estado || 'BORRADOR').toUpperCase(),
      destacado: Boolean(fm.destacado),
      autorNombre: fm.autorNombre || 'OírConecta',
      publishedAt: fm.publishedAt ? new Date(fm.publishedAt) : null,
    };

    try {
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) {
        await prisma.blogPost.update({ where: { slug }, data });
        console.log(`↻ ${slug} (actualizado)`);
        updated++;
      } else {
        await prisma.blogPost.create({ data });
        console.log(`✓ ${slug} (creado)`);
        created++;
      }
    } catch (err) {
      console.error(`✗ ${slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nResumen: ${created} creados · ${updated} actualizados · ${errors} errores`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
