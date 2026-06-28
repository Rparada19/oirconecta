import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StorefrontOutlined,
  CloseOutlined,
} from '@mui/icons-material';
import { directoryApi, getDirectoryToken } from '../../services/directoryAccountApi';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';

const BASE_URL = getApiBaseUrl();

const glassCard = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

const CATEGORIAS = [
  { value: 'audiologia', label: 'Audiología' },
  { value: 'fonoaudiologia', label: 'Fonoaudiología' },
  { value: 'orl', label: 'ORL' },
  { value: 'rehabilitacion', label: 'Rehabilitación' },
  { value: 'audiometria', label: 'Audiometría' },
  { value: 'otro', label: 'Otro' },
];

const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'ambos', label: 'Ambos' },
];

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  categoria: '',
  precio: '',
  precioDesde: '',
  precioHasta: '',
  modalidad: '',
};

function marketplaceRequest(path, options = {}) {
  const token = getDirectoryToken();
  const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
    .then(async (res) => {
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* */ }
      if (!res.ok) {
        const msg = data?.error || data?.message || res.statusText || `Error ${res.status}`;
        return { data: null, error: msg };
      }
      return { data, error: null };
    })
    .catch((err) => ({ data: null, error: err.message || 'Error de conexión' }));
}

function servicioStatusChip(status) {
  const map = {
    ACTIVE: { label: 'Activo', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    PAUSED: { label: 'Pausado', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    INACTIVE: { label: 'Inactivo', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  };
  const s = map[status] || { label: status || '—', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem' }} />;
}

function formatPrecio(serv) {
  if (serv.precioDesde && serv.precioHasta) {
    return `$${Number(serv.precioDesde).toLocaleString('es-CO')} – $${Number(serv.precioHasta).toLocaleString('es-CO')}`;
  }
  if (serv.precio) return `$${Number(serv.precio).toLocaleString('es-CO')}`;
  return 'Consultar';
}

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

export default function ProfesionalServiciosPage() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchServicios(); }, []);

  async function fetchServicios() {
    setLoading(true);
    const { data, error: err } = await marketplaceRequest('/api/marketplace/me');
    setLoading(false);
    if (err) { setError(err); return; }
    setServicios(data?.data || data || []);
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(serv) {
    setEditingId(serv.id);
    setForm({
      titulo: serv.titulo || serv.title || '',
      descripcion: serv.descripcion || serv.description || '',
      categoria: serv.categoria || serv.category || '',
      precio: serv.precio || serv.price || '',
      precioDesde: serv.precioDesde || '',
      precioHasta: serv.precioHasta || '',
      modalidad: serv.modalidad || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.titulo.trim()) {
      setSnack({ open: true, msg: 'El título es obligatorio', sev: 'warning' }); return;
    }
    setSaving(true);
    const body = JSON.stringify(form);
    let res;
    if (editingId) {
      res = await marketplaceRequest(`/api/marketplace/me/${editingId}`, { method: 'PATCH', body });
    } else {
      res = await marketplaceRequest('/api/marketplace/me', { method: 'POST', body });
    }
    setSaving(false);
    if (res.error) {
      setSnack({ open: true, msg: `Error: ${res.error}`, sev: 'error' }); return;
    }
    setSnack({ open: true, msg: editingId ? 'Servicio actualizado' : 'Servicio creado', sev: 'success' });
    setDialogOpen(false);
    fetchServicios();
  }

  async function toggleStatus(serv) {
    const newStatus = serv.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const { error: err } = await marketplaceRequest(`/api/marketplace/me/${serv.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (err) { setSnack({ open: true, msg: `Error: ${err}`, sev: 'error' }); return; }
    setSnack({ open: true, msg: newStatus === 'ACTIVE' ? 'Servicio activado' : 'Servicio pausado', sev: 'success' });
    fetchServicios();
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    setDeleting(id);
    const { error: err } = await marketplaceRequest(`/api/marketplace/me/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (err) { setSnack({ open: true, msg: `Error: ${err}`, sev: 'error' }); return; }
    setSnack({ open: true, msg: 'Servicio eliminado', sev: 'success' });
    fetchServicios();
  }

  function fieldChange(key) {
    return (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  }

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
        icon={StorefrontOutlined}
        title="Mis servicios"
        subtitle="Gestiona los servicios que ofreces en el marketplace de OírConecta"
        actions={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={openNew}
            sx={{ bgcolor: '#085946', borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#064a38' } }}
          >
            Nuevo servicio
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {servicios.length === 0 ? (
        <Card elevation={0} sx={{
          bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
          textAlign: 'center', py: 6, px: 3, maxWidth: 640, mx: 'auto',
        }}>
          <Box sx={{
            width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: 2,
            bgcolor: 'rgba(8,89,70,0.08)', color: '#085946',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StorefrontOutlined sx={{ fontSize: 32 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#041a12', mb: 0.75 }}>
            Empieza a publicar tus servicios
          </Typography>
          <Typography sx={{ color: '#5b6b7a', fontSize: 14, mb: 2.5, maxWidth: 480, mx: 'auto' }}>
            Tus servicios aparecen en el marketplace y en tu ficha pública.
            Pacientes te encuentran filtrando por especialidad, modalidad y precio.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={openNew}
            sx={{ bgcolor: '#085946', borderRadius: '10px', fontWeight: 700, textTransform: 'none', px: 3, py: 1, '&:hover': { bgcolor: '#064a38' } }}
          >
            Crear mi primer servicio
          </Button>
          <Box sx={{
            mt: 3, pt: 2.5, borderTop: '1px solid #f0f2f5',
            display: 'flex', flexDirection: 'column', gap: 0.75,
            textAlign: 'left', maxWidth: 420, mx: 'auto',
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#085946', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
              Tips rápidos
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5b6b7a' }}>
              • Pon precio claro — los servicios con precio se contactan 3× más.
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5b6b7a' }}>
              • Indica duración aproximada (30, 45 o 60 min).
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#5b6b7a' }}>
              • Si haces virtual o domicilio, márcalo: hay alta demanda.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {servicios.map((serv) => (
            <Grid item xs={12} sm={6} md={4} key={serv.id}>
              <Card elevation={0} sx={{ ...glassCard, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 2.5, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#041a12', flex: 1, pr: 1 }}>
                      {serv.titulo || serv.title}
                    </Typography>
                    {servicioStatusChip(serv.status)}
                  </Box>

                  {(serv.categoria || serv.category) && (
                    <Chip
                      label={CATEGORIAS.find((c) => c.value === (serv.categoria || serv.category))?.label || (serv.categoria || serv.category)}
                      size="small"
                      sx={{ mb: 1, bgcolor: 'rgba(8,89,70,0.08)', color: '#085946', fontWeight: 600, fontSize: '0.72rem', borderRadius: '8px' }}
                    />
                  )}

                  {serv.modalidad && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {MODALIDADES.find((m) => m.value === serv.modalidad)?.label || serv.modalidad}
                    </Typography>
                  )}

                  {(serv.descripcion || serv.description) && (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ mb: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {serv.descripcion || serv.description}
                    </Typography>
                  )}

                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#085946' }}>
                    {formatPrecio(serv)}
                  </Typography>
                </CardContent>

                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleStatus(serv)}
                    title={serv.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                    sx={{ color: serv.status === 'ACTIVE' ? '#F59E0B' : '#10B981' }}
                  >
                    {serv.status === 'ACTIVE' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  </IconButton>
                  <IconButton size="small" onClick={() => openEdit(serv)} sx={{ color: '#272F50' }}>
                    <EditOutlined />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(serv.id)}
                    disabled={deleting === serv.id}
                    sx={{ color: '#EF4444' }}
                  >
                    {deleting === serv.id ? <CircularProgress size={16} /> : <DeleteOutlined />}
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog crear/editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '22px', p: 0 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#041a12' }}>
            {editingId ? 'Editar servicio' : 'Nuevo servicio'}
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Título del servicio *"
              value={form.titulo}
              onChange={fieldChange('titulo')}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={form.descripcion}
              onChange={fieldChange('descripcion')}
              sx={fieldSx}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Categoría</InputLabel>
                  <Select value={form.categoria} label="Categoría" onChange={fieldChange('categoria')}>
                    {CATEGORIAS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Modalidad</InputLabel>
                  <Select value={form.modalidad} label="Modalidad" onChange={fieldChange('modalidad')}>
                    {MODALIDADES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#041a12', mt: -1 }}>
              Precio
            </Typography>
            <Grid container spacing={2} sx={{ mt: -1.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Precio fijo" type="number" value={form.precio} onChange={fieldChange('precio')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Desde" type="number" value={form.precioDesde} onChange={fieldChange('precioDesde')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Hasta" type="number" value={form.precioHasta} onChange={fieldChange('precioHasta')} sx={fieldSx} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: '#6B7280', borderRadius: '10px' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: '#085946', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#064a38' } }}
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear servicio'}
          </Button>
        </DialogActions>
      </Dialog>

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
