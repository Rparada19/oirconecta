import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { CheckCircle, ExpandMore, Hearing } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingCardMedia from '../components/marketing/MarketingCardMedia';

const ImplantesPage = () => {
  const navigate = useNavigate();

  const marcas = [
    {
      nombre: 'Cochlear',
      slug: 'cochlear',
      descripcion: 'Líder mundial en implantes cocleares: sistemas Nucleus, Kanso y soluciones Baha.',
      caracteristicas: ['Nucleus', 'Kanso', 'Baha'],
      rating: 4.9,
      gradient: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
    },
    {
      nombre: 'Advanced Bionics',
      slug: 'advanced-bionics',
      descripcion: 'Procesadores Marvel y tecnología HiRes™ para audición clara en entornos complejos.',
      caracteristicas: ['HiRes', 'Naída', 'Marvel'],
      rating: 4.8,
      gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      nombre: 'MED-EL',
      slug: 'medel',
      descripcion: 'Implantes y procesadores SYMBIO™, RONDO y SONNET con enfoque en flexibilidad quirúrgica.',
      caracteristicas: ['SYNCHRONY', 'SONNET', 'RONDO'],
      rating: 4.7,
      gradient: 'linear-gradient(135deg, #0a4d3c 0%, #272F50 100%)',
    },
  ];

  const tipos = [
    {
      titulo: 'Implante coclear',
      descripcion:
        'Dispositivo que estimula el nervio auditivo cuando la cóclea no transmite bien el sonido. Requiere valoración ORL, imagen y equipo de rehabilitación.',
      indicaciones: ['Pérdida severa a profunda bilateral', 'Poco beneficio con audífonos potentes', 'Niños y adultos según protocolo'],
      ventajas: ['Acceso a la pista oral', 'Evolución tecnológica del procesador', 'Seguimiento logoaudiológico'],
    },
    {
      titulo: 'Implante de tronco cerebral / alternativas',
      descripcion:
        'Para casos en que el nervio auditivo no es viable; indicación muy específica y centros de referencia.',
      indicaciones: ['Neurofibromatosis tipo 2', 'Ausencia de nervio o función', 'Criterio de comité especializado'],
      ventajas: ['Opción cuando no hay coclear', 'Abordaje multidisciplinario', 'Expectativas realistas desde el inicio'],
    },
    {
      titulo: 'Implante de oído medio / dispositivos conductivos',
      descripcion:
        'Soluciones para pérdidas conductivas o mixtas cuando no es posible o deseable audífono convencional.',
      indicaciones: ['Conductiva persistente', 'Otosclerosis seleccionada', 'Malformaciones del oído externo/medio'],
      ventajas: ['Menor invasión en algunos casos', 'Buena aceptación', 'Integración con audición residual'],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Implantes auditivos - Red OírConecta | Información</title>
        <meta
          name="description"
          content="Información sobre implantes y marcas; la candidatura y el tratamiento los definen especialistas de la red."
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
            Implantes auditivos
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.95, maxWidth: 800, mx: 'auto' }}>
            OírConecta difunde información y enlaces a equipos de la red. La candidatura y el plan terapéutico son siempre
            decisión médica del especialista que te atienda.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 6, color: '#085946' }}>
            Marcas con las que trabajamos
          </Typography>

          <Grid container spacing={4}>
            {marcas.map((marca) => (
              <Grid item xs={12} md={4} key={marca.slug}>
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
                  <Box sx={{ position: 'relative' }}>
                    <MarketingCardMedia
                      title={marca.nombre}
                      subtitle="Implantes y procesadores"
                      icon={Hearing}
                      gradient={marca.gradient}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {marca.rating}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {marca.descripcion}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {marca.caracteristicas.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          size="small"
                          sx={{
                            m: 0.5,
                            bgcolor: '#085946',
                            color: 'white',
                            '&:hover': { bgcolor: '#272F50' },
                          }}
                        />
                      ))}
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: 2,
                        background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
                        },
                      }}
                      onClick={() => navigate(`/implantes/${marca.slug}`)}
                    >
                      Ver detalle de marca
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4, color: '#085946' }}>
            Tipos de soluciones
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: 4 }}>
            Resumen educativo. El especialista indicará la opción según estudios, edad y objetivos de comunicación.
          </Typography>

          <Grid container spacing={4}>
            {tipos.map((tipo, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ color: '#085946', fontWeight: 'bold' }}>
                      {tipo.titulo}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {tipo.descripcion}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#085946' }}>
                        Indicaciones frecuentes
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {tipo.indicaciones.map((ind) => (
                          <Typography component="li" variant="body2" key={ind} sx={{ mb: 0.5 }}>
                            {ind}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#085946' }}>
                        Ventajas a considerar
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {tipo.ventajas.map((v) => (
                          <Typography component="li" variant="body2" key={v} sx={{ mb: 0.5 }}>
                            {v}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ fontWeight: 600 }}>Preguntas frecuentes breves</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>¿Cuánto dura el proceso?</strong> Depende de cada centro y del tipo de implante; suele incluir
              varias citas previas y rehabilitación posterior.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>¿Cubre la EPS?</strong> La cobertura varía según política y diagnóstico; te orientamos para
              documentar la solicitud.
            </Typography>
            <Typography variant="body2">
              <strong>Siguiente paso:</strong>{' '}
              <Button size="small" onClick={() => navigate('/agendar')}>
                Agendar
              </Button>{' '}
              o{' '}
              <Button size="small" onClick={() => navigate('/contacto')}>
                contacto
              </Button>
              .
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Container>

      <Footer />
    </>
  );
};

export default ImplantesPage;
