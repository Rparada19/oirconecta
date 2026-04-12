import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box, Typography, Button, Breadcrumbs, Link, Grid, Card, TextField, Checkbox, FormControlLabel, MenuItem, Select, InputLabel, FormControl, Container } from '@mui/material';

// Imágenes de ejemplo para Unitron
const unitronLogo = '/logos/marcas/unitron-logo.svg';
const heroImg = 'https://www.unitron.com/content/dam/unitron/global/products/blu/blu-hero.jpg';
const unitronProduct1 = 'https://www.unitron.com/content/dam/unitron/global/products/blu/blu-product.png';
const unitronProduct2 = 'https://www.unitron.com/content/dam/unitron/global/products/discover-next/discover-next-product.png';
const unitronProduct3 = 'https://www.unitron.com/content/dam/unitron/global/products/moxi-fit/moxi-fit-product.png';

const productos = [
  {
    nombre: 'Unitron Blu',
    imagen: unitronProduct1,
    categoria: 'RIC',
    caracteristicas: [
      'Tecnología Flex:trial™',
      'Recargable y resistente al agua',
      'Conectividad Bluetooth',
      'App Unitron Remote Plus'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'Blu, Bluetooth, Recargable',
  },
  {
    nombre: 'Unitron Discover Next',
    imagen: unitronProduct2,
    categoria: 'BTE',
    caracteristicas: [
      'Sonido natural y claro',
      'Recargable',
      'App Unitron Remote Plus',
      'Diseño elegante y discreto'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'Discover Next, Recargable, App',
  },
  {
    nombre: 'Unitron Moxi Fit',
    imagen: unitronProduct3,
    categoria: 'ITE',
    caracteristicas: [
      'Diseño personalizado',
      'Conectividad avanzada',
      'App Unitron Remote Plus',
      'Sonido potente y natural'
    ],
    tamanos: 'Mini, Estándar',
    tecnologias: 'Moxi Fit, Bluetooth, App',
  },
];

const categorias = [
  {
    nombre: 'RIC',
    titulo: 'Receptor-en-el-canal',
    descripcion: 'Audífonos discretos y potentes, ideales para la mayoría de las pérdidas auditivas.',
    imagen: unitronProduct1,
    cta: 'Descubra',
    url: 'https://www.unitron.com/es/es_es/productos.html'
  },
  {
    nombre: 'BTE',
    titulo: 'Detrás de la oreja',
    descripcion: 'Audífonos robustos y cómodos, recomendados para pérdidas auditivas de moderadas a profundas.',
    imagen: unitronProduct2,
    cta: 'Descubra',
    url: 'https://www.unitron.com/es/es_es/productos.html'
  },
  {
    nombre: 'ITE',
    titulo: 'En-el-oído',
    descripcion: 'Audífonos personalizados que se adaptan al canal auditivo, casi invisibles.',
    imagen: unitronProduct3,
    cta: 'Descubra',
    url: 'https://www.unitron.com/es/es_es/productos.html'
  }
];

const modelos = [
  {
    nombre: 'Unitron Blu',
    descripcion: 'Audífono con tecnología Flex:trial™, recargable y control total desde la app.',
    imagen: unitronProduct1,
    url: 'https://www.unitron.com/es/es_es/productos/blu.html'
  },
  {
    nombre: 'Unitron Discover Next',
    descripcion: 'Sonido natural y claro con diseño elegante y discreto.',
    imagen: unitronProduct2,
    url: 'https://www.unitron.com/es/es_es/productos/discover-next.html'
  },
  {
    nombre: 'Unitron Moxi Fit',
    descripcion: 'Diseño personalizado, conectividad avanzada y sonido potente.',
    imagen: unitronProduct3,
    url: 'https://www.unitron.com/es/es_es/productos/moxi-fit.html'
  }
];

const beneficios = [
  'Tecnología Flex:trial™ para mejor audición.',
  'Recargables y resistentes al agua.',
  'Conectividad Bluetooth y app Remote Plus.',
  'Soluciones personalizadas y discretas.',
  'Sonido natural y claro en cualquier ambiente.',
  'App Remote Plus para control total.',
  'Diseño elegante y discreto.',
  'Compatibilidad con accesorios Unitron.'
];

const accesorios = [
  {
    nombre: 'Unitron TV Connector',
    descripcion: 'Transmite el sonido de la TV directamente a los audífonos.',
    icono: '📺',
    url: '/contacto'
  },
  {
    nombre: 'Unitron Remote Control',
    descripcion: 'Control remoto para ajustar los audífonos.',
    icono: '🎛️',
    url: '/contacto'
  },
  {
    nombre: 'App Remote Plus',
    descripcion: 'Control total de los audífonos desde el móvil.',
    icono: '📱',
    url: '/contacto'
  }
];

const accesoriosDetallados = [
  {
    nombre: 'Cargador Unitron',
    descripcion: 'Cargador rápido y elegante para audífonos recargables Unitron.',
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
    descripcion: 'Pilas y repuestos originales Unitron.',
    icono: '🔋',
    url: '/contacto'
  }
];

export default function AudifonosUnitronPage() {
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
                <img src={unitronLogo} alt="Unitron Logo" style={{ height: 60, marginRight: 18 }} />
                <Typography variant="h3" fontWeight={800} color="#272F50" sx={{ letterSpacing: -1 }}>
                  Descubre Unitron en Oir Conecta
                </Typography>
              </Box>
              <Typography variant="h5" color="#272F50" mb={3} fontWeight={400}>
                Audífonos con tecnología Flex:trial™, recargables y conectividad total para una experiencia auditiva personalizada.
              </Typography>
              <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link underline="hover" color="inherit" href="/">
                  Inicio
                </Link>
                <Link underline="hover" color="inherit" href="/audifonos">
                  Audífonos
                </Link>
                <Typography color="#272F50">Unitron</Typography>
              </Breadcrumbs>
              <Button variant="contained" size="large" sx={{ mt: 1, px: 5, py: 1.5, fontWeight: 700, fontSize: 18, borderRadius: 3, bgcolor: '#0077C8', boxShadow: '0 2px 8px rgba(8,89,70,0.10)' }} href="#formulario">
                Solicitar Información
              </Button>
            </Box>
            <Box sx={{ flex: 1, minWidth: 320, display: 'flex', justifyContent: 'center' }}>
              <img src={heroImg} alt="Audífono Unitron principal" style={{ width: '100%', maxWidth: 420, borderRadius: 32, boxShadow: '0 8px 32px rgba(8,89,70,0.10)' }} />
            </Box>
          </Box>

          {/* PROPUESTA DE VALOR Y MISIÓN */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant="h2" fontWeight={800} color="#272F50" mb={2}>
              Audición inteligente con Unitron
            </Typography>
            <Typography variant="h5" color="#085946" mb={2}>
              Unitron integra tecnología Flex:trial™, conectividad y diseño para que vivas cada momento con claridad y confianza.
            </Typography>
            <Typography variant="h6" color="#272F50" fontWeight={600}>
              Blu, Discover Next y app Remote Plus para cada necesidad auditiva.
            </Typography>
          </Box>

          {/* CATEGORÍAS DE AUDÍFONOS */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Categorías de audífonos Unitron
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {categorias.map((cat, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={cat.imagen} alt={cat.nombre} style={{ height: 90, marginBottom: 18 }} />
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{cat.titulo}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{cat.descripcion}</Typography>
                    <Button variant="outlined" href={cat.url} target="_blank" sx={{ borderColor: '#0077C8', color: '#0077C8', fontWeight: 600, borderRadius: 2 }}>{cat.cta}</Button>
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
                    <Button variant="outlined" href={mod.url} target="_blank" sx={{ borderColor: '#0077C8', color: '#0077C8', fontWeight: 600, borderRadius: 2 }}>Ver más</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* BENEFICIOS Y TECNOLOGÍAS (CARRUSEL) */}
          <Box sx={{ mb: 8, p: { xs: 2, md: 4 }, borderRadius: 6, bgcolor: '#fff', boxShadow: '0 2px 16px rgba(8,89,70,0.06)' }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Beneficios y tecnologías Unitron
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
                      bgcolor: '#0077C8',
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
              Accesorios y aplicaciones Unitron
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {accesorios.map((acc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={40} mb={1}>{acc.icono}</Typography>
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{acc.nombre}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{acc.descripcion}</Typography>
                    <Button variant="outlined" href={acc.url} sx={{ borderColor: '#0077C8', color: '#0077C8', fontWeight: 600, borderRadius: 2 }}>Más información</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* ACCESORIOS DETALLADOS UNITRON */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Accesorios oficiales Unitron
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {accesoriosDetallados.map((acc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ borderRadius: 6, boxShadow: '0 4px 24px rgba(8,89,70,0.10)', p: 2, bgcolor: '#fff', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography fontSize={40} mb={1}>{acc.icono}</Typography>
                    <Typography variant="h6" fontWeight={700} color="#272F50" mb={1}>{acc.nombre}</Typography>
                    <Typography variant="body2" color="#085946" mb={2} textAlign="center">{acc.descripcion}</Typography>
                    <Button variant="outlined" href={acc.url} sx={{ borderColor: '#0077C8', color: '#0077C8', fontWeight: 600, borderRadius: 2 }}>Más información</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* PRUEBA DE AUDICIÓN ONLINE */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Button variant="contained" size="large" href="https://www.unitron.com/es/es_es/prueba-auditiva.html" target="_blank" sx={{ bgcolor: '#0077C8', px: 6, py: 2, fontWeight: 700, fontSize: 20, borderRadius: 3, boxShadow: '0 2px 8px rgba(8,89,70,0.10)' }}>
              Realizar prueba de audición online
            </Button>
          </Box>

          {/* ENLACES ÚTILES */}
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="#085946" mb={2}>
              Más información y recursos oficiales:
            </Typography>
            <Button variant="text" href="https://www.unitron.com/es/es_es/productos.html" target="_blank" sx={{ color: '#0077C8', fontWeight: 600, fontSize: 16 }}>
              Página oficial de audífonos Unitron
            </Button>
          </Box>

          {/* FORMULARIO DE CONTACTO */}
          <Box id="formulario" sx={{ mb: 8, p: { xs: 2, md: 4 }, borderRadius: 6, bgcolor: '#fff', boxShadow: '0 2px 16px rgba(8,89,70,0.06)' }}>
            <Typography variant="h4" fontWeight={700} color="#272F50" mb={4} textAlign="center">
              Solicitar información sobre Unitron
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
                  <Button variant="contained" color="primary" size="large" sx={{ bgcolor: '#0077C8', borderRadius: 3, fontWeight: 700, fontSize: 18, px: 5, py: 1.5 }}>
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