import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import Header from '../components/Header';
import Footer from '../components/Footer';
import DirectoryCardV2 from '../components/directorio/v2/DirectoryCardV2';
import DirectoryCardSkeleton from '../components/directorio/v2/DirectoryCardSkeleton';
import { fetchFeaturedByCity, searchDirectoryV2 } from '../services/directoryDiscoveryService';

const PAGE_SIZE = 24;

export default function DirectorioCiudadPage() {
  const { slug } = useParams();
  const [city, setCity] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchFeaturedByCity(slug, 6),
      searchDirectoryV2({ citySlug: slug, limit: PAGE_SIZE }),
    ])
      .then(([fRes, sRes]) => {
        if (cancelled) return;
        if (fRes?.data?.success) {
          setCity(fRes.data.data?.city || null);
          setFeatured(fRes.data.data?.items || []);
        }
        if (sRes?.data?.success) {
          const d = sRes.data.data || {};
          setItems(d.items || []);
          setTotal(d.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const titulo = city ? city.nombre : 'Ciudad';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Helmet>
        <title>{`Profesionales auditivos en ${titulo} | Oír Conecta`}</title>
        <meta
          name="description"
          content={`Audiólogos, fonoaudiólogos y otorrinos verificados en ${titulo}. Reseñas reales, modalidad presencial o virtual.`}
        />
      </Helmet>
      <Header />

      <Box sx={{ pt: { xs: 4, md: 7 }, pb: 4 }}>
        <Container maxWidth="lg">
          <Button
            component={RouterLink}
            to="/directorio"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ mb: 2, textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
          >
            Todo el directorio
          </Button>

          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}
            >
              Directorio · Ciudad
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: 30, md: 44 }, lineHeight: 1.1 }}>
              Profesionales auditivos en {titulo}
            </Typography>
            {city?.departamento && (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {city.departamento} — {total} profesional{total === 1 ? '' : 'es'} verificado
                {total === 1 ? '' : 's'}
              </Typography>
            )}
          </Stack>

          {featured.length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Destacados de la ciudad
              </Typography>
              <Grid container spacing={2}>
                {featured.slice(0, 4).map((p) => (
                  <Grid item xs={12} sm={6} md={3} key={p.id}>
                    <DirectoryCardV2 profile={p} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Todos los profesionales
          </Typography>
          <Grid container spacing={2.5}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`sk-${i}`}>
                    <DirectoryCardSkeleton />
                  </Grid>
                ))
              : items.map((p) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                    <DirectoryCardV2 profile={p} />
                  </Grid>
                ))}
          </Grid>

          {!loading && items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Aún no hay profesionales registrados en {titulo}
              </Typography>
              <Button
                component={RouterLink}
                to="/directorio"
                variant="contained"
                sx={{ mt: 2, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
              >
                Ver todo el directorio
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
