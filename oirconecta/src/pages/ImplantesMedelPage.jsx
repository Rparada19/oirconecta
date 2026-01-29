import React, { useState } from 'react';
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
  Divider,
  Fade
} from '@mui/material';
import { 
  ArrowForward, 
  CheckCircle, 
  Bluetooth,
  BatteryChargingFull,
  Smartphone,
  Hearing,
  Psychology
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Imágenes
const medelLogo = '/logos/marcas/MED-EL-logo.png';

// Styled Components - Minimalista
const HeroSection = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  color: '#000000',
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid #e0e0e0'
}));

const ProductCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: 0,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#085946',
    boxShadow: '0 2px 8px rgba(8, 89, 70, 0.1)',
  }
}));

const TechBadge = styled(Chip)(({ theme }) => ({
  background: '#085946',
  color: 'white',
  fontWeight: 400,
  fontSize: '0.75rem',
  height: 24,
  borderRadius: 0,
  '&:hover': {
    background: '#0d7a5f',
  }
}));

const ImplantesMedelPage = () => {
  const productos = [
    {
      nombre: 'SYMBIO™',
      categoria: 'Implante Coclear',
      descripcion: 'El implante coclear más avanzado de MED-EL',
      caracteristicas: [
        'Tecnología FineHearing™',
        'Conectividad Bluetooth',
        'Batería de larga duración',
        'App AudioKey'
      ],
      tecnologias: ['FineHearing™', 'Bluetooth', 'AI Learning'],
      precio: 'Desde $14.500.000'
    },
    {
      nombre: 'RONDO 3™',
      categoria: 'Implante Coclear',
      descripcion: 'Procesador externo con tecnología avanzada',
      caracteristicas: [
        'Tecnología FineHearing™',
        'Conectividad universal',
        'Batería de larga duración',
        'Control por voz'
      ],
      tecnologias: ['FineHearing™', 'Bluetooth', 'Voice Control'],
      precio: 'Desde $13.800.000'
    },
    {
      nombre: 'SONNET 2™',
      categoria: 'Implante Coclear',
      descripcion: 'Diseño discreto con tecnología de vanguardia',
      caracteristicas: [
        'Diseño ultra-discreto',
        'Conectividad avanzada',
        'Audio streaming directo',
        'Resistente al agua'
      ],
      tecnologias: ['Streaming', 'Water Resistant', 'Discrete Design'],
      precio: 'Desde $14.200.000'
    }
  ];

  const tecnologias = [
    {
      icon: <Psychology />,
      titulo: 'FineHearing™',
      descripcion: 'Tecnología de procesamiento de sonido más natural'
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
      titulo: 'App AudioKey',
      descripcion: 'Control personalizado desde tu móvil'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Implantes Cocleares MED-EL - OirConecta | Tecnología FineHearing™</title>
        <meta name="description" content="Descubre los implantes cocleares MED-EL con tecnología FineHearing™. SYMBIO, RONDO 3 y SONNET 2 con conectividad Bluetooth." />
        <meta name="keywords" content="implante coclear med-el, fine hearing, symbio, rondo 3, sonnet 2, Colombia" />
        <link rel="canonical" href="https://oirconecta.com/implantes/medel" />
      </Helmet>

      <Header />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={500}>
                <Box>
                  <Breadcrumbs sx={{ mb: 4, color: '#666' }}>
                    <Link href="/" color="inherit">Inicio</Link>
                    <Link href="/implantes" color="inherit">Implantes</Link>
                    <Typography color="text.primary">MED-EL</Typography>
                  </Breadcrumbs>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <img 
                      src={medelLogo} 
                      alt="MED-EL Logo" 
                      style={{ 
                        height: 60
                      }} 
                    />
                  </Box>
                  
                  <Typography variant="h4" fontWeight={300} sx={{ mb: 3, color: '#333' }}>
                    Tecnología FineHearing™
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.6, fontSize: '1.1rem' }}>
                    Líder en innovación en tecnología de implantes cocleares con más de 30 años de experiencia. 
                    Descubre una audición más natural y clara.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      sx={{
                        background: '#085946',
                        borderRadius: 0,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 400,
                        textTransform: 'none',
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
                        borderColor: '#e0e0e0',
                        color: '#333',
                        borderRadius: 0,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 400,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#085946',
                          color: '#085946',
                        }
                      }}
                    >
                      Solicitar Cita
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Fade in timeout={800}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 200,
                      height: 200,
                      mx: 'auto',
                      background: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Psychology sx={{ fontSize: 80, color: '#085946' }} />
                  </Box>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Tecnologías */}
      <Box sx={{ py: 8, background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={300} sx={{ mb: 6, color: '#333' }}>
            Tecnología Avanzada
          </Typography>
          
          <Grid container spacing={4}>
            {tecnologias.map((tech, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 2,
                      background: '#085946',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    {tech.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={400} sx={{ mb: 1, color: '#333' }}>
                    {tech.titulo}
                  </Typography>
                  <Typography variant="body2" color="#666">
                    {tech.descripcion}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Productos */}
      <Box sx={{ py: 8, background: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={300} sx={{ mb: 6, color: '#333' }}>
            Nuestros Productos
          </Typography>
          
          <Grid container spacing={4}>
            {productos.map((producto, index) => (
              <Grid item xs={12} md={4} key={index}>
                <ProductCard>
                  <Box
                    sx={{
                      height: 160,
                      background: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid #e0e0e0'
                    }}
                  >
                    <Hearing sx={{ fontSize: 60, color: '#085946' }} />
                  </Box>
                  
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={producto.categoria} 
                        size="small" 
                        sx={{ 
                          background: '#085946',
                          color: 'white',
                          fontWeight: 400,
                          mr: 2,
                          borderRadius: 0
                        }} 
                      />
                      <Typography variant="h6" fontWeight={400} color="#333">
                        {producto.nombre}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="#666" sx={{ mb: 3 }}>
                      {producto.descripcion}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      {producto.caracteristicas.map((caracteristica, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: '#085946', mr: 1 }} />
                          <Typography variant="body2" color="#666">
                            {caracteristica}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {producto.tecnologias.map((tech, idx) => (
                        <TechBadge key={idx} label={tech} size="small" />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight={400} color="#085946">
                        {producto.precio}
                      </Typography>
                      <Button
                        variant="outlined"
                        endIcon={<ArrowForward />}
                        sx={{
                          borderColor: '#085946',
                          color: '#085946',
                          borderRadius: 0,
                          textTransform: 'none',
                          fontWeight: 400,
                          '&:hover': {
                            background: '#085946',
                            color: 'white',
                          }
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </Box>
                  </CardContent>
                </ProductCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, background: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={300} sx={{ mb: 3, color: '#333' }}>
            ¿Listo para una audición más natural?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#666', fontSize: '1.1rem' }}>
            Agenda una consulta gratuita y descubre cómo MED-EL puede transformar tu audición
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              background: '#085946',
              borderRadius: 0,
              px: 6,
              py: 2,
              fontSize: '1rem',
              fontWeight: 400,
              textTransform: 'none',
              '&:hover': {
                background: '#0d7a5f',
              }
            }}
          >
            Solicitar Consulta Gratuita
          </Button>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default ImplantesMedelPage;