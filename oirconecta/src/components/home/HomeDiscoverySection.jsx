import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardActionArea, CardContent, Stack, Chip } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import GraphicEqOutlinedIcon from '@mui/icons-material/GraphicEqOutlined';
import CoPresentOutlinedIcon from '@mui/icons-material/CoPresentOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

const tiles = [
  {
    kicker: 'Audífonos',
    title: 'Descubrir marcas y estilos',
    text: 'Orientación para comparar con calma, sin sensación de catálogo frío.',
    to: '/audifonos',
    icon: GraphicEqOutlinedIcon,
    accent: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
  },
  {
    kicker: 'Implantes',
    title: 'Explorar opciones cocleares',
    text: 'Rutas y fabricantes, explicados como primer paso —no como venta cerrada.',
    to: '/implantes',
    icon: CoPresentOutlinedIcon,
    accent: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
  },
  {
    kicker: 'Referencia y tienda',
    title: 'Precios orientativos y accesorios',
    text: 'Transparencia para conversar mejor con tu especialista; lo clínico sigue siendo personal.',
    to: '/ecommerce',
    icon: StorefrontOutlinedIcon,
    accent: 'linear-gradient(135deg, #71A095 0%, #1e2438 100%)',
  },
];

export default function HomeDiscoverySection() {
  return (
    <Box component="section" aria-labelledby="heading-explorar" sx={{ py: { xs: 7, md: 9 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip label="Exploración guiada" size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(8, 89, 70, 0.1)', color: 'primary.main' }} />
        </Stack>
        <Typography id="heading-explorar" component="h2" variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
          Explorar con intención
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 4, md: 5 }, maxWidth: 680, lineHeight: 1.65, fontSize: '1.0625rem' }}>
          Aquí no “compras en un clic”. Te acercamos a marcas, dispositivos y contexto para que llegues a tu cita sabiendo qué preguntar.
        </Typography>

        <Grid container spacing={3}>
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Grid item xs={12} md={4} key={t.to}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'rgba(39, 47, 80, 0.08)',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    '&:hover': { boxShadow: '0 14px 44px rgba(30, 36, 56, 0.1)', transform: 'translateY(-2px)' },
                  }}
                >
                  <CardActionArea component={RouterLink} to={t.to} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <Box sx={{ height: 6, background: t.accent }} aria-hidden />
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'rgba(8, 89, 70, 0.08)',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          aria-hidden
                        >
                          <Icon />
                        </Box>
                        <ArrowOutwardRoundedIcon sx={{ color: 'text.secondary', opacity: 0.7 }} aria-hidden />
                      </Stack>
                      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.1em' }}>
                        {t.kicker}
                      </Typography>
                      <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mt: 0.5, mb: 1.5 }}>
                        {t.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                        {t.text}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
