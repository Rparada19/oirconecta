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

      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
          color: 'white',
          py: 8,
          pt: { xs: 14, md: 16 },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Servicios en la red OírConecta
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.95, maxWidth: 720, mx: 'auto' }}>
            Estas líneas de servicio las ofrecen los profesionales y centros suscritos. Aquí las resumimos para orientarte;
            el alcance exacto lo confirma cada especialista en consulta.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {servicios.map((servicio, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.2)',
                  },
                }}
              >
                <MarketingCardMedia
                  title={servicio.titulo}
                  subtitle="OírConecta"
                  icon={servicio.icono}
                  gradient={servicio.gradient}
                />
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {servicio.descripcion}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      mt: 1,
                      background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
                      },
                    }}
                    onClick={() => navigate('/contacto')}
                  >
                    Solicitar información
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#272F50' }}>
            ¿Quieres una cita?
          </Typography>
          <Button variant="outlined" size="large" onClick={() => navigate('/agendar')} sx={{ borderColor: '#085946', color: '#085946' }}>
            Agendar en línea
          </Button>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default ServiciosPage;
