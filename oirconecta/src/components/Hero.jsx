import React from 'react';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { ArrowForward, ChatOutlined, VerifiedOutlined, FavoriteBorderOutlined, GroupsOutlined } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getWhatsAppHref } from '../config/publicSite';

const C = {
  navy: '#272F50',
  navyLight: '#4054B2',
  verde: '#085946',
  verdeProfundo: '#00382B',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  beige: '#C9B8A6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
};

const HERO_IMAGE = '/img/familia-disfrutando-mejor-audicion.jpg';

const TRUST_ITEMS = [
  { icon: VerifiedOutlined, label: 'Profesionales verificados' },
  { icon: FavoriteBorderOutlined, label: 'Acompañamiento humano' },
  { icon: GroupsOutlined, label: 'Red nacional' },
];

const Hero = () => {
  const waHref = getWhatsAppHref();

  return (
    <Box component="section" aria-label="Banner principal de OírConecta" sx={{
      position: 'relative',
      overflow: 'hidden',
      pt: { xs: 14, md: 16 },
      pb: { xs: 6, md: 8 },
      bgcolor: C.blanco,
    }}>
      {/* Forma decorativa sutil arena en esquina */}
      <Box sx={{
        position: 'absolute', top: -180, right: -180,
        width: 540, height: 540, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.arena}50 0%, transparent 70%)`,
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          {/* COLUMNA TEXTO */}
          <Grid item xs={12} md={6}>
            {/* Eyebrow tagline */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.verde }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: C.verde,
              }}>
                Escucha · Conecta · Vive mejor
              </Typography>
            </Stack>

            {/* Título principal serif */}
            <Typography component="h1" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
              fontWeight: 600,
              lineHeight: 1.08,
              color: C.navy,
              letterSpacing: '-0.018em',
              mb: 3,
            }}>
              Conectamos tu vida con{' '}
              <Box component="span" sx={{
                fontStyle: 'italic',
                fontWeight: 500,
                color: C.verde,
              }}>
                una mejor audición
              </Box>
              .
            </Typography>

            {/* Subtítulo */}
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              lineHeight: 1.6,
              color: C.gris,
              fontWeight: 400,
              mb: 4.5,
              maxWidth: 540,
            }}>
              Encuentra especialistas, centros auditivos y soluciones confiables para tu bienestar. Sin presión, sin marketing.
            </Typography>

            {/* CTAs duales */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
              <Button
                component={RouterLink}
                to="/directorio/listado"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 60%, #00382B 100%) !important', color: '#fff !important',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  px: 3.5, py: 1.75,
                  borderRadius: '6px',
                  letterSpacing: '0.01em',
                  boxShadow: '0 6px 18px rgba(8,89,70,0.35)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #109070 0%, #0a6a54 60%, #064a3a 100%) !important',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 24px rgba(8,89,70,0.45)',
                  },
                }}
              >
                Buscar especialista
              </Button>
              <Button
                component={RouterLink}
                to="/nosotros"
                variant="outlined"
                size="large"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: C.navy,
                  borderColor: C.grisClaro,
                  borderWidth: '1.5px',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  px: 3.5, py: 1.75,
                  borderRadius: '6px',
                  '&:hover': {
                    borderColor: C.navy,
                    borderWidth: '1.5px',
                    bgcolor: 'rgba(39,47,80,0.04)',
                  },
                }}
              >
                Conocer más
              </Button>
            </Stack>

            {/* Trust signals row */}
            <Box sx={{
              display: 'flex',
              gap: { xs: 2.5, sm: 4 },
              flexWrap: 'wrap',
              pt: 3,
              borderTop: `1px solid ${C.grisClaro}40`,
            }}>
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '6px',
                    bgcolor: `${C.verde}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon sx={{ fontSize: 17, color: C.verde }} />
                  </Box>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: C.navy,
                  }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* COLUMNA IMAGEN */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: `0 20px 50px ${C.navy}1f`,
              aspectRatio: { xs: '4/3', md: '5/6' },
              maxHeight: { md: 640 },
            }}>
              <Box
                component="img"
                src={HERO_IMAGE}
                alt="Familia disfrutando momentos juntos gracias a una mejor audición"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                sx={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Floating badge: Card de credencial */}
              <Box sx={{
                position: 'absolute',
                bottom: { xs: 16, md: 24 },
                left: { xs: 16, md: 24 },
                right: { xs: 16, md: 'auto' },
                maxWidth: { md: 280 },
                bgcolor: '#fff',
                borderRadius: '8px',
                p: 2.25,
                boxShadow: '0 10px 30px rgba(39,47,80,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '50%',
                  bgcolor: `${C.verde}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <VerifiedOutlined sx={{ fontSize: 22, color: C.verde }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.75rem',
                    color: C.gris,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    mb: 0.25,
                  }}>
                    Profesionales
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.0625rem',
                    color: C.navy,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}>
                    100+ verificados
                  </Typography>
                </Box>
              </Box>

              {/* Tag oro arriba derecha */}
              <Box sx={{
                position: 'absolute',
                top: { xs: 16, md: 24 },
                right: { xs: 16, md: 24 },
                bgcolor: '#fff',
                borderRadius: '999px',
                px: 1.75, py: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
              }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.oro }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: C.navy,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  Salud auditiva premium
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;
