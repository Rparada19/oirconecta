import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import {
  CalendarMonth, MenuBook, PersonSearch,
  Handshake, MedicalServices, Storefront,
} from '@mui/icons-material';

const FEATURES = [
  {
    icon: <CalendarMonth sx={{ fontSize: 28 }} />,
    num: '01',
    title: 'Valores al día',
    description: 'Referencia mensual de audífonos y accesorios para orientarte; los precios finales los define cada profesional de la red.',
    gradient: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
    glow: 'rgba(8,89,70,0.18)',
  },
  {
    icon: <MenuBook sx={{ fontSize: 28 }} />,
    num: '02',
    title: 'Educación',
    description: 'Contenido claro para entender opciones, tecnologías y pasos del cuidado auditivo y tomar mejores decisiones.',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    glow: 'rgba(2,132,199,0.18)',
  },
  {
    icon: <PersonSearch sx={{ fontSize: 28 }} />,
    num: '03',
    title: 'Ubica al profesional',
    description: 'Encuentra audiólogos, ORL, otólogos y centros según ciudad, especialidad y lo que necesitas.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    glow: 'rgba(124,58,237,0.18)',
  },
  {
    icon: <Handshake sx={{ fontSize: 28 }} />,
    num: '04',
    title: 'Acompañamiento',
    description: 'Acompañamos la toma de decisiones con información ordenada; la indicación y el tratamiento son siempre del especialista.',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    glow: 'rgba(219,39,119,0.18)',
  },
  {
    icon: <MedicalServices sx={{ fontSize: 28 }} />,
    num: '05',
    title: 'Todos los servicios',
    description: 'La red promueve evaluación, audífonos, implantes, rehabilitación y más: explora la oferta y contacta a quien elijas.',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    glow: 'rgba(249,115,22,0.18)',
  },
  {
    icon: <Storefront sx={{ fontSize: 28 }} />,
    num: '06',
    title: 'Marcas del mercado',
    description: 'Información sobre fabricantes y líneas que encuentras en el ecosistema auditivo, para comparar con base.',
    gradient: 'linear-gradient(135deg, #272F50 0%, #1a1f38 100%)',
    glow: 'rgba(39,47,80,0.18)',
  },
];

const FeaturesSection = () => (
  <Box
    component="section"
    aria-label="Qué hace OírConecta"
    sx={{ py: { xs: 5, md: 8 }, background: 'linear-gradient(180deg, #f0f4f2 0%, #ffffff 100%)' }}
  >
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            display: 'inline-block',
            px: 2, py: 0.625,
            borderRadius: '8px',
            background: 'rgba(8,89,70,0.08)',
            border: '1px solid rgba(8,89,70,0.16)',
            mb: 2.5,
          }}
        >
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#085946' }}>
            Qué hacemos por ti
          </Typography>
        </Box>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#0f1923',
            mb: 2,
            lineHeight: 1.1,
          }}
        >
          Todo lo que necesitas{' '}
          <Box component="span" sx={{ color: '#085946' }}>para decidir con calma</Box>
        </Typography>
        <Typography sx={{ color: '#4a5568', maxWidth: 560, mx: 'auto', fontSize: '1.0625rem', lineHeight: 1.65 }}>
          Información clara, educación sencilla y acceso a la red: para que no tengas que recorrer solo el camino.
        </Typography>
      </Box>

      {/* Cards */}
      <Grid container spacing={2.5}>
        {FEATURES.map((f) => (
          <Grid item xs={12} sm={6} md={4} key={f.num}>
            <Box
              sx={{
                height: '100%',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: '0 2px 16px rgba(8,89,70,0.06)',
                p: { xs: 3, md: 3.5 },
                transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 20px 48px ${f.glow}, 0 4px 12px rgba(0,0,0,0.05)`,
                  '& .feat-icon': { transform: 'scale(1.08)', boxShadow: `0 8px 24px ${f.glow}` },
                },
              }}
            >
              {/* Number watermark */}
              <Typography
                aria-hidden
                sx={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.05em',
                  color: 'rgba(8,89,70,0.05)', lineHeight: 1, userSelect: 'none',
                }}
              >
                {f.num}
              </Typography>

              {/* Icon */}
              <Box
                className="feat-icon"
                sx={{
                  width: 56, height: 56, borderRadius: '6px',
                  background: f.gradient, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 2.5,
                  boxShadow: `0 4px 16px ${f.glow}`,
                  transition: 'all 0.28s ease',
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </Box>

              <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1, lineHeight: 1.25 }}>
                {f.title}
              </Typography>
              <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.65 }}>
                {f.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

export default FeaturesSection;
