import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip
} from '@mui/material';
import {
  Hearing,
  MedicalServices,
  Support,
  Security,
  Speed,
  VerifiedUser,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SectionContainer = styled(Box)(() => ({
  padding: '64px 0',
  background: 'white'
}));

const ServiceCard = styled(Card)(() => ({
  // height: '100%',
  zIndex: 1,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  border: '1px solid #A1AFB5',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.15)',
    borderColor: '#085946'
  }
}));

const IconBox = styled(Box)(() => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  marginBottom: '24px',
  background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
  color: 'white',
  fontSize: '2rem'
}));

const ServicesSection = () => {
  const services = [
    {
      icon: <Hearing />,
      title: 'Audífonos Avanzados',
      description: 'Tecnología de última generación con conectividad Bluetooth, cancelación de ruido y adaptación automática.',
      features: [
        'Tecnología inalámbrica',
        'Cancelación de ruido',
        'Adaptación automática',
        'Batería de larga duración'
      ],
      price: 'Desde $2.500.000',
      popular: true
    },
    {
      icon: <MedicalServices />,
      title: 'Implantes Cocleares',
      description: 'Soluciones especializadas para pérdida auditiva severa con tecnología de vanguardia.',
      features: [
        'Evaluación completa',
        'Cirugía especializada',
        'Rehabilitación integral',
        'Seguimiento continuo'
      ],
      price: 'Desde $15.000.000',
      popular: false
    },
    {
      icon: <Support />,
      title: 'Evaluación Auditiva',
      description: 'Diagnóstico preciso con equipos de alta tecnología y profesionales certificados.',
      features: [
        'Audiometría completa',
        'Timpanometría',
        'Emisiones otoacústicas',
        'Informe detallado'
      ],
      price: 'Desde $150.000',
      popular: false
    }
  ];

  const benefits = [
    {
      icon: <VerifiedUser />,
      title: 'Profesionales Certificados',
      description: 'Todos nuestros especialistas cuentan con certificaciones internacionales y amplia experiencia.'
    },
    {
      icon: <Security />,
      title: 'Garantía de Calidad',
      description: 'Ofrecemos garantía extendida en todos nuestros productos y servicios.'
    },
    {
      icon: <Speed />,
      title: 'Atención Rápida',
      description: 'Agenda tu cita en menos de 24 horas y recibe atención prioritaria.'
    },
    {
      icon: <Support />,
      title: 'Soporte 24/7',
      description: 'Nuestro equipo de soporte está disponible para ayudarte en cualquier momento.'
    }
  ];

  return (
    <section aria-label="Servicios de OírConecta">
      <SectionContainer>
        <Container maxWidth="lg">
          {/* Sección de Servicios */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              component="h2"
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#085946',
                mb: 2
              }}
            >
              Nuestros Servicios
            </Typography>
            <Typography 
              component="p"
              variant="h6" 
              sx={{ 
                color: '#86899C',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Soluciones integrales para mejorar tu audición y calidad de vida
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {services.map((service, index) => (
              <Grid item xs={12} md={4} key={index}>
                <ServiceCard>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    {service.popular && (
                      <Chip
                        label="Más Popular"
                        color="primary"
                        size="small"
                        sx={{ mb: 2, bgcolor: '#085946' }}
                      />
                    )}
                    
                    <IconBox>
                      {service.icon}
                    </IconBox>
                    
                    <Typography 
                      component="h3"
                      variant="h5" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        color: '#272F50'
                      }}
                    >
                      {service.title}
                    </Typography>
                    
                    <Typography 
                      component="p"
                      variant="body2" 
                      sx={{ 
                        mb: 3, 
                        lineHeight: 1.6,
                        color: '#86899C'
                      }}
                    >
                      {service.description}
                    </Typography>
                    
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {service.features.map((feature, featureIndex) => (
                        <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ color: '#085946', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#272F50' }}>{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    
                    <Typography 
                      component="p"
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600,
                        color: '#085946'
                      }}
                    >
                      {service.price}
                    </Typography>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForward />}
                      sx={{
                        bgcolor: '#085946',
                        '&:hover': { bgcolor: '#272F50' }
                      }}
                    >
                      Solicitar Información
                    </Button>
                  </CardContent>
                </ServiceCard>
              </Grid>
            ))}
          </Grid>

          {/* Sección de Beneficios */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              component="h3"
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#085946',
                mb: 2
              }}
            >
              ¿Por qué elegirnos?
            </Typography>
            <Typography 
              component="p"
              variant="h6" 
              sx={{ 
                color: '#86899C',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Nuestras ventajas competitivas que nos distinguen en el mercado
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <IconBox sx={{ width: 60, height: 60, fontSize: '1.5rem' }}>
                    {benefit.icon}
                  </IconBox>
                  
                  <Typography 
                    component="h4"
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      color: '#272F50'
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  
                  <Typography 
                    component="p"
                    variant="body2" 
                    sx={{ 
                      lineHeight: 1.6,
                      color: '#86899C'
                    }}
                  >
                    {benefit.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </SectionContainer>
    </section>
  );
};

export default ServicesSection; 