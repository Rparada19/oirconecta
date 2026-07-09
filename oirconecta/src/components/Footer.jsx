import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, Stack } from '@mui/material';
import { Facebook, Instagram, LinkedIn, YouTube, Email, Phone, LocationOn } from '@mui/icons-material';
import { directoryProfesionToSlug } from '../utils/directoryPresentation';
import { getPhoneHref, getWhatsAppDisplay } from '../config/publicSite';
import NewsletterSignup from './NewsletterSignup';
import BannerFooter from './marketing/BannerFooter';

const SECTIONS = [
  {
    title: 'OírConecta',
    links: [
      { name: 'Inicio',        to: '/' },
      { name: 'Nosotros',      to: '/nosotros' },
      { name: 'Servicios',     to: '/servicios' },
      { name: 'Contacto',      to: '/contacto' },
      { name: 'Agendar cita',  to: '/agendar' },
    ],
  },
  {
    title: 'Profesionales',
    links: [
      { name: 'Fonoaudiología',        to: `/directorio/profesion/${directoryProfesionToSlug('Fonoaudiología')}` },
      { name: 'Audiología',            to: `/directorio/profesion/${directoryProfesionToSlug('Audiología')}` },
      { name: 'Otorrinolaringología',  to: `/directorio/profesion/${directoryProfesionToSlug('Otorrinolaringología')}` },
      { name: 'Otología',              to: `/directorio/profesion/${directoryProfesionToSlug('Otología')}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Términos y condiciones', to: '/legal#terminos' },
      { name: 'Política de privacidad', to: '/legal#privacidad' },
      { name: 'Política de cookies',    to: '/legal#cookies' },
    ],
  },
];

const SOCIALS = [
  { icon: <Instagram sx={{ fontSize: 20 }} />, label: 'Instagram', href: 'https://instagram.com/oirconecta' },
  { icon: <Facebook sx={{ fontSize: 20 }} />,  label: 'Facebook',  href: 'https://facebook.com/oirconecta' },
  { icon: <LinkedIn sx={{ fontSize: 20 }} />,  label: 'LinkedIn',  href: 'https://linkedin.com/company/oirconecta' },
  { icon: <YouTube sx={{ fontSize: 20 }} />,   label: 'YouTube',   href: 'https://youtube.com/@oirconecta' },
];

const CONTACT = [
  { icon: <Phone sx={{ fontSize: 16 }} />,       text: getWhatsAppDisplay(),                     href: getPhoneHref() },
  { icon: <Email sx={{ fontSize: 16 }} />,       text: 'conversemos@oirconecta.com',              href: 'mailto:conversemos@oirconecta.com' },
  { icon: <LocationOn sx={{ fontSize: 16 }} />,  text: 'Cr 10 #96-25 Cons. 320 – Bog.',         href: 'https://maps.google.com/?q=Carrera+10+%2396-25+Bogota' },
];

const Footer = () => (
  <footer role="contentinfo">
    <BannerFooter />
    <Box
      sx={{
        background: 'linear-gradient(180deg, #272F50 0%, #1a1f38 100%)',
        color: '#fff',
        pt: { xs: 8, md: 10 },
        pb: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blob decorativo verde sutil */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,89,70,0.18) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      {/* Blob ocre */}
      <Box sx={{
        position: 'absolute', bottom: 80, left: -80,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,106,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Franja de suscripción al boletín */}
        <Box
          sx={{
            mb: { xs: 5, md: 7 },
            p: { xs: 3, md: 4 },
            borderRadius: '10px',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 2.5, md: 4 },
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              fontSize: { xs: '1.375rem', md: '1.625rem' },
              color: '#fff', mb: 0.5,
              letterSpacing: '-0.01em',
            }}>
              Suscríbete a nuestro boletín
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.9375rem',
            }}>
              Salud auditiva cada 15 días, en lenguaje claro. Sin spam.
            </Typography>
          </Box>
          <Box
            sx={{
              width: { xs: '100%', md: 420 },
              flexShrink: 0,
              '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.92)' },
              '& .MuiFormLabel-root': { color: '#4a5568' },
            }}
          >
            <NewsletterSignup source="footer" inline />
          </Box>
        </Box>

        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* Brand column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2.5 }}>
              <img src="/logo-oirconecta-blanco.png" alt="OírConecta" style={{ height: 44 }} />
            </Box>
            <Typography sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: '1rem',
              color: '#C9A86A',
              mb: 2.5,
              fontWeight: 400,
              letterSpacing: '0.02em',
            }}>
              Escucha. Conecta. Vive mejor.
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
              fontSize: '0.9375rem',
              mb: 3.5,
              maxWidth: 340,
            }}>
              Referencia de valores, educación, ayuda para ubicar al profesional adecuado y acompañamiento en decisiones de salud auditiva.
            </Typography>

            {/* Social icons */}
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              {SOCIALS.map((s) => (
                <IconButton
                  key={s.label}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.60)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    width: 40, height: 40,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      color: '#272F50',
                      background: '#C9A86A',
                      border: '1px solid #C9A86A',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Stack>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)' }}>
              Redes enlazadas a contacto hasta publicar perfiles oficiales.
            </Typography>
          </Grid>

          {/* Link columns */}
          {SECTIONS.map((s) => (
            <Grid item xs={6} sm={4} md={2} key={s.title}>
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                  mb: 2.5,
                }}
              >
                {s.title}
              </Typography>
              <Stack spacing={1.5}>
                {s.links.map((lk) => (
                  <Link
                    key={lk.to + lk.name}
                    component={RouterLink}
                    to={lk.to}
                    sx={{
                      display: 'block',
                      color: 'rgba(255,255,255,0.72)',
                      textDecoration: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      transition: 'all 0.15s ease',
                      '&:hover': { color: '#fff', paddingLeft: '4px' },
                    }}
                  >
                    {lk.name}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          {/* Contact column */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                mb: 2.5,
              }}
            >
              Contacto
            </Typography>
            <Stack spacing={2}>
              {CONTACT.map((c) => (
                <Box
                  key={c.text}
                  component="a"
                  href={c.href}
                  target={c.href?.startsWith('http') ? '_blank' : undefined}
                  rel={c.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    color: 'rgba(255,255,255,0.65)',
                    textDecoration: 'none', fontSize: '0.875rem',
                    transition: 'color 0.15s ease',
                    '&:hover': { color: '#fff' },
                  }}
                >
                  <Box sx={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>{c.icon}</Box>
                  {c.text}
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 6, mb: 0, borderColor: 'rgba(255,255,255,0.10)' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            py: 3,
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} OírConecta · Bogotá, Colombia · @oirconecta
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            {['Términos', 'Privacidad', 'Cookies'].map((t, i) => (
              <Link
                key={t}
                component={RouterLink}
                to={`/legal#${['terminos', 'privacidad', 'cookies'][i]}`}
                sx={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: 'rgba(255,255,255,0.70)' } }}
              >
                {t}
              </Link>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  </footer>
);

export default Footer;
