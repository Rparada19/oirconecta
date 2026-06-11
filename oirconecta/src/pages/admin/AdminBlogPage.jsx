import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
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
  FormControlLabel,
  Switch,
  Grid,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { adminFetch, getAdminToken, ADMIN_TOKEN_KEY } from './adminAuth';

// Sube imagen al endpoint compartido de Cloudinary (mismo que marketing).
function CoverUploader({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const handle = async (file) => {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const r = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketing/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error al subir');
      onChange(j.data.url);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Box>
      {value ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, bgcolor: '#000' }}>
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#475569', wordBreak: 'break-all' }} noWrap>{value}</Typography>
          </Box>
          <Button size="small" component="label" sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
            Cambiar
            <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => handle(e.target.files?.[0])} />
          </Button>
          <Button size="small" onClick={() => onChange('')} sx={{ color: '#b91c1c', textTransform: 'none', fontSize: '0.7rem' }}>
            Quitar
          </Button>
        </Box>
      ) : (
        <Box component="label" sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
          py: 2, borderRadius: '8px', border: '2px dashed #cbd5e1', cursor: busy ? 'wait' : 'pointer',
          color: '#64748b', '&:hover': { borderColor: '#085946', color: '#085946', bgcolor: 'rgba(8,89,70,0.04)' },
        }}>
          {busy ? <CircularProgress size={20} /> : <CloudUploadOutlinedIcon sx={{ fontSize: 24 }} />}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
            {busy ? 'Subiendo…' : 'Subir imagen de portada'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>JPG/PNG/WEBP · recomendado 1600×900</Typography>
          <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => handle(e.target.files?.[0])} />
        </Box>
      )}
      {err && <Alert severity="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>{err}</Alert>}
    </Box>
  );
}

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 4px 24px rgba(8,89,70,0.08)',
};

const HEADER_GRADIENT = {
  background: 'linear-gradient(135deg, #085946 0%, #6ee7c8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const statusColors = { PUBLICADO: 'success', BORRADOR: 'default', ARCHIVADO: 'secondary' };
const statusLabels = { PUBLICADO: 'Publicado', BORRADOR: 'Borrador', ARCHIVADO: 'Archivado' };

// Secciones canónicas del blog (alineado con backend/src/config/blogSections.js).
const CATEGORIAS = [
  { value: 'guias', label: 'Guías y educación' },
  { value: 'lanzamientos', label: 'Nuevos lanzamientos' },
  { value: 'comparativas', label: 'Comparativas' },
  { value: 'tecnologia', label: 'Tecnología y novedades' },
  { value: 'casos', label: 'Casos y testimonios' },
  { value: 'glosario', label: 'Glosario auditivo' },
  { value: 'cuidados', label: 'Mantenimiento y cuidados' },
  { value: 'general', label: 'General' },
];

const EMPTY_FORM = {
  titulo: '',
  slug: '',
  resumen: '',
  contenido: '',
  imagenPortada: '',
  categoria: 'general',
  tags: '',
  autor: '',
  estado: 'BORRADOR',
  destacado: false,
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminBlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { navigate('/login-crm', { replace: true }); return; }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    const r = await adminFetch('/api/blog/admin/all');
    if (!r?.data?.success) {
      setError(r?.data?.error || `HTTP ${r?.status || ''} al cargar blog`);
      setPosts([]);
    } else {
      const list = r.data.data;
      setPosts(Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : []);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setForm({
      titulo: post.titulo || post.title || '',
      slug: post.slug || '',
      resumen: post.resumen || post.summary || '',
      contenido: post.contenido || post.content || '',
      imagenPortada: post.imagenPortada || post.coverImage || '',
      categoria: post.categoria || post.category || 'general',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      autor: post.autor || post.author || '',
      estado: post.estado || post.status || 'BORRADOR',
      destacado: post.destacado || post.featured || false,
    });
    setFormError(null);
    setOpenDialog(true);
  };

  const handleFormChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'titulo' && (!editingPost || !prev.slug || prev.slug === slugify(prev.titulo))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setFormError('El título es obligatorio.'); return; }
    if (!form.slug.trim()) { setFormError('El slug es obligatorio.'); return; }
    setSaving(true);
    setFormError(null);
    const payload = {
      titulo: form.titulo,
      slug: form.slug,
      resumen: form.resumen,
      contenido: form.contenido,
      imagenPortada: form.imagenPortada,
      categoria: form.categoria,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      autor: form.autor,
      estado: form.estado,
      destacado: form.destacado,
    };
    let res;
    if (editingPost) {
      res = await adminFetch(`/api/blog/${editingPost._id || editingPost.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      res = await adminFetch('/api/blog', { method: 'POST', body: JSON.stringify(payload) });
    }
    setSaving(false);
    if (res.error) {
      setFormError(res.error);
    } else {
      setOpenDialog(false);
      setSnack({ open: true, msg: editingPost ? 'Post actualizado correctamente.' : 'Post creado correctamente.', severity: 'success' });
      fetchPosts();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await adminFetch(`/api/blog/${deleteTarget._id || deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.error) {
      setSnack({ open: true, msg: `Error al eliminar: ${res.error}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: 'Post eliminado.', severity: 'success' });
      fetchPosts();
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>
            Gestor de Blog
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Administra los artículos del sitio
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            borderRadius: '12px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #085946, #0d7a5f)',
            boxShadow: '0 4px 16px rgba(8,89,70,0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #063c2c, #085946)' },
          }}
        >
          Nuevo post
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Card sx={GLASS_CARD}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#085946' }} />
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No hay posts. Crea el primero.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: '6px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(8,89,70,0.04)' }}>
                    {['Título', 'Categoría', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', py: 1.8 }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(posts) ? posts : []).map((post, i) => (
                    <TableRow
                      key={post._id || post.id || i}
                      sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' }, transition: 'background 0.15s' }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 280 }}>
                        <Typography
                          noWrap
                          sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 260 }}
                          title={post.titulo || post.title}
                        >
                          {post.titulo || post.title || '(Sin título)'}
                        </Typography>
                        {post.destacado && (
                          <Typography sx={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>★ Destacado</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                        {CATEGORIAS.find((c) => c.value === (post.categoria || post.category))?.label || post.categoria || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[post.estado || post.status] || post.estado || '—'}
                          color={statusColors[post.estado || post.status] || 'default'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleOpenEdit(post)} sx={{ color: '#085946' }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => setDeleteTarget(post)} sx={{ color: '#ef4444' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '22px',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>
          {editingPost ? 'Editar post' : 'Nuevo post'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Título"
                fullWidth
                value={form.titulo}
                onChange={handleFormChange('titulo')}
                variant="outlined"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Slug"
                fullWidth
                value={form.slug}
                onChange={handleFormChange('slug')}
                variant="outlined"
                size="small"
                required
                helperText="URL del post"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Resumen"
                fullWidth
                value={form.resumen}
                onChange={handleFormChange('resumen')}
                variant="outlined"
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contenido"
                fullWidth
                value={form.contenido}
                onChange={handleFormChange('contenido')}
                variant="outlined"
                size="small"
                multiline
                rows={8}
                placeholder="Markdown soportado"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                Imagen de portada
              </Typography>
              <CoverUploader value={form.imagenPortada} onChange={(url) => setForm((f) => ({ ...f, imagenPortada: url }))} />
              <TextField
                label="o pega URL"
                fullWidth
                value={form.imagenPortada}
                onChange={handleFormChange('imagenPortada')}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Autor"
                fullWidth
                value={form.autor}
                onChange={handleFormChange('autor')}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select value={form.categoria} onChange={handleFormChange('categoria')} label="Categoría">
                  {CATEGORIAS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={form.estado} onChange={handleFormChange('estado')} label="Estado">
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="PUBLICADO">Publicado</MenuItem>
                  <MenuItem value="ARCHIVADO">Archivado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Tags"
                fullWidth
                value={form.tags}
                onChange={handleFormChange('tags')}
                variant="outlined"
                size="small"
                helperText="Separados por coma"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.destacado}
                    onChange={(e) => setForm((prev) => ({ ...prev, destacado: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#085946' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#085946' },
                    }}
                  />
                }
                label="Destacado"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: '10px', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              borderRadius: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #085946, #0d7a5f)',
              '&:hover': { background: 'linear-gradient(135deg, #063c2c, #085946)' },
            }}
          >
            {saving ? 'Guardando…' : editingPost ? 'Guardar cambios' : 'Crear post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: '6px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar post?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>"{deleteTarget?.titulo || deleteTarget?.title}"</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '10px' }}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          sx={{ borderRadius: '12px', fontWeight: 600 }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
