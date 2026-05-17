import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid } from '@mui/material';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import HearingOutlinedIcon from '@mui/icons-material/HearingOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const paths = [
  {
    title: 'Encontrar especialista',
    blurb: 'Busca por ciudad o especialidad. Tú eliges a quién contactar.',
    icon: PersonSearchOutlinedIcon,
    mode: 'scroll',
    target: 'busqueda-profesionales',
    gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
    glow: 'rgba(8,89,70,0.35)',
    number: '01',
  },
  {
    title: 'Explorar audífonos',
    blurb: 'Marcas y tecnologías, explicadas sin prisa ni presión de venta.',
    icon: HearingOutlinedIcon,
    mode: 'route',
    to: '/audifonos',
    gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    glow: 'rgba(39,47,80,0.35)',
    number: '02',
  },
  {
    title: 'Conocer la red',
    blurb: 'Nuestra misión y cómo participan los profesionales suscritos.',
    icon: Groups2OutlinedIcon,
    mode: 'route',
    to: '/nosotros',
    gradient: 'linear-gradient(135deg, #71A095 0%, #085946 100%)',
    glow: 'rgba(113,160,149,0.35)',
    number: '03',
  },
  {
    title: 'Aprender sobre audición',
    blurb: 'Señales comunes y qué esperar en tu primera visita al especialista.',
    icon: SchoolOutlinedIcon,
    mode: 'scroll',
    target: 'aprender-audicion',
    gradient: 'linear-gradient(135deg, #085946 0%, #272F50 100%)',
    glow: 'rgba(8,89,70,0.35)',
    number: '04',
  },
];

export default function HomeUserPathsSection() {
  const navigate = useNavigate();

  const handlePath = (p) => {
    if (p.mode === 'scroll') scrollToId(p.target);
    if (p.mode === 'route') navigate(p.to);
  };

  return (
    <Box
      id="que-buscas"
      component="section"
      aria-labelledby="heading-que-buscas"
      sx={{ scrollMarginTop: 96, py: { xs: 8, md: 12 }, bgcolor: '#f4f9f7' }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2.5, py: 0.75,
            borderRadius: '20px', background: 'rgba(8,89,70,0.08)', border: '1px solid rgba(8,89,70,0.15)', mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#085946' }}>
              ¿Por dónde empezamos?
            </Typography>
          </Box>
          <Typography id="heading-que-buscas" component="h2"
            sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.03em',
              lineHeight: 1.1, color: '#0f1923', mb: 1.5 }}>
            Elige tu camino
          </Typography>
          <Typography sx={{ fontSize: '1.0625rem', color: '#4a5568', maxWidth: 560, mx: 'auto', lineHeight: 1.65 }}>
            No hay un solo "producto". Hay personas, información y opciones claras para cada momento.
          </Typography>
        </Box>

        {/* Cards */}
        <Grid container spacing={3}>
          {paths.map((p) => {
            const Icon = p.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={p.title}>
                <Box onClick={() => handlePath(p)} sx={{
                  cursor: 'pointer', height: '100%', borderRadius: '24px', overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 2px 20px rgba(8,89,70,0.07)',
                  border: '1px solid rgba(8,89,70,0.08)',
                  transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 24px 56px ${p.glow}`,
                  },
                  '&:hover .path-arrow': { transform: 'translate(3px,-3px)' },
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Gradient top banner */}
                  <Box sx={{ height: 120, background: p.gradient, position: 'relative', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Number watermark */}
                    <Typography sx={{
                      position: 'absolute', right: 12, bottom: -10,
                      fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.05em',
                      color: 'rgba(255,255,255,0.12)', lineHeight: 1, userSelect: 'none',
                    }}>
                      {p.number}
                    </Typography>
                    {/* Icon */}
                    <Box sx={{ width: 60, height: 60, borderRadius: '18px',
                      background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(10px)' }}>
                      <Icon sx={{ color: '#fff', fontSize: 30 }} />
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923',
                      letterSpacing: '-0.01em', mb: 1, lineHeight: 1.3 }}>
                      {p.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.65, flexGrow: 1, mb: 2 }}>
                      {p.blurb}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#085946', fontWeight: 700 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#085946' }}>Continuar</Typography>
                      <ArrowForwardRoundedIcon className="path-arrow" sx={{ fontSize: 17, transition: 'transform 0.2s ease' }} />
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
