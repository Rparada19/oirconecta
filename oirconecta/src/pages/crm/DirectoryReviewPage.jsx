import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { api } from '../../services/apiClient';
import { DIRECTORY_API } from '../../config/directoryApi';

export default function DirectoryReviewPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const q = filter ? `?status=${encodeURIComponent(filter)}` : '';
    const { data, error: err } = await api.get(`${DIRECTORY_API.adminProfiles}${q}`);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setList(data?.data || []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (accountId, status) => {
    const { error: err } = await api.patch(DIRECTORY_API.adminProfileStatus(accountId), { status });
    if (err) {
      setError(err);
      return;
    }
    load();
  };

  return (
    <>
      <Header />
      <Box sx={{ pt: { xs: 12, md: 14 }, pb: 6, minHeight: '70vh', bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#085946' }}>
            Revisión — directorio público
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Aprueba o rechaza fichas de profesionales registrados. El contenido detallado (aliados, estudios, multimedia) se
            edita desde la cuenta del profesional.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {['PENDING', 'APPROVED', 'REJECTED', ''].map((f) => (
              <Button
                key={f || 'all'}
                size="small"
                variant={filter === f ? 'contained' : 'outlined'}
                onClick={() => setFilter(f)}
                sx={{ bgcolor: filter === f ? '#085946' : undefined }}
              >
                {f === '' ? 'Todos' : f}
              </Button>
            ))}
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {list.length === 0 ? (
                <Typography color="text.secondary">No hay registros.</Typography>
              ) : (
                list.map((row) => (
                  <Paper key={row.id} sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography fontWeight={700}>{row.account?.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.account?.email}
                        </Typography>
                        <Chip label={row.status} size="small" sx={{ mt: 1 }} />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" color="success" onClick={() => setStatus(row.accountId, 'APPROVED')}>
                          Aprobar
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => setStatus(row.accountId, 'REJECTED')}>
                          Rechazar
                        </Button>
                        <Button size="small" onClick={() => setStatus(row.accountId, 'PENDING')}>
                          Pendiente
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}
