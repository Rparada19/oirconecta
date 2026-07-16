import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Chip, Stack, Button, CircularProgress, Divider, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkIcon from '@mui/icons-material/Link';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsletterCTA from '../components/NewsletterCTA';
import PreviewSlot from '../components/marketing/PreviewSlot';
import { trackEntityEvent, trackEvent } from '../utils/analytics';
import { fbqTrack } from '../utils/metaPixel';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const CATEGORIAS = {
  productos: 'Productos y tecnología',
  salud: 'Salud auditiva',
  'estilo-de-vida': 'Estilo de vida',
  guias: 'Guías y educación',
  cuidados: 'Mantenimiento y cuidados',
  comparativas: 'Comparativas',
  glosario: 'Glosario auditivo',
  tecnologia: 'Tecnología',
  lanzamientos: 'Nuevos lanzamientos',
  casos: 'Casos y testimonios',
  general: 'General',
};

const CAT_COLOR = {
  productos: '#085946',
  salud: '#272F50',
  'estilo-de-vida': '#71A095',
  guias: '#085946',
  cuidados: '#0d7a5f',
  comparativas: '#1a2240',
  glosario: '#C9A86A',
  tecnologia: '#272F50',
  lanzamientos: '#d97706',
  casos: '#71A095',
  general: '#6b7280',
};

function calcReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

const DEMO_POSTS = {
  '1': {
    id: '1', slug: '1',
    titulo: 'Guía para elegir tu primer audífono',
    resumen: 'Conoce los factores clave para seleccionar el dispositivo que mejor se adapta a tu tipo de pérdida auditiva y estilo de vida.',
    contenido: `Elegir un audífono es una decisión importante que impacta directamente tu calidad de vida. Aquí te explicamos los aspectos esenciales que debes considerar antes de tomar una decisión.\n\n## Tipo de pérdida auditiva\n\nEl primer paso es realizarte una audiometría con un audiólogo certificado. El resultado determina el grado y tipo de pérdida auditiva, lo que guía la selección del dispositivo adecuado.\n\n## Estilo de vida\n\nTus actividades diarias influyen en qué tipo de audífono te conviene. Si practicas deportes, necesitas un modelo resistente al sudor. Si trabajas en ambientes ruidosos, prioriza audífonos con cancelación de ruido avanzada.\n\n## Tecnología y conectividad\n\nLos audífonos modernos se conectan al teléfono vía Bluetooth, permiten streaming de audio y se controlan desde una app. Considera si estas características son importantes para ti.\n\n## Presupuesto\n\nLos precios varían ampliamente según marca y tecnología. OírConecta te ofrece información de referencia de precios para que compares con transparencia antes de visitar a un especialista.`,
    categoria: 'productos',
    autorNombre: 'OírConecta',
    publishedAt: '2025-04-10T00:00:00Z',
  },
  '2': {
    id: '2', slug: '2',
    titulo: '¿Qué es la audiometría y cuándo hacerla?',
    resumen: 'La audiometría es la prueba de referencia para evaluar tu audición. Te explicamos en qué consiste y cada cuánto debes realizarla.',
    contenido: `La audiometría es la prueba estándar para medir la capacidad auditiva. Consiste en escuchar sonidos a distintas frecuencias e intensidades en una cabina insonorizada, y señalar cuándo los percibes.\n\n## ¿Qué mide?\n\nMide el umbral auditivo: el tono más suave que puedes escuchar en cada frecuencia. El resultado se plasma en un audiograma, que muestra visualmente el perfil de tu audición.\n\n## ¿Cuándo hacerla?\n\n- **Niños**: al nacer (tamizaje neonatal) y periódicamente durante el desarrollo.\n- **Adultos**: cada 2-3 años a partir de los 50 años, o antes si notas dificultad para escuchar conversaciones.\n- **Con exposición a ruido**: anualmente si trabajas en ambientes ruidosos.\n- **Ante síntomas**: zumbidos, sensación de oído tapado o dificultad repentina para escuchar.\n\n## ¿Duele?\n\nNo, es completamente indolora y dura entre 20 y 40 minutos. El resultado lo interpreta un audiólogo o médico ORL.`,
    categoria: 'salud',
    autorNombre: 'OírConecta',
    publishedAt: '2025-03-22T00:00:00Z',
  },
  '3': {
    id: '3', slug: '3',
    titulo: 'Vida con hipoacusia: consejos prácticos',
    resumen: 'Pequeños ajustes en el hogar, el trabajo y el entorno social que hacen una gran diferencia para quienes conviven con pérdida auditiva.',
    contenido: `Vivir con pérdida auditiva no significa renunciar a una vida plena. Con algunos ajustes en el entorno y los hábitos cotidianos, la comunicación mejora significativamente.\n\n## En el hogar\n\n- Usa alertas visuales para el timbre y el detector de humo.\n- Subtitula el televisor y aumenta el contraste visual en subtítulos.\n- Reduce el ruido de fondo al hablar: apaga el televisor o la radio.\n\n## En el trabajo\n\n- Infórmale a tu equipo sobre tu condición — la mayoría adapta su comunicación con gusto.\n- Pide que te hablen de frente para aprovechar la lectura labial.\n- Usa auriculares con cancelación de ruido en espacios abiertos.\n\n## En entornos sociales\n\n- Elige mesas en rincones tranquilos en restaurantes.\n- No finjas entender — pide que repitan sin pena.\n- Infórmate sobre grupos de apoyo para personas con hipoacusia en tu ciudad.\n\n## Con tu audífono\n\nSi ya usas audífono, llévalo siempre cargado y no lo guardes. El cerebro necesita estimulación constante para mantener la comprensión del habla.`,
    categoria: 'estilo-de-vida',
    autorNombre: 'OírConecta',
    publishedAt: '2025-03-05T00:00:00Z',
  },
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

const MD_COMPONENTS = {
  h1: ({ children }) => <Typography component="h1" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: { xs: '2rem', md: '2.625rem' }, fontWeight: 600, color: '#272F50', mt: 6, mb: 2.5, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{children}</Typography>,
  h2: ({ children }) => (
    <Typography component="h2" sx={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: { xs: '1.75rem', md: '2.25rem' },
      fontWeight: 600,
      color: '#272F50',
      mt: 8,
      mb: 3,
      pb: 1.5,
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
      borderBottom: '2px solid #C9A86A',
      display: 'inline-block',
      pr: 2,
    }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => <Typography component="h3" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 600, color: '#272F50', mt: 5, mb: 1.75, letterSpacing: '-0.01em' }}>{children}</Typography>,
  h4: ({ children }) => <Typography component="h4" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.15rem', fontWeight: 600, color: '#272F50', mt: 3.5, mb: 1.25 }}>{children}</Typography>,
  p: ({ children }) => <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: { xs: '1.0625rem', md: '1.15rem' }, color: '#272F50', lineHeight: 1.75, mb: 3, letterSpacing: '0.003em' }}>{children}</Typography>,
  ul: ({ children }) => (
    <Box component="ul" sx={{
      pl: 0,
      mb: 3.5,
      listStyle: 'none',
      '& > li': {
        position: 'relative',
        pl: 3.5,
        fontSize: { xs: '1.0625rem', md: '1.125rem' },
        color: '#1f2937',
        lineHeight: 1.85,
        mb: 1.25,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 6,
          top: '0.7em',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#085946',
        },
      },
    }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{
      pl: 0,
      mb: 3.5,
      counterReset: 'item',
      listStyle: 'none',
      '& > li': {
        position: 'relative',
        pl: 4,
        fontSize: { xs: '1.0625rem', md: '1.125rem' },
        color: '#1f2937',
        lineHeight: 1.85,
        mb: 1.5,
        counterIncrement: 'item',
        '&::before': {
          content: 'counter(item)',
          position: 'absolute',
          left: 0,
          top: '0.15em',
          width: 26,
          height: 26,
          borderRadius: '50%',
          backgroundColor: '#085946',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8125rem',
          fontWeight: 700,
        },
      },
    }}>
      {children}
    </Box>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 700, color: '#272F50' }}>{children}</Box>,
  em: ({ children }) => <Box component="em" sx={{ fontStyle: 'italic' }}>{children}</Box>,
  a: ({ href, children }) => {
    const isExternal = href && /^https?:\/\//i.test(href);
    return (
      <Box
        component="a"
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        sx={{ color: '#085946', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px', '&:hover': { color: '#0d7a5f' } }}
      >
        {children}
      </Box>
    );
  },
  blockquote: ({ children }) => (
    <Box sx={{ borderLeft: '4px solid #C9A86A', pl: 2.5, py: 1, my: 3, bgcolor: 'rgba(201,168,106,0.08)', borderRadius: '0 8px 8px 0', '& p': { color: '#272F50', fontStyle: 'italic' } }}>
      {children}
    </Box>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <Box component="code" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', bgcolor: '#f3f4f6', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: '0.9375em' }}>{children}</Box>
    ) : (
      <Box component="pre" sx={{ fontFamily: 'ui-monospace, monospace', bgcolor: '#272F50', color: '#e5e7eb', p: 2, borderRadius: 1, overflow: 'auto', my: 2 }}>
        <code>{children}</code>
      </Box>
    ),
  hr: () => (
    <Box sx={{
      my: 5,
      display: 'flex',
      justifyContent: 'center',
      '&::before, &::after': {
        content: '""',
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
        alignSelf: 'center',
      },
      '&::after': { ml: 2 },
      '&::before': { mr: 2 },
    }}>
      <Box sx={{ color: '#C9A86A', fontSize: '1.5rem', lineHeight: 1 }}>◆</Box>
    </Box>
  ),
  table: ({ children }) => (
    <Box sx={{ overflowX: 'auto', my: 4, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: { xs: '0.9375rem', md: '1rem' } }}>{children}</Box>
    </Box>
  ),
  thead: ({ children }) => <Box component="thead" sx={{ bgcolor: '#085946', '& th': { color: '#fff !important' } }}>{children}</Box>,
  tbody: ({ children }) => <Box component="tbody">{children}</Box>,
  tr: ({ children }) => <Box component="tr" sx={{ borderBottom: '1px solid #e5e7eb', '&:last-child': { borderBottom: 'none' }, '&:nth-of-type(even)': { backgroundColor: '#f9fafb' } }}>{children}</Box>,
  th: ({ children }) => <Box component="th" sx={{ textAlign: 'left', fontWeight: 700, p: 1.75 }}>{children}</Box>,
  td: ({ children }) => <Box component="td" sx={{ p: 1.75, color: '#1f2937', lineHeight: 1.6 }}>{children}</Box>,
  img: ({ src, alt }) => (
    <Box sx={{ my: 4.5 }}>
      <Box
        component="img"
        src={src}
        alt={alt || ''}
        loading="lazy"
        decoding="async"
        sx={{
          width: '100%',
          height: 'auto',
          borderRadius: 3,
          display: 'block',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      />
      {alt && (
        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', mt: 1.5 }}>
          {alt}
        </Typography>
      )}
    </Box>
  ),
};

function renderContent(text) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {text || ''}
    </ReactMarkdown>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        const p = data.data || data.post || data;
        setPost(p);
        setLoading(false);
        // D2 — evento blog_view
        trackEntityEvent('blog_view', {
          entityType: 'BlogPost',
          entityId: p?.id || slug,
          properties: { slug, categoria: p?.categoria || null },
        });
        fbqTrack('ViewContent', {
          content_type: 'article',
          content_ids: [slug],
          content_category: p?.categoria || 'blog',
        });
      })
      .catch(() => {
        const demo = DEMO_POSTS[slug];
        if (demo) {
          setPost(demo); setLoading(false);
          trackEntityEvent('blog_view', {
            entityType: 'BlogPost', entityId: slug,
            properties: { slug, demo: true },
          });
        } else { setNotFound(true); setLoading(false); }
      });
  }, [slug]);

  // D2 — scroll depth 50% y 100% (una vez cada uno por artículo)
  useEffect(() => {
    if (!post) return;
    let reached50 = false;
    let reached100 = false;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const total = doc.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrollTop / total) : 0;
      if (!reached50 && pct >= 0.5) {
        reached50 = true;
        trackEvent('blog_read_50', null, { slug: post.slug || slug });
      }
      if (!reached100 && pct >= 0.95) {
        reached100 = true;
        trackEvent('blog_read_100', null, { slug: post.slug || slug });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [post, slug]);

  const catColor = CAT_COLOR[post?.categoria] || '#6b7280';
  const catLabel = CATEGORIAS[post?.categoria] || post?.categoria || '';

  const seoTitle = post?.titulo ? `${post.titulo} | Blog OírConecta` : 'Blog OírConecta — Salud auditiva';
  const seoDesc = post?.resumen || post?.descripcion || 'Artículos sobre audición, audífonos, prevención y bienestar auditivo en OírConecta.';
  const seoSlug = post?.slug || slug || '';

  const readingMin = useMemo(() => calcReadingTime(post?.contenido), [post?.contenido]);
  const articleUrl = `https://oirconecta.com/blog/${seoSlug}`;
  const heroCover = post?.coverUrl || null;

  const handleShare = (network) => {
    if (typeof window === 'undefined') return;
    const u = encodeURIComponent(articleUrl);
    const t = encodeURIComponent(post?.titulo || '');
    if (network === 'whatsapp') window.open(`https://wa.me/?text=${t}%20${u}`, '_blank');
    else if (network === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank');
    else if (network === 'copy') {
      navigator.clipboard?.writeText(articleUrl);
    }
  };

  const articleJsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.titulo,
    description: post.resumen || '',
    image: post.coverUrl || 'https://oirconecta.com/logo-oirconecta.png',
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: post.autorNombre || 'OírConecta', url: 'https://oirconecta.com' },
    publisher: {
      '@type': 'Organization',
      name: 'OírConecta',
      logo: { '@type': 'ImageObject', url: 'https://oirconecta.com/logo-oirconecta.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  } : null;

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={articleUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={articleUrl} />
        {post?.coverUrl && <meta property="og:image" content={post.coverUrl} />}
        {post?.coverUrl && <meta property="twitter:image" content={post.coverUrl} />}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="article:published_time" content={post?.publishedAt || ''} />
        <meta property="article:author" content={post?.autorNombre || 'OírConecta'} />
        {articleJsonLd && <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>}
      </Helmet>
      <Header />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={40} thickness={4} sx={{ color: '#085946' }} />
        </Box>
      ) : notFound ? (
        <Container maxWidth="md" sx={{ py: 16, textAlign: 'center' }}>
          <ArticleOutlinedIcon sx={{ fontSize: 56, color: 'rgba(8,89,70,0.2)', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Artículo no encontrado</Typography>
          <Button component={RouterLink} to="/blog" startIcon={<ArrowBackIcon />} variant="contained" sx={{ borderRadius: '12px', bgcolor: '#085946' }}>
            Volver al blog
          </Button>
        </Container>
      ) : (
        <>
          {/* HERO con cover de fondo */}
          <Box sx={{
            position: 'relative',
            minHeight: { xs: 560, md: 700 },
            display: 'flex',
            alignItems: 'flex-end',
            color: '#fff',
            pt: { xs: 14, md: 18 },
            pb: { xs: 7, md: 10 },
            overflow: 'hidden',
            background: heroCover ? 'transparent' : 'linear-gradient(160deg, #1B2240 0%, #272F50 50%, #085946 100%)',
          }}>
            {/* Background image */}
            {heroCover && (
              <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("${heroCover}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'scale(1.04)',
                filter: 'brightness(0.65) saturate(0.9)',
              }} />
            )}
            {/* Overlay degradado navy */}
            <Box sx={{
              position: 'absolute', inset: 0,
              background: heroCover
                ? 'linear-gradient(180deg, rgba(27,34,64,0.55) 0%, rgba(27,34,64,0.30) 35%, rgba(27,34,64,0.85) 85%, rgba(27,34,64,0.97) 100%)'
                : 'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(201,168,106,0.20) 0%, transparent 55%)',
            }} />
            {/* Forma decorativa */}
            <Box sx={{
              position: 'absolute', bottom: -1, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to top, #FBFAF8, transparent)',
              pointerEvents: 'none',
            }} />
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, width: '100%' }}>
              <Button component={RouterLink} to="/blog" startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'rgba(255,255,255,0.90)', mb: 4, fontWeight: 600, p: 0,
                  textTransform: 'none', fontSize: '0.875rem',
                  '&:hover': { color: '#C9A86A', bgcolor: 'transparent' },
                }}>
                Volver al blog
              </Button>
              <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 3 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: '#C9A86A' }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: '#C9A86A',
                }}>
                  {catLabel}
                </Typography>
              </Stack>
              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.25rem', sm: '2.75rem', md: '4rem', lg: '4.5rem' },
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.04,
                color: '#fff',
                mb: 3.5,
                textShadow: heroCover ? '0 2px 16px rgba(0,0,0,0.4)' : 'none',
                maxWidth: 900,
              }}>
                {post.titulo}
              </Typography>
              {post.resumen && (
                <Typography sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.1rem', md: '1.4rem' },
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.45,
                  fontWeight: 400,
                  mb: 4.5,
                  maxWidth: 780,
                }}>
                  {post.resumen}
                </Typography>
              )}
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    bgcolor: 'rgba(201,168,106,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid rgba(201,168,106,0.40)',
                  }}>
                    <PersonOutlineIcon sx={{ fontSize: 17, color: '#C9A86A' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{post.autorNombre}</Typography>
                </Box>
                {post.publishedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{formatDate(post.publishedAt)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{readingMin} min de lectura</Typography>
                </Box>
              </Stack>
            </Container>
          </Box>

          {/* CONTENT */}
          <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 }, position: 'relative' }}>
            {/* Share floating bar - desktop only */}
            <Box sx={{
              position: { md: 'sticky' }, top: { md: 100 },
              float: { md: 'left' }, ml: { md: -10 }, mr: { md: 0 },
              display: 'flex', flexDirection: 'column', gap: 1,
              mb: { xs: 3, md: 0 },
              alignItems: 'center',
            }}>
              <Typography sx={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5, writingMode: { md: 'horizontal-tb' } }}>
                Compartir
              </Typography>
              <IconButton onClick={() => handleShare('whatsapp')} aria-label="Compartir en WhatsApp" sx={{ bgcolor: '#25D366', color: '#fff', '&:hover': { bgcolor: '#1ebe57' }, width: 40, height: 40 }}>
                <WhatsAppIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton onClick={() => handleShare('facebook')} aria-label="Compartir en Facebook" sx={{ bgcolor: '#1877F2', color: '#fff', '&:hover': { bgcolor: '#0f62cf' }, width: 40, height: 40 }}>
                <FacebookIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton onClick={() => handleShare('copy')} aria-label="Copiar enlace" sx={{ bgcolor: '#f3f4f6', color: '#272F50', '&:hover': { bgcolor: '#e5e7eb' }, width: 40, height: 40 }}>
                <LinkIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Article body */}
            <Box sx={{
              '& > div > p:first-of-type::first-letter': {
                fontSize: { xs: '3.25rem', md: '4rem' },
                fontWeight: 900,
                color: '#085946',
                float: 'left',
                lineHeight: 0.9,
                pr: 1.5,
                pt: 0.5,
                fontFamily: 'Georgia, serif',
              },
            }}>
              {renderContent(post.contenido || '')}
            </Box>

            {/* Cierre / Conclusiones (si existe) */}
            {post.cierre && post.cierre.trim() && (
              <Box sx={{
                mt: 5, p: { xs: 3, sm: 4 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f8fafc 0%, #eef0fb 100%)',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #4054B2',
              }}>
                <Typography sx={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#4054B2', mb: 1.25,
                }}>
                  Cierre · Lo que debes recordar
                </Typography>
                <Box sx={{
                  fontSize: { xs: '1rem', md: '1.0625rem' }, color: '#272F50',
                  lineHeight: 1.7, '& p': { mt: 1.5, mb: 0 },
                  '& h2, & h3': { mt: 2, mb: 1, fontWeight: 800, color: '#272F50' },
                  '& ul, & ol': { mt: 1, pl: 3 }, '& li': { mb: 0.5 },
                  '& strong': { color: '#085946' },
                }}>
                  {renderContent(post.cierre)}
                </Box>
              </Box>
            )}

            {/* CTA — llamado a la acción */}
            {post.ctaTexto && post.ctaTexto.trim() && (
              <Box sx={{
                mt: 4, p: { xs: 3, sm: 4 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #085946 0%, #064a38 100%)',
                color: '#fff',
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2.5,
                boxShadow: '0 6px 24px rgba(8,89,70,0.25)',
              }}>
                <Box>
                  <Typography sx={{
                    fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#6ee7c8', mb: 0.5,
                  }}>
                    Tu próximo paso
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.1875rem' }, fontWeight: 800, lineHeight: 1.3 }}>
                    {post.ctaTexto}
                  </Typography>
                </Box>
                {post.ctaUrl && (
                  <Box
                    component={post.ctaUrl.startsWith('http') ? 'a' : RouterLink}
                    {...(post.ctaUrl.startsWith('http')
                      ? { href: post.ctaUrl, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: post.ctaUrl })}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75,
                      bgcolor: '#fff', color: '#085946',
                      px: 2.5, py: 1.25, borderRadius: 1.5,
                      fontWeight: 800, fontSize: 14, textDecoration: 'none',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': { bgcolor: '#f0fdf4' },
                    }}>
                    Continuar →
                  </Box>
                )}
              </Box>
            )}

            {/* Tags */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
                  Etiquetas
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {post.tags.map((t) => (
                    <Chip key={t} label={t} size="small" sx={{ bgcolor: '#f0fdf4', color: '#085946', fontWeight: 600, border: '1px solid #d1fae5' }} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Share inline mobile + Newsletter */}
            <Box sx={{
              mt: 6, p: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #d1fae5',
              display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2.5,
            }}>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#272F50', fontSize: '1.0625rem', mb: 0.5 }}>
                  ¿Te resultó útil este artículo?
                </Typography>
                <Typography sx={{ fontSize: '0.9375rem', color: '#4b5563' }}>
                  Compártelo con alguien que lo necesite.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25}>
                <IconButton onClick={() => handleShare('whatsapp')} aria-label="WhatsApp" sx={{ bgcolor: '#25D366', color: '#fff', '&:hover': { bgcolor: '#1ebe57' } }}>
                  <WhatsAppIcon />
                </IconButton>
                <IconButton onClick={() => handleShare('facebook')} aria-label="Facebook" sx={{ bgcolor: '#1877F2', color: '#fff', '&:hover': { bgcolor: '#0f62cf' } }}>
                  <FacebookIcon />
                </IconButton>
                <IconButton onClick={() => handleShare('copy')} aria-label="Copiar enlace" sx={{ bgcolor: '#fff', color: '#272F50', border: '1px solid #d1d5db', '&:hover': { bgcolor: '#f9fafb' } }}>
                  <LinkIcon />
                </IconButton>
              </Stack>
            </Box>

            <NewsletterCTA source="blog-post" />
            <Divider sx={{ mt: 6, mb: 4 }} />
            <Button component={RouterLink} to="/blog" startIcon={<ArrowBackIcon />}
              variant="outlined" sx={{ borderRadius: '12px', borderColor: '#085946', color: '#085946', fontWeight: 600 }}>
              Volver al blog
            </Button>
          </Container>
        </>
      )}

      <PreviewSlot slotId="BLOG_VIDEO_PREROLL" slotLabel="Video pre-roll en blog" minHeight={140} />
      <PreviewSlot slotId="BLOG_PATROCINADOR" slotLabel="Patrocinado por (final de artículo)" minHeight={100} />
      <PreviewSlot slotId="BRANDED_CONTENT" slotLabel="Contenido patrocinado" minHeight={100} />
      <Footer />
    </Box>
  );
}
