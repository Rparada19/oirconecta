/**
 * F4b — Panel admin del agente IA (Plan 3).
 * KPIs globales + top consumidores + auditoría de conversaciones.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, Stack, CircularProgress, IconButton, Drawer, TextField, MenuItem, Alert, Divider,
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { adminFetch } from './adminAuth';

const ACCENT = '#6d28d9'; // púrpura del agente IA
const NAVY = '#272F50';

const CHANNELS = ['', 'web', 'whatsapp', 'embed'];
const STATUSES = ['', 'ACTIVE', 'CLOSED'];

const fmtDT = (d) => d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

function KpiCard({ icon: Icon, label, value, hint, color = ACCENT }) {
  return (
    <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', flex: 1, minWidth: 180 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: `${color}15`, display: 'flex' }}>
            <Icon sx={{ color, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: '1.625rem', fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>{value}</Typography>
        {hint && <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5 }}>{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function AdminIAPage() {
  const [stats, setStats] = useState(null);
  const [convs, setConvs] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ channel: '', status: '' });
  const [selected, setSelected] = useState(null); // detalle abierto en drawer

  const fetchAll = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.channel) params.append('channel', filters.channel);
    if (filters.status) params.append('status', filters.status);
    const [s, l] = await Promise.all([
      adminFetch('/api/ia/admin/stats'),
      adminFetch(`/api/ia/admin/conversations?${params.toString()}&limit=100`),
    ]);
    if (s?.data?.success) setStats(s.data.data);
    if (l?.data?.success) setConvs(l.data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [filters]);

  const openDetail = async (id) => {
    setSelected({ loading: true });
    const r = await adminFetch(`/api/ia/admin/conversations/${id}`);
    setSelected(r?.data?.success ? r.data.data : { error: r?.error || 'Error' });
  };

  const filtered = useMemo(() => {
    if (!filters.channel && !filters.status) return convs.items;
    return convs.items.filter((c) =>
      (!filters.channel || c.canal === filters.channel) &&
      (!filters.status || c.status === filters.status),
    );
  }, [convs.items, filters]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <SmartToyOutlinedIcon sx={{ color: ACCENT, fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: NAVY }}>Agente IA · Auditoría</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
            Conversaciones del Plan 3 con pacientes. Solo lectura para soporte y compliance.
          </Typography>
        </Box>
        <Button startIcon={<RefreshRoundedIcon />} onClick={fetchAll} disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 700 }}>
          {loading ? 'Cargando…' : 'Refrescar'}
        </Button>
      </Stack>

      {/* KPIs */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        <KpiCard icon={PeopleAltOutlinedIcon} label="Plan 3 activos" value={stats?.plan3Activos ?? '—'} />
        <KpiCard icon={ForumOutlinedIcon} label="Conversaciones este mes" value={stats?.conversacionesEsteMes ?? '—'} hint={`${stats?.conversacionesTotal ?? 0} en total`} />
        <KpiCard icon={EventAvailableOutlinedIcon} label="Citas generadas" value={stats?.citasGeneradas ?? '—'} hint={`${stats?.conversionRate ?? 0}% conversion`} />
        <KpiCard icon={TrendingUpOutlinedIcon} label="Tokens totales" value={(stats?.tokensTotal ?? 0).toLocaleString('es-CO')} hint={`${stats?.mensajesTotal ?? 0} mensajes`} />
      </Box>

      {/* Top consumidores */}
      {stats?.topConsumidores?.length > 0 && (
        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#faf5ff', borderBottom: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
              Top consumidores IA · periodo actual
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              Uso vs límite (300 conversaciones/mes por Plan 3)
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Profesional', 'Email', 'Usadas', 'Restantes', 'Progreso'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.topConsumidores.map((p) => {
                const pct = Math.min(100, Math.round((p.usadas / p.limite) * 100));
                const color = pct >= 90 ? '#b91c1c' : pct >= 70 ? '#a16207' : '#15803d';
                return (
                  <TableRow key={p.subscriptionId} hover>
                    <TableCell sx={{ fontWeight: 700, color: NAVY }}>{p.nombre || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem', color: '#64748b' }}>{p.email || '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: NAVY }}>{p.usadas} / {p.limite}</TableCell>
                    <TableCell sx={{ color }}>{p.restantes}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 32 }}>{pct}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Filtros */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <TextField select size="small" label="Canal" value={filters.channel}
            onChange={(e) => setFilters({ ...filters, channel: e.target.value })} sx={{ minWidth: 140 }}>
            {CHANNELS.map((c) => <MenuItem key={c || 'all'} value={c}>{c || 'Todos'}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Estado" value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })} sx={{ minWidth: 140 }}>
            {STATUSES.map((s) => <MenuItem key={s || 'all'} value={s}>{s || 'Todos'}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

      {/* Conversaciones */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
            Conversaciones ({convs.total})
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            <Typography>Sin conversaciones aún.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Profesional', 'Paciente', 'Canal', 'Msgs', 'Tokens', 'Cita', 'Última actividad', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(c.id)}>
                  <TableCell sx={{ fontWeight: 600, color: NAVY }}>{c.profesionalNombre || '—'}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.875rem' }}>{c.pacienteNombre || 'Anónimo'}</Typography>
                    {c.pacienteTelefono && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.pacienteTelefono}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={c.canal}
                      sx={{ bgcolor: c.canal === 'whatsapp' ? '#dcfce7' : '#e0f2fe',
                            color: c.canal === 'whatsapp' ? '#15803d' : '#0369a1',
                            fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{c.messageCount}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{c.totalTokens?.toLocaleString('es-CO') || 0}</TableCell>
                  <TableCell>
                    {c.resultedInAppointmentId
                      ? <Chip size="small" label="Sí" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 20 }} />
                      : <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDT(c.lastMessageAt)}</TableCell>
                  <TableCell sx={{ color: ACCENT, fontWeight: 700 }}>Ver →</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Drawer detalle */}
      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 560 }, p: 0 } }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, color: NAVY, flex: 1 }}>Conversación</Typography>
          <IconButton onClick={() => setSelected(null)}><CloseOutlinedIcon /></IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {selected?.loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}
          {selected?.error && <Alert severity="error">{selected.error}</Alert>}
          {selected && !selected.loading && !selected.error && (
            <>
              <Box sx={{ bgcolor: '#faf5ff', p: 2, borderRadius: '10px', mb: 2 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>Contexto</Typography>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Profesional:</strong> {selected.profesionalNombre}</Typography>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Paciente:</strong> {selected.pacienteNombre || 'Anónimo'} {selected.pacienteTelefono ? `· ${selected.pacienteTelefono}` : ''}</Typography>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Canal:</strong> {selected.canal} · <strong>Tokens:</strong> {selected.totalTokens}</Typography>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Inicio:</strong> {fmtDT(selected.startedAt)}</Typography>
                {selected.resultedInAppointmentId && (
                  <Chip size="small" label="Terminó en cita agendada" sx={{ mt: 1, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                )}
              </Box>
              <Divider sx={{ mb: 2 }}>Mensajes</Divider>
              <Stack spacing={1}>
                {selected.messages?.map((m) => (
                  <Box key={m.id} sx={{
                    p: 1.5, borderRadius: '10px',
                    bgcolor: m.role === 'user' ? '#e0f2fe' : m.role === 'assistant' ? '#faf5ff' : '#fef3c7',
                    borderLeft: `3px solid ${m.role === 'user' ? '#0369a1' : m.role === 'assistant' ? ACCENT : '#a16207'}`,
                  }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>
                      {m.role === 'user' ? '👤 Paciente' : m.role === 'assistant' ? '🤖 Asistente' : `🔧 ${m.toolName || 'tool'}`}
                      {' · '} {fmtDT(m.createdAt)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
