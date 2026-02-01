import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { api } from '../../services/apiClient';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllLeadsCombined } from '../../services/leadService';
import { formatProcedencia, getProcedenciaOptions, getProcedenciaOptionsCRM } from '../../utils/procedenciaUtils';
import { normalizarProcedencia } from '../../utils/procedenciaNormalizer';
import { getAllPatientProducts } from '../../services/productService';

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

      const [aptRes, leadsRes, prodRes] = await Promise.allSettled([
        getAllAppointments(),
        getAllLeadsCombined(),
        getAllPatientProducts(),
      ]);

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

  // Datos de ventas (simulados por ahora)
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

    // Recorrer todos los productos de todos los pacientes
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

          const cat = product.category || 'hearing-aid';

          // Contar por marca solo audífonos
          if (cat === 'hearing-aid' && product.brand) {
            audifonosPorMarca[product.brand] = (audifonosPorMarca[product.brand] || 0) + (product.quantity || 1);
          }

          // Facturación por consultas: ventas tipo Consulta (category === 'service')
          if (cat === 'service') {
            facturacionConsultas += product.totalPrice || 0;
          }

          // Facturación por accesorios: ventas tipo Accesorio (category === 'accessory') + accesorios dentro de audífonos
          if (cat === 'accessory') {
            facturacionAccesorios += product.totalPrice || 0;
          }
          if (cat === 'hearing-aid' && product.metadata?.accessories?.length) {
            product.metadata.accessories.forEach((acc) => {
              facturacionAccesorios += acc.price || 0;
            });
          }

          // Facturación por audífonos: ventas tipo Audífonos (category === 'hearing-aid')
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

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #272F50 100%)',
          color: '#ffffff',
          py: 3,
          boxShadow: '0 4px 20px rgba(8, 89, 70, 0.2)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Vista general del sistema
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/portal-crm')}
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Volver al Portal
            </Button>
          </Box>
        </Container>
      </Box>

      {loadError && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadAllData}>
                Reintentar
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {loadError}
          </Alert>
        </Container>
      )}

      {!loading && !loadError && appointments.length === 0 && leads.length === 0 && Object.keys(products).length === 0 && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No hay citas, leads ni ventas aún. Crea registros en <strong>Citas</strong>, <strong>Leads</strong> o <strong>Cotizaciones/Ventas</strong> desde el portal CRM.
          </Alert>
        </Container>
      )}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Cargando datos…
          </Typography>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Métricas Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Leads Totales */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: '#fff3e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUp sx={{ color: '#e65100', fontSize: 28 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 1 }}>
                  {leads.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500, mb: 2 }}>
                  Leads Totales
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => navigate('/portal-crm/leads')}
                  sx={{
                    borderColor: '#085946',
                    color: '#085946',
                    '&:hover': {
                      borderColor: '#085946',
                      bgcolor: '#f0f4f3',
                    },
                  }}
                >
                  Ver Leads
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Citas Totales con Filtro */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarToday sx={{ color: '#085946', fontSize: 28 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 1 }}>
                  {citasFiltradas.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500, mb: 2 }}>
                  Citas Totales
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={citasPeriodo}
                    onChange={(e) => setCitasPeriodo(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                    }}
                  >
                    <MenuItem value="day">Hoy</MenuItem>
                    <MenuItem value="week">Esta Semana</MenuItem>
                    <MenuItem value="month">Este Mes</MenuItem>
                    <MenuItem value="year">Este Año</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Citas Hoy */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#f0f4f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Schedule sx={{ color: '#0a6b56', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                  {citasHoy}
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                  Citas Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pacientes con Filtro */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <People sx={{ color: '#272F50', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 1 }}>
                  {getPacientesStats()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500, mb: 2 }}>
                  Pacientes
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={pacientesFiltro}
                    onChange={(e) => setPacientesFiltro(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                    }}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="agendados">Agendados</MenuItem>
                    <MenuItem value="atendidos">Atendidos</MenuItem>
                    <MenuItem value="no-atendidos">No Atendidos</MenuItem>
                    <MenuItem value="cancelados">Cancelados</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Tasa de Confirmación */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <TrendingUp sx={{ color: '#085946', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                  {appointments.length > 0
                    ? Math.round(
                        (appointments.filter((apt) => apt.status === 'confirmed').length /
                          appointments.length) *
                          100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                  Tasa Confirmación
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Leads por Estado - Resumen Rápido */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <People sx={{ color: '#1976d2', fontSize: 28 }} />
                </Box>
                <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                  {leads.filter(l => l.estado === 'agendado').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500, mb: 1 }}>
                  Leads Agendados
                </Typography>
                <Typography variant="caption" sx={{ color: '#86899C' }}>
                  {leads.filter(l => l.estado === 'nuevo').length} nuevos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Accesos Rápidos Mejorados */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
              onClick={() => navigate('/portal-crm/citas')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600, mb: 1 }}>
                      Gestionar Citas
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                      Ver y administrar todas las citas: agendadas, asistidas, no asistidas y canceladas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label="Agendadas" size="small" sx={{ bgcolor: '#e8f5e9', color: '#085946' }} />
                      <Chip label="Asistidas" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="No Asistidas" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                      <Chip label="Canceladas" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828' }} />
                    </Box>
                  </Box>
                  <ArrowForward sx={{ color: '#085946', fontSize: 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                },
              }}
              onClick={() => navigate('/portal-crm/pacientes')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600, mb: 1 }}>
                      Ver Pacientes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                      Pacientes atendidos y no atendidos (estos aparecen como LEADS)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label="Atendidos" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="Leads" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                    </Box>
                  </Box>
                  <ArrowForward sx={{ color: '#085946', fontSize: 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Citas Recientes - Semana Anterior */}
        <Card
          sx={{
            mb: 4,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                Citas Recientes (Semana Anterior)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/portal-crm/citas')}
                sx={{
                  borderColor: '#085946',
                  color: '#085946',
                  '&:hover': {
                    borderColor: '#085946',
                    bgcolor: '#f0f4f3',
                  },
                }}
              >
                Ver Todas
              </Button>
            </Box>
            {citasSemanaAnterior.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Paciente</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Hora</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {citasSemanaAnterior.map((appointment) => {
                      const rescheduledTo = appointment.rescheduledToId
                        ? appointments.find((a) => a.id === appointment.rescheduledToId)
                        : null;
                      return (
                        <TableRow key={appointment.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#085946', fontSize: '0.875rem' }}>
                                {(appointment.patientName || ' ').charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {appointment.patientName || '—'}
                                </Typography>
                                {rescheduledTo && (
                                  <Typography variant="caption" sx={{ color: '#7b1fa2', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Refresh sx={{ fontSize: 12 }} />
                                    Re-agendada: {new Date(rescheduledTo.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {formatTime(rescheduledTo.time)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatTime(appointment.time)}</Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(appointment.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarToday sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ color: '#86899C' }}>
                  No hay citas en la semana anterior
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Sección de Ventas */}
        <Card
          sx={{
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                Ventas y Facturación
              </Typography>
            </Box>

            <Tabs
              value={ventasTab}
              onChange={(e, newValue) => setVentasTab(newValue)}
              sx={{
                mb: 3,
                '& .MuiTab-root': {
                  color: '#86899C',
                  '&.Mui-selected': {
                    color: '#085946',
                    fontWeight: 600,
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#085946',
                },
              }}
            >
              <Tab label="Resumen" />
              <Tab label="Audífonos" />
              <Tab label="Facturación" />
            </Tabs>

            {ventasTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Hearing sx={{ color: '#085946' }} />
                      <Typography variant="body2" sx={{ color: '#86899C' }}>
                        Audífonos Vendidos
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                      {ventasData.audifonosVendidos}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AttachMoney sx={{ color: '#085946' }} />
                      <Typography variant="body2" sx={{ color: '#86899C' }}>
                        Valor Facturado
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 700 }}>
                      {formatCurrency(ventasData.valorFacturado)}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ShoppingCart sx={{ color: '#0a6b56' }} />
                      <Typography variant="body2" sx={{ color: '#86899C' }}>
                        Audífonos Cotizados
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                      {ventasData.audifonosCotizados}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrendingUp sx={{ color: '#272F50' }} />
                      <Typography variant="body2" sx={{ color: '#86899C' }}>
                        Oportunidades
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 700 }}>
                      {formatCurrency(ventasData.valoresCotizadosPendientes)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {ventasTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600, mb: 2 }}>
                  Audífonos por Marca
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(ventasData.audifonosPorMarca).map(([marca, cantidad]) => (
                    <Grid item xs={12} sm={6} md={4} key={marca}>
                      <Card sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#86899C', mb: 0.5 }}>
                          {marca}
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#085946', fontWeight: 700 }}>
                          {cantidad}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {ventasTab === 2 && (() => {
              const totalFacturacion = ventasData.facturacionAudifonos + ventasData.facturacionConsultas + ventasData.facturacionAccesorios;
              const pct = (v) => totalFacturacion > 0 ? Math.round((v / totalFacturacion) * 1000) / 10 : 0;
              const participacion = [
                { label: 'Audífonos', value: ventasData.facturacionAudifonos, icon: Hearing, color: '#085946' },
                { label: 'Consultas', value: ventasData.facturacionConsultas, icon: CalendarToday, color: '#085946' },
                { label: 'Accesorios', value: ventasData.facturacionAccesorios, icon: ShoppingCart, color: '#0a6b56' },
              ];
              return (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'rgba(8, 89, 70, 0.2)', bgcolor: 'rgba(8, 89, 70, 0.04)' }}>
                      <Typography variant="subtitle2" sx={{ color: '#272F50', fontWeight: 600, mb: 1.5 }}>% de participación por rubro</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        {participacion.map(({ label, value, icon: Icon, color }) => (
                          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon sx={{ color, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: '#272F50' }}>{label}:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#085946' }}>{pct(value)}%</Typography>
                          </Box>
                        ))}
                        {totalFacturacion > 0 && (
                          <Typography variant="caption" sx={{ color: '#86899C', ml: 1 }}>
                            Total: {formatCurrency(totalFacturacion)}
                          </Typography>
                        )}
                      </Box>
                      {totalFacturacion > 0 && (
                        <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', mt: 1.5 }}>
                          <Box sx={{ width: `${pct(ventasData.facturacionAudifonos)}%`, bgcolor: '#085946' }} />
                          <Box sx={{ width: `${pct(ventasData.facturacionConsultas)}%`, bgcolor: '#0a6b56' }} />
                          <Box sx={{ width: `${pct(ventasData.facturacionAccesorios)}%`, bgcolor: '#2e7d6e' }} />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Hearing sx={{ color: '#085946' }} />
                        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
                          Facturación por Audífonos
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                        {formatCurrency(ventasData.facturacionAudifonos)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarToday sx={{ color: '#085946' }} />
                        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
                          Facturación por Consultas
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                        {formatCurrency(ventasData.facturacionConsultas)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ShoppingCart sx={{ color: '#0a6b56' }} />
                        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
                          Facturación por Accesorios
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                        {formatCurrency(ventasData.facturacionAccesorios)}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              );
            })()}
          </CardContent>
        </Card>

        {/* Pacientes por Procedencia con Funnel */}
        <Card
          sx={{
            mt: 4,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                Pacientes por Procedencia
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => {
                    console.log('[Dashboard] 🔄 Botón Actualizar presionado');
                    loadAllData();
                    // Forzar re-render después de un pequeño delay
                    setTimeout(() => loadAllData(), 200);
                  }}
                  sx={{
                    borderColor: '#085946',
                    color: '#085946',
                    '&:hover': {
                      borderColor: '#0a6b56',
                      bgcolor: 'rgba(8, 89, 70, 0.05)',
                    },
                  }}
                >
                  Actualizar
                </Button>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={citasPeriodo}
                    label="Período"
                    onChange={(e) => setCitasPeriodo(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#085946',
                      },
                    }}
                  >
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

                    return (
                      <Grid item xs={12} md={6} key={key}>
                        <Card
                          sx={{
                            border: '1px solid rgba(8, 89, 70, 0.1)',
                            borderRadius: 3,
                            p: 3,
                            height: '100%',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: `${color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <People sx={{ color: color, fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 700 }}>
                              {procedenciasLabels[key]}
                            </Typography>
                          </Box>

                          {/* Funnel Visual */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Agendados */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#e8f5e9',
                                borderLeft: `4px solid ${color}`,
                                position: 'relative',
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  Agendados
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: color }}>
                                  {funnel.agendados}
                                </Typography>
                              </Box>
                              {funnel.agendados > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    height: 6,
                                    bgcolor: '#ffffff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      bgcolor: color,
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* Asistidos */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#e3f2fd',
                                borderLeft: '4px solid #1976d2',
                                ml: 2,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  Asistidos
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                  {funnel.asistidos}
                                </Typography>
                              </Box>
                              {funnel.agendados > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    height: 6,
                                    bgcolor: '#ffffff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${(funnel.asistidos / funnel.agendados) * 100}%`,
                                      height: '100%',
                                      bgcolor: '#1976d2',
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* No Asistidos */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#fff3e0',
                                borderLeft: '4px solid #e65100',
                                ml: 4,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  No Asistidos
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#e65100' }}>
                                  {funnel.noAsistidos}
                                </Typography>
                              </Box>
                              {funnel.agendados > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    height: 6,
                                    bgcolor: '#ffffff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${(funnel.noAsistidos / funnel.agendados) * 100}%`,
                                      height: '100%',
                                      bgcolor: '#e65100',
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* Cancelados */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#ffebee',
                                borderLeft: '4px solid #c62828',
                                ml: 4,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  Cancelados
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#c62828' }}>
                                  {funnel.cancelados}
                                </Typography>
                              </Box>
                              {funnel.agendados > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    height: 6,
                                    bgcolor: '#ffffff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${(funnel.cancelados / funnel.agendados) * 100}%`,
                                      height: '100%',
                                      bgcolor: '#c62828',
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* Re Agendados */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: '#f3e5f5',
                                borderLeft: '4px solid #7b1fa2',
                                ml: 4,
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  Re Agendados
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                                  {funnel.reAgendados}
                                </Typography>
                              </Box>
                              {funnel.agendados > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    height: 6,
                                    bgcolor: '#ffffff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${(funnel.reAgendados / funnel.agendados) * 100}%`,
                                      height: '100%',
                                      bgcolor: '#7b1fa2',
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })()}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default DashboardPage;
