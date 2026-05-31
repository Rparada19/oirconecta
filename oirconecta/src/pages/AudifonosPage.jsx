import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Button, Chip } from '@mui/material';
import { Star } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingCardMedia from '../components/marketing/MarketingCardMedia';
import SeoBreadcrumbs from '../components/seo/SeoBreadcrumbs';

const AudifonosPage = () => {
  const navigate = useNavigate();

  const marcas = [
    {
      nombre: 'Widex',
      slug: 'widex',
      descripcion: 'Sonido natural y conectividad; líneas para distintos grados de pérdida.',
      caracteristicas: ['IA y personalización', 'Bluetooth', 'Recargables'],
      rating: 4.8,
      gradient: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
    },
    {
      nombre: 'Oticon',
      slug: 'oticon',
      descripcion: 'Enfoque BrainHearing™ y amplia gama RIC, BTE e ITE.',
      caracteristicas: ['BrainHearing', 'Streaming', 'Diseño discreto'],
      rating: 4.7,
      gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      nombre: 'Signia',
      slug: 'signia',
      descripcion: 'Procesamiento avanzado y estilos rechargeables y miniaturizados.',
      caracteristicas: ['Own Voice', 'Motion', 'Wireless'],
      rating: 4.9,
      gradient: 'linear-gradient(135deg, #0a4d3c 0%, #71A095 100%)',
    },
    {
      nombre: 'Phonak',
      slug: 'phonak',
      descripcion: 'Roger™, AutoSense y soluciones para entornos exigentes.',
      caracteristicas: ['Roger', 'Conectividad', 'AutoSense'],
      rating: 4.6,
      gradient: 'linear-gradient(135deg, #1a2744 0%, #085946 100%)',
    },
    {
      nombre: 'ReSound',
      slug: 'resound',
      descripcion: 'Direccionalidad y apps para control fino del listening.',
      caracteristicas: ['Smart Hearing', 'Wireless', 'Apps'],
      rating: 4.5,
      gradient: 'linear-gradient(135deg, #085946 0%, #272F50 100%)',
    },
    {
      nombre: 'Starkey',
      slug: 'starkey',
      descripcion: 'IA en salud auditiva y diseños custom y RIC.',
      caracteristicas: ['Evolv / salud', 'Custom', 'Recargable'],
      rating: 4.8,
      gradient: 'linear-gradient(135deg, #71A095 0%, #085946 100%)',
    },
    {
      nombre: 'Beltone',
      slug: 'beltone',
      descripcion: 'Canales Beltone con soporte y seguimiento cercano.',
      caracteristicas: ['Adaptación', 'App', 'Gama amplia'],
      rating: 4.6,
      gradient: 'linear-gradient(135deg, #272F50 0%, #71A095 100%)',
    },
    {
      nombre: 'Rexton',
      slug: 'rexton',
      descripcion: 'Relación calidad-precio y opciones BTE/RIC.',
      caracteristicas: ['Robusto', 'Conectividad', 'Variedad'],
      rating: 4.5,
      gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
    },
    {
      nombre: 'AudioService',
      slug: 'audioservice',
      descripcion: 'Fabricante europeo con foco en confort y claridad.',
      caracteristicas: ['Nexus / familias', 'Discreto', 'Bluetooth'],
      rating: 4.5,
      gradient: 'linear-gradient(135deg, #1a3d4a 0%, #272F50 100%)',
    },
    {
      nombre: 'Bernafon',
      slug: 'bernafon',
      descripcion: 'Tecnología suiza Dyn™ y adaptación progresiva.',
      caracteristicas: ['Dyn', 'Zerena', 'Conectividad'],
      rating: 4.6,
      gradient: 'linear-gradient(135deg, #085946 0%, #1a2744 100%)',
    },
    {
      nombre: 'Hansaton',
      slug: 'hansaton',
      descripcion: 'Diseño y acústica alineados con el grupo Sonova.',
      caracteristicas: ['RIC/BTE', 'Recargable', 'App'],
      rating: 4.5,
      gradient: 'linear-gradient(135deg, #71A095 0%, #272F50 100%)',
    },
    {
      nombre: 'Sonic',
      slug: 'sonic',
      descripcion: 'Speech Variable Processing™ y líneas para uso diario.',
      caracteristicas: ['SVP', 'Claridad', 'Bluetooth'],
      rating: 4.5,
      gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
    },
    {
      nombre: 'Unitron',
      slug: 'unitron',
      descripcion: 'Flex:trial™ y gamas Blu / Discover para probar antes de decidir.',
      caracteristicas: ['Flex:trial', 'App', 'Recargable'],
      rating: 4.6,
      gradient: 'linear-gradient(135deg, #1a2744 0%, #71A095 100%)',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Audífonos - Red OírConecta | Marcas y orientación</title>
        <meta
          name="description"
          content="Información sobre marcas de audífonos y enlaces a especialistas de la red OírConecta en Colombia."
        />
      </Helmet>

      <Header />

      <Container maxWidth="lg" sx={{ pt: 10 }}>
        <SeoBreadcrumbs items={[
          { label: 'Inicio', to: '/' },
          { label: 'Audífonos' },
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
            Audífonos en{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              la red
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
            La red reúne profesionales que trabajan con distintas marcas. La elección del modelo depende de tu audiometría, estilo de vida y presupuesto.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={3}>
          {marcas.map((marca) => (
            <Grid item xs={12} sm={6} md={4} key={marca.slug}>
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
                  <MarketingCardMedia title={marca.nombre} subtitle="Marca disponible" gradient={marca.gradient} />
                  <Box sx={{
                    position: 'absolute', top: 10, right: 10,
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    bgcolor: 'rgba(255,255,255,0.95)', px: 1.25, py: 0.5,
                    borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    <Star sx={{ fontSize: 15, color: '#f59e0b' }} />
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
                  <Button variant="contained" fullWidth onClick={() => navigate(`/audifonos/${marca.slug}`)}
                    sx={{ borderRadius: '12px', fontWeight: 700,
                      background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                      boxShadow: '0 6px 18px rgba(8,89,70,0.25)',
                      '&:hover': { boxShadow: '0 8px 24px rgba(8,89,70,0.35)' } }}>
                    Ver información
                  </Button>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8, p: 4, borderRadius: '22px',
          background: 'rgba(8,89,70,0.05)', border: '1px solid rgba(8,89,70,0.12)' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1 }}>
            ¿Cuál es el audífono para ti?
          </Typography>
          <Typography sx={{ color: '#4a5568', mb: 3 }}>Un especialista de la red te orienta en consulta según tu audiometría</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" size="large" onClick={() => navigate('/agendar')}
              sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '1rem', px: 4, py: 1.5,
                borderColor: '#085946', color: '#085946', borderWidth: 2,
                '&:hover': { borderWidth: 2, bgcolor: 'rgba(8,89,70,0.05)' } }}>
              Agendar valoración
            </Button>
            <Button variant="contained" size="large" onClick={() => navigate('/contacto')}
              sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '1rem', px: 4, py: 1.5,
                background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                boxShadow: '0 6px 18px rgba(8,89,70,0.25)',
                '&:hover': { boxShadow: '0 8px 24px rgba(8,89,70,0.35)' } }}>
              Escribirnos
            </Button>
          </Box>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default AudifonosPage;
