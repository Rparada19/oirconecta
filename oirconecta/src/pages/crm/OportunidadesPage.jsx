/**
 * Oportunidades: cotizaciones abiertas y a quién hay que llamar hoy.
 *
 * Ordena por urgencia (días sin contacto), no por fecha: lo que decide la
 * acción del día es cuánto lleva alguien esperando respuesta.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Container, Grid, Typography, Chip, CircularProgress, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Snackbar, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp, Refresh, WhatsApp, Phone, CheckCircle, Cancel,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import { api } from '../../services/apiClient';
import { formatProcedencia } from '../../utils/procedenciaUtils';

const cop = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Math.round(n || 0));

const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—');

/** Semáforo por días sin contacto: lo que manda la acción del día. */
const urgencia = (dias) => {
  if (dias == null) return { label: 'sin contactar', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' };
  if (dias <= 2) return { label: `hace ${dias}d`, color: '#059669', bg: 'rgba(5,150,105,0.12)' };
  if (dias <= 7) return { label: `hace ${dias}d`, color: '#b45309', bg: 'rgba(217,119,6,0.14)' };
  return { label: `hace ${dias}d`, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' };
};

const waLink = (tel, nombre, marca) => {
  const num = String(tel || '').replace(/\D/g, '');
  const e164 = num.length === 10 && num.startsWith('3') ? `57${num}` : num;
  const texto = encodeURIComponent(
    `Hola ${(nombre || '').split(' ')[0]}, te escribimos de OírConecta. Queríamos saber si tuviste oportunidad de pensar en la cotización${marca ? ` del ${marca}` : ''}. Cualquier duda, aquí estamos.`
  );
  return `https://wa.me/${e164}?text=${texto}`;
};

const TH = { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' };

const Kpi = ({ label, value, hint, color = '#0F2A4A' }) => (
  <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#fff', border: '1px solid #e5e7eb', height: '100%' }}>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
      {value}
    </Typography>
    {hint && <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>{hint}</Typography>}
  </Box>
);

export default function OportunidadesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [verCerradas, setVerCerradas] = useState(false);
  const [orden, setOrden] = useState('urgencia');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get(`/api/crm/oportunidades?incluirCerradas=${verCerradas}`);
    setData(res?.data || null);
    setLoading(false);
  }, [verCerradas]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    const lista = [...(data?.items || [])];
    if (orden === 'valor') return lista.sort((a, b) => b.valorTotal - a.valorTotal);
    // Por urgencia: primero quien lleva más tiempo sin que lo contacten.
    return lista.sort((a, b) => {
      const da = a.diasSinContacto == null ? 9999 : a.diasSinContacto;
      const db = b.diasSinContacto == null ? 9999 : b.diasSinContacto;
      return db - da;
    });
  }, [data, orden]);

  const cerrar = async (id, resultado) => {
    const { error } = await api.post(`/api/crm/oportunidades/${id}/cerrar`, { resultado });
    if (error) return setSnack({ open: true, msg: `No se pudo cerrar: ${error}`, sev: 'error' });
    setSnack({
      open: true,
      msg: resultado === 'ganada' ? 'Marcada como ganada.' : 'Marcada como perdida.',
      sev: 'success',
    });
    load();
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100%' }}>
      <PageHeader
        title="Oportunidades"
        subtitle="Cotizaciones esperando decisión y a quién hay que llamar hoy"
        icon={TrendingUp}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <ToggleButtonGroup size="small" exclusive value={orden} onChange={(_, v) => v && setOrden(v)}>
              <ToggleButton value="urgencia" sx={{ textTransform: 'none', fontWeight: 700 }}>Por urgencia</ToggleButton>
              <ToggleButton value="valor" sx={{ textTransform: 'none', fontWeight: 700 }}>Por valor</ToggleButton>
            </ToggleButtonGroup>
            <Button size="small" variant={verCerradas ? 'contained' : 'outlined'}
              onClick={() => setVerCerradas((v) => !v)}
              sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {verCerradas ? 'Viendo todas' : 'Solo abiertas'}
            </Button>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load}
              sx={{ borderRadius: '10px', fontWeight: 700 }}>Actualizar</Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !data ? (
          <Typography sx={{ color: '#94a3b8' }}>No se pudieron cargar las oportunidades.</Typography>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Kpi label="En juego" value={cop(data.resumen.enJuego)} color="#059669"
                  hint={`${data.resumen.abiertas} cotización(es) sin decisión`} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Kpi label="Ticket promedio" value={cop(data.resumen.ticketPromedio)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Kpi label="Llevan más de 7 días" value={data.resumen.frias}
                  color={data.resumen.frias > 0 ? '#b45309' : '#0F2A4A'}
                  hint="Cuanto más esperan, menos cierran" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Kpi label="Sin contacto reciente" value={data.resumen.sinContactoReciente}
                  color={data.resumen.sinContactoReciente > 0 ? '#dc2626' : '#0F2A4A'}
                  hint="Nadie les ha escrito hace más de una semana" />
              </Grid>
            </Grid>

            <Box sx={{ borderRadius: '16px', bgcolor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': TH }}>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Procedencia</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Cotizada</TableCell>
                      <TableCell>Último contacto</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                          No hay cotizaciones {verCerradas ? 'registradas' : 'abiertas'}.
                        </TableCell>
                      </TableRow>
                    ) : items.map((o) => {
                      const u = urgencia(o.diasSinContacto);
                      const abierta = ['PENDING', 'APPROVED'].includes(o.estado);
                      return (
                        <TableRow key={o.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                              {o.paciente?.nombre || '—'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {o.paciente?.telefono || 'sin teléfono'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.875rem' }}>{o.marca || '—'}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {[o.tecnologia, o.cantidad > 1 ? `${o.cantidad} uds` : null].filter(Boolean).join(' · ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={formatProcedencia(o.paciente?.procedencia)}
                              sx={{ fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'rgba(8,89,70,0.08)', color: '#085946' }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {cop(o.valorTotal)}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {fecha(o.createdAt)}
                            <Typography sx={{ fontSize: '0.6875rem', color: o.diasAbierta > 7 ? '#b45309' : '#94a3b8' }}>
                              {o.diasAbierta}d abierta
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={u.label}
                              sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 800, bgcolor: u.bg, color: u.color }} />
                            {o.detalleUltimoContacto && (
                              <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', mt: 0.25 }}>
                                {o.detalleUltimoContacto.slice(0, 40)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {o.estado === 'CONVERTED' ? (
                              <Chip size="small" label="Ganada" sx={{ fontWeight: 800, bgcolor: 'rgba(5,150,105,0.14)', color: '#059669' }} />
                            ) : o.estado === 'REJECTED' ? (
                              <Chip size="small" label="Perdida" sx={{ fontWeight: 800, bgcolor: 'rgba(220,38,38,0.12)', color: '#dc2626' }} />
                            ) : (
                              <Chip size="small" label="Abierta" sx={{ fontWeight: 800, bgcolor: 'rgba(2,132,199,0.12)', color: '#0284c7' }} />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {o.paciente?.telefono && (
                              <>
                                <Tooltip title="Escribir por WhatsApp">
                                  <IconButton size="small" component="a" target="_blank" rel="noopener"
                                    href={waLink(o.paciente.telefono, o.paciente.nombre, o.marca)}>
                                    <WhatsApp sx={{ fontSize: 18, color: '#25D366' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Llamar">
                                  <IconButton size="small" component="a" href={`tel:${o.paciente.telefono}`}>
                                    <Phone sx={{ fontSize: 18, color: '#0F2A4A' }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {abierta && (
                              <>
                                <Tooltip title="Marcar como ganada">
                                  <IconButton size="small" onClick={() => cerrar(o.id, 'ganada')}>
                                    <CheckCircle sx={{ fontSize: 18, color: '#059669' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Marcar como perdida">
                                  <IconButton size="small" onClick={() => cerrar(o.id, 'perdida')}>
                                    <Cancel sx={{ fontSize: 18, color: '#dc2626' }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Container>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
