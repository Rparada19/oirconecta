import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Box, Container, Typography, Grid, TextField, Button, Stack,
  FormControl, InputLabel, Select, MenuItem, Alert, Snackbar,
} from '@mui/material';
import {
  PhoneOutlined, EmailOutlined, LocationOnOutlined, ScheduleOutlined,
  Send, WhatsApp, LockOutlined, BoltOutlined, ArrowForward,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { trackEvent } from '../utils/analytics';
import { fbqTrack } from '../utils/metaPixel';
import {
  PageHero, SectionEyebrow, SectionTitle, C,
} from '../components/editorial/EditorialKit';
import { useReveal } from '../hooks/useReveal';
import { getWhatsAppHref, getWhatsAppDisplay } from '../config/publicSite';

const ContactoPage = () => {
  const [searchParams] = useSearchParams();
  const asuntoFromUrl = searchParams.get('asunto') || '';
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', asunto: asuntoFromUrl, mensaje: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (asuntoFromUrl) setFormData((f) => ({ ...f, asunto: asuntoFromUrl }));
  }, [asuntoFromUrl]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const extractMarca = (asunto) => {
    const m = /Solicitud de información\s*-\s*(.+)/i.exec(asunto || '');
    return m ? m[1].trim() : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';
    const marca = extractMarca(formData.asunto);
    try {
      let res;
      if (marca) {
        if (!formData.nombre || !formData.telefono) {
          throw new Error('Nombre y teléfono son requeridos');
        }
        res = await fetch(`${API}/api/comparador/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formData.nombre,
            telefono: formData.telefono,
            email: formData.email || null,
            marcaSugerida: marca,
            test: { fuenteWeb: 'contacto-marca', asunto: formData.asunto, mensaje: formData.mensaje },
          }),
        });
      } else {
        res = await fetch(`${API}/api/public/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      if (!res.ok) throw new Error('error');
      setSnackbar({
        open: true,
        message: marca
          ? `Solicitud enviada. El equipo de ${marca} te contactará pronto.`
          : 'Mensaje enviado. Te responderemos en menos de 24 horas.',
        severity: 'success',
      });
      trackEvent('contact_form_submitted', marca ? 'comparador_marca' : 'general', {
        asunto: formData.asunto || null,
        marca: marca || null,
      });
      fbqTrack('Lead', { content_name: marca ? `contacto_${marca}` : 'contacto_general' });
      setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message === 'Nombre y teléfono son requeridos'
          ? err.message
          : 'Error al enviar. Escríbenos directo a conversemos@oirconecta.com',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const INFO = [
    { Icon: PhoneOutlined,    n: '01', title: 'Teléfono / WhatsApp',
      value: getWhatsAppDisplay(), sub: 'Lun a Vie · 8:00 – 18:00',
      href: getWhatsAppHref() },
    { Icon: EmailOutlined,    n: '02', title: 'Correo electrónico',
      value: 'conversemos@oirconecta.com', sub: 'Respuesta en menos de 24h',
      href: 'mailto:conversemos@oirconecta.com' },
    { Icon: LocationOnOutlined, n: '03', title: 'Consultorio Bogotá',
      value: 'Cr 10 #96-25 Cons. 320', sub: 'Edificio Centro Ejecutivo',
      href: 'https://maps.google.com/?q=Carrera+10+%2396-25+Bogota' },
    { Icon: ScheduleOutlined, n: '04', title: 'Horario de atención',
      value: 'Lunes a Viernes', sub: '8:00 AM – 6:00 PM' },
  ];

  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>Contacto — OírConecta · Hablemos de tu salud auditiva</title>
        <meta name="description" content="Escríbenos, llámanos o agenda una conversación con el equipo de OírConecta. Respondemos en menos de 24 horas, sin presión comercial." />
        <link rel="canonical" href="https://oirconecta.com/contacto" />
        <meta property="og:title" content="Contacto — OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/contacto" />
        <meta property="og:image" content="https://oirconecta.com/img/audiologa-consulta-paciente.jpg" />
      </Helmet>

      <Header />

      <PageHero
        eyebrow="Contacto · Hablemos"
        titleBefore="¿Cómo podemos"
        titleAccent="ayudarte?"
        intro="Escríbenos, llámanos o agenda una conversación. Una persona del equipo OírConecta lee tu mensaje y responde con calma — sin chatbots, sin presión comercial."
        image="/img/audiologa-consulta-paciente.jpg"
        imageAlt="Audióloga conversando con paciente en consulta"
        imageTag="Atención humana"
        imageCaption="No bots, no formularios infinitos. Personas que escuchan."
        cta={{ label: 'Escribir por WhatsApp', to: getWhatsAppHref() }}
        ctaSecondary={{ label: 'Buscar audiólogo cerca', to: '/directorio/listado' }}
      />

      {/* FORMULARIO */}
      <FormBlock
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitting={submitting}
        asuntoFromUrl={asuntoFromUrl}
      />

      {/* CANALES DE CONTACTO — lista editorial */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 8 },
          }}>
            <Box>
              <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
                Otros canales
              </SectionEyebrow>
              <SectionTitle before="Cuatro formas de" accent="encontrarnos." size="md" />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1rem', md: '1.1rem' }, color: C.gris,
              lineHeight: 1.6, maxWidth: 540,
            }}>
              Si prefieres no llenar formularios, escoge el canal que te quede más cómodo.
              Todos llegan al mismo equipo humano.
            </Typography>
          </Box>

          <Box sx={{ borderTop: `1px solid ${C.border}` }}>
            {INFO.map((i, idx) => <InfoRow key={i.n} info={i} delay={idx * 0.06} />)}
          </Box>
        </Container>
      </Box>

      {/* CTA WhatsApp final */}
      <Box component="section" sx={{
        py: { xs: 8, md: 12 }, bgcolor: C.navy, color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -100, right: -100,
          width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.oro}33 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <SectionEyebrow color={C.oro} dash={C.oro} sx={{ mb: 3, justifyContent: 'center', display: 'inline-flex' }}>
            Lo más rápido
          </SectionEyebrow>
          <SectionTitle
            before="¿Quieres una"
            accent="respuesta ahora?"
            size="md"
            sx={{ color: '#fff', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4, maxWidth: 540, mx: 'auto',
          }}>
            Escríbenos por WhatsApp y te atendemos directo, en horario de oficina.
          </Typography>
          <Box
            component="a"
            href={getWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1.25,
              bgcolor: '#25D366', color: '#fff',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.95rem', fontWeight: 700,
              px: 4, py: 1.85, borderRadius: '6px',
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: '0 10px 28px rgba(37,211,102,0.45)',
              transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#1ebe57', transform: 'translateY(-2px)' },
            }}
          >
            <WhatsApp sx={{ fontSize: 20 }} />
            Escribir por WhatsApp
          </Box>
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
    </Box>
  );
};

// ───────────────────────────────────────────────────────────────────────────

function FormBlock({ formData, handleChange, handleSubmit, submitting, asuntoFromUrl }) {
  const { ref, visible } = useReveal({ threshold: 0.15 });
  return (
    <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg" ref={ref} sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.95s cubic-bezier(0.2,0.7,0.2,1)',
      }}>
        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
          gap: { xs: 4, md: 7 }, alignItems: 'start',
        }}>
          {/* Lado izquierdo: contexto editorial */}
          <Box sx={{ position: { md: 'sticky' }, top: { md: 120 } }}>
            <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 3 }}>
              Escríbenos
            </SectionEyebrow>
            <SectionTitle
              before="Cuéntanos"
              accent="qué"
              after="necesitas."
              size="md"
              sx={{ mb: 3 }}
            />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '1rem', color: C.gris, lineHeight: 1.65,
            }}>
              Si llegaste desde una página de marca, tu mensaje irá al equipo correspondiente.
              Si es una consulta general, te responde el equipo de OírConecta directamente.
            </Typography>

            <Stack spacing={1.5} sx={{ mt: 4 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LockOutlined sx={{ fontSize: 18, color: C.verde }} />
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: C.gris }}>
                  Datos protegidos · No los compartimos
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <BoltOutlined sx={{ fontSize: 18, color: C.verde }} />
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: C.gris }}>
                  Respuesta en menos de 24h
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} sx={{
            bgcolor: '#fff', borderRadius: '14px', p: { xs: 3, md: 5 },
            border: `1px solid ${C.border}`,
            boxShadow: `0 24px 60px ${C.navy}0d`,
          }}>
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
                <TextField fullWidth name="telefono"
                  label={asuntoFromUrl ? "Teléfono *" : "Teléfono (opcional)"}
                  required={Boolean(asuntoFromUrl)}
                  value={formData.telefono} onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {asuntoFromUrl ? (
                  <TextField fullWidth required name="asunto" label="Asunto"
                    value={formData.asunto} onChange={handleChange}
                    helperText="Prellenado según la marca que estabas viendo"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: '"DM Sans", sans-serif' } }}
                  />
                ) : (
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
                )}
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
                  size="large"
                  fullWidth
                  disabled={submitting}
                  endIcon={<Send />}
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    background: `${C.navy} !important`, color: '#fff !important',
                    fontWeight: 700, fontSize: '0.9375rem',
                    py: 1.85, borderRadius: '6px',
                    letterSpacing: '0.02em',
                    boxShadow: `0 10px 28px ${C.navy}33`,
                    '&:hover': { background: `${C.navyDark} !important`, transform: 'translateY(-2px)' },
                    '&:disabled': { background: '#D8DADF !important', color: '#6B7280 !important' },
                  }}
                >
                  {submitting ? 'Enviando…' : 'Enviar mensaje'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// ───────────────────────────────────────────────────────────────────────────

function InfoRow({ info, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });
  const Wrapper = info.href ? 'a' : 'div';
  return (
    <Box
      ref={ref}
      component={Wrapper}
      href={info.href}
      target={info.href?.startsWith('http') ? '_blank' : undefined}
      rel={info.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '60px 1fr', md: '90px 60px 1fr auto' },
        gap: { xs: 2, md: 4 }, alignItems: 'center',
        py: { xs: 3.5, md: 4.5 },
        borderBottom: `1px solid ${C.border}`,
        textDecoration: 'none', cursor: info.href ? 'pointer' : 'default',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `all 0.8s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
        '&:hover .oc-icon-wrap': info.href ? { borderColor: C.navy, color: C.navy } : {},
        '&:hover .oc-info-arrow': info.href ? { color: C.verde, transform: 'translateX(6px)' } : {},
      }}
    >
      <Typography sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.5rem', md: '2.25rem' }, fontWeight: 600,
        color: `${C.navy}55`, lineHeight: 1,
      }}>
        {info.n}
      </Typography>
      <Box className="oc-icon-wrap" sx={{
        display: { xs: 'none', md: 'flex' },
        width: 48, height: 48, borderRadius: '50%',
        border: `1.5px solid ${C.arena}`, color: C.gris,
        alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}>
        <info.Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: C.gris, mb: 0.75,
        }}>
          {info.title}
        </Typography>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.15rem', md: '1.5rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.2, mb: 0.5,
        }}>
          {info.value}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.85rem', color: C.gris,
        }}>
          {info.sub}
        </Typography>
      </Box>
      {info.href && (
        <Box className="oc-info-arrow" sx={{
          display: { xs: 'none', md: 'flex' }, color: C.gris,
          transition: 'all 0.3s ease',
        }}>
          <ArrowForward />
        </Box>
      )}
    </Box>
  );
}

export default ContactoPage;
