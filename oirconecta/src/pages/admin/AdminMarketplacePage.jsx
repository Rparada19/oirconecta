import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
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
  Button,
  Tooltip,
  Switch,
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarIcon from '@mui/icons-material/Star';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { adminFetch, getAdminToken } from './adminAuth';
import AdminShopProductsPanel from './AdminShopProductsPanel';

const GLASS_CARD = {
  background: '#fff',
  
  borderRadius: '14px',
  border: '1px solid #eef0f3',
  boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
};

const HEADER_GRADIENT = {
  background: 'linear-gradient(135deg, #085946 0%, #6ee7c8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const TABS = [
  { label: 'Activos', statuses: ['ACTIVO', 'activo', 'active', 'ACTIVE'] },
  { label: 'Pausados', statuses: ['PAUSADO', 'pausado', 'paused', 'PAUSED', 'INACTIVO', 'inactivo'] },
  { label: 'Todos', statuses: null },
];

const getStatusInfo = (status) => {
  const s = (status || '').toUpperCase();
  if (['ACTIVO', 'ACTIVE'].includes(s)) return { label: 'Activo', color: 'success' };
  if (['PAUSADO', 'PAUSED', 'INACTIVO'].includes(s)) return { label: 'Pausado', color: 'warning' };
  return { label: status || '—', color: 'default' };
};

const formatPrice = (price, currency) => {
  if (price == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function AdminMarketplacePage() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState(0);
  const [tab, setTab] = useState(0);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of item being updated

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { navigate('/login-crm', { replace: true }); return; }
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    const r = await adminFetch('/api/marketplace/admin/all');
    if (!r?.data?.success) {
      setError(r?.data?.error || `HTTP ${r?.status || ''} al cargar servicios`);
      setServices([]);
    } else {
      const list = r.data.data;
      setServices(Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : []);
    }
    setLoading(false);
  };

  const servicesArray = Array.isArray(services) ? services : [];
  const filtered = TABS[tab].statuses
    ? servicesArray.filter((s) => TABS[tab].statuses.includes(s.estado || s.status || ''))
    : servicesArray;

  const handleToggleFeatured = async (item) => {
    const id = item._id || item.id;
    setActionLoading(id);
    const newFeatured = !(item.destacado || item.featured);
    const res = await adminFetch(`/api/marketplace/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ destacado: newFeatured }) });
    setActionLoading(null);
    if (res.error) {
      setSnack({ open: true, msg: `Error: ${res.error}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: newFeatured ? 'Marcado como destacado.' : 'Quitado de destacados.', severity: 'success' });
      fetchServices();
    }
  };

  const handleToggleStatus = async (item) => {
    const id = item._id || item.id;
    setActionLoading(id);
    const currentStatus = (item.estado || item.status || '').toUpperCase();
    const isActive = ['ACTIVO', 'ACTIVE'].includes(currentStatus);
    const newStatus = isActive ? 'PAUSADO' : 'ACTIVO';
    const res = await adminFetch(`/api/marketplace/admin/${id}`, { method: 'PATCH', body: JSON.stringify({ estado: newStatus }) });
    setActionLoading(null);
    if (res.error) {
      setSnack({ open: true, msg: `Error: ${res.error}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: isActive ? 'Servicio pausado.' : 'Servicio activado.', severity: 'success' });
      fetchServices();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const id = deleteTarget._id || deleteTarget.id;
    const res = await adminFetch(`/api/marketplace/admin/${id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    if (res.error) {
      setSnack({ open: true, msg: `Error al eliminar: ${res.error}`, severity: 'error' });
    } else {
      setSnack({ open: true, msg: 'Servicio eliminado.', severity: 'success' });
      fetchServices();
    }
  };

  const getProfessionalName = (item) => {
    if (typeof item.profesional === 'object') {
      return item.profesional?.displayName || item.profesional?.name || item.profesional?.email || '—';
    }
    return item.profesionalNombre || item.professionalName || item.profesional || '—';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>
          Gestión de Marketplace
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Servicios de profesionales y productos de la tienda OírConecta
        </Typography>
      </Box>

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', textTransform: 'none' },
          '& .Mui-selected': { color: '#6d28d9' },
          '& .MuiTabs-indicator': { backgroundColor: '#6d28d9' },
        }}
      >
        <Tab label="Servicios de profesionales" />
        <Tab label="Productos (tienda)" />
      </Tabs>

      {mainTab === 1 ? (
        <AdminShopProductsPanel />
      ) : (
      <>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      <Card sx={GLASS_CARD}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2, borderBottom: '1px solid rgba(109,40,217,0.08)' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.85rem', textTransform: 'none' },
                '& .Mui-selected': { color: '#6d28d9' },
                '& .MuiTabs-indicator': { backgroundColor: '#6d28d9' },
              }}
            >
              {TABS.map((t, i) => {
                const count = t.statuses
                  ? servicesArray.filter((s) => t.statuses.includes(s.estado || s.status || '')).length
                  : servicesArray.length;
                return <Tab key={t.label} label={`${t.label} (${count})`} />;
              })}
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#6d28d9' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No hay servicios en esta categoría.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: '0 0 16px 16px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                    {['Título', 'Profesional', 'Categoría', 'Precio', 'Estado', 'Destacado', 'Acciones'].map((h) => (
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
                  {filtered.map((item, i) => {
                    const id = item._id || item.id;
                    const isLoadingThis = actionLoading === id;
                    const st = getStatusInfo(item.estado || item.status);
                    const isFeatured = item.destacado || item.featured;
                    const currentStatus = (item.estado || item.status || '').toUpperCase();
                    const isActive = ['ACTIVO', 'ACTIVE'].includes(currentStatus);

                    return (
                      <TableRow
                        key={id || i}
                        sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' }, transition: 'background 0.15s' }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 220 }}>
                          <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 200 }} title={item.titulo || item.title}>
                            {item.titulo || item.title || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {getProfessionalName(item)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {item.categoria || item.category || '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {formatPrice(item.precio || item.price, item.moneda || item.currency)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={st.label}
                            color={st.color}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={isFeatured ? 'Quitar destacado' : 'Marcar destacado'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleFeatured(item)}
                              disabled={isLoadingThis}
                              sx={{ color: isFeatured ? '#f59e0b' : 'rgba(0,0,0,0.3)' }}
                            >
                              {isLoadingThis ? (
                                <CircularProgress size={16} />
                              ) : isFeatured ? (
                                <StarIcon fontSize="small" />
                              ) : (
                                <StarOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={isActive ? 'Pausar servicio' : 'Activar servicio'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(item)}
                                disabled={isLoadingThis}
                                sx={{ color: isActive ? '#f59e0b' : '#6d28d9' }}
                              >
                                {isLoadingThis ? (
                                  <CircularProgress size={16} />
                                ) : isActive ? (
                                  <PauseCircleOutlineIcon fontSize="small" />
                                ) : (
                                  <PlayCircleOutlineIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteTarget(item)}
                                disabled={isLoadingThis}
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
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
      </>
      )}

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{ sx: { borderRadius: '6px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar servicio?</DialogTitle>
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
