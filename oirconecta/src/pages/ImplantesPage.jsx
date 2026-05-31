import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Button, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { CheckCircle, ExpandMore, Hearing } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingCardMedia from '../components/marketing/MarketingCardMedia';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';

const ImplantesPage = () => {
  const navigate = useNavigate();

  const marcas = [
    {
      nombre: 'Cochlear',
      slug: 'cochlear',
      descripcion: 'Líder mundial en implantes cocleares: sistemas Nucleus, Kanso y soluciones Baha.',
      caracteristicas: ['Nucleus', 'Kanso', 'Baha'],
      rating: 4.9,
      gradient: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
    },
    {
      nombre: 'Advanced Bionics',
      slug: 'advanced-bionics',
      descripcion: 'Procesadores Marvel y tecnología HiRes™ para audición clara en entornos complejos.',
      caracteristicas: ['HiRes', 'Naída', 'Marvel'],
      rating: 4.8,
      gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      nombre: 'MED-EL',
      slug: 'medel',
      descripcion: 'Implantes y procesadores SYMBIO™, RONDO y SONNET con enfoque en flexibilidad quirúrgica.',
      caracteristicas: ['SYNCHRONY', 'SONNET', 'RONDO'],
      rating: 4.7,
      gradient: 'linear-gradient(135deg, #0a4d3c 0%, #272F50 100%)',
    },
  ];

  const tipos = [
    {
      titulo: 'Implante coclear',
      descripcion:
        'Dispositivo que estimula el nervio auditivo cuando la cóclea no transmite bien el sonido. Requiere valoración ORL, imagen y equipo de rehabilitación.',
      indicaciones: ['Pérdida severa a profunda bilateral', 'Poco beneficio con audífonos potentes', 'Niños y adultos según protocolo'],
      ventajas: ['Acceso a la pista oral', 'Evolución tecnológica del procesador', 'Seguimiento logoaudiológico'],
      accent: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
    },
    {
      titulo: 'Implante de tronco cerebral / alternativas',
      descripcion:
        'Para casos en que el nervio auditivo no es viable; indicación muy específica y centros de referencia.',
      indicaciones: ['Neurofibromatosis tipo 2', 'Ausencia de nervio o función', 'Criterio de comité especializado'],
      ventajas: ['Opción cuando no hay coclear', 'Abordaje multidisciplinario', 'Expectativas realistas desde el inicio'],
      accent: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      titulo: 'Implante de oído medio / dispositivos conductivos',
      descripcion:
        'Soluciones para pérdidas conductivas o mixtas cuando no es posible o deseable audífono convencional.',
      indicaciones: ['Conductiva persistente', 'Otosclerosis seleccionada', 'Malformaciones del oído externo/medio'],
      ventajas: ['Menor invasión en algunos casos', 'Buena aceptación', 'Integración con audición residual'],
      accent: 'linear-gradient(135deg, #71A095 0%, #085946 100%)',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Implantes auditivos - Red OírConecta | Información</title>
        <meta
          name="description"
          content="Información sobre implantes y marcas; la candidatura y el tratamiento los definen especialistas de la red."
        />
      </Helmet>

      <Header />

      <Container maxWidth="lg" sx={{ pt: 10 }}>
        <SeoBreadcrumbs items={[
          { label: 'Inicio', to: '/' },
          { label: 'Implantes auditivos' },
        ]} />
      </Container>

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
            borderRadius: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              Red OírConecta
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
            Implantes{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              auditivos
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
            OírConecta difunde información y enlaces a equipos de la red. La candidatura y el plan terapéutico son siempre decisión médica del especialista que te atienda.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>

        {/* Brands */}
        <Box sx={{ mb: 8 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.75rem', md: '2.25rem' }, letterSpacing: '-0.03em',
            textAlign: 'center', mb: 1, color: '#0f1923' }}>
            Marcas con las que{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              trabajamos
            </Box>
          </Typography>
          <Typography sx={{ color: '#4a5568', textAlign: 'center', mb: 5, fontSize: '1rem' }}>
            Tres referentes mundiales con cobertura a través de la red de especialistas
          </Typography>

          <Grid container spacing={3}>
            {marcas.map((marca) => (
              <Grid item xs={12} md={4} key={marca.slug}>
                <Box sx={{
                  height: '100%', borderRadius: '22px',
                  background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(8,89,70,0.14)' },
                  overflow: 'hidden',
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <MarketingCardMedia
                      title={marca.nombre}
                      subtitle="Implantes y procesadores"
                      icon={Hearing}
                      gradient={marca.gradient}
                    />
                    <Box sx={{
                      position: 'absolute', top: 10, right: 10,
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      bgcolor: 'rgba(255,255,255,0.95)', px: 1.25, py: 0.5,
                      borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                      <CheckCircle sx={{ fontSize: 15, color: '#16a34a' }} />
                      <Typography sx={{ fontWeight: 800, fontSize: '0.8125rem', color: '#0f1923' }}>
                        {marca.rating}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: '#4a5568', fontSize: '0.9375rem', lineHeight: 1.65, mb: 2 }}>
                      {marca.descripcion}
                    </Typography>
                    <Box sx={{ mb: 2.5 }}>
                      {marca.caracteristicas.map((c) => (
                        <Chip key={c} label={c} size="small" sx={{
                          m: 0.4, fontWeight: 700, fontSize: '0.75rem',
                          bgcolor: 'rgba(8,89,70,0.08)', color: '#085946',
                          border: '1px solid rgba(8,89,70,0.18)',
                          '&:hover': { bgcolor: '#085946', color: '#fff' },
                        }} />
                      ))}
                    </Box>
                    <Button variant="contained" fullWidth onClick={() => navigate(`/implantes/${marca.slug}`)}
                      sx={{ borderRadius: '12px', fontWeight: 700,
                        background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                        boxShadow: '0 6px 18px rgba(8,89,70,0.25)',
                        '&:hover': { boxShadow: '0 8px 24px rgba(8,89,70,0.35)' } }}>
                      Ver detalle de marca
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Types */}
        <Box sx={{ mb: 8 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.75rem', md: '2.25rem' }, letterSpacing: '-0.03em',
            textAlign: 'center', mb: 1, color: '#0f1923' }}>
            Tipos de{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              soluciones
            </Box>
          </Typography>
          <Typography sx={{ color: '#4a5568', textAlign: 'center', mb: 5, maxWidth: 640, mx: 'auto', fontSize: '1rem' }}>
            Resumen educativo. El especialista indicará la opción según estudios, edad y objetivos de comunicación.
          </Typography>

          <Grid container spacing={3}>
            {tipos.map((tipo, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{
                  height: '100%', borderRadius: '22px',
                  background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 2px 16px rgba(8,89,70,0.07)', p: 3.5,
                  transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(8,89,70,0.12)' },
                }}>
                  <Box sx={{ width: 4, height: 32, borderRadius: '4px', background: tipo.accent, mb: 2 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', letterSpacing: '-0.01em', mb: 1.5 }}>
                    {tipo.titulo}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: 1.65, mb: 2.5 }}>
                    {tipo.descripcion}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#085946', mb: 1 }}>
                    Indicaciones frecuentes
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, mb: 2.5 }}>
                    {tipo.indicaciones.map((ind) => (
                      <Typography component="li" key={ind} sx={{ fontSize: '0.875rem', color: '#4a5568', mb: 0.5 }}>
                        {ind}
                      </Typography>
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#085946', mb: 1 }}>
                    Ventajas a considerar
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {tipo.ventajas.map((v) => (
                      <Typography component="li" key={v} sx={{ fontSize: '0.875rem', color: '#4a5568', mb: 0.5 }}>
                        {v}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ */}
        <Box sx={{ borderRadius: '22px', overflow: 'hidden',
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
          <Accordion disableGutters elevation={0} sx={{ background: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f1923' }}>
                Preguntas frecuentes
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', mb: 1.5, lineHeight: 1.7 }}>
                <strong style={{ color: '#0f1923' }}>¿Cuánto dura el proceso?</strong>{' '}
                Depende de cada centro y del tipo de implante; suele incluir varias citas previas y rehabilitación posterior.
              </Typography>
              <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', mb: 2, lineHeight: 1.7 }}>
                <strong style={{ color: '#0f1923' }}>¿Cubre la EPS?</strong>{' '}
                La cobertura varía según política y diagnóstico; te orientamos para documentar la solicitud.
              </Typography>
              <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.7 }}>
                <strong style={{ color: '#0f1923' }}>Siguiente paso:</strong>{' '}
                <Button size="small" onClick={() => navigate('/agendar')}
                  sx={{ fontWeight: 700, color: '#085946', textTransform: 'none', px: 0.5 }}>
                  Agendar
                </Button>{' '}
                o{' '}
                <Button size="small" onClick={() => navigate('/contacto')}
                  sx={{ fontWeight: 700, color: '#085946', textTransform: 'none', px: 0.5 }}>
                  contacto
                </Button>
                .
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', mt: 8, p: 4, borderRadius: '22px',
          background: 'rgba(8,89,70,0.05)', border: '1px solid rgba(8,89,70,0.12)' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1 }}>
            ¿Listo para dar el siguiente paso?
          </Typography>
          <Typography sx={{ color: '#4a5568', mb: 3 }}>Agenda con un especialista de la red y evalúa tu caso</Typography>
          <Button variant="outlined" size="large" onClick={() => navigate('/agendar')}
            sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '1rem', px: 4, py: 1.5,
              borderColor: '#085946', color: '#085946', borderWidth: 2,
              '&:hover': { borderWidth: 2, bgcolor: 'rgba(8,89,70,0.05)' } }}>
            Agendar en línea
          </Button>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default ImplantesPage;
