import React, { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent, CardMedia,
  Chip, Stack, Button, CircularProgress, Avatar,
} from '@mui/material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const CATEGORIAS = [
  { key: '', label: 'Todos' },
  { key: 'productos', label: 'Productos y tecnología' },
  { key: 'salud', label: 'Salud auditiva' },
  { key: 'estilo-de-vida', label: 'Estilo de vida' },
];

const PLACEHOLDER_POSTS = [
  {
    id: '1',
    titulo: 'Guía para elegir tu primer audífono',
    resumen: 'Conoce los factores clave para seleccionar el dispositivo que mejor se adapta a tu tipo de pérdida auditiva y estilo de vida.',
    categoria: 'productos',
    autorNombre: 'OírConecta',
    publishedAt: '2025-04-10T00:00:00Z',
    coverUrl: null,
  },
  {
    id: '2',
    titulo: '¿Qué es la audiometría y cuándo hacerla?',
    resumen: 'La audiometría es la prueba de referencia para evaluar tu audición. Te explicamos en qué consiste y cada cuánto debes realizarla.',
    categoria: 'salud',
    autorNombre: 'OírConecta',
    publishedAt: '2025-03-22T00:00:00Z',
    coverUrl: null,
  },
  {
    id: '3',
    titulo: 'Vida con hipoacusia: consejos prácticos',
    resumen: 'Pequeños ajustes en el hogar, el trabajo y el entorno social que hacen una gran diferencia para quienes conviven con pérdida auditiva.',
    categoria: 'estilo-de-vida',
    autorNombre: 'OírConecta',
    publishedAt: '2025-03-05T00:00:00Z',
    coverUrl: null,
  },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function CategoryColor(cat) {
  const map = { productos: '#085946', salud: '#272F50', 'estilo-de-vida': '#71A095', general: '#6b7280' };
  return map[cat] || map.general;
}

function PostCard({ post }) {
  const catLabel = CATEGORIAS.find((c) => c.key === post.categoria)?.label || post.categoria;
  return (
    <Card
      component={RouterLink}
      to={`/blog/${post.slug || post.id}`}
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(8,89,70,0.08)',
        border: '1px solid rgba(8,89,70,0.08)',
        textDecoration: 'none', color: 'inherit',
        transition: 'all 0.25s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 36px rgba(8,89,70,0.14)' },
      }}
    >
      {post.coverUrl ? (
        <CardMedia component="img" height={200} image={post.coverUrl} alt={post.titulo}
          sx={{ objectFit: 'cover' }} />
      ) : (
        <Box sx={{
          height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${CategoryColor(post.categoria)}22 0%, ${CategoryColor(post.categoria)}11 100%)`,
        }}>
          <ArticleOutlinedIcon sx={{ fontSize: 52, color: CategoryColor(post.categoria), opacity: 0.5 }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Chip
          label={catLabel}
          size="small"
          sx={{
            alignSelf: 'flex-start', fontWeight: 700, fontSize: '0.75rem',
            bgcolor: `${CategoryColor(post.categoria)}18`,
            color: CategoryColor(post.categoria),
            border: `1px solid ${CategoryColor(post.categoria)}30`,
          }}
        />
        <Typography
          sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', lineHeight: 1.35,
            letterSpacing: '-0.01em', flex: 1 }}
        >
          {post.titulo}
        </Typography>
        {post.resumen && (
          <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.65,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.resumen}
          </Typography>
        )}
        <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonOutlineIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
            <Typography sx={{ fontSize: '0.8125rem', color: '#6b7280' }}>{post.autorNombre}</Typography>
          </Box>
          {post.publishedAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
              <Typography sx={{ fontSize: '0.8125rem', color: '#6b7280' }}>{formatDate(post.publishedAt)}</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaParam = searchParams.get('categoria') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '24' });
    if (categoriaParam) params.set('categoria', categoriaParam);
    fetch(`${API}/api/blog?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || data.posts || [];
        setPosts(list.length ? list : PLACEHOLDER_POSTS.filter((p) => !categoriaParam || p.categoria === categoriaParam));
      })
      .catch(() => {
        setPosts(PLACEHOLDER_POSTS.filter((p) => !categoriaParam || p.categoria === categoriaParam));
      })
      .finally(() => setLoading(false));
  }, [categoriaParam]);

  const handleCategoria = (key) => {
    if (key) setSearchParams({ categoria: key });
    else setSearchParams({});
  };

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.625,
            borderRadius: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
            <ArticleOutlinedIcon sx={{ fontSize: 16, color: '#6ee7c8' }} />
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              Blog OírConecta
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
            Aprende sobre{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              salud auditiva
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
            Artículos sobre productos, bienestar y estilo de vida pensados para ti y tu familia.
          </Typography>
        </Container>
      </Box>

      {/* Category filter */}
      <Box sx={{ borderBottom: '1px solid rgba(8,89,70,0.08)', bgcolor: '#fff', py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {CATEGORIAS.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                clickable
                onClick={() => handleCategoria(c.key)}
                variant={categoriaParam === c.key ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 600, borderRadius: '10px', fontSize: '0.875rem',
                  ...(categoriaParam === c.key
                    ? { bgcolor: '#085946', color: '#fff', border: '1px solid #085946' }
                    : { borderColor: 'rgba(8,89,70,0.25)', color: '#085946', '&:hover': { bgcolor: 'rgba(8,89,70,0.06)' } }),
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Posts grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={40} thickness={4} sx={{ color: '#085946' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ArticleOutlinedIcon sx={{ fontSize: 56, color: 'rgba(8,89,70,0.2)', mb: 2 }} />
            <Typography sx={{ color: '#6b7280', fontSize: '1rem' }}>
              Aún no hay artículos en esta categoría. ¡Vuelve pronto!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <PostCard post={post} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
}
