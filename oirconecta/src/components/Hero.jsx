import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  TextField, 
  InputAdornment,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack
} from '@mui/material';
import { 
  Search, 
  LocationOn, 
  Hearing, 
  MedicalServices,
  Star,
  TrendingUp,
  VerifiedUser,
  Support
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import SearchEngine from './SearchEngine';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #085946 0%, #272F50 50%, #71A095 100%)',
  color: 'white',
  padding: theme.spacing(12, 0, 8),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3
  }
}));

const StatsSection = styled(Box)(({ theme }) => ({
  background: '#f8fafc',
  padding: theme.spacing(8, 0),
  borderTop: '1px solid #A1AFB5'
}));

const StatCard = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  '& .stat-number': {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#085946',
    marginBottom: theme.spacing(1)
  },
  '& .stat-label': {
    fontSize: '1rem',
    color: '#86899C',
    fontWeight: 500
  }
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  '& .logo-icon': {
    position: 'relative',
    width: 120,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    '& .figure-left': {
      position: 'absolute',
      left: 20,
      width: 40,
      height: 60,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: '20px 20px 0 0',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -15,
        left: 5,
        width: 20,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '50%',
      },
    },
    '& .figure-right': {
      position: 'absolute',
      right: 20,
      width: 40,
      height: 60,
      backgroundColor: 'rgba(255,255,255,0.7)',
      borderRadius: '20px 20px 0 0',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -15,
        right: 5,
        width: 20,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: '50%',
      },
    },
  },
  '& .logo-text': {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '-0.02em'
  }
}));

const Hero = () => {
  const stats = [
    { number: '500+', label: 'Profesionales' },
    { number: '50+', label: 'Ciudades' },
    { number: '10K+', label: 'Pacientes Atendidos' },
    { number: '98%', label: 'Satisfacción' }
  ];

  return (
    <section aria-label="Banner principal de OírConecta">
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                component="h1"
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 3,
                  lineHeight: 1.2
                }}
              >
                Encuentra los Mejores{' '}
                <Box component="span" sx={{ color: '#A1AFB5' }}>
                  Especialistas del Oído
                </Box>{' '}
                en Colombia
              </Typography>
              
              <Typography 
                component="p"
                variant="h5" 
                sx={{ 
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                Conectamos pacientes con profesionales certificados en audiología, 
                otorrinolaringología y tecnología auditiva avanzada.
              </Typography>

              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip 
                  icon={<Star />} 
                  label="Profesionales Certificados" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<TrendingUp />} 
                  label="Tecnología Avanzada" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<LocationOn />} 
                  label="Cobertura Nacional" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <LogoContainer>
                  <div className="logo-icon">
                    <div className="figure-left"></div>
                    <div className="figure-right"></div>
                  </div>
                  <Typography className="logo-text">
                    OírConecta
                  </Typography>
                  <Typography 
                    component="p"
                    variant="h6" 
                    sx={{ 
                      color: '#A1AFB5',
                      fontWeight: 400,
                      mt: 1
                    }}
                  >
                    Especialistas del Oído
                  </Typography>
                </LogoContainer>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* SearchEngine superpuesto al Hero */}
      <SearchEngine />

      {/* Sección de Estadísticas */}
      <StatsSection>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <StatCard>
                  <Typography component="div" className="stat-number">
                    {stat.number}
                  </Typography>
                  <Typography component="div" className="stat-label">
                    {stat.label}
                  </Typography>
                </StatCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </StatsSection>
    </section>
  );
};

export default Hero; 