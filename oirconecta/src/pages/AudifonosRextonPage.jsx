import React from 'react';
import { Helmet } from 'react-helmet';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box, Typography, Button, Grid, Container, Chip, Stack } from '@mui/material';
import { ArrowForward, CheckCircle, Bluetooth, BatteryChargingFull, Smartphone, Hearing } from '@mui/icons-material';

const BRAND = {
  nombre: 'Rexton',
  logo: '/logos/marcas/Rexton-logo.png',
  eslogan: 'Calidad y conectividad',
  descripcion: 'Audífonos con tecnología de procesamiento avanzado, recargables y conectividad total para una experiencia auditiva personalizada. Rexton combina diseño elegante con potencia auditiva para cada estilo de vida.',
  rating: '4.7',
  gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)',
  glow: 'rgba(240,180,0,0.40)',
};

const productos = [
  {
    nombre: 'Rexton Nexus',
    categoria: 'RIC',
    descripcion: 'Audífono con tecnología de procesamiento avanzado, recargable y control total desde la app.',
    caracteristicas: ['Nexus AI Processing', 'Bluetooth conectado', 'Batería recargable', 'App Rexton Smart'],
    destacado: true,
  },
  {
    nombre: 'Rexton Connect',
    categoria: 'BTE',
    descripcion: 'Sonido natural y claro con diseño elegante y discreto.',
    caracteristicas: ['Sonido natural', 'Recargable', 'App Rexton Smart', 'Diseño discreto'],
    destacado: false,
  },
  {
    nombre: 'Rexton Air',
    categoria: 'ITE',
    descripcion: 'Diseño personalizado, conectividad avanzada y sonido potente.',
    caracteristicas: ['Diseño personalizado', 'Conectividad avanzada', 'App Rexton Smart', 'Sonido potente'],
    destacado: false,
  },
];

const tecnologias = [
  { icon: Hearing, titulo: 'Nexus AI', descripcion: 'Procesamiento avanzado para audición clara y natural', gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)' },
  { icon: Bluetooth, titulo: 'Conectividad Total', descripcion: 'Bluetooth y streaming directo a todos tus dispositivos', gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50 100%)' },
  { icon: BatteryChargingFull, titulo: 'Batería Recargable', descripcion: 'Comodidad sin pilas, siempre listo para usar', gradient: 'linear-gradient(135deg, #F0B400AA 0%, #272F50 100%)' },
  { icon: Smartphone, titulo: 'App Rexton Smart', descripcion: 'Control personalizado de tus audífonos desde el móvil', gradient: 'linear-gradient(135deg, #F0B400 0%, #272F50DD 100%)' },
];

const AudifonosRextonPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Audífonos Rexton - OírConecta | Calidad y conectividad</title>
        <meta name="description" content="Descubre los audífonos Rexton con tecnología Nexus AI. Rexton Nexus, Connect y Air con conectividad Bluetooth y diseño discreto." />
        <link rel="canonical" href="https://oirconecta.com/audifonos/rexton" />
      </Helmet>
      <Header />
      <Container maxWidth="lg" sx={{ pt: 10 }}>
        <SeoBreadcrumbs items={[
          { label: 'Inicio', to: '/' },
          { label: 'Audífonos', to: '/audifonos' },
          { label: 'Rexton' },
        ]} />
      </Container>

      {/* ── HERO ── */}
      <Box sx={{
        position: 'relative', overflow: 'hidden', minHeight: { xs: 'auto', md: '80vh' },
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(240,180,0,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #5c4400 0%, #5c4400 30%, #272F50 70%, #1a1f38 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        {/* Grain */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.40, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        {/* Decorative circles */}
        {[{ s: 500, top: '-15%', right: '-8%' }, { s: 300, bottom: '5%', left: '-5%' }].map((c, i) => (
          <Box key={i} sx={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)', top: c.top, bottom: c.bottom, right: c.right, left: c.left, pointerEvents: 'none' }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              {/* Breadcrumb chip */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip label="Inicio" size="small" onClick={() => navigate('/')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', fontWeight: 600 }} />
                <Chip label="Audífonos" size="small" onClick={() => navigate('/audifonos')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', fontWeight: 600 }} />
                <Chip label="Rexton" size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.20)', color: '#fff', border: '1px solid rgba(255,255,255,0.30)', fontWeight: 700 }} />
              </Box>

              {/* Logo */}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2.5, py: 1.5,
                borderRadius: '8px', background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.20)', mb: 3 }}>
                <img src={BRAND.logo} alt="Rexton" style={{ height: 48, objectFit: 'contain' }} />
              </Box>

              <Typography component="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.75rem' }, fontWeight: 900,
                letterSpacing: '-0.04em', lineHeight: 1.05, color: '#fff', mb: 2 }}>
                Audífonos{' '}
                <Box component="span" sx={{ color: '#fff' }}>
                  Rexton
                </Box>
              </Typography>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fde68a', mb: 2.5, letterSpacing: '-0.01em' }}>
                {BRAND.eslogan}
              </Typography>
              <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, mb: 4, maxWidth: 480 }}>
                {BRAND.descripcion}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" size="large" endIcon={<ArrowForward />}
                  onClick={() => navigate('/contacto?asunto=Solicitud%20de%20información%20-%20Rexton')}
                  sx={{ borderRadius: '14px', fontWeight: 800, px: 3.5, py: 1.75, fontSize: '1rem',
                    bgcolor: '#fff', color: '#085946',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.20)',
                    '&:hover': { background: 'rgba(255,255,255,0.92) !important', transform: 'translateY(-2px)', boxShadow: '0 12px 36px rgba(0,0,0,0.28)' },
                    transition: 'all 0.25s ease' }}>
                  Solicitar información
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

            {/* Right — visual brand card */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: 440,
                  background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.30)', p: 4 }}>
                  {/* Brand logo large */}
                  <Box sx={{ borderRadius: '8px', bgcolor: '#fff', p: 3, mb: 3, textAlign: 'center' }}>
                    <img src={BRAND.logo} alt="Rexton" style={{ height: 80, objectFit: 'contain' }} />
                  </Box>
                  {/* Stats */}
                  <Grid container spacing={2}>
                    {[
                      { value: BRAND.rating, label: 'Rating' },
                      { value: `${productos.length}`, label: 'Modelos' },
                      { value: '30h', label: 'Batería máx.' },
                      { value: 'BT 5.0', label: 'Conectividad' },
                    ].map((s) => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ borderRadius: '14px', p: 2, background: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                          <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#fde68a', letterSpacing: '-0.02em' }}>{s.value}</Typography>
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

        {/* Wave bottom */}
      </Box>

      {/* ── PRODUCTOS ── */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: '#FBFAF8' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.875rem', md: '2.75rem' },
              letterSpacing: '-0.03em', color: '#0f1923', mb: 1 }}>
              Línea de{' '}
              <Box component="span" sx={{ color: '#C9A86A' }}>
                productos
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#4a5568', maxWidth: 520, mx: 'auto' }}>
              Modelos disponibles a través de los especialistas de la red OírConecta
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {productos.map((p, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ height: '100%', borderRadius: '22px', overflow: 'hidden', bgcolor: '#fff',
                  boxShadow: '0 2px 20px rgba(8,89,70,0.08)', border: '1px solid rgba(8,89,70,0.08)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.28s ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(8,89,70,0.15)' },
                  position: 'relative',
                }}>
                  {p.destacado && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2,
                      px: 1.5, py: 0.5, borderRadius: '8px',
                      background: 'linear-gradient(135deg,#F0B400,#085946)',
                      boxShadow: '0 4px 12px rgba(8,89,70,0.35)' }}>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Destacado</Typography>
                    </Box>
                  )}
                  {/* Product banner */}
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
                        bgcolor: 'rgba(8,89,70,0.08)', color: '#085946', border: '1px solid rgba(8,89,70,0.18)' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', mb: 0.75 }}>{p.nombre}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.6, mb: 2, flexGrow: 1 }}>{p.descripcion}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
                      {p.caracteristicas.slice(0, 3).map((c) => (
                        <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 15, color: '#085946' }} />
                          <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568' }}>{c}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button variant="contained" fullWidth onClick={() => navigate('/contacto?asunto=Solicitud%20de%20información%20-%20Rexton')}
                      sx={{ borderRadius: '12px', fontWeight: 700,
                        background: 'linear-gradient(135deg,#F0B400,#085946)',
                        boxShadow: '0 4px 14px rgba(8,89,70,0.25)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(8,89,70,0.35)' } }}>
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
              <Box component="span" sx={{ color: '#C9A86A' }}>
                avanzada
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#4a5568', maxWidth: 480, mx: 'auto' }}>
              Innovación que se traduce en mejor calidad de vida
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {tecnologias.map((t) => {
              const Icon = t.icon;
              return (
                <Grid item xs={12} sm={6} md={3} key={t.titulo}>
                  <Box sx={{ borderRadius: '22px', p: 3, height: '100%', textAlign: 'center',
                    background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(8,89,70,0.08)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                    transition: 'all 0.28s ease',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 48px rgba(8,89,70,0.14)' } }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '8px', background: t.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                      boxShadow: '0 8px 20px rgba(8,89,70,0.25)' }}>
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
          'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(240,180,0,0.40) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 70% at 80% 40%, rgba(39,47,80,0.50) 0%, transparent 55%),' +
          'linear-gradient(160deg, #5c4400 0%, #5c4400 30%, #272F50 70%, #1a1f38 100%)',
        color: '#fff' }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' },
            letterSpacing: '-0.03em', color: '#fff', mb: 2 }}>
            ¿Listo para escuchar{' '}
            <Box component="span" sx={{ color: '#C9A86A' }}>
              mejor?
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.78)', mb: 5, maxWidth: 500, mx: 'auto', lineHeight: 1.65 }}>
            Un especialista de la red te orienta sobre los modelos Rexton que mejor se adaptan a tu caso.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" endIcon={<ArrowForward />}
              onClick={() => navigate('/contacto?asunto=Solicitud%20de%20información%20-%20Rexton')}
              sx={{ borderRadius: '14px', fontWeight: 800, px: 4, py: 1.75,
                bgcolor: '#fff', color: '#085946',
                boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
                '&:hover': { background: 'rgba(255,255,255,0.92) !important', transform: 'translateY(-2px)' },
                transition: 'all 0.25s ease' }}>
              Agendar valoración
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/audifonos')}
              sx={{ borderRadius: '14px', fontWeight: 700, px: 4, py: 1.625,
                borderColor: 'rgba(255,255,255,0.40)', color: '#fff',
                '&:hover': { borderColor: 'rgba(255,255,255,0.70)', bgcolor: 'rgba(255,255,255,0.08)' } }}>
              Ver más marcas
            </Button>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default AudifonosRextonPage;
