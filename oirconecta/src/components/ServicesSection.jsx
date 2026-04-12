import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { Security, Speed, VerifiedUser, Support } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SectionRoot = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 0),
  background: theme.palette.background.paper,
}));

const BenefitCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: '1px solid',
  borderColor: 'rgba(39, 47, 80, 0.08)',
  boxShadow: 'none',
  borderRadius: theme.shape.borderRadius * 1.25,
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    borderColor: 'rgba(8, 89, 70, 0.15)',
    boxShadow: '0 8px 28px rgba(30, 36, 56, 0.06)',
  },
}));

const IconBox = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(2.5),
  background: 'linear-gradient(145deg, rgba(8, 89, 70, 0.12) 0%, rgba(113, 160, 149, 0.2) 100%)',
  color: theme.palette.primary.main,
  '& svg': { fontSize: 30 },
}));

const ServicesSection = () => {
  const benefits = [
    {
      icon: <VerifiedUser />,
      title: 'Varios especialistas',
      description: 'Un mismo sitio para ver perfiles y servicios de quienes forman parte de la red OírConecta.',
    },
    {
      icon: <Security />,
      title: 'Transparencia',
      description:
        'La relación clínica y comercial es con el profesional o centro que elijas; nosotros facilitamos el descubrimiento.',
    },
    {
      icon: <Speed />,
      title: 'Menos fricción',
      description: 'Busca por ciudad, especialidad o nombre y acerca tu primera consulta o mensaje.',
    },
    {
      icon: <Support />,
      title: 'Soporte de plataforma',
      description: 'Para dudas sobre el sitio o la red, puedes escribirnos por contacto; lo médico lo responde tu especialista.',
    },
  ];

  return (
    <section aria-label="Por qué usar OírConecta">
      <SectionRoot>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2 }}
            >
              Confianza
            </Typography>
            <Typography component="h2" variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              Por qué usar OírConecta
            </Typography>
            <Typography
              component="p"
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 640,
                mx: 'auto',
                lineHeight: 1.65,
                fontSize: '1.0625rem',
              }}
            >
              Menos vueltas, más claridad: tú eliges con quién hablar; nosotros ponemos la información ordenada y el acceso a la red.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <BenefitCard>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <IconBox>{benefit.icon}</IconBox>
                    <Typography component="h3" variant="h6" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                      {benefit.title}
                    </Typography>
                    <Typography component="p" variant="body1" sx={{ lineHeight: 1.65, color: 'text.secondary' }}>
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </BenefitCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </SectionRoot>
    </section>
  );
};

export default ServicesSection;
