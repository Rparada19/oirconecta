import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import GraphicEqOutlinedIcon from '@mui/icons-material/GraphicEqOutlined';
import CoPresentOutlinedIcon from '@mui/icons-material/CoPresentOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

const tiles = [
  {
    kicker: 'Audífonos',
    title: 'Descubrir marcas y estilos',
    text: 'Orientación para comparar con calma. 13 marcas explicadas sin sensación de catálogo frío.',
    to: '/audifonos',
    icon: GraphicEqOutlinedIcon,
    gradient: 'linear-gradient(160deg, #063c2c 0%, #085946 50%, #0d7a5f 100%)',
    stat: '13+',
    statLabel: 'marcas',
  },
  {
    kicker: 'Implantes cocleares',
    title: 'Explorar opciones cocleares',
    text: 'Rutas y fabricantes líderes, explicados como primer paso — no como venta cerrada.',
    to: '/implantes',
    icon: CoPresentOutlinedIcon,
    gradient: 'linear-gradient(160deg, #1a1f38 0%, #272F50 50%, #1a3d5c 100%)',
    stat: '3',
    statLabel: 'fabricantes',
  },
  {
    kicker: 'Referencia y tienda',
    title: 'Precios orientativos y accesorios',
    text: 'Transparencia para conversar mejor con tu especialista. Lo clínico sigue siendo personal.',
    to: '/ecommerce',
    icon: StorefrontOutlinedIcon,
    gradient: 'linear-gradient(160deg, #2d4a44 0%, #71A095 50%, #085946 100%)',
    stat: '100+',
    statLabel: 'productos',
  },
];

export default function HomeDiscoverySection() {
  return (
    <Box component="section" aria-labelledby="heading-explorar"
      sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(180deg, #f4f9f7 0%, #fff 100%)' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2.5, py: 0.75,
            borderRadius: '8px', background: 'rgba(8,89,70,0.08)', border: '1px solid rgba(8,89,70,0.15)', mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#085946' }}>
              Exploración guiada
            </Typography>
          </Box>
          <Typography id="heading-explorar" component="h2"
            sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.03em',
              lineHeight: 1.1, color: '#0f1923', mb: 1.5, maxWidth: 700 }}>
            Explora con{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              intención
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '1.0625rem', color: '#4a5568', maxWidth: 580, lineHeight: 1.65 }}>
            Aquí no "compras en un clic". Te acercamos a marcas, dispositivos y contexto para que llegues a tu cita sabiendo qué preguntar.
          </Typography>
        </Box>

        {/* Large graphic tiles */}
        <Grid container spacing={3}>
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Grid item xs={12} md={4} key={t.to}>
                <Box component={RouterLink} to={t.to} sx={{
                  display: 'block', textDecoration: 'none', height: '100%',
                  borderRadius: '8px', overflow: 'hidden',
                  background: t.gradient,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' },
                  '&:hover .arrow-icon': { transform: 'translate(4px,-4px)' },
                  position: 'relative',
                }}>
                  {/* Grain overlay */}
                  <Box sx={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")` }} />

                  {/* Stat watermark */}
                  <Typography sx={{
                    position: 'absolute', right: 20, top: 20,
                    fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.04em',
                    color: 'rgba(255,255,255,0.10)', lineHeight: 1, userSelect: 'none',
                  }}>
                    {t.stat}
                  </Typography>

                  <Box sx={{ p: { xs: 3, md: 3.5 }, position: 'relative', zIndex: 1, minHeight: 300,
                    display: 'flex', flexDirection: 'column' }}>
                    {/* Kicker */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 'auto' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>
                        {t.kicker}
                      </Typography>
                      <ArrowOutwardRoundedIcon className="arrow-icon"
                        sx={{ color: 'rgba(255,255,255,0.70)', fontSize: 20, transition: 'transform 0.2s ease' }} />
                    </Box>

                    {/* Icon */}
                    <Box sx={{ width: 64, height: 64, borderRadius: '8px',
                      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(10px)', my: 3 }}>
                      <Icon sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>

                    {/* Title & text */}
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.375rem', color: '#fff',
                        letterSpacing: '-0.02em', lineHeight: 1.2, mb: 1.5 }}>
                        {t.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.80)',
                        lineHeight: 1.65, mb: 2.5 }}>
                        {t.text}
                      </Typography>
                      {/* Stat badge */}
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                        px: 1.5, py: 0.625, borderRadius: '10px',
                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.125rem', color: '#fff' }}>{t.stat}</Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.80)', fontWeight: 600 }}>{t.statLabel}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
