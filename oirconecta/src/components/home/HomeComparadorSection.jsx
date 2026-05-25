import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const BULLETS = [
  'Compara hasta 3 marcas, tecnologías y plataformas',
  'Fortalezas, debilidades y precios reales en Colombia',
  'Recomendación según tu pérdida y presupuesto',
];

export default function HomeComparadorSection() {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: { xs: 6, md: 9 }, px: 2 }}>
      <Container maxWidth="lg">
        <Box sx={{
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 55%, #6ee7c8 140%)',
          color: '#fff',
          p: { xs: 4, md: 6 },
          boxShadow: '0 20px 60px rgba(8,89,70,0.25)',
        }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, background: 'rgba(255,255,255,0.15)', px: 1.5, py: 0.5, borderRadius: '999px', mb: 2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>NUEVO · CON INTELIGENCIA ARTIFICIAL</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.15, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                ¿No sabes qué audífono elegir?
              </Typography>
              <Typography sx={{ opacity: 0.92, mb: 3, fontSize: '1.05rem', maxWidth: 560 }}>
                Nuestro comparador con IA te orienta: dinos tu pérdida y presupuesto, y te decimos cuál te conviene — con precios reales.
              </Typography>
              <Box component="ul" sx={{ m: 0, mb: 3, pl: 0, listStyle: 'none' }}>
                {BULLETS.map((b) => (
                  <Box component="li" key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#6ee7c8' }} />
                    <Typography sx={{ opacity: 0.95 }}>{b}</Typography>
                  </Box>
                ))}
              </Box>
              <Button variant="contained" size="large" startIcon={<CompareArrowsIcon />} onClick={() => navigate('/comparador')}
                sx={{ background: '#fff', color: '#085946', fontWeight: 800, borderRadius: '999px', px: 4, py: 1.3, '&:hover': { background: '#f0fdf4' } }}>
                Probar el comparador
              </Button>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
              <CompareArrowsIcon sx={{ fontSize: 180, opacity: 0.25 }} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
