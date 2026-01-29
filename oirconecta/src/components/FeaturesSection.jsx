import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Hearing,
  MedicalServices,
  VerifiedUser,
  Support
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FeatureCard = styled(Card)(() => ({
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.15)'
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

const FeaturesSection = () => {
  const features = [
    {
      icon: <Hearing sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Audífonos Avanzados',
      description: 'Tecnología de última generación para mejorar tu audición'
    },
    {
      icon: <MedicalServices sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Implantes Cocleares',
      description: 'Soluciones especializadas para pérdida auditiva severa'
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Profesionales Certificados',
      description: 'Especialistas con amplia experiencia y certificaciones'
    },
    {
      icon: <Support sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Atención Personalizada',
      description: 'Cuidado integral adaptado a tus necesidades específicas'
    }
  ];

  return (
    <section aria-label="Características de OírConecta">
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography 
          component="h2"
          variant="h3" 
          sx={{ 
            textAlign: 'center', 
            mb: 6,
            fontWeight: 700,
            color: '#085946'
          }}
        >
          ¿Por qué elegir OírConecta?
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard>
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <IconBox>
                    {feature.icon}
                  </IconBox>
                  <Typography 
                    component="h3"
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      color: '#272F50'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    component="p"
                    variant="body2" 
                    color="text.secondary"
                    sx={{ color: '#86899C' }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </section>
  );
};

export default FeaturesSection; 