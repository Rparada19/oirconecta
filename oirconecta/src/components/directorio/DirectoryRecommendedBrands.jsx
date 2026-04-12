import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Rating,
} from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { getWhatsAppHrefWithText } from '../../config/publicSite';
import { getDirectoryShowcaseBrands, DIRECTORY_FEATURED_BRANDS_PERIOD } from '../../data/directoryFeaturedBrands';

function wordmarkColor(slug) {
  const map = {
    phonak: '#085946',
    oticon: '#0a4d6e',
    widex: '#1a3652',
    signia: '#2d3748',
    resound: '#c53030',
    starkey: '#2b6cb0',
    unitron: '#276749',
    beltone: '#744210',
  };
  return map[slug] || '#12221a';
}

export default function DirectoryRecommendedBrands() {
  const brands = getDirectoryShowcaseBrands();

  return (
    <Box
      component="section"
      aria-labelledby="directorio-marcas-titulo"
      sx={{
        my: { xs: 5, md: 7 },
        py: { xs: 4, md: 5 },
        px: { xs: 0, sm: 0 },
        borderTop: '1px solid rgba(8, 89, 70, 0.1)',
        borderBottom: '1px solid rgba(8, 89, 70, 0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(244,247,246,0.98) 48%, rgba(232,241,236,0.55) 100%)',
      }}
    >
      <Stack spacing={1.25} sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center', maxWidth: 720, mx: 'auto', px: { xs: 1, sm: 0 } }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: '0.16em', color: 'primary.main', fontWeight: 800, fontSize: { xs: '0.68rem', md: '0.72rem' } }}
        >
          Selección {DIRECTORY_FEATURED_BRANDS_PERIOD}
        </Typography>
        <Typography
          id="directorio-marcas-titulo"
          component="h2"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#0f1f18',
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            lineHeight: 1.12,
          }}
        >
          Marcas recomendadas del mes
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.65, fontSize: { xs: '0.95rem', md: '1.0625rem' }, fontWeight: 500 }}
        >
          Seleccionadas por su calidad, tecnología y experiencia con pacientes.
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 2.5, md: 3.5 }} justifyContent="center">
        {brands.map((b) => {
          const wa = getWhatsAppHrefWithText(`Hola, quiero más información sobre la marca ${b.name}`);
          return (
            <Grid item xs={12} md={4} key={b.slug} sx={{ maxWidth: { md: 380 }, mx: { md: 'auto' } }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid rgba(8, 89, 70, 0.14)',
                  boxShadow: '0 20px 56px rgba(8, 41, 34, 0.1), 0 2px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 28px 72px rgba(8, 89, 70, 0.14), 0 8px 24px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.75, md: 3.25 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Chip
                      label={b.badge}
                      size="small"
                      sx={{
                        height: 24,
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        letterSpacing: '0.06em',
                        bgcolor: 'rgba(8, 89, 70, 0.09)',
                        color: 'primary.dark',
                        border: '1px solid rgba(8, 89, 70, 0.15)',
                      }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      minHeight: { xs: 72, md: 80 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      px: 1,
                    }}
                  >
                    {b.logoUrl ? (
                      <Box
                        component="img"
                        src={b.logoUrl}
                        alt=""
                        sx={{ maxHeight: 48, maxWidth: '85%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography
                        component="span"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.75rem', md: '2rem' },
                      letterSpacing: '-0.04em',
                      color: wordmarkColor(b.slug),
                      lineHeight: 1,
                    }}
                      >
                        {b.name}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Rating value={b.rating} precision={0.05} readOnly size="small" sx={{ color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                      Mejor calificado
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.55,
                      mb: 2.5,
                      minHeight: 24,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: { md: '0.9375rem' },
                    }}
                  >
                    {b.tagline}
                  </Typography>

                  <Box sx={{ flexGrow: 1 }} />

                  <Button
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<WhatsApp />}
                    sx={{
                      py: 1.35,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 8px 24px rgba(8, 89, 70, 0.28)',
                      '&:hover': { boxShadow: '0 12px 32px rgba(8, 89, 70, 0.35)' },
                    }}
                  >
                    Hablar por WhatsApp
                  </Button>
                  <Typography
                    variant="caption"
                    display="block"
                    textAlign="center"
                    color="text.secondary"
                    sx={{ mt: 1.25, lineHeight: 1.45, px: 0.5 }}
                  >
                    Conecta con el distribuidor autorizado
                  </Typography>

                  <Button
                    component={RouterLink}
                    to={b.path}
                    variant="text"
                    fullWidth
                    sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, color: 'primary.dark' }}
                  >
                    Ver guía de la marca
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Stack alignItems="center" spacing={1} sx={{ mt: 3 }}>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ letterSpacing: '0.04em', fontWeight: 600, textAlign: 'center' }}
        >
          Recomendación editorial · Sin costo adicional para el usuario
        </Typography>
        <Button
          component={RouterLink}
          to="/audifonos"
          variant="text"
          size="small"
          sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
        >
          Explorar el catálogo completo de audífonos
        </Button>
      </Stack>
    </Box>
  );
}
