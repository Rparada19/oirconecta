/**
 * OirConecta Backend - Configuración de Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Render pone un proxy delante. Sin esto, `req.ip` es la IP del proxy para
// TODOS los visitantes → el rate limit anónimo (200/15 min) se comparte entre
// el mundo entero y el sitio empieza a mostrar "0 artículos" / listas vacías.
app.set('trust proxy', 1);

// ===========================================
// MIDDLEWARE DE SEGURIDAD
// ===========================================

// Helmet para cabeceras de seguridad
app.use(helmet());

// CORS (en dev: puertos configurables vía CORS_DEV_PORTS / CORS_DEV_ORIGINS)
const corsOrigins =
  config.nodeEnv === 'development'
    ? config.developmentCorsOriginUrls()
    : config.frontendOrigins;
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: desactivado en desarrollo (evita "Demasiadas solicitudes" con polling)
if (config.nodeEnv !== 'development') {
  // Más generoso para usuarios autenticados (admins/profesionales) — el token
  // ya identifica al usuario, no necesitamos límite tan estrecho. Sin token,
  // mantenemos un cap razonable contra abuso anónimo.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => (req.headers.authorization ? 1500 : 200),
    // La cadena de proxies varía (Cloudflare → static site de Render → API),
    // así que no confiamos en `req.ip`: tomamos la IP real del cliente del
    // primer salto. Si no, todos los anónimos caen en el mismo cubo.
    keyGenerator: (req) => {
      if (req.headers.authorization) return `auth:${req.headers.authorization.slice(-32)}`;
      const fwd = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '')
        .split(',')[0].trim();
      return fwd || req.ip || 'anon';
    },
    standardHeaders: true,
    legacyHeaders: false,
    // El prerender del build hace cientos de llamadas desde una sola IP; si lo
    // limitamos, las páginas se congelan como "no encontrado" y Google las
    // desindexa. Con el token compartido lo dejamos pasar.
    skip: (req) => Boolean(process.env.PRERENDER_TOKEN)
      && req.headers['x-prerender-token'] === process.env.PRERENDER_TOKEN,
    message: { success: false, error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  });
  app.use('/api/', limiter);
} else {
  console.log('[OirConecta] Rate limiting desactivado (entorno development)');
}

// ===========================================
// MIDDLEWARE GENERAL
// ===========================================

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Contexto de auditoría por request (AsyncLocalStorage). Captura ip y
// user-agent siempre; userId/userEmail solo si la ruta corrió antes auth.
app.use(require('./middleware/auditContextMiddleware'));

// ===========================================
// RUTAS
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'OirConecta API está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Observabilidad del scheduler in-process (T4). Devuelve último tick + estado
// por sub-job para detectar cuándo un cron dejó de correr o falla en bucle.
app.get('/health/crons', (req, res) => {
  try {
    const crons = require('./crons');
    res.json({ success: true, ...crons.getHealthStatus() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Raíz: muchos usuarios abren solo el host/puerto; sin esto siempre era 404.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OirConecta API — el backend no tiene interfaz web; usa estas rutas',
    try: {
      health: '/health',
      apiIndex: '/api',
    },
  });
});

// API routes
app.use('/api', routes);

// 410 Gone — rutas heredadas del hack SEO japonés en DreamHost.
// Render rewrite envía aquí /items/*, /shop/*, etc. para que Google las desindexe.
app.all('/gone/*', (req, res) => {
  res.set('X-Robots-Tag', 'noindex');
  res.status(410).type('text/plain').send('410 Gone');
});

// 404 real para rutas que no existen en el SPA.
// El static site de Render solo sabe responder 200; sin esto, CUALQUIER URL
// inventada devolvía el HTML del home y Google la indexaba como un duplicado
// de la portada — justo lo que mantenía vivas las 360.000 URLs del hack.
app.get('/notfound', (req, res) => {
  res.status(404).type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Página no encontrada — OírConecta</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#fbfcfc;color:#272F50;
       display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;}
  .caja{max-width:460px;text-align:center;}
  h1{font-family:Georgia,serif;font-size:1.75rem;font-weight:600;margin:0 0 12px;}
  p{color:#5b6b66;line-height:1.65;margin:0 0 28px;}
  a{display:inline-block;background:#085946;color:#fff;text-decoration:none;
    padding:13px 26px;border-radius:10px;font-weight:600;}
</style>
</head>
<body>
  <div class="caja">
    <h1>No encontramos esta página</h1>
    <p>Puede que el enlace esté viejo o que la dirección tenga un error. Desde el inicio puedes llegar al directorio, al blog y a los audífonos.</p>
    <a href="https://oirconecta.com/">Ir al inicio</a>
  </div>
</body>
</html>`);
});

// Sitemap dinámico: incluye páginas fijas + todos los blog posts publicados
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const posts = await prisma.blogPost.findMany({
      where: { estado: 'PUBLICADO' },
      select: { slug: true, updatedAt: true, publishedAt: true, coverUrl: true, titulo: true },
      orderBy: { publishedAt: 'desc' },
    });

    const img = (slug, title) => ({ loc: `https://oirconecta.com/img/${slug}`, title });
    const STATIC_URLS = [
      { loc: 'https://oirconecta.com/', priority: '1.0', changefreq: 'weekly',
        image: img('familia-disfrutando-mejor-audicion.jpg', 'Familia disfrutando momentos juntos gracias a una mejor audición') },
      { loc: 'https://oirconecta.com/nosotros', priority: '0.6', changefreq: 'monthly',
        image: img('clinica-auditiva-equipo-profesional.jpg', 'Equipo profesional de clínica auditiva en Colombia') },
      { loc: 'https://oirconecta.com/servicios', priority: '0.7', changefreq: 'monthly',
        image: img('audiologo-prueba-audicion.jpg', 'Audiólogo realizando prueba de audición') },
      { loc: 'https://oirconecta.com/contacto', priority: '0.5', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/unete', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/precios', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/agendar', priority: '0.8', changefreq: 'monthly',
        image: img('audiologa-consulta-paciente.jpg', 'Agenda cita con audióloga en Colombia') },
      { loc: 'https://oirconecta.com/directorio', priority: '0.9', changefreq: 'daily',
        image: img('directorio-profesionales-audicion.jpg', 'Directorio de profesionales de la audición en Colombia') },
      { loc: 'https://oirconecta.com/directorio/listado', priority: '0.8', changefreq: 'daily',
        image: img('directorio-profesionales-audicion.jpg', 'Listado de audiólogos, otólogos y centros auditivos') },
      { loc: 'https://oirconecta.com/profesionales/audiologos', priority: '0.8', changefreq: 'weekly',
        image: img('audiologa-profesional-colombia.jpg', 'Audiólogos profesionales en Colombia') },
      { loc: 'https://oirconecta.com/profesionales/otologos', priority: '0.8', changefreq: 'weekly',
        image: img('otorrinolaringologo-profesional.jpg', 'Otólogos y otorrinolaringólogos en Colombia') },
      { loc: 'https://oirconecta.com/comparador', priority: '0.8', changefreq: 'weekly',
        image: img('audifono-tecnologia-moderna.jpg', 'Comparador de audífonos con tecnología moderna') },
      { loc: 'https://oirconecta.com/ponte-en-sus-oidos', priority: '0.9', changefreq: 'monthly',
        image: img('familia-disfrutando-mejor-audicion.jpg', 'Simulador de pérdida auditiva: escucha como tu familiar con hipoacusia') },
      { loc: 'https://oirconecta.com/ecommerce', priority: '0.8', changefreq: 'weekly',
        image: img('accesorios-audifonos-pilas.jpg', 'Accesorios para audífonos: pilas, filtros y domos') },
      { loc: 'https://oirconecta.com/audifonos', priority: '0.9', changefreq: 'weekly',
        image: img('audifono-retroauricular-bte.jpg', 'Audífonos retroauriculares y otros tipos disponibles en Colombia') },
      { loc: 'https://oirconecta.com/implantes', priority: '0.9', changefreq: 'weekly',
        image: img('audifono-tecnologia-moderna.jpg', 'Implantes cocleares y soluciones auditivas avanzadas') },
      { loc: 'https://oirconecta.com/blog', priority: '0.9', changefreq: 'daily',
        image: img('centro-auditivo-colombia.jpg', 'Blog OírConecta sobre audición, audífonos y salud auditiva') },
    ];
    const BRANDS_AUD = ['widex','oticon','signia','phonak','resound','starkey','beltone','rexton','audioservice','bernafon','hansaton','sonic','unitron'];
    const BRANDS_IMP = ['cochlear','advanced-bionics','medel'];
    // Barra final: Render sirve el HTML prerenderizado (dist/<ruta>/index.html)
    // de forma nativa en la URL con barra; sin barra devuelve el cascarón.
    BRANDS_AUD.forEach((b) => STATIC_URLS.push({ loc: `https://oirconecta.com/audifonos/${b}/`, priority: '0.7', changefreq: 'monthly' }));
    BRANDS_IMP.forEach((b) => STATIC_URLS.push({ loc: `https://oirconecta.com/implantes/${b}/`, priority: '0.7', changefreq: 'monthly' }));
    const PROFESIONES = ['audiologia','fonoaudiologia','otorrinolaringologia','otologia'];
    PROFESIONES.forEach((p) => STATIC_URLS.push({ loc: `https://oirconecta.com/directorio/profesion/${p}`, priority: '0.85', changefreq: 'weekly' }));

    const escapeXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    const absUrl = (u) => u && u.startsWith('/') ? `https://oirconecta.com${u}` : u;
    const blogUrls = posts.map((p) => ({
      loc: `https://oirconecta.com/blog/${p.slug}/`,
      lastmod: (p.updatedAt || p.publishedAt || new Date()).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.7',
      image: p.coverUrl ? { loc: absUrl(p.coverUrl), title: p.titulo } : null,
    }));

    const all = [...STATIC_URLS, ...blogUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${all.map((u) => {
  const imageTag = u.image
    ? `\n    <image:image><image:loc>${escapeXml(u.image.loc)}</image:loc><image:title>${escapeXml(u.image.title)}</image:title></image:image>`
    : '';
  const locSlash = u.loc.endsWith('/') ? u.loc : `${u.loc}/`; // barra final = URL que sirve el prerender
  return `  <url><loc>${locSlash}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${imageTag}</url>`;
}).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
    await prisma.$disconnect();
  } catch (e) {
    res.status(500).type('text/plain').send('sitemap error: ' + e.message);
  }
});

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// ===========================================
// MANEJO DE ERRORES
// ===========================================

app.use(errorHandler);

module.exports = app;
