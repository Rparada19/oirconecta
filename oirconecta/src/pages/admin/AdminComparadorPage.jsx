import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, CircularProgress, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Tooltip, TextField, Grid,
  FormControlLabel, Switch,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { adminFetch, getAdminToken } from './adminAuth';

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)', borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 24px rgba(8,89,70,0.08)',
};
const HEADER_GRADIENT = {
  background: 'linear-gradient(135deg, #085946 0%, #6ee7c8 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
};
const formatPrice = (p) => (p == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p));

const EMPTY = {
  marca: '', tecnologia: '', plataforma: '', modelo: '', precio: '',
  fortalezas: '', debilidades: '', uso: '', consejos: '', imageUrl: '', activo: true,
};

export default function AdminComparadorPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    if (!getAdminToken()) { navigate('/admin-login', { replace: true }); return; }
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true); setError(null);
    const { ok, data } = await adminFetch('/api/comparador/admin/all');
    if (!ok) setError(data?.error || 'No se pudieron cargar las fichas');
    else setItems(data?.data || []);
    setLoading(false);
  }

  const openCreate = () => { setEditId(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (it) => {
    setEditId(it.id);
    setForm({
      marca: it.marca || '', tecnologia: it.tecnologia || '', plataforma: it.plataforma || '',
      modelo: it.modelo || '', precio: it.precio != null ? String(it.precio) : '',
      fortalezas: it.fortalezas || '', debilidades: it.debilidades || '', uso: it.uso || '',
      consejos: it.consejos || '', imageUrl: it.imageUrl || '', activo: !!it.activo,
    });
    setDialogOpen(true);
  };
  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  async function handleSave() {
    if (!form.marca.trim() || !form.tecnologia.trim() || !form.plataforma.trim()) {
      setSnack({ open: true, msg: 'Marca, tecnología y plataforma son obligatorios.', severity: 'error' });
      return;
    }
    setSaving(true);
    const payload = { ...form, precio: form.precio === '' ? null : Number(form.precio) };
    const path = editId ? `/api/comparador/admin/${editId}` : '/api/comparador/admin';
    const { ok, data } = await adminFetch(path, { method: editId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (!ok) setSnack({ open: true, msg: `Error: ${data?.error || 'no se pudo guardar'}`, severity: 'error' });
    else { setDialogOpen(false); setSnack({ open: true, msg: editId ? 'Ficha actualizada.' : 'Ficha creada.', severity: 'success' }); fetchItems(); }
  }

  async function handleDeleteConfirm() {
    const { ok, data } = await adminFetch(`/api/comparador/admin/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    if (!ok) setSnack({ open: true, msg: `Error al eliminar: ${data?.error || ''}`, severity: 'error' });
    else { setSnack({ open: true, msg: 'Ficha eliminada.', severity: 'success' }); fetchItems(); }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>Comparador</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Fichas por marca / tecnología / plataforma con precios reales</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
          Nueva ficha
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={GLASS_CARD}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><Typography variant="body2" color="text.secondary">Aún no hay fichas. Crea la primera.</Typography></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                    {['Marca', 'Tecnología', 'Plataforma', 'Modelo', 'Precio', 'Estado', 'Acciones'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', py: 1.8 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' } }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{it.marca}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{it.tecnologia}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{it.plataforma}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{it.modelo || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(it.precio)}</TableCell>
                      <TableCell><Chip label={it.activo ? 'Activa' : 'Oculta'} color={it.activo ? 'success' : 'default'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                      <TableCell>
                        <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(it)} sx={{ color: '#085946' }}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" onClick={() => setDeleteTarget(it)} sx={{ color: '#ef4444' }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Editar ficha' : 'Nueva ficha'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}><TextField label="Marca" value={form.marca} onChange={setField('marca')} fullWidth size="small" required /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Tecnología" value={form.tecnologia} onChange={setField('tecnologia')} fullWidth size="small" required /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Plataforma" value={form.plataforma} onChange={setField('plataforma')} fullWidth size="small" required /></Grid>
            <Grid item xs={12} sm={8}><TextField label="Modelo (opcional)" value={form.modelo} onChange={setField('modelo')} fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Precio (COP)" value={form.precio} onChange={setField('precio')} type="number" fullWidth size="small" /></Grid>
            <Grid item xs={12}><TextField label="Fortalezas" value={form.fortalezas} onChange={setField('fortalezas')} fullWidth size="small" multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField label="Debilidades" value={form.debilidades} onChange={setField('debilidades')} fullWidth size="small" multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField label="Uso recomendado" value={form.uso} onChange={setField('uso')} fullWidth size="small" multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField label="Consejos / cuál conviene" value={form.consejos} onChange={setField('consejos')} fullWidth size="small" multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField label="URL de imagen (opcional)" value={form.imageUrl} onChange={setField('imageUrl')} fullWidth size="small" /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={form.activo} onChange={setField('activo')} />} label="Visible en el comparador" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar ficha?</DialogTitle>
        <DialogContent><Typography>¿Seguro que deseas eliminar <strong>{deleteTarget?.marca} {deleteTarget?.tecnologia}</strong>?</Typography></DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '10px' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ borderRadius: '10px', fontWeight: 700 }}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '12px', fontWeight: 600 }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
