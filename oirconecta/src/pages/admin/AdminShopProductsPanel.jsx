import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Tooltip, TextField, MenuItem, FormControlLabel, Switch, Grid, Divider,
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarIcon from '@mui/icons-material/Star';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import * as XLSX from 'xlsx';
import { adminFetch } from './adminAuth';

// Columnas esperadas del Excel de importación.
const IMPORT_COLS = ['nombre', 'categoria', 'marca', 'sku', 'precio', 'precioAntes', 'stock', 'descripcion', 'imageUrls', 'activo', 'destacado', 'variantes'];

const parseBool = (v) => {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return ['1', 'true', 'si', 'sí', 'x', 'activo', 'verdadero'].includes(s);
};
// "8mm Cerrada:1500:50; 10mm Abierta::30" -> [{nombre,precio,stock}]
const parseVariantes = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return [];
  return s.split(';').map((part) => {
    const [nombre, precio, stock] = part.split(':').map((x) => (x ?? '').trim());
    return { nombre, precio: precio === '' || precio == null ? null : Number(precio), stock: stock === '' || stock == null ? null : parseInt(stock, 10) };
  }).filter((x) => x.nombre);
};
const rowToProduct = (row) => {
  // claves insensibles a mayúsculas/espacios
  const get = (key) => {
    const k = Object.keys(row).find((kk) => kk.trim().toLowerCase() === key.toLowerCase());
    return k ? row[k] : undefined;
  };
  return {
    nombre: get('nombre'),
    categoria: String(get('categoria') ?? '').trim().toUpperCase(),
    marca: get('marca'),
    sku: get('sku'),
    precio: get('precio'),
    precioAntes: get('precioAntes'),
    stock: get('stock'),
    descripcion: get('descripcion'),
    imageUrls: String(get('imageUrls') ?? '').split(',').map((x) => x.trim()).filter(Boolean),
    activo: get('activo') === undefined ? true : parseBool(get('activo')),
    destacado: parseBool(get('destacado')),
    variantes: parseVariantes(get('variantes')),
  };
};

const GLASS_CARD = {
  background: '#fff',
  
  borderRadius: '14px',
  border: '1px solid #eef0f3',
  boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
};

// Solo accesorios. NUNCA audífonos (prohibido vender por web en Colombia).
const CATEGORIAS = [
  { value: 'BATERIAS', label: 'Baterías' },
  { value: 'FILTROS', label: 'Filtros' },
  { value: 'OLIVAS', label: 'Olivas' },
  { value: 'CONECTIVIDAD', label: 'Conectividad' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
];

const categoriaLabel = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v || '—';

const formatPrice = (p) => {
  if (p == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);
};

const EMPTY = {
  nombre: '', categoria: 'BATERIAS', marca: '', sku: '',
  precio: '', precioAntes: '', stock: '0', descripcion: '',
  imageUrls: '', activo: true, destacado: false, variantes: [],
};

export default function AdminShopProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [importing, setImporting] = useState(false);
  const fileRef = React.useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  const downloadTemplate = () => {
    const ejemplo = ['Oliva silicona', 'OLIVAS', 'Phonak', 'OLV-01', 1500, '', 0, 'Oliva de repuesto', '', 'si', 'no', '8mm Cerrada:1500:50; 10mm Abierta::30'];
    const ws = XLSX.utils.aoa_to_sheet([IMPORT_COLS, ejemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const products = rows.map(rowToProduct).filter((p) => p.nombre);
      if (!products.length) {
        setSnack({ open: true, msg: 'El archivo no tiene filas válidas.', severity: 'error' });
        setImporting(false);
        return;
      }
      const { ok, data } = await adminFetch('/api/shop/admin/products/bulk', { method: 'POST', body: JSON.stringify({ products }) });
      if (!ok) {
        setSnack({ open: true, msg: `Error: ${data?.error || 'no se pudo importar'}`, severity: 'error' });
      } else {
        const { created, total, errors } = data.data;
        const msg = `Importados ${created}/${total}.` + (errors?.length ? ` ${errors.length} con error.` : '');
        setSnack({ open: true, msg, severity: errors?.length ? 'warning' : 'success' });
        if (errors?.length) console.warn('Errores de importación:', errors);
        fetchProducts();
      }
    } catch (err) {
      setSnack({ open: true, msg: `No se pudo leer el archivo: ${err.message}`, severity: 'error' });
    } finally {
      setImporting(false);
    }
  };

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    const { ok, data } = await adminFetch('/api/shop/admin/products');
    if (!ok) setError(data?.error || 'No se pudieron cargar los productos');
    else setProducts(data?.data || []);
    setLoading(false);
  }

  const openCreate = () => { setEditId(null); setForm(EMPTY); setDialogOpen(true); };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre || '', categoria: p.categoria || 'BATERIAS', marca: p.marca || '',
      sku: p.sku || '', precio: String(p.precio ?? ''), precioAntes: p.precioAntes != null ? String(p.precioAntes) : '',
      stock: String(p.stock ?? 0), descripcion: p.descripcion || '',
      imageUrls: (p.imageUrls || []).join(', '), activo: !!p.activo, destacado: !!p.destacado,
      variantes: Array.isArray(p.variantes) ? p.variantes.map((v) => ({ nombre: v.nombre || '', precio: v.precio ?? '', stock: v.stock ?? '' })) : [],
    });
    setDialogOpen(true);
  };

  const addVariante = () => setForm((f) => ({ ...f, variantes: [...f.variantes, { nombre: '', precio: '', stock: '' }] }));
  const setVariante = (i, k) => (e) => setForm((f) => ({
    ...f, variantes: f.variantes.map((v, idx) => (idx === i ? { ...v, [k]: e.target.value } : v)),
  }));
  const removeVariante = (i) => setForm((f) => ({ ...f, variantes: f.variantes.filter((_, idx) => idx !== i) }));

  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  async function handleSave() {
    if (!form.nombre.trim() || form.precio === '' || isNaN(Number(form.precio))) {
      setSnack({ open: true, msg: 'Nombre y precio válido son requeridos.', severity: 'error' });
      return;
    }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      marca: form.marca.trim() || null,
      sku: form.sku.trim() || null,
      precio: Number(form.precio),
      precioAntes: form.precioAntes === '' ? null : Number(form.precioAntes),
      stock: parseInt(form.stock || '0', 10),
      descripcion: form.descripcion.trim() || null,
      imageUrls: form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean),
      activo: form.activo,
      destacado: form.destacado,
      variantes: form.variantes
        .filter((v) => String(v.nombre).trim())
        .map((v) => ({
          nombre: String(v.nombre).trim(),
          precio: v.precio === '' || v.precio == null ? null : Number(v.precio),
          stock: v.stock === '' || v.stock == null ? null : parseInt(v.stock, 10),
        })),
    };
    const path = editId ? `/api/shop/admin/products/${editId}` : '/api/shop/admin/products';
    const method = editId ? 'PATCH' : 'POST';
    const { ok, data } = await adminFetch(path, { method, body: JSON.stringify(payload) });
    setSaving(false);
    if (!ok) {
      setSnack({ open: true, msg: `Error: ${data?.error || 'no se pudo guardar'}`, severity: 'error' });
    } else {
      setDialogOpen(false);
      setSnack({ open: true, msg: editId ? 'Producto actualizado.' : 'Producto creado.', severity: 'success' });
      fetchProducts();
    }
  }

  async function patchProduct(p, body, okMsg) {
    setActionLoading(p.id);
    const { ok, data } = await adminFetch(`/api/shop/admin/products/${p.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    setActionLoading(null);
    if (!ok) setSnack({ open: true, msg: `Error: ${data?.error || 'no se pudo actualizar'}`, severity: 'error' });
    else { setSnack({ open: true, msg: okMsg, severity: 'success' }); fetchProducts(); }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { ok, data } = await adminFetch(`/api/shop/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    if (!ok) setSnack({ open: true, msg: `Error al eliminar: ${data?.error || ''}`, severity: 'error' });
    else { setSnack({ open: true, msg: 'Producto eliminado.', severity: 'success' }); fetchProducts(); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Productos de la tienda OírConecta (accesorios). No se venden audífonos por web.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="text" size="small" startIcon={<DownloadOutlinedIcon />} onClick={downloadTemplate} sx={{ color: '#6d28d9' }}>
            Plantilla
          </Button>
          <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />} disabled={importing} onClick={() => fileRef.current?.click()}
            sx={{ borderRadius: '10px', fontWeight: 700, borderColor: '#6d28d9', color: '#6d28d9' }}>
            {importing ? 'Importando…' : 'Importar Excel'}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportFile} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ borderRadius: '10px', fontWeight: 700, background: '#6d28d9', '&:hover': { background: '#064a3a' } }}>
            Nuevo producto
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={GLASS_CARD}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#6d28d9' }} />
            </Box>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Aún no hay productos. Crea el primero.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                    {['Producto', 'Categoría', 'Marca', 'Precio', 'Stock', 'Estado', 'Destacado', 'Acciones'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', py: 1.8 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => {
                    const isLoadingThis = actionLoading === p.id;
                    return (
                      <TableRow key={p.id} sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 220 }}>
                          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 200 }} title={p.nombre}>{p.nombre}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{categoriaLabel(p.categoria)}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{p.marca || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatPrice(p.precio)}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>{p.stock}</TableCell>
                        <TableCell>
                          <Chip label={p.activo ? 'Activo' : 'Inactivo'} color={p.activo ? 'success' : 'default'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={p.destacado ? 'Quitar destacado' : 'Marcar destacado'}>
                            <IconButton size="small" disabled={isLoadingThis}
                              onClick={() => patchProduct(p, { destacado: !p.destacado }, p.destacado ? 'Quitado de destacados.' : 'Marcado como destacado.')}
                              sx={{ color: p.destacado ? '#f59e0b' : 'rgba(0,0,0,0.3)' }}>
                              {isLoadingThis ? <CircularProgress size={16} /> : p.destacado ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={p.activo ? 'Desactivar' : 'Activar'}>
                              <IconButton size="small" disabled={isLoadingThis}
                                onClick={() => patchProduct(p, { activo: !p.activo }, p.activo ? 'Producto desactivado.' : 'Producto activado.')}>
                                <Switch checked={p.activo} size="small" readOnly />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#6d28d9' }}><EditOutlinedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" onClick={() => setDeleteTarget(p)} sx={{ color: '#ef4444' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Crear / editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '6px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Nombre" value={form.nombre} onChange={setField('nombre')} fullWidth size="small" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Categoría" value={form.categoria} onChange={setField('categoria')} select fullWidth size="small">
                {CATEGORIAS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Marca" value={form.marca} onChange={setField('marca')} fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Precio (COP)" value={form.precio} onChange={setField('precio')} type="number" fullWidth size="small" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Precio antes (opcional)" value={form.precioAntes} onChange={setField('precioAntes')} type="number" fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Stock" value={form.stock} onChange={setField('stock')} type="number" fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="SKU (opcional)" value={form.sku} onChange={setField('sku')} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descripción" value={form.descripcion} onChange={setField('descripcion')} fullWidth size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="URLs de imágenes (separadas por coma)" value={form.imageUrls} onChange={setField('imageUrls')} fullWidth size="small" />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Variantes (opcional) — ej. tallas/formas de olivas
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addVariante} sx={{ color: '#6d28d9' }}>Agregar</Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Si agregas variantes, el cliente deberá elegir una. Precio y stock por variante son opcionales (si los dejas vacíos, usa los del producto).
              </Typography>
              {form.variantes.map((v, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                  <TextField label="Nombre" value={v.nombre} onChange={setVariante(i, 'nombre')} size="small" sx={{ flex: 2 }} />
                  <TextField label="Precio" value={v.precio} onChange={setVariante(i, 'precio')} type="number" size="small" sx={{ flex: 1 }} />
                  <TextField label="Stock" value={v.stock} onChange={setVariante(i, 'stock')} type="number" size="small" sx={{ flex: 1 }} />
                  <IconButton size="small" onClick={() => removeVariante(i)} sx={{ color: '#ef4444' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={form.activo} onChange={setField('activo')} />} label="Activo" />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Switch checked={form.destacado} onChange={setField('destacado')} />} label="Destacado" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 700, background: '#6d28d9', '&:hover': { background: '#064a3a' } }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: '6px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar producto?</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar <strong>"{deleteTarget?.nombre}"</strong>? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '10px' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting} sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '12px', fontWeight: 600 }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
