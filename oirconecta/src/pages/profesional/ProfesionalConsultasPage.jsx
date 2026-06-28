import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Drawer,
  Grid,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  Stack,
} from '@mui/material';
import {
  MailOutlined,
  CloseOutlined,
  DoneAllOutlined,
  ArchiveOutlined,
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';
import ShareProfileCard from '../../components/profesional/ShareProfileCard';

const glassCard = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

const STATUS_CONFIG = {
  NEW: { label: 'Nueva', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  READ: { label: 'Leída', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  ARCHIVED: { label: 'Archivada', color: '#374151', bg: 'rgba(55,65,81,0.12)' },
};

function StatusChip({ status }) {
  const s = STATUS_CONFIG[status] || { label: status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${s.color}30` }} />;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

export default function ProfesionalConsultasPage() {
  const ctx = useOutletContext() || {};
  const { setNewInquiries } = ctx;

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notaInterna, setNotaInterna] = useState('');
  const [updating, setUpdating] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    setLoading(true);
    const { data, error: err } = await directoryApi.get(DIRECTORY_API.meInquiries);
    setLoading(false);
    if (err) { setError(err); return; }
    const raw = data?.data;
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    setInquiries(list);
    if (setNewInquiries) setNewInquiries(list.filter((i) => i.status === 'NEW').length);
  }

  function openDrawer(inq) {
    setSelected(inq);
    setNotaInterna(inq.notaInterna || '');
    setDrawerOpen(true);
  }

  async function updateStatus(inquiryId, status) {
    setUpdating(true);
    const { error: err } = await directoryApi.patch(DIRECTORY_API.meInquiry(inquiryId), { status, notaInterna });
    setUpdating(false);
    if (err) {
      setSnack({ open: true, msg: `Error: ${err}`, sev: 'error' });
    } else {
      setSnack({ open: true, msg: `Consulta marcada como ${STATUS_CONFIG[status]?.label || status}`, sev: 'success' });
      setDrawerOpen(false);
      fetchInquiries();
    }
  }

  const FILTER_OPTS = [
    { key: 'ALL',      label: 'Todas',      color: '#272F50', bg: '#eef0fb' },
    { key: 'NEW',      label: 'Nuevas',     color: '#4054B2', bg: '#eef0fb' },
    { key: 'READ',     label: 'Leídas',     color: '#085946', bg: '#ecfdf5' },
    { key: 'ARCHIVED', label: 'Archivadas', color: '#6b7280', bg: '#f3f4f6' },
  ];

  const filtered = filter === 'ALL' ? inquiries : inquiries.filter((i) => i.status === filter);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#085946' }} />
      </Box>
    );
  }

  return (
    <Box>
      <ProfesionalPageHeader
        icon={MailOutlined}
        title="Consultas recibidas"
        subtitle="Mensajes enviados por pacientes desde tu ficha pública"
      />

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {/* Filtros */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {FILTER_OPTS.map((opt) => {
          const count = opt.key === 'ALL' ? inquiries.length : inquiries.filter((i) => i.status === opt.key).length;
          const active = filter === opt.key;
          return (
            <Chip
              key={opt.key}
              label={`${opt.label} (${count})`}
              clickable
              onClick={() => setFilter(opt.key)}
              sx={{
                fontWeight: 700, borderRadius: '10px',
                bgcolor: active ? opt.color : opt.bg,
                color: active ? '#fff' : opt.color,
                border: `1px solid ${active ? opt.color : `${opt.color}25`}`,
                '&:hover': { bgcolor: active ? opt.color : `${opt.color}18` },
              }}
            />
          );
        })}
      </Stack>

      {/* Lista */}
      {filtered.length === 0 ? (
        filter === 'ALL' ? (
          <Box>
            <ShareProfileCard profile={ctx?.profile} />
            <Box sx={{
              mt: 2.5, p: 2.5, bgcolor: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 2.5, boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
            }}>
              <Typography sx={{
                fontSize: 11, fontWeight: 700, color: '#4054B2',
                letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.25,
              }}>
                Qué pasa cuando llega una consulta
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                {[
                  { num: '1', color: '#4054B2', bg: '#eef0fb', title: 'Recibes notificación',
                    body: 'Aparece en tu panel y te avisamos por email.' },
                  { num: '2', color: '#8b5cf6', bg: '#f3edff', title: 'Lees y respondes',
                    body: 'Ve nombre, teléfono, mensaje y agendamiento sugerido.' },
                  { num: '3', color: '#10b981', bg: '#ecfdf5', title: 'Marcas estado',
                    body: 'Nueva → Leída → Archivada para no perder el hilo.' },
                ].map((s) => (
                  <Box key={s.num} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', bgcolor: s.bg, color: s.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                    }}>
                      {s.num}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#041a12', mb: 0.25 }}>
                        {s.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', lineHeight: 1.5 }}>
                        {s.body}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Card elevation={0} sx={{
            bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5,
            boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
            textAlign: 'center', py: 6, px: 3,
          }}>
            <Box sx={{
              width: 56, height: 56, mx: 'auto', mb: 1.5, borderRadius: 2,
              bgcolor: 'rgba(64,84,178,0.10)', color: '#4054B2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MailOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#041a12', mb: 0.5 }}>
              No hay consultas en esta categoría
            </Typography>
            <Typography sx={{ color: '#5b6b7a', fontSize: 13 }}>
              Cambia el filtro para ver otros estados.
            </Typography>
          </Card>
        )
      ) : (
        <Grid container spacing={2}>
          {filtered.map((inq) => (
            <Grid item xs={12} key={inq.id}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 2.5,
                  boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    borderColor: 'rgba(8,89,70,0.30)',
                    boxShadow: '0 4px 14px rgba(15,23,35,0.07)',
                  },
                  borderLeft: inq.status === 'NEW' ? '4px solid #3B82F6' : '1px solid #e5e7eb',
                }}
                onClick={() => openDrawer(inq)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(8,89,70,0.10)', color: '#085946', width: 40, height: 40, flexShrink: 0 }}>
                      <PersonOutlined />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#041a12' }}>
                          {inq.nombre || inq.name || 'Sin nombre'}
                        </Typography>
                        <StatusChip status={inq.status} />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {formatDate(inq.createdAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                        {(inq.email || inq.correo) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailOutlined sx={{ fontSize: 13 }} />
                            {inq.email || inq.correo}
                          </Typography>
                        )}
                        {(inq.telefono || inq.phone) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneOutlined sx={{ fontSize: 13 }} />
                            {inq.telefono || inq.phone}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                      >
                        {inq.mensaje || inq.message || '—'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Drawer detalle */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3, bgcolor: '#f8fafb' } }}
      >
        {selected && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#041a12' }}>
                Detalle de consulta
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseOutlined />
              </IconButton>
            </Box>

            <Card elevation={0} sx={{ ...glassCard, mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#041a12', flex: 1 }}>
                    {selected.nombre || selected.name || 'Sin nombre'}
                  </Typography>
                  <StatusChip status={selected.status} />
                </Box>
                {(selected.email || selected.correo) && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <EmailOutlined sx={{ fontSize: 15 }} /> {selected.email || selected.correo}
                  </Typography>
                )}
                {(selected.telefono || selected.phone) && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <PhoneOutlined sx={{ fontSize: 15 }} /> {selected.telefono || selected.phone}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDate(selected.createdAt)}
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ ...glassCard, mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#085946', mb: 1 }}>
                  Mensaje
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {selected.mensaje || selected.message || '—'}
                </Typography>
              </CardContent>
            </Card>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Nota interna (privada)"
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
            />

            <Stack direction="column" spacing={1.5}>
              {selected.status !== 'READ' && (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={updating}
                  startIcon={updating ? <CircularProgress size={16} color="inherit" /> : <DoneAllOutlined />}
                  onClick={() => updateStatus(selected.id, 'READ')}
                  sx={{ bgcolor: '#085946', borderRadius: '12px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#064a38' } }}
                >
                  Marcar como leída
                </Button>
              )}
              {selected.status !== 'ARCHIVED' && (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={updating}
                  startIcon={<ArchiveOutlined />}
                  onClick={() => updateStatus(selected.id, 'ARCHIVED')}
                  sx={{ borderColor: '#6B7280', color: '#6B7280', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                >
                  Archivar
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Drawer>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.sev} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
