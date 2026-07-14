/**
 * Portal Profesional — "Anúnciate".
 * Catálogo de productos publicitarios + solicitud + métricas de sus campañas.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, Chip, CircularProgress, Alert,
  Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { directoryApi } from '../../services/directoryAccountApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';

const ACCENT = '#6d28d9';
const NAVY = '#0F2A4A';
const MUTED = '#64748b';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.01em' };

const fmtCOP = (n) => `$${(n || 0).toLocaleString('es-CO')}`;
const fmtNum = (n) => (n || 0).toLocaleString('es-CO');

export default function ProfesionalAnunciatePage() {
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState({ totals: { impressions: 0, clicks: 0, leads: 0, ctr: 0 }, byCampaign: [], activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestOpen, setRequestOpen] = useState(null); // { code, label }
  const [requestNotes, setRequestNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const [p, c, m] = await Promise.all([
      directoryApi.get('/api/professional/ads/products'),
      directoryApi.get('/api/professional/ads/me/campaigns'),
      directoryApi.get('/api/professional/ads/me/metrics?days=30'),
    ]);
    if (p.error) { setError(p.error); setLoading(false); return; }
    setProducts(p.data?.data || []);
    setCampaigns(c.data?.data || []);
    setMetrics(m.data?.data || { totals: { impressions: 0, clicks: 0, leads: 0, ctr: 0 }, byCampaign: [], activeCount: 0 });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const submitRequest = async () => {
    if (!requestOpen) return;
    setSending(true);
    const r = await directoryApi.post('/api/professional/ads/me/request', {
      productCode: requestOpen.code,
      notas: requestNotes,
    });
    setSending(false);
    if (r.error) {
      setToast({ sev: 'error', msg: r.error });
      return;
    }
    setToast({ sev: 'success', msg: 'Solicitud enviada. El equipo comercial te contactará.' });
    setRequestOpen(null);
    setRequestNotes('');
    loadAll();
  };

  const hasActive = metrics.activeCount > 0;

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  return (
    <Box>
      <ProfesionalPageHeader
        icon={CampaignOutlinedIcon}
        title="Anúnciate en OírConecta"
        subtitle="Aumenta tu visibilidad con formatos publicitarios diseñados para profesionales del sector auditivo."
      />

      {/* Métricas — solo si el profesional tiene campañas activas o pasadas */}
      {(hasActive || campaigns.length > 0) && (
        <Card sx={{ mb: 3, border: `1px solid #eef0f3`, boxShadow: 'none' }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <TrendingUpOutlinedIcon sx={{ color: ACCENT }} />
              <Typography sx={{ ...SERIF, fontSize: 20, fontWeight: 700, color: NAVY }}>
                Tus métricas (últimos 30 días)
              </Typography>
            </Stack>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Metric label="Impresiones" value={fmtNum(metrics.totals.impressions)} />
              <Metric label="Clics" value={fmtNum(metrics.totals.clicks)} />
              <Metric label="CTR" value={`${metrics.totals.ctr}%`} />
              <Metric label="Leads" value={fmtNum(metrics.totals.leads)} />
            </Grid>
            {metrics.byCampaign.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Campaña</TableCell>
                    <TableCell>Formato</TableCell>
                    <TableCell align="right">Impresiones</TableCell>
                    <TableCell align="right">Clics</TableCell>
                    <TableCell align="right">CTR</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.byCampaign.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, color: MUTED }}>{c.actionLabel}</Typography></TableCell>
                      <TableCell align="right">{fmtNum(c.impressions)}</TableCell>
                      <TableCell align="right">{fmtNum(c.clicks)}</TableCell>
                      <TableCell align="right">{c.ctr}%</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.isActive ? 'Activa' : c.status}
                          color={c.isActive ? 'success' : 'default'}
                          variant={c.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Catálogo de productos */}
      <Typography sx={{ ...SERIF, fontSize: 24, fontWeight: 700, color: NAVY, mb: 1 }}>
        Formatos disponibles
      </Typography>
      <Typography sx={{ color: MUTED, mb: 3 }}>
        Elige el formato que se ajuste a tus objetivos. Un asesor te contactará para cotizar y activar.
      </Typography>

      <Grid container spacing={2}>
        {products.map((p) => (
          <Grid item xs={12} md={6} lg={4} key={p.code}>
            <Card sx={{ height: '100%', border: `1px solid #eef0f3`, boxShadow: 'none', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Chip size="small" label={p.categoria} sx={{ mb: 1.5, bgcolor: '#faf5ff', color: ACCENT, fontWeight: 600 }} />
                <Typography sx={{ ...SERIF, fontSize: 19, fontWeight: 700, color: NAVY, mb: 1 }}>
                  {p.label}
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: 14, mb: 2, minHeight: 60 }}>
                  {p.descripcion}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: 13, color: MUTED }}>Formato: {p.dim}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: NAVY }}>
                    Desde {fmtCOP(p.precioSugeridoCOP)} <Typography component="span" sx={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>/ mes</Typography>
                  </Typography>
                </Stack>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setRequestOpen(p)}
                  sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#5b21b6' } }}
                >
                  Solicitar cotización
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Diálogo de solicitud */}
      <Dialog open={!!requestOpen} onClose={() => setRequestOpen(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...SERIF, color: NAVY }}>
          Solicitar {requestOpen?.label}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" icon={<CheckCircleOutlineIcon />}>
              Un asesor comercial revisará tu solicitud y te contactará en 24-48 horas hábiles con la cotización y opciones de campaña.
            </Alert>
            <TextField
              label="Comentarios (opcional)"
              placeholder="Ej: quiero destacar mi especialidad en tinnitus, presupuesto aprox 1.5M, fecha objetivo..."
              multiline
              minRows={4}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              inputProps={{ maxLength: 600 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestOpen(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            onClick={submitRequest}
            disabled={sending}
            variant="contained"
            sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#5b21b6' } }}
          >
            {sending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {toast && <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}

function Metric({ label, value }) {
  return (
    <Grid item xs={6} md={3}>
      <Box sx={{ p: 2, border: '1px solid #eef0f3', borderRadius: 2 }}>
        <Typography sx={{ fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>{label}</Typography>
        <Typography sx={{ ...SERIF, fontSize: 26, fontWeight: 700, color: NAVY }}>{value}</Typography>
      </Box>
    </Grid>
  );
}
