/**
 * Prerender estático post-build (SEO).
 *
 * Tras `vite build`, sirve `dist/` localmente, abre cada ruta con Chromium
 * (puppeteer), deja que el SPA renderice y pida datos al API, y guarda el HTML
 * ya renderizado en `dist/<ruta>/index.html`. Así Googlebot recibe contenido y
 * títulos/meta correctos en el PRIMER rastreo, sin depender de ejecutar JS.
 *
 * 100% NO-FATAL: cualquier error (Chromium no disponible, timeout, etc.) se
 * registra y el script sale con 0 → el build no se rompe y queda el SPA normal.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const API = process.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';
const ORIGIN = 'https://oirconecta.com';
const PORT = 4183;
const PAGE_TIMEOUT = 30000;
const MAX_ROUTES = 250;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.xml': 'application/xml', '.txt': 'text/plain', '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

const STATIC_ROUTES = [
  '/', '/nosotros', '/servicios', '/contacto', '/agendar', '/comparador', '/unete',
  '/ponte-en-sus-oidos', '/ecommerce', '/audifonos', '/implantes', '/blog',
  '/directorio', '/directorio/listado', '/profesionales/audiologos', '/profesionales/otologos',
  ...['widex', 'oticon', 'signia', 'phonak', 'resound', 'starkey', 'beltone', 'rexton', 'audioservice', 'bernafon', 'hansaton', 'sonic', 'unitron'].map((b) => `/audifonos/${b}`),
  ...['cochlear', 'advanced-bionics', 'med-el'].map((b) => `/implantes/${b}`),
  ...['audiologia', 'fonoaudiologia', 'otorrinolaringologia', 'otologia'].map((p) => `/directorio/profesion/${p}`),
];

async function routesFromSitemap() {
  try {
    const res = await fetch(`${API}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`sitemap ${res.status}`);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const paths = locs
      .filter((u) => u.startsWith(ORIGIN))
      .map((u) => u.slice(ORIGIN.length) || '/')
      .filter((p) => !/\.(xml|txt)$/.test(p));
    return paths;
  } catch (e) {
    console.warn('[prerender] no pude leer sitemap, uso lista estática:', e.message);
    return [];
  }
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = join(DIST, urlPath);
      let isFile = false;
      try { isFile = (await stat(filePath)).isFile(); } catch { /* no */ }
      if (!isFile) filePath = join(DIST, 'index.html'); // SPA fallback
      const body = await readFile(filePath);
      res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
      res.end(body);
    } catch {
      res.statusCode = 500; res.end('err');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch (e) {
    console.warn('[prerender] puppeteer no disponible, se omite:', e.message);
    return;
  }

  const dyn = await routesFromSitemap();
  const routes = [...new Set([...STATIC_ROUTES, ...dyn])].slice(0, MAX_ROUTES);
  console.log(`[prerender] ${routes.length} rutas a renderizar (API=${API})`);

  const server = await startServer();
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch (e) {
    console.warn('[prerender] no pude lanzar Chromium, se omite el prerender:', e.message);
    server.close();
    return;
  }

  let ok = 0, fail = 0;
  for (const route of routes) {
    let page;
    try {
      page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: PAGE_TIMEOUT });
      // Espera a que el root tenga contenido real.
      await page.waitForFunction(
        () => { const r = document.getElementById('root'); return r && r.children.length > 0 && document.body.innerText.trim().length > 200; },
        { timeout: 6000 },
      ).catch(() => {});
      // Emotion (MUI) inyecta el CSS por JS (insertRule) → NO queda en el HTML,
      // causando un flash sin estilos. Serializamos esas reglas y las incrustamos.
      const emotionCss = await page.evaluate(() => {
        let css = '';
        for (const sheet of Array.from(document.styleSheets)) {
          const node = sheet.ownerNode;
          if (node && node.tagName === 'STYLE' && node.hasAttribute('data-emotion')) {
            try { for (const rule of Array.from(sheet.cssRules)) css += rule.cssText; } catch { /* cross-origin */ }
          }
        }
        return css;
      }).catch(() => '');
      let html = await page.content();
      if (emotionCss && html.includes('</head>')) {
        html = html.replace('</head>', `<style data-emotion-ssr>${emotionCss}</style></head>`);
      }
      if (html && html.length > 2000 && html.includes('</body>')) {
        const clean = route.replace(/\/$/, '');
        // Escribe ambas formas para que Render sirva la URL limpia antes del
        // catch-all `/* → index.html`: `<ruta>.html` (pretty URL) y
        // `<ruta>/index.html` (directory index).
        const targets = route === '/'
          ? [join(DIST, 'index.html')]
          : [join(DIST, `${clean}.html`), join(DIST, clean, 'index.html')];
        for (const outPath of targets) {
          await mkdir(dirname(outPath), { recursive: true });
          await writeFile(outPath, html);
        }
        ok++;
      } else {
        fail++;
      }
    } catch (e) {
      fail++;
      console.warn(`[prerender] falló ${route}: ${e.message}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  await browser.close().catch(() => {});
  server.close();
  console.log(`[prerender] listo: ${ok} ok, ${fail} omitidas.`);
}

main()
  .catch((e) => console.warn('[prerender] error general (no-fatal):', e.message))
  .finally(() => process.exit(0));
