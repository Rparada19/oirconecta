import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { Star } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MarketingCardMedia from '../components/marketing/MarketingCardMedia';

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

      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
          color: 'white',
          py: 8,
          pt: { xs: 14, md: 16 },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            Audífonos
          </Typography>
          <Typography variant="h5" align="center" sx={{ opacity: 0.95, maxWidth: 800, mx: 'auto' }}>
            La red reúne profesionales que trabajan con distintas marcas. La elección del modelo depende de tu audiometría,
            estilo de vida y presupuesto: quien te atienda en la red te orientará en consulta.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {marcas.map((marca) => (
            <Grid item xs={12} sm={6} md={4} key={marca.slug}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.2)',
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <MarketingCardMedia title={marca.nombre} subtitle="Marca disponible" gradient={marca.gradient} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      bgcolor: 'rgba(255, 255, 255, 0.92)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {marca.rating}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {marca.descripcion}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {marca.caracteristicas.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        size="small"
                        sx={{
                          m: 0.5,
                          bgcolor: '#085946',
                          color: 'white',
                          '&:hover': { bgcolor: '#272F50' },
                        }}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 2,
                      background: 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
                      },
                    }}
                    onClick={() => navigate(`/audifonos/${marca.slug}`)}
                  >
                    Ver información
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button variant="outlined" size="large" onClick={() => navigate('/agendar')} sx={{ mr: 2, borderColor: '#085946', color: '#085946' }}>
            Agendar valoración
          </Button>
          <Button variant="contained" size="large" onClick={() => navigate('/contacto')} sx={{ bgcolor: '#085946' }}>
            Escribirnos
          </Button>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default AudifonosPage;
