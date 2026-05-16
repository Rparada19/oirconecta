import React from 'react';
import { Box, Container, Typography, Button, Stack, Chip } from '@mui/material';
import { ChatOutlined, CalendarMonth, ArrowForward, HearingOutlined, Groups2Outlined, StarOutlined } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getWhatsAppHref } from '../config/publicSite';

const STATS = [
  { icon: <HearingOutlined sx={{ fontSize: 20 }} />, value: '13+', label: 'Marcas de audífonos' },
  { icon: <Groups2Outlined sx={{ fontSize: 20 }} />, value: '100+', label: 'Profesionales en red' },
  { icon: <StarOutlined sx={{ fontSize: 20 }} />, value: '3', label: 'Tipos de implante' },
];

const Hero = () => {
  const waHref = getWhatsAppHref();
  const scrollDown = () =>
    document.getElementById('que-buscas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section aria-label="Banner principal de OírConecta">
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 14, md: 16 },
          pb: { xs: 0, md: 0 },
          minHeight: { md: '92vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
            'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
            'radial-gradient(ellipse 50% 40% at 60% 10%, rgba(8,89,70,0.25) 0%, transparent 50%),' +
            'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
          color: '#fff',
        }}
      >
        {/* Grain texture overlay */}
        <Box
          sx={{
            position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative circles */}
        {[
          { w: 600, h: 600, top: '-20%', right: '-8%', op: 0.06 },
          { w: 350, h: 350, bottom: '5%', left: '-5%',  op: 0.05 },
          { w: 200, h: 200, top: '30%', left: '8%',    op: 0.04 },
        ].map((c, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            width: c.w, height: c.h,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${c.op + 0.05})`,
            ...(c.top    ? { top:    c.top }    : {}),
            ...(c.bottom ? { bottom: c.bottom } : {}),
            ...(c.left   ? { left:   c.left }   : {}),
            ...(c.right  ? { right:  c.right }  : {}),
            pointerEvents: 'none',
          }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 4, md: 6 } }}>
          {/* Badge */}
          <Chip
            label="Plataforma de salud auditiva · Colombia"
            sx={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              color: 'rgba(255,255,255,0.90)',
              border: '1px solid rgba(255,255,255,0.20)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              letterSpacing: '0.04em',
              mb: 3.5,
              px: 0.5,
              borderRadius: '20px',
            }}
          />

          {/* Headline */}
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4.25rem', lg: '5rem' },
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              mb: 3,
              maxWidth: 820,
              color: '#fff',
              textShadow: '0 2px 40px rgba(0,0,0,0.20)',
            }}
          >
            Un solo lugar para{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 50%, #d1fae5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              entender tu oído
            </Box>{' '}
            y dar el siguiente paso
          </Typography>

          {/* Subheadline */}
          <Typography
            sx={{
              fontSize: { xs: '1.0625rem', sm: '1.25rem', md: '1.375rem' },
              color: 'rgba(255,255,255,0.82)',
              maxWidth: 560,
              lineHeight: 1.55,
              mb: 4.5,
              fontWeight: 400,
            }}
          >
            Profesionales de confianza, transparencia en precios y contenido que habla como una persona —no como un folleto.
          </Typography>

          {/* CTAs */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={scrollDown}
              endIcon={<ArrowForward />}
              sx={{
                background: '#fff',
                color: '#085946',
                fontWeight: 800,
                fontSize: '1rem',
                px: 3.5,
                py: 1.75,
                borderRadius: '14px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.20)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.92)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.28)',
                },
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              Ver qué puedes hacer aquí
            </Button>

            <Button
              component="a"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              size="large"
              startIcon={<ChatOutlined />}
              sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                px: 3,
                py: 1.625,
                borderRadius: '14px',
                border: '1.5px solid rgba(255,255,255,0.35)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.08)',
                textDecoration: 'none',
                justifyContent: 'center',
                '&:hover': {
                  background: 'rgba(255,255,255,0.15)',
                  border: '1.5px solid rgba(255,255,255,0.55)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              Escribir por WhatsApp
            </Button>
          </Stack>

          <Button
            component={RouterLink}
            to="/agendar"
            startIcon={<CalendarMonth sx={{ fontSize: 18 }} />}
            sx={{
              color: 'rgba(255,255,255,0.80)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              px: 0,
              textDecoration: 'underline',
              textUnderlineOffset: 5,
              '&:hover': { color: '#fff' },
            }}
          >
            Prefiero agendar una valoración
          </Button>

          {/* Stats strip */}
          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              mb: 0,
              pt: 4,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              gap: { xs: 3, md: 6 },
              flexWrap: 'wrap',
            }}
          >
            {STATS.map((s) => (
              <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.90)',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.3 }}>
                    {s.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>

        {/* Bottom wave */}
        <Box sx={{ position: 'relative', mt: { xs: 5, md: 6 }, lineHeight: 0, flexShrink: 0 }}>
          <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0 90L48 75C96 60 192 30 288 22.5C384 15 480 30 576 37.5C672 45 768 45 864 37.5C960 30 1056 15 1152 15C1248 15 1344 30 1392 37.5L1440 45V90H1392C1344 90 1248 90 1152 90C1056 90 960 90 864 90C768 90 672 90 576 90C480 90 384 90 288 90C192 90 96 90 48 90H0Z" fill="#f0f4f2"/>
          </svg>
        </Box>
      </Box>
    </section>
  );
};

export default Hero;
