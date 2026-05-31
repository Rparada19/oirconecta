import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ChatOutlined, ArrowForward, KeyboardArrowDown } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getWhatsAppHref } from '../config/publicSite';

const HERO_IMAGE = 'https://image.pollinations.ai/prompt/Mature%20Latina%20audiologist%20warmly%20consulting%20with%20senior%20patient%20about%20hearing%20health%2C%20both%20smiling%2C%20modern%20clinic%20with%20natural%20warm%20light%2C%20cinematic%20editorial%20photography%2C%20premium%20healthcare?width=2400&height=1600&nologo=true';

const STATS = [
  { value: '13+', label: 'Marcas de audífonos' },
  { value: '100+', label: 'Profesionales verificados' },
  { value: '15', label: 'Años acompañando' },
];

const Hero = () => {
  const waHref = getWhatsAppHref();
  const scrollDown = () =>
    document.getElementById('que-buscas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <Box component="section" aria-label="Banner principal de OírConecta" sx={{
      position: 'relative',
      overflow: 'hidden',
      minHeight: { xs: '90vh', md: '92vh' },
      display: 'flex',
      alignItems: 'center',
      color: '#fff',
    }}>
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${HERO_IMAGE}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 35%',
        transform: 'scale(1.02)',
      }} />

      <Box sx={{
        position: 'absolute', inset: 0,
        background: {
          xs: 'linear-gradient(180deg, rgba(0,56,43,0.92) 0%, rgba(8,89,70,0.85) 50%, rgba(39,47,80,0.92) 100%)',
          md: 'linear-gradient(100deg, rgba(0,56,43,0.95) 0%, rgba(8,89,70,0.82) 40%, rgba(8,89,70,0.45) 65%, rgba(0,0,0,0.20) 100%)',
        },
      }} />

      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 12, md: 0 } }}>
        <Box sx={{ maxWidth: { md: 720 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3.5 }}>
            <Box sx={{ width: 36, height: 2, bgcolor: '#C9A961' }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#C9A961',
            }}>
              Salud auditiva en Colombia
            </Typography>
          </Stack>

          <Typography component="h1" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4.25rem', lg: '4.75rem' },
            fontWeight: 600,
            lineHeight: 1.05,
            color: '#FAF6EE',
            letterSpacing: '-0.018em',
            mb: 3,
          }}>
            Escuchar bien es{' '}
            <Box component="span" sx={{
              fontStyle: 'italic',
              fontWeight: 500,
              color: '#C9A961',
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute', left: 0, right: 0, bottom: '0.05em',
                height: '0.12em',
                background: 'linear-gradient(90deg, transparent, rgba(201,169,97,0.55) 30%, rgba(201,169,97,0.55) 70%, transparent)',
                borderRadius: 2,
              },
            }}>
              cuidar
            </Box>{' '}
            tu vida entera.
          </Typography>

          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1.0625rem', md: '1.25rem' },
            lineHeight: 1.55,
            color: 'rgba(250,246,238,0.85)',
            fontWeight: 400,
            mb: 5,
            maxWidth: 580,
          }}>
            Encuentra especialistas verificados, conoce marcas con criterio y toma decisiones informadas sobre tu audición. Sin presión, sin marketing.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 6, md: 8 } }}>
            <Button
              component={RouterLink}
              to="/agendar"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                bgcolor: '#C9A961',
                color: '#00382B',
                fontWeight: 700,
                fontSize: '0.9375rem',
                px: 4, py: 1.75,
                borderRadius: '6px',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(201,169,97,0.32)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  bgcolor: '#D4B97A',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 14px 32px rgba(201,169,97,0.42)',
                },
              }}
            >
              Agendar consulta
            </Button>
            <Button
              component="a"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="large"
              startIcon={<ChatOutlined />}
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#FAF6EE',
                borderColor: 'rgba(250,246,238,0.45)',
                borderWidth: '1.5px',
                fontWeight: 600,
                fontSize: '0.9375rem',
                px: 4, py: 1.75,
                borderRadius: '6px',
                backdropFilter: 'blur(8px)',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': {
                  borderColor: '#FAF6EE',
                  borderWidth: '1.5px',
                  bgcolor: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              Hablar por WhatsApp
            </Button>
          </Stack>

          <Box sx={{
            display: 'flex',
            gap: { xs: 3, sm: 5 },
            pt: 4,
            borderTop: '1px solid rgba(250,246,238,0.15)',
            flexWrap: 'wrap',
          }}>
            {STATS.map((s) => (
              <Box key={s.label}>
                <Typography sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 700,
                  color: '#C9A961',
                  lineHeight: 1,
                  mb: 0.75,
                  fontStyle: 'italic',
                }}>
                  {s.value}
                </Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'rgba(250,246,238,0.65)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Box
        onClick={scrollDown}
        sx={{
          position: 'absolute',
          bottom: { xs: 24, md: 40 },
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(250,246,238,0.7)',
          cursor: 'pointer',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          zIndex: 3,
          '&:hover': { color: '#C9A961' },
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translate(-50%, 0)' },
            '50%': { transform: 'translate(-50%, 8px)' },
          },
          animation: 'bounce 2.4s infinite ease-in-out',
        }}
        aria-label="Continuar"
      >
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          Explorar
        </Typography>
        <KeyboardArrowDown sx={{ fontSize: 26 }} />
      </Box>
    </Box>
  );
};

export default Hero;
