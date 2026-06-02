import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280',
  grisClaro: '#A1A7B1',
};

const tiles = [
  {
    kicker: 'Audífonos',
    title: 'Descubrir marcas y estilos',
    text: 'Orientación para comparar con calma. 13 marcas explicadas sin sensación de catálogo frío.',
    to: '/audifonos',
    stat: '13+',
    statLabel: 'marcas',
    image: 'https://images.pexels.com/photos/16852335/pexels-photo-16852335.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    kicker: 'Implantes cocleares',
    title: 'Explorar opciones cocleares',
    text: 'Rutas y fabricantes líderes, explicados como primer paso — no como venta cerrada.',
    to: '/implantes',
    stat: '3',
    statLabel: 'fabricantes',
    image: 'https://images.pexels.com/photos/14682242/pexels-photo-14682242.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    kicker: 'Referencia y tienda',
    title: 'Precios orientativos y accesorios',
    text: 'Transparencia para conversar mejor con tu especialista. Lo clínico sigue siendo personal.',
    to: '/ecommerce',
    stat: '100+',
    statLabel: 'productos',
    image: 'https://images.pexels.com/photos/6319017/pexels-photo-6319017.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
];

export default function HomeDiscoverySection() {
  return (
    <Box component="section" aria-labelledby="heading-explorar"
      sx={{ py: { xs: 6, md: 9 }, bgcolor: C.blanco }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, maxWidth: 720, mx: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 2.5 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
              fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.verde,
            }}>Explorar</Typography>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
          </Stack>
          <Typography id="heading-explorar" component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600,
            letterSpacing: '-0.018em', lineHeight: 1.1, color: C.navy, mb: 2,
          }}>
            Para entender{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
              tus opciones
            </Box>
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
            color: C.gris, lineHeight: 1.6,
          }}>
            Información clara para que decidas con calma, no por presión comercial.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {tiles.map((t) => (
            <Grid item xs={12} md={4} key={t.to}>
              <Box
                component={RouterLink}
                to={t.to}
                sx={{
                  display: 'flex', flexDirection: 'column',
                  textDecoration: 'none',
                  height: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  border: `1px solid ${C.grisClaro}33`,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 20px 48px ${C.navy}18`,
                    borderColor: `${C.navy}33`,
                    '& .tile-cover': { transform: 'scale(1.06)' },
                    '& .tile-arrow': { color: C.verde, transform: 'translate(2px, -2px)' },
                  },
                }}
              >
                <Box sx={{ position: 'relative', paddingTop: '60%', overflow: 'hidden' }}>
                  <Box
                    className="tile-cover"
                    component="img"
                    src={t.image}
                    alt={t.title}
                    loading="lazy"
                    sx={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                  <Box sx={{
                    position: 'absolute', top: 16, left: 16,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    borderRadius: '6px', px: 1.25, py: 0.625,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem',
                      fontWeight: 700, color: C.verde, letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>{t.kicker}</Typography>
                  </Box>
                  {/* Stat overlay */}
                  <Box sx={{
                    position: 'absolute', bottom: 16, right: 16,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    borderRadius: '8px', px: 1.75, py: 1,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    textAlign: 'center',
                  }}>
                    <Typography sx={{
                      fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
                      fontSize: '1.5rem', fontWeight: 700, color: C.navy, lineHeight: 1,
                    }}>{t.stat}</Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem',
                      color: C.gris, fontWeight: 600, mt: 0.25,
                    }}>{t.statLabel}</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: { xs: 3, md: 3.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography component="h3" sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: { xs: '1.25rem', md: '1.375rem' }, fontWeight: 600,
                    color: C.navy, letterSpacing: '-0.01em', lineHeight: 1.2, mb: 1.5,
                  }}>{t.title}</Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                    color: C.gris, lineHeight: 1.6, mb: 2.5, flexGrow: 1,
                  }}>{t.text}</Typography>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    color: C.navy, fontWeight: 700,
                  }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem',
                      fontWeight: 700, color: 'inherit',
                    }}>Explorar</Typography>
                    <ArrowOutwardRoundedIcon
                      className="tile-arrow"
                      sx={{ fontSize: 18, color: C.navy, transition: 'all 0.3s ease' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
