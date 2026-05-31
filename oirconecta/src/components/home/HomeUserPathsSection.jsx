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
    image: 'https://image.pollinations.ai/prompt/Senior%20patient%20and%20warm%20Latina%20female%20audiologist%20smiling%20together%20in%20modern%20bright%20clinic%2C%20editorial%20healthcare%20photography%2C%20natural%20light?width=800&height=600&nologo=true',
    alt: 'Audióloga conversando con paciente',
    mode: 'scroll',
    target: 'busqueda-profesionales',
    number: '01',
  },
  {
    title: 'Explorar audífonos',
    blurb: 'Marcas y tecnologías explicadas sin prisa ni presión comercial.',
    image: 'https://image.pollinations.ai/prompt/Modern%20premium%20hearing%20aid%20behind%20mature%20woman%20ear%20closeup%2C%20warm%20natural%20daylight%2C%20clean%20product%20editorial%20photography?width=800&height=600&nologo=true',
    alt: 'Audífono moderno detrás de la oreja',
    mode: 'route',
    to: '/audifonos',
    number: '02',
  },
  {
    title: 'Conocer la red',
    blurb: 'Nuestra misión, criterios de selección y profesionales suscritos.',
    image: 'https://image.pollinations.ai/prompt/Group%20of%20diverse%20Latin%20American%20audiologists%20and%20doctors%20smiling%20together%20in%20healthcare%20clinic%20hallway%2C%20professional%20warm%20portrait%2C%20editorial?width=800&height=600&nologo=true',
    alt: 'Equipo de profesionales auditivos',
    mode: 'route',
    to: '/nosotros',
    number: '03',
  },
  {
    title: 'Aprender sobre audición',
    blurb: 'Señales comunes, qué esperar en consulta y cómo prevenir pérdida.',
    image: 'https://image.pollinations.ai/prompt/Mature%20Latin%20couple%20at%20home%20warmly%20listening%20together%20to%20family%20conversation%2C%20natural%20light%2C%20editorial%20lifestyle%20photography?width=800&height=600&nologo=true',
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
