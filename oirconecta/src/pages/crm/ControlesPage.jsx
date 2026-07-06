/**
 * F8 — Página dedicada del CRM para gestionar controles de adaptación.
 * URL: /portal-crm/controles
 *
 * Tabs: Vencidos · Próximos 7d · Agendados · Todos
 * Acciones por fila: Ver ficha · Marcar hecho · Omitir · Ver link mágico
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, Grid, Card, Chip, Stack, Button,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  CircularProgress, Alert, TextField, MenuItem, Tooltip,
} from '@mui/material';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { api } from '../../services/apiClient';

const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

const STEP_LABELS = {
  D10: 'Control 10 días', M1: 'Control 1 mes', M3: 'Control 3 meses',
  M6: 'Control 6 meses', Y1: 'Control 1 año', Y1_5: 'Control 1.5 años',
  Y2: 'Control 2 años', Y2_5: 'Control 2.5 años', Y3: 'Renovación 3 años',
};

const STATUS_META = {
  PENDING:   { label: 'Pendiente',  color: '#64748b', bg: '#f1f5f9' },
  REMINDED:  { label: 'Recordado',  color: '#6d28d9', bg: '#faf5ff' },
  SCHEDULED: { label: 'Agendado',   color: '#15803d', bg: '#f0fdf4' },
  OVERDUE:   { label: 'Vencido',    color: '#b91c1c', bg: '#fef2f2' },
  COMPLETED: { label: 'Realizado',  color: '#0369a1', bg: '#eff6ff' },
  SKIPPED:   { label: 'Omitido',    color: '#78716c', bg: '#f5f5f4' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
  return diff;
}

export default function ControlesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({ overdue: 0, upcoming7d: 0, scheduled: 0, totalPending: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sumRes, listRes] = await Promise.all([
        api.get('/api/follow-ups/summary'),
        tab === 0 ? api.get('/api/follow-ups/overdue?limit=200')
        : tab === 1 ? api.get('/api/follow-ups/upcoming?withinDays=7&limit=200')
        : tab === 2 ? api.get('/api/follow-ups/upcoming?withinDays=60&limit=200')  // aprox para agendados
        : api.get('/api/follow-ups/upcoming?withinDays=1095&limit=500'),
      ]);
      if (sumRes?.data?.success) setSummary(sumRes.data.data);
      if (listRes?.data?.success) {
        let data = listRes.data.data || [];
        if (tab === 2) data = data.filter((r) => r.status === 'SCHEDULED');
        if (tab === 3) data = data;
        setRows(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const action = async (id, kind) => {
    setBusy((b) => ({ ...b, [id]: kind }));
    try {
      if (kind === 'complete') {
        const notes = window.prompt('Notas (opcional):', '') || '';
        await api.post(`/api/follow-ups/${id}/complete`, { notes });
      } else if (kind === 'skip') {
        const reason = window.prompt('Motivo (opcional):', '') || '';
        await api.post(`/api/follow-ups/${id}/skip`, { reason });
      } else if (kind === 'copy-link') {
        const row = rows.find((r) => r.id === id);
        const token = row?.scheduleToken;
        if (!token) { alert('Este control aún no tiene link. Se genera al enviar el primer email.'); return; }
        const url = `${window.location.origin}/agendar-control/${token}`;
        try { await navigator.clipboard.writeText(url); alert('Link copiado al portapapeles'); }
        catch { window.prompt('Copia el link:', url); }
      }
      await load();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setBusy((b) => ({ ...b, [id]: null }));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            Controles de adaptación
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: '0.9rem' }}>
            Seguimiento post-venta: 10d, 1m, 3m, 6m, 1a, 1.5a, 2a, 2.5a y renovación 3a.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Vencidos',     value: summary.overdue,      color: '#b91c1c', bg: '#fef2f2' },
          { label: 'Próximos 7d',  value: summary.upcoming7d,   color: '#6d28d9', bg: '#faf5ff' },
          { label: 'Agendados',    value: summary.scheduled,    color: '#15803d', bg: '#f0fdf4' },
          { label: 'Total activos', value: summary.totalPending, color: NAVY,     bg: '#f1f5f9' },
        ].map((k) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Card sx={{ p: 2, border: `1px solid ${BORDER}`, borderRadius: '14px', boxShadow: 'none' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase' }}>{k.label}</Typography>
              <Typography sx={{ fontWeight: 900, color: k.color, fontSize: '2rem', lineHeight: 1, mt: 0.5 }}>{k.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: '14px', border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: `1px solid ${BORDER}`, px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: MUTED },
            '& .Mui-selected': { color: ACCENT },
            '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
          <Tab label={`Vencidos (${summary.overdue})`} />
          <Tab label={`Próximos 7d (${summary.upcoming7d})`} />
          <Tab label={`Agendados (${summary.scheduled})`} />
          <Tab label="Todos" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: ACCENT }} /></Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center', bgcolor: '#fafbfc', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>
              <EventRepeatOutlinedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography sx={{ fontSize: '1rem', color: NAVY, fontWeight: 600, mb: 0.5 }}>
                Sin controles en esta vista.
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: MUTED, maxWidth: 460, mx: 'auto' }}>
                El funnel se activa cuando registras una venta de audífono con <strong>fecha de adaptación</strong>.
                Los 9 controles (10d → 3 años) se crean automáticamente y los emails se envían solos.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paciente</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Control</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fecha objetivo</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const st = STATUS_META[r.status] || STATUS_META.PENDING;
                  const days = daysAgo(r.dueDate);
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '0.9rem' }}>{r.patient?.nombre || '—'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>
                          {r.patient?.telefono || '—'}{r.patient?.ciudad ? ` · ${r.patient.ciudad}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>{STEP_LABELS[r.step] || r.step}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {fmtDate(r.dueDate)}
                        {r.status === 'OVERDUE' && (
                          <Typography component="span" sx={{ ml: 1, fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700 }}>
                            (hace {days}d)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={st.label} size="small"
                          sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {r.patient?.telefono && (
                            <Tooltip title={`Llamar ${r.patient.telefono}`}>
                              <IconButton size="small" href={`tel:${r.patient.telefono}`}>
                                <PhoneOutlinedIcon fontSize="small" sx={{ color: NAVY }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Copiar link mágico">
                            <IconButton size="small" onClick={() => action(r.id, 'copy-link')} disabled={busy[r.id] === 'copy-link'}>
                              <ContentCopyOutlinedIcon fontSize="small" sx={{ color: ACCENT }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Abrir ficha">
                            <IconButton size="small" onClick={() => navigate(`/portal-crm/pacientes?patientId=${r.patient?.id}`)}>
                              <LaunchIcon fontSize="small" sx={{ color: NAVY }} />
                            </IconButton>
                          </Tooltip>
                          {r.status !== 'COMPLETED' && r.status !== 'SKIPPED' && (
                            <>
                              <Tooltip title="Marcar como realizado">
                                <IconButton size="small" onClick={() => action(r.id, 'complete')} disabled={busy[r.id] === 'complete'}>
                                  <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#15803d' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Omitir">
                                <IconButton size="small" onClick={() => action(r.id, 'skip')} disabled={busy[r.id] === 'skip'}>
                                  <BlockOutlinedIcon fontSize="small" sx={{ color: '#78716c' }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </Box>
  );
}
