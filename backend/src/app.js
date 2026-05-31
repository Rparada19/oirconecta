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
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

// Sitemap dinámico: incluye páginas fijas + todos los blog posts publicados
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const posts = await prisma.blogPost.findMany({
      where: { estado: 'PUBLICADO' },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    const STATIC_URLS = [
      { loc: 'https://oirconecta.com/', priority: '1.0', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/nosotros', priority: '0.6', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/servicios', priority: '0.7', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/contacto', priority: '0.5', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/agendar', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://oirconecta.com/directorio', priority: '0.9', changefreq: 'daily' },
      { loc: 'https://oirconecta.com/directorio/listado', priority: '0.8', changefreq: 'daily' },
      { loc: 'https://oirconecta.com/profesionales/audiologos', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/profesionales/otologos', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/comparador', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/ecommerce', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/audifonos', priority: '0.9', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/implantes', priority: '0.9', changefreq: 'weekly' },
      { loc: 'https://oirconecta.com/blog', priority: '0.9', changefreq: 'daily' },
    ];
    const BRANDS_AUD = ['widex','oticon','signia','phonak','resound','starkey','beltone','rexton','audioservice','bernafon','hansaton','sonic','unitron'];
    const BRANDS_IMP = ['cochlear','advanced-bionics','med-el'];
    BRANDS_AUD.forEach((b) => STATIC_URLS.push({ loc: `https://oirconecta.com/audifonos/${b}`, priority: '0.7', changefreq: 'monthly' }));
    BRANDS_IMP.forEach((b) => STATIC_URLS.push({ loc: `https://oirconecta.com/implantes/${b}`, priority: '0.7', changefreq: 'monthly' }));

    const blogUrls = posts.map((p) => ({
      loc: `https://oirconecta.com/blog/${p.slug}`,
      lastmod: (p.updatedAt || p.publishedAt || new Date()).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.7',
    }));

    const all = [...STATIC_URLS, ...blogUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
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
