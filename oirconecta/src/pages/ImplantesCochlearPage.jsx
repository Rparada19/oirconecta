import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Box, 
  Typography, 
  Button, 
  Breadcrumbs, 
  Link, 
  Grid, 
  Card, 
  CardContent, 
  Container,
  Chip,
  Stack
} from '@mui/material';
import { 
  ArrowForward, 
  CheckCircle, 
  Bluetooth,
  BatteryChargingFull,
  Smartphone,
  Hearing,
  MedicalServices
} from '@mui/icons-material';

// Imágenes
const cochlearLogo = '/logos/marcas/Cochlear-logo.png';

const ImplantesCochlearPage = () => {
  const productos = [
    {
      nombre: 'Nucleus 8™',
      categoria: 'Implante Coclear',
      descripcion: 'El implante coclear más avanzado del mundo',
      caracteristicas: [
        'Tecnología SmartSound iQ™',
        'Conectividad Bluetooth',
        'Batería de larga duración',
        'App Nucleus Smart'
      ],
      precio: 'Desde $15.000.000'
    },
    {
      nombre: 'Nucleus 7™',
      categoria: 'Implante Coclear',
      descripcion: 'Tecnología probada con conectividad total',
      caracteristicas: [
        'Tecnología SmartSound iQ™',
        'Conectividad universal',
        'Batería de larga duración',
        'Control por voz'
      ],
      precio: 'Desde $13.500.000'
    },
    {
      nombre: 'Kanso 2™',
      categoria: 'Implante Coclear',
      descripcion: 'Diseño discreto con tecnología avanzada',
      caracteristicas: [
        'Diseño ultra-discreto',
        'Conectividad avanzada',
        'Audio streaming directo',
        'Resistente al agua'
      ],
      precio: 'Desde $14.200.000'
    }
  ];

  const tecnologias = [
    {
      icon: <MedicalServices />,
      titulo: 'SmartSound iQ™',
      descripcion: 'Tecnología de procesamiento de sonido más avanzada'
    },
    {
      icon: <Bluetooth />,
      titulo: 'Conectividad Total',
      descripcion: 'Bluetooth 5.0 y streaming directo'
    },
    {
      icon: <BatteryChargingFull />,
      titulo: 'Tecnología MRI',
      descripcion: 'Compatible con resonancia magnética'
    },
    {
      icon: <Smartphone />,
      titulo: 'App Nucleus Smart',
      descripcion: 'Control personalizado desde tu móvil'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Implantes Cocleares Cochlear - OirConecta | Tecnología SmartSound iQ™</title>
        <meta name="description" content="Descubre los implantes cocleares Cochlear con tecnología SmartSound iQ™. Nucleus 8, Nucleus 7 y Kanso 2 con conectividad Bluetooth." />
        <meta name="keywords" content="implante coclear cochlear, nucleus 8, nucleus 7, kanso 2, Colombia" />
        <link rel="canonical" href="https://oirconecta.com/implantes/cochlear" />
      </Helmet>

      <Header />

      {/* Hero Section - Estilo ReSound */}
      <Box sx={{ 
        background: '#ffffff', 
        py: 12,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Breadcrumbs sx={{ mb: 4, color: '#666' }}>
                <Link href="/" color="inherit">Inicio</Link>
                <Link href="/implantes" color="inherit">Implantes</Link>
                <Typography color="text.primary">Cochlear</Typography>
              </Breadcrumbs>
              
              <Box sx={{ mb: 4 }}>
                <img 
                  src={cochlearLogo} 
                  alt="Cochlear Logo" 
                  style={{ 
                    height: 80,
                    marginBottom: 24
                  }} 
                />
              </Box>
              
              <Typography variant="h2" fontWeight={700} sx={{ mb: 3, color: '#333', lineHeight: 1.2 }}>
                Implantes Cocleares Cochlear
              </Typography>
              
              <Typography variant="h4" fontWeight={500} sx={{ mb: 4, color: '#085946' }}>
                Tecnología SmartSound iQ™
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 6, color: '#666', lineHeight: 1.6, fontWeight: 400 }}>
                La experiencia auditiva debe tener en cuenta cada necesidad única. 
                Descubre una audición más natural y clara con nuestros implantes inteligentes.
              </Typography>
              
              <Stack direction="row" spacing={3}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  sx={{
                    background: '#085946',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': {
                      background: '#0d7a5f',
                    }
                  }}
                >
                  Ver Productos
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: '#085946',
                    color: '#085946',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#0d7a5f',
                      color: '#0d7a5f',
                    }
                  }}
                >
                  Solicitar Cita
                </Button>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                position: 'relative',
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Imagen principal con efecto moderno */}
                <Box
                  sx={{
                    width: 400,
                    height: 400,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: -20,
                      bottom: -20,
                      background: 'linear-gradient(135deg, rgba(8, 89, 70, 0.1) 0%, rgba(8, 89, 70, 0.05) 100%)',
                      borderRadius: '50%',
                      zIndex: -1
                    }
                  }}
                >
                  <MedicalServices sx={{ fontSize: 150, color: '#085946' }} />
                </Box>
                
                {/* Elementos decorativos flotantes */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 50,
                    right: 50,
                    width: 80,
                    height: 80,
                    background: '#085946',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(8, 89, 70, 0.3)'
                  }}
                >
                  <Bluetooth sx={{ fontSize: 40 }} />
                </Box>
                
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 80,
                    left: 30,
                    width: 60,
                    height: 60,
                    background: '#085946',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(8, 89, 70, 0.3)'
                  }}
                >
                  <BatteryChargingFull sx={{ fontSize: 30 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Tecnologías - Estilo ReSound */}
      <Box sx={{ py: 12, background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 8, color: '#333' }}>
            Tecnología Avanzada
          </Typography>
          
          <Grid container spacing={6}>
            {tecnologias.map((tech, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4,
                  background: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                  }
                }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 3,
                      background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 8px 25px rgba(8, 89, 70, 0.3)'
                    }}
                  >
                    {tech.icon}
                  </Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: '#333' }}>
                    {tech.titulo}
                  </Typography>
                  <Typography variant="body1" color="#666" sx={{ lineHeight: 1.6 }}>
                    {tech.descripcion}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Productos - Estilo ReSound */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 8, color: '#333' }}>
            Nuestros Productos
          </Typography>
          
          <Grid container spacing={6}>
            {productos.map((producto, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ 
                  height: '100%',
                  border: 'none',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}>
                  <Box
                    sx={{
                      height: 250,
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <MedicalServices sx={{ fontSize: 120, color: '#085946' }} />
                    
                    {/* Elemento decorativo */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        width: 50,
                        height: 50,
                        background: 'rgba(8, 89, 70, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Bluetooth sx={{ fontSize: 24, color: '#085946' }} />
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Chip 
                        label={producto.categoria} 
                        size="small" 
                        sx={{ 
                          background: '#085946',
                          color: 'white',
                          fontWeight: 600,
                          mr: 2,
                          borderRadius: 2
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="h5" fontWeight={600} color="#333" sx={{ mb: 2 }}>
                      {producto.nombre}
                    </Typography>
                    
                    <Typography variant="body1" color="#666" sx={{ mb: 4, lineHeight: 1.6 }}>
                      {producto.descripcion}
                    </Typography>
                    
                    <Box sx={{ mb: 4 }}>
                      {producto.caracteristicas.map((caracteristica, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CheckCircle sx={{ fontSize: 18, color: '#085946', mr: 2 }} />
                          <Typography variant="body2" color="#666" fontWeight={500}>
                            {caracteristica}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" fontWeight={700} color="#085946">
                        {producto.precio}
                      </Typography>
                      <Button
                        variant="outlined"
                        endIcon={<ArrowForward />}
                        sx={{
                          borderColor: '#085946',
                          color: '#085946',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': {
                            background: '#085946',
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 15px rgba(8, 89, 70, 0.3)',
                          }
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section - Estilo ReSound */}
      <Box sx={{ 
        py: 12, 
        background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
            ¿Listo para una audición más natural?
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, fontWeight: 400, opacity: 0.9, lineHeight: 1.6 }}>
            Actúe ya. Podemos ayudarle a buscar un audioprotesista en su zona.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              background: 'white',
              color: '#085946',
              px: 8,
              py: 3,
              fontSize: '1.2rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              '&:hover': {
                background: '#f8f9fa',
                color: '#0d7a5f',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              }
            }}
          >
            Buscar un audioprotesista
          </Button>
        </Container>
        
        {/* Elementos decorativos de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            zIndex: 1
          }}
        />
      </Box>

      <Footer />
    </>
  );
};

export default ImplantesCochlearPage;