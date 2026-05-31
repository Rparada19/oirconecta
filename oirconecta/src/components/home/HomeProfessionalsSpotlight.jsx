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
    <Box component="section" aria-labelledby="heading-profesionales" sx={{ py: { xs: 5, md: 7 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.14em', mb: 2 }}>
          Personas, no listas
        </Typography>
        <Typography id="heading-profesionales" component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '2rem', md: '2.875rem' },
          fontWeight: 600,
          color: '#272F50',
          letterSpacing: '-0.018em',
          lineHeight: 1.1,
          mb: 2,
        }}>
          Profesionales que te{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: '#085946', fontWeight: 500 }}>
            escuchan de verdad
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 4, md: 5 }, maxWidth: 640, lineHeight: 1.65 }}>
          Perfiles claros para que elijas con quién conversar primero —sin presión, sin letra pequeña en el primer “hola”.
        </Typography>

        <Grid container spacing={4}>
          {pros.map((p) => (
            <Grid item xs={12} md={6} key={p.to}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(39, 47, 80, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(8,89,70,0.10)', '& .pro-img': { transform: 'scale(1.04)' } },
                }}
              >
                <Box sx={{ position: 'relative', height: { xs: 240, md: 280 }, overflow: 'hidden' }}>
                  <Box
                    className="pro-img"
                    aria-hidden
                    sx={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${p.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ position: 'absolute', bottom: 20, left: 20 }}>
                    <Avatar sx={{ bgcolor: '#fff', color: '#085946', width: 44, height: 44, fontSize: '1rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      {p.role.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      {p.role}
                    </Typography>
                  </Stack>
                </Box>
                <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Typography component="h3" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, mb: 1.5, color: '#0f1923', letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                    {p.headline}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.9375rem', md: '1rem' }, color: '#4a5568', lineHeight: 1.65, mb: 3, flexGrow: 1 }}>
                    {p.text}
                  </Typography>
                  <Button component={RouterLink} to={p.to} variant="contained" color="primary" sx={{ alignSelf: 'flex-start', fontWeight: 700, fontSize: '0.9375rem', px: 3, py: 1.25 }}>
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
