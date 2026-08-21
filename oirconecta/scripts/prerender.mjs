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
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const API = process.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';
const ORIGIN = 'https://oirconecta.com';
const PORT = 4183;
const PAGE_TIMEOUT = 30000;
// Sin este token el API aplica rate limit (200 req/15 min por IP) y el
// prerender recibe 429 → páginas congeladas como "no encontrado".
const PRERENDER_TOKEN = process.env.PRERENDER_TOKEN || '';
const apiCache = new Map();
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
  ...['cochlear', 'advanced-bionics', 'medel'].map((b) => `/implantes/${b}`),
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
      // Proxy del API: el bundle llama a `/api/...` (relativo) o al dominio de
      // Render. Sirviéndolo aquí, el prerender obtiene datos reales y ninguna
      // página se congela como "no encontrado".
      if ((req.url || '').startsWith('/api/')) {
        // `path=` solo varía por ruta y multiplica las llamadas (una por
        // página); para el prerender la respuesta es equivalente.
        const key = req.url.replace(/([?&])path=[^&]*/, '$1');
        const hit = apiCache.get(key);
        const up = hit || await (async () => {
          const r = await fetch(`${API}${req.url}`, {
            headers: PRERENDER_TOKEN ? { 'x-prerender-token': PRERENDER_TOKEN } : {},
            signal: AbortSignal.timeout(20000),
          });
          const entry = { status: r.status, type: r.headers.get('content-type') || 'application/json', body: Buffer.from(await r.arrayBuffer()) };
          if (r.ok) apiCache.set(key, entry);
          return entry;
        })();
        res.statusCode = up.status;
        res.setHeader('Content-Type', up.type);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(up.body);
        return;
      }
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
    // Resolvemos desde la raíz del front: `scripts/` tiene su propio
    // node_modules (extractores) con un puppeteer viejo cuyo Chromium no abre.
    const require = createRequire(join(__dirname, '..', 'package.json'));
    puppeteer = (await import(pathToFileURL(require.resolve('puppeteer')).href)).default;
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
      // `--disable-web-security`: durante el prerender el origen es
      // http://localhost:4183, que NO está en la lista CORS del API. Sin esto,
      // TODOS los fetch al API fallan y las páginas se congelan como "no
      // encontrado" + noindex. Es un Chromium efímero de build, no un navegador
      // de usuario.
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
             '--disable-web-security', '--user-data-dir=/tmp/prerender-profile'],
    });
  } catch (e) {
    console.warn('[prerender] no pude lanzar Chromium, se omite el prerender:', e.stack || e.message);
    server.close();
    return;
  }

  let ok = 0, fail = 0;
  for (const route of routes) {
    let page;
    try {
      page = await browser.newPage();
      // El bundle apunta al API absoluto de Render; desde localhost eso es
      // cross-origin y CORS lo bloquea. Redirigimos esas llamadas al proxy
      // local (mismo origen) para que el prerender vea datos reales.
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        const u = r.url();
        if (u.startsWith(`${API}/api/`)) {
          r.continue({ url: `http://localhost:${PORT}${u.slice(API.length)}` });
        } else {
          r.continue();
        }
      });
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
      // GUARDA CRÍTICA: si el snapshot quedó con `noindex` (p. ej. el API estaba
      // dormido y la página renderizó "no encontrado"), NO lo escribimos. Un
      // HTML así congelado hace que Google desindexe la URL.
      if (/name="robots"[^>]*noindex/i.test(html) || html.includes('No pudimos cargar')) {
        console.warn(`[prerender] ${route}: HTML con noindex/error → descartado (¿API caído?)`);
        fail++;
      } else if (html && html.length > 2000 && html.includes('</body>')) {
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
