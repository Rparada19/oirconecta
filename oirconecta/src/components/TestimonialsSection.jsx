import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Button,
  Stack,
  Chip
} from '@mui/material';
import {
  FormatQuote,
  Star,
  ArrowBack,
  ArrowForward,
  VerifiedUser
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SectionContainer = styled(Box)(() => ({
  padding: '64px 0',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f3 100%)'
}));

const TestimonialCard = styled(Card)(() => ({
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  background: 'white',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.15)'
  }
}));

const QuoteIcon = styled(FormatQuote)(() => ({
  fontSize: '3rem',
  color: '#085946',
  opacity: 0.3,
  position: 'absolute',
  top: '16px',
  right: '16px'
}));

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'María Elena Rodríguez',
      age: 65,
      location: 'Bogotá',
      rating: 5,
      service: 'Audífonos',
      testimonial: 'Después de años de dificultades para escuchar, OírConecta me cambió la vida. Los audífonos que me adaptaron son increíbles, puedo escuchar claramente en todas las situaciones. El Dr. González fue muy profesional y paciente.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 2 meses'
    },
    {
      id: 2,
      name: 'Carlos Andrés López',
      age: 42,
      location: 'Medellín',
      rating: 5,
      service: 'Implante Coclear',
      testimonial: 'El proceso del implante coclear fue mucho más fácil de lo que esperaba. Todo el equipo médico fue excelente, desde la evaluación inicial hasta la rehabilitación. Ahora puedo escuchar sonidos que había olvidado.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 6 meses'
    },
    {
      id: 3,
      name: 'Ana Sofía Martínez',
      age: 28,
      location: 'Cali',
      rating: 5,
      service: 'Evaluación Auditiva',
      testimonial: 'Excelente atención y profesionalismo. La evaluación fue muy completa y me explicaron todo detalladamente. Recomiendo totalmente OírConecta para cualquier problema auditivo.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 1 mes'
    },
    {
      id: 4,
      name: 'Roberto Jiménez',
      age: 55,
      location: 'Barranquilla',
      rating: 5,
      service: 'Audífonos',
      testimonial: 'Increíble experiencia. Los audífonos son de alta tecnología y el servicio post-venta es excepcional. Me siento mucho más seguro y confiado en mi día a día.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 3 meses'
    },
    {
      id: 5,
      name: 'Laura Patricia Gómez',
      age: 38,
      location: 'Bucaramanga',
      rating: 5,
      service: 'Terapia del Habla',
      testimonial: 'La terapia del habla con la Dra. Martínez fue fundamental para mi recuperación después del implante. Es una profesional muy dedicada y los resultados fueron excelentes.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 4 meses'
    },
    {
      id: 6,
      name: 'Jorge Luis Herrera',
      age: 70,
      location: 'Pereira',
      rating: 5,
      service: 'Mantenimiento',
      testimonial: 'El servicio de mantenimiento es muy profesional. Me ayudan a mantener mis audífonos en perfecto estado y siempre están disponibles para cualquier consulta.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      verified: true,
      date: 'Hace 1 semana'
    }
  ];

  // Estadísticas removidas

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 3) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 3 + testimonials.length) % testimonials.length);
  };

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + 3);

  return (
    <section aria-label="Testimonios de pacientes">
      <SectionContainer>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              component="h2"
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#085946',
                mb: 2
              }}
            >
              Lo que dicen nuestros pacientes
            </Typography>
            <Typography 
              component="p"
              variant="h6" 
              sx={{ 
                color: '#86899C',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Historias reales de personas que han mejorado su calidad de vida con nosotros
            </Typography>
          </Box>

          {/* Estadísticas removidas */}

          {/* Testimonios */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {visibleTestimonials.map((testimonial) => (
              <Grid item xs={12} md={4} key={testimonial.id}>
                <TestimonialCard>
                  <CardContent sx={{ p: 4, position: 'relative' }}>
                    <QuoteIcon />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        src={testimonial.image}
                        alt={`${testimonial.name} - ${testimonial.service}`}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                      <Box>
                        <Typography 
                          component="h3"
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#272F50'
                          }}
                        >
                          {testimonial.name}
                        </Typography>
                        <Typography 
                          component="p"
                          variant="body2" 
                          sx={{ color: '#86899C' }}
                        >
                          {testimonial.age} años • {testimonial.location}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={testimonial.service}
                            size="small"
                            sx={{
                              bgcolor: '#f0f4f3',
                              color: '#085946',
                              fontSize: '0.75rem'
                            }}
                          />
                          {testimonial.verified && (
                            <VerifiedUser sx={{ color: '#085946', fontSize: 16 }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    <Rating 
                      value={testimonial.rating} 
                      readOnly 
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography 
                      component="blockquote"
                      variant="body1" 
                      sx={{ 
                        mb: 3, 
                        lineHeight: 1.6, 
                        fontStyle: 'italic',
                        color: '#272F50'
                      }}
                    >
                      "{testimonial.testimonial}"
                    </Typography>
                    
                    <Typography 
                      component="time"
                      variant="caption" 
                      sx={{ color: '#86899C' }}
                    >
                      {testimonial.date}
                    </Typography>
                  </CardContent>
                </TestimonialCard>
              </Grid>
            ))}
          </Grid>

          {/* Navegación */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Testimonios anteriores"
              sx={{
                borderColor: '#085946',
                color: '#085946',
                '&:hover': {
                  borderColor: '#272F50',
                  bgcolor: 'rgba(8, 89, 70, 0.04)'
                }
              }}
            >
              <ArrowBack />
            </Button>
            <Button
              variant="outlined"
              onClick={handleNext}
              disabled={currentIndex + 3 >= testimonials.length}
              aria-label="Siguientes testimonios"
              sx={{
                borderColor: '#085946',
                color: '#085946',
                '&:hover': {
                  borderColor: '#272F50',
                  bgcolor: 'rgba(8, 89, 70, 0.04)'
                }
              }}
            >
              <ArrowForward />
            </Button>
          </Box>
        </Container>
      </SectionContainer>
    </section>
  );
};

export default TestimonialsSection; 