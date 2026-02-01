import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  TextareaAutosize,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Paper,
} from '@mui/material';
import {
  PersonAdd,
  Person,
  Search,
  Phone,
  Email,
  ArrowBack,
  CheckCircle,
  Schedule,
  Close,
  MoreVert,
  WhatsApp,
  Visibility,
  CalendarToday,
  Edit,
  Delete,
  Refresh,
} from '@mui/icons-material';
import SmsIcon from '@mui/icons-material/Sms';
import {
  getAllLeadsCombined,
  createLead,
  updateLead,
  deleteLead,
  getAllLeads,
  findLeadByEmailOrPhone,
} from '../../services/leadService';
import { createAppointment, getAllAppointments, getAppointmentById, updateAppointmentStatus, getAvailableTimeSlots } from '../../services/appointmentService';
import { initializePatientProfile } from '../../services/patientProfileService';
import { formatProcedencia, getProcedenciaOptions, getProcedenciaOptionsCRM, getAgendamientoManualOptions } from '../../utils/procedenciaUtils';
import DateSelector from '../../components/appointments/DateSelector';
import TimeSelector from '../../components/appointments/TimeSelector';
import otologosData from '../../data/bdatos_otologos.json';

const LeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('funnel'); // 'funnel' o 'list'
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [patientData, setPatientData] = useState({ hasHearingLoss: false, notes: '' });
  const [leadsLoading, setLeadsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    usuarioAudifonosMedicados: 'NO', // SI/NO para usuario de audífonos medicados
    procedencia: 'visita-medica', // Usar procedencia (igual que en landing)
    interes: 'Consulta General',
    notas: '',
    estado: 'nuevo', // Los leads manuales siempre empiezan como 'nuevo'
    medicoReferente: '',
    redSocial: '', // Para Marketing Digital
    campanaMarketingOffline: '', // Para Marketing Offline
    personaRecomendacion: '', // Para Recomendación
    agendamientoManualTipo: '', // Para agendamiento manual: telefono, whatsapp, referido
  });
  
  // Convert to appointment state
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: '',
  });
  const [convertAvailableSlots, setConvertAvailableSlots] = useState([]);

  useEffect(() => {
    if (!convertDialogOpen || !appointmentData.date) {
      setConvertAvailableSlots([]);
      return;
    }
    getAvailableTimeSlots(appointmentData.date, '07:00', '18:00').then(setConvertAvailableSlots);
  }, [convertDialogOpen, appointmentData.date]);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const allLeads = await getAllLeadsCombined();
      setLeads([...allLeads]);
    } catch (e) {
      console.error('[LeadsPage] Error al cargar leads:', e);
      setSnackbar({ open: true, message: e?.message || 'Error al cargar leads', severity: 'error' });
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = leads;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.telefono.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (filterEstado !== 'all') {
      filtered = filtered.filter((lead) => lead.estado === filterEstado);
    }
    // "Todos": mostrar todos los leads (incl. paciente y perdido)

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => {
      const dateA = new Date((a.fecha || '1970-01-01') + 'T00:00:00');
      const dateB = new Date((b.fecha || '1970-01-01') + 'T00:00:00');
      return dateB - dateA;
    });

    setFilteredLeads(filtered);
  }, [searchTerm, filterEstado, leads]);

  const handleMenuClick = (event, lead) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // NO limpiar selectedLead aquí, se necesita para los diálogos
    // Solo limpiar si no se va a abrir ningún diálogo
  };
  
  const handleMenuCloseWithReset = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  const handleViewDetails = () => {
    setDetailDialogOpen(true);
    setAnchorEl(null); // Solo cerrar el menú, mantener selectedLead
  };

  const handleEdit = () => {
    // Usar procedencia (compatibilidad con leads antiguos que pueden tener 'origen')
    const procedenciaValue = selectedLead.procedencia || selectedLead.origen || 'visita-medica';
    
    setFormData({
      nombre: selectedLead.nombre,
      email: selectedLead.email,
      telefono: selectedLead.telefono,
      direccion: selectedLead.direccion || '',
      ciudad: selectedLead.ciudad || '',
      usuarioAudifonosMedicados: selectedLead.usuarioAudifonosMedicados || 'NO',
      procedencia: procedenciaValue, // Mantener el valor original (ej: 'leads-marketing-digital')
      interes: selectedLead.interes,
      notas: selectedLead.notas || '',
      estado: selectedLead.estado,
      medicoReferente: selectedLead.medicoReferente || '',
      redSocial: selectedLead.redSocial || '',
      campanaMarketingOffline: selectedLead.campanaMarketingOffline || '',
      personaRecomendacion: selectedLead.personaRecomendacion || '',
      agendamientoManualTipo: selectedLead.agendamientoManualTipo || '',
    });
    setCreateDialogOpen(true);
    handleMenuClose();
  };

  const handleConvertToPatient = async () => {
    if (!selectedLead) return;
    
    if (patientData.hasHearingLoss) {
      console.log('[LeadsPage] Convirtiendo lead a paciente:', selectedLead);
      
      // 1. Buscar si hay una cita asociada al lead (por email o teléfono)
      const allAppointments = await getAllAppointments();
      const existingAppointment = allAppointments.find(apt => 
        (apt.patientEmail === selectedLead.email || apt.patientPhone === selectedLead.telefono) &&
        apt.status !== 'cancelled'
      );
      
      if (existingAppointment) {
        const updateResult = await updateAppointmentStatus(existingAppointment.id, 'patient');
        if (!updateResult.success) {
          console.error('[LeadsPage] Error al actualizar cita:', updateResult.error);
          showSnackbar('Error al actualizar la cita. El lead se marcó como paciente pero puede no aparecer en Pacientes.', 'warning');
        } else {
          console.log('[LeadsPage] ✅ Cita actualizada a estado "patient"');
        }
      } else {
        // Si no hay cita, crear una cita con estado 'patient' para que aparezca en Pacientes
        // Usar la fecha actual y una hora por defecto
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const defaultTime = '10:00'; // Hora por defecto
        
        const appointmentResult = await createAppointment({
          date: dateStr,
          time: defaultTime,
          patientName: selectedLead.nombre,
          patientEmail: selectedLead.email,
          patientPhone: selectedLead.telefono,
          reason: selectedLead.interes || 'Consulta General',
          procedencia: selectedLead.procedencia || 'visita-medica',
        });
        
        if (appointmentResult.success && appointmentResult.appointment) {
          const updateResult = await updateAppointmentStatus(appointmentResult.appointment.id, 'patient');
          if (!updateResult.success) {
            console.error('[LeadsPage] Error al actualizar nueva cita a "patient":', updateResult.error);
          }
        } else {
          console.error('[LeadsPage] Error al crear cita:', appointmentResult.error);
          // Continuar con la conversión del lead aunque falle la creación de la cita
        }
      }
      
      // 2. Inicializar perfil de paciente si no existe
      try {
        const profileResult = initializePatientProfile({
          nombre: selectedLead.nombre,
          email: selectedLead.email,
          telefono: selectedLead.telefono,
          direccion: selectedLead.direccion || '',
          ciudad: selectedLead.ciudad || '',
          usuarioAudifonosMedicados: selectedLead.usuarioAudifonosMedicados || 'NO',
          procedencia: selectedLead.procedencia || 'visita-medica',
          reason: selectedLead.interes || 'Consulta General',
          notas: `${selectedLead.notas || ''}\n\n[Convertido a Paciente desde Lead] ${new Date().toLocaleDateString()}\nPérdida auditiva confirmada.\n${patientData.notes || ''}`.trim(),
        });
        
        if (profileResult.success) {
          console.log('[LeadsPage] ✅ Perfil de paciente inicializado');
        }
      } catch (error) {
        console.error('[LeadsPage] Error al inicializar perfil de paciente:', error);
      }
      
      // 3. Actualizar el lead a estado 'paciente'
      const result = await updateLead(selectedLead.id, { 
        estado: 'paciente',
        notas: `${selectedLead.notas || ''}\n\n[Convertido a Paciente] ${new Date().toLocaleDateString()}\nPérdida auditiva confirmada.\n${patientData.notes || ''}`.trim(),
      });
      
      if (result.success) {
        console.log('[LeadsPage] ✅ Lead actualizado a estado "paciente"');
        await loadLeads();
        setPatientDialogOpen(false);
        setPatientData({ hasHearingLoss: false, notes: '' });
        showSnackbar('Lead convertido a paciente exitosamente. Ahora aparece en la sección de Pacientes.', 'success');
        // El lead desaparecerá de la lista porque el filtro excluye pacientes
      } else {
        console.error('[LeadsPage] Error al actualizar lead:', result.error);
        showSnackbar(result.error || 'Error al convertir el lead', 'error');
      }
    } else {
      showSnackbar('Debe confirmar que el paciente tiene pérdida auditiva', 'warning');
    }
  };

  const handleDelete = async () => {
    if (selectedLead && !selectedLead.appointmentId) {
      const result = await deleteLead(selectedLead.id);
      if (result.success) {
        await loadLeads();
        showSnackbar('Lead eliminado exitosamente', 'success');
      } else {
        showSnackbar(result.error || 'Error al eliminar el lead', 'error');
      }
    } else {
      showSnackbar('No se puede eliminar un lead generado desde una cita', 'warning');
    }
    handleMenuClose();
  };

  const handleUpdateEstado = async (newEstado) => {
    if (!selectedLead) {
      handleMenuClose();
      return;
    }

    // Bloquear cambio de estado si ya es paciente
    if (selectedLead.estado === 'paciente') {
      showSnackbar('No se puede cambiar el estado de un lead que ya es paciente', 'warning');
      handleMenuClose();
      return;
    }
    
    // Si el lead viene de una cita, actualizar también el estado de la cita si es necesario
    if (selectedLead.appointmentId && newEstado === 'agendado') {
      // Si se marca como agendado, la cita ya está en estado 'confirmed', no hacer nada
      showSnackbar('El lead ya está asociado a una cita agendada', 'info');
      handleMenuClose();
      return;
    }
    
    // Actualizar el estado del lead
    const result = await updateLead(selectedLead.id, { estado: newEstado });
    if (result.success) {
      await loadLeads();
      showSnackbar(`Estado actualizado a "${newEstado}" exitosamente`, 'success');
    } else {
      showSnackbar(result.error || 'Error al actualizar el estado', 'error');
    }
    handleMenuClose();
  };

  const handleConvertToAppointment = () => {
    // Capturar el lead actual antes de cerrar el menú
    const leadToConvert = selectedLead;
    
    if (!leadToConvert) {
      console.error('[LeadsPage] No hay lead seleccionado para convertir a cita');
      showSnackbar('Por favor selecciona un lead primero', 'error');
      setAnchorEl(null);
      return;
    }
    
    console.log('[LeadsPage] Convirtiendo lead a cita:', leadToConvert);
    console.log('[LeadsPage] leadToConvert nombre:', leadToConvert.nombre);
    
    // Cerrar el menú
    setAnchorEl(null);
    
    // Configurar los datos de la cita usando el lead capturado
    setAppointmentData({
      date: '',
      time: '',
      reason: leadToConvert.interes || '',
    });
    
    // Abrir el diálogo inmediatamente
    // El selectedLead debería seguir disponible porque no lo limpiamos
    setConvertDialogOpen(true);
  };

  const handleSaveLead = async () => {
    if (selectedLead) {
      const result = await updateLead(selectedLead.id, formData);
      if (result.success) {
        await loadLeads();
        setCreateDialogOpen(false);
        resetForm();
        showSnackbar('Lead actualizado exitosamente', 'success');
      } else {
        showSnackbar(result.error || 'Error al actualizar el lead', 'error');
      }
    } else {
      const existing = await findLeadByEmailOrPhone(formData.email, formData.telefono);
      if (existing) {
        setDuplicateLead(existing);
        setDuplicateDialogOpen(true);
        return;
      }
      const result = await createLead(formData);
      if (result.success) {
        await loadLeads();
        setCreateDialogOpen(false);
        resetForm();
        showSnackbar('Lead creado exitosamente', 'success');
      } else {
        showSnackbar(result.error || 'Error al crear el lead', 'error');
      }
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedLead || !appointmentData.date || !appointmentData.time) {
      showSnackbar('Por favor selecciona fecha y hora', 'error');
      return;
    }

    const result = await createAppointment({
      date: appointmentData.date,
      time: appointmentData.time,
      patientName: selectedLead.nombre,
      patientEmail: selectedLead.email,
      patientPhone: selectedLead.telefono,
      reason: appointmentData.reason,
      procedencia: selectedLead.procedencia || selectedLead.origen || 'visita-medica',
    });

    if (result.success) {
      console.log('[LeadsPage] Cita creada exitosamente:', result.appointment);
      console.log('[LeadsPage] Lead seleccionado antes de actualizar:', selectedLead);
      
      // Actualizar lead a "convertido" y asociar el appointmentId
      // IMPORTANTE: Si el lead viene de una cita (tiene appointmentId), no podemos actualizarlo directamente
      // porque se genera dinámicamente. En su lugar, creamos/actualizamos un lead manual.
      
      if (selectedLead.appointmentId) {
        const allManualLeads = await getAllLeads();
        const existingManualLead = allManualLeads.find(l => 
          l.email === selectedLead.email || l.telefono === selectedLead.telefono
        );
        if (existingManualLead) {
          await updateLead(existingManualLead.id, { 
            estado: 'convertido',
            appointmentId: result.appointment.id
          });
        } else {
          await createLead({
            nombre: selectedLead.nombre,
            email: selectedLead.email,
            telefono: selectedLead.telefono,
            procedencia: selectedLead.procedencia || 'visita-medica',
            interes: selectedLead.interes || 'Consulta General',
            notas: selectedLead.notas || '',
            estado: 'convertido',
            appointmentId: result.appointment.id,
            direccion: selectedLead.direccion || '',
            ciudad: selectedLead.ciudad || '',
            usuarioAudifonosMedicados: selectedLead.usuarioAudifonosMedicados || 'NO',
          });
        }
      } else {
        const updateResult = await updateLead(selectedLead.id, { 
          estado: 'convertido',
          appointmentId: result.appointment.id
        });
        if (!updateResult.success) {
          console.error('[LeadsPage] Error al actualizar lead:', updateResult.error);
        }
      }
      await loadLeads();
      
      setConvertDialogOpen(false);
      setAppointmentData({ date: '', time: '', reason: '' });
      showSnackbar('Cita creada exitosamente. El lead ahora aparece como "Convertido a Cita" en el funnel', 'success');
    } else {
      showSnackbar(result.error || 'Error al crear la cita', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      usuarioAudifonosMedicados: 'NO',
      procedencia: 'visita-medica', // Usar procedencia (igual que en landing)
      interes: 'Consulta General',
      notas: '',
      estado: 'nuevo',
      medicoReferente: '',
      redSocial: '',
      campanaMarketingOffline: '',
      personaRecomendacion: '',
      agendamientoManualTipo: '',
    });
    setSelectedLead(null);
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone) => {
    window.location.href = `sms:${phone}`;
  };

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'nuevo':
        return (
          <Chip
            icon={<Schedule />}
            label="Nuevo"
            size="small"
            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
          />
        );
      case 'contactado':
        return (
          <Chip
            icon={<Phone />}
            label="Contactado"
            size="small"
            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
          />
        );
      case 'agendado':
        return (
          <Chip
            icon={<CalendarToday />}
            label="Agendado"
            size="small"
            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
          />
        );
      case 'calificado':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Calificado"
            size="small"
            sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }}
          />
        );
      case 'convertido':
        return (
          <Chip
            icon={<CalendarToday />}
            label="Convertido"
            size="small"
            sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600 }}
          />
        );
      case 'perdido':
        return (
          <Chip
            icon={<Close />}
            label="Perdido"
            size="small"
            sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            icon={<Schedule />}
            label={estado}
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
                Gestión de Leads
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Administra y sigue tus prospectos
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
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
              Volver
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Búsqueda y Filtros */}
        <Card
          sx={{
            mb: 3,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar leads por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#085946' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#085946',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#085946',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterEstado}
                    label="Estado"
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="nuevo">Nuevo</MenuItem>
                    <MenuItem value="contactado">Contactado</MenuItem>
                    <MenuItem value="agendado">Agendado</MenuItem>
                    <MenuItem value="calificado">Calificado</MenuItem>
                    <MenuItem value="convertido">Convertido</MenuItem>
                    <MenuItem value="paciente">Paciente</MenuItem>
                    <MenuItem value="perdido">Perdido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    resetForm();
                    setCreateDialogOpen(true);
                  }}
                  sx={{
                    bgcolor: '#085946',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: '#272F50',
                    },
                  }}
                >
                  Nuevo Lead
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'nuevo').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Nuevos
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#e65100', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'contactado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Contactados
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'agendado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Agendados
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'calificado').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Calificados
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#7b1fa2', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'convertido').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Convertidos
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                {leads.filter((l) => l.estado === 'paciente').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Pacientes
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ minWidth: 0 }}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
                },
              }}
            >
              <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                {leads.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Total
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs para cambiar vista */}
        <Card
          sx={{
            mb: 3,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <Tabs
            value={viewMode}
            onChange={(e, newValue) => setViewMode(newValue)}
            sx={{
              borderBottom: '1px solid rgba(8, 89, 70, 0.1)',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 64,
              },
            }}
          >
            <Tab label="Funnel de Seguimiento" value="funnel" />
            <Tab label="Lista de Leads" value="list" />
          </Tabs>
        </Card>

        {/* Vista de Funnel */}
        {viewMode === 'funnel' && (
          <Card
            sx={{
              mb: 3,
              border: '1px solid rgba(8, 89, 70, 0.1)',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 3 }}>
                Funnel de Seguimiento de Leads
              </Typography>
              <Grid container spacing={2}>
                {[
                  { estado: 'nuevo', label: 'Nuevos', color: '#1976d2', icon: <Schedule /> },
                  { estado: 'agendado', label: 'Agendados', color: '#0288d1', icon: <CalendarToday /> },
                  { estado: 'contactado', label: 'Contactados', color: '#e65100', icon: <Phone /> },
                  { estado: 'calificado', label: 'Calificados', color: '#085946', icon: <CheckCircle /> },
                  { estado: 'convertido', label: 'Convertidos a Cita', color: '#7b1fa2', icon: <CalendarToday /> },
                  { estado: 'paciente', label: 'Pacientes', color: '#2e7d32', icon: <Person /> },
                  { estado: 'perdido', label: 'Perdidos', color: '#c62828', icon: <Close /> },
                ].map((stage) => {
                  const stageLeads = leads.filter((l) => l.estado === stage.estado);
                  const percentage = leads.length > 0 ? (stageLeads.length / leads.length) * 100 : 0;
                  return (
                    <Grid item xs={12} sm={6} md={2} key={stage.estado}>
                      <Card
                        sx={{
                          border: `2px solid ${stage.color}`,
                          borderRadius: 3,
                          p: 2,
                          textAlign: 'center',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 4px 12px ${stage.color}40`,
                          },
                        }}
                      >
                        <Box sx={{ color: stage.color, mb: 1 }}>
                          {React.cloneElement(stage.icon, { sx: { fontSize: 32 } })}
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: stage.color, mb: 0.5 }}>
                          {stageLeads.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
                          {stage.label}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: stage.color,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#86899C', mt: 0.5, display: 'block' }}>
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              
              {/* Lista de leads por etapa */}
              <Box sx={{ mt: 4 }}>
                {[
                  { estado: 'nuevo', label: 'Leads Nuevos', color: '#1976d2' },
                  { estado: 'agendado', label: 'Leads Agendados', color: '#0288d1' },
                  { estado: 'contactado', label: 'Leads Contactados', color: '#e65100' },
                  { estado: 'calificado', label: 'Leads Calificados', color: '#085946' },
                  { estado: 'convertido', label: 'Leads Convertidos', color: '#7b1fa2' },
                  { estado: 'paciente', label: 'Pacientes', color: '#2e7d32' },
                  { estado: 'perdido', label: 'Leads Perdidos', color: '#c62828' },
                ].map((stage) => {
                  const stageLeads = leads.filter(l => l.estado === stage.estado);
                  
                  if (stageLeads.length === 0) return null;
                  
                  return (
                    <Box key={stage.estado} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: stage.color, mb: 2 }}>
                        {stage.label} ({stageLeads.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {stageLeads.slice(0, 5).map((lead) => (
                          <Grid item xs={12} sm={6} md={4} key={lead.id}>
                            <Card
                              sx={{
                                border: `1px solid ${stage.color}40`,
                                borderRadius: 2,
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: `0 2px 8px ${stage.color}40`,
                                },
                              }}
                              onClick={() => {
                                setSelectedLead(lead);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: stage.color }}>
                                  {lead.nombre.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {lead.nombre}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                                {lead.email}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                                {lead.telefono}
                              </Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                      {stageLeads.length > 5 && (
                        <Button
                          size="small"
                          onClick={() => {
                            setFilterEstado(stage.estado);
                            setViewMode('list');
                          }}
                          sx={{ mt: 1, color: stage.color }}
                        >
                          Ver todos ({stageLeads.length})
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Leads */}
        {viewMode === 'list' && (
        <Card
          sx={{
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {filteredLeads.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Lead</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Contacto</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Origen</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Interés</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="center">
                        Acciones
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="right">
                        Más
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: '#085946',
                                fontSize: '1rem',
                              }}
                            >
                              {lead.nombre.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {lead.nombre}
                              </Typography>
                              {lead.appointmentId && (
                                <Typography variant="caption" sx={{ color: '#86899C', fontStyle: 'italic' }}>
                                  Desde cita
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              <Email sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                              {lead.email}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              <Phone sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                              {lead.telefono}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatProcedencia(lead.procedencia || lead.origen, lead.agendamientoManualTipo)}
                            size="small"
                            sx={{
                              bgcolor: '#f0f4f3',
                              color: '#085946',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{lead.interes}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(lead.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>{getEstadoChip(lead.estado)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Llamar">
                              <IconButton
                                size="small"
                                onClick={() => handleCall(lead.telefono)}
                                sx={{ color: '#085946' }}
                              >
                                <Phone fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="SMS">
                              <IconButton
                                size="small"
                                onClick={() => handleSMS(lead.telefono)}
                                sx={{ color: '#0a6b56' }}
                              >
                                <SmsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Email">
                              <IconButton
                                size="small"
                                onClick={() => handleEmailClick(lead.email)}
                                sx={{ color: '#272F50' }}
                              >
                                <Email fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="WhatsApp">
                              <IconButton
                                size="small"
                                onClick={() => handleWhatsApp(lead.telefono)}
                                sx={{ color: '#25D366' }}
                              >
                                <WhatsApp fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, lead)}
                            sx={{ color: '#085946' }}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PersonAdd sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ color: '#272F50', mb: 1 }}>
                  No se encontraron leads
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C' }}>
                  {searchTerm || filterEstado !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay leads registrados aún. Los leads se generan automáticamente desde citas no asistidas.'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        )}
      </Container>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={(event, reason) => {
          // Solo cerrar el menú si no se está abriendo un diálogo
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setAnchorEl(null);
          } else {
            handleMenuClose();
          }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1, fontSize: 20 }} /> Ver Detalles
        </MenuItem>
        
        {/* Opciones de seguimiento - No disponibles si ya es paciente */}
        {selectedLead?.estado !== 'paciente' && (
          <>
            <Divider />
            <MenuItem onClick={() => handleUpdateEstado('nuevo')}>
              <Schedule sx={{ mr: 1, fontSize: 20, color: '#1976d2' }} /> Marcar como Nuevo
            </MenuItem>
            <MenuItem onClick={() => handleUpdateEstado('contactado')}>
              <Phone sx={{ mr: 1, fontSize: 20, color: '#e65100' }} /> Marcar como Contactado
            </MenuItem>
            <MenuItem onClick={() => handleUpdateEstado('agendado')}>
              <CalendarToday sx={{ mr: 1, fontSize: 20, color: '#1976d2' }} /> Marcar como Agendado
            </MenuItem>
            <MenuItem onClick={() => handleUpdateEstado('calificado')}>
              <CheckCircle sx={{ mr: 1, fontSize: 20, color: '#085946' }} /> Marcar como Calificado
            </MenuItem>
            <MenuItem onClick={() => handleUpdateEstado('perdido')}>
              <Close sx={{ mr: 1, fontSize: 20, color: '#c62828' }} /> Marcar como Perdido
            </MenuItem>
            <Divider />
            {/* Convertir a Cita */}
            <MenuItem onClick={() => {
              if (selectedLead) handleConvertToAppointment();
            }}>
              <CalendarToday sx={{ mr: 1, fontSize: 20, color: '#085946' }} /> Convertir a Cita
            </MenuItem>
            {/* Convertir a Paciente */}
            <MenuItem onClick={() => {
              setPatientDialogOpen(true);
              handleMenuClose();
            }}>
              <Person sx={{ mr: 1, fontSize: 20, color: '#0277bd' }} /> Convertir a Paciente
            </MenuItem>
          </>
        )}
        {selectedLead?.estado === 'paciente' && (
          <MenuItem disabled sx={{ color: '#999' }}>
            <Person sx={{ mr: 1, fontSize: 20 }} /> Ya es paciente
          </MenuItem>
        )}
        
        {/* Editar y Eliminar - Solo para leads manuales */}
        {selectedLead && !selectedLead.appointmentId && (
          <>
            <Divider />
            <MenuItem onClick={handleEdit}>
              <Edit sx={{ mr: 1, fontSize: 20, color: '#272F50' }} /> Editar Lead
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <Delete sx={{ mr: 1, fontSize: 20, color: '#c62828' }} /> Eliminar Lead
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Dialog de Detalles */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Detalles del Lead
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedLead && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Nombre
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedLead.nombre}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Contacto
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    onClick={() => handleCall(selectedLead.telefono)}
                    variant="outlined"
                  >
                    Llamar
                  </Button>
                  <Button
                    size="small"
                    startIcon={<SmsIcon />}
                    onClick={() => handleSMS(selectedLead.telefono)}
                    variant="outlined"
                  >
                    SMS
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Email />}
                    onClick={() => handleEmailClick(selectedLead.email)}
                    variant="outlined"
                  >
                    Email
                  </Button>
                  <Button
                    size="small"
                    startIcon={<WhatsApp />}
                    onClick={() => handleWhatsApp(selectedLead.telefono)}
                    variant="outlined"
                    sx={{ color: '#25D366', borderColor: '#25D366' }}
                  >
                    WhatsApp
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Procedencia
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatProcedencia(selectedLead.procedencia || selectedLead.origen, selectedLead.agendamientoManualTipo)}
                </Typography>
                {selectedLead.medicoReferente && (
                  <Typography variant="caption" sx={{ color: '#085946', display: 'block', mt: 0.5 }}>
                    Médico: {selectedLead.medicoReferente}
                  </Typography>
                )}
                {selectedLead.redSocial && (
                  <Typography variant="caption" sx={{ color: '#085946', display: 'block', mt: 0.5 }}>
                    Red Social: {selectedLead.redSocial}
                  </Typography>
                )}
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Interés
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedLead.interes}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Fecha de Registro
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedLead.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
              {selectedLead.notas && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                    Notas
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedLead.notas}</Typography>
                </Box>
              )}
              {selectedLead.appointmentId && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                    Información de Cita Original
                  </Typography>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Este lead fue generado automáticamente desde una cita.
                    ID de cita: {selectedLead.appointmentId}
                  </Alert>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                  Estado Actual
                </Typography>
                {getEstadoChip(selectedLead.estado)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Crear/Editar Lead */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          {selectedLead ? 'Editar Lead' : 'Nuevo Lead'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Usuario de audífonos medicados</FormLabel>
                <RadioGroup
                  row
                  value={formData.usuarioAudifonosMedicados}
                  onChange={(e) => setFormData({ ...formData, usuarioAudifonosMedicados: e.target.value })}
                >
                  <FormControlLabel value="SI" control={<Radio />} label="SI" />
                  <FormControlLabel value="NO" control={<Radio />} label="NO" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Procedencia</InputLabel>
                <Select
                  value={formData.procedencia}
                  label="Procedencia"
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      procedencia: e.target.value,
                      // Limpiar campos condicionales si cambia la procedencia
                      medicoReferente: e.target.value !== 'visita-medica' ? '' : formData.medicoReferente,
                      redSocial: e.target.value !== 'leads-marketing-digital' ? '' : formData.redSocial,
                      campanaMarketingOffline: e.target.value !== 'leads-marketing-offline' ? '' : formData.campanaMarketingOffline,
                      personaRecomendacion: e.target.value !== 'recomendacion' ? '' : formData.personaRecomendacion,
                      agendamientoManualTipo: e.target.value !== 'agendamiento-manual' ? '' : formData.agendamientoManualTipo,
                    });
                  }}
                >
                  {getProcedenciaOptionsCRM().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Interés"
                value={formData.interes}
                onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
              />
            </Grid>
            {/* Campo condicional: Médico Referente (si procedencia es Visita Médica) */}
            {formData.procedencia === 'visita-medica' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Médico que lo envió</InputLabel>
                  <Select
                    value={formData.medicoReferente}
                    label="Médico que lo envió"
                    onChange={(e) => setFormData({ ...formData, medicoReferente: e.target.value })}
                  >
                    {otologosData.map((otologo) => (
                      <MenuItem key={otologo.nombre} value={otologo.nombre}>
                        {otologo.nombre} - {otologo.ciudad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {/* Campo condicional: Red Social (si procedencia es Marketing Digital) */}
            {formData.procedencia === 'leads-marketing-digital' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Red Social</InputLabel>
                  <Select
                    value={formData.redSocial}
                    label="Red Social"
                    onChange={(e) => setFormData({ ...formData, redSocial: e.target.value })}
                  >
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                    <MenuItem value="Twitter/X">Twitter/X</MenuItem>
                    <MenuItem value="TikTok">TikTok</MenuItem>
                    <MenuItem value="YouTube">YouTube</MenuItem>
                    <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                    <MenuItem value="Google Ads">Google Ads</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {/* Campo condicional: Campaña (si procedencia es Marketing Offline) */}
            {formData.procedencia === 'leads-marketing-offline' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaña"
                  placeholder="Escribe el nombre de la campaña"
                  value={formData.campanaMarketingOffline}
                  onChange={(e) => setFormData({ ...formData, campanaMarketingOffline: e.target.value })}
                />
              </Grid>
            )}
            {/* Campo condicional: Persona que recomendó (si procedencia es Recomendación) */}
            {formData.procedencia === 'recomendacion' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de la persona que recomendó"
                  placeholder="Escribe el nombre de la persona que nos recomendó"
                  value={formData.personaRecomendacion}
                  onChange={(e) => setFormData({ ...formData, personaRecomendacion: e.target.value })}
                />
              </Grid>
            )}
            {/* Campo condicional: Tipo de Agendamiento Manual */}
            {formData.procedencia === 'agendamiento-manual' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Agendamiento</InputLabel>
                  <Select
                    value={formData.agendamientoManualTipo}
                    label="Tipo de Agendamiento"
                    onChange={(e) => setFormData({ ...formData, agendamientoManualTipo: e.target.value })}
                  >
                    {getAgendamientoManualOptions().map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={3}
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              />
            </Grid>
            {selectedLead && (
              <Grid item xs={12}>
                <FormControl fullWidth disabled={selectedLead.estado === 'paciente'}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.estado}
                    label="Estado"
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <MenuItem value="nuevo">Nuevo</MenuItem>
                    <MenuItem value="contactado">Contactado</MenuItem>
                    <MenuItem value="agendado">Agendado</MenuItem>
                    <MenuItem value="calificado">Calificado</MenuItem>
                    <MenuItem value="convertido">Convertido</MenuItem>
                    <MenuItem value="perdido">Perdido</MenuItem>
                    <MenuItem value="paciente">Paciente</MenuItem>
                  </Select>
                  {selectedLead.estado === 'paciente' && (
                    <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5 }}>
                      No se puede cambiar el estado de un lead que ya es paciente.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveLead} variant="contained" sx={{ bgcolor: '#085946' }}>
            {selectedLead ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog aviso lead duplicado (antes de evitar crear) */}
      <Dialog open={duplicateDialogOpen} onClose={() => { setDuplicateDialogOpen(false); setDuplicateLead(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#d32f2f', color: '#fff', fontWeight: 700 }}>
          Dato ya creado o duplicado
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ya existe un lead con este email o teléfono. No se ha creado uno nuevo.
          </Alert>
          {duplicateLead && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1 }}>Lead existente:</Typography>
              <Typography variant="body2"><strong>{duplicateLead.nombre}</strong></Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>{duplicateLead.email}</Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>{duplicateLead.telefono}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setDuplicateDialogOpen(false);
              setDuplicateLead(null);
            }}
            variant="outlined"
          >
            Aceptar
          </Button>
          <Button
            onClick={() => {
              if (!duplicateLead) return;
              setCreateDialogOpen(false);
              resetForm();
              setDuplicateDialogOpen(false);
              setSearchTerm(duplicateLead.email || duplicateLead.nombre || '');
              setViewMode('list');
              setSelectedLead(duplicateLead);
              setDetailDialogOpen(true);
              setDuplicateLead(null);
              loadLeads();
            }}
            variant="contained"
            startIcon={<Search />}
            sx={{ bgcolor: '#085946' }}
          >
            Buscar dato creado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Convertir a Cita */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => {
          setConvertDialogOpen(false);
          setAppointmentData({ date: '', time: '', reason: '' });
          setSelectedLead(null); // Limpiar solo cuando se cierra el diálogo
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
            overflow: 'auto',
            '& .MuiDialogContent-root': {
              overflow: 'visible',
            },
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Agendar Cita para Lead
        </DialogTitle>
        <DialogContent sx={{ pt: 3, overflow: 'auto', minHeight: '500px' }}>
          {console.log('[LeadsPage Dialog] selectedLead:', selectedLead)}
          {selectedLead ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Agendando cita para: <strong>{selectedLead.nombre}</strong>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Selecciona la fecha y hora disponible para agendar la cita. Una vez agendada, el lead aparecerá en el funnel como "Agendado".
                </Typography>
              </Alert>
              
              <Grid container spacing={3}>
                {/* Calendario */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 3,
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(8, 89, 70, 0.1)',
                      boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                      minHeight: '450px',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ color: '#085946' }} />
                      Selecciona Fecha
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      {console.log('[LeadsPage] Renderizando DateSelector con fecha:', appointmentData.date)}
                      <DateSelector
                        selectedDate={appointmentData.date || ''}
                        onDateSelect={(date) => {
                          console.log('[LeadsPage] Fecha seleccionada:', date);
                          setAppointmentData({ ...appointmentData, date, time: '' });
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Horarios Disponibles */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 3,
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(8, 89, 70, 0.1)',
                      boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                      minHeight: '400px',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ color: '#085946' }} />
                      Selecciona Hora
                    </Typography>
                    {appointmentData.date ? (
                      <Box sx={{ width: '100%' }}>
                        {console.log('[LeadsPage] Renderizando TimeSelector con fecha:', appointmentData.date, 'hora:', appointmentData.time)}
                        <TimeSelector
                          selectedDate={appointmentData.date}
                          selectedTime={appointmentData.time}
                          onTimeSelect={(time) => {
                            console.log('[LeadsPage] Hora seleccionada:', time);
                            setAppointmentData({ ...appointmentData, time });
                          }}
                          availableTimes={convertAvailableSlots}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Schedule sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          Por favor, selecciona una fecha primero
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Motivo de la consulta */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo de la consulta"
                    multiline
                    rows={3}
                    value={appointmentData.reason}
                    onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })}
                    placeholder="Describe el motivo de la consulta..."
                  />
                </Grid>
              </Grid>

              {appointmentData.date && appointmentData.time && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  Cita programada para <strong>{new Date(appointmentData.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong> a las <strong>{appointmentData.time}</strong>
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                No se ha seleccionado un lead
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setConvertDialogOpen(false);
              setAppointmentData({ date: '', time: '', reason: '' });
            }} 
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateAppointment} 
            variant="contained" 
            sx={{ bgcolor: '#085946' }}
            disabled={!appointmentData.date || !appointmentData.time}
          >
            Agendar Cita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Convertir a Paciente */}
      <Dialog
        open={patientDialogOpen}
        onClose={() => {
          setPatientDialogOpen(false);
          setPatientData({ hasHearingLoss: false, notes: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Convertir Lead a Paciente
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedLead && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Confirmando que <strong>{selectedLead.nombre}</strong> asistió a la cita y tiene pérdida auditiva confirmada.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Ejemplo: Si "María González" asistió a su cita del 15 de enero y se confirmó que tiene pérdida auditiva, marca esta opción. El lead desaparecerá de Leads y aparecerá en la sección de Pacientes.
                </Typography>
              </Alert>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                  ¿El paciente tiene pérdida auditiva confirmada?
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={patientData.hasHearingLoss ? 'yes' : 'no'}
                    onChange={(e) => setPatientData({ ...patientData, hasHearingLoss: e.target.value === 'yes' })}
                  >
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="yes">Sí, tiene pérdida auditiva</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#86899C' }}>
                  ⚠️ Solo marca "Sí" si el paciente asistió a la cita y se confirmó que tiene pérdida auditiva.
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Notas adicionales"
                multiline
                rows={3}
                value={patientData.notes}
                onChange={(e) => setPatientData({ ...patientData, notes: e.target.value })}
                placeholder="Agregar notas sobre el diagnóstico o tratamiento..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setPatientDialogOpen(false);
              setPatientData({ hasHearingLoss: false, notes: '' });
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={handleConvertToPatient} variant="contained" sx={{ bgcolor: '#085946' }}>
            Convertir a Paciente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadsPage;
