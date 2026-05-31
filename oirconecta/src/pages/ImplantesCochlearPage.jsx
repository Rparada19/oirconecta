import React from 'react';
import { Helmet } from 'react-helmet';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box, Typography, Button, Grid, Container, Chip, Stack } from '@mui/material';
import { ArrowForward, CheckCircle, Bluetooth, BatteryChargingFull, Smartphone, Hearing, MedicalServices, Psychology } from '@mui/icons-material';

const BRAND = {
  nombre: 'Cochlear',
  logo: '/logos/marcas/Cochlear-logo.png',
  eslogan: 'Nucleus® — El implante más usado en el mundo',
  descripcion: 'Cochlear es el líder mundial en implantes cocleares con más de 700.000 personas beneficiadas. Su sistema Nucleus® ofrece la mejor experiencia auditiva con tecnología de vanguardia y soporte de por vida.',
  rating: '4.9',
  gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  glow: 'rgba(240,180,0,0.40)',
};

const productos = [
  {
    nombre: 'Nucleus® 8',
    categoria: 'Procesador Audio',
    descripcion: 'El procesador de sonido más pequeño y liviano del mundo, con conectividad directa a iPhone y Android.',
    caracteristicas: [
      'El más pequeño y liviano del mundo',
      'Conexión directa iPhone y Android',
      'Resistente al agua IP68',
      'Recargable o batería estándar',
    ],
    destacado: true,
  },
  {
    nombre: 'Kanso® 2',
    categoria: 'Procesador Off-Ear',
    descripcion: 'Procesador off-the-ear redondo, completamente discreto, recargable y resistente al agua.',
    caracteristicas: [
      'Diseño redondo y discreto',
      'Totalmente recargable',
      'Resistente al agua IP68',
      'Conectividad Bluetooth',
    ],
    destacado: false,
  },
  {
    nombre: 'Osia® 2',
    categoria: 'Conducción Ósea',
    descripcion: 'Sistema de estimulación ósea activa, implantado bajo la piel sin necesidad de aditamentos externos.',
    caracteristicas: [
      'Sin aditamento externo visible',
      'Implantado bajo la piel',
      'Recargable de forma inalámbrica',
      'Para hipoacusia conductiva y mixta',
    ],
    destacado: false,
  },
  {
    nombre: 'Baha® 6 Max',
    categoria: 'Conducción Ósea',
    descripcion: 'El procesador de conducción ósea con más potencia de amplificación y conectividad total.',
    caracteristicas: [
      'Mayor potencia en su clase',
      'Conectividad Bluetooth directa',
      'Recargable',
      'Compatible con iPhone y Android',
    ],
    destacado: false,
  },
];

const tecnologias = [
  {
    icon: Psychology,
    titulo: 'SmartSound® iQ',
    descripcion: 'Procesamiento inteligente del sonido que se adapta automáticamente al entorno',
    gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  },
  {
    icon: Bluetooth,
    titulo: 'Conectividad Total',
    descripcion: 'Streaming directo desde iPhone, Android y televisores',
    gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  },
  {
    icon: BatteryChargingFull,
    titulo: 'Recargable IP68',
    descripcion: 'Batería de larga duración con protección total contra agua y polvo',
    gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  },
  {
    icon: Smartphone,
    titulo: 'App Nucleus Smart',
    descripcion: 'Control, ajuste y monitoreo del implante desde tu teléfono',
    gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  },
];

const ImplantesCochlearPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Implantes Cochlear - OírConecta | Nucleus® El más usado en el mundo</title>
        <meta name="description" content="Descubre los implantes cocleares Cochlear: Nucleus 8, Kanso 2, Osia 2 y Baha 6 Max. Más de 700.000 personas beneficiadas en el mundo." />
        <link rel="canonical" href="https://oirconecta.com/implantes/cochlear" />
      </Helmet>
      <Header />
      <Container maxWidth="lg" sx={{ pt: 10 }}>
        <SeoBreadcrumbs items={[
          { label: 'Inicio', to: '/' },
          { label: 'Implantes auditivos', to: '/implantes' },
          { label: 'Cochlear' },
        ]} />
      </Container>

      {/* ── HERO ── */}
      <Box sx={{
        position: 'relative', overflow: 'hidden', minHeight: { xs: 'auto', md: '80vh' },
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(240,180,0,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #483600 0%, #846300 30%, #272F50 70%, #1a1f38 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        {/* Grain */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.40, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        {[{ s: 500, top: '-15%', right: '-8%' }, { s: 300, bottom: '5%', left: '-5%' }].map((c, i) => (
          <Box key={i} sx={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)', top: c.top, bottom: c.bottom, right: c.right, left: c.left, pointerEvents: 'none' }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              {/* Breadcrumbs */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip label="Inicio" size="small" onClick={() => navigate('/')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', fontWeight: 600 }} />
                <Chip label="Implantes" size="small" onClick={() => navigate('/implantes')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', fontWeight: 600 }} />
                <Chip label="Cochlear" size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.20)', color: '#fff', border: '1px solid rgba(255,255,255,0.30)', fontWeight: 700 }} />
              </Box>

              {/* Logo */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2.5, py: 1.5,
                borderRadius: '8px', background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.20)', mb: 3 }}>
                <img src={BRAND.logo} alt="Cochlear" style={{ height: 48, objectFit: 'contain' }} />
              </Box>

              <Typography component="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.75rem' }, fontWeight: 900,
                letterSpacing: '-0.04em', lineHeight: 1.05, color: '#fff', mb: 2 }}>
                Implantes{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Cochlear
                </Box>
              </Typography>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fca5a5', mb: 2.5, letterSpacing: '-0.01em' }}>
                {BRAND.eslogan}
              </Typography>
              <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, mb: 4, maxWidth: 480 }}>
                {BRAND.descripcion}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" size="large" endIcon={<ArrowForward />}
                  onClick={() => navigate('/agendar')}
                  sx={{ borderRadius: '14px', fontWeight: 800, px: 3.5, py: 1.75, fontSize: '1rem',
                    bgcolor: '#fff', color: '#a83232',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.20)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', transform: 'translateY(-2px)', boxShadow: '0 12px 36px rgba(0,0,0,0.28)' },
                    transition: 'all 0.25s ease' }}>
                  Solicitar evaluación
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/contacto')}
                  sx={{ borderRadius: '14px', fontWeight: 700, px: 3, py: 1.625, fontSize: '1rem',
                    borderColor: 'rgba(255,255,255,0.40)', color: '#fff',
                    backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.08)',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.70)', background: 'rgba(255,255,255,0.15)' } }}>
                  Más información
                </Button>
              </Stack>
            </Grid>

            {/* Right — glass brand card */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ borderRadius: '8px', width: '100%', maxWidth: 440,
                  background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.30)', p: 4 }}>
                  <Box sx={{ borderRadius: '8px', bgcolor: '#fff', p: 3, mb: 3, textAlign: 'center' }}>
                    <img src={BRAND.logo} alt="Cochlear" style={{ height: 80, objectFit: 'contain' }} />
                  </Box>
                  <Grid container spacing={2}>
                    {[
                      { value: BRAND.rating, label: 'Valoración' },
                      { value: '700K+', label: 'Pacientes' },
                      { value: 'Nucleus®', label: 'Tecnología' },
                      { value: 'IP68', label: 'Protección' },
                    ].map((s) => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ borderRadius: '14px', p: 2, background: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#fca5a5', letterSpacing: '-0.02em' }}>{s.value}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{s.label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Wave */}
        <Box sx={{ position: 'relative', mt: { xs: 6, md: 8 }, lineHeight: 0, flexShrink: 0 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0 80L48 66C96 53 192 26 288 20C384 13 480 26 576 33C672 40 768 40 864 33C960 26 1056 13 1152 13C1248 13 1344 26 1392 33L1440 40V80H0Z" fill="#f4f9f7"/>
          </svg>
        </Box>
      </Box>

      {/* ── PRODUCTOS ── */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: '#f4f9f7' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.875rem', md: '2.75rem' },
              letterSpacing: '-0.03em', color: '#0f1923', mb: 1 }}>
              Sistemas{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                disponibles
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#4a5568', maxWidth: 520, mx: 'auto' }}>
              Soluciones Cochlear disponibles a través de los especialistas de la red OírConecta
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {productos.map((p, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Box sx={{ height: '100%', borderRadius: '22px', overflow: 'hidden', bgcolor: '#fff',
                  boxShadow: '0 2px 20px rgba(168,50,50,0.08)', border: '1px solid rgba(168,50,50,0.08)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.28s ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(168,50,50,0.15)' },
                  position: 'relative' }}>
                  {p.destacado && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2,
                      px: 1.5, py: 0.5, borderRadius: '8px',
                      background: 'linear-gradient(135deg, #a83232, #085946)',
                      boxShadow: '0 4px 12px rgba(168,50,50,0.35)' }}>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Destacado</Typography>
                    </Box>
                  )}
                  <Box sx={{ height: 140, background: BRAND.gradient, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <Typography sx={{ position: 'absolute', right: 8, bottom: -8, fontSize: '4rem',
                      fontWeight: 900, color: 'rgba(255,255,255,0.10)', letterSpacing: '-0.04em', userSelect: 'none' }}>
                      {String(i + 1).padStart(2, '0')}
                    </Typography>
                    <Hearing sx={{ color: 'rgba(255,255,255,0.90)', fontSize: 56 }} />
                  </Box>

                  <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip label={p.categoria} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem',
                        bgcolor: 'rgba(168,50,50,0.08)', color: '#a83232', border: '1px solid rgba(168,50,50,0.18)' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', mb: 0.75 }}>{p.nombre}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.6, mb: 2, flexGrow: 1 }}>{p.descripcion}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
                      {p.caracteristicas.slice(0, 3).map((c) => (
                        <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 15, color: '#a83232' }} />
                          <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568' }}>{c}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button variant="contained" fullWidth onClick={() => navigate('/agendar')}
                      sx={{ borderRadius: '12px', fontWeight: 700,
                        background: 'linear-gradient(135deg, #a83232, #085946)',
                        boxShadow: '0 4px 14px rgba(168,50,50,0.25)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(168,50,50,0.35)' } }}>
                      Solicitar información
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── TECNOLOGÍAS ── */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.875rem', md: '2.75rem' },
              letterSpacing: '-0.03em', color: '#0f1923', mb: 1 }}>
              Tecnología{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Nucleus®
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#4a5568', maxWidth: 480, mx: 'auto' }}>
              Décadas de innovación al servicio de la mejor audición posible
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {tecnologias.map((t) => {
              const Icon = t.icon;
              return (
                <Grid item xs={12} sm={6} md={3} key={t.titulo}>
                  <Box sx={{ borderRadius: '22px', p: 3, height: '100%', textAlign: 'center',
                    background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168,50,50,0.08)', boxShadow: '0 2px 16px rgba(168,50,50,0.06)',
                    transition: 'all 0.28s ease',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(168,50,50,0.13)' } }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '8px', background: t.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                      boxShadow: '0 8px 20px rgba(168,50,50,0.25)' }}>
                      <Icon sx={{ color: '#fff', fontSize: 30 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', mb: 1 }}>{t.titulo}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.65 }}>{t.descripcion}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ── CTA BANNER ── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', py: { xs: 5, md: 8 },
        background:
          'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(168,50,50,0.55) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 70% at 80% 40%, rgba(8,89,70,0.40) 0%, transparent 55%),' +
          'linear-gradient(160deg, #483600 0%, #846300 30%, #272F50 70%, #1a1f38 100%)',
        color: '#fff' }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' },
            letterSpacing: '-0.03em', color: '#fff', mb: 2 }}>
            Más de{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              700.000 personas
            </Box>{' '}confían en Cochlear
          </Typography>
          <Typography sx={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.78)', mb: 5, maxWidth: 520, mx: 'auto', lineHeight: 1.65 }}>
            Un especialista de la red te orienta sobre el sistema Cochlear que mejor se adapta a tu caso y te acompaña en todo el proceso.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" endIcon={<ArrowForward />}
              onClick={() => navigate('/agendar')}
              sx={{ borderRadius: '14px', fontWeight: 800, px: 4, py: 1.75,
                bgcolor: '#fff', color: '#a83232',
                boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', transform: 'translateY(-2px)' },
                transition: 'all 0.25s ease' }}>
              Agendar evaluación
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/implantes')}
              sx={{ borderRadius: '14px', fontWeight: 700, px: 4, py: 1.625,
                borderColor: 'rgba(255,255,255,0.40)', color: '#fff',
                '&:hover': { borderColor: 'rgba(255,255,255,0.70)', bgcolor: 'rgba(255,255,255,0.08)' } }}>
              Ver más opciones
            </Button>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default ImplantesCochlearPage;
