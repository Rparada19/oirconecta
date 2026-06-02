import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

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
  fondoClaro: '#F4F5F7',
};

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const paths = [
  {
    title: 'Encontrar especialista',
    blurb: 'Busca por ciudad o especialidad. Tú eliges con quién hablar primero.',
    image: 'https://images.unsplash.com/photo-1631558556874-1d127211f574?w=800&h=600&q=80&auto=format&fit=crop',
    alt: 'Audióloga conversando con paciente',
    mode: 'scroll',
    target: 'busqueda-profesionales',
    number: '01',
  },
  {
    title: 'Explorar audífonos',
    blurb: 'Marcas y tecnologías explicadas sin prisa ni presión comercial.',
    image: 'https://images.pexels.com/photos/6677156/pexels-photo-6677156.jpeg?w=800&h=600&auto=compress&cs=tinysrgb&fit=crop',
    alt: 'Audífono moderno detrás de la oreja',
    mode: 'route',
    to: '/audifonos',
    number: '02',
  },
  {
    title: 'Conocer la red',
    blurb: 'Nuestra misión, criterios de selección y profesionales suscritos.',
    image: 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?w=800&h=600&auto=compress&cs=tinysrgb&fit=crop',
    alt: 'Equipo de profesionales auditivos',
    mode: 'route',
    to: '/nosotros',
    number: '03',
  },
  {
    title: 'Aprender sobre audición',
    blurb: 'Señales comunes, qué esperar en consulta y cómo prevenir pérdida.',
    image: 'https://images.unsplash.com/photo-1534768654272-e97681c3a2c7?w=800&h=600&q=80&auto=format&fit=crop',
    alt: 'Pareja escuchando atenta en casa',
    mode: 'scroll',
    target: 'aprender-audicion',
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
      sx={{ scrollMarginTop: 96, py: { xs: 6, md: 9 }, bgcolor: C.blanco }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, maxWidth: 720, mx: 'auto' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem', fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.verde,
            }}>
              ¿Por dónde empezamos?
            </Typography>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
          </Box>

          <Typography id="heading-que-buscas" component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2rem', md: '2.875rem' },
            fontWeight: 600,
            letterSpacing: '-0.018em',
            lineHeight: 1.1,
            color: C.navy,
            mb: 2,
          }}>
            Elige{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
              tu camino
            </Box>
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.0625rem',
            color: C.gris,
            lineHeight: 1.6,
          }}>
            No hay un solo "producto". Hay personas, información y opciones claras para cada momento.
          </Typography>
        </Box>

        {/* Cards grid */}
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {paths.map((p) => (
            <Grid item xs={12} sm={6} md={3} key={p.title}>
              <Box
                onClick={() => handlePath(p)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  border: `1px solid ${C.grisClaro}33`,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 1px 3px rgba(39,47,80,0.04)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 20px 40px rgba(39,47,80,0.12)',
                    borderColor: `${C.navy}22`,
                    '& .path-cover': { transform: 'scale(1.05)' },
                    '& .path-cta': { color: C.verde, gap: 1.25 },
                  },
                }}
              >
                {/* Imagen thumbnail */}
                <Box sx={{ position: 'relative', paddingTop: '70%', overflow: 'hidden' }}>
                  <Box
                    className="path-cover"
                    component="img"
                    src={p.image}
                    alt={p.alt}
                    loading="lazy"
                    sx={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                  {/* Número overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: 14, right: 14,
                    bgcolor: '#fff',
                    borderRadius: '6px',
                    px: 1.25, py: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    <Typography sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: C.navy,
                      fontStyle: 'italic',
                      letterSpacing: '0.04em',
                    }}>
                      {p.number}
                    </Typography>
                  </Box>
                </Box>

                {/* Contenido */}
                <Box sx={{ p: { xs: 2.75, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography component="h3" sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: { xs: '1.25rem', md: '1.375rem' },
                    fontWeight: 600,
                    color: C.navy,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    mb: 1.5,
                  }}>
                    {p.title}
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.9375rem',
                    color: C.gris,
                    lineHeight: 1.6,
                    flexGrow: 1,
                    mb: 2.5,
                  }}>
                    {p.blurb}
                  </Typography>
                  <Box
                    className="path-cta"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      color: C.navy,
                      fontWeight: 600,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'inherit',
                      letterSpacing: '0.02em',
                    }}>
                      Saber más
                    </Typography>
                    <ArrowForwardRoundedIcon sx={{ fontSize: 18, transition: 'transform 0.25s ease' }} />
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
