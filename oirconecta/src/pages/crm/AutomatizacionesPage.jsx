/**
 * Bitácora de automatizaciones: qué mensajes salieron, a quién, en qué estado,
 * y qué queda en cola. Sirve para comprobar que un flujo se está cumpliendo.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Chip, CircularProgress, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { AutoAwesome, Refresh } from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import { api } from '../../services/apiClient';

const EVENTOS = {
  CITA_AGENDADA: 'Confirmación de cita',
  RECORDATORIO_24H: 'Recordatorio 24h',
  RECORDATORIO_2H: 'Recordatorio 2h',
  RESENA_GOOGLE: 'Gracias + reseña Google',
  AGRADECIMIENTO_POST_CITA: 'Agradecimiento post-cita',
  ENCUESTA_POST_CITA: 'Encuesta de satisfacción',
  CANCELACION: 'Cancelación',
  REPROGRAMACION: 'Reprogramación',
  CUMPLEANOS: 'Cumpleaños',
};
const nombreEvento = (c) => EVENTOS[c] || c;

const ESTADOS = {
  SENT: { label: 'enviado', color: '#64748b', bg: 'rgba(100,116,139,0.14)' },
  DELIVERED: { label: 'entregado', color: '#0284c7', bg: 'rgba(2,132,199,0.14)' },
  READ: { label: 'leído', color: '#059669', bg: 'rgba(5,150,105,0.14)' },
  FAILED: { label: 'falló', color: '#dc2626', bg: 'rgba(220,38,38,0.14)' },
};
const infoEstado = (s) => ESTADOS[s] || { label: s, color: '#64748b', bg: 'rgba(100,116,139,0.14)' };

const fechaHora = (v) => (v
  ? new Date(v).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');

const TH = { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' };

export default function AutomatizacionesPage() {
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(14);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get(`/api/notifications-log?dias=${dias}`);
    setData(res?.data || null);
    setLoading(false);
  }, [dias]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100%' }}>
      <PageHeader
        title="Automatizaciones"
        subtitle="Qué mensajes salieron, a quién y en qué estado quedaron"
        icon={AutoAwesome}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Período</InputLabel>
              <Select label="Período" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
                <MenuItem value={1}>Hoy</MenuItem>
                <MenuItem value={7}>7 días</MenuItem>
                <MenuItem value={14}>14 días</MenuItem>
                <MenuItem value={30}>30 días</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load}
              sx={{ borderRadius: '10px', fontWeight: 700 }}>Actualizar</Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !data ? (
          <Typography sx={{ color: '#94a3b8' }}>No se pudo cargar la bitácora.</Typography>
        ) : (
          <>
            {/* Salud de cada flujo */}
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', mb: 1.5 }}>
              Estado de cada flujo · últimos {data.dias} días
            </Typography>
            {data.porEvento.length === 0 ? (
              <Box sx={{ p: 3, borderRadius: '14px', border: '1px dashed #cbd5e1', bgcolor: '#fff', mb: 4 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  No salió ningún mensaje automático en este período.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {data.porEvento.map((e) => (
                  <Grid item xs={12} sm={6} md={4} key={e.eventCode}>
                    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#fff', border: '1px solid #e5e7eb', height: '100%' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f1923' }}>
                        {nombreEvento(e.eventCode)}
                      </Typography>
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2A4A', lineHeight: 1.2 }}>
                        {e.total}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {e.entregados > 0 && (
                          <Chip size="small" label={`${e.entregados} entregados`}
                            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'rgba(2,132,199,0.14)', color: '#0284c7' }} />
                        )}
                        {e.leidos > 0 && (
                          <Chip size="small" label={`${e.leidos} leídos`}
                            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'rgba(5,150,105,0.14)', color: '#059669' }} />
                        )}
                        {e.fallidos > 0 && (
                          <Chip size="small" label={`${e.fallidos} fallaron`}
                            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'rgba(220,38,38,0.14)', color: '#dc2626' }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', mt: 0.75 }}>
                        último: {fechaHora(e.ultimo)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* En cola */}
            {data.programados.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', mb: 0.5 }}>
                  En cola ({data.programados.length})
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mb: 1.5 }}>
                  Programados y todavía sin enviar. Si algo no llegó, aquí se ve si quedó agendado.
                </Typography>
                <Box sx={{ borderRadius: '14px', bgcolor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden', mb: 4 }}>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': TH }}>
                          <TableCell>Paciente</TableCell>
                          <TableCell>Mensaje</TableCell>
                          <TableCell>Canal</TableCell>
                          <TableCell>Sale</TableCell>
                          <TableCell>Intentos</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.programados.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{r.patient?.nombre || '—'}</TableCell>
                            <TableCell>{nombreEvento(r.eventCode)}</TableCell>
                            <TableCell>{r.channel}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaHora(r.scheduledFor)}</TableCell>
                            <TableCell sx={{ color: r.attempts > 1 ? '#b45309' : '#64748b' }}>
                              {r.attempts}{r.lastError ? ` · ${r.lastError.slice(0, 60)}` : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}

            {/* Detalle de lo enviado */}
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', mb: 1.5 }}>
              Mensajes enviados ({data.enviados.length})
            </Typography>
            <Box sx={{ borderRadius: '14px', bgcolor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto', maxHeight: 620 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': TH }}>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Mensaje</TableCell>
                      <TableCell>Canal</TableCell>
                      <TableCell>Destino</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.enviados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ color: '#94a3b8', py: 4, textAlign: 'center' }}>
                          Sin mensajes en el período.
                        </TableCell>
                      </TableRow>
                    ) : data.enviados.map((n) => {
                      const est = infoEstado(n.status);
                      return (
                        <TableRow key={n.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaHora(n.sentAt)}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{n.patient?.nombre || '—'}</TableCell>
                          <TableCell>{nombreEvento(n.eventCode)}</TableCell>
                          <TableCell>{n.channel}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>{n.toAddress}</TableCell>
                          <TableCell>
                            <Chip size="small" label={est.label}
                              sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 800, bgcolor: est.bg, color: est.color }} />
                            {n.errorMessage && (
                              <Typography sx={{ fontSize: '0.6875rem', color: '#dc2626', mt: 0.25 }}>
                                {n.errorMessage.slice(0, 80)}
                              </Typography>
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
    </Box>
  );
}
