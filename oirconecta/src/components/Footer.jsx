import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Button,
} from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube, Email, Phone, LocationOn, Send } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { directoryProfesionToSlug } from '../utils/directoryPresentation';

const FooterContainer = styled(Box)(() => ({
  background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
  color: 'white',
  padding: '64px 0 32px',
  marginTop: 'auto',
}));

const FooterSection = styled(Box)(() => ({
  '& h6': {
    color: '#A1AFB5',
    fontWeight: 600,
    marginBottom: '16px',
    fontSize: '1.1rem',
  },
}));

const NewsletterBox = styled(Box)(() => ({
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
}));

const footerSections = [
  {
    title: 'OírConecta',
    links: [
      { name: 'Inicio', to: '/' },
      { name: 'Nosotros', to: '/nosotros' },
      { name: 'Servicios', to: '/servicios' },
      { name: 'Contacto', to: '/contacto' },
      { name: 'Agendar cita', to: '/agendar' },
    ],
  },
  {
    title: 'Servicios y productos',
    links: [{ name: 'Tienda', to: '/ecommerce' }],
  },
  {
    title: 'Profesionales',
    links: [
      { name: 'Fonoaudiología', to: `/directorio/profesion/${directoryProfesionToSlug('Fonoaudiología')}` },
      { name: 'Audiología', to: `/directorio/profesion/${directoryProfesionToSlug('Audiología')}` },
      { name: 'Otorrinolaringología', to: `/directorio/profesion/${directoryProfesionToSlug('Otorrinolaringología')}` },
      { name: 'Otología', to: `/directorio/profesion/${directoryProfesionToSlug('Otología')}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Términos y condiciones', to: '/legal#terminos' },
      { name: 'Política de privacidad', to: '/legal#privacidad' },
      { name: 'Política de cookies', to: '/legal#cookies' },
    ],
  },
];

const Footer = () => {
  const handleNewsletterClick = () => {
    const subject = encodeURIComponent('Suscripción boletín OírConecta');
    const body = encodeURIComponent('Hola,\n\nDeseo suscribirme al boletín. Mi correo es:\n\n');
    window.location.href = `mailto:info@oirconecta.com?subject=${subject}&body=${body}`;
  };

  return (
    <footer role="contentinfo">
      <FooterContainer>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <img src="/logo-oirconecta-blanco.png" alt="OírConecta" style={{ height: 48, marginRight: 16 }} />
              </Box>
              <Typography component="p" variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, fontSize: '1rem' }}>
                Referencia de valores de audífonos y accesorios, educación, ayuda para ubicar al profesional adecuado y
                acompañamiento en decisiones. Oferta de servicios de la red e información sobre marcas del mercado.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  component={RouterLink}
                  to="/contacto"
                  aria-label="Contacto (redes próximamente)"
                  sx={{
                    color: '#86899C',
                    '&:hover': { color: '#A1AFB5', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Facebook />
                </IconButton>
                <IconButton component={RouterLink} to="/contacto" aria-label="Contacto" sx={{ color: '#86899C', '&:hover': { color: '#A1AFB5', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <Twitter />
                </IconButton>
                <IconButton component={RouterLink} to="/contacto" aria-label="Contacto" sx={{ color: '#86899C', '&:hover': { color: '#A1AFB5', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <Instagram />
                </IconButton>
                <IconButton component={RouterLink} to="/contacto" aria-label="Contacto" sx={{ color: '#86899C', '&:hover': { color: '#A1AFB5', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <LinkedIn />
                </IconButton>
                <IconButton component={RouterLink} to="/contacto" aria-label="Contacto" sx={{ color: '#86899C', '&:hover': { color: '#A1AFB5', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <YouTube />
                </IconButton>
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#86899C' }}>
                Redes sociales: enlazamos a contacto hasta publicar perfiles oficiales.
              </Typography>
            </Grid>

            {footerSections.map((section, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <FooterSection>
                  <Typography component="h3" variant="h6">
                    {section.title}
                  </Typography>
                  <Stack spacing={1}>
                    {section.links.map((link) => (
                      <Link
                        key={link.to + link.name}
                        component={RouterLink}
                        to={link.to}
                        variant="body2"
                        sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '1rem', py: 0.25, '&:hover': { color: '#fff' } }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </Stack>
                </FooterSection>
              </Grid>
            ))}

            <Grid item xs={12} md={4}>
              <NewsletterBox sx={{ mb: 3 }}>
                <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                  Boletín
                </Typography>
                <Typography component="p" variant="body2" sx={{ mb: 2, color: '#86899C' }}>
                  Escríbenos para enterarte de novedades y campañas (sin backend aún: se abre tu correo).
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Tu email"
                    disabled
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleNewsletterClick}
                    sx={{ bgcolor: '#085946', '&:hover': { bgcolor: '#272F50' } }}
                    startIcon={<Send />}
                  >
                    Enviar
                  </Button>
                </Stack>
              </NewsletterBox>

              <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                Contacto
              </Typography>
              <Stack spacing={2}>
                <Link href="tel:+5712345678" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#86899C', textDecoration: 'none', '&:hover': { color: '#A1AFB5' } }}>
                  <Phone />
                  <Typography component="span" variant="body2">
                    +57 (1) 234-5678
                  </Typography>
                </Link>
                <Link href="mailto:info@oirconecta.com" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#86899C', textDecoration: 'none', '&:hover': { color: '#A1AFB5' } }}>
                  <Email />
                  <Typography component="span" variant="body2">
                    info@oirconecta.com
                  </Typography>
                </Link>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#86899C' }}>
                  <LocationOn />
                  <Typography component="span" variant="body2">
                    Bogotá, Colombia
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.2)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography component="p" variant="body2" sx={{ color: '#86899C' }}>
              © {new Date().getFullYear()} OírConecta. Todos los derechos reservados.
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Link component={RouterLink} to="/legal#terminos" variant="body2" sx={{ color: '#86899C' }}>
                Términos
              </Link>
              <Link component={RouterLink} to="/legal#privacidad" variant="body2" sx={{ color: '#86899C' }}>
                Privacidad
              </Link>
              <Link component={RouterLink} to="/legal#cookies" variant="body2" sx={{ color: '#86899C' }}>
                Cookies
              </Link>
            </Stack>
          </Box>
        </Container>
      </FooterContainer>
    </footer>
  );
};

export default Footer;
