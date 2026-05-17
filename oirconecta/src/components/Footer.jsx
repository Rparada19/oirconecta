import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, Stack } from '@mui/material';
import { Facebook, Instagram, LinkedIn, YouTube, Email, Phone, LocationOn } from '@mui/icons-material';
import { directoryProfesionToSlug } from '../utils/directoryPresentation';

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
  { icon: <Facebook sx={{ fontSize: 20 }} />,   label: 'Facebook' },
  { icon: <Instagram sx={{ fontSize: 20 }} />,  label: 'Instagram' },
  { icon: <LinkedIn sx={{ fontSize: 20 }} />,   label: 'LinkedIn' },
  { icon: <YouTube sx={{ fontSize: 20 }} />,    label: 'YouTube' },
];

const CONTACT = [
  { icon: <Phone sx={{ fontSize: 16 }} />,       text: '+57 (1) 234-5678',       href: 'tel:+5712345678' },
  { icon: <Email sx={{ fontSize: 16 }} />,       text: 'info@oirconecta.com',    href: 'mailto:info@oirconecta.com' },
  { icon: <LocationOn sx={{ fontSize: 16 }} />,  text: 'Bogotá, Colombia',       href: null },
];

const Footer = () => (
  <footer role="contentinfo">
    <Box
      sx={{
        background:
          'radial-gradient(ellipse 80% 60% at 10% 110%, rgba(13,122,92,0.30) 0%, transparent 55%),' +
          'linear-gradient(160deg, #085946 0%, #0d6b56 30%, #272F50 70%, #1a1f38 100%)',
        color: '#fff',
        pt: { xs: 8, md: 10 },
        pb: 0,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {/* Brand column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <img src="/logo-oirconecta-blanco.png" alt="OírConecta" style={{ height: 44 }} />
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, fontSize: '0.9375rem', mb: 3.5, maxWidth: 320 }}>
              Referencia de valores, educación, ayuda para ubicar al profesional adecuado y acompañamiento en decisiones de salud auditiva.
            </Typography>

            {/* Social icons */}
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              {SOCIALS.map((s) => (
                <IconButton
                  key={s.label}
                  component={RouterLink}
                  to="/contacto"
                  aria-label={s.label}
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.55)',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    width: 38, height: 38,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#fff',
                      background: 'rgba(255,255,255,0.16)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      transform: 'translateY(-2px)',
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
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.10em',
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
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.10em',
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
                  component={c.href ? 'a' : 'div'}
                  href={c.href || undefined}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    color: 'rgba(255,255,255,0.65)',
                    textDecoration: 'none', fontSize: '0.875rem',
                    transition: 'color 0.15s ease',
                    '&:hover': c.href ? { color: '#fff' } : {},
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
            © {new Date().getFullYear()} OírConecta · Bogotá, Colombia
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
