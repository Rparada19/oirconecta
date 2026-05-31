import React from 'react';
import { Box, Container, Typography, Grid, Avatar, Rating, Chip } from '@mui/material';
import { FormatQuote, VerifiedUser } from '@mui/icons-material';

const STORIES = [
  {
    id: 1,
    name: 'Elena, 68',
    place: 'Bogotá',
    tag: 'Volvió a disfrutar las reuniones',
    rating: 5,
    text: 'Me daba pena decir "¿me lo repites?". Hoy vuelvo a reírme con mis nietos en la mesa. No fue magia: fue encontrar a alguien que me explicó con paciencia y me acompañó en cada ajuste.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    accent: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
  },
  {
    id: 2,
    name: 'Andrés, 45',
    place: 'Medellín',
    tag: 'Dejó de evitar el teléfono',
    rating: 5,
    text: 'Trabajo con clientes todo el día. Estaba agotado de adivinar palabras por llamada. Pedir ayuda me quitó un peso: entendí qué pasaba y qué podía hacer, sin sentirme "viejo".',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    accent: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
  },
  {
    id: 3,
    name: 'Lucía, 52',
    place: 'Cali',
    tag: 'Recuperó confianza',
    rating: 5,
    text: 'Tenía miedo de que me dijeran que "era normal". Me escucharon de verdad. Hoy entiendo mi oído y me siento dueña de mis decisiones, con calma.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    accent: 'linear-gradient(135deg, #71A095 0%, #085946 100%)',
  },
];

export default function TestimonialsSection() {
  return (
    <section aria-label="Historias de personas como tú">
      <Box sx={{
        py: { xs: 10, md: 14 },
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 80% 60% at 15% 30%, rgba(13,122,92,0.30) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 70% at 85% 70%, rgba(39,47,80,0.45) 0%, transparent 55%),' +
          'linear-gradient(160deg, #041f17 0%, #063c2c 35%, #0f1830 70%, #1a2040 100%)',
      }}>
        {/* Grain */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2.5, py: 0.75,
              borderRadius: '8px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', mb: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                Historias con corazón
              </Typography>
            </Box>
            <Typography component="h2"
              sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2 }}>
              "Por fin me{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                entendieron"
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.70)',
              maxWidth: 560, mx: 'auto', lineHeight: 1.65 }}>
              Historias de personas que encontraron claridad, alivio y decisiones con calma.
            </Typography>
          </Box>

          {/* Cards */}
          <Grid container spacing={3}>
            {STORIES.map((t) => (
              <Grid item xs={12} md={4} key={t.id}>
                <Box sx={{
                  height: '100%', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  p: { xs: 3, sm: 3.5 }, position: 'relative',
                  transition: 'all 0.28s ease',
                  '&:hover': { background: 'rgba(255,255,255,0.11)', transform: 'translateY(-4px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.30)' },
                }}>
                  {/* Accent bar */}
                  <Box sx={{ width: 40, height: 4, borderRadius: '4px', background: t.accent, mb: 3 }} />

                  {/* Big quote */}
                  <FormatQuote sx={{ fontSize: '3rem', color: 'rgba(255,255,255,0.12)',
                    position: 'absolute', top: 20, right: 20 }} />

                  {/* Text */}
                  <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.90)',
                    lineHeight: 1.75, fontStyle: 'italic', mb: 3, minHeight: 120 }}>
                    "{t.text}"
                  </Typography>

                  {/* Tag + Rating */}
                  <Box sx={{ mb: 2.5 }}>
                    <Chip label={t.tag} size="small" sx={{
                      mb: 1.5, fontWeight: 700, fontSize: '0.75rem',
                      bgcolor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.90)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Rating value={t.rating} readOnly size="small"
                        sx={{ '& .MuiRating-iconFilled': { color: '#6ee7c8' } }} />
                      <VerifiedUser sx={{ fontSize: 16, color: '#6ee7c8', opacity: 0.8 }} />
                    </Box>
                  </Box>

                  {/* Author */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
                    pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                    <Avatar src={t.image} alt={t.name} sx={{ width: 44, height: 44,
                      border: '2px solid rgba(255,255,255,0.20)' }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>{t.name}</Typography>
                      <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>{t.place}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </section>
  );
}
