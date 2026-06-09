/**
 * Regenera public/sitemap.xml con TODAS las URLs reales del portal.
 * Se ejecuta automáticamente antes de `vite build` (script "prebuild").
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://oirconecta.com';
const API = process.env.SITEMAP_API_URL || 'https://oirconecta-api.onrender.com';
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/nosotros', changefreq: 'monthly', priority: '0.6' },
  { loc: '/servicios', changefreq: 'monthly', priority: '0.7' },
  { loc: '/contacto', changefreq: 'monthly', priority: '0.5' },
  { loc: '/agendar', changefreq: 'monthly', priority: '0.8' },
  { loc: '/directorio', changefreq: 'daily', priority: '0.9' },
  { loc: '/directorio/listado', changefreq: 'daily', priority: '0.8' },
  { loc: '/directorio/profesion/audiologia', changefreq: 'weekly', priority: '0.85' },
  { loc: '/directorio/profesion/fonoaudiologia', changefreq: 'weekly', priority: '0.85' },
  { loc: '/directorio/profesion/otorrinolaringologia', changefreq: 'weekly', priority: '0.85' },
  { loc: '/directorio/profesion/otologia', changefreq: 'weekly', priority: '0.85' },
  { loc: '/comparador-ia', changefreq: 'weekly', priority: '0.8' },
  { loc: '/audifonos', changefreq: 'weekly', priority: '0.9' },
  { loc: '/implantes', changefreq: 'weekly', priority: '0.9' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
  { loc: '/registro-profesional', changefreq: 'monthly', priority: '0.6' },
  { loc: '/legal', changefreq: 'yearly', priority: '0.3' },
];

const MARCAS_AUDIFONOS = [
  'widex', 'oticon', 'signia', 'phonak', 'resound', 'starkey', 'beltone',
  'rexton', 'audioservice', 'bernafon', 'hansaton', 'sonic', 'unitron',
];
const MARCAS_IMPLANTES = ['cochlear', 'advanced-bionics', 'medel'];

function fetchJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(20000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  const urls = [];

  STATIC.forEach((u) => urls.push({ ...u, lastmod: TODAY }));
  MARCAS_AUDIFONOS.forEach((m) => urls.push({
    loc: `/audifonos/${m}`, lastmod: TODAY, changefreq: 'monthly', priority: '0.7',
  }));
  MARCAS_IMPLANTES.forEach((m) => urls.push({
    loc: `/implantes/${m}`, lastmod: TODAY, changefreq: 'monthly', priority: '0.7',
  }));

  console.log('[sitemap] consultando blog…');
  const blogResp = await fetchJson(`${API}/api/blog?limit=200`);
  const blogPosts = blogResp?.data?.items || blogResp?.data || [];
  if (Array.isArray(blogPosts)) {
    blogPosts
      .filter((p) => p.estado === 'PUBLICADO' || p.estado === undefined)
      .forEach((p) => {
        if (p.slug) urls.push({
          loc: `/blog/${p.slug}`,
          lastmod: String(p.publishedAt || p.updatedAt || p.createdAt || TODAY).slice(0, 10),
          changefreq: 'monthly', priority: '0.7',
        });
      });
  }
  console.log(`[sitemap] ${Array.isArray(blogPosts) ? blogPosts.length : 0} blog posts`);

  console.log('[sitemap] consultando directorio…');
  const dirResp = await fetchJson(`${API}/api/directory/search?limit=500`);
  const profiles = dirResp?.data?.items || dirResp?.data || [];
  if (Array.isArray(profiles)) {
    profiles.forEach((p) => {
      if (p.id) urls.push({
        loc: `/profesional/${p.id}`,
        lastmod: String(p.updatedAt || TODAY).slice(0, 10),
        changefreq: 'weekly', priority: '0.75',
      });
    });
  }
  console.log(`[sitemap] ${Array.isArray(profiles) ? profiles.length : 0} perfiles del directorio`);

  const seen = new Set();
  const dedup = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc); return true;
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...dedup.map((u) =>
      `  <url><loc>${ORIGIN}${u.loc}</loc>` +
      `<lastmod>${u.lastmod}</lastmod>` +
      `<changefreq>${u.changefreq}</changefreq>` +
      `<priority>${u.priority}</priority></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

  const out = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(out, xml, 'utf8');
  console.log(`[sitemap] ✓ ${dedup.length} URLs escritas en public/sitemap.xml`);
}

main().catch((e) => {
  console.error('[sitemap] fallo:', e.message);
  process.exit(0);
});
