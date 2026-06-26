import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Campaign,
  ArrowBack,
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  People,
  CalendarToday,
} from '@mui/icons-material';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  getCampaignDashboard,
  MARCAS,
  ALIMENTACION_AUDIFONO,
  labelValidezCantidadAudifonos,
  detalleValidezSegundoAudifono,
  APLICACION_DESCUENTO_CAMPAIGN,
  labelAplicacionDescuento,
  detalleAplicacionDescuento,
} from '../../services/campaignService';
import { getConfig } from '../../services/configService';
import {
  plataformaCatalogoLabel,
  plataformasKeysSorted,
} from '../../utils/marketplaceProduct';
import { useAuth } from '../../context/AuthContext';
import { canManageCampaigns, ROLES } from '../../utils/rolePermissions';
import PageHeader from '../../components/crm/ui/PageHeader';
import KpiCard from '../../components/crm/ui/KpiCard';

/** Menú de desplegables: sombra suave, bordes redondeados, ítems aireados */
const SELECT_MENU_PAPER_PROPS = {
  sx: {
    borderRadius: 2,
    mt: 1,
    maxWidth: 'min(calc(100vw - 24px), 560px)',
    boxShadow: '0 12px 40px rgba(39, 47, 80, 0.14), 0 2px 8px rgba(8, 89, 70, 0.06)',
    border: '1px solid rgba(8, 89, 70, 0.1)',
    overflow: 'hidden',
    py: 0.5,
    '& .MuiMenuItem-root': {
      whiteSpace: 'normal',
      alignItems: 'flex-start',
      py: 1.1,
      px: 1.25,
      mx: 0.75,
      my: 0.125,
      borderRadius: 1.5,
      fontSize: '0.9375rem',
      transition: 'background-color 0.15s ease',
    },
    '& .MuiMenuItem-root.Mui-selected': {
      bgcolor: 'rgba(8, 89, 70, 0.1)',
      fontWeight: 600,
    },
    '& .MuiMenuItem-root.Mui-selected:hover': {
      bgcolor: 'rgba(8, 89, 70, 0.14)',
    },
    '& .MuiListItemText-root': { margin: 0 },
    '& .MuiListItemText-primary': {
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
    },
    '& .MuiListItemText-secondary': {
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
    },
  },
};

/** Superficie del campo (evita la línea “tubo” a todo el ancho del diálogo) */
const campaignSelectSx = {
  borderRadius: '10px',
  bgcolor: 'rgba(8, 89, 70, 0.04)',
  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    bgcolor: 'rgba(8, 89, 70, 0.065)',
  },
  '&.Mui-focused': {
    bgcolor: '#fff',
    boxShadow: '0 0 0 2px rgba(8, 89, 70, 0.2)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(8, 89, 70, 0.14)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(8, 89, 70, 0.26)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#085946',
    borderWidth: 1,
  },
};

const dialogContentFormSx = {
  pt: 2,
  px: { xs: 2, sm: 3 },
  overflowX: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 0.25,
  '& .MuiTextField-root': { maxWidth: '100%', minWidth: 0, alignSelf: 'stretch' },
  '& .MuiFormControl-root': { minWidth: 0 },
  '& .MuiInputBase-input': { overflowWrap: 'anywhere', wordBreak: 'break-word' },
  '& .MuiInputBase-inputMultiline': { overflowWrap: 'anywhere', wordBreak: 'break-word' },
};

const emptyForm = () => ({
  nombre: '',
  proveedorNombre: '',
  fabricante: '',
  marcaOtra: '',
  descuentoAprobado: 0,
  aplicacionDescuento: 'TOTAL_VENTA',
  referenciaDescuento: '',
  tecnologiaDescuento: '',
  alimentacionAudifono: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  incluye: '',
  noIncluye: '',
  estado: 'ACTIVA',
  catalogProductIds: [],
  plataformaCampana: 'TODAS',
});

function isCampaignVigente(c) {
  const now = new Date();
  const fi = new Date(`${c.fechaInicio}T00:00:00`);
  const ff = new Date(`${c.fechaFin}T23:59:59`);
  return fi <= now && ff >= now;
}

function isCampaignActivaEstado(c) {
  return (c.estado || '').toLowerCase() === 'activa';
}

function labelEstadoCotizacion(estado) {
  const m = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CONVERTED: 'Convertida a venta',
  };
  return m[estado] || estado || '—';
}

function labelCategoriaVenta(cat) {
  const m = {
    HEARING_AID: 'Audífono',
    ACCESSORY: 'Accesorio',
    SERVICE: 'Servicio / consulta',
  };
  return m[cat] || cat || '—';
}

function labelRecargableCotizacion(k) {
  const s = String(k || '').trim().toUpperCase();
  if (s === 'SI' || s === 'SÍ') return 'Recargable';
  if (s === 'NO' || !s) return 'No recargable / pila';
  return String(k);
}

const CampanasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === ROLES.ADMIN;
  const canEdit = canManageCampaigns(user?.role);

  const [campaigns, setCampaignsState] = useState([]);
  const [marcaFilter, setMarcaFilter] = useState('');
  const [soloActivasVigentes, setSoloActivasVigentes] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm());

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsCampaign, setStatsCampaign] = useState(null);
  const [statsData, setStatsData] = useState(null);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [panelCampaignId, setPanelCampaignId] = useState('');
  const [panelStats, setPanelStats] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      const list = await getCampaigns();
      setCampaignsState(list);
    } catch (e) {
      console.error('[CampanasPage] Error al cargar campañas:', e);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const d = await getCampaignDashboard();
      setDashboardData(d);
    } catch (e) {
      console.error('[CampanasPage] Error al cargar panel:', e);
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/portal-crm', { replace: true });
      return;
    }
    loadCampaigns();
    loadDashboard();
    const interval = setInterval(() => {
      loadCampaigns();
      loadDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, navigate, loadCampaigns, loadDashboard]);

  useEffect(() => {
    if (!panelCampaignId) {
      setPanelStats(null);
      return;
    }
    let cancelled = false;
    setPanelLoading(true);
    getCampaignStats(panelCampaignId).then((d) => {
      if (!cancelled) {
        setPanelStats(d);
        setPanelLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [panelCampaignId]);

  const campaignsOrdenadas = useMemo(
    () => [...campaigns].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })),
    [campaigns],
  );

  const campaignsFiltradas = useMemo(() => {
    let list = campaigns;
    if (marcaFilter) {
      list = list.filter((c) => (c.fabricante || '').trim() === marcaFilter);
    }
    if (soloActivasVigentes) {
      list = list.filter((c) => isCampaignActivaEstado(c) && isCampaignVigente(c));
    }
    return list;
  }, [campaigns, marcaFilter, soloActivasVigentes]);

  const plataformasKeysMarca = useMemo(() => {
    if (!createDialogOpen) return [];
    const marca = createForm.fabricante === '__OTRA__'
      ? (createForm.marcaOtra || '').trim()
      : (createForm.fabricante || '').trim();
    if (!marca) return [];
    const prods = (getConfig().marketplace?.productos || []).filter(
      (p) => p.activo !== false && (p.marca || '').trim() === marca,
    );
    return plataformasKeysSorted(prods);
  }, [createDialogOpen, createForm.fabricante, createForm.marcaOtra]);

  useEffect(() => {
    if (!createDialogOpen) return;
    setCreateForm((f) => {
      const cur = f.plataformaCampana || 'TODAS';
      if (cur === 'TODAS') return f;
      if (!plataformasKeysMarca.length || !plataformasKeysMarca.includes(cur)) {
        return { ...f, plataformaCampana: 'TODAS' };
      }
      return f;
    });
  }, [createDialogOpen, plataformasKeysMarca]);

  const getEstadoChip = (estado) => {
    const e = (estado || '').toLowerCase();
    if (e === 'activa') {
      return <Chip label="Activa" size="small" sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }} />;
    }
    if (e === 'pausada') {
      return <Chip label="Pausada" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />;
    }
    return <Chip label="Finalizada" size="small" sx={{ bgcolor: '#f5f5f5', color: '#757575', fontWeight: 600 }} />;
  };

  const openStats = async (c) => {
    setStatsCampaign(c);
    setStatsData(null);
    setStatsOpen(true);
    setStatsLoading(true);
    const data = await getCampaignStats(c.id);
    setStatsData(data);
    setStatsLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setCreateForm(emptyForm());
    setCreateDialogOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    const otra = c.fabricante && !MARCAS.includes(c.fabricante) ? c.fabricante : '';
    setCreateForm({
      ...emptyForm(),
      nombre: c.nombre || '',
      proveedorNombre: c.proveedorNombre || '',
      fabricante: otra ? '__OTRA__' : c.fabricante || '',
      marcaOtra: otra,
      descuentoAprobado: c.descuentoAprobado ?? 0,
      aplicacionDescuento: c.aplicacionDescuento || 'TOTAL_VENTA',
      referenciaDescuento: c.referenciaDescuento || '',
      tecnologiaDescuento: c.tecnologiaDescuento || '',
      alimentacionAudifono: c.alimentacionAudifono || '',
      descripcion: c.descripcion || '',
      fechaInicio: c.fechaInicio || '',
      fechaFin: c.fechaFin || '',
      incluye: c.incluye || '',
      noIncluye: c.noIncluye || '',
      estado: (c.estado || 'ACTIVA').toUpperCase(),
      catalogProductIds: Array.isArray(c.catalogProductIds) ? [...c.catalogProductIds] : [],
      plataformaCampana: c.plataformaCampana || 'TODAS',
    });
    setCreateDialogOpen(true);
  };

  const marcaEfectiva = () => {
    if (createForm.fabricante === '__OTRA__') return (createForm.marcaOtra || '').trim();
    return (createForm.fabricante || '').trim();
  };

  const handleSaveCampaign = async () => {
    const marca = marcaEfectiva();
    if (!createForm.nombre?.trim() || !createForm.fechaInicio || !createForm.fechaFin) return;
    setCreateLoading(true);
    const payload = {
      nombre: createForm.nombre.trim(),
      tipo: 'Audífonos',
      fechaInicio: createForm.fechaInicio,
      fechaFin: createForm.fechaFin,
      fabricante: marca || undefined,
      descuentoAprobado: Number(createForm.descuentoAprobado) || 0,
      aplicacionDescuento: createForm.aplicacionDescuento || 'TOTAL_VENTA',
      proveedorNombre: createForm.proveedorNombre?.trim() || undefined,
      referenciaDescuento: createForm.referenciaDescuento?.trim() || undefined,
      tecnologiaDescuento: createForm.tecnologiaDescuento?.trim() || undefined,
      alimentacionAudifono: createForm.alimentacionAudifono || undefined,
      descripcion: createForm.descripcion?.trim() || undefined,
      incluye: createForm.incluye?.trim() || undefined,
      noIncluye: createForm.noIncluye?.trim() || undefined,
      catalogProductIds: createForm.catalogProductIds || [],
      plataformaCampana: createForm.plataformaCampana || 'TODAS',
    };
    let result;
    if (editingId) {
      result = await updateCampaign(editingId, { ...payload, estado: createForm.estado });
    } else {
      result = await createCampaign(payload);
    }
    setCreateLoading(false);
    if (result.success) {
      setCreateDialogOpen(false);
      setEditingId(null);
      setCreateForm(emptyForm());
      loadCampaigns();
      loadDashboard();
    } else {
      window.alert(result.error || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    const r = await deleteCampaign(deleteId);
    setDeleteLoading(false);
    setDeleteId(null);
    if (r.success) {
      loadCampaigns();
      loadDashboard();
    } else window.alert(r.error || 'No se pudo eliminar');
  };

  const calculateRate = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

  if (!isAdmin) {
    return null;
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
      <PageHeader
        icon={Campaign}
        title="Campañas de marketing"
        subtitle="Campañas por marca, vigencias, cotizaciones y ventas asociadas"
        actions={canEdit && (
          <Button
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={openCreate}
            size="small"
            variant="contained"
            sx={{ bgcolor: '#085946', fontWeight: 600, textTransform: 'none',
              '&:hover': { bgcolor: '#064a3a' } }}
          >
            Nueva campaña
          </Button>
        )}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2, border: '1px solid rgba(8, 89, 70, 0.08)' }}>
          <FormControl size="small" sx={{ minWidth: 196, maxWidth: 300, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Marca</InputLabel>
            <Select
              label="Marca"
              value={marcaFilter}
              onChange={(e) => setMarcaFilter(e.target.value)}
              sx={campaignSelectSx}
              MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
            >
              <MenuItem value="">Todas</MenuItem>
              {MARCAS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={soloActivasVigentes} onChange={(e) => setSoloActivasVigentes(e.target.checked)} color="primary" />}
            label="Solo activas y en vigencia (fechas)"
          />
        </Paper>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, textAlign: 'center', p: 2, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {dashboardLoading && !dashboardData ? (
                <CircularProgress size={32} sx={{ color: '#085946', mx: 'auto' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                    {(dashboardData?.summary?.activeCampaignsCount ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', fontWeight: 600, mt: 0.5 }}>
                    Campañas activas
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.75, px: 0.5 }}>
                    Estado activa y vigentes en fechas (todas las marcas)
                  </Typography>
                </>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, textAlign: 'center', p: 2, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {dashboardLoading && !dashboardData ? (
                <CircularProgress size={32} sx={{ color: '#272F50', mx: 'auto' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                    {(dashboardData?.summary?.activeQuotesCount ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', fontWeight: 600, mt: 0.5 }}>
                    Cotizaciones activas
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.75, px: 0.5 }}>
                    Pendiente o aprobada. Con campaña:{' '}
                    {(dashboardData?.summary?.quotesActiveWithCampaignCount ?? 0).toLocaleString()}
                  </Typography>
                </>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, textAlign: 'center', p: 2, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {dashboardLoading && !dashboardData ? (
                <CircularProgress size={32} sx={{ color: '#0a6b56', mx: 'auto' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ color: '#0a6b56', fontWeight: 700 }}>
                    {(dashboardData?.summary?.salesTotalCount ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', fontWeight: 600, mt: 0.5 }}>
                    Ventas realizadas
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.75, px: 0.5 }}>
                    Total histórico en sistema. Con campaña:{' '}
                    {(dashboardData?.summary?.ventasConCampañaTotal ?? 0).toLocaleString()}
                  </Typography>
                </>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, textAlign: 'center', p: 2, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {dashboardLoading && !dashboardData ? (
                <CircularProgress size={32} sx={{ color: '#085946', mx: 'auto' }} />
              ) : (
                <>
                  <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                    {(dashboardData?.summary?.pastCampaignQuotesCount ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', fontWeight: 600, mt: 0.5 }}>
                    Cotiz. campañas pasadas
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.75, px: 0.5 }}>
                    Vinculadas a campañas finalizadas, pausadas o fuera de vigencia
                  </Typography>
                </>
              )}
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, border: '1px solid rgba(8, 89, 70, 0.08)', boxShadow: '0 4px 20px rgba(39, 47, 80, 0.06)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>
            Resumen operativo (datos reales de cotizaciones y ventas)
          </Typography>
          {!dashboardData && !dashboardLoading ? (
            <Typography variant="body2" color="text.secondary">
              No se pudo cargar el panel. Compruebe sesión y permisos de administrador.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Campañas activas por alimentación
                </Typography>
                <TableContainer sx={{ mt: 1, border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableBody>
                      {[
                        ['RECARGABLE', 'Recargable'],
                        ['BATERIA', 'Pila / batería'],
                        ['AMBOS', 'Ambos'],
                        ['SIN_ESPECIFICAR', 'Sin especificar'],
                      ].map(([key, lab]) => (
                        <TableRow key={key}>
                          <TableCell>{lab}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {(dashboardData?.campaignsActiveByAlimentacion?.[key] ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mt: 2 }}>
                  Tipo de campaña (texto «tipo»)
                </Typography>
                <TableContainer sx={{ mt: 1, border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Incluye «accesorio»</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {(dashboardData?.campaignsActiveTipo?.accesorioPorTipoCampana ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Resto (p. ej. audífonos)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {(dashboardData?.campaignsActiveTipo?.resto ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cotizaciones con campaña por recargable
                </Typography>
                <TableContainer sx={{ mt: 1, border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Recargable (cotización)</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Activas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        const all = dashboardData?.cotizacionesConCampañaPorRecargable || {};
                        const act = dashboardData?.cotizacionesActivasConCampañaPorRecargable || {};
                        const keys = [...new Set([...Object.keys(all), ...Object.keys(act)])].sort((a, b) =>
                          a.localeCompare(b, 'es', { sensitivity: 'base' }),
                        );
                        if (!keys.length) {
                          return (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return keys.map((k) => (
                          <TableRow key={k}>
                            <TableCell>{labelRecargableCotizacion(k)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{(all[k] || 0).toLocaleString()}</TableCell>
                            <TableCell align="right">{(act[k] || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mt: 2 }}>
                  Cotizaciones con campaña por estado
                </Typography>
                <TableContainer sx={{ mt: 1, border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableBody>
                      {['PENDING', 'APPROVED', 'CONVERTED', 'REJECTED'].map((st) => (
                        <TableRow key={st}>
                          <TableCell>{labelEstadoCotizacion(st)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {(dashboardData?.cotizacionesConCampañaPorEstado?.[st] ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mt: 2 }}>
                  Ventas con campaña por categoría
                </Typography>
                <TableContainer sx={{ mt: 1, border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2 }}>
                  <Table size="small">
                    <TableBody>
                      {['HEARING_AID', 'ACCESSORY', 'SERVICE'].map((cat) => (
                        <TableRow key={cat}>
                          <TableCell>{labelCategoriaVenta(cat)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {(dashboardData?.ventasConCampañaPorCategoria?.[cat] ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 3, border: '1px solid rgba(8, 89, 70, 0.08)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#272F50', mb: 1.5 }}>
            Detalle por campaña
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elija una campaña para ver cotizaciones y ventas asociadas. También puede abrir el informe completo.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <FormControl size="small" sx={{ minWidth: 220, maxWidth: 420, flex: '1 1 220px' }}>
              <InputLabel>Campaña</InputLabel>
              <Select
                label="Campaña"
                value={panelCampaignId}
                onChange={(e) => setPanelCampaignId(e.target.value)}
                sx={campaignSelectSx}
                MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Seleccione…</em>
                </MenuItem>
                {campaignsOrdenadas.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                    {c.fabricante ? ` · ${c.fabricante}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {panelCampaignId && (
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => {
                  const c = campaigns.find((x) => x.id === panelCampaignId);
                  if (c) openStats(c);
                }}
                sx={{ borderColor: '#085946', color: '#085946' }}
              >
                Informe completo
              </Button>
            )}
          </Box>
          {panelCampaignId && (
            <Box sx={{ mt: 2 }}>
              {panelLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">Cargando datos…</Typography>
                </Box>
              ) : panelStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#085946' }}>{panelStats.quotesTotal}</Typography>
                      <Typography variant="caption" color="text.secondary">Cotizaciones</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>{panelStats.salesTotal}</Typography>
                      <Typography variant="caption" color="text.secondary">Ventas</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">Sin datos para esta campaña.</Typography>
              )}
            </Box>
          )}
        </Paper>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#272F50' }}>
          Listado
        </Typography>
        <Grid container spacing={3}>
          {campaignsFiltradas.map((campaign) => (
            <Grid item xs={12} key={campaign.id}>
              <Card
                sx={{
                  border: '1px solid rgba(8, 89, 70, 0.1)',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(8, 89, 70, 0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': { boxShadow: '0 8px 24px rgba(8, 89, 70, 0.12)' },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: 0, maxWidth: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {campaign.nombre}
                        </Typography>
                        {getEstadoChip(campaign.estado)}
                        <Chip label={campaign.fabricante || 'Sin marca'} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {new Date(`${campaign.fechaInicio}T12:00:00`).toLocaleDateString('es-CO')} —{' '}
                        {new Date(`${campaign.fechaFin}T12:00:00`).toLocaleDateString('es-CO')}
                      </Typography>
                      {campaign.proveedorNombre && (
                        <Typography variant="body2" sx={{ color: '#272F50' }}>
                          Proveedor: <strong>{campaign.proveedorNombre}</strong>
                        </Typography>
                      )}
                      {campaign.descripcion && (
                        <Typography variant="body2" sx={{ color: '#5a6272', mt: 1, whiteSpace: 'pre-wrap' }}>
                          {campaign.descripcion.length > 280 ? `${campaign.descripcion.slice(0, 280)}…` : campaign.descripcion}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" sx={{ color: '#085946' }} onClick={() => openStats(campaign)} title="Informe">
                        <Visibility />
                      </IconButton>
                      {canEdit && (
                        <>
                          <IconButton size="small" sx={{ color: '#085946' }} onClick={() => openEdit(campaign)} title="Editar">
                            <Edit />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#c62828' }} onClick={() => setDeleteId(campaign.id)} title="Eliminar">
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Grid container spacing={2} sx={{ '& > .MuiGrid-item': { minWidth: 0 } }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, overflow: 'hidden' }}>
                        <People sx={{ fontSize: 28, color: '#085946' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {campaign.destinatarios.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Destinatarios
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {campaign.descuentoAprobado}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Descuento aprobado
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {campaign.alimentacionAudifono || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Alimentación
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <TrendingUp sx={{ fontSize: 28, color: '#272F50' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {calculateRate(campaign.clicks, campaign.destinatarios)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Clics
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 0.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        <strong>Válido para (1.er / 2.º audífono):</strong>{' '}
                        {labelValidezCantidadAudifonos(campaign.validezCantidadAudifonos)}
                      </Typography>
                      {campaign.validezCantidadAudifonos ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, pt: 0.25, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {detalleValidezSegundoAudifono(campaign.validezCantidadAudifonos)}
                        </Typography>
                      ) : null}
                      <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 1, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        <strong>Aplicación del % de descuento:</strong> {labelAplicacionDescuento(campaign.aplicacionDescuento)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, pt: 0.25, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {detalleAplicacionDescuento(campaign.aplicacionDescuento)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {campaignsFiltradas.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No hay campañas con el filtro actual.</Typography>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Informe: cotizaciones por marca + ventas por mes/marca */}
      <Dialog open={statsOpen} onClose={() => { setStatsOpen(false); setStatsCampaign(null); setStatsData(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#085946', color: '#fff', fontWeight: 700 }}>
          Informe — {statsCampaign?.nombre}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {statsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {!statsLoading && statsData && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Marca campaña: <strong>{statsData.campaign?.fabricante || '—'}</strong> · Vigencia:{' '}
                {statsData.campaign?.fechaInicio && new Date(statsData.campaign.fechaInicio).toLocaleDateString('es-CO')} —{' '}
                {statsData.campaign?.fechaFin && new Date(statsData.campaign.fechaFin).toLocaleDateString('es-CO')}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                1. Cotizaciones por marca
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Marca (cotización)</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Valor total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(statsData.quotesByMarca || []).map((row) => (
                      <TableRow key={row.marca}>
                        <TableCell>{row.marca}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">${Math.round(row.totalValor).toLocaleString('es-CO')}</TableCell>
                      </TableRow>
                    ))}
                    {(!statsData.quotesByMarca || statsData.quotesByMarca.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3}>Sin cotizaciones vinculadas a esta campaña.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                2. Ventas por mes y por marca
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell>Marca (venta)</TableCell>
                      <TableCell align="right">Ventas</TableCell>
                      <TableCell align="right">Valor total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(statsData.salesByMonthAndMarca || []).map((row) => (
                      <TableRow key={`${row.yearMonth}-${row.marca}`}>
                        <TableCell>{row.yearMonth}</TableCell>
                        <TableCell>{row.marca}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right">${Math.round(row.totalValor).toLocaleString('es-CO')}</TableCell>
                      </TableRow>
                    ))}
                    {(!statsData.salesByMonthAndMarca || statsData.salesByMonthAndMarca.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4}>Sin ventas vinculadas a esta campaña.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setStatsOpen(false); setStatsCampaign(null); setStatsData(null); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Crear / Editar */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingId(null);
          setCreateForm(emptyForm());
        }}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700, pr: 6 }}>
          {editingId ? 'Editar campaña' : 'Nueva campaña'}
        </DialogTitle>
        <DialogContent sx={dialogContentFormSx}>
          <TextField
            fullWidth
            label="1. Nombre de la campaña"
            margin="dense"
            required
            value={createForm.nombre}
            onChange={(e) => setCreateForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <TextField
            fullWidth
            label="2. Nombre del proveedor"
            margin="dense"
            value={createForm.proveedorNombre}
            onChange={(e) => setCreateForm((f) => ({ ...f, proveedorNombre: e.target.value }))}
          />
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" sx={{ minWidth: 0 }}>
                <InputLabel>3. Marca de audífonos</InputLabel>
                <Select
                  label="3. Marca de audífonos"
                  value={createForm.fabricante}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fabricante: e.target.value }))}
                  sx={campaignSelectSx}
                  MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                  SelectDisplayProps={{ style: { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {MARCAS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                  <MenuItem value="__OTRA__">Otra (escribir)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" sx={{ minWidth: 0 }} disabled={!marcaEfectiva()}>
                <InputLabel>4. Plataforma</InputLabel>
                <Select
                  label="4. Plataforma"
                  value={createForm.plataformaCampana || 'TODAS'}
                  onChange={(e) => setCreateForm((f) => ({ ...f, plataformaCampana: e.target.value }))}
                  sx={campaignSelectSx}
                  MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                  renderValue={(v) => (v === 'TODAS' ? 'Todas las plataformas' : plataformaCatalogoLabel(v))}
                  SelectDisplayProps={{ style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                >
                  <MenuItem value="TODAS">Todas las plataformas</MenuItem>
                  {plataformasKeysMarca.map((pk) => (
                    <MenuItem key={pk} value={pk}>
                      {plataformaCatalogoLabel(pk)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {createForm.fabricante === '__OTRA__' && (
            <TextField
              fullWidth
              label="Marca (texto libre)"
              margin="dense"
              value={createForm.marcaOtra}
              onChange={(e) => setCreateForm((f) => ({ ...f, marcaOtra: e.target.value }))}
            />
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 0.5, wordBreak: 'break-word' }}>
            {marcaEfectiva()
              ? 'La campaña queda definida por marca y, si aplica, por plataforma (alineado con el catálogo en Portal → Productos).'
              : 'Defina la marca de la campaña para poder elegir plataforma.'}
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%', alignItems: 'flex-start', mt: 0.25 }}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                fullWidth
                label="5. Descuento otorgado al paciente (%)"
                type="number"
                margin="dense"
                inputProps={{ min: 0, max: 100 }}
                value={createForm.descuentoAprobado}
                onChange={(e) => setCreateForm((f) => ({ ...f, descuentoAprobado: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} sm={8} md={9}>
              <FormControl fullWidth margin="dense" sx={{ minWidth: 0 }}>
                <InputLabel>Aplicación del descuento (%)</InputLabel>
                <Select
                  label="Aplicación del descuento (%)"
                  value={createForm.aplicacionDescuento}
                  onChange={(e) => setCreateForm((f) => ({ ...f, aplicacionDescuento: e.target.value }))}
                  sx={campaignSelectSx}
                  MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                  renderValue={(v) => APLICACION_DESCUENTO_CAMPAIGN.find((o) => o.value === v)?.label || '—'}
                  SelectDisplayProps={{ style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                >
                  {APLICACION_DESCUENTO_CAMPAIGN.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <ListItemText primary={o.label} secondary={o.detalle} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mb: 0.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {detalleAplicacionDescuento(createForm.aplicacionDescuento)}
          </Typography>
          <TextField
            fullWidth
            label="6. Referencia válida en el descuento"
            margin="dense"
            multiline
            minRows={2}
            value={createForm.referenciaDescuento}
            onChange={(e) => setCreateForm((f) => ({ ...f, referenciaDescuento: e.target.value }))}
          />
          <TextField
            fullWidth
            label="7. Tecnología válida en el descuento"
            margin="dense"
            value={createForm.tecnologiaDescuento}
            onChange={(e) => setCreateForm((f) => ({ ...f, tecnologiaDescuento: e.target.value }))}
          />
          <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 420 }, alignSelf: 'flex-start' }}>
            <FormControl fullWidth margin="dense" sx={{ minWidth: 0 }}>
            <InputLabel>8. Tipo de audífono</InputLabel>
            <Select
              label="8. Tipo de audífono"
                value={createForm.alimentacionAudifono}
                onChange={(e) => setCreateForm((f) => ({ ...f, alimentacionAudifono: e.target.value }))}
                sx={campaignSelectSx}
                MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                renderValue={(v) => ALIMENTACION_AUDIFONO.find((o) => o.value === v)?.label || 'Sin especificar'}
                SelectDisplayProps={{ style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
              >
                <MenuItem value="">
                  <em>Sin especificar</em>
                </MenuItem>
                {ALIMENTACION_AUDIFONO.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            label="9. Descripción"
            margin="dense"
            multiline
            minRows={3}
            value={createForm.descripcion}
            onChange={(e) => setCreateForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
          <Grid container spacing={1} sx={{ mt: 0.5, width: '100%', '& > .MuiGrid-item': { minWidth: 0 } }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="10. Fecha inicio"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={createForm.fechaInicio}
                onChange={(e) => setCreateForm((f) => ({ ...f, fechaInicio: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="10. Fecha fin"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={createForm.fechaFin}
                onChange={(e) => setCreateForm((f) => ({ ...f, fechaFin: e.target.value }))}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="11. Qué incluye la campaña"
            margin="dense"
            multiline
            minRows={2}
            value={createForm.incluye}
            onChange={(e) => setCreateForm((f) => ({ ...f, incluye: e.target.value }))}
          />
          <TextField
            fullWidth
            label="12. Qué no incluye"
            margin="dense"
            multiline
            minRows={2}
            value={createForm.noIncluye}
            onChange={(e) => setCreateForm((f) => ({ ...f, noIncluye: e.target.value }))}
          />
          {editingId && (
            <Box sx={{ width: '100%', maxWidth: 280, alignSelf: 'flex-start', mt: 1 }}>
              <FormControl fullWidth margin="dense" sx={{ minWidth: 0 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={createForm.estado}
                  onChange={(e) => setCreateForm((f) => ({ ...f, estado: e.target.value }))}
                  sx={campaignSelectSx}
                  MenuProps={{ PaperProps: SELECT_MENU_PAPER_PROPS }}
                >
                  <MenuItem value="ACTIVA">Activa</MenuItem>
                  <MenuItem value="PAUSADA">Pausada</MenuItem>
                  <MenuItem value="FINALIZADA">Finalizada</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditingId(null);
              setCreateForm(emptyForm());
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#085946' }}
            disabled={!createForm.nombre?.trim() || !createForm.fechaInicio || !createForm.fechaFin || createLoading}
            onClick={handleSaveCampaign}
          >
            {createLoading ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear campaña'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar campaña</DialogTitle>
        <DialogContent>
          <Typography>Se eliminará la campaña. Las cotizaciones y ventas conservadas en el sistema quedarán sin campaña asociada.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={deleteLoading} onClick={handleDelete}>
            {deleteLoading ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampanasPage;
