import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box, Typography, Button, Breadcrumbs, Link, Grid, Card, TextField, Checkbox, FormControlLabel, MenuItem, Select, InputLabel, FormControl, Container } from '@mui/material';

// Imágenes de ejemplo para Resound
const resoundLogo = '/logos/marcas/Resound-logo.png.webp';
const heroImg = 'https://www.resound.com/-/media/websites/resound/global/images/products/hearing-aids/one/rs_one_family_hero.jpg';
const resoundProduct1 = 'https://www.resound.com/-/media/websites/resound/global/images/products/hearing-aids/one/rs_one_rie_product.png';
const resoundProduct2 = 'https://www.resound.com/-/media/websites/resound/global/images/products/hearing-aids/linx-quattro/rs_linx_quattro_rie_product.png';
const resoundProduct3 = 'https://www.resound.com/-/media/websites/resound/global/images/products/hearing-aids/enzo-q/rs_enzo_q_bte_product.png';

const productos = [
  {
    nombre: 'ReSound ONE',
    imagen: resoundProduct1,
    categoria: 'RIC',
    caracteristicas: [
      'Tecnología M&RIE para sonido natural',
      'Recargable y resistente al agua',
      'Conectividad Bluetooth',
      'App ReSound Smart 3D'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'M&RIE, Bluetooth, Recargable',
  },
  {
    nombre: 'ReSound LiNX Quattro',
    imagen: resoundProduct2,
    categoria: 'RIC',
    caracteristicas: [
      'Sonido claro y brillante',
      'Recargable',
      'Conectividad avanzada',
      'App ReSound Smart 3D'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'LiNX, Recargable, App',
  },
  {
    nombre: 'ReSound ENZO Q',
    imagen: resoundProduct3,
    categoria: 'BTE',
    caracteristicas: [
      'Potencia para pérdidas severas',
      'Sonido natural y potente',
      'Bluetooth y app',
      'Recargable y robusto'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'ENZO, Bluetooth, Recargable',
  },
];

const categorias = [
  {
    nombre: 'RIC',
    titulo: 'Receptor-en-el-canal',
    descripcion: 'Audífonos discretos y potentes, ideales para la mayoría de las pérdidas auditivas.',
    imagen: resoundProduct1,
    cta: 'Descubra',
    url: 'https://www.resound.com/es-es/hearing-aids'
  },
  {
    nombre: 'BTE',
    titulo: 'Detrás de la oreja',
    descripcion: 'Audífonos robustos y cómodos, recomendados para pérdidas auditivas de moderadas a profundas.',
    imagen: resoundProduct3,
    cta: 'Descubra',
    url: 'https://www.resound.com/es-es/hearing-aids'
  }
];

const modelos = [
  {
    nombre: 'ReSound ONE',
    descripcion: 'Audífono con tecnología M&RIE para un sonido más natural y personalizado.',
    imagen: resoundProduct1,
    url: 'https://www.resound.com/es-es/hearing-aids/one'
  },
  {
    nombre: 'ReSound LiNX Quattro',
    descripcion: 'Sonido claro, brillante y conectividad avanzada.',
    imagen: resoundProduct2,
    url: 'https://www.resound.com/es-es/hearing-aids/linx-quattro'
  },
  {
    nombre: 'ReSound ENZO Q',
    descripcion: 'Potencia y claridad para pérdidas severas, con conectividad total.',
    imagen: resoundProduct3,
    url: 'https://www.resound.com/es-es/hearing-aids/enzo-q'
  }
];

const beneficios = [
  'Tecnología M&RIE para sonido natural y personalizado.',
  'Recargables y resistentes al agua.',
  'Conectividad Bluetooth y app ReSound Smart 3D.',
  'Soluciones para pérdidas severas y profundas.',
  'Sonido claro y brillante en cualquier ambiente.',
  'App para control total desde el móvil.',
  'Diseño robusto y discreto.',
  'Compatibilidad con accesorios y micrófonos ReSound.'
];

const accesorios = [
  {
    nombre: 'ReSound TV Streamer 2',
    descripcion: 'Transmite el sonido de la TV directamente a los audífonos.',
    icono: '📺',
    url: '/contacto'
  },
  {
    nombre: 'ReSound Multi Mic',
    descripcion: 'Micrófono inalámbrico para conversaciones en ambientes ruidosos.',
    icono: '🎤',
    url: '/contacto'
  },
  {
    nombre: 'App ReSound Smart 3D',
    descripcion: 'Control total de los audífonos desde el móvil.',
    icono: '📱',
    url: '/contacto'
  }
];

const accesoriosDetallados = [
  {
    nombre: 'Cargador ReSound',
    descripcion: 'Cargador rápido y elegante para audífonos recargables ReSound.',
    icono: '🔋',
    url: '/contacto'
  },
  {
    nombre: 'Micrófono remoto',
    descripcion: 'Mejora la audición en ambientes ruidosos.',
    icono: '🎙️',
    url: '/contacto'
  },
  {
    nombre: 'Pilas y consumibles',
    descripcion: 'Pilas y repuestos originales ReSound.',
    icono: '🔋',
    url: '/contacto'
  }
];

export default function AudifonosResoundPage() {
  const [productoInteres, setProductoInteres] = useState(productos[0].nombre);
  const [tipoConsulta, setTipoConsulta] = useState('Información');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaInfo, setAceptaInfo] = useState(false);

  return (
    <>
      <Header />
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: 12, pb: 0 }}>
        <Container maxWidth="lg">
          {/* HERO SECTION */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            mb: 8,
            p: { xs: 2, md: 4 },
            borderRadius: 6,
            boxShadow: '0 8px 32px rgba(8,89,70,0.10)',
            background: 'linear-gradient(120deg, #fff 60%, #e6f4ee 100%)'
          }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <img src={resoundLogo} alt="ReSound Logo" style={{ height: 60, marginRight: 18 }} />
                <Typography variant="h3" fontWeight={800} color="#272F50" sx={{ letterSpacing: -1 }}>
                  Descubre ReSound en Oir Conecta
                </Typography>
              </Box>
              <Typography variant="h5" color="#272F50" mb={3} fontWeight={400}>
                Audífonos con tecnología M&RIE, recargables y conectividad total para una experiencia auditiva personalizada.
              </Typography>
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link underline="hover" color="inherit" href="/">
                  Inicio
                </Link>
                <Link underline="hover" color="inherit" href="/audifonos">
                  Audífonos
                </Link>
                <Typography color="#272F50">ReSound</Typography>
              </Breadcrumbs>
              <Button variant="contained" size="large" sx={{ mt: 1, px: 5, py: 1.5, fontWeight: 700, fontSize: 18, borderRadius: 3, bgcolor: '#A50034', boxShadow: '0 2px 8px rgba(8,89,70,0.10)' }} href="#formulario">
                Solicitar Información
              </Button>
            </Box>
            <Box sx={{ flex: 1, minWidth: 320, display: 'flex', justifyContent: 'center' }}>
              <img src={heroImg} alt="Audífono ReSound principal" style={{ width: '100%', maxWidth: 420, borderRadius: 32, boxShadow: '0 8px 32px rgba(8,89,70,0.10)' }} />
            </Box>
          </Box>

          {/* PROPUESTA DE VALOR Y MISIÓN */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant="h2" fontWeight={800} color="#272F50" mb={2}>
              Escucha tu mundo con ReSound
            </Typography>
            <Typography variant="h5" color="#085946" mb={2}>
              ReSound combina innovación, conectividad y personalización para que vivas cada momento con claridad y confianza.
            </Typography>
            <Typography variant="h6" color="#272F50" fontWeight={600}>
              Tecnología M&RIE, recargables y app Smart 3D para cada necesidad auditiva.
            </Typography>
          </Box>

          {/* CATEGORÍAS DE AUDÍFONOS */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Categorías de audífonos ReSound
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {categorias.map((cat, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={cat.imagen} alt={cat.nombre} style={{ height: 90, marginBottom: 18 }} />
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{cat.titulo}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{cat.descripcion}</Typography>
                    <Button variant="outlined" href={cat.url} target="_blank" sx={{ borderColor: '#A50034', color: '#A50034', fontWeight: 600, borderRadius: 2 }}>{cat.cta}</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* MODELOS DESTACADOS */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Modelos destacados
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {modelos.map((mod, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={mod.imagen} alt={mod.nombre} style={{ height: 90, marginBottom: 18 }} />
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{mod.nombre}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{mod.descripcion}</Typography>
                    <Button variant="outlined" href={mod.url} target="_blank" sx={{ borderColor: '#A50034', color: '#A50034', fontWeight: 600, borderRadius: 2 }}>Ver más</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* BENEFICIOS Y TECNOLOGÍAS (CARRUSEL) */}
          <Box sx={{ mb: 8, p: { xs: 2, md: 4 }, borderRadius: 6, bgcolor: '#fff', boxShadow: '0 2px 16px rgba(8,89,70,0.06)' }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Beneficios y tecnologías ReSound
            </Typography>
            <Box
              sx={{
                display: 'flex',
                overflowX: 'auto',
                gap: 3,
                scrollSnapType: 'x mandatory',
                pb: 2,
                px: 1,
                '::-webkit-scrollbar': { display: 'none' }
              }}
            >
              {beneficios.map((benef, idx) => (
                <Box
                  key={idx}
                  sx={{
                    minWidth: { xs: 260, sm: 320 },
                    maxWidth: 340,
                    flex: '0 0 auto',
                    bgcolor: '#f8fafc',
                    borderRadius: 4,
                    p: 3,
                    boxShadow: '0 1px 8px rgba(8,89,70,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#272F50',
                    scrollSnapAlign: 'center',
                    textAlign: 'center',
                    transition: 'background 0.3s, color 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#A50034',
                      color: '#fff',
                    },
                  }}
                >
                  {benef}
                </Box>
              ))}
            </Box>
          </Box>

          {/* ACCESORIOS Y APPS */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Accesorios y aplicaciones ReSound
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {accesorios.map((acc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={40} mb={1}>{acc.icono}</Typography>
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{acc.nombre}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{acc.descripcion}</Typography>
                    <Button variant="outlined" href={acc.url} sx={{ borderColor: '#A50034', color: '#A50034', fontWeight: 600, borderRadius: 2 }}>Más información</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* ACCESORIOS DETALLADOS RESOUND */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Accesorios oficiales ReSound
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {accesoriosDetallados.map((acc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={40} mb={1}>{acc.icono}</Typography>
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{acc.nombre}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{acc.descripcion}</Typography>
                    <Button variant="outlined" href={acc.url} sx={{ borderColor: '#A50034', color: '#A50034', fontWeight: 600, borderRadius: 2 }}>Más información</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* PRUEBA DE AUDICIÓN ONLINE */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Button variant="contained" size="large" href="https://www.resound.com/es-es/online-hearing-test" target="_blank" sx={{ bgcolor: '#A50034', px: 6, py: 2, fontWeight: 700, fontSize: 20, borderRadius: 3, boxShadow: '0 2px 8px rgba(8,89,70,0.10)' }}>
              Realizar prueba de audición online
            </Button>
          </Box>

          {/* ENLACES ÚTILES */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="#085946" mb={2}>
              Más información y recursos oficiales:
            </Typography>
            <Button variant="text" href="https://www.resound.com/es-es/hearing-aids" target="_blank" sx={{ color: '#A50034', fontWeight: 600, fontSize: 16 }}>
              Página oficial de audífonos ReSound
            </Button>
          </Box>

          {/* FORMULARIO DE CONTACTO */}
          <Box id="formulario" sx={{ mb: 8, p: { xs: 2, md: 4 }, borderRadius: 6, bgcolor: '#fff', boxShadow: '0 2px 16px rgba(8,89,70,0.06)' }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Solicitar información sobre ReSound
            </Typography>
            <Box component="form" sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Nombre" fullWidth required variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" type="email" fullWidth required variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Teléfono" fullWidth required variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Ciudad" fullWidth required variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Producto de interés</InputLabel>
                    <Select value={productoInteres} onChange={e => setProductoInteres(e.target.value)} label="Producto de interés">
                      {productos.map((prod, idx) => (
                        <MenuItem value={prod.nombre} key={idx}>{prod.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de consulta</InputLabel>
                    <Select value={tipoConsulta} onChange={e => setTipoConsulta(e.target.value)} label="Tipo de consulta">
                      <MenuItem value="Información">Información</MenuItem>
                      <MenuItem value="Cotización">Cotización</MenuItem>
                      <MenuItem value="Cita">Cita</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Mensaje" multiline rows={3} fullWidth variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} />}
                    label="Acepto términos de Oir Conecta"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={aceptaInfo} onChange={e => setAceptaInfo(e.target.checked)} />}
                    label="Deseo recibir información de Oir Conecta"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" size="large" sx={{ bgcolor: '#A50034', borderRadius: 3, fontWeight: 700, fontSize: 18, px: 5, py: 1.5 }}>
                    Enviar solicitud
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>
      
      <Footer />
    </>
  );
} 