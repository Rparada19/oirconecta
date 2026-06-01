import React, { useState } from 'react';
import { Box, Container, Typography, IconButton, Stack, Rating } from '@mui/material';
import { FormatQuote, ArrowBackIos, ArrowForwardIos, LocationOnOutlined } from '@mui/icons-material';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280',
};

const HERO_BG = 'https://images.pexels.com/photos/8958906/pexels-photo-8958906.jpeg?w=2200&h=1400&auto=compress&cs=tinysrgb&fit=crop';

const STORIES = [
  {
    id: 1,
    name: 'Elena',
    age: 68,
    place: 'Bogotá',
    tag: 'Volvió a disfrutar las reuniones',
    rating: 5,
    text: 'Me daba pena decir "¿me lo repites?". Hoy vuelvo a reírme con mis nietos en la mesa. No fue magia: fue encontrar a alguien que me explicó con paciencia y me acompañó en cada ajuste.',
  },
  {
    id: 2,
    name: 'Andrés',
    age: 45,
    place: 'Medellín',
    tag: 'Dejó de evitar el teléfono',
    rating: 5,
    text: 'Trabajo con clientes todo el día. Estaba agotado de adivinar palabras por llamada. Pedir ayuda me quitó un peso: entendí qué pasaba y qué podía hacer, sin sentirme "viejo".',
  },
  {
    id: 3,
    name: 'Lucía',
    age: 52,
    place: 'Cali',
    tag: 'Recuperó confianza',
    rating: 5,
    text: 'Tenía miedo de que me dijeran que "era normal". Me escucharon de verdad. Hoy entiendo mi oído y me siento dueña de mis decisiones, con calma.',
  },
];

export default function TestimonialsSection() {
  const [idx, setIdx] = useState(0);
  const t = STORIES[idx];
  const prev = () => setIdx((i) => (i === 0 ? STORIES.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === STORIES.length - 1 ? 0 : i + 1));

  return (
    <Box
      component="section"
      aria-label="Historias de personas como tú"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 8, md: 12 },
        minHeight: { md: 640 },
        display: 'flex', alignItems: 'center',
      }}
    >
      {/* Full-bleed image */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${HERO_BG}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
      {/* Overlay degradado navy */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${C.navy}EE 0%, ${C.navy}D5 40%, ${C.verdeProfundo}CC 100%)`,
      }} />
      {/* Patrón ruido */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
        {/* Eyebrow */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 3 }}>
          <Box sx={{ width: 28, height: 2, bgcolor: C.oro }} />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.oro,
          }}>
            Historias reales
          </Typography>
          <Box sx={{ width: 28, height: 2, bgcolor: C.oro }} />
        </Stack>

        {/* Heading */}
        <Typography component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.875rem', md: '2.625rem' },
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: '-0.018em',
          mb: 5,
          color: '#fff',
        }}>
          Lo que cambió cuando{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: C.oro, fontWeight: 500 }}>
            pidieron ayuda
          </Box>
        </Typography>

        {/* Carrusel */}
        <Box sx={{ position: 'relative', maxWidth: 760, mx: 'auto' }}>
          <FormatQuote sx={{
            fontSize: 88,
            color: C.oro,
            opacity: 0.45,
            position: 'absolute',
            top: { xs: -40, md: -60 },
            left: { xs: 0, md: -40 },
            transform: 'scaleX(-1)',
          }} />

          <Box sx={{
            position: 'relative',
            transition: 'opacity 0.4s ease',
          }}>
            <Rating value={t.rating} readOnly sx={{
              color: C.oro,
              fontSize: 22,
              mb: 3,
            }} />

            <Typography sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: { xs: '1.25rem', md: '1.625rem' },
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.95)',
              mb: 4,
              letterSpacing: '-0.005em',
            }}>
              "{t.text}"
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 1 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: '50%',
                bgcolor: `${C.oro}26`,
                border: `1.5px solid ${C.oro}77`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.375rem',
                fontWeight: 600,
                fontStyle: 'italic',
                color: C.oro,
              }}>
                {t.name.charAt(0)}
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.2,
                }}>
                  {t.name}, {t.age}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <LocationOnOutlined sx={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.8125rem',
                    color: 'rgba(255,255,255,0.65)',
                  }}>
                    {t.place}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.oro,
              mt: 1.5,
            }}>
              {t.tag}
            </Typography>
          </Box>

          {/* Controles */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 5 }}>
            <IconButton onClick={prev} aria-label="Anterior" sx={{
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: '#fff',
              '&:hover': { background: '#C9A86A !important', color: '#272F50 !important', border: `1px solid ${C.oro}` },
            }}>
              <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
            </IconButton>

            {/* Dots */}
            <Stack direction="row" spacing={1}>
              {STORIES.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setIdx(i)}
                  sx={{
                    cursor: 'pointer',
                    width: i === idx ? 28 : 8,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: i === idx ? C.oro : 'rgba(255,255,255,0.30)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Stack>

            <IconButton onClick={next} aria-label="Siguiente" sx={{
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: '#fff',
              '&:hover': { background: '#C9A86A !important', color: '#272F50 !important', border: `1px solid ${C.oro}` },
            }}>
              <ArrowForwardIos sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
