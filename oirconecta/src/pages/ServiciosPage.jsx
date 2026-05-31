import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Assessment, Hearing, Support, Psychology, School, Group } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingCardMedia from '../components/marketing/MarketingCardMedia';

const ServiciosPage = () => {
  const navigate = useNavigate();

  const servicios = [
    {
      titulo: 'Evaluación auditiva',
      descripcion:
        'Audiometría, impedanciometría y pruebas complementarias para caracterizar tu audición y orientar el tratamiento.',
      icono: Assessment,
      gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
    },
    {
      titulo: 'Adaptación de audífonos',
      descripcion:
        'Selección, prueba en consulta y ajuste fino según tu estilo de vida, tipo de pérdida y preferencias.',
      icono: Hearing,
      gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      titulo: 'Implantes cocleares',
      descripcion:
        'Información sobre candidatura, proceso multidisciplinario y seguimiento; coordinación con marcas líderes.',
      icono: Support,
      gradient: 'linear-gradient(135deg, #71A095 0%, #085946 100%)',
    },
    {
      titulo: 'Rehabilitación y terapia',
      descripcion:
        'Acompañamiento en habla auditiva y adaptación a dispositivos para niños y adultos.',
      icono: Psychology,
      gradient: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
    },
    {
      titulo: 'Audiología pediátrica',
      descripcion:
        'Tamizaje, evaluación adaptada a la edad y seguimiento familiar con enfoque sensible.',
      icono: School,
      gradient: 'linear-gradient(135deg, #1a3d4a 0%, #085946 100%)',
    },
    {
      titulo: 'Audiología laboral',
      descripcion:
        'Evaluaciones ocupacionales y recomendaciones para conservación auditiva en entornos de ruido.',
      icono: Group,
      gradient: 'linear-gradient(135deg, #272F50 0%, #71A095 100%)',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Servicios en la red - OírConecta</title>
        <meta
          name="description"
          content="Tipos de servicios auditivos que promueven los profesionales y centros suscritos en OírConecta."
        />
      </Helmet>

      <Header />

      {/* Hero */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.625,
            borderRadius: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              Red OírConecta
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
            Servicios en{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              la red
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
            Estas líneas de servicio las ofrecen los profesionales y centros suscritos. El alcance exacto lo confirma cada especialista en consulta.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={3}>
          {servicios.map((servicio, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Box
                sx={{
                  height: '100%', borderRadius: '22px',
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 2px 16px rgba(8,89,70,0.06)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(8,89,70,0.14)' },
                  overflow: 'hidden',
                }}
              >
                <MarketingCardMedia
                  title={servicio.titulo}
                  subtitle="OírConecta"
                  icon={servicio.icono}
                  gradient={servicio.gradient}
                />
                <Box sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: '#4a5568', fontSize: '0.9375rem', lineHeight: 1.65, mb: 2.5 }}>
                    {servicio.descripcion}
                  </Typography>
                  <Button variant="contained" onClick={() => navigate('/contacto')}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3,
                      background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                      boxShadow: '0 6px 18px rgba(8,89,70,0.25)',
                      '&:hover': { boxShadow: '0 8px 24px rgba(8,89,70,0.35)' } }}>
                    Solicitar información
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8, p: 4, borderRadius: '22px',
          background: 'rgba(8,89,70,0.05)', border: '1px solid rgba(8,89,70,0.12)' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1 }}>
            ¿Quieres una cita?
          </Typography>
          <Typography sx={{ color: '#4a5568', mb: 3 }}>Agenda en línea con el profesional que prefieras</Typography>
          <Button variant="outlined" size="large" onClick={() => navigate('/agendar')}
            sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '1rem', px: 4, py: 1.5,
              borderColor: '#085946', color: '#085946', borderWidth: 2,
              '&:hover': { borderWidth: 2, bgcolor: 'rgba(8,89,70,0.05)' } }}>
            Agendar en línea
          </Button>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default ServiciosPage;
