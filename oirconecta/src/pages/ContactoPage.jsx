import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { Phone, Email, LocationOn, Schedule, Send } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactoPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, email, telefono, asunto, mensaje } = formData;
    const subject = encodeURIComponent(asunto?.trim() || 'Consulta web OírConecta');
    const body = encodeURIComponent(
      `Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\n\nMensaje:\n${mensaje}`
    );
    window.location.href = `mailto:conversemos@oirconecta.com?subject=${subject}&body=${body}`;

    setSnackbar({
      open: true,
      message: 'Se abrirá tu correo para enviar el mensaje a conversemos@oirconecta.com.',
      severity: 'success',
    });
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      asunto: '',
      mensaje: '',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const contactInfo = [
    { Icon: Phone, title: 'Teléfono / WhatsApp', info: '+57 315 793 9569', description: 'Lunes a Viernes 8:00 AM – 6:00 PM', gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)' },
    { Icon: Email, title: 'Correo electrónico', info: 'conversemos@oirconecta.com', description: 'Respondemos en menos de 24 horas', gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)' },
    { Icon: LocationOn, title: 'Consultorio', info: 'Carrera 10 #96-25 Cons. 320', description: 'Edificio Centro Ejecutivo, Bogotá', gradient: 'linear-gradient(135deg, #71A095 0%, #085946 100%)' },
    { Icon: Schedule, title: 'Horario de Atención', info: 'Lunes a Viernes', description: '8:00 AM – 6:00 PM', gradient: 'linear-gradient(135deg, #085946 0%, #272F50 100%)' },
  ];

  return (
    <>
      <Helmet>
        <title>Contacto - OirConecta | Conectamos Pacientes con Especialistas Auditivos</title>
        <meta name="description" content="Contáctanos para obtener información sobre nuestros servicios de salud auditiva. Encuentra especialistas auditivos en Colombia." />
        <meta name="keywords" content="contacto, OirConecta, especialistas auditivos, Colombia, salud auditiva" />
        <link rel="canonical" href="https://oirconecta.com/contacto" />
      </Helmet>

      <Header />

      {/* Hero */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.625,
            borderRadius: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              OírConecta
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
            Ponte en{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              contacto
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
            Escríbenos para dudas sobre la plataforma o la red de profesionales. Para temas clínicos, el especialista que elijas te responderá directamente.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Grid container spacing={4}>
          {/* Contact info sidebar */}
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.01em', mb: 3 }}>
              Información de contacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              {contactInfo.map((item) => (
                <Box key={item.title} sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
                  borderRadius: '18px', background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: item.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.Icon sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f1923' }}>{item.title}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#085946' }}>{item.info}</Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#6b7280' }}>{item.description}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ p: 3, borderRadius: '18px', background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f1923', mb: 1.5 }}>
                Horarios de atención
              </Typography>
              {[
                { dia: 'Lunes a Viernes', hora: '8:00 AM – 6:00 PM' },
                { dia: 'Sábados', hora: '9:00 AM – 2:00 PM' },
                { dia: 'Domingos', hora: 'Cerrado' },
              ].map((h) => (
                <Box key={h.dia} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', fontWeight: 600 }}>{h.dia}</Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: '#4a5568' }}>{h.hora}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Contact form */}
          <Grid item xs={12} md={8}>
            <Box sx={{ borderRadius: '22px', p: { xs: 3, md: 4 },
              background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 3 }}>
                Envíanos un mensaje
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nombre completo" name="nombre" value={formData.nombre} onChange={handleChange} required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                      <InputLabel>Asunto</InputLabel>
                      <Select name="asunto" value={formData.asunto} onChange={handleChange} label="Asunto">
                        <MenuItem value="consulta">Consulta General</MenuItem>
                        <MenuItem value="cita">Solicitar Cita</MenuItem>
                        <MenuItem value="especialista">Buscar Especialista</MenuItem>
                        <MenuItem value="audifonos">Información sobre Audífonos</MenuItem>
                        <MenuItem value="implantes">Información sobre Implantes</MenuItem>
                        <MenuItem value="otro">Otro</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Mensaje" name="mensaje" multiline rows={5} value={formData.mensaje} onChange={handleChange} required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" size="large" startIcon={<Send />}
                      sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '1rem', px: 4, py: 1.5,
                        background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                        boxShadow: '0 6px 18px rgba(8,89,70,0.25)',
                        '&:hover': { boxShadow: '0 8px 24px rgba(8,89,70,0.35)' } }}>
                      Enviar Mensaje
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Why OirConecta */}
        <Box sx={{ mt: 8, p: { xs: 3, md: 4 }, borderRadius: '22px',
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f1923', letterSpacing: '-0.02em', textAlign: 'center', mb: 4 }}>
            ¿Por qué elegir{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              OírConecta?
            </Box>
          </Typography>
          <Grid container spacing={3}>
            {[
              { label: 'Especialistas Certificados', desc: 'Trabajamos únicamente con profesionales certificados y con amplia experiencia en salud auditiva.' },
              { label: 'Atención Personalizada', desc: 'Cada paciente recibe atención personalizada según sus necesidades específicas.' },
              { label: 'Seguimiento Continuo', desc: 'Acompañamos a nuestros pacientes durante todo su proceso de rehabilitación auditiva.' },
            ].map((item) => (
              <Grid item xs={12} md={4} key={item.label}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ width: 40, height: 4, borderRadius: '4px', background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)', mx: 'auto', mb: 2 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f1923', mb: 1 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: 1.65 }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <Footer />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactoPage; 