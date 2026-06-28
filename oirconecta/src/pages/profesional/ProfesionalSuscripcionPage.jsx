import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Stack, Button, Grid, Divider,
  LinearProgress, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined';
import { directoryApi } from '../../services/directoryAccountApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';

const ACCENT = '#085946';
const NAVY = '#272F50';
const GOLD = '#C9A86A';

const STATUS_META = {
  TRIAL: { label: 'En periodo de prueba', color: '#0369a1', bg: '#e0f2fe' },
  ACTIVE: { label: 'Plan activo', color: '#15803d', bg: '#dcfce7' },
  EXPIRING_SOON: { label: 'Por vencer', color: '#a16207', bg: '#fef3c7' },
  EXPIRED: { label: 'Vencido', color: '#b91c1c', bg: '#fee2e2' },
  PAST_DUE: { label: 'En mora', color: '#991b1b', bg: '#fecaca' },
  SUSPENDED: { label: 'Suspendido', color: '#374151', bg: '#e5e7eb' },
  CANCELED: { label: 'Cancelado', color: '#4b5563', bg: '#f3f4f6' },
  PENDING: { label: 'Pago pendiente', color: '#6d28d9', bg: '#ede9fe' },
};

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

export default function ProfesionalSuscripcionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState(null);

  const reload = () => {
    directoryApi.get('/api/subscriptions/me')
      .then((r) => { if (r.data?.success) setData(r.data.data); })
      .catch(() => {});
  };

  const handleCancel = async () => {
    setWorking(true);
    try {
      const r = await directoryApi.post('/api/subscriptions/me/cancel', { motivo, immediate: false });
      if (r.data?.success) {
        setToast({ severity: 'success', msg: 'Tu suscripción se canceló. Te enviamos un correo de despedida y conservas acceso hasta el vencimiento.' });
        setCancelOpen(false); setMotivo('');
        reload();
      } else {
        setToast({ severity: 'error', msg: r.data?.error || 'No se pudo cancelar' });
      }
    } catch (e) {
      setToast({ severity: 'error', msg: e?.response?.data?.error || 'Error de red' });
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    directoryApi.get('/api/subscriptions/me')
      .then((r) => { if (r.data?.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;
  }
  if (!data) {
    return <Alert severity="error" sx={{ m: 3 }}>No se pudo cargar tu suscripción.</Alert>;
  }

  const s = data.subscription;
  const meta = STATUS_META[s.status] || STATUS_META.TRIAL;
  const totalDuracion = Math.ceil((new Date(s.currentPeriodEnd) - new Date(s.currentPeriodStart)) / (1000 * 60 * 60 * 24));
  const progress = Math.max(0, Math.min(100, ((totalDuracion - s.diasRestantes) / totalDuracion) * 100));

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <ProfesionalPageHeader
        icon={WorkspacePremiumOutlined}
        title="Mi suscripción"
        subtitle="Estado, vigencia y planes disponibles"
      />

      {/* Card principal de estado */}
      <Card sx={{
        borderRadius: 2.5, mb: 3, overflow: 'hidden',
        border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
      }}>
        <Box sx={{ px: 3, py: 2.25, borderBottom: '1px solid #f0f2f4' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
            <Box>
              <Typography sx={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, mb: 0.25 }}>
                Plan actual
              </Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.15, color: NAVY }}>
                {s.plan?.nombre}
              </Typography>
            </Box>
            <Chip label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.75rem', px: 1, height: 26 }} />
          </Stack>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                Inicio
              </Typography>
              <Typography sx={{ fontWeight: 700, color: NAVY }}>{fmtDate(s.currentPeriodStart)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                Vence
              </Typography>
              <Typography sx={{ fontWeight: 700, color: NAVY }}>{fmtDate(s.currentPeriodEnd)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                Días restantes
              </Typography>
              <Typography sx={{ fontWeight: 800, color: s.diasRestantes <= 15 ? '#b91c1c' : ACCENT, fontSize: '1.25rem' }}>
                {s.diasRestantes}d
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
                Próximo cobro
              </Typography>
              <Typography sx={{ fontWeight: 700, color: NAVY }}>{fmtDate(s.nextChargeAt)}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <LinearProgress variant="determinate" value={progress}
              sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})` } }} />
            <Typography sx={{ mt: 1, fontSize: '0.75rem', color: '#94a3b8' }}>
              {Math.round(progress)}% del periodo consumido
            </Typography>
          </Box>

          {s.status === 'TRIAL' && (
            <Alert severity="info" sx={{ mt: 3, borderRadius: '8px' }}>
              Estás disfrutando de tu prueba gratuita de 120 días. Al vencer, elige un plan para mantener tu perfil activo.
            </Alert>
          )}
          {(s.status === 'PAST_DUE' || s.status === 'SUSPENDED') && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: '8px' }}>
              {s.status === 'SUSPENDED'
                ? 'Tu perfil está suspendido por falta de pago. Renueva para reactivarlo.'
                : `Llevas ${s.diasMora} día(s) sin pago. Renueva pronto para evitar suspensión.`}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Planes disponibles */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, mb: 2, letterSpacing: '-0.01em' }}>
        Planes disponibles
      </Typography>
      {data.perfil?.personaTipo === 'JURIDICA' && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
          Tu cuenta está registrada como <strong>empresa o centro</strong>: la facturación es de $20.000 mensuales por cada sede registrada.
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {data.plansDisponibles?.map((p) => {
          const isAnual = p.code === 'ANUAL';
          const isEmpresa = p.code === 'EMPRESA';
          const highlight = isAnual; // solo anual tiene badge "mejor valor"
          const sedeCount = p.detalle?.sedeCount || 1;
          return (
            <Grid item xs={12} md={isEmpresa ? 12 : 6} key={p.id}>
              <Card sx={{
                borderRadius: '14px', border: highlight ? `2px solid ${GOLD}` : '1px solid #e5e7eb',
                position: 'relative', height: '100%',
              }}>
                {highlight && (
                  <Chip label="MEJOR VALOR" size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, bgcolor: GOLD, color: '#fff', fontWeight: 800, fontSize: '0.65rem' }} />
                )}
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, mb: 0.5 }}>
                    {isEmpresa ? 'Empresa o centro' : isAnual ? 'Anual' : 'Mensual'}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: NAVY }}>
                      {fmtCOP(p.precioCOP)}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      / {isAnual ? 'año' : 'mes'}
                    </Typography>
                  </Stack>
                  {isEmpresa && p.detalle && (
                    <Typography sx={{ fontSize: '0.8125rem', color: NAVY, mb: 0.5, fontWeight: 600 }}>
                      {fmtCOP(p.detalle.unitCOP)} × {sedeCount} sede{sedeCount === 1 ? '' : 's'}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 2 }}>
                    + IVA 19% → total {fmtCOP(p.totalCOP)}
                  </Typography>

                  <Stack spacing={0.75} sx={{ mb: 3 }}>
                    {(p.beneficios || []).map((b) => (
                      <Stack key={b} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleOutlineIcon sx={{ color: ACCENT, fontSize: 18, mt: '2px' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>{b}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button fullWidth variant="contained" disabled
                    startIcon={<HourglassEmptyIcon />}
                    sx={{
                      background: highlight ? `linear-gradient(135deg, ${GOLD}, #B7835A)` : ACCENT,
                      borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                      '&.Mui-disabled': { background: '#cbd5e1', color: '#64748b' },
                    }}>
                    Pagos disponibles pronto (Wompi)
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Historial */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, mb: 2, letterSpacing: '-0.01em' }}>
        Historial de pagos
      </Typography>
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        {data.payments?.length > 0 ? (
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                {['Fecha', 'Método', 'Total', 'Referencia'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDate(p.paidAt)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{p.metodo || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{fmtCOP(p.totalCOP)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.gatewayRef || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            <Typography>Aún no hay pagos registrados.</Typography>
          </Box>
        )}
      </Card>

      {/* Cancelación */}
      {s.status !== 'CANCELED' && !s.cancelAtPeriodEnd && (
        <Box sx={{ mt: 6, p: 3, borderRadius: '12px', border: '1px dashed #cbd5e1', bgcolor: '#fafbfc' }}>
          <Typography sx={{ fontWeight: 700, color: NAVY, mb: 0.5 }}>
            ¿Necesitas pausar o cancelar?
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mb: 2 }}>
            Puedes darte de baja en cualquier momento. Conservas acceso hasta la fecha de vencimiento y no perdemos tu información — si decides volver, todo sigue ahí.
          </Typography>
          <Button onClick={() => setCancelOpen(true)} variant="outlined"
            startIcon={<PersonOffOutlinedIcon />}
            sx={{ borderColor: '#cbd5e1', color: '#475569', borderRadius: '8px', textTransform: 'none', fontWeight: 600,
              '&:hover': { borderColor: '#b91c1c', color: '#b91c1c', bgcolor: '#fef2f2' } }}>
            Darme de baja
          </Button>
        </Box>
      )}
      {s.cancelAtPeriodEnd && (
        <Alert severity="warning" sx={{ mt: 6, borderRadius: '8px' }}>
          Tu suscripción se cancelará el <strong>{fmtDate(s.currentPeriodEnd)}</strong>. Si cambias de opinión, escríbenos a conversemos@oirconecta.com.
        </Alert>
      )}

      <Dialog open={cancelOpen} onClose={() => !working && setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>¿Seguro que quieres darte de baja?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Conservarás acceso hasta el <strong>{fmtDate(s.currentPeriodEnd)}</strong>. Después de esa fecha, tu perfil dejará de aparecer en el directorio público.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            No perdemos tu información. Si decides volver, tu perfil, reseñas e historial estarán esperándote.
          </Alert>
          <TextField fullWidth multiline rows={3} label="¿Nos dejas saber qué pasó? (opcional)"
            value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="Tu opinión nos ayuda a mejorar." />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={working}>Mantener suscripción</Button>
          <Button onClick={handleCancel} disabled={working} variant="contained"
            startIcon={working ? <CircularProgress size={16} color="inherit" /> : <PersonOffOutlinedIcon />}
            sx={{ background: '#b91c1c', '&:hover': { background: '#991b1b' } }}>
            Confirmar baja
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={6000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: '8px' }}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
