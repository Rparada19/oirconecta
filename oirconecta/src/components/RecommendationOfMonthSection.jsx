import React from 'react';
import { Box, Container, Typography, Button, Grid, Chip } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { RECOMMENDATION_OF_MONTH } from '../config/homeContent';

export default function RecommendationOfMonthSection() {
  const r = RECOMMENDATION_OF_MONTH;

  return (
    <Box component="section" aria-label="Recomendación del mes" sx={{ py: { xs: 5, md: 7 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ecfdf5 100%)',
          border: '1px solid rgba(8,89,70,0.10)',
          boxShadow: '0 8px 32px rgba(8,89,70,0.08)',
        }}>
          {/* Decorative blob */}
          <Box sx={{
            position: 'absolute', top: -80, right: -80,
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,106,0.25) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          <Grid container>
            {/* Lado izquierdo: contenido */}
            <Grid item xs={12} md={7}>
              <Box sx={{ p: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 3 }}>
                  <Chip
                    label={r.label}
                    size="small"
                    sx={{
                      bgcolor: '#085946', color: '#fff',
                      fontWeight: 800, fontSize: '0.6875rem',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      px: 0.5, height: 26,
                    }}
                  />
                </Box>

                <Typography component="h2" sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  fontWeight: 600,
                  color: '#272F50',
                  lineHeight: 1.1,
                  letterSpacing: '-0.018em',
                  mb: 2.5,
                }}>
                  {r.product}
                </Typography>

                <Typography sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  color: '#374151',
                  lineHeight: 1.65,
                  mb: 3,
                }}>
                  {r.brandLine}
                </Typography>

                <Box sx={{
                  p: 2.5,
                  borderRadius: '8px',
                  bgcolor: 'rgba(8,89,70,0.06)',
                  border: '1px solid rgba(8,89,70,0.10)',
                  mb: 3,
                }}>
                  <Typography sx={{ fontSize: { xs: '0.9375rem', md: '1rem' }, color: '#0f1923', lineHeight: 1.65 }}>
                    <Box component="strong" sx={{ color: '#085946', fontWeight: 800 }}>Ideal si…</Box> {r.forWho}
                  </Typography>
                </Box>

                <Typography sx={{
                  fontSize: '0.8125rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  mb: 3.5,
                  lineHeight: 1.5,
                }}>
                  {r.disclaimer}
                </Typography>

                <Button
                  component={RouterLink}
                  to={r.ctaTo}
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    px: 3.5, py: 1.5,
                    bgcolor: '#085946',
                    '&:hover': { bgcolor: '#064a3a' },
                  }}
                >
                  {r.ctaLabel}
                </Button>
              </Box>
            </Grid>

            {/* Lado derecho: visual con icono grande y stats */}
            <Grid item xs={12} md={5} sx={{
              background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 50%, #1a2240 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 280, md: 'auto' },
              p: { xs: 4, md: 5 },
            }}>
              {/* Patrón decorativo */}
              <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z' fill='%236ee7c8' opacity='0.15'/%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px',
                opacity: 0.4,
              }} />
              <Box sx={{
                width: 96, height: 96, borderRadius: '8px',
                bgcolor: 'rgba(201,168,106,0.15)',
                border: '2px solid rgba(201,168,106,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 3,
                position: 'relative', zIndex: 1,
                backdropFilter: 'blur(10px)',
              }}>
                <LightbulbOutlinedIcon sx={{ fontSize: 52, color: '#C9A86A' }} />
              </Box>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C9A86A',
                mb: 1.5,
                textAlign: 'center',
                position: 'relative', zIndex: 1,
              }}>
                Por qué este mes
              </Typography>
              <Typography sx={{
                fontSize: { xs: '1.125rem', md: '1.25rem' },
                fontWeight: 700,
                color: '#fff',
                textAlign: 'center',
                lineHeight: 1.35,
                position: 'relative', zIndex: 1,
                maxWidth: 280,
              }}>
                Decisiones más fáciles cuando la tecnología trabaja por ti.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
