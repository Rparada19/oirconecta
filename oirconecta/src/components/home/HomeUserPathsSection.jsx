import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Stack,
} from '@mui/material';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import HearingOutlinedIcon from '@mui/icons-material/HearingOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const paths = [
  {
    title: 'Encontrar especialista',
    blurb: 'Busca por ciudad o especialidad. Tú eliges a quién contactar.',
    icon: PersonSearchOutlinedIcon,
    mode: 'scroll',
    target: 'busqueda-profesionales',
  },
  {
    title: 'Explorar audífonos',
    blurb: 'Marcas y tecnologías, explicadas sin prisa.',
    icon: HearingOutlinedIcon,
    mode: 'route',
    to: '/audifonos',
  },
  {
    title: 'Conocer la red',
    blurb: 'Nuestra misión y cómo participan los profesionales —sin competir con quien tú elijas.',
    icon: Groups2OutlinedIcon,
    mode: 'route',
    to: '/nosotros',
  },
  {
    title: 'Aprender sobre audición',
    blurb: 'Señales comunes y qué esperar en una primera visita.',
    icon: SchoolOutlinedIcon,
    mode: 'scroll',
    target: 'aprender-audicion',
  },
];

export default function HomeUserPathsSection() {
  const navigate = useNavigate();

  const handlePath = (p) => {
    if (p.mode === 'scroll') scrollToId(p.target);
    if (p.mode === 'route') navigate(p.to);
  };

  return (
    <Box
      id="que-buscas"
      component="section"
      aria-labelledby="heading-que-buscas"
      sx={{
        scrollMarginTop: 96,
        py: { xs: 7, md: 9 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1} sx={{ mb: { xs: 4, md: 5 }, maxWidth: 720 }}>
          <Typography
            id="heading-que-buscas"
            component="h2"
            variant="h3"
            sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary', lineHeight: 1.15 }}
          >
            ¿Qué estás buscando?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.0625rem', lineHeight: 1.65 }}>
            Elige un camino. Aquí no hay un solo “producto”: hay personas, información y opciones claras.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {paths.map((p) => {
            const Icon = p.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={p.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'rgba(39, 47, 80, 0.08)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      borderColor: 'rgba(8, 89, 70, 0.22)',
                      boxShadow: '0 12px 40px rgba(30, 36, 56, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea onClick={() => handlePath(p)} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          bgcolor: 'rgba(8, 89, 70, 0.08)',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                        aria-hidden
                      >
                        <Icon sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flexGrow: 1, mb: 2 }}>
                        {p.blurb}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'primary.main', fontWeight: 600 }}>
                        <Typography variant="body2" component="span">
                          Continuar
                        </Typography>
                        <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} aria-hidden />
                      </Stack>
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
