import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { Hearing, CheckCircle, Star, Support } from '@mui/icons-material';

const AudifonosPage = () => {
  const marcas = [
    {
      nombre: "Widex",
      descripcion: "Audífonos con tecnología de vanguardia y sonido natural",
      imagen: "/images/audifonos/widex.jpg",
      caracteristicas: ["Tecnología AI", "Sonido Natural", "Conectividad Bluetooth"],
      rating: 4.8
    },
    {
      nombre: "Oticon",
      descripcion: "Soluciones auditivas innovadoras para una mejor calidad de vida",
      imagen: "/images/audifonos/oticon.jpg",
      caracteristicas: ["BrainHearing", "Conectividad", "Diseño Discreto"],
      rating: 4.7
    },
    {
      nombre: "Signia",
      descripcion: "Audífonos con tecnología de procesamiento de señal avanzada",
      imagen: "/images/audifonos/signia.jpg",
      caracteristicas: ["Own Voice Processing", "Motion Sensors", "Wireless"],
      rating: 4.9
    },
    {
      nombre: "Phonak",
      descripcion: "Audífonos con conectividad universal y tecnología Roger",
      imagen: "/images/audifonos/phonak.jpg",
      caracteristicas: ["Roger Technology", "Universal Connectivity", "AutoSense"],
      rating: 4.6
    },
    {
      nombre: "ReSound",
      descripcion: "Audífonos con tecnología de micrófonos direccionales",
      imagen: "/images/audifonos/resound.jpg",
      caracteristicas: ["Directional Microphones", "Wireless", "Smart Hearing"],
      rating: 4.5
    },
    {
      nombre: "Starkey",
      descripcion: "Audífonos personalizados con tecnología de vanguardia",
      imagen: "/images/audifonos/starkey.jpg",
      caracteristicas: ["Custom Design", "AI Technology", "Healthable"],
      rating: 4.8
    }
  ];

  return (
    <>
      <Helmet>
        <title>Audífonos - OírConecta | Las Mejores Marcas en Colombia</title>
        <meta name="description" content="Descubre las mejores marcas de audífonos: Widex, Oticon, Signia, Phonak, ReSound y Starkey. Tecnología avanzada para mejorar tu audición." />
        <meta name="keywords" content="audífonos, marcas audífonos, Widex, Oticon, Signia, Phonak, ReSound, Starkey, Colombia" />
      </Helmet>

      <Box sx={{ 
        background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
        color: 'white',
        py: 8
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Audífonos
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.9 }}>
            Las mejores marcas con tecnología de vanguardia
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {marcas.map((marca, index) => (
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
                    <Star sx={{ fontSize: 16, color: '#FFD700' }} />
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
      </Container>
      
    </>
  );
};

export default AudifonosPage; 