import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  Stack,
  TextField,
  Button
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  YouTube,
  Email,
  Phone,
  LocationOn,
  Send
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(() => ({
  background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
  color: 'white',
  padding: '64px 0 32px',
  marginTop: 'auto'
}));

const FooterSection = styled(Box)(() => ({
  '& h6': {
    color: '#A1AFB5',
    fontWeight: 600,
    marginBottom: '16px',
    fontSize: '1.1rem'
  },
  '& a': {
    color: '#86899C',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
    '&:hover': {
      color: '#A1AFB5'
    }
  }
}));

const NewsletterBox = styled(Box)(() => ({
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.1)'
}));

const Footer = () => {
  const footerSections = [
    {
      title: 'OírConecta',
      links: [
        { name: 'Acerca de nosotros', href: '/nosotros' },
        { name: 'Nuestra misión', href: '/mision' },
        { name: 'Equipo médico', href: '/equipo' },
        { name: 'Certificaciones', href: '/certificaciones' },
        { name: 'Trabaja con nosotros', href: '/trabaja-con-nosotros' }
      ]
    },
    {
      title: 'Servicios',
      links: [
        { name: 'Audífonos', href: '/audifonos' },
        { name: 'Implantes cocleares', href: '/implantes' },
        { name: 'Evaluación auditiva', href: '/evaluacion' },
        { name: 'Terapia del habla', href: '/terapia' },
        { name: 'Mantenimiento', href: '/mantenimiento' }
      ]
    },
    {
      title: 'Profesionales',
      links: [
        { name: 'Buscar especialistas', href: '/profesionales' },
        { name: 'Centros médicos', href: '/centros-destacados' },
        { name: 'Especialidades', href: '/especialidades' },
        { name: 'Reseñas y calificaciones', href: '/reseñas' },
        { name: 'Agendar cita', href: '/citas' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Blog de salud auditiva', href: '/blog' },
        { name: 'Guías de cuidado', href: '/guias' },
        { name: 'Preguntas frecuentes', href: '/faq' },
        { name: 'Glosario médico', href: '/glosario' },
        { name: 'Descargar app', href: '/app' }
      ]
    }
  ];

  const socialLinks = [
    { icon: <Facebook />, href: '#', label: 'Facebook' },
    { icon: <Twitter />, href: '#', label: 'Twitter' },
    { icon: <Instagram />, href: '#', label: 'Instagram' },
    { icon: <LinkedIn />, href: '#', label: 'LinkedIn' },
    { icon: <YouTube />, href: '#', label: 'YouTube' }
  ];

  const contactInfo = [
    { icon: <Phone />, text: '+57 (1) 234-5678', href: 'tel:+5712345678' },
    { icon: <Email />, text: 'info@oirconecta.com', href: 'mailto:info@oirconecta.com' },
    { icon: <LocationOn />, text: 'Bogotá, Colombia', href: '#' }
  ];

  return (
    <footer role="contentinfo">
      <FooterContainer>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Logo y descripción */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <img 
                  src="/logo-oirconecta-blanco.png"
                  alt="OírConecta Logo Blanco"
                  style={{ height: 48, marginRight: 16 }}
                />
              </Box>
              <Typography 
                component="p"
                variant="body2" 
                sx={{ 
                  mb: 3, 
                  color: '#86899C', 
                  lineHeight: 1.6 
                }}
              >
                Somos la plataforma líder en Colombia para conectar pacientes con los mejores 
                especialistas del oído. Nuestra misión es mejorar la calidad de vida de las 
                personas con problemas auditivos.
              </Typography>
              
              {/* Redes sociales */}
              <Stack direction="row" spacing={1}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    sx={{
                      color: '#86899C',
                      '&:hover': {
                        color: '#A1AFB5',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Stack>
            </Grid>

            {/* Enlaces de navegación */}
            {footerSections.map((section, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <FooterSection>
                  <Typography component="h3" variant="h6">{section.title}</Typography>
                  <Stack spacing={1}>
                    {section.links.map((link, linkIndex) => (
                      <Link
                        key={linkIndex}
                        href={link.href}
                        variant="body2"
                        sx={{ display: 'block' }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </Stack>
                </FooterSection>
              </Grid>
            ))}

            {/* Newsletter y contacto */}
            <Grid item xs={12} md={4}>
              <NewsletterBox sx={{ mb: 3 }}>
                <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                  Suscríbete a nuestro boletín
                </Typography>
                <Typography 
                  component="p"
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    color: '#86899C' 
                  }}
                >
                  Recibe las últimas noticias sobre salud auditiva y ofertas especiales.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Tu email"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: '#A1AFB5'
                        }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: '#085946',
                      '&:hover': { bgcolor: '#272F50' }
                    }}
                  >
                    <Send />
                  </Button>
                </Stack>
              </NewsletterBox>

              {/* Información de contacto */}
              <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                Contacto
              </Typography>
              <Stack spacing={2}>
                {contactInfo.map((contact, index) => (
                  <Link
                    key={index}
                    href={contact.href}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#86899C',
                      textDecoration: 'none',
                      '&:hover': { color: '#A1AFB5' }
                    }}
                  >
                    {contact.icon}
                    <Typography component="span" variant="body2">{contact.text}</Typography>
                  </Link>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Footer inferior */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              component="p"
              variant="body2" 
              sx={{ color: '#86899C' }}
            >
              © 2024 OírConecta. Todos los derechos reservados.
            </Typography>
            
            <Stack direction="row" spacing={3}>
              <Link href="/terminos" variant="body2" sx={{ color: '#86899C' }}>
                Términos y condiciones
              </Link>
              <Link href="/privacidad" variant="body2" sx={{ color: '#86899C' }}>
                Política de privacidad
              </Link>
              <Link href="/cookies" variant="body2" sx={{ color: '#86899C' }}>
                Política de cookies
              </Link>
            </Stack>
          </Box>
        </Container>
      </FooterContainer>
    </footer>
  );
};

export default Footer; 