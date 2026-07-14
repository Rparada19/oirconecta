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
  CircularProgress,
  Alert,
  Snackbar,
  Drawer,
  IconButton,
  Button,
  Divider,
  TextField,
  Avatar,
  Switch,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { adminFetch, getAdminToken } from './adminAuth';
import { exportRowsToExcel, exportRowsToPdf } from '../../utils/adminExport';

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

const STATUS_MAP = {
  PENDING: { label: 'Pendiente', color: 'warning' },
  pending: { label: 'Pendiente', color: 'warning' },
  APPROVED: { label: 'Aprobado', color: 'success' },
  approved: { label: 'Aprobado', color: 'success' },
  REJECTED: { label: 'Rechazado', color: 'error' },
  rejected: { label: 'Rechazado', color: 'error' },
};

const TABS = [
  { label: 'Pendientes', statuses: ['PENDING', 'pending'] },
  { label: 'Aprobados', statuses: ['APPROVED', 'approved'] },
  { label: 'Rechazados', statuses: ['REJECTED', 'rejected'] },
];

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.2 }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.88rem', color: '#1a2035', fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function AdminProfesionalesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { navigate('/login-crm', { replace: true }); return; }
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await adminFetch('/api/directory/admin/profiles');
    if (err) setError(err);
    else {
      const list = data?.data ?? data;
      setProfiles(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  };

  const profilesArray = Array.isArray(profiles) ? profiles : [];
  const filtered = profilesArray.filter((p) => TABS[tab].statuses.includes(p.status));

  const handleRowClick = (profile) => {
    setSelected(profile);
    setRejectionReason('');
    setDrawerOpen(true);
  };

  const handleAction = async (status) => {
    if (!selected) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setSnack({ open: true, msg: 'Por favor ingresa el motivo del rechazo.', severity: 'warning' });
      return;
    }
    setActionLoading(true);
    const body = status === 'REJECTED'
      ? { status: 'REJECTED', rejectionReason: rejectionReason.trim() }
      : { status: 'APPROVED' };
    const accountId = selected.accountId || selected._id || selected.id;
    const res = await adminFetch(`/api/directory/admin/profiles/${accountId}`, { method: 'PATCH', body: JSON.stringify(body) });
    setActionLoading(false);
    if (res.error) {
      setSnack({ open: true, msg: `Error: ${res.error}`, severity: 'error' });
    } else {
      setSnack({
        open: true,
        msg: status === 'APPROVED' ? 'Profesional aprobado correctamente.' : 'Profesional rechazado.',
        severity: 'success',
      });
      setDrawerOpen(false);
      fetchProfiles();
    }
  };

  const getName = (p) =>
    p.nombreConsultorio || p.account?.nombre || p.displayName || p.name || p.account?.email || p.email || '—';
  const getEmail = (p) => p.account?.email || p.email || '—';
  const getCity = (p) => p.workplaces?.[0]?.ciudad || p.workplaces?.[0]?.city || p.ciudad || '—';
  const getStatus = (p) => STATUS_MAP[p.status] || { label: p.status || '—', color: 'default' };

  const profilesToRows = (list) => list.map((p) => ({
    Nombre: getName(p),
    Email: getEmail(p),
    Profesión: p.profession || p.profesion || '',
    Ciudad: getCity(p),
    'Fecha registro': p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO') : '',
    Estado: getStatus(p).label,
  }));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>
            Gestión de Profesionales
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Aprueba o rechaza solicitudes del directorio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} disabled={!filtered.length}
            onClick={() => exportRowsToExcel(profilesToRows(filtered), 'profesionales', 'Profesionales')}>
            Excel
          </Button>
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} disabled={!filtered.length}
            onClick={() => exportRowsToPdf(profilesToRows(filtered), 'profesionales', 'Profesionales — Directorio OírConecta')}>
            PDF
          </Button>
        </Box>
      </Box>

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
                const count = profilesArray.filter((p) => t.statuses.includes(p.status)).length;
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
                No hay profesionales en esta categoría.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: '0 0 16px 16px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                    {['Nombre', 'Email', 'Profesión', 'Ciudad', 'Fecha registro', 'Estado', 'Destacado'].map((h) => (
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
                  {filtered.map((p, i) => {
                    const st = getStatus(p);
                    return (
                      <TableRow
                        key={p._id || p.accountId || i}
                        onClick={() => handleRowClick(p)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { background: 'rgba(8,89,70,0.04)' },
                          transition: 'background 0.15s',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#6d28d9' }}>
                              {getName(p).charAt(0).toUpperCase()}
                            </Avatar>
                            {getName(p)}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {getEmail(p)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem' }}>
                          {p.profession || p.profesion || '—'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                          {getCity(p)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={st.label}
                            color={st.color}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={p.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}>
                            <Switch
                              size="small"
                              checked={!!p.isFeatured}
                              onChange={async (e) => {
                                const isFeatured = e.target.checked;
                                const accountId = p.accountId || p._id || p.id;
                                const r = await adminFetch(`/api/directory/admin/profiles/${accountId}/featured`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ isFeatured }),
                                });
                                if (r.error) {
                                  setSnack({ open: true, msg: `Error: ${r.error}`, severity: 'error' });
                                } else {
                                  setSnack({ open: true, msg: isFeatured ? 'Marcado como destacado.' : 'Quitado de destacados.', severity: 'success' });
                                  fetchProfiles();
                                }
                              }}
                            />
                          </Tooltip>
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

      {/* Profile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            background: 'rgba(255,255,255,0.97)',
            
          },
        }}
      >
        {selected && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer header */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                background: 'linear-gradient(180deg, #041a12 0%, #063c2c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#6ee7c8', color: '#0F2A4A', fontWeight: 800 }}>
                  {getName(selected).charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                    {getName(selected)}
                  </Typography>
                  <Chip
                    label={getStatus(selected).label}
                    color={getStatus(selected).color}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Box>
              </Box>
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Drawer body */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#6d28d9', mb: 2, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Datos personales
              </Typography>
              <InfoRow label="Nombre completo" value={getName(selected)} />
              <InfoRow label="Email" value={getEmail(selected)} />
              <InfoRow label="Profesión" value={selected.profession || selected.profesion} />
              <InfoRow label="Tipo de persona" value={selected.personaTipo === 'JURIDICA' ? 'Centro / Empresa' : selected.personaTipo === 'NATURAL' ? 'Profesional' : (selected.personType || selected.tipoPersona)} />
              <InfoRow label="Documento (Cédula / NIT)" value={selected.documentoIdentidad || selected.documentNumber || selected.documento} />

              {selected.workplaces?.length > 0 && (
                <>
                  <Divider sx={{ my: 2.5, borderColor: 'rgba(8,89,70,0.1)' }} />
                  <Typography sx={{ fontWeight: 700, color: '#6d28d9', mb: 2, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Centros / Sedes
                  </Typography>
                  {selected.workplaces.map((wp, i) => (
                    <Box
                      key={i}
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: '12px',
                        background: 'rgba(8,89,70,0.04)',
                        border: '1px solid rgba(109,40,217,0.08)',
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>
                        {wp.name || wp.nombre || `Sede ${i + 1}`}
                      </Typography>
                      {(wp.city || wp.ciudad) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnOutlinedIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {wp.city || wp.ciudad}{wp.address || wp.direccion ? ` — ${wp.address || wp.direccion}` : ''}
                          </Typography>
                        </Box>
                      )}
                      {wp.phone && (
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.5 }}>
                          Tel: {wp.phone}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </>
              )}

              {selected.status === 'PENDING' || selected.status === 'pending' ? (
                <>
                  <Divider sx={{ my: 2.5, borderColor: 'rgba(8,89,70,0.1)' }} />
                  <Typography sx={{ fontWeight: 700, color: '#6d28d9', mb: 1.5, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Acción de revisión
                  </Typography>
                  <TextField
                    label="Motivo de rechazo (requerido si rechazas)"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => handleAction('APPROVED')}
                      disabled={actionLoading}
                      fullWidth
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #085946, #0d7a5f)',
                        '&:hover': { background: '#063c2c' },
                      }}
                    >
                      {actionLoading ? <CircularProgress size={18} color="inherit" /> : 'Aprobar'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelOutlinedIcon />}
                      onClick={() => handleAction('REJECTED')}
                      disabled={actionLoading}
                      fullWidth
                      sx={{ borderRadius: '12px', fontWeight: 700 }}
                    >
                      {actionLoading ? <CircularProgress size={18} color="inherit" /> : 'Rechazar'}
                    </Button>
                  </Box>
                </>
              ) : null}
            </Box>
          </Box>
        )}
      </Drawer>

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
