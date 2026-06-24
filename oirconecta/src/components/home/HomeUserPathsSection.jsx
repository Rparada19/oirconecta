import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';
import { useReveal } from '../../hooks/useReveal';

const C = {
  navy: '#272F50',
  verde: '#085946',
  oro: '#C9A86A',
  oroSuave: '#E0C28A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  border: '#E5E0D6',
};

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const PATHS = [
  {
    n: '01',
    titulo: 'Encontrar un especialista',
    bajada: 'Audiólogos, otorrinos y fonoaudiólogos verificados. Filtra por ciudad o por especialidad.',
    image: '/img/audiologo-paciente-consulta.jpg',
    alt: 'Audióloga colombiana atendiendo a un paciente',
    mode: 'scroll', target: 'busqueda-profesionales',
    tag: 'Directorio',
  },
  {
    n: '02',
    titulo: 'Conocer audífonos',
    bajada: 'Las trece marcas que se venden en Colombia, explicadas sin tecnicismos ni presión comercial.',
    image: '/img/audifono-tecnologia-moderna.jpg',
    alt: 'Audífono moderno tipo receiver-in-canal sobre fondo neutro',
    mode: 'route', to: '/audifonos',
    tag: 'Tecnología',
  },
  {
    n: '03',
    titulo: 'Probar la simulación',
    bajada: 'Una experiencia sonora para entender cómo escucha tu mamá, tu papá, tu pareja.',
    image: '/img/abuelo-nieto-conversando.jpg',
    alt: 'Abuelo escuchando atentamente a su nieta',
    mode: 'route', to: '/ponte-en-sus-oidos',
    tag: 'Experiencia',
  },
  {
    n: '04',
    titulo: 'Leer el blog',
    bajada: 'Más de cincuenta artículos sobre audición, audífonos y salud auditiva en Colombia.',
    image: '/img/centro-auditivo-colombia.jpg',
    alt: 'Profesional revisando contenido sobre salud auditiva',
    mode: 'route', to: '/blog',
    tag: 'Aprender',
  },
];

function PathCard({ p, navigate, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.15 });
  const onClick = () => {
    if (p.mode === 'scroll') scrollToId(p.target);
    else navigate(p.to);
  };

  return (
    <Box
      ref={ref}
      component="article"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      sx={{
        position: 'relative', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        bgcolor: 'transparent',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
        '&:hover .oc-cover img': { transform: 'scale(1.06)' },
        '&:hover .oc-arrow': { gap: 2, color: C.verde },
        '&:hover .oc-title': { color: C.verde },
      }}
    >
      {/* Imagen */}
      <Box className="oc-cover" sx={{
        position: 'relative', borderRadius: '10px', overflow: 'hidden',
        aspectRatio: '4/5', mb: 3,
        boxShadow: `0 16px 36px ${C.navy}1a`,
      }}>
        <Box component="img" src={p.image} alt={p.alt} loading="lazy" decoding="async"
          sx={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform 0.8s cubic-bezier(0.2,0.7,0.2,1)',
          }}
        />
        {/* Tag editorial */}
        <Box sx={{
          position: 'absolute', top: 16, left: 16,
          bgcolor: 'rgba(255,255,255,0.92)', color: C.navy,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', px: 1.25, py: 0.5, borderRadius: '4px',
        }}>{p.tag}</Box>
        {/* Número editorial */}
        <Box sx={{
          position: 'absolute', bottom: 12, right: 14,
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '4rem', fontWeight: 700, color: '#fff',
          opacity: 0.85, lineHeight: 1,
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>{p.n}</Box>
      </Box>

      {/* Texto */}
      <Typography component="h3" className="oc-title" sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.4rem', md: '1.625rem' }, fontWeight: 600,
        color: C.navy, mb: 1.25, lineHeight: 1.15,
        transition: 'color 0.3s ease',
      }}>
        {p.titulo}
      </Typography>
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.95rem', color: C.gris, lineHeight: 1.55, mb: 2.25,
      }}>
        {p.bajada}
      </Typography>

      {/* Arrow CTA editorial */}
      <Box className="oc-arrow" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1.25,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.825rem', fontWeight: 700,
        color: C.navy, letterSpacing: '0.08em', textTransform: 'uppercase',
        pb: 0.5, mt: 'auto',
        borderBottom: `1.5px solid ${C.navy}`,
        alignSelf: 'flex-start',
        transition: 'gap 0.3s ease, color 0.3s ease, border-color 0.3s ease',
      }}>
        Explorar
        <ArrowForward sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}

export default function HomeUserPathsSection() {
  const navigate = useNavigate();
  const header = useReveal({ threshold: 0.2 });

  return (
    <Box component="section" sx={{
      position: 'relative', bgcolor: C.blanco, py: { xs: 8, md: 14 },
      overflow: 'hidden',
    }}>
      {/* Línea fina decorativa */}
      <Box aria-hidden sx={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, bgcolor: `${C.navy}10`,
      }} />

      <Container maxWidth="xl">
        {/* Header asimétrico estilo magazine */}
        <Box ref={header.ref} sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: { xs: 4, md: 6 }, mb: { xs: 6, md: 10 }, alignItems: 'end',
          opacity: header.visible ? 1 : 0,
          transform: header.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 3 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: C.navy,
              }}>
                Por dónde empezar
              </Typography>
            </Stack>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.25rem', md: '3.5rem', lg: '4rem' }, fontWeight: 500,
              color: C.navy, lineHeight: 1, letterSpacing: '-0.025em',
            }}>
              Cuatro{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde }}>
                caminos.
              </Box>
            </Typography>
          </Box>
          <Box sx={{ pb: { md: 2 } }}>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.2rem' }, lineHeight: 1.6,
              color: C.gris, maxWidth: 560,
            }}>
              Cada visitante llega buscando algo distinto. Aquí te dejamos las puertas
              principales, sin obligarte a recorrer el sitio entero antes de encontrar
              lo que necesitas.
            </Typography>
          </Box>
        </Box>

        {/* Grid de cards editoriales */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 5, md: 4 },
        }}>
          {PATHS.map((p, i) => (
            <PathCard key={p.n} p={p} navigate={navigate} delay={i * 0.1} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
