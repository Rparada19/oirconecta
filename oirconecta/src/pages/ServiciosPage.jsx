import React from 'react';
import { Helmet } from 'react-helmet';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Stack, Button } from '@mui/material';
import {
  AssessmentOutlined, HearingOutlined, SupportOutlined,
  PsychologyOutlined, SchoolOutlined, GroupOutlined, ArrowForward,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280', grisClaro: '#A1A7B1',
  arena: '#D9CDBF',
};

const SERVICIOS = [
  {
    titulo: 'Evaluación auditiva',
    descripcion: 'Audiometría, impedanciometría y pruebas complementarias para caracterizar tu audición y orientar el tratamiento.',
    icon: AssessmentOutlined,
    image: 'https://images.pexels.com/photos/5206951/pexels-photo-5206951.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    titulo: 'Adaptación de audífonos',
    descripcion: 'Selección, prueba en consulta y ajuste fino según tu estilo de vida, tipo de pérdida y preferencias.',
    icon: HearingOutlined,
    image: 'https://images.pexels.com/photos/14682242/pexels-photo-14682242.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    titulo: 'Implantes cocleares',
    descripcion: 'Información sobre candidatura, proceso multidisciplinario y seguimiento; coordinación con marcas líderes.',
    icon: SupportOutlined,
    image: 'https://images.pexels.com/photos/36485822/pexels-photo-36485822.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    titulo: 'Rehabilitación y terapia',
    descripcion: 'Acompañamiento en habla auditiva y adaptación a dispositivos para niños y adultos.',
    icon: PsychologyOutlined,
    image: 'https://images.pexels.com/photos/8613122/pexels-photo-8613122.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
  {
    titulo: 'Audiología pediátrica',
    descripcion: 'Tamizaje, evaluación adaptada a la edad y seguimiento familiar con enfoque sensible.',
    icon: SchoolOutlined,
    image: 'https://images.unsplash.com/photo-1632053002928-1919605ee6f7?w=900&h=700&q=80&auto=format&fit=crop',
  },
  {
    titulo: 'Audiología laboral',
    descripcion: 'Evaluaciones ocupacionales y recomendaciones para conservación auditiva en entornos de ruido.',
    icon: GroupOutlined,
    image: 'https://images.pexels.com/photos/29988954/pexels-photo-29988954.jpeg?w=900&h=700&auto=compress&cs=tinysrgb&fit=crop',
  },
];

const ServiciosPage = () => (
  <>
    <Helmet>
      <title>Servicios en la red - OírConecta</title>
      <meta name="description" content="Tipos de servicios auditivos que promueven los profesionales y centros suscritos en OírConecta." />
      <link rel="canonical" href="https://oirconecta.com/servicios" />
    </Helmet>
    <Header />

    {/* HERO */}
    <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 14, md: 16 }, pb: { xs: 5, md: 7 }, bgcolor: C.blanco }}>
      <Box sx={{
        position: 'absolute', top: -180, right: -180,
        width: 540, height: 540, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.arena}50 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 3 }}>
          <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
            fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.verde,
          }}>Servicios</Typography>
          <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
        </Stack>
        <Typography component="h1" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '2.5rem', md: '3.75rem' }, fontWeight: 600,
          lineHeight: 1.08, color: C.navy, letterSpacing: '-0.018em', mb: 2.5,
        }}>
          Lo que hace la{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
            red OírConecta
          </Box>
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '1.0625rem', md: '1.1875rem' },
          color: C.gris, lineHeight: 1.6, maxWidth: 620, mx: 'auto',
        }}>
          Servicios auditivos integrales ofrecidos por los profesionales suscritos. Cada uno con la misma promesa: atención humana, honesta y técnica.
        </Typography>
      </Container>
    </Box>

    {/* GRID SERVICIOS */}
    <Box component="section" sx={{ py: { xs: 4, md: 7 }, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {SERVICIOS.map((s) => {
            const Icon = s.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={s.titulo}>
                <Box sx={{
                  display: 'flex', flexDirection: 'column', height: '100%',
                  borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff',
                  border: `1px solid ${C.grisClaro}33`,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 18px 40px ${C.navy}14`,
                    borderColor: `${C.navy}33`,
                    '& .srv-cover': { transform: 'scale(1.05)' },
                  },
                }}>
                  <Box sx={{ position: 'relative', paddingTop: '60%', overflow: 'hidden' }}>
                    <Box
                      className="srv-cover"
                      component="img"
                      src={s.image}
                      alt={s.titulo}
                      loading="lazy"
                      sx={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                    <Box sx={{
                      position: 'absolute', top: 14, left: 14,
                      width: 44, height: 44, borderRadius: '8px',
                      bgcolor: 'rgba(255,255,255,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    }}>
                      <Icon sx={{ fontSize: 22, color: C.verde }} />
                    </Box>
                  </Box>
                  <Box sx={{ p: { xs: 3, md: 3.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography component="h3" sx={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: { xs: '1.25rem', md: '1.375rem' }, fontWeight: 600,
                      color: C.navy, letterSpacing: '-0.01em', lineHeight: 1.2, mb: 1.5,
                    }}>{s.titulo}</Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                      color: C.gris, lineHeight: 1.6, flexGrow: 1,
                    }}>{s.descripcion}</Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>

    {/* CTA */}
    <Box component="section" sx={{
      py: { xs: 6, md: 9 }, background: '#272F50 !important', color: '#fff !important',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 380, height: 380, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
          fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.oro, mb: 2,
        }}>¿Buscas a alguien específico?</Typography>
        <Typography component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600,
          lineHeight: 1.15, color: '#fff', letterSpacing: '-0.018em', mb: 2.5,
        }}>
          Encuentra al{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
            profesional correcto
          </Box>
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
          color: 'rgba(255,255,255,0.80)', mb: 4, maxWidth: 560, mx: 'auto',
        }}>
          Filtra por ciudad, especialidad y servicio. Conecta directamente con quien necesitas.
        </Typography>
        <Button
          component={RouterLink} to="/directorio/listado"
          variant="contained" endIcon={<ArrowForward />}
          sx={{
            fontFamily: '"DM Sans", sans-serif', background: '#C9A86A !important', color: '#272F50 !important',
            fontWeight: 700, fontSize: '0.9375rem', px: 4, py: 1.75,
            borderRadius: '6px',
            boxShadow: `0 8px 24px ${C.oro}55`,
            '&:hover': { background: '#D4B97A !important', transform: 'translateY(-2px)' },
          }}
        >Ir al directorio</Button>
      </Container>
    </Box>

    <Footer />
  </>
);

export default ServiciosPage;
