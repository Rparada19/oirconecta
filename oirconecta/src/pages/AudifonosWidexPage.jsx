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
  Stack,
  CardMedia,
  CardActions
} from '@mui/material';
import { 
  ArrowForward, 
  CheckCircle, 
  Bluetooth,
  BatteryChargingFull,
  Smartphone,
  Hearing,
  Visibility
} from '@mui/icons-material';

// Imágenes
const widexLogo = '/logos/marcas/Widex-logo.jpg';

const AudifonosWidexPage = () => {
  const productos = [
    {
      nombre: 'Moment Sheer™',
      categoria: 'RIC',
      descripcion: 'Sonido natural con tecnología PureSound™',
      caracteristicas: [
        'PureSound™ Technology',
        'Bluetooth 5.0',
        'Batería recargable 30h',
        'App móvil inteligente'
      ],
      precio: 'Desde $2.500.000',
      imagen: '/logos/marcas/Widex-logo.jpg',
      destacado: true
    },
    {
      nombre: 'Evoke™',
      categoria: 'BTE',
      descripcion: 'Audífono inteligente con aprendizaje automático',
      caracteristicas: [
        'SoundSense Learn',
        'Conectividad universal',
        'Batería de larga duración',
        'Control por voz'
      ],
      precio: 'Desde $3.200.000',
      imagen: '/logos/marcas/Widex-logo.jpg',
      destacado: false
    },
    {
      nombre: 'SmartRIC™',
      categoria: 'RIC',
      descripcion: 'Diseño discreto con máxima conectividad',
      caracteristicas: [
        'Diseño ultra-discreto',
        'Conectividad avanzada',
        'Audio streaming directo',
        'Resistente al agua'
      ],
      precio: 'Desde $2.800.000',
      imagen: '/logos/marcas/Widex-logo.jpg',
      destacado: false
    },
    {
      nombre: 'Moment™',
      categoria: 'RIC',
      descripcion: 'Audífono premium con tecnología avanzada',
      caracteristicas: [
        'PureSound™ Technology',
        'Conectividad Bluetooth',
        'Batería recargable 24h',
        'Control por app'
      ],
      precio: 'Desde $2.200.000',
      imagen: '/logos/marcas/Widex-logo.jpg',
      destacado: false
    }
  ];

  const categorias = [
    {
      nombre: 'RIC',
      descripcion: 'Audífonos Receptor-en-el-Canal',
      icono: <Hearing />
    },
    {
      nombre: 'BTE',
      descripcion: 'Audífonos Detrás de la Oreja',
      icono: <Hearing />
    },
    {
      nombre: 'ITE',
      descripcion: 'Audífonos En-el-Oído',
      icono: <Hearing />
    }
  ];

  const tecnologias = [
    {
      icon: <Hearing />,
      titulo: 'PureSound™',
      descripcion: 'Tecnología de sonido natural sin distorsión'
    },
    {
      icon: <Bluetooth />,
      titulo: 'Conectividad Total',
      descripcion: 'Bluetooth 5.0 y streaming directo'
    },
    {
      icon: <BatteryChargingFull />,
      titulo: 'Batería Inteligente',
      descripcion: 'Hasta 30 horas de uso continuo'
    },
    {
      icon: <Smartphone />,
      titulo: 'App Avanzada',
      descripcion: 'Control personalizado desde tu móvil'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Audífonos Widex - OirConecta | Tecnología PureSound™</title>
        <meta name="description" content="Descubre los audífonos Widex con tecnología PureSound™. Moment Sheer, Evoke y SmartRIC con conectividad Bluetooth y diseño discreto." />
        <meta name="keywords" content="audífonos widex, pure sound, moment sheer, evoke, smartric, Colombia" />
        <link rel="canonical" href="https://oirconecta.com/audifonos/widex" />
      </Helmet>

      <Header />

      {/* Hero Section - Estilo Widex */}
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
                <Link href="/audifonos" color="inherit">Audífonos</Link>
                <Typography color="text.primary">Widex</Typography>
              </Breadcrumbs>
              
              <Box sx={{ mb: 4 }}>
                <img 
                  src={widexLogo} 
                  alt="Widex Logo" 
                  style={{ 
                    height: 80,
                    marginBottom: 24
                  }} 
                />
              </Box>
              
              <Typography variant="h2" fontWeight={700} sx={{ mb: 3, color: '#333', lineHeight: 1.2 }}>
                Audífonos Widex
              </Typography>
              
              <Typography variant="h4" fontWeight={500} sx={{ mb: 4, color: '#085946' }}>
                Tecnología PureSound™
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 6, color: '#666', lineHeight: 1.6, fontWeight: 400 }}>
                Su pérdida auditiva es tan única como su huella digital, y sus audífonos también pueden serlo. 
                Con la ayuda de un profesional de la audición, puede encontrar un audífono que se adapte a su audición, a su vida y a su estilo.
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
                {/* Imagen principal de audífonos Widex */}
                <Box
                  sx={{
                    width: 400,
                    height: 400,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: -20,
                      bottom: -20,
                      background: 'linear-gradient(135deg, rgba(8, 89, 70, 0.1) 0%, rgba(8, 89, 70, 0.05) 100%)',
                      borderRadius: 3,
                      zIndex: -1
                    }
                  }}
                >
                  {/* Imagen de audífonos Widex */}
                  <img
                    src="/logos/marcas/Widex-logo.jpg"
                    alt="Audífonos Widex"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 12
                    }}
                  />
                  
                  {/* Overlay con información */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(8, 89, 70, 0.9))',
                      color: 'white',
                      p: 3,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      Moment Sheer™
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Sonido natural con PureSound™
                    </Typography>
                  </Box>
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

      {/* Categorías de Audífonos - Estilo Widex */}
      <Box sx={{ py: 12, background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 8, color: '#333' }}>
            Tipos de Audífonos
          </Typography>
          
          <Grid container spacing={6}>
            {categorias.map((categoria, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ 
                  height: '100%',
                  border: 'none',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}>
                  <Box
                    sx={{
                      height: 200,
                      background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    {categoria.icono}
                  </Box>
                  
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: '#333' }}>
                      {categoria.nombre}
                    </Typography>
                    <Typography variant="h6" color="#666" sx={{ mb: 3, fontWeight: 500 }}>
                      {categoria.descripcion}
                    </Typography>
                    <Button
                      variant="outlined"
                      endIcon={<ArrowForward />}
                      sx={{
                        borderColor: '#085946',
                        color: '#085946',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          background: '#085946',
                          color: 'white',
                        }
                      }}
                    >
                      Descubra
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Productos Destacados - Estilo Widex */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={700} sx={{ mb: 8, color: '#333' }}>
            Nuestros Productos
          </Typography>
          
          <Grid container spacing={6}>
            {productos.map((producto, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ 
                  height: '100%',
                  border: 'none',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}>
                  {producto.destacado && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: '#085946',
                        color: 'white',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        zIndex: 2
                      }}
                    >
                      DESTACADO
                    </Box>
                  )}
                  
                  <Box
                    sx={{
                      height: 200,
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Hearing sx={{ fontSize: 80, color: '#085946' }} />
                  </Box>
                  
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                    
                    <Typography variant="body1" color="#666" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {producto.descripcion}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      {producto.caracteristicas.slice(0, 2).map((caracteristica, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: '#085946', mr: 1 }} />
                          <Typography variant="body2" color="#666" fontWeight={500}>
                            {caracteristica}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Typography variant="h6" fontWeight={700} color="#085946" sx={{ mb: 3 }}>
                      {producto.precio}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<Visibility />}
                      sx={{
                        background: '#085946',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          background: '#0d7a5f',
                        }
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Tecnologías - Estilo Widex */}
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

      {/* CTA Section - Estilo Widex */}
      <Box sx={{ 
        py: 12, 
        background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 4 }}>
            ¿Listo para experimentar el sonido natural?
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

export default AudifonosWidexPage;