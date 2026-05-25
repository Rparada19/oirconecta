import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Container, Typography, Grid, Card, CardContent, CardMedia, FormControl, InputLabel,
  Select, MenuItem, Box, Chip, Divider, CircularProgress,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const formatPrice = (p) => (p == null ? 'Consultar' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p));

const Section = ({ icon, title, text, color }) => (
  text ? (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color }}>{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{text}</Typography>
    </Box>
  ) : null
);

export default function ComparadorPage() {
  const [items, setItems] = useState([]);
  const [facetas, setFacetas] = useState({ marcas: [], tecnologias: [], plataformas: [] });
  const [loading, setLoading] = useState(true);
  const [marca, setMarca] = useState('');
  const [tecnologia, setTecnologia] = useState('');
  const [plataforma, setPlataforma] = useState('');

  useEffect(() => {
    const base = getApiBaseUrl();
    Promise.all([
      fetch(`${base}/api/comparador`).then((r) => r.json()).catch(() => ({})),
      fetch(`${base}/api/comparador/facetas`).then((r) => r.json()).catch(() => ({})),
    ]).then(([list, fac]) => {
      setItems(list?.data || []);
      if (fac?.data) setFacetas(fac.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => items.filter((it) =>
    (!marca || it.marca === marca) &&
    (!tecnologia || it.tecnologia === tecnologia) &&
    (!plataforma || it.plataforma === plataforma)
  ), [items, marca, tecnologia, plataforma]);

  return (
    <>
      <Helmet>
        <title>Comparador de audífonos | OírConecta</title>
        <meta name="description" content="Compara marcas, tecnologías y plataformas de audífonos: fortalezas, debilidades, usos, consejos y precios reales de referencia en Colombia." />
        <link rel="canonical" href="https://oirconecta.com/comparador" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ height: '80px' }} />

        <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, color: '#085946', mb: 2 }}>
            Comparador de audífonos
          </Typography>
          <Typography variant="h6" component="p" sx={{ textAlign: 'center', color: '#6b7280', mb: 6, maxWidth: 800, mx: 'auto' }}>
            Selecciona marca, tecnología y plataforma para ver fortalezas, debilidades, usos, consejos y precios reales de referencia.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 5 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Marca</InputLabel>
                <Select value={marca} label="Marca" onChange={(e) => setMarca(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {facetas.marcas.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tecnología</InputLabel>
                <Select value={tecnologia} label="Tecnología" onChange={(e) => setTecnologia(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {facetas.tecnologias.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Plataforma</InputLabel>
                <Select value={plataforma} label="Plataforma" onChange={(e) => setPlataforma(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {facetas.plataformas.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {items.length === 0 ? 'Pronto publicaremos las comparativas.' : 'No hay opciones con esos filtros.'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((it) => (
                <Grid item xs={12} md={6} lg={4} key={it.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
                    {it.imageUrl && <CardMedia component="img" height="160" image={it.imageUrl} alt={`${it.marca} ${it.modelo || ''}`} sx={{ objectFit: 'cover' }} />}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        <Chip label={it.marca} size="small" color="primary" />
                        <Chip label={it.tecnologia} size="small" variant="outlined" />
                        <Chip label={it.plataforma} size="small" variant="outlined" />
                      </Box>
                      {it.modelo && <Typography variant="h6" sx={{ fontWeight: 700 }}>{it.modelo}</Typography>}
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#085946', mb: 1.5 }}>{formatPrice(it.precio)}</Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <Section icon={<CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#10B981' }} />} title="Fortalezas" text={it.fortalezas} color="#10B981" />
                      <Section icon={<ErrorOutlineIcon sx={{ fontSize: 18, color: '#F59E0B' }} />} title="Debilidades" text={it.debilidades} color="#F59E0B" />
                      <Section title="Uso recomendado" text={it.uso} color="#272F50" />
                      <Section title="Consejos" text={it.consejos} color="#085946" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        <Footer />
      </div>
    </>
  );
}
