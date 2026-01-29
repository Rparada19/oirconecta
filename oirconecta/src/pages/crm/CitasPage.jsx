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
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem as SelectMenuItem,
  InputLabel,
  FormControl,
  TextareaAutosize,
} from '@mui/material';
import {
  CalendarToday,
  Search,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Phone,
  Email,
  ArrowBack,
  MoreVert,
  EventAvailable,
  EventBusy,
  Source,
  List,
  Block,
  WhatsApp,
  Refresh,
  Event,
  Note,
  Comment,
  Add,
  Hearing,
  Edit,
  Assignment,
  VideoCall,
} from '@mui/icons-material';
import SmsIcon from '@mui/icons-material/Sms';
import {
  getAllAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  getBlockedSlots,
  blockTimeSlot,
  unblockTimeSlot,
  getAvailableTimeSlots,
  rescheduleAppointment,
  getAppointmentById,
} from '../../services/appointmentService';
import {
  getPatientRecords,
  addPatientRecord,
  recordConsultation,
  recordCancellation,
  recordReschedule,
  getRescheduleHistory,
} from '../../services/patientRecordService';
import { recordAppointmentInteraction } from '../../services/interactionService';
import { formatProcedencia } from '../../utils/procedenciaUtils';
import DateSelector from '../../components/appointments/DateSelector';
import TimeSelector from '../../components/appointments/TimeSelector';
import PatientProfileDialog from '../../components/patient/PatientProfileDialog';

const CitasPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedDateForBlock, setSelectedDateForBlock] = useState(null);
  const [selectedTimeForBlock, setSelectedTimeForBlock] = useState(null);
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [blockedSlots, setBlockedSlots] = useState([]);
  
  // Estados para nuevos dialogs
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addCommentDialogOpen, setAddCommentDialogOpen] = useState(false);
  const [patientProfileDialogOpen, setPatientProfileDialogOpen] = useState(false);
  const [patientRecords, setPatientRecords] = useState([]);
  
  // Estados para formularios
  const [consultationData, setConsultationData] = useState({
    notes: '',
    hearingLoss: false,
    nextSteps: '',
  });
  const [cancellationReason, setCancellationReason] = useState('');
  const [newComment, setNewComment] = useState({ title: '', description: '', type: 'note' });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [activityTab, setActivityTab] = useState(0); // 0: Activity, 1: Notes, 2: Emails, 3: Calls

  useEffect(() => {
    loadData();
    
    // Escuchar cambios en localStorage para actualizar en tiempo real
    const handleStorageChange = (e) => {
      if (e.key === 'oirconecta_appointments' || e.key === 'oirconecta_blocked_slots') {
        loadData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente (por si el cambio es en la misma pestaña)
    const interval = setInterval(() => {
      const currentAppointments = getAllAppointments();
      if (currentAppointments.length !== appointments.length) {
        loadData();
      }
    }, 2000); // Verificar cada 2 segundos
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [appointments.length]);

  const loadData = () => {
    const allAppointments = getAllAppointments();
    console.log('[CitasPage] 🔄 Cargando datos:', {
      totalCitas: allAppointments.length,
      citas: allAppointments.map(apt => ({
        id: apt.id,
        paciente: apt.patientName,
        fecha: apt.date,
        estado: apt.status
      }))
    });
    setAppointments(allAppointments);
    setFilteredAppointments(allAppointments);
    setBlockedSlots(getBlockedSlots());
  };

  useEffect(() => {
    let filtered = appointments;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.patientPhone.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === filterStatus);
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return dateB - dateA;
    });

    setFilteredAppointments(filtered);
  }, [searchTerm, filterStatus, appointments]);

  const handleMenuClick = (event, appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };

  // Cerrar solo el menú sin borrar selectedAppointment (para cuando se abre un diálogo)
  const closeMenuOnly = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    try {
      if (selectedAppointment) {
        // Verificar que tenga email antes de abrir
        if (!selectedAppointment.patientEmail) {
          setSnackbar({
            open: true,
            message: 'Error: La cita no tiene email del paciente',
            severity: 'error',
          });
          closeMenuOnly();
          return;
        }
        
        const records = getPatientRecords(selectedAppointment.patientEmail);
        setPatientRecords(records);
        // Abrir el nuevo diálogo de perfil
        setPatientProfileDialogOpen(true);
        closeMenuOnly();
      }
    } catch (error) {
      console.error('[CitasPage] Error in handleViewDetails:', error);
      setSnackbar({
        open: true,
        message: 'Error al abrir el perfil del paciente',
        severity: 'error',
      });
      closeMenuOnly();
    }
  };

  const handleCancelAppointment = () => {
    setCancelDialogOpen(true);
    closeMenuOnly();
  };

  const handleUpdateStatus = (newStatus) => {
    if (selectedAppointment) {
      if (newStatus === 'completed') {
        // Abrir dialog de consulta
        setConsultationDialogOpen(true);
        closeMenuOnly();
      } else if (newStatus === 'no-show') {
        // Abrir dialog de no asistida
        setNoShowDialogOpen(true);
        closeMenuOnly();
      } else if (newStatus === 'patient') {
        // Marcar como paciente directamente
        const result = updateAppointmentStatus(selectedAppointment.id, newStatus);
        if (result.success) {
          // Registrar como paciente en los registros
          addPatientRecord(selectedAppointment.patientEmail, {
            type: 'note',
            title: 'Convertido a Paciente',
            description: 'Paciente marcado como paciente después de consulta',
            appointmentId: selectedAppointment.id,
          });
          
          // Registrar en interacciones
          recordAppointmentInteraction(selectedAppointment.patientEmail, {
            title: 'Convertido a Paciente',
            description: `Paciente marcado como paciente después de la cita del ${selectedAppointment.date} a las ${selectedAppointment.time}.`,
            scheduledDate: selectedAppointment.date,
            scheduledTime: selectedAppointment.time,
            relatedAppointmentId: selectedAppointment.id,
            status: 'completed',
            action: 'patient',
          });
          
          loadData();
          handleMenuClose();
          showSnackbar('Paciente marcado exitosamente. Ahora aparece en la sección de Pacientes.', 'success');
        }
      } else {
        const result = updateAppointmentStatus(selectedAppointment.id, newStatus);
        if (result.success) {
          // Registrar cambio de estado en interacciones
          recordAppointmentInteraction(selectedAppointment.patientEmail, {
            title: `Estado de Cita Actualizado: ${newStatus}`,
            description: `Estado de la cita del ${selectedAppointment.date} a las ${selectedAppointment.time} actualizado a ${newStatus}.`,
            scheduledDate: selectedAppointment.date,
            scheduledTime: selectedAppointment.time,
            relatedAppointmentId: selectedAppointment.id,
            status: newStatus,
            action: newStatus,
          });
          
          loadData();
          handleMenuClose();
          showSnackbar('Estado actualizado exitosamente', 'success');
        }
      }
    }
  };

  const handleSaveConsultation = () => {
    if (selectedAppointment) {
      // Actualizar estado a completado primero
      const statusResult = updateAppointmentStatus(selectedAppointment.id, 'completed');
      if (statusResult.success) {
        // Inmediatamente cambiar a estado 'patient' para que aparezca en Pacientes
        const patientResult = updateAppointmentStatus(selectedAppointment.id, 'patient');
        
        // Registrar consulta
        const recordResult = recordConsultation(
          selectedAppointment.patientEmail,
          selectedAppointment.id,
          consultationData
        );
        
        // Inicializar perfil de paciente si no existe
        try {
          const { initializePatientProfile } = require('../../services/patientProfileService');
          initializePatientProfile({
            nombre: selectedAppointment.patientName,
            email: selectedAppointment.patientEmail,
            telefono: selectedAppointment.patientPhone,
            procedencia: selectedAppointment.procedencia || 'visita-medica',
            reason: selectedAppointment.reason || 'Consulta General',
            notas: consultationData.notes || '',
          });
        } catch (error) {
          console.error('[CitasPage] Error al inicializar perfil:', error);
        }
        
        // Registrar en interacciones
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita Asistida - Convertido a Paciente',
          description: `Cita asistida el ${selectedAppointment.date} a las ${selectedAppointment.time}. ${consultationData.notes ? `Notas: ${consultationData.notes}` : ''} El paciente ahora aparece en la sección de Pacientes.`,
          scheduledDate: selectedAppointment.date,
          scheduledTime: selectedAppointment.time,
          relatedAppointmentId: selectedAppointment.id,
          status: 'completed',
          action: 'patient',
          metadata: {
            hearingLoss: consultationData.hearingLoss,
            nextSteps: consultationData.nextSteps,
            notes: consultationData.notes,
          },
        });
        
        if (recordResult.success) {
          loadData();
          setConsultationDialogOpen(false);
          setConsultationData({ notes: '', hearingLoss: false, nextSteps: '' });
          setSelectedAppointment(null);
          showSnackbar('Consulta registrada exitosamente. El paciente ahora aparece en la sección de Pacientes.', 'success');
        }
      }
    }
  };

  const handleNoShowRecontact = () => {
    if (selectedAppointment) {
      // Actualizar estado a no-show
      const statusResult = updateAppointmentStatus(selectedAppointment.id, 'no-show');
      if (statusResult.success) {
        // Registrar en interacciones
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita No Asistida',
          description: `Paciente no asistió a la cita del ${selectedAppointment.date} a las ${selectedAppointment.time}. Se contactó para re-agendar.`,
          scheduledDate: selectedAppointment.date,
          scheduledTime: selectedAppointment.time,
          relatedAppointmentId: selectedAppointment.id,
          status: 'missed',
          action: 'no-show',
        });
        
        // Registrar contacto
        addPatientRecord(selectedAppointment.patientEmail, {
          type: 'contact',
          title: 'Re-contacto - No Asistió',
          description: 'Paciente no asistió a la cita, se contactó para re-agendar',
          appointmentId: selectedAppointment.id,
        });
        
        loadData();
        setNoShowDialogOpen(false);
        showSnackbar('Estado actualizado. Puedes re-agendar desde el menú de acciones.', 'success');
      }
    }
  };

  const handleNoShowReschedule = (newDate, newTime) => {
    if (selectedAppointment) {
      // Actualizar estado a no-show primero
      updateAppointmentStatus(selectedAppointment.id, 'no-show');
      
      // Re-agendar
      const rescheduleResult = rescheduleAppointment(selectedAppointment.id, newDate, newTime);
      if (rescheduleResult.success) {
        // Registrar re-agendamiento
        recordReschedule(
          selectedAppointment.patientEmail,
          selectedAppointment.id,
          rescheduleResult.newAppointment.id,
          selectedAppointment.date,
          selectedAppointment.time,
          newDate,
          newTime
        );
        
        // Registrar en interacciones - No asistencia
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita No Asistida y Re-agendada',
          description: `Paciente no asistió a la cita del ${selectedAppointment.date} a las ${selectedAppointment.time}. Se contactó y re-agendó para ${newDate} a las ${newTime}.`,
          scheduledDate: selectedAppointment.date,
          scheduledTime: selectedAppointment.time,
          relatedAppointmentId: selectedAppointment.id,
          status: 'missed',
          action: 'no-show',
          metadata: {
            oldDate: selectedAppointment.date,
            oldTime: selectedAppointment.time,
            newDate: newDate,
            newTime: newTime,
          },
        });
        
        // Registrar en interacciones - Nueva cita
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita Re-agendada',
          description: `Cita re-agendada desde ${selectedAppointment.date} ${selectedAppointment.time} a ${newDate} ${newTime} después de no asistencia.`,
          scheduledDate: newDate,
          scheduledTime: newTime,
          relatedAppointmentId: rescheduleResult.newAppointment.id,
          status: 'scheduled',
          action: 'rescheduled',
          metadata: {
            oldDate: selectedAppointment.date,
            oldTime: selectedAppointment.time,
            reason: 'No asistencia - Re-agendamiento',
          },
        });
        
        // Registrar contacto
        addPatientRecord(selectedAppointment.patientEmail, {
          type: 'contact',
          title: 'Re-contacto y Re-agendamiento',
          description: `Paciente no asistió, se contactó y re-agendó para ${newDate} ${newTime}`,
          appointmentId: selectedAppointment.id,
        });
        
        loadData();
        setNoShowDialogOpen(false);
        showSnackbar('Cita re-agendada exitosamente', 'success');
      } else {
        showSnackbar(rescheduleResult.error || 'Error al re-agendar', 'error');
      }
    }
  };

  const handleCancelWithReason = () => {
    if (selectedAppointment && cancellationReason.trim()) {
      const cancelResult = cancelAppointment(selectedAppointment.id);
      if (cancelResult.success) {
        // Registrar cancelación con motivo
        recordCancellation(selectedAppointment.patientEmail, selectedAppointment.id, cancellationReason);
        
        // Registrar en interacciones
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita Cancelada',
          description: `Cita cancelada del ${selectedAppointment.date} a las ${selectedAppointment.time}. Motivo: ${cancellationReason}`,
          scheduledDate: selectedAppointment.date,
          scheduledTime: selectedAppointment.time,
          relatedAppointmentId: selectedAppointment.id,
          status: 'cancelled',
          action: 'cancelled',
          metadata: {
            reason: cancellationReason,
          },
        });
        
        loadData();
        setCancelDialogOpen(false);
        setCancellationReason('');
        setRescheduleData({ date: '', time: '' });
        setSelectedAppointment(null);
        showSnackbar('Cita cancelada exitosamente', 'success');
      }
    } else {
      showSnackbar('Por favor ingresa el motivo de cancelación', 'error');
    }
  };

  const handleReschedule = () => {
    if (selectedAppointment && rescheduleData.date && rescheduleData.time) {
      const rescheduleResult = rescheduleAppointment(
        selectedAppointment.id,
        rescheduleData.date,
        rescheduleData.time
      );
      if (rescheduleResult.success) {
        // Registrar re-agendamiento
        recordReschedule(
          selectedAppointment.patientEmail,
          selectedAppointment.id,
          rescheduleResult.newAppointment.id,
          selectedAppointment.date,
          selectedAppointment.time,
          rescheduleData.date,
          rescheduleData.time
        );
        
        // Registrar en interacciones - Cita original re-agendada
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Cita Re-agendada',
          description: `Cita re-agendada desde ${selectedAppointment.date} ${selectedAppointment.time} a ${rescheduleData.date} ${rescheduleData.time}.`,
          scheduledDate: selectedAppointment.date,
          scheduledTime: selectedAppointment.time,
          relatedAppointmentId: selectedAppointment.id,
          status: 'rescheduled',
          action: 'rescheduled',
          metadata: {
            oldDate: selectedAppointment.date,
            oldTime: selectedAppointment.time,
            newDate: rescheduleData.date,
            newTime: rescheduleData.time,
          },
        });
        
        // Registrar en interacciones - Nueva cita
        recordAppointmentInteraction(selectedAppointment.patientEmail, {
          title: 'Nueva Cita Agendada',
          description: `Nueva cita agendada para ${rescheduleData.date} a las ${rescheduleData.time} (re-agendamiento).`,
          scheduledDate: rescheduleData.date,
          scheduledTime: rescheduleData.time,
          relatedAppointmentId: rescheduleResult.newAppointment.id,
          status: 'scheduled',
          action: 'created',
        });
        loadData();
        setRescheduleDialogOpen(false);
        setRescheduleData({ date: '', time: '' });
        setSelectedAppointment(null);
        showSnackbar('Cita re-agendada exitosamente', 'success');
      } else {
        showSnackbar(rescheduleResult.error || 'Error al re-agendar', 'error');
      }
    } else {
      showSnackbar('Por favor selecciona fecha y hora', 'error');
    }
  };


  const handleAddComment = () => {
    if (selectedAppointment && newComment.title.trim()) {
      const result = addPatientRecord(selectedAppointment.patientEmail, {
        type: newComment.type,
        title: newComment.title,
        description: newComment.description,
        appointmentId: selectedAppointment.id,
      });
      if (result.success) {
        const records = getPatientRecords(selectedAppointment.patientEmail);
        setPatientRecords(records);
        setNewComment({ title: '', description: '', type: 'note' });
        setAddCommentDialogOpen(false);
        showSnackbar('Comentario agregado exitosamente', 'success');
      }
    } else {
      showSnackbar('Por favor ingresa un título', 'error');
    }
  };


  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone) => {
    window.location.href = `sms:${phone}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleBlockSlot = () => {
    if (!selectedDateForBlock) {
      showSnackbar('Por favor selecciona una fecha', 'error');
      return;
    }

    const dateStr = selectedDateForBlock.toISOString().split('T')[0];
    const result = blockTimeSlot(dateStr, blockAllDay ? null : selectedTimeForBlock);
    
    if (result.success) {
      loadData();
      setBlockDialogOpen(false);
      setSelectedDateForBlock(null);
      setSelectedTimeForBlock(null);
      setBlockAllDay(false);
      showSnackbar('Horario bloqueado exitosamente', 'success');
    } else {
      showSnackbar(result.error || 'Error al bloquear el horario', 'error');
    }
  };

  const handleUnblockSlot = (blockId) => {
    const result = unblockTimeSlot(blockId);
    if (result.success) {
      loadData();
      showSnackbar('Horario desbloqueado exitosamente', 'success');
    } else {
      showSnackbar(result.error || 'Error al desbloquear el horario', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <Chip
            icon={<Schedule />}
            label="Agendada"
            size="small"
            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
          />
        );
      case 'completed':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Asistida"
            size="small"
            sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }}
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
      case 'rescheduled':
        return (
          <Chip
            icon={<Refresh />}
            label="Re-agendada"
            size="small"
            sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600 }}
          />
        );
      case 'patient':
        return (
          <Chip
            icon={<Person />}
            label="Paciente"
            size="small"
            sx={{ bgcolor: '#e1f5fe', color: '#0277bd', fontWeight: 600 }}
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

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Métricas: lógica unificada para que Total = Agendadas + Asistidas + No Asistidas + Canceladas.
  // Agendadas incluye confirmed y rescheduled; Asistidas incluye completed y patient.
  const agendadasCount = appointments.filter((a) => a.status === 'confirmed' || a.status === 'rescheduled').length;
  const asistidasCount = appointments.filter((a) => a.status === 'completed' || a.status === 'patient').length;
  const noAsistidasCount = appointments.filter((a) => a.status === 'no-show').length;
  const canceladasCount = appointments.filter((a) => a.status === 'cancelled').length;
  const totalCount = agendadasCount + asistidasCount + noAsistidasCount + canceladasCount;

  // Obtener citas del día seleccionado en el calendario
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  // Obtener horarios bloqueados del día
  const getBlockedSlotsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedSlots.filter(block => block.date === dateStr);
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
                Gestión de Citas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Administra todas las citas agendadas
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
        {/* Métricas de Citas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                {agendadasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                Agendadas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
                {asistidasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                Asistidas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#e65100', mb: 0.5 }}>
                {noAsistidasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                No Asistidas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828', mb: 0.5 }}>
                {canceladasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
                Canceladas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#272F50', mb: 0.5 }}>
                {totalCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', fontWeight: 500 }}>
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
            <Tab icon={<List />} iconPosition="start" label="Lista de Citas" value="list" />
            <Tab icon={<CalendarToday />} iconPosition="start" label="Calendario" value="calendar" />
          </Tabs>
        </Card>

        {/* Filtros y Búsqueda */}
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
                  placeholder="Buscar por nombre, email o teléfono..."
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
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { value: 'all', label: 'Todas' },
                    { value: 'confirmed', label: 'Agendadas' },
                    { value: 'completed', label: 'Asistidas' },
                    { value: 'no-show', label: 'No Asistidas' },
                    { value: 'cancelled', label: 'Canceladas' },
                    { value: 'rescheduled', label: 'Re-agendadas' },
                    { value: 'patient', label: 'Pacientes' },
                  ].map((status) => (
                    <Chip
                      key={status.value}
                      label={status.label}
                      onClick={() => setFilterStatus(status.value)}
                      sx={{
                        bgcolor: filterStatus === status.value ? '#085946' : 'transparent',
                        color: filterStatus === status.value ? '#ffffff' : '#272F50',
                        border: '1px solid',
                        borderColor: filterStatus === status.value ? '#085946' : '#e0e0e0',
                        fontWeight: filterStatus === status.value ? 600 : 500,
                        '&:hover': {
                          bgcolor: filterStatus === status.value ? '#085946' : '#f5f5f5',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Contenido según vista */}
        {viewMode === 'list' ? (
          /* Tabla de Citas */
          <Card
            sx={{
              border: '1px solid rgba(8, 89, 70, 0.1)',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {filteredAppointments.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Paciente</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Hora</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Procedencia</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Estado</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Historial</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="center">
                          Acciones de Contacto
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="right">
                          Más
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id} hover>
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
                                {appointment.patientName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {appointment.patientName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#86899C' }}>
                                  {appointment.patientEmail}
                                </Typography>
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
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatTime(appointment.time)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Source sx={{ fontSize: 14, color: '#085946' }} />
                              <Typography variant="caption" sx={{ color: '#272F50', fontWeight: 500 }}>
                                {formatProcedencia(appointment.procedencia)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{getStatusChip(appointment.status)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {appointment.status === 'completed' || appointment.status === 'patient' ? (
                                <Chip
                                  label="Asistió"
                                  size="small"
                                  sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600, width: 'fit-content' }}
                                />
                              ) : appointment.status === 'no-show' ? (
                                <Chip
                                  label="No Asistió"
                                  size="small"
                                  sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600, width: 'fit-content' }}
                                />
                              ) : appointment.status === 'rescheduled' ? (
                                <Chip
                                  label="Re-agendó"
                                  size="small"
                                  sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 600, width: 'fit-content' }}
                                />
                              ) : appointment.status === 'cancelled' ? (
                                <Chip
                                  label="Canceló"
                                  size="small"
                                  sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600, width: 'fit-content' }}
                                />
                              ) : null}
                              {appointment.rescheduledToId && (
                                <Typography variant="caption" sx={{ color: '#86899C', fontStyle: 'italic' }}>
                                  Re-agendada
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Llamar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCall(appointment.patientPhone)}
                                  sx={{ color: '#085946' }}
                                >
                                  <Phone fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Enviar SMS">
                                <IconButton
                                  size="small"
                                  onClick={() => handleSMS(appointment.patientPhone)}
                                  sx={{ color: '#0a6b56' }}
                                >
                                  <SmsIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Enviar Email">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEmail(appointment.patientEmail)}
                                  sx={{ color: '#272F50' }}
                                >
                                  <Email fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="WhatsApp">
                                <IconButton
                                  size="small"
                                  onClick={() => handleWhatsApp(appointment.patientPhone)}
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
                              onClick={(e) => handleMenuClick(e, appointment)}
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
                  <CalendarToday sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ color: '#272F50', mb: 1 }}>
                    No se encontraron citas
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86899C' }}>
                    {searchTerm || filterStatus !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay citas registradas aún'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Vista de Calendario */
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card
                sx={{
                  border: '1px solid rgba(8, 89, 70, 0.1)',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50' }}>
                      Calendario de Citas
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Block />}
                      onClick={() => {
                        setSelectedDateForBlock(new Date());
                        setBlockDialogOpen(true);
                      }}
                      sx={{
                        bgcolor: '#085946',
                        '&:hover': { bgcolor: '#0a6b56' },
                      }}
                    >
                      Bloquear Horario
                    </Button>
                  </Box>
                  <DateSelector
                    selectedDate={calendarDate.toISOString().split('T')[0]}
                    onDateSelect={(date) => setCalendarDate(new Date(date + 'T00:00:00'))}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  border: '1px solid rgba(8, 89, 70, 0.1)',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>
                    Citas del Día
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {getAppointmentsForDate(calendarDate).length > 0 ? (
                      getAppointmentsForDate(calendarDate).map((apt) => (
                        <Box
                          key={apt.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 2,
                            border: '1px solid rgba(8, 89, 70, 0.1)',
                            bgcolor: '#f8fafc',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {formatTime(apt.time)} - {apt.patientName}
                          </Typography>
                          {getStatusChip(apt.status)}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86899C', textAlign: 'center', py: 4 }}>
                        No hay citas para este día
                      </Typography>
                    )}
                  </Box>
                  {getBlockedSlotsForDate(calendarDate).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#272F50', mb: 1 }}>
                        Horarios Bloqueados
                      </Typography>
                      {getBlockedSlotsForDate(calendarDate).map((block) => (
                        <Box
                          key={block.id}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 2,
                            border: '1px solid #ff9800',
                            bgcolor: '#fff3e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {block.time ? formatTime(block.time) : 'Día completo bloqueado'}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUnblockSlot(block.id)}
                            sx={{ color: '#ff9800' }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={2.4}>
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
                {agendadasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Agendadas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
                {asistidasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Asistidas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
                {noAsistidasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                No Asistidas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
              <Typography variant="h4" sx={{ color: '#c62828', fontWeight: 700 }}>
                {canceladasCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Canceladas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
                {totalCount}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                Total
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* 1. Ver Perfil */}
        <MenuItem onClick={handleViewDetails}>
          <Person sx={{ mr: 1, fontSize: 20 }} /> Ver Perfil
        </MenuItem>
        
        {/* 2. Marcar Asistencia */}
        <MenuItem onClick={() => handleUpdateStatus('completed')}>
          <CheckCircle sx={{ mr: 1, fontSize: 20, color: '#085946' }} /> Marcar Asistencia
        </MenuItem>
        
        {/* 3. Marcar No Asistencia */}
        <MenuItem onClick={() => handleUpdateStatus('no-show')}>
          <EventBusy sx={{ mr: 1, fontSize: 20, color: '#e65100' }} /> Marcar No Asistencia
        </MenuItem>
        
        {/* 4. Re-agendar Cita */}
        <MenuItem onClick={() => {
          setRescheduleDialogOpen(true);
          closeMenuOnly();
        }}>
          <Refresh sx={{ mr: 1, fontSize: 20, color: '#7b1fa2' }} /> Re-agendar Cita
        </MenuItem>
        
        {/* 5. Cancelar Cita */}
        <MenuItem onClick={() => {
          setCancelDialogOpen(true);
          closeMenuOnly();
        }}>
          <Cancel sx={{ mr: 1, fontSize: 20, color: '#c62828' }} /> Cancelar Cita
        </MenuItem>
        
      </Menu>

      {/* Dialog de Detalles Mejorado - Estilo HubSpot */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setPatientRecords([]);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e0e0e0', p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50' }}>
              Detalle del Paciente
            </Typography>
            <Button
              onClick={() => {
                setDetailDialogOpen(false);
                setPatientRecords([]);
              }}
              variant="outlined"
              size="small"
            >
              Cerrar
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedAppointment && (
            <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
              {/* Columna Izquierda - Ficha de Datos (Estilo HubSpot) */}
              <Box sx={{ width: '35%', borderRight: '1px solid #e0e0e0', overflowY: 'auto', bgcolor: '#ffffff', p: 3 }}>
                {/* Header con Avatar y Nombre */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: '#085946',
                        fontSize: '2rem',
                        fontWeight: 700,
                      }}
                    >
                      {selectedAppointment.patientName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>
                          {selectedAppointment.patientName}
                        </Typography>
                        <IconButton size="small" sx={{ color: '#86899C' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
                        {selectedAppointment.patientEmail}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Botones de Acción Rápida */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Tooltip title="Agregar Nota">
                      <IconButton
                        onClick={() => {
                          setNewComment({ title: '', description: '', type: 'note' });
                          setAddCommentDialogOpen(true);
                        }}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <Note />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Enviar Email">
                      <IconButton
                        onClick={() => handleEmail(selectedAppointment.patientEmail)}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <Email />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Llamar">
                      <IconButton
                        onClick={() => handleCall(selectedAppointment.patientPhone)}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <Phone />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Registrar Contacto">
                      <IconButton
                        onClick={() => {
                          setNewComment({ title: '', description: '', type: 'contact' });
                          setAddCommentDialogOpen(true);
                        }}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Agregar Tarea">
                      <IconButton
                        onClick={() => {
                          setNewComment({ title: '', description: '', type: 'note' });
                          setAddCommentDialogOpen(true);
                        }}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <Assignment />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Agendar Cita">
                      <IconButton
                        onClick={() => {
                          setRescheduleDialogOpen(true);
                        }}
                        sx={{
                          bgcolor: '#f5f5f5',
                          color: '#272F50',
                          '&:hover': { bgcolor: '#e0e0e0' },
                        }}
                      >
                        <CalendarToday />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Sección: About this contact */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50', mb: 2 }}>
                    Información del Paciente
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Nombre
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedAppointment.patientName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedAppointment.patientEmail}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Teléfono
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedAppointment.patientPhone}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Estado de la Cita
                      </Typography>
                      {getStatusChip(selectedAppointment.status)}
                    </Box>
                    {selectedAppointment.procedencia && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                          Procedencia
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatProcedencia(selectedAppointment.procedencia)}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Último Contacto
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedAppointment.createdAt
                          ? new Date(selectedAppointment.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'No disponible'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                        Fecha de la Cita
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(selectedAppointment.date)} a las {formatTime(selectedAppointment.time)}
                      </Typography>
                    </Box>
                    {selectedAppointment.reason && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                          Motivo
                        </Typography>
                        <Typography variant="body2">{selectedAppointment.reason}</Typography>
                      </Box>
                    )}
                    {/* Mostrar re-agendamiento si existe */}
                    {selectedAppointment.rescheduledToId && (() => {
                      const newAppointment = getAppointmentById(selectedAppointment.rescheduledToId);
                      return newAppointment ? (
                        <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '1px solid #7b1fa2' }}>
                          <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5, fontWeight: 600 }}>
                            Re-agendada para:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
                            {formatDate(newAppointment.date)} a las {formatTime(newAppointment.time)}
                          </Typography>
                        </Box>
                      ) : null;
                    })()}
                  </Box>
                </Box>
              </Box>

              {/* Columna Derecha - Línea de Tiempo con Tabs */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f8fafc' }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                  <Tabs
                    value={activityTab}
                    onChange={(e, newValue) => setActivityTab(newValue)}
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        minHeight: 48,
                      },
                    }}
                  >
                    <Tab label="Activity" />
                    <Tab label="Notas" />
                    <Tab label="Emails" />
                    <Tab label="Llamadas" />
                  </Tabs>
                </Box>

                {/* Contenido de Tabs */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                  {activityTab === 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          Filtrar actividad ({patientRecords.length})
                        </Typography>
                      </Box>
                      {patientRecords.length > 0 ? (
                        <Box>
                          {patientRecords.map((record, index) => {
                            const recordColor =
                              record.type === 'consultation'
                                ? '#085946'
                                : record.type === 'cancellation'
                                ? '#c62828'
                                : record.type === 'reschedule'
                                ? '#7b1fa2'
                                : record.type === 'contact'
                                ? '#1976d2'
                                : '#86899C';
                            return (
                              <Box key={record.id} sx={{ mb: 3, position: 'relative' }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  {/* Línea vertical y punto */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                    <Box
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: recordColor,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1,
                                      }}
                                    >
                                      {record.type === 'consultation' ? (
                                        <Hearing sx={{ fontSize: 16 }} />
                                      ) : record.type === 'contact' ? (
                                        <Phone sx={{ fontSize: 16 }} />
                                      ) : record.type === 'reschedule' ? (
                                        <Refresh sx={{ fontSize: 16 }} />
                                      ) : (
                                        <Note sx={{ fontSize: 16 }} />
                                      )}
                                    </Box>
                                    {index < patientRecords.length - 1 && (
                                      <Box
                                        sx={{
                                          width: 2,
                                          flex: 1,
                                          bgcolor: '#e0e0e0',
                                          mt: 1,
                                          minHeight: 40,
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {/* Contenido */}
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {record.title}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#86899C' }}>
                                        {new Date(record.createdAt).toLocaleDateString('es-ES', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}{' '}
                                        {new Date(record.createdAt).toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </Typography>
                                    </Box>
                                    <Paper elevation={0} sx={{ bgcolor: '#ffffff', border: '1px solid #e0e0e0', p: 2 }}>
                                      <Typography variant="body2" sx={{ color: '#272F50', mb: 1 }}>
                                        {record.description}
                                      </Typography>
                                      {record.type === 'consultation' && record.consultationNotes && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            Notas de Consulta:
                                          </Typography>
                                          <Typography variant="body2">{record.consultationNotes}</Typography>
                                          {record.hearingLoss && (
                                            <Chip
                                              label="Pérdida Auditiva Confirmada"
                                              size="small"
                                              sx={{ mt: 1, bgcolor: '#e8f5e9', color: '#085946' }}
                                            />
                                          )}
                                          {record.nextSteps && (
                                            <Box sx={{ mt: 1 }}>
                                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                                Próximos Pasos:
                                              </Typography>
                                              <Typography variant="body2">{record.nextSteps}</Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      )}
                                      {record.type === 'cancellation' && record.cancellationReason && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            Motivo:
                                          </Typography>
                                          <Typography variant="body2">{record.cancellationReason}</Typography>
                                        </Box>
                                      )}
                                      {record.type === 'reschedule' && record.newDate && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            Re-agendada:
                                          </Typography>
                                          <Typography variant="body2">
                                            De {record.oldDate} {record.oldTime} a {record.newDate} {record.newTime}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Paper>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Note sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                          <Typography variant="body2" sx={{ color: '#86899C' }}>
                            No hay registros de actividad aún
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  {activityTab === 1 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        Notas ({patientRecords.filter(r => r.type === 'note').length})
                      </Typography>
                      {patientRecords.filter(r => r.type === 'note').length > 0 ? (
                        <Box>
                          {patientRecords
                            .filter(r => r.type === 'note')
                            .map((record) => (
                              <Paper key={record.id} elevation={0} sx={{ bgcolor: '#ffffff', border: '1px solid #e0e0e0', p: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                  {record.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#272F50', mb: 1 }}>
                                  {record.description}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#86899C' }}>
                                  {new Date(record.createdAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </Paper>
                            ))}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <Note sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                          <Typography variant="body2" sx={{ color: '#86899C' }}>
                            No hay notas registradas
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  {activityTab === 2 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        Emails ({patientRecords.filter(r => r.type === 'contact' && r.title.toLowerCase().includes('email')).length})
                      </Typography>
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Email sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          No hay emails registrados
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {activityTab === 3 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        Llamadas ({patientRecords.filter(r => r.type === 'contact' && r.title.toLowerCase().includes('llamada')).length})
                      </Typography>
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Phone sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          No hay llamadas registradas
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Bloquear Horario */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => {
          setBlockDialogOpen(false);
          setSelectedDateForBlock(null);
          setSelectedTimeForBlock(null);
          setBlockAllDay(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Bloquear Horario
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Fecha
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={selectedDateForBlock ? selectedDateForBlock.toISOString().split('T')[0] : ''}
              onChange={(e) => setSelectedDateForBlock(new Date(e.target.value + 'T00:00:00'))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant={blockAllDay ? 'contained' : 'outlined'}
              onClick={() => {
                setBlockAllDay(!blockAllDay);
                if (!blockAllDay) setSelectedTimeForBlock(null);
              }}
              sx={{ mb: 2 }}
            >
              {blockAllDay ? 'Día Completo Bloqueado' : 'Bloquear Día Completo'}
            </Button>
            {!blockAllDay && (
              <TextField
                fullWidth
                type="time"
                label="Hora"
                value={selectedTimeForBlock || ''}
                onChange={(e) => setSelectedTimeForBlock(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setBlockDialogOpen(false);
              setSelectedDateForBlock(null);
              setSelectedTimeForBlock(null);
              setBlockAllDay(false);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={handleBlockSlot} variant="contained" sx={{ bgcolor: '#085946' }}>
            Bloquear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Consulta (Marcar como Asistida) */}
      <Dialog
        open={consultationDialogOpen}
        onClose={() => {
          setConsultationDialogOpen(false);
          setConsultationData({ notes: '', hearingLoss: false, nextSteps: '' });
          setSelectedAppointment(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Registrar Consulta
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAppointment ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Registrando consulta para {selectedAppointment.patientName} - {formatDate(selectedAppointment.date)} {formatTime(selectedAppointment.time)}
              </Alert>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Notas de la Consulta
                </Typography>
                <TextareaAutosize
                  minRows={4}
                  placeholder="Describe lo que sucedió en la consulta..."
                  value={consultationData.notes}
                  onChange={(e) => setConsultationData({ ...consultationData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                  }}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={consultationData.hearingLoss}
                      onChange={(e) => setConsultationData({ ...consultationData, hearingLoss: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Paciente tiene pérdida auditiva confirmada"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Próximos Pasos
                </Typography>
                <TextareaAutosize
                  minRows={2}
                  placeholder="Próximos pasos o recomendaciones..."
                  value={consultationData.nextSteps}
                  onChange={(e) => setConsultationData({ ...consultationData, nextSteps: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#86899C' }}>
                Cargando información de la cita...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setConsultationDialogOpen(false);
              setConsultationData({ notes: '', hearingLoss: false, nextSteps: '' });
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveConsultation} variant="contained" sx={{ bgcolor: '#085946' }}>
            Guardar Consulta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de No Asistencia - Directamente muestra calendario para reprogramar */}
      <Dialog
        open={noShowDialogOpen}
        onClose={() => {
          setNoShowDialogOpen(false);
          setRescheduleData({ date: '', time: '' });
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
            overflow: 'auto',
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#e65100', color: '#ffffff', fontWeight: 700 }}>
          Paciente No Asistió - Re-programar Cita
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
          {selectedAppointment ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                {selectedAppointment.patientName} no asistió a la cita del {formatDate(selectedAppointment.date)} {formatTime(selectedAppointment.time)}. Selecciona una nueva fecha y hora para reprogramar.
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
                      Selecciona Nueva Fecha
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <DateSelector
                        selectedDate={rescheduleData.date || ''}
                        onDateSelect={(date) => {
                          setRescheduleData({ ...rescheduleData, date, time: '' });
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
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ color: '#085946' }} />
                      Selecciona Nueva Hora
                    </Typography>
                    {rescheduleData.date ? (
                      <Box sx={{ width: '100%' }}>
                        <TimeSelector
                          selectedDate={rescheduleData.date}
                          selectedTime={rescheduleData.time}
                          onTimeSelect={(time) => {
                            setRescheduleData({ ...rescheduleData, time });
                          }}
                          availableTimes={getAvailableTimeSlots(rescheduleData.date)}
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
              </Grid>

              {rescheduleData.date && rescheduleData.time && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  Nueva cita programada para <strong>{new Date(rescheduleData.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong> a las <strong>{rescheduleData.time}</strong>
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#86899C' }}>
                Cargando información de la cita...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setNoShowDialogOpen(false);
              setRescheduleData({ date: '', time: '' });
              setSelectedAppointment(null);
            }} 
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (rescheduleData.date && rescheduleData.time) {
                handleNoShowReschedule(rescheduleData.date, rescheduleData.time);
              } else {
                showSnackbar('Por favor selecciona fecha y hora', 'error');
              }
            }} 
            variant="contained" 
            sx={{ bgcolor: '#085946' }}
            disabled={!rescheduleData.date || !rescheduleData.time}
          >
            Reprogramar Cita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cancelación - Con opción de reprogramar */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setCancellationReason('');
          setRescheduleData({ date: '', time: '' });
          setSelectedAppointment(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 700 }}>
          Cancelar Cita
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
          {selectedAppointment ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Cancelando cita de {selectedAppointment.patientName} - {formatDate(selectedAppointment.date)} {formatTime(selectedAppointment.time)}
              </Alert>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Motivo de Cancelación *
                </Typography>
                <TextareaAutosize
                  minRows={4}
                  placeholder="Ingresa el motivo de la cancelación..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                  }}
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                ¿Deseas reprogramar la cita ahora? (Opcional)
              </Typography>
              
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
                      Nueva Fecha (Opcional)
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <DateSelector
                        selectedDate={rescheduleData.date || ''}
                        onDateSelect={(date) => {
                          setRescheduleData({ ...rescheduleData, date, time: '' });
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
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ color: '#085946' }} />
                      Nueva Hora (Opcional)
                    </Typography>
                    {rescheduleData.date ? (
                      <Box sx={{ width: '100%' }}>
                        <TimeSelector
                          selectedDate={rescheduleData.date}
                          selectedTime={rescheduleData.time}
                          onTimeSelect={(time) => {
                            setRescheduleData({ ...rescheduleData, time });
                          }}
                          availableTimes={getAvailableTimeSlots(rescheduleData.date)}
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
              </Grid>

              {rescheduleData.date && rescheduleData.time && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Se creará una nueva cita para <strong>{new Date(rescheduleData.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong> a las <strong>{rescheduleData.time}</strong> después de cancelar la actual.
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#86899C' }}>
                Cargando información de la cita...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCancelDialogOpen(false);
              setCancellationReason('');
              setRescheduleData({ date: '', time: '' });
              setSelectedAppointment(null);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (!selectedAppointment) {
                showSnackbar('Error: No se encontró la cita seleccionada', 'error');
                return;
              }
              if (!cancellationReason.trim()) {
                showSnackbar('Por favor ingresa el motivo de cancelación', 'error');
                return;
              }
              
              // Cancelar la cita
              const cancelResult = cancelAppointment(selectedAppointment.id);
              if (cancelResult.success) {
                // Si se seleccionó fecha y hora, reprogramar
                if (rescheduleData.date && rescheduleData.time) {
                  // Crear nueva cita
                  const { createAppointment } = require('../../services/appointmentService');
                  const newAppointmentResult = createAppointment({
                    date: rescheduleData.date,
                    time: rescheduleData.time,
                    patientName: selectedAppointment.patientName,
                    patientEmail: selectedAppointment.patientEmail,
                    patientPhone: selectedAppointment.patientPhone,
                    reason: selectedAppointment.reason || 'Consulta General',
                    procedencia: selectedAppointment.procedencia || 'visita-medica',
                  });
                  
                  if (newAppointmentResult.success) {
                    // Registrar re-agendamiento
                    recordReschedule(
                      selectedAppointment.patientEmail,
                      selectedAppointment.id,
                      newAppointmentResult.appointment.id,
                      selectedAppointment.date,
                      selectedAppointment.time,
                      rescheduleData.date,
                      rescheduleData.time
                    );
                    
                    // Registrar en interacciones
                    recordAppointmentInteraction(selectedAppointment.patientEmail, {
                      title: 'Cita Cancelada y Re-agendada',
                      description: `Cita cancelada del ${selectedAppointment.date} ${selectedAppointment.time}. Motivo: ${cancellationReason}. Nueva cita agendada para ${rescheduleData.date} ${rescheduleData.time}.`,
                      scheduledDate: selectedAppointment.date,
                      scheduledTime: selectedAppointment.time,
                      relatedAppointmentId: selectedAppointment.id,
                      status: 'cancelled',
                      action: 'cancelled',
                      metadata: {
                        reason: cancellationReason,
                        newDate: rescheduleData.date,
                        newTime: rescheduleData.time,
                      },
                    });
                    
                    recordAppointmentInteraction(selectedAppointment.patientEmail, {
                      title: 'Nueva Cita Agendada (Después de Cancelación)',
                      description: `Nueva cita agendada para ${rescheduleData.date} a las ${rescheduleData.time} después de cancelar la cita anterior.`,
                      scheduledDate: rescheduleData.date,
                      scheduledTime: rescheduleData.time,
                      relatedAppointmentId: newAppointmentResult.appointment.id,
                      status: 'scheduled',
                      action: 'created',
                    });
                    
                    showSnackbar('Cita cancelada y re-agendada exitosamente', 'success');
                  } else {
                    showSnackbar('Cita cancelada, pero error al re-agendar: ' + newAppointmentResult.error, 'warning');
                  }
                } else {
                  // Solo cancelar sin reprogramar
                  recordCancellation(selectedAppointment.patientEmail, selectedAppointment.id, cancellationReason);
                  
                  // Registrar en interacciones
                  recordAppointmentInteraction(selectedAppointment.patientEmail, {
                    title: 'Cita Cancelada',
                    description: `Cita cancelada del ${selectedAppointment.date} a las ${selectedAppointment.time}. Motivo: ${cancellationReason}`,
                    scheduledDate: selectedAppointment.date,
                    scheduledTime: selectedAppointment.time,
                    relatedAppointmentId: selectedAppointment.id,
                    status: 'cancelled',
                    action: 'cancelled',
                    metadata: {
                      reason: cancellationReason,
                    },
                  });
                  
                  showSnackbar('Cita cancelada exitosamente. Puedes re-agendar desde el menú de acciones.', 'success');
                }
                
                loadData();
                setCancelDialogOpen(false);
                setCancellationReason('');
                setRescheduleData({ date: '', time: '' });
                setSelectedAppointment(null);
              } else {
                showSnackbar('Error al cancelar la cita', 'error');
              }
            }} 
            variant="contained" 
            sx={{ bgcolor: '#c62828' }}
          >
            {rescheduleData.date && rescheduleData.time ? 'Cancelar y Re-agendar' : 'Confirmar Cancelación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Re-agendamiento */}
      <Dialog
        open={rescheduleDialogOpen}
        onClose={() => {
          setRescheduleDialogOpen(false);
          setRescheduleData({ date: '', time: '' });
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '95vh',
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: '#7b1fa2', color: '#ffffff', fontWeight: 700 }}>
          Re-agendar Cita
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
          {selectedAppointment ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Re-agendando cita de <strong>{selectedAppointment.patientName}</strong>
                <br />
                Cita actual: {formatDate(selectedAppointment.date)} {formatTime(selectedAppointment.time)}
              </Alert>
              
              <Grid container spacing={3}>
                {/* Calendario - Mismo estilo que en AgendamientoPage */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderRadius: 3,
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(8, 89, 70, 0.1)',
                      boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ color: '#085946' }} />
                      Selecciona Nueva Fecha
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                      <DateSelector
                        selectedDate={rescheduleData.date || ''}
                        onDateSelect={(date) => {
                          setRescheduleData({ ...rescheduleData, date, time: '' });
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
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ color: '#085946' }} />
                      Selecciona Nueva Hora
                    </Typography>
                    {rescheduleData.date ? (
                      <Box sx={{ width: '100%' }}>
                        <TimeSelector
                          selectedDate={rescheduleData.date}
                          selectedTime={rescheduleData.time}
                          onTimeSelect={(time) => {
                            setRescheduleData({ ...rescheduleData, time });
                          }}
                          availableTimes={getAvailableTimeSlots(rescheduleData.date)}
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
              </Grid>

              {rescheduleData.date && rescheduleData.time && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  Se creará una nueva cita para <strong>{formatDate(rescheduleData.date)} {formatTime(rescheduleData.time)}</strong> y la anterior quedará marcada como "Re-agendada"
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#86899C' }}>
                Cargando información de la cita...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRescheduleDialogOpen(false);
              setRescheduleData({ date: '', time: '' });
              setSelectedAppointment(null);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReschedule} 
            variant="contained" 
            sx={{ bgcolor: '#7b1fa2' }}
            disabled={!rescheduleData.date || !rescheduleData.time || !selectedAppointment}
          >
            Re-agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Perfil del Paciente */}
      <PatientProfileDialog
        open={patientProfileDialogOpen}
        onClose={() => setPatientProfileDialogOpen(false)}
        appointment={selectedAppointment}
        readOnly={true}
      />


      {/* Dialog de Agregar Comentario */}
      <Dialog
        open={addCommentDialogOpen}
        onClose={() => {
          setAddCommentDialogOpen(false);
          setNewComment({ title: '', description: '', type: 'note' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Agregar Comentario o Contacto
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAppointment && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={newComment.type}
                    label="Tipo"
                    onChange={(e) => setNewComment({ ...newComment, type: e.target.value })}
                  >
                    <SelectMenuItem value="note">Nota</SelectMenuItem>
                    <SelectMenuItem value="contact">Contacto</SelectMenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Título *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ej: Llamada telefónica, Email enviado, etc."
                  value={newComment.title}
                  onChange={(e) => setNewComment({ ...newComment, title: e.target.value })}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Descripción
                </Typography>
                <TextareaAutosize
                  minRows={4}
                  placeholder="Detalles del contacto o comentario..."
                  value={newComment.description}
                  onChange={(e) => setNewComment({ ...newComment, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddCommentDialogOpen(false);
              setNewComment({ title: '', description: '', type: 'note' });
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button onClick={handleAddComment} variant="contained" sx={{ bgcolor: '#085946' }}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
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

export default CitasPage;
