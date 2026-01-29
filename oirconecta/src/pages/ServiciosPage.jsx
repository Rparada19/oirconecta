import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import { Hearing, Psychology, Support, Assessment, School, Group } from '@mui/icons-material';

const ServiciosPage = () => {
  const servicios = [
    {
      titulo: "Evaluación Auditiva",
      descripcion: "Evaluación completa de la audición con tecnología avanzada para detectar problemas auditivos.",
      icono: <Assessment sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/evaluacion-auditiva.jpg"
    },
    {
      titulo: "Adaptación de Audífonos",
      descripcion: "Selección y adaptación personalizada de audífonos según las necesidades específicas del paciente.",
      icono: <Hearing sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/adaptacion-audifonos.jpg"
    },
    {
      titulo: "Implantes Cocleares",
      descripcion: "Evaluación, cirugía e implantación de dispositivos cocleares para pérdida auditiva severa.",
      icono: <Support sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/implantes-cocleares.jpg"
    },
    {
      titulo: "Terapia de Rehabilitación",
      descripcion: "Programas de rehabilitación auditiva y terapia del habla para mejorar la comunicación.",
      icono: <Psychology sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/terapia-rehabilitacion.jpg"
    },
    {
      titulo: "Audiología Pediátrica",
      descripcion: "Servicios especializados para la evaluación y tratamiento auditivo en niños.",
      icono: <School sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/audiologia-pediatrica.jpg"
    },
    {
      titulo: "Audiología Laboral",
      descripcion: "Evaluaciones auditivas ocupacionales y programas de conservación auditiva.",
      icono: <Group sx={{ fontSize: 40, color: '#085946' }} />,
      imagen: "/images/servicios/audiologia-laboral.jpg"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Servicios - OírConecta | Especialistas del Oído en Colombia</title>
        <meta name="description" content="Servicios especializados en audiología, adaptación de audífonos, implantes cocleares y rehabilitación auditiva en Colombia." />
        <meta name="keywords" content="servicios audiología, audífonos, implantes cocleares, evaluación auditiva, rehabilitación auditiva, Colombia" />
      </Helmet>

      <Box sx={{ 
        background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
        color: 'white',
        py: 8
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Nuestros Servicios
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.9 }}>
            Servicios especializados en salud auditiva
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {servicios.map((servicio, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(8, 89, 70, 0.2)'
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={servicio.imagen}
                  alt={servicio.titulo}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {servicio.icono}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ color: '#085946', fontWeight: 'bold' }}>
                    {servicio.titulo}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {servicio.descripcion}
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      mt: 2,
                      background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)'
                      }
                    }}
                  >
                    Más Información
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      
    </>
  );
};

export default ServiciosPage; 