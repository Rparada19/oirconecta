import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Hearing, CheckCircle, ExpandMore, Support, Psychology } from '@mui/icons-material';

const ImplantesPage = () => {
  const marcas = [
    {
      nombre: "Cochlear",
      descripcion: "Líder mundial en implantes cocleares con más de 40 años de experiencia",
      imagen: "/images/implantes/cochlear.jpg",
      caracteristicas: ["Nucleus", "Kanso", "Baha"],
      rating: 4.9
    },
    {
      nombre: "Advanced Bionics",
      descripcion: "Tecnología de vanguardia para una audición natural y clara",
      imagen: "/images/implantes/advanced-bionics.jpg",
      caracteristicas: ["HiRes", "Naída", "Marvel"],
      rating: 4.8
    },
    {
      nombre: "MED-EL",
      descripcion: "Innovación constante en tecnología de implantes auditivos",
      imagen: "/images/implantes/medel.jpg",
      caracteristicas: ["SYNCHRONY", "SONNET", "RONDO"],
      rating: 4.7
    }
  ];

  const tipos = [
    {
      titulo: "Implante Coclear",
      descripcion: "Dispositivo electrónico que estimula directamente el nervio auditivo",
      indicaciones: ["Pérdida auditiva severa a profunda", "Sordera bilateral", "Niños y adultos"],
      ventajas: ["Mejora significativa en la audición", "Tecnología avanzada", "Resultados probados"]
    },
    {
      titulo: "Implante de Tronco Cerebral",
      descripcion: "Para casos donde el nervio auditivo no funciona correctamente",
      indicaciones: ["Neurofibromatosis tipo 2", "Tumores del nervio auditivo", "Malformaciones congénitas"],
      ventajas: ["Única opción para casos específicos", "Tecnología especializada", "Equipo multidisciplinario"]
    },
    {
      titulo: "Implante de Oído Medio",
      descripcion: "Para pérdidas auditivas moderadas a severas",
      indicaciones: ["Pérdida auditiva conductiva", "Pérdida auditiva mixta", "Otosclerosis"],
      ventajas: ["Menos invasivo", "Preserva la anatomía", "Recuperación más rápida"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Implantes Auditivos - OírConecta | Tecnología Avanzada en Colombia</title>
        <meta name="description" content="Implantes cocleares y auditivos de las mejores marcas: Cochlear, Advanced Bionics y MED-EL. Tecnología de vanguardia para recuperar la audición." />
        <meta name="keywords" content="implantes cocleares, implantes auditivos, Cochlear, Advanced Bionics, MED-EL, Colombia" />
      </Helmet>

      <Box sx={{ 
        background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
        color: 'white',
        py: 8
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Implantes Auditivos
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.9 }}>
            Tecnología de vanguardia para recuperar la audición
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Marcas */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 6, color: '#085946' }}>
            Marcas Disponibles
          </Typography>
          
          <Grid container spacing={4}>
            {marcas.map((marca, index) => (
              <Grid item xs={12} md={4} key={index}>
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
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={marca.imagen}
                      alt={marca.nombre}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {marca.rating}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ color: '#085946', fontWeight: 'bold' }}>
                      {marca.nombre}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {marca.descripcion}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      {marca.caracteristicas.map((caracteristica, idx) => (
                        <Chip
                          key={idx}
                          label={caracteristica}
                          size="small"
                          sx={{
                            m: 0.5,
                            bgcolor: '#085946',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#272F50'
                            }
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
                          background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)'
                        }
                      }}
                    >
                      Ver Modelos
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tipos de Implantes */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 6, color: '#085946' }}>
            Tipos de Implantes
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
                      <Typography variant="h6" gutterBottom sx={{ color: '#085946' }}>
                        Indicaciones:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {tipo.indicaciones.map((indicacion, idx) => (
                          <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                            {indicacion}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ color: '#085946' }}>
                        Ventajas:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {tipo.ventajas.map((ventaja, idx) => (
                          <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                            {ventaja}
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
      </Container>
      
    </>
  );
};

export default ImplantesPage; 