import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  CalendarToday,
  People,
  TrendingUp,
  AttachMoney,
  ArrowForward,
  CheckCircle,
  Cancel,
  Schedule,
  EventBusy,
  Hearing,
  ShoppingCart,
  Assessment,
  Refresh,
  Person,
  LocationOn,
  EventAvailable,
  Dashboard,
} from '@mui/icons-material';
import { api } from '../../services/apiClient';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllLeadsCombined } from '../../services/leadService';
import { formatProcedencia, getProcedenciaOptions, getProcedenciaOptionsCRM } from '../../utils/procedenciaUtils';
import { normalizarProcedencia } from '../../utils/procedenciaNormalizer';
import { getAllPatientProducts } from '../../services/productService';
import { getConfig } from '../../services/configService';
import { getDailyActionsMetrics } from '../../services/interactionService';
import PageHeader from '../../components/crm/ui/PageHeader';
import KpiCard from '../../components/crm/ui/KpiCard';
import InsightCard from '../../components/crm/ui/InsightCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState({}); // Todos los productos de todos los pacientes
  const [citasPeriodo, setCitasPeriodo] = useState('month');
  const [pacientesFiltro, setPacientesFiltro] = useState('todos');
  const [ventasTab, setVentasTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionMetrics, setActionMetrics] = useState({ activas: 0, vencidas: 0, cumplidas: 0, total: 0 });

  const loadAllData = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const { error: healthError } = await api.get('/api/appointments?limit=1');
      if (healthError) {
        setLoadError(
          'No se puede conectar con el servidor. Comprueba que el backend esté en marcha, la URL en VITE_API_URL y que hayas iniciado sesión.'
        );
        return;
      }

      const [aptRes, leadsRes, prodRes, metricsRes] = await Promise.allSettled([
        getAllAppointments(),
        getAllLeadsCombined(),
        getAllPatientProducts(),
        getDailyActionsMetrics(7),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setActionMetrics(metricsRes.value);
      } else {
        setActionMetrics({ activas: 0, vencidas: 0, cumplidas: 0, total: 0 });
      }

      if (aptRes.status === 'fulfilled') {
        setAppointments([...(aptRes.value || [])]);
      }
      if (leadsRes.status === 'fulfilled') {
        setLeads([...(leadsRes.value || [])]);
      }
      if (prodRes.status === 'fulfilled') {
        setProducts({ ...(prodRes.value || {}) });
      }

      const errors = [];
      if (aptRes.status === 'rejected') {
        console.error('[Dashboard] Error citas:', aptRes.reason);
        errors.push('citas');
      }
      if (leadsRes.status === 'rejected') {
        console.error('[Dashboard] Error leads:', leadsRes.reason);
        errors.push('leads');
      }
      if (prodRes.status === 'rejected') {
        console.error('[Dashboard] Error productos:', prodRes.reason);
        errors.push('productos');
      }
      if (metricsRes.status === 'rejected') {
        console.error('[Dashboard] Error métricas acciones:', metricsRes.reason);
      }
      if (errors.length) {
        setLoadError(
          `Error al cargar: ${errors.join(', ')}. Comprueba conexión, sesión y que el backend esté en marcha.`
        );
      }
    } catch (err) {
      console.error('[Dashboard] ❌ Error al cargar datos:', err);
      setLoadError(err?.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar datos iniciales
    loadAllData();

    // Listener para cambios en localStorage (actualización en tiempo real entre pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'oirconecta_appointments' || e.key === 'oirconecta_leads' || e.key === 'oirconecta_patient_records' || e.key === 'oirconecta_patient_products' || !e.key) {
        // Si cambió alguna clave relevante o si no hay key (cambio general), recargar datos
        console.log('[Dashboard] 🔄 Cambio detectado en localStorage (entre pestañas):', e.key);
        setTimeout(() => {
          loadAllData();
        }, 100); // Pequeño delay para asegurar que el cambio se haya guardado
      }
    };

    // Escuchar cambios de storage (funciona entre pestañas)
    window.addEventListener('storage', handleStorageChange);

    // Interceptar cambios de localStorage en la misma pestaña
    // Guardar referencia al método original si no existe
    if (!window._originalLocalStorageSetItem) {
      window._originalLocalStorageSetItem = localStorage.setItem.bind(localStorage);
    }
    
    const originalSetItem = window._originalLocalStorageSetItem;
    
    // Sobrescribir el método setItem para detectar cambios
    localStorage.setItem = function(key, value) {
      const result = originalSetItem.apply(this, arguments);
      if (key === 'oirconecta_appointments' || key === 'oirconecta_leads' || key === 'oirconecta_patient_records' || key === 'oirconecta_patient_products') {
        console.log('[Dashboard] 🔄 Cambio detectado en localStorage (misma pestaña):', key);
        // Disparar evento personalizado con un pequeño delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key, value } }));
        }, 50);
      }
      return result;
    };

    // Escuchar el evento personalizado
    const handleLocalStorageChange = (e) => {
      console.log('[Dashboard] 🔄 Recargando datos por cambio en localStorage:', e.detail?.key);
      setTimeout(() => {
        loadAllData();
      }, 100);
    };
    window.addEventListener('localStorageChange', handleLocalStorageChange);

    // Intervalo para refrescar datos cada 30 segundos (evitar saturar API / rate limit)
    const intervalId = setInterval(loadAllData, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleLocalStorageChange);
      clearInterval(intervalId);
      // NO restaurar localStorage.setItem aquí porque otros componentes pueden estar usándolo
    };
  }, []);

  // Función para obtener citas según el período seleccionado
  const getCitasByPeriodo = () => {
    const now = new Date();
    let startDate = new Date();

    switch (citasPeriodo) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return appointments;
    }

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date + 'T00:00:00');
      return aptDate >= startDate && aptDate <= now;
    });
  };

  const citasFiltradas = getCitasByPeriodo();
  const today = new Date().toISOString().split('T')[0];
  const citasHoy = appointments.filter((apt) => apt.date === today && apt.status === 'confirmed').length;

  const citasProximas48h = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return appointments.filter((a) => {
      if (!a?.date || a.status === 'cancelled') return false;
      const timePart = String(a.time || '12:00').slice(0, 5);
      const dt = new Date(`${a.date}T${timePart}:00`);
      if (Number.isNaN(dt.getTime())) return false;
      return dt >= now && dt <= limit && ['confirmed', 'patient'].includes(a.status);
    }).length;
  }, [appointments]);

  // Estadísticas de pacientes según filtro
  const getPacientesStats = () => {
    const pacientesUnicos = new Set();
    const pacientesAtendidos = new Set();
    const pacientesNoAtendidos = new Set();
    const pacientesCancelados = new Set();
    const pacientesMarcados = new Set(); // Pacientes marcados explícitamente como 'patient'

    appointments.forEach((apt) => {
      pacientesUnicos.add(apt.patientEmail);
      
      if (apt.status === 'patient') {
        pacientesMarcados.add(apt.patientEmail);
        pacientesAtendidos.add(apt.patientEmail); // También cuenta como atendido
      } else if (apt.status === 'completed') {
        pacientesAtendidos.add(apt.patientEmail);
      } else if (apt.status === 'cancelled') {
        pacientesCancelados.add(apt.patientEmail);
      } else if (apt.status === 'no-show') {
        pacientesNoAtendidos.add(apt.patientEmail);
      }
    });

    // Pacientes agendados = todos los que tienen al menos una cita
    const pacientesAgendados = pacientesUnicos.size;

    // Pacientes atendidos = los que tienen al menos una cita completada o marcada como paciente
    const atendidos = pacientesAtendidos.size;

    // Pacientes no atendidos = los que tienen citas pero ninguna completada
    const noAtendidos = pacientesNoAtendidos.size;

    // Pacientes cancelados
    const cancelados = pacientesCancelados.size;

    switch (pacientesFiltro) {
      case 'agendados':
        return pacientesAgendados;
      case 'atendidos':
        return atendidos;
      case 'no-atendidos':
        return noAtendidos;
      case 'cancelados':
        return cancelados;
      default:
        return pacientesUnicos.size;
    }
  };

  // Citas de la semana anterior
  const getCitasSemanaAnterior = () => {
    const now = new Date();
    const semanaAnteriorFin = new Date(now);
    semanaAnteriorFin.setDate(now.getDate() - 7);
    const semanaAnteriorInicio = new Date(semanaAnteriorFin);
    semanaAnteriorInicio.setDate(semanaAnteriorFin.getDate() - 7);

    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        return aptDate >= semanaAnteriorInicio && aptDate < semanaAnteriorFin;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
      })
      .slice(0, 10);
  };

  const citasSemanaAnterior = getCitasSemanaAnterior();

  // Calcular datos de ventas desde productos reales
  const calcularVentasData = () => {
    let allQuotes = [];
    let allSales = [];
    let audifonosPorMarca = {};
    let valorFacturado = 0;
    let valoresCotizadosPendientes = 0;
    let facturacionConsultas = 0;
    let facturacionAccesorios = 0;
    let facturacionAudifonos = 0;
    const ventasPorProfesional = {};
    const ventasPorSede = {};

    Object.values(products).forEach(patientProducts => {
      patientProducts.forEach(product => {
        if (product.type === 'quote') {
          allQuotes.push(product);
          if (product.status === 'pending' || product.status === 'approved') {
            valoresCotizadosPendientes += product.totalPrice || 0;
          }
        } else if (product.type === 'sale') {
          allSales.push(product);
          valorFacturado += product.totalPrice || 0;

          const profId = product.professionalId || product.metadata?.professionalId || '_sin_asignar';
          const sedeId = product.sedeId || product.metadata?.sedeId || '_sin_asignar';
          ventasPorProfesional[profId] = (ventasPorProfesional[profId] || 0) + (product.totalPrice || 0);
          ventasPorSede[sedeId] = (ventasPorSede[sedeId] || 0) + (product.totalPrice || 0);

          const cat = product.category || 'hearing-aid';

          if (cat === 'hearing-aid' && product.brand) {
            audifonosPorMarca[product.brand] = (audifonosPorMarca[product.brand] || 0) + (product.quantity || 1);
          }
          if (cat === 'service') {
            facturacionConsultas += product.totalPrice || 0;
          }
          if (cat === 'accessory') {
            facturacionAccesorios += product.totalPrice || 0;
          }
          if (cat === 'hearing-aid' && product.metadata?.accessories?.length) {
            product.metadata.accessories.forEach((acc) => {
              facturacionAccesorios += acc.price || 0;
            });
          }
          if (cat === 'hearing-aid') {
            facturacionAudifonos += product.totalPrice || 0;
          }
        }
      });
    });

    return {
      audifonosVendidos: allSales.filter((s) => (s.category || 'hearing-aid') === 'hearing-aid').reduce((sum, sale) => sum + (sale.quantity || 1), 0),
      valorFacturado,
      audifonosCotizados: allQuotes.reduce((sum, q) => sum + (q.quantity || 1), 0),
      valoresCotizadosPendientes,
      audifonosPorMarca,
      facturacionConsultas,
      facturacionAccesorios,
      facturacionAudifonos,
      ventasPorProfesional,
      ventasPorSede,
    };
  };

  const ventasData = calcularVentasData();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Confirmada"
            size="small"
            sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }}
          />
        );
      case 'completed':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Asistida"
            size="small"
            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
          />
        );
      case 'no-show':
        return (
          <Chip
            icon={<EventBusy />}
            label="No Asistida"
            size="small"
            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
          />
        );
      case 'cancelled':
        return (
          <Chip
            icon={<Cancel />}
            label="Cancelada"
            size="small"
            sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<Schedule />}
            label="Pendiente"
            size="small"
            sx={{ bgcolor: '#f5f5f5', color: '#757575', fontWeight: 600 }}
          />
        );
    }
  };

  const KPI_CARDS = [
    {
      label: 'Leads Totales',
      value: leads.length,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      glow: 'rgba(249,115,22,0.22)',
      action: { label: 'Ver Leads', path: '/portal-crm/leads' },
    },
    {
      label: 'Citas Totales',
      value: citasFiltradas.length,
      icon: CalendarToday,
      gradient: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
      glow: 'rgba(8,89,70,0.22)',
      filter: (
        <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
          <Select value={citasPeriodo} onChange={(e) => setCitasPeriodo(e.target.value)}
            sx={{ borderRadius: '10px', fontSize: '0.8125rem',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(8,89,70,0.25)' } }}>
            <MenuItem value="day">Hoy</MenuItem>
            <MenuItem value="week">Esta Semana</MenuItem>
            <MenuItem value="month">Este Mes</MenuItem>
            <MenuItem value="year">Este Año</MenuItem>
          </Select>
        </FormControl>
      ),
    },
    {
      label: 'Citas Hoy',
      value: citasHoy,
      icon: Schedule,
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      glow: 'rgba(2,132,199,0.22)',
    },
    {
      label: 'Pacientes',
      value: getPacientesStats(),
      icon: People,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      glow: 'rgba(124,58,237,0.22)',
      filter: (
        <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
          <Select value={pacientesFiltro} onChange={(e) => setPacientesFiltro(e.target.value)}
            sx={{ borderRadius: '10px', fontSize: '0.8125rem',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,58,237,0.25)' } }}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="agendados">Agendados</MenuItem>
            <MenuItem value="atendidos">Atendidos</MenuItem>
            <MenuItem value="no-atendidos">No Atendidos</MenuItem>
            <MenuItem value="cancelados">Cancelados</MenuItem>
          </Select>
        </FormControl>
      ),
    },
    {
      label: 'Tasa Confirmación',
      value: `${appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100) : 0}%`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      glow: 'rgba(5,150,105,0.22)',
    },
    {
      label: 'Leads Agendados',
      value: leads.filter(l => l.estado === 'agendado').length,
      icon: People,
      gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
      glow: 'rgba(219,39,119,0.22)',
      sub: `${leads.filter(l => l.estado === 'nuevo').length} nuevos`,
    },
  ];

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
      <PageHeader
        icon={Dashboard}
        title="Dashboard"
        subtitle={`Vista general del sistema · ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      {loadError && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadAllData}>Reintentar</Button>} sx={{ mb: 2, borderRadius: '14px' }}>
            {loadError}
          </Alert>
        </Container>
      )}

      {!loading && !loadError && appointments.length === 0 && leads.length === 0 && Object.keys(products).length === 0 && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
            No hay citas, leads ni ventas aún. Crea registros en <strong>Citas</strong>, <strong>Leads</strong> o <strong>Cotizaciones/Ventas</strong> desde el portal CRM.
          </Alert>
        </Container>
      )}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 4 }}>
          <CircularProgress size={28} sx={{ color: '#085946' }} />
          <Typography sx={{ color: '#4a5568', fontWeight: 500 }}>Cargando datos…</Typography>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Ops strip */}
        <Box
          sx={{
            p: 3, mb: 4, borderRadius: '22px',
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(8,89,70,0.10)',
            boxShadow: '0 2px 20px rgba(8,89,70,0.07)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d7a5c, #085946)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Assessment sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', letterSpacing: '-0.02em' }}>
              Operación centrada en el paciente
            </Typography>
          </Box>
          <Typography sx={{ color: '#4a5568', fontSize: '0.9rem', mb: 2.5, lineHeight: 1.6 }}>
            Contacto oportuno + seguimiento de consumibles y garantías reduce cancelaciones y mejora la continuidad asistencial.
          </Typography>
          <Grid container spacing={2}>
            {[
              { icon: EventAvailable, label: 'Citas próximas (48 h)', value: citasProximas48h, sub: 'Confirmadas o en sala', color: '#0284c7', gradient: 'linear-gradient(135deg,#0284c7,#0369a1)' },
              { icon: Schedule, label: 'Citas confirmadas hoy', value: citasHoy, sub: 'Revisar agenda y perfiles', color: '#085946', gradient: 'linear-gradient(135deg,#0d7a5c,#085946)' },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Box sx={{ p: 2, borderRadius: '14px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <item.icon sx={{ color: item.color, fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#272F50' }}>{item.label}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: item.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{item.value}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#86899C', mt: 0.5 }}>{item.sub}</Typography>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, borderRadius: '14px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Assessment sx={{ color: '#f97316', fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#272F50' }}>Acciones CRM (7 días)</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568', mb: 1.5 }}>
                  Activas: <strong>{actionMetrics.activas}</strong> · Vencidas: <strong style={{ color: '#e65100' }}>{actionMetrics.vencidas}</strong> · Cumplidas: <strong style={{ color: '#085946' }}>{actionMetrics.cumplidas}</strong>
                </Typography>
                <Button size="small" variant="contained" onClick={() => navigate('/portal-crm/acciones-dia')}
                  sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', py: 0.75,
                    background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 12px rgba(249,115,22,0.30)',
                    '&:hover': { boxShadow: '0 6px 18px rgba(249,115,22,0.40)' } }}>
                  Ir a Acciones del día
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, borderRadius: '14px', background: 'rgba(39,47,80,0.04)', border: '1px solid rgba(39,47,80,0.10)', height: '100%' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#272F50', mb: 1 }}>Buenas prácticas</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568', lineHeight: 1.6, mb: 1.5 }}>
                  1) Confirmar cita. 2) Revisar perfil (historia, productos). 3) Resolver alertas vencidas primero.
                </Typography>
                <Button size="small" variant="outlined" onClick={() => navigate('/portal-crm/pacientes')}
                  sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', borderColor: '#272F50', color: '#272F50',
                    '&:hover': { borderColor: '#085946', color: '#085946' } }}>
                  Pacientes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* KPI Cards — limpios y comparables */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Leads totales',     value: leads.length,                                                        tone: 'warning', onClick: () => navigate('/portal-crm/leads') },
            { label: 'Citas totales',     value: citasFiltradas.length,                                               tone: 'success' },
            { label: 'Citas hoy',         value: citasHoy,                                                            tone: 'info' },
            { label: 'Pacientes',         value: getPacientesStats(),                                                 tone: 'violet' },
            { label: 'Tasa confirmación', value: `${appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100) : 0}%`, tone: 'success' },
            { label: 'Leads agendados',   value: leads.filter(l => l.estado === 'agendado').length,                   tone: 'neutral', hint: `${leads.filter(l => l.estado === 'nuevo').length} nuevos sin contactar` },
          ].map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </Box>

        {/* Insights interpretados: el sistema ya no solo muestra números, los explica */}
        {(() => {
          const leadsNuevosSinContacto = leads.filter((l) => (l.estado || '').toLowerCase() === 'nuevo').length;
          const totalConfirmed = appointments.filter((a) => a.status === 'confirmed').length;
          const totalAppts = appointments.length || 0;
          const tasaConfirmacion = totalAppts > 0 ? Math.round((totalConfirmed / totalAppts) * 100) : 0;
          const noShowCount = appointments.filter((a) => a.status === 'no-show').length;
          const tasaNoShow = totalAppts > 0 ? Math.round((noShowCount / totalAppts) * 100) : 0;
          const accionesVencidas = actionMetrics?.vencidas || 0;

          const insights = [];
          if (leadsNuevosSinContacto > 0) {
            insights.push({
              tone: leadsNuevosSinContacto >= 5 ? 'warning' : 'attention',
              icon: People,
              title: 'Leads esperando primer contacto',
              metric: leadsNuevosSinContacto,
              body: leadsNuevosSinContacto >= 5
                ? 'Tienes varios prospectos sin contactar. Cada hora reduce la probabilidad de conversión a la mitad.'
                : 'Un contacto rápido al primer día aumenta la conversión por 3.',
              actionLabel: 'Ir a Leads',
              onAction: () => navigate('/portal-crm/leads'),
            });
          }
          if (accionesVencidas > 0) {
            insights.push({
              tone: 'warning',
              icon: EventBusy,
              title: 'Acciones vencidas requieren atención',
              metric: accionesVencidas,
              body: 'Garantías o consumibles fuera de su ventana ideal. Resolverlos primero evita afectar adherencia y renovaciones.',
              actionLabel: 'Acciones del día',
              onAction: () => navigate('/portal-crm/acciones-dia'),
            });
          }
          if (totalAppts >= 10 && tasaNoShow >= 15) {
            insights.push({
              tone: 'warning',
              icon: Cancel,
              title: 'Tasa de no-show alta',
              metric: `${tasaNoShow}%`,
              body: 'Implementa confirmación 24 h y 2 h antes por WhatsApp para reducir hasta 40% el ausentismo.',
            });
          } else if (totalAppts >= 5 && tasaConfirmacion >= 80) {
            insights.push({
              tone: 'positive',
              icon: CheckCircle,
              title: 'Excelente confirmación',
              metric: `${tasaConfirmacion}%`,
              body: 'Los pacientes están llegando. Mantén la disciplina de confirmación previa.',
            });
          }
          if (citasHoy > 0) {
            insights.push({
              tone: 'attention',
              icon: Schedule,
              title: 'Atención de hoy',
              metric: citasHoy,
              body: 'Revisa los perfiles de cada paciente 30 min antes; los detalles (último audífono, garantía, motivos) marcan la diferencia.',
              actionLabel: 'Ver agenda',
              onAction: () => navigate('/portal-crm/citas'),
            });
          }
          if (insights.length === 0) {
            insights.push({
              tone: 'positive', icon: CheckCircle,
              title: 'Todo bajo control',
              body: 'No hay alertas críticas. Buen momento para revisar el catálogo y planificar campañas.',
            });
          }
          return (
            <Box sx={{
              display: 'grid', mb: 4,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(auto-fit, minmax(280px, 1fr))' },
              gap: 1.5,
            }}>
              {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
            </Box>
          );
        })()}

        {/* Quick Access */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            {
              title: 'Gestionar Citas', desc: 'Ver y administrar todas las citas: agendadas, asistidas, no asistidas y canceladas',
              path: '/portal-crm/citas', gradient: 'linear-gradient(135deg,#0d7a5c,#085946)',
              chips: [
                { label: 'Agendadas', color: '#085946', bg: 'rgba(8,89,70,0.10)' },
                { label: 'Asistidas', color: '#0284c7', bg: 'rgba(2,132,199,0.10)' },
                { label: 'No Asistidas', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
                { label: 'Canceladas', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
              ],
            },
            {
              title: 'Ver Pacientes', desc: 'Pacientes atendidos y no atendidos — los no atendidos aparecen como LEADS en el sistema',
              path: '/portal-crm/pacientes', gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              chips: [
                { label: 'Atendidos', color: '#0284c7', bg: 'rgba(2,132,199,0.10)' },
                { label: 'Leads', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
              ],
            },
          ].map((item) => (
            <Grid item xs={12} md={6} key={item.title}>
              <Box
                onClick={() => navigate(item.path)}
                sx={{
                  p: 3, borderRadius: '22px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                  transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 16px 40px rgba(8,89,70,0.14)' },
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 0.75 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.6, mb: 2 }}>
                    {item.desc}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {item.chips.map((c) => (
                      <Chip key={c.label} label={c.label} size="small"
                        sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px' }} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: '14px', flexShrink: 0,
                  background: item.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(8,89,70,0.20)' }}>
                  <ArrowForward sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Citas Recientes */}
        <Box
          sx={{
            mb: 4, borderRadius: '22px',
            background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarToday sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.02em' }}>
                  Citas Recientes — Semana Anterior
                </Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => navigate('/portal-crm/citas')}
                sx={{ borderRadius: '10px', fontWeight: 700, borderColor: '#085946', color: '#085946', fontSize: '0.8125rem',
                  '&:hover': { borderColor: '#085946', bgcolor: 'rgba(8,89,70,0.06)' } }}>
                Ver Todas
              </Button>
            </Box>
            {citasSemanaAnterior.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(8,89,70,0.04)' }}>
                      {['Paciente','Fecha','Hora','Estado'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#272F50', fontSize: '0.8125rem',
                          letterSpacing: '0.04em', textTransform: 'uppercase', py: 1.5, border: 'none' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {citasSemanaAnterior.map((appointment) => {
                      const rescheduledTo = appointment.rescheduledToId
                        ? appointments.find((a) => a.id === appointment.rescheduledToId)
                        : null;
                      return (
                        <TableRow key={appointment.id}
                          sx={{ '&:hover': { bgcolor: 'rgba(8,89,70,0.03)' }, '& td': { border: 'none', py: 1.5 } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 36, height: 36, bgcolor: '#085946', fontSize: '0.9rem', fontWeight: 700 }}>
                                {(appointment.patientName || ' ').charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f1923' }}>
                                  {appointment.patientName || '—'}
                                </Typography>
                                {rescheduledTo && (
                                  <Typography sx={{ fontSize: '0.75rem', color: '#7b1fa2', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Refresh sx={{ fontSize: 11 }} />
                                    Re-agendada: {new Date(rescheduledTo.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {formatTime(rescheduledTo.time)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.875rem', color: '#4a5568' }}>
                              {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', fontWeight: 600 }}>{formatTime(appointment.time)}</Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(appointment.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CalendarToday sx={{ fontSize: 56, color: 'rgba(8,89,70,0.15)', mb: 2 }} />
                <Typography sx={{ color: '#86899C', fontWeight: 500 }}>No hay citas en la semana anterior</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Ventas */}
        <Box
          sx={{
            borderRadius: '22px',
            background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg,#059669,#047857)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AttachMoney sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.02em' }}>
                Ventas y Facturación
              </Typography>
            </Box>

            <Tabs
              value={ventasTab}
              onChange={(e, newValue) => setVentasTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                '& .MuiTab-root': { color: '#86899C', fontWeight: 600, fontSize: '0.875rem',
                  '&.Mui-selected': { color: '#085946', fontWeight: 700 } },
                '& .MuiTabs-indicator': { bgcolor: '#085946', height: 3, borderRadius: '2px' },
              }}
            >
              <Tab label="Resumen" />
              <Tab label="Audífonos" />
              <Tab label="Facturación" />
              <Tab label="Por profesional" />
              <Tab label="Por sede" />
            </Tabs>

            {ventasTab === 0 && (
              <Grid container spacing={2}>
                {[
                  { icon: Hearing, label: 'Audífonos Vendidos', value: ventasData.audifonosVendidos, gradient: 'linear-gradient(135deg,#0d7a5c,#085946)', glow: 'rgba(8,89,70,0.20)' },
                  { icon: AttachMoney, label: 'Valor Facturado', value: formatCurrency(ventasData.valorFacturado), gradient: 'linear-gradient(135deg,#059669,#047857)', glow: 'rgba(5,150,105,0.20)' },
                  { icon: ShoppingCart, label: 'Audífonos Cotizados', value: ventasData.audifonosCotizados, gradient: 'linear-gradient(135deg,#0284c7,#0369a1)', glow: 'rgba(2,132,199,0.20)' },
                  { icon: TrendingUp, label: 'Oportunidades', value: formatCurrency(ventasData.valoresCotizadosPendientes), gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)', glow: 'rgba(124,58,237,0.20)' },
                ].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item.label}>
                    <Box sx={{ p: 2.5, borderRadius: '6px', background: 'rgba(8,89,70,0.04)',
                      border: '1px solid rgba(8,89,70,0.08)',
                      transition: 'all 0.22s ease',
                      '&:hover': { boxShadow: `0 8px 24px ${item.glow}`, transform: 'translateY(-3px)' } }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: '12px',
                        background: item.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 1.5, boxShadow: `0 4px 14px ${item.glow}` }}>
                        <item.icon sx={{ color: '#fff', fontSize: 20 }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#86899C', fontWeight: 600,
                        letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.5 }}>{item.label}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.75rem', color: '#0f1923', letterSpacing: '-0.03em' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {ventasTab === 1 && (
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#272F50', mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Audífonos por Marca
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(ventasData.audifonosPorMarca).map(([marca, cantidad]) => (
                    <Grid item xs={12} sm={6} md={4} key={marca}>
                      <Box sx={{ p: 2.5, borderRadius: '14px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)' }}>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#86899C', mb: 0.5 }}>{marca}</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: '#085946', letterSpacing: '-0.03em' }}>{cantidad}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {ventasTab === 2 && (() => {
              const totalFacturacion = ventasData.facturacionAudifonos + ventasData.facturacionConsultas + ventasData.facturacionAccesorios;
              const pct = (v) => totalFacturacion > 0 ? Math.round((v / totalFacturacion) * 1000) / 10 : 0;
              const rubros = [
                { label: 'Audífonos', value: ventasData.facturacionAudifonos, icon: Hearing, gradient: 'linear-gradient(135deg,#0d7a5c,#085946)', glow: 'rgba(8,89,70,0.20)', bar: '#085946' },
                { label: 'Consultas', value: ventasData.facturacionConsultas, icon: CalendarToday, gradient: 'linear-gradient(135deg,#0284c7,#0369a1)', glow: 'rgba(2,132,199,0.20)', bar: '#0284c7' },
                { label: 'Accesorios', value: ventasData.facturacionAccesorios, icon: ShoppingCart, gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)', glow: 'rgba(124,58,237,0.20)', bar: '#7c3aed' },
              ];
              return (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2.5, borderRadius: '14px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: '#272F50', mb: 1.5 }}>Participación por rubro</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1.5 }}>
                        {rubros.map(({ label, value, bar }) => (
                          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: bar }} />
                            <Typography sx={{ fontSize: '0.8125rem', color: '#272F50' }}>{label}:</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: bar }}>{pct(value)}%</Typography>
                          </Box>
                        ))}
                        {totalFacturacion > 0 && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#86899C' }}>Total: {formatCurrency(totalFacturacion)}</Typography>
                        )}
                      </Box>
                      {totalFacturacion > 0 && (
                        <Box sx={{ display: 'flex', height: 10, borderRadius: '5px', overflow: 'hidden' }}>
                          {rubros.map(({ label, value, bar }) => (
                            <Box key={label} sx={{ width: `${pct(value)}%`, bgcolor: bar, transition: 'width 0.5s ease' }} />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  {rubros.map((item) => (
                    <Grid item xs={12} md={4} key={item.label}>
                      <Box sx={{ p: 2.5, borderRadius: '6px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)',
                        transition: 'all 0.22s ease', '&:hover': { boxShadow: `0 8px 24px ${item.glow}`, transform: 'translateY(-3px)' } }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: item.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, boxShadow: `0 4px 14px ${item.glow}` }}>
                          <item.icon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: '#86899C', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.5 }}>
                          Facturación {item.label}
                        </Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.625rem', color: '#0f1923', letterSpacing: '-0.03em' }}>
                          {formatCurrency(item.value)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}

            {ventasTab === 3 && (() => {
              const profesionales = (getConfig().profesionales || []).filter((p) => p.activo);
              const entries = Object.entries(ventasData.ventasPorProfesional || {});
              return (
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#272F50', mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Ventas por Profesional
                  </Typography>
                  <Grid container spacing={2}>
                    {entries.map(([profId, valor]) => {
                      const prof = profId === '_sin_asignar' ? null : profesionales.find((p) => p.id === profId);
                      const nombre = profId === '_sin_asignar' ? 'Sin asignar' : (prof?.nombre || profId);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={profId}>
                          <Box sx={{ p: 2.5, borderRadius: '14px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Person sx={{ color: '#085946', fontSize: 18 }} />
                              <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568', fontWeight: 600 }}>{nombre}</Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#085946', letterSpacing: '-0.03em' }}>
                              {formatCurrency(valor)}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {entries.length === 0 && (
                    <Typography sx={{ color: '#86899C', fontSize: '0.875rem' }}>
                      No hay ventas con profesional asignado.
                    </Typography>
                  )}
                </Box>
              );
            })()}

            {ventasTab === 4 && (() => {
              const sedes = getConfig().sedes || [];
              const entries = Object.entries(ventasData.ventasPorSede || {});
              return (
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#272F50', mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Ventas por Sede
                  </Typography>
                  <Grid container spacing={2}>
                    {entries.map(([sedeId, valor]) => {
                      const sede = sedeId === '_sin_asignar' ? null : sedes.find((s) => s.id === sedeId);
                      const nombre = sedeId === '_sin_asignar' ? 'Sin asignar' : (sede?.nombre || sedeId);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={sedeId}>
                          <Box sx={{ p: 2.5, borderRadius: '14px', background: 'rgba(8,89,70,0.04)', border: '1px solid rgba(8,89,70,0.08)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <LocationOn sx={{ color: '#085946', fontSize: 18 }} />
                              <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568', fontWeight: 600 }}>{nombre}</Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#085946', letterSpacing: '-0.03em' }}>
                              {formatCurrency(valor)}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {entries.length === 0 && (
                    <Typography sx={{ color: '#86899C', fontSize: '0.875rem' }}>
                      No hay ventas con sede asignada.
                    </Typography>
                  )}
                </Box>
              );
            })()}
          </Box>
        </Box>

        {/* Pacientes por Procedencia */}
        <Box
          sx={{
            mt: 4, borderRadius: '22px',
            background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg,#272F50,#1a1f38)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <People sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f1923', letterSpacing: '-0.02em' }}>
                  Pacientes por Procedencia
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Button variant="outlined" size="small" startIcon={<Refresh />}
                  onClick={() => { loadAllData(); setTimeout(() => loadAllData(), 200); }}
                  sx={{ borderRadius: '10px', fontWeight: 700, borderColor: '#085946', color: '#085946', fontSize: '0.8125rem',
                    '&:hover': { borderColor: '#085946', bgcolor: 'rgba(8,89,70,0.06)' } }}>
                  Actualizar
                </Button>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Período</InputLabel>
                  <Select value={citasPeriodo} label="Período" onChange={(e) => setCitasPeriodo(e.target.value)}
                    sx={{ borderRadius: '10px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(8,89,70,0.25)' } }}>
                    <MenuItem value="day">Hoy</MenuItem>
                    <MenuItem value="week">Esta Semana</MenuItem>
                    <MenuItem value="month">Este Mes</MenuItem>
                    <MenuItem value="year">Este Año</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {(() => {
              // Filtrar citas por período
              const now = new Date();
              let startDate = new Date();

              switch (citasPeriodo) {
                case 'day':
                  startDate.setDate(now.getDate() - 1);
                  break;
                case 'week':
                  startDate.setDate(now.getDate() - 7);
                  break;
                case 'month':
                  startDate.setMonth(now.getMonth() - 1);
                  break;
                case 'year':
                  startDate.setFullYear(now.getFullYear() - 1);
                  break;
                default:
                  startDate = new Date(0); // Todas las citas
              }

              const citasFiltradasPorPeriodo = appointments.filter((apt) => {
                const aptDate = new Date(apt.date + 'T00:00:00');
                // Normalizar fechas para comparación (solo fecha, sin hora)
                const aptDateNormalized = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
                const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const nowNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return aptDateNormalized >= startDateNormalized && aptDateNormalized <= nowNormalized;
              });
              
              // Debug: Log para verificar qué citas se están filtrando
              console.log('[Dashboard] Total citas:', appointments.length);
              console.log('[Dashboard] Citas filtradas:', citasFiltradasPorPeriodo.length);
              console.log('[Dashboard] Período:', citasPeriodo);

              // Calcular funnel por procedencia - usar opciones del CRM (incluye Agendamiento Manual)
              const procedenciasOptions = getProcedenciaOptionsCRM();
              const procedenciasLabels = {};
              const procedenciasColors = {
                'leads-marketing-digital': '#085946',
                'leads-marketing-offline': '#0a6b56',
                'visita-medica': '#272F50',
                'renovacion': '#085946',
                'recomendacion': '#0a6b56',
                'sitio-web': '#1976d2',
                'agendamiento-manual': '#7b1fa2', // Color morado para diferenciarlo
              };
              
              // Crear labels desde las opciones del CRM
              procedenciasOptions.forEach(opt => {
                procedenciasLabels[opt.value] = opt.label;
                // Asegurar que cada procedencia tenga un color definido
                if (!procedenciasColors[opt.value]) {
                  procedenciasColors[opt.value] = '#86899C'; // Color por defecto
                }
              });
              
              // Asegurar que agendamiento-manual esté siempre incluido (fallback)
              if (!procedenciasLabels['agendamiento-manual']) {
                procedenciasLabels['agendamiento-manual'] = 'Agendamiento Manual';
              }
              if (!procedenciasColors['agendamiento-manual']) {
                procedenciasColors['agendamiento-manual'] = '#7b1fa2';
              }
              
              // Debug: verificar que agendamiento-manual esté incluido
              console.log('[Dashboard Pacientes por Procedencia] Procedencias disponibles:', Object.keys(procedenciasLabels));
              console.log('[Dashboard Pacientes por Procedencia] Total procedencias:', Object.keys(procedenciasLabels).length);
              console.log('[Dashboard Pacientes por Procedencia] Incluye agendamiento-manual:', 'agendamiento-manual' in procedenciasLabels);
              
              // Obtener procedencias únicas de las citas filtradas
              const procedenciasConDatos = citasFiltradasPorPeriodo.map(apt => {
                const proc = (apt.procedencia || 'visita-medica').toLowerCase().trim();
                // Normalizar recomendación
                if (proc === 'recomendación') return 'recomendacion';
                return proc;
              }).filter((v, i, a) => a.indexOf(v) === i);
              
              console.log('[Dashboard Pacientes por Procedencia] Procedencias con datos en citas:', procedenciasConDatos);
              console.log('[Dashboard Pacientes por Procedencia] Citas filtradas por período:', citasFiltradasPorPeriodo.length);

              // Usar la función de normalización centralizada importada

              const calcularFunnel = (procedencia) => {
                const procedenciaNormalizada = normalizarProcedencia(procedencia);
                console.log(`[Dashboard] Calculando funnel para procedencia: "${procedencia}" (normalizada: "${procedenciaNormalizada}")`);
                
                const citasProcedencia = citasFiltradasPorPeriodo.filter(
                  (apt) => {
                    const aptProcedenciaNormalizada = normalizarProcedencia(apt.procedencia);
                    const matches = aptProcedenciaNormalizada === procedenciaNormalizada;
                    
                    // Debug solo para matches o primeras citas
                    if (matches) {
                      console.log(`[Dashboard] ✅ Match encontrado: "${apt.patientName}" - Procedencia original: "${apt.procedencia}" → Normalizada: "${aptProcedenciaNormalizada}"`);
                    }
                    
                    return matches;
                  }
                );
                
                console.log(`[Dashboard] Citas encontradas para "${procedenciaNormalizada}": ${citasProcedencia.length}`);
                
                console.log(`[Dashboard] Citas encontradas para "${procedencia}": ${citasProcedencia.length}`, 
                  citasProcedencia.map(apt => ({ paciente: apt.patientName, procedencia: apt.procedencia }))
                );

                // Agendados: todas las citas con esta procedencia (cualquier estado excepto canceladas)
                const agendados = citasProcedencia.length;

                // Asistidos: citas completadas O marcadas como paciente
                const asistidos = citasProcedencia.filter((apt) => 
                  apt.status === 'completed' || apt.status === 'patient'
                ).length;

                // No asistidos: citas con status no-show
                const noAsistidos = citasProcedencia.filter((apt) => apt.status === 'no-show').length;

                // Cancelados: citas canceladas
                const cancelados = citasProcedencia.filter((apt) => apt.status === 'cancelled').length;

                // Re agendados: pacientes que tienen más de una cita (contar emails únicos con múltiples citas)
                const emailsConMultiplesCitas = new Map();
                citasProcedencia.forEach((apt) => {
                  if (!emailsConMultiplesCitas.has(apt.patientEmail)) {
                    emailsConMultiplesCitas.set(apt.patientEmail, []);
                  }
                  emailsConMultiplesCitas.get(apt.patientEmail).push(apt);
                });
                const reAgendados = Array.from(emailsConMultiplesCitas.values()).filter(
                  (citas) => citas.length > 1
                ).length;

                return {
                  agendados,
                  asistidos,
                  noAsistidos,
                  cancelados,
                  reAgendados,
                };
              };

              return (
                <Grid container spacing={3}>
                  {Object.keys(procedenciasLabels).map((key) => {
                    const funnel = calcularFunnel(key);
                    const color = procedenciasColors[key];
                    
                    // Debug: mostrar información de cada funnel
                    console.log(`[Dashboard] Funnel para "${procedenciasLabels[key]}" (${key}):`, {
                      agendados: funnel.agendados,
                      asistidos: funnel.asistidos,
                      noAsistidos: funnel.noAsistidos,
                      cancelados: funnel.cancelados,
                      reAgendados: funnel.reAgendados
                    });
                    
                    // Mostrar TODAS las procedencias, incluso si están vacías
                    // Esto permite ver la estructura completa del funnel

                    const funnelRows = [
                      { label: 'Agendados', value: funnel.agendados, pct: 100, barColor: color, bg: `${color}12` },
                      { label: 'Asistidos', value: funnel.asistidos, pct: funnel.agendados > 0 ? (funnel.asistidos / funnel.agendados) * 100 : 0, barColor: '#0284c7', bg: 'rgba(2,132,199,0.08)' },
                      { label: 'No Asistidos', value: funnel.noAsistidos, pct: funnel.agendados > 0 ? (funnel.noAsistidos / funnel.agendados) * 100 : 0, barColor: '#f97316', bg: 'rgba(249,115,22,0.08)' },
                      { label: 'Cancelados', value: funnel.cancelados, pct: funnel.agendados > 0 ? (funnel.cancelados / funnel.agendados) * 100 : 0, barColor: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
                      { label: 'Re-agendados', value: funnel.reAgendados, pct: funnel.agendados > 0 ? (funnel.reAgendados / funnel.agendados) * 100 : 0, barColor: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
                    ];
                    return (
                      <Grid item xs={12} md={6} key={key}>
                        <Box
                          sx={{
                            p: 2.5, borderRadius: '8px', height: '100%',
                            background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.60)',
                            boxShadow: '0 2px 12px rgba(8,89,70,0.06)',
                            transition: 'all 0.28s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${color}22` },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '10px',
                              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <People sx={{ color: '#fff', fontSize: 18 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', letterSpacing: '-0.02em' }}>
                              {procedenciasLabels[key]}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {funnelRows.map((row) => (
                              <Box key={row.label} sx={{ p: 1.5, borderRadius: '10px', bgcolor: row.bg, borderLeft: `3px solid ${row.barColor}` }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#272F50' }}>{row.label}</Typography>
                                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: row.barColor, letterSpacing: '-0.02em' }}>{row.value}</Typography>
                                </Box>
                                <Box sx={{ height: 5, bgcolor: 'rgba(255,255,255,0.60)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <Box sx={{ width: `${row.pct}%`, height: '100%', bgcolor: row.barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })()}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;
