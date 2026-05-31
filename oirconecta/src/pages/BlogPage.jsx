import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Chip, Stack, Button, CircularProgress,
} from '@mui/material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsletterPopup from '../components/NewsletterPopup';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const SECTION_META = {
  guias: { color: '#085946', icon: SchoolOutlinedIcon, label: 'Guías y educación' },
  cuidados: { color: '#0d7a5f', icon: BuildOutlinedIcon, label: 'Mantenimiento' },
  comparativas: { color: '#1a2240', icon: CompareArrowsIcon, label: 'Comparativas' },
  glosario: { color: '#0284c7', icon: MenuBookOutlinedIcon, label: 'Glosario' },
  tecnologia: { color: '#272F50', icon: MemoryOutlinedIcon, label: 'Tecnología' },
  lanzamientos: { color: '#d97706', icon: NewReleasesOutlinedIcon, label: 'Lanzamientos' },
  casos: { color: '#b45309', icon: FavoriteBorderOutlinedIcon, label: 'Casos y testimonios' },
  productos: { color: '#085946', icon: CategoryOutlinedIcon, label: 'Productos' },
  salud: { color: '#272F50', icon: FavoriteBorderOutlinedIcon, label: 'Salud auditiva' },
  'estilo-de-vida': { color: '#71A095', icon: ArticleOutlinedIcon, label: 'Estilo de vida' },
  general: { color: '#6b7280', icon: ArticleOutlinedIcon, label: 'General' },
};

function metaFor(slug) {
  return SECTION_META[slug] || SECTION_META.general;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

// ────────── Card grande (featured) ──────────
function FeaturedCard({ post }) {
  const m = metaFor(post.categoria);
  const Icon = m.icon;
  return (
    <Box
      component={RouterLink}
      to={`/blog/${post.slug}`}
      sx={{
        display: 'block',
        position: 'relative',
        textDecoration: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        height: { xs: 420, md: 540 },
        boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.25)',
          '& .cover-img': { transform: 'scale(1.06)' },
          '& .read-arrow': { transform: 'translate(4px,-4px)' },
        },
      }}
    >
      <Box
        className="cover-img"
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: post.coverUrl ? `url("${post.coverUrl}")` : `linear-gradient(135deg, ${m.color} 0%, #1a2240 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.85) 100%)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        p: { xs: 3, md: 5 }, color: '#fff',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 1.75, py: 0.875,
            borderRadius: '8px',
            bgcolor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.30)',
            backdropFilter: 'blur(12px)',
          }}>
            <Icon sx={{ fontSize: 15, color: '#6ee7c8' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
              {m.label}
            </Typography>
          </Box>
          <Box className="read-arrow" sx={{
            width: 48, height: 48, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.95)', color: '#085946',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s ease',
          }}>
            <NorthEastIcon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7c8', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
            ★ Artículo destacado
          </Typography>
          <Typography component="h2" sx={{
            fontSize: { xs: '1.625rem', md: '2.375rem' },
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            mb: 2,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            maxWidth: 720,
          }}>
            {post.titulo}
          </Typography>
          {post.resumen && (
            <Typography sx={{
              fontSize: { xs: '0.9375rem', md: '1.0625rem' },
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.55,
              mb: 2.5,
              maxWidth: 640,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.resumen}
            </Typography>
          )}
          <Stack direction="row" spacing={2} sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)' }}>
            <Typography sx={{ fontSize: '0.8125rem' }}>{post.autorNombre}</Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)', alignSelf: 'center' }} />
            {post.publishedAt && <Typography sx={{ fontSize: '0.8125rem' }}>{formatDate(post.publishedAt)}</Typography>}
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)', alignSelf: 'center' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: '0.8125rem' }}>{calcReadingTime(post.resumen || post.titulo)} min</Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

// ────────── Card secundaria (compacta horizontal) ──────────
function CompactCard({ post }) {
  const m = metaFor(post.categoria);
  return (
    <Box
      component={RouterLink}
      to={`/blog/${post.slug}`}
      sx={{
        display: 'flex', gap: 2,
        textDecoration: 'none',
        p: 1.5,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: '#f9fafb',
          '& .cover': { transform: 'scale(1.05)' },
          '& .title': { color: '#085946' },
        },
      }}
    >
      <Box sx={{
        width: 120, height: 100, borderRadius: 2, overflow: 'hidden',
        flexShrink: 0, position: 'relative',
      }}>
        <Box
          className="cover"
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: post.coverUrl ? `url("${post.coverUrl}")` : `linear-gradient(135deg, ${m.color}66 0%, ${m.color}22 100%)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'transform 0.4s ease',
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: m.color, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
            {m.label}
          </Typography>
          <Typography
            className="title"
            sx={{
              fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923',
              lineHeight: 1.35, letterSpacing: '-0.005em',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              transition: 'color 0.2s ease',
            }}
          >
            {post.titulo}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', mt: 0.75 }}>
          {post.publishedAt && formatDate(post.publishedAt)} · {calcReadingTime(post.resumen || post.titulo)} min
        </Typography>
      </Box>
    </Box>
  );
}

// ────────── Card grid standard ──────────
function PostCard({ post }) {
  const m = metaFor(post.categoria);
  const Icon = m.icon;
  return (
    <Box
      component={RouterLink}
      to={`/blog/${post.slug}`}
      sx={{
        display: 'flex', flexDirection: 'column',
        textDecoration: 'none',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#fff',
        border: '1px solid #f0f0f0',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.10)',
          borderColor: '#e5e7eb',
          '& .cover': { transform: 'scale(1.08)' },
          '& .cat-pill': { transform: 'translateY(-2px)' },
        },
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '62%', overflow: 'hidden', bgcolor: '#f3f4f6' }}>
        <Box
          className="cover"
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: post.coverUrl ? `url("${post.coverUrl}")` : 'none',
            backgroundColor: post.coverUrl ? 'transparent' : `${m.color}11`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
            display: post.coverUrl ? 'block' : 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {!post.coverUrl && <Icon sx={{ fontSize: 56, color: m.color, opacity: 0.4 }} />}
        </Box>
        <Box
          className="cat-pill"
          sx={{
            position: 'absolute', top: 14, left: 14,
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            px: 1.5, py: 0.75,
            borderRadius: '8px',
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            transition: 'transform 0.3s ease',
          }}
        >
          <Icon sx={{ fontSize: 14, color: m.color }} />
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: m.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {m.label}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column' }}>
        <Typography component="h3" sx={{
          fontWeight: 800, fontSize: { xs: '1.0625rem', md: '1.1875rem' },
          color: '#0f1923', lineHeight: 1.3,
          letterSpacing: '-0.012em', mb: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.titulo}
        </Typography>
        {post.resumen && (
          <Typography sx={{
            fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6, mb: 2.5,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            flex: 1,
          }}>
            {post.resumen}
          </Typography>
        )}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pt: 2, mt: 'auto', borderTop: '1px solid #f3f4f6',
        }}>
          <Typography sx={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            {post.publishedAt && formatDate(post.publishedAt)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
            <Typography sx={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 600 }}>
              {calcReadingTime(post.resumen || post.titulo)} min
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ────────── Tarjeta categoría (en grid de explora) ──────────
function CategoryCard({ slug, label, count, active, onClick }) {
  const m = metaFor(slug);
  const Icon = m.icon;
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 2.5, borderRadius: 2,
        bgcolor: active ? m.color : '#fff',
        color: active ? '#fff' : '#0f1923',
        border: `1.5px solid ${active ? m.color : '#e5e7eb'}`,
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', gap: 1.5,
        height: '100%',
        '&:hover': {
          borderColor: m.color,
          transform: 'translateY(-3px)',
          boxShadow: `0 10px 24px ${m.color}22`,
        },
      }}
    >
      <Box sx={{
        width: 40, height: 40, borderRadius: 2,
        bgcolor: active ? 'rgba(255,255,255,0.18)' : `${m.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ fontSize: 22, color: active ? '#fff' : m.color }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', lineHeight: 1.25, mb: 0.25 }}>
          {label}
        </Typography>
        <Typography sx={{
          fontSize: '0.75rem',
          color: active ? 'rgba(255,255,255,0.75)' : '#9ca3af',
          fontWeight: 600,
        }}>
          {count} {count === 1 ? 'artículo' : 'artículos'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaParam = searchParams.get('categoria') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/blog/sections`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) setSections(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '30' });
    if (categoriaParam) params.set('categoria', categoriaParam);
    fetch(`${API}/api/blog?${params}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.data || data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [categoriaParam]);

  const handleCategoria = (key) => {
    if (key) setSearchParams({ categoria: key });
    else setSearchParams({});
    if (typeof window !== 'undefined') window.scrollTo({ top: 480, behavior: 'smooth' });
  };

  const featured = useMemo(() => posts.find((p) => p.destacado) || posts[0], [posts]);
  const sidebarTop = useMemo(() => {
    if (!featured) return [];
    return posts.filter((p) => p.id !== featured.id).slice(0, 3);
  }, [posts, featured]);
  const rest = useMemo(() => {
    const skipIds = new Set([featured?.id, ...sidebarTop.map((p) => p.id)].filter(Boolean));
    return posts.filter((p) => !skipIds.has(p.id));
  }, [posts, featured, sidebarTop]);

  const totalPosts = sections.reduce((acc, s) => acc + (s.count || 0), 0);

  return (
    <Box component="main" sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Helmet>
        <title>Blog OírConecta — Salud auditiva, audífonos y prevención</title>
        <meta name="description" content="Artículos prácticos sobre audición, audífonos, implantes, prevención y bienestar auditivo. Información confiable de la red OírConecta." />
        <link rel="canonical" href="https://oirconecta.com/blog" />
        <meta property="og:title" content="Blog OírConecta — Salud auditiva, audífonos y prevención" />
        <meta property="og:description" content="Artículos prácticos sobre audición, audífonos, implantes, prevención y bienestar auditivo." />
        <meta property="og:url" content="https://oirconecta.com/blog" />
      </Helmet>
      <NewsletterPopup source="blog-popup" />
      <Header />

      {/* ────────── HERO EDITORIAL ────────── */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: '#0a2018',
        color: '#fff',
        pt: { xs: 12, md: 14 },
        pb: { xs: 6, md: 8 },
      }}>
        {/* Blobs decorativos */}
        <Box sx={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,200,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39,47,80,0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                px: 1.75, py: 0.875,
                borderRadius: '8px',
                background: 'rgba(110,231,200,0.12)',
                border: '1px solid rgba(110,231,200,0.30)',
                mb: 3,
                backdropFilter: 'blur(10px)',
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6ee7c8' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6ee7c8' }}>
                  El blog OírConecta
                </Typography>
              </Box>
              <Typography component="h1" sx={{
                fontSize: { xs: '2.5rem', md: '3.75rem', lg: '4.25rem' },
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.02,
                color: '#fff', mb: 3,
              }}>
                Todo sobre tu{' '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute', bottom: '-4px', left: 0, right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #6ee7c8 0%, #a7f3d0 100%)',
                    borderRadius: 2,
                    opacity: 0.3,
                  },
                }}>
                  audición
                </Box>{', '}
                en un solo lugar.
              </Typography>
              <Typography sx={{
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 480,
              }}>
                Guías, comparativas y consejos honestos de audiólogos. Sin marketing, sin promesas vacías.
              </Typography>
              <Stack direction="row" spacing={4} sx={{ mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' }, fontWeight: 900, color: '#6ee7c8', lineHeight: 1 }}>
                    {totalPosts || posts.length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, mt: 0.5, letterSpacing: '0.05em' }}>
                    ARTÍCULOS PUBLICADOS
                  </Typography>
                </Box>
                <Box sx={{ width: '1px', height: 56, bgcolor: 'rgba(255,255,255,0.15)' }} />
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.875rem', md: '2.25rem' }, fontWeight: 900, color: '#6ee7c8', lineHeight: 1 }}>
                    {sections.length || 7}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, mt: 0.5, letterSpacing: '0.05em' }}>
                    CATEGORÍAS
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Featured preview a la derecha */}
            {featured && (
              <Grid item xs={12} md={7}>
                <Box
                  component={RouterLink}
                  to={`/blog/${featured.slug}`}
                  sx={{
                    display: 'block', textDecoration: 'none',
                    borderRadius: 2, overflow: 'hidden',
                    position: 'relative',
                    height: { xs: 340, md: 420 },
                    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                    transform: { md: 'rotate(0deg)' },
                    transition: 'transform 0.4s ease',
                    '&:hover': { transform: { md: 'rotate(0deg) scale(1.01)' }, '& .arrow-corner': { transform: 'translate(4px,-4px)' } },
                  }}
                >
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: featured.coverUrl ? `url("${featured.coverUrl}")` : 'linear-gradient(135deg,#085946,#1a2240)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 30%, rgba(10,32,24,0.95) 100%)',
                  }} />
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    p: { xs: 3, md: 4 },
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.75,
                        px: 1.5, py: 0.625,
                        borderRadius: '8px',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} />
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0f1923', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Destacado
                        </Typography>
                      </Box>
                      <Box className="arrow-corner" sx={{
                        width: 44, height: 44, borderRadius: '50%',
                        bgcolor: '#6ee7c8', color: '#0a2018',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.3s ease',
                      }}>
                        <NorthEastIcon sx={{ fontSize: 22 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: '#6ee7c8', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
                        {metaFor(featured.categoria).label}
                      </Typography>
                      <Typography sx={{
                        fontSize: { xs: '1.375rem', md: '1.75rem' },
                        fontWeight: 900,
                        color: '#fff', lineHeight: 1.2,
                        letterSpacing: '-0.02em', mb: 1.5,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {featured.titulo}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
                        <Typography sx={{ fontSize: '0.8125rem' }}>{featured.autorNombre}</Typography>
                        {featured.publishedAt && <Typography sx={{ fontSize: '0.8125rem' }}>· {formatDate(featured.publishedAt)}</Typography>}
                        <Typography sx={{ fontSize: '0.8125rem' }}>· {calcReadingTime(featured.resumen || featured.titulo)} min</Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* ────────── EXPLORA POR TEMA ────────── */}
      <Box sx={{ bgcolor: '#fafafa', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#085946', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                Explora por tema
              </Typography>
              <Typography component="h2" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#0f1923', letterSpacing: '-0.02em' }}>
                ¿Qué necesitas saber hoy?
              </Typography>
            </Box>
            {categoriaParam && (
              <Button
                onClick={() => handleCategoria('')}
                sx={{ color: '#085946', fontWeight: 700, textTransform: 'none' }}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              >
                Ver todos los artículos
              </Button>
            )}
          </Box>
          <Grid container spacing={2}>
            {sections.filter((s) => s.count > 0).slice(0, 8).map((s) => (
              <Grid item xs={6} sm={4} md={3} key={s.slug}>
                <CategoryCard
                  slug={s.slug}
                  label={metaFor(s.slug).label}
                  count={s.count}
                  active={categoriaParam === s.slug}
                  onClick={() => handleCategoria(categoriaParam === s.slug ? '' : s.slug)}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ────────── FEATURED + SIDEBAR ────────── */}
      {!loading && featured && sidebarTop.length > 0 && !categoriaParam && (
        <Box sx={{ bgcolor: '#fff', py: { xs: 6, md: 8 }, borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 4, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#085946', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                  Lo más reciente
                </Typography>
                <Typography component="h2" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#0f1923', letterSpacing: '-0.02em' }}>
                  Para empezar
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <FeaturedCard post={featured} />
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={1}>
                  {sidebarTop.map((p) => <CompactCard key={p.id} post={p} />)}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {/* ────────── GRID DEL RESTO ────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={40} thickness={4} sx={{ color: '#085946' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ArticleOutlinedIcon sx={{ fontSize: 56, color: 'rgba(8,89,70,0.2)', mb: 2 }} />
            <Typography sx={{ color: '#6b7280', fontSize: '1rem' }}>
              Aún no hay artículos en esta categoría.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 4, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#085946', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                  {categoriaParam ? metaFor(categoriaParam).label : 'Todos los artículos'}
                </Typography>
                <Typography component="h2" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#0f1923', letterSpacing: '-0.02em' }}>
                  {categoriaParam ? `${posts.length} ${posts.length === 1 ? 'artículo' : 'artículos'}` : 'Sigue explorando'}
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {(categoriaParam ? posts : rest).map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <PostCard post={post} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* ────────── NEWSLETTER BIG CTA ────────── */}
      <Box sx={{
        bgcolor: '#0a2018',
        color: '#fff',
        py: { xs: 6, md: 8 },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -50, right: -50,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,200,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7c8', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
            Newsletter
          </Typography>
          <Typography component="h2" sx={{
            fontSize: { xs: '1.875rem', md: '2.5rem' },
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            mb: 2,
          }}>
            Un correo al mes con lo mejor del blog
          </Typography>
          <Typography sx={{
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'rgba(255,255,255,0.75)',
            maxWidth: 540, mx: 'auto', mb: 4,
          }}>
            Guías nuevas, consejos prácticos y novedades del mundo auditivo. Cero spam, baja cuando quieras.
          </Typography>
          <Button
            component={RouterLink}
            to="/newsletter"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#6ee7c8', color: '#0a2018',
              fontWeight: 800, fontSize: '0.9375rem',
              px: 4, py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: '0 10px 25px rgba(110,231,200,0.3)',
              '&:hover': { bgcolor: '#a7f3d0', boxShadow: '0 14px 30px rgba(110,231,200,0.4)' },
            }}
          >
            Suscribirme al newsletter
          </Button>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
