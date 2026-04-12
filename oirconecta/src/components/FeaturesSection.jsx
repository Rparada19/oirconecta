import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CalendarMonth,
  MenuBook,
  PersonSearch,
  Handshake,
  MedicalServices,
  Storefront,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  border: '1px solid',
  borderColor: 'rgba(39, 47, 80, 0.08)',
  boxShadow: 'none',
  '&:hover': {
    borderColor: 'rgba(8, 89, 70, 0.2)',
    boxShadow: '0 8px 28px rgba(30, 36, 56, 0.08)',
  },
}));

const IconBox = styled(Box)(({ theme }) => ({
  width: 72,
  height: 72,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(145deg, #085946 0%, #3d8a75 100%)',
  color: 'white',
}));

const FeaturesSection = () => {
  const features = [
    {
      icon: <CalendarMonth sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Valores al día',
      description:
        'Referencia mensual de audífonos y accesorios para orientarte; los precios finales los define cada profesional o centro de la red.',
    },
    {
      icon: <MenuBook sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Educación',
      description:
        'Contenido claro para entender opciones, tecnologías y pasos del cuidado auditivo y tomar mejores decisiones.',
    },
    {
      icon: <PersonSearch sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Ubica al profesional',
      description:
        'Te ayudamos a encontrar audiólogos, ORL, otólogos y centros según ciudad, especialidad y lo que necesitas.',
    },
    {
      icon: <Handshake sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Acompañamiento',
      description:
        'Acompañamos la toma de decisiones con información ordenada; la indicación y el tratamiento son siempre del especialista.',
    },
    {
      icon: <MedicalServices sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Todos los servicios',
      description:
        'La red promueve evaluación, audífonos, implantes, rehabilitación y más: explora la oferta y contacta a quien elijas.',
    },
    {
      icon: <Storefront sx={{ fontSize: 36, color: 'white' }} />,
      title: 'Marcas del mercado',
      description:
        'Información sobre fabricantes y líneas que encuentras en el ecosistema auditivo, para comparar con base.',
    },
  ];

  return (
    <Box component="section" aria-label="Qué hace OírConecta" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2 }}
        >
          Qué hacemos por ti
        </Typography>
        <Typography component="h2" variant="h3" sx={{ textAlign: 'center', mb: 2, fontWeight: 700, color: 'primary.main' }}>
          Todo lo que necesitas para decidir con calma
        </Typography>
        <Typography
          component="p"
          variant="body1"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            maxWidth: 640,
            mx: 'auto',
            mb: 6,
            fontSize: '1.0625rem',
            lineHeight: 1.65,
          }}
        >
          Información clara, educación sencilla y acceso a la red: para que no tengas que recorrer solo el camino.
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FeatureCard>
                <CardContent sx={{ textAlign: 'center', p: { xs: 3, sm: 4 } }}>
                  <IconBox>{feature.icon}</IconBox>
                  <Typography component="h3" variant="h6" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                    {feature.title}
                  </Typography>
                  <Typography component="p" variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
