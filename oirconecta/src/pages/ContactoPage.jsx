import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box, Container, Typography, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, Stack,
} from '@mui/material';
import {
  PhoneOutlined, EmailOutlined, LocationOnOutlined,
  ScheduleOutlined, Send, WhatsApp, LockOutlined, BoltOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const C = {
  navy: '#272F50', navyLight: '#4054B2', verde: '#085946',
  verdeProfundo: '#00382B', oro: '#C9A86A', blanco: '#FBFAF8',
  gris: '#6B7280', grisClaro: '#A1A7B1', arena: '#D9CDBF',
};

const HERO_IMAGE = 'https://image.pollinations.ai/prompt/Latina%20woman%20smiling%20warmly%20talking%20on%20phone%20with%20hearing%20healthcare%20specialist%2C%20bright%20office%2C%20editorial%20portrait%20photography?width=1200&height=1400&nologo=true';

const ContactoPage = () => {
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', asunto: '', mensaje: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com'}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('error');
      setSnackbar({ open: true, message: 'Mensaje enviado. Te responderemos en menos de 24 horas.', severity: 'success' });
      setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
    } catch {
      setSnackbar({ open: true, message: 'Error al enviar. Escríbenos directo a conversemos@oirconecta.com', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const INFO = [
    { icon: PhoneOutlined,    title: 'Teléfono / WhatsApp', value: '+57 315 793 9569', sub: 'Lun a Vie · 8:00 AM – 6:00 PM',
      href: 'https://wa.me/573157939569' },
    { icon: EmailOutlined,    title: 'Correo electrónico', value: 'conversemos@oirconecta.com', sub: 'Respuesta en menos de 24h',
      href: 'mailto:conversemos@oirconecta.com' },
    { icon: LocationOnOutlined, title: 'Consultorio', value: 'Cr 10 #96-25 Cons. 320', sub: 'Edificio Centro Ejecutivo, Bogotá',
      href: 'https://maps.google.com/?q=Carrera+10+%2396-25+Bogota' },
    { icon: ScheduleOutlined, title: 'Horario', value: 'Lunes a Viernes', sub: '8:00 AM – 6:00 PM' },
  ];

  return (
    <>
      <Helmet>
        <title>Contacto - OírConecta | Hablemos de tu salud auditiva</title>
        <meta name="description" content="Escríbenos, llámanos o agenda una conversación. Respondemos en menos de 24 horas." />
        <link rel="canonical" href="https://oirconecta.com/contacto" />
      </Helmet>

      <Header />

      {/* HERO */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 14, md: 16 }, pb: { xs: 5, md: 7 }, bgcolor: C.blanco }}>
        <Box sx={{
          position: 'absolute', top: -180, right: -180,
          width: 540, height: 540, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.arena}50 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 3 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
              fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.verde,
            }}>Hablemos</Typography>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
          </Stack>
          <Typography component="h1" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2.5rem', md: '3.75rem' }, fontWeight: 600,
            lineHeight: 1.08, color: C.navy, letterSpacing: '-0.018em', mb: 2.5,
          }}>
            ¿Cómo podemos{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
              ayudarte
            </Box>?
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1.0625rem', md: '1.1875rem' },
            color: C.gris, lineHeight: 1.6, maxWidth: 620, mx: 'auto',
          }}>
            Escríbenos, llámanos o agenda una conversación. Respondemos en menos de 24 horas, sin presión comercial.
          </Typography>
        </Container>
      </Box>

      {/* FORMULARIO + IMAGEN */}
      <Box component="section" sx={{ py: { xs: 4, md: 7 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
            {/* Imagen editorial */}
            <Grid item xs={12} md={5}>
              <Box sx={{
                position: 'relative', borderRadius: '12px', overflow: 'hidden',
                boxShadow: `0 20px 50px ${C.navy}1f`,
                height: { xs: 320, md: '100%' }, minHeight: { md: 560 },
              }}>
                <Box component="img" src={HERO_IMAGE} alt="Conversación con asesor OírConecta"
                  loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, ${C.verdeProfundo}DD 100%)`,
                }} />
                <Box sx={{
                  position: 'absolute', bottom: 28, left: 28, right: 28, color: '#fff',
                }}>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                    fontWeight: 600, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: C.oro, mb: 1.25,
                  }}>Atención humana</Typography>
                  <Typography sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: { xs: '1.375rem', md: '1.75rem' }, fontWeight: 600,
                    lineHeight: 1.2, mb: 1.5,
                  }}>
                    Personas que{' '}
                    <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
                      escuchan
                    </Box>
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.55,
                  }}>
                    No bots. No formularios infinitos. Una persona del equipo lee tu mensaje y te responde con calma.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Formulario */}
            <Grid item xs={12} md={7}>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  p: { xs: 3.5, md: 5 },
                  borderRadius: '12px',
                  bgcolor: C.blanco,
                  border: `1px solid ${C.grisClaro}33`,
                  height: '100%',
                }}
              >
                <Typography component="h2" sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600,
                  color: C.navy, letterSpacing: '-0.01em', mb: 1,
                }}>Envíanos un mensaje</Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                  color: C.gris, mb: 3.5,
                }}>
                  Cuéntanos qué necesitas y te contactamos.
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required name="nombre" label="Nombre completo"
                      value={formData.nombre} onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="email" name="email" label="Correo electrónico"
                      value={formData.email} onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth name="telefono" label="Teléfono (opcional)"
                      value={formData.telefono} onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel sx={{ fontFamily: '"DM Sans", sans-serif' }}>Asunto</InputLabel>
                      <Select
                        name="asunto" value={formData.asunto} onChange={handleChange} label="Asunto"
                        sx={{ borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' }}
                      >
                        <MenuItem value="consulta-general">Consulta general</MenuItem>
                        <MenuItem value="audifonos">Audífonos</MenuItem>
                        <MenuItem value="implantes">Implantes cocleares</MenuItem>
                        <MenuItem value="profesional">Soy profesional auditivo</MenuItem>
                        <MenuItem value="cita">Quiero agendar</MenuItem>
                        <MenuItem value="otro">Otro</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth required multiline rows={5}
                      name="mensaje" label="Tu mensaje"
                      value={formData.mensaje} onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={submitting}
                      endIcon={<Send />}
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        background: '#C9A86A !important', color: '#272F50 !important',
                        fontWeight: 700, fontSize: '0.9375rem',
                        py: 1.75, borderRadius: '6px',
                        boxShadow: `0 8px 24px ${C.oro}55`,
                        '&:hover': { background: '#D4B97A !important', transform: 'translateY(-2px)' },
                        '&:disabled': { background: '#D8DADF !important', color: '#6B7280 !important' },
                      }}
                    >
                      {submitting ? 'Enviando…' : 'Enviar mensaje'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Trust signals bajo el form */}
                <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${C.grisClaro}33` }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockOutlined sx={{ fontSize: 18, color: C.verde }} />
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: C.gris }}>
                        Datos protegidos · No compartimos tu información
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoltOutlined sx={{ fontSize: 18, color: C.verde }} />
                      <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: C.gris }}>
                        Respuesta en menos de 24h
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* INFO CARDS */}
      <Box component="section" sx={{ py: { xs: 4, md: 8 }, bgcolor: C.blanco }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 }, maxWidth: 620, mx: 'auto' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 2 }}>
              <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.verde,
              }}>Otras formas de contacto</Typography>
              <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            </Stack>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 600,
              color: C.navy, letterSpacing: '-0.018em', lineHeight: 1.15,
            }}>
              ¿Prefieres{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
                otro canal
              </Box>?
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {INFO.map((i) => {
              const Icon = i.icon;
              const Wrapper = i.href ? 'a' : 'div';
              return (
                <Grid item xs={12} sm={6} md={3} key={i.title}>
                  <Box
                    component={Wrapper}
                    href={i.href}
                    target={i.href?.startsWith('http') ? '_blank' : undefined}
                    rel={i.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    sx={{
                      display: 'flex', flexDirection: 'column',
                      textDecoration: 'none', height: '100%',
                      p: 3, borderRadius: '10px', bgcolor: '#fff',
                      border: `1px solid ${C.grisClaro}33`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: `${C.verde}55`, transform: 'translateY(-4px)',
                        boxShadow: `0 12px 28px ${C.navy}12`,
                      },
                    }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '8px',
                      bgcolor: `${C.verde}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                    }}><Icon sx={{ fontSize: 24, color: C.verde }} /></Box>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem',
                      fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: C.gris, mb: 0.75,
                    }}>{i.title}</Typography>
                    <Typography sx={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '1.0625rem', fontWeight: 600,
                      color: C.navy, lineHeight: 1.25, mb: 0.75,
                    }}>{i.value}</Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem',
                      color: C.gris, lineHeight: 1.5,
                    }}>{i.sub}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* CTA WhatsApp final */}
      <Box component="section" sx={{
        py: { xs: 5, md: 7 }, bgcolor: C.verdeProfundo, color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -100, right: -100,
          width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
            fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.oro, mb: 2,
          }}>Lo más rápido</Typography>
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.875rem', md: '2.5rem' }, fontWeight: 600,
            lineHeight: 1.15, color: '#fff', letterSpacing: '-0.018em', mb: 2,
          }}>
            ¿Quieres una{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
              respuesta ahora
            </Box>?
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
            color: 'rgba(255,255,255,0.80)', mb: 3.5, maxWidth: 540, mx: 'auto',
          }}>
            Escríbenos por WhatsApp y te atendemos directo —en horario de oficina.
          </Typography>
          <Button
            component="a"
            href="https://wa.me/573157939569"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<WhatsApp />}
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              background: '#25D366 !important', color: '#fff !important',
              fontWeight: 700, fontSize: '0.9375rem', px: 4, py: 1.75, borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(37,211,102,0.40)',
              '&:hover': { background: '#1ebe57 !important', transform: 'translateY(-2px)' },
            }}
          >
            Escribir por WhatsApp
          </Button>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </>
  );
};

export default ContactoPage;
