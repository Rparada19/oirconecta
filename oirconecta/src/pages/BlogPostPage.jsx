import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Chip, Stack, Button, CircularProgress, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsletterCTA from '../components/NewsletterCTA';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const CATEGORIAS = {
  productos: 'Productos y tecnología',
  salud: 'Salud auditiva',
  'estilo-de-vida': 'Estilo de vida',
  general: 'General',
};

const CAT_COLOR = {
  productos: '#085946',
  salud: '#272F50',
  'estilo-de-vida': '#71A095',
  general: '#6b7280',
};

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

function renderContent(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <Typography key={i} component="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f1923', mt: 4, mb: 1.5, letterSpacing: '-0.01em' }}>{line.replace('## ', '')}</Typography>;
    }
    if (line.startsWith('- ')) {
      return <Typography key={i} component="li" sx={{ fontSize: '1rem', color: '#374151', lineHeight: 1.8, mb: 0.5, ml: 2 }}>{line.replace('- ', '')}</Typography>;
    }
    if (line.trim() === '') return <Box key={i} sx={{ height: 8 }} />;
    return <Typography key={i} sx={{ fontSize: '1rem', color: '#374151', lineHeight: 1.85, mb: 1 }}>{line}</Typography>;
  });
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
        setPost(data.data || data.post || data);
        setLoading(false);
      })
      .catch(() => {
        const demo = DEMO_POSTS[slug];
        if (demo) { setPost(demo); setLoading(false); }
        else { setNotFound(true); setLoading(false); }
      });
  }, [slug]);

  const catColor = CAT_COLOR[post?.categoria] || '#6b7280';
  const catLabel = CATEGORIAS[post?.categoria] || post?.categoria || '';

  const seoTitle = post?.titulo ? `${post.titulo} | Blog OírConecta` : 'Blog OírConecta — Salud auditiva';
  const seoDesc = post?.resumen || post?.descripcion || 'Artículos sobre audición, audífonos, prevención y bienestar auditivo en OírConecta.';
  const seoSlug = post?.slug || slug || '';

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://oirconecta.com/blog/${seoSlug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={`https://oirconecta.com/blog/${seoSlug}`} />
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
          {/* Hero */}
          <Box sx={{
            background:
              'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
              'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
            color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 7, md: 9 },
            position: 'relative', overflow: 'hidden',
          }}>
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
              <Button component={RouterLink} to="/blog" startIcon={<ArrowBackIcon />}
                sx={{ color: 'rgba(255,255,255,0.70)', mb: 3, fontWeight: 600, p: 0,
                  '&:hover': { color: '#fff', bgcolor: 'transparent' } }}>
                Volver al blog
              </Button>
              <Chip label={catLabel} size="small" sx={{
                display: 'block', width: 'fit-content', mb: 2.5, fontWeight: 700, fontSize: '0.75rem',
                bgcolor: `${catColor}40`, color: '#fff', border: `1px solid ${catColor}60`,
              }} />
              <Typography component="h1" sx={{
                fontSize: { xs: '1.875rem', md: '2.75rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.15, color: '#fff', mb: 3,
              }}>
                {post.titulo}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PersonOutlineIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.55)' }} />
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.70)' }}>{post.autorNombre}</Typography>
                </Box>
                {post.publishedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.55)' }} />
                    <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.70)' }}>{formatDate(post.publishedAt)}</Typography>
                  </Box>
                )}
              </Stack>
            </Container>
          </Box>

          {/* Content */}
          <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
            {post.resumen && (
              <Typography sx={{
                fontSize: '1.1875rem', color: '#374151', lineHeight: 1.75, fontWeight: 500,
                borderLeft: `4px solid ${catColor}`, pl: 3, mb: 5,
                fontStyle: 'italic',
              }}>
                {post.resumen}
              </Typography>
            )}
            {post.coverUrl && (
              <Box component="img" src={post.coverUrl} alt={post.titulo}
                sx={{ width: '100%', borderRadius: '18px', mb: 5, maxHeight: 420, objectFit: 'cover' }} />
            )}
            <Box sx={{ '& ul, & ol': { pl: 2 } }}>
              {renderContent(post.contenido || '')}
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

      <Footer />
    </Box>
  );
}
