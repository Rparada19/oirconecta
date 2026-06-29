/**
 * Página de favoritos del visitante — anónima, persistida en localStorage.
 * Lista los profesionales que marcó como favoritos. Carga los datos públicos
 * de cada uno.
 */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Button, CircularProgress } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getFavorites } from '../utils/favoriteProfiles';
import DirectoryProfessionalCard from '../components/directorio/DirectoryProfessionalCard';
import { fetchDirectoryProfilePublic } from '../services/directorySearchService';

export default function FavoritosPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavorites();
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(
      ids.map((id) => fetchDirectoryProfilePublic(id).catch(() => null))
    ).then((arr) => {
      setProfiles(arr.filter(Boolean));
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>Mis favoritos | OírConecta</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <Box sx={{ minHeight: '60vh', bgcolor: '#f8fafc', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{
              width: 42, height: 42, borderRadius: 2,
              bgcolor: '#fee2e2', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FavoriteBorder sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#041a12', lineHeight: 1.2 }}>
                Mis favoritos
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#5b6b7a' }}>
                Profesionales que guardaste para volver a verlos
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#085946' }} />
            </Box>
          ) : profiles.length === 0 ? (
            <Box sx={{
              bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5,
              p: { xs: 4, md: 6 }, textAlign: 'center',
            }}>
              <FavoriteBorder sx={{ fontSize: 48, color: 'rgba(239,68,68,0.30)', mb: 1.5 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#041a12', mb: 0.5 }}>
                Aún no tienes favoritos
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#5b6b7a', mb: 2.5, maxWidth: 480, mx: 'auto' }}>
                Cuando visites un perfil del directorio, toca el corazón para guardarlo aquí.
              </Typography>
              <Button component={RouterLink} to="/directorio/listado" variant="contained"
                sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#064a38' } }}>
                Explorar directorio
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {profiles.map((p) => (
                <DirectoryProfessionalCard key={p.id} profile={p} />
              ))}
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}
