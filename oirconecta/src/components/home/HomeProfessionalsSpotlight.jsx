import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Avatar, Stack } from '@mui/material';

const pros = [
  {
    role: 'Audiología',
    headline: 'Valoración, adaptación y seguimiento',
    text: 'Encuentra audiólogos que te explican con paciencia y ajustan a tu vida real.',
    to: '/profesionales/audiologos',
    cta: 'Ver audiólogos',
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
  },
  {
    role: 'Medicina del oído',
    headline: 'Cuando hace falta mirar más a fondo',
    text: 'Otólogos y ORL de la red para casos que requieren criterio médico especializado.',
    to: '/profesionales/otologos',
    cta: 'Ver otólogos y ORL',
    img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop',
  },
];

export default function HomeProfessionalsSpotlight() {
  return (
    <Box component="section" aria-labelledby="heading-profesionales" sx={{ py: { xs: 7, md: 9 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.14em', mb: 2 }}>
          Personas, no listas
        </Typography>
        <Typography id="heading-profesionales" component="h2" variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
          Profesionales que te escuchan de verdad
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 4, md: 5 }, maxWidth: 640, lineHeight: 1.65 }}>
          Perfiles claros para que elijas con quién conversar primero —sin presión, sin letra pequeña en el primer “hola”.
        </Typography>

        <Grid container spacing={3}>
          {pros.map((p) => (
            <Grid item xs={12} md={6} key={p.to}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(39, 47, 80, 0.08)',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: { xs: '100%', sm: 200 },
                    minHeight: { xs: 200, sm: 'auto' },
                    flexShrink: 0,
                    backgroundImage: `url(${p.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(8, 89, 70, 0.12)', color: 'primary.main', width: 40, height: 40, fontSize: '0.875rem' }}>
                      {p.role.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.06em' }}>
                      {p.role}
                    </Typography>
                  </Stack>
                  <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {p.headline}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 2, flexGrow: 1 }}>
                    {p.text}
                  </Typography>
                  <Button component={RouterLink} to={p.to} variant="contained" color="primary" sx={{ alignSelf: 'flex-start', fontWeight: 700 }}>
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
