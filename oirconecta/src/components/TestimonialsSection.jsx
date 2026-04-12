import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating, Chip } from '@mui/material';
import { FormatQuote, VerifiedUser } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 0),
  background: 'linear-gradient(180deg, #eef3f1 0%, #f4f7f6 100%)',
}));

const TestimonialCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.background.paper,
  border: '1px solid rgba(39, 47, 80, 0.08)',
  boxShadow: 'none',
  borderRadius: theme.shape.borderRadius * 1.25,
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    boxShadow: '0 10px 32px rgba(30, 36, 56, 0.08)',
    borderColor: 'rgba(8, 89, 70, 0.12)',
  },
}));

const QuoteIcon = styled(FormatQuote)(() => ({
  fontSize: '2.25rem',
  color: '#085946',
  opacity: 0.18,
  position: 'absolute',
  top: 18,
  right: 18,
}));

/** Tres historias con foco emocional; sustituir por casos reales autorizados cuando existan. */
const STORIES = [
  {
    id: 1,
    name: 'Elena, 68',
    place: 'Bogotá',
    tag: 'Volvió a disfrutar las reuniones',
    rating: 5,
    text:
      'Me daba pena decir “¿me lo repites?”. Hoy vuelvo a reírme con mis nietos en la mesa. No fue magia: fue encontrar a alguien que me explicó con paciencia y me acompañó en cada ajuste.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 2,
    name: 'Andrés, 45',
    place: 'Medellín',
    tag: 'Dejó de evitar el teléfono',
    rating: 5,
    text:
      'Trabajo con clientes todo el día. Estaba agotado de adivinar palabras por llamada. Pedir ayuda me quitó un peso: entendí qué pasaba y qué podía hacer, sin sentirme “viejo”.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 3,
    name: 'Lucía, 52',
    place: 'Cali',
    tag: 'Recuperó confianza',
    rating: 5,
    text:
      'Tenía miedo de que me dijeran que “era normal”. Me escucharon de verdad. Hoy entiendo mi oído y me siento dueña de mis decisiones, con calma.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
];

export default function TestimonialsSection() {
  return (
    <section aria-label="Historias de personas como tú">
      <SectionContainer>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="Historias con corazón"
              sx={{
                mb: 2,
                bgcolor: 'rgba(8, 89, 70, 0.08)',
                color: 'primary.main',
                fontWeight: 600,
                border: '1px solid rgba(8, 89, 70, 0.15)',
              }}
            />
            <Typography component="h2" variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, lineHeight: 1.15 }}>
              “Por fin me entendieron”
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
                mb: 1,
              }}
            >
              Relatos de ejemplo que muestran el tono que queremos para Oír Conecta: cercanía, alivio y decisiones con calma.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.65 }}>
              Cuando tengas casos reales autorizados, reemplazan estos textos y la confianza sube otro nivel.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {STORIES.map((t) => (
              <Grid item xs={12} md={4} key={t.id}>
                <TestimonialCard>
                  <CardContent sx={{ p: { xs: 3, sm: 3.5 }, position: 'relative', minHeight: 280 }}>
                    <QuoteIcon />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={t.image} alt="" sx={{ width: 52, height: 52, mr: 1.5 }} />
                      <Box>
                        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.place}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={t.tag}
                      size="small"
                      sx={{ mb: 1.5, fontWeight: 600, bgcolor: 'rgba(8, 89, 70, 0.08)', color: 'primary.main' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <Rating value={t.rating} readOnly size="small" />
                      <VerifiedUser sx={{ fontSize: 18, color: 'primary.main', opacity: 0.6 }} aria-hidden />
                    </Box>

                    <Typography
                      component="blockquote"
                      variant="body1"
                      sx={{
                        lineHeight: 1.65,
                        color: 'text.primary',
                        fontSize: '1.0625rem',
                        m: 0,
                        fontStyle: 'normal',
                      }}
                    >
                      “{t.text}”
                    </Typography>
                  </CardContent>
                </TestimonialCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </SectionContainer>
    </section>
  );
}
