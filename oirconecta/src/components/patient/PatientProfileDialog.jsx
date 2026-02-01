import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Checkbox,
  TextareaAutosize,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Edit,
  Save,
  Close,
  ExpandMore,
  Hearing,
  LocalHospital,
  FamilyRestroom,
  Work,
  School,
  Favorite,
  Note,
  History,
  ShoppingCart,
  Build,
  Call,
  Message,
  Mail,
  Notifications,
  AttachMoney,
  CheckCircle,
  Schedule,
  CameraAlt,
  PhotoCamera,
  Draw,
  DeleteOutline,
  Cancel,
  Assessment,
  Visibility,
  FileDownload,
  Print,
  PictureAsPdf,
  ArrowDropDown,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { getPatientProfile, savePatientProfile, initializePatientProfile } from '../../services/patientProfileService';
import { getAllAppointments } from '../../services/appointmentService';
import { formatProcedencia } from '../../utils/procedenciaUtils';
import { getPatientInteractions } from '../../services/interactionService';
import { getPatientProducts, convertQuoteToSale, getQuoteHistory } from '../../services/productService';
import { getPatientMaintenances, getUpcomingMaintenances } from '../../services/maintenanceService';
import QuoteDialog from './QuoteDialog';
import SaleDialog from './SaleDialog';
import { getClinicalHistoryForm } from './clinicalHistory';
import DateSelector from '../appointments/DateSelector';
import TimeSelector from '../appointments/TimeSelector';
import { getAvailableTimeSlots, createAppointment, updateAppointmentStatus } from '../../services/appointmentService';
import { getPatientRecords, recordConsultation } from '../../services/patientRecordService';
import { recordReminder } from '../../services/interactionService';

const PatientProfileDialog = ({ open, onClose, appointment, lead, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [appointmentsSubTab, setAppointmentsSubTab] = useState(0); // 0: Historial, 1: Agendar Cita, 2: Nueva Cita
  const [isEditing, setIsEditing] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientConsultations, setPatientConsultations] = useState([]);
  const [patientInteractions, setPatientInteractions] = useState([]);
  const [patientProducts, setPatientProducts] = useState([]);
  const [patientMaintenances, setPatientMaintenances] = useState([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState([]);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [viewProductDialog, setViewProductDialog] = useState({ open: false, product: null, type: null });
  const [quoteHistoryDialog, setQuoteHistoryDialog] = useState({ open: false, quoteId: null, history: [], quote: null });
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editQuoteData, setEditQuoteData] = useState(null);
  const [printMenuAnchor, setPrintMenuAnchor] = useState(null);
  const printContentRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estados para agendamiento desde perfil
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Foto del paciente: cámara activa y refs
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  // Tablet de firma - consentimientos informados (paciente firma una vez; admin asigna a qué consentimientos)
  const signatureCanvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = React.useRef(null);
  const [consentimientosSeleccionadosParaAsignar, setConsentimientosSeleccionadosParaAsignar] = useState([]); // array de tipos seleccionados
  const [otroTipoConsentimiento, setOtroTipoConsentimiento] = useState('');

  // Nueva Cita: diálogo Evolucionar (notas, pérdida auditiva, próximos pasos)
  const [evolucionarDialogOpen, setEvolucionarDialogOpen] = useState(false);
  const [evolucionarAppointment, setEvolucionarAppointment] = useState(null);
  const [evolucionarData, setEvolucionarData] = useState({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
  // Solo para cita primera vez: 'asistencia' (Asistió/No asistió) → 'form' (historia clínica completa)
  const [evolucionarPrimeraVezStep, setEvolucionarPrimeraVezStep] = useState('asistencia');

  // Historial de consultas: diálogo para ver detalle de una consulta (qué sucedió)
  const [histConsultaDetalleOpen, setHistConsultaDetalleOpen] = useState(false);
  const [histConsultaSeleccionada, setHistConsultaSeleccionada] = useState(null); // { consultation, appointment }

  // Menú Exportar historia clínica (PDF / Excel)
  const [anchorElExportarHC, setAnchorElExportarHC] = useState(null);

  // Apertura de historia clínica y contador de minutos
  const [historiaAbiertaAt, setHistoriaAbiertaAt] = useState(null);
  const [minutosTranscurridos, setMinutosTranscurridos] = useState(0);

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Datos demográficos
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    fechaNacimiento: '',
    genero: '',
    documentoIdentidad: {
      tipo: '',           // Cédula de ciudadanía | Pasaporte | Registro civil | Otro
      numero: '',
      lugarExpedicion: '',
      fechaExpedicion: '',
    },
    fotoPaciente: '', // base64 de la foto
    // Contacto de emergencia: 2 personas
    contactoEmergencia: [
      { nombre: '', telefono: '', correo: '', parentesco: '' },
      { nombre: '', telefono: '', correo: '', parentesco: '' },
    ],
    // Consentimientos informados firmados: { id, tipoConsentimiento, fecha, firmaBase64 }
    consentimientosFirmados: [],

    // Anamnesis Clínica
    motivoConsulta: '',
    sintomasAuditivos: {
      hipoacusia: { presente: false, grado: '', oido: '', inicio: '', evolucion: '' },
      acufeno: { presente: false, tipo: '', frecuencia: '', intensidad: '', oido: '' },
      vertigo: { presente: false, frecuencia: '', duracion: '', desencadenantes: '' },
      dificultadPercepcionHabla: { presente: false, descripcion: '' },
      dificultadInteligibilidad: { presente: false, descripcion: '' },
      dificultadLocalizacionSonora: { presente: false, descripcion: '' },
    },
    antecedentesMedicos: {
      patologiasGenerales: [],
      cirugias: [],
      medicamentos: [],
      alergias: [],
      enfermedadesCronicas: [],
    },
    antecedentesOtorrinolaringologicos: {
      otitis: { presente: false, tipo: '', frecuencia: '', tratamiento: '' },
      perforacionTimpanica: { presente: false, oido: '', fecha: '' },
      traumaAcustico: { presente: false, descripcion: '', fecha: '' },
      exposicionRuido: { presente: false, tipo: '', duracion: '', intensidad: '' },
      otros: '',
    },
    antecedentesFamiliares: {
      hipoacusia: { presente: false, familiar: '', grado: '' },
      otrasPatologias: [],
    },
    desarrollo: {
      embarazo: { normal: true, complicaciones: '' },
      parto: { normal: true, tipo: '', complicaciones: '' },
      desarrolloMotor: { normal: true, observaciones: '' },
      desarrolloLenguaje: { normal: true, observaciones: '' },
    },
    
    // Anamnesis Social
    estadoCivil: '',
    ocupacion: '',
    nivelEducativo: '',
    contextoFamiliar: {
      composicionFamiliar: '',
      apoyoFamiliar: '',
      observaciones: '',
    },
    contextoLaboral: {
      tipoTrabajo: '',
      ambienteRuido: false,
      usoProteccionAuditiva: false,
      observaciones: '',
    },
    contextoSocial: {
      actividadesRecreativas: [],
      participacionSocial: '',
      limitaciones: '',
    },
    habitos: {
      tabaquismo: { presente: false, frecuencia: '', duracion: '' },
      alcohol: { presente: false, frecuencia: '', cantidad: '' },
      otros: '',
    },
    
    // Otros
    observacionesGenerales: '',
  });

  useEffect(() => {
    if (open && (appointment || lead)) {
      loadPatientData().catch((e) => console.error('[PatientProfileDialog] loadPatientData:', e));
    }
  }, [open, appointment, lead]);

  // Apertura de historia clínica: registrar hora y contador de minutos
  useEffect(() => {
    if (open) {
      setHistoriaAbiertaAt(new Date());
      setMinutosTranscurridos(0);
    } else {
      setHistoriaAbiertaAt(null);
      setMinutosTranscurridos(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !historiaAbiertaAt) return;
    const interval = setInterval(() => {
      setMinutosTranscurridos(Math.floor((Date.now() - historiaAbiertaAt.getTime()) / 60000));
    }, 60000); // actualizar cada minuto
    return () => clearInterval(interval);
  }, [open, historiaAbiertaAt]);

  useEffect(() => {
    const handleProductsUpdate = () => {
      const email = formData.email || appointment?.patientEmail || lead?.email;
      if (email && open) getPatientProducts(email).then((p) => setPatientProducts([...p]));
    }
    window.addEventListener('productsUpdated', handleProductsUpdate);
    return () => window.removeEventListener('productsUpdated', handleProductsUpdate);
  }, [appointment, lead, open, formData.email]);

  const loadPatientData = async () => {
    try {
      const sourceData = appointment || lead;
      const email = appointment?.patientEmail || lead?.email;
      
      if (!email) {
        console.warn('[PatientProfileDialog] No email found in appointment or lead');
        return;
      }

      // Cargar perfil existente o inicializar
      let profile = getPatientProfile(email);
      
      if (!profile) {
        // Inicializar perfil desde datos de cita o lead
        try {
          const initResult = initializePatientProfile(sourceData);
          profile = initResult.profile;
        } catch (error) {
          console.error('[PatientProfileDialog] Error initializing profile:', error);
          // Continuar con profile = null para usar valores por defecto
        }
      }

    if (profile) {
      setPatientProfile(profile);
      
      // Valores por defecto para evitar referencias a formData no inicializado
      const defaultSintomasAuditivos = {
        hipoacusia: { presente: false, grado: '', oido: '', inicio: '', evolucion: '' },
        acufeno: { presente: false, tipo: '', frecuencia: '', intensidad: '', oido: '' },
        vertigo: { presente: false, frecuencia: '', duracion: '', desencadenantes: '' },
        dificultadPercepcionHabla: { presente: false, descripcion: '' },
        dificultadInteligibilidad: { presente: false, descripcion: '' },
        dificultadLocalizacionSonora: { presente: false, descripcion: '' },
      };
      
      const defaultAntecedentesMedicos = {
        patologiasGenerales: [],
        cirugias: [],
        medicamentos: [],
        alergias: [],
        enfermedadesCronicas: [],
      };
      
      const defaultAntecedentesORL = {
        otitis: { presente: false, tipo: '', frecuencia: '', tratamiento: '' },
        perforacionTimpanica: { presente: false, oido: '', fecha: '' },
        traumaAcustico: { presente: false, descripcion: '', fecha: '' },
        exposicionRuido: { presente: false, tipo: '', duracion: '', intensidad: '' },
        otros: '',
      };
      
      const defaultAntecedentesFamiliares = {
        hipoacusia: { presente: false, familiar: '', grado: '' },
        otrasPatologias: [],
      };
      
      const defaultDesarrollo = {
        embarazo: { normal: true, complicaciones: '' },
        parto: { normal: true, tipo: '', complicaciones: '' },
        desarrolloMotor: { normal: true, observaciones: '' },
        desarrolloLenguaje: { normal: true, observaciones: '' },
      };
      
      const defaultContextoFamiliar = {
        composicionFamiliar: '',
        apoyoFamiliar: '',
        observaciones: '',
      };
      
      const defaultContextoLaboral = {
        tipoTrabajo: '',
        ambienteRuido: false,
        usoProteccionAuditiva: false,
        observaciones: '',
      };
      
      const defaultContextoSocial = {
        actividadesRecreativas: [],
        participacionSocial: '',
        limitaciones: '',
      };
      
      const defaultHabitos = {
        tabaquismo: { presente: false, frecuencia: '', duracion: '' },
        alcohol: { presente: false, frecuencia: '', cantidad: '' },
        otros: '',
      };
      
      // Asegurar que el email siempre esté disponible
      const emailToUse = profile.email || email || sourceData.patientEmail || sourceData.email || '';
      
      setFormData({
        nombre: profile.nombre || sourceData.patientName || sourceData.nombre || '',
        email: emailToUse,
        telefono: profile.telefono || sourceData.patientPhone || sourceData.telefono || '',
        direccion: profile.direccion || sourceData.direccion || '',
        ciudad: profile.ciudad || sourceData.ciudad || '',
        fechaNacimiento: profile.fechaNacimiento || '',
        genero: profile.genero || '',
        documentoIdentidad: (typeof profile.documentoIdentidad === 'object' && profile.documentoIdentidad != null)
          ? { tipo: profile.documentoIdentidad.tipo || '', numero: profile.documentoIdentidad.numero || '', lugarExpedicion: profile.documentoIdentidad.lugarExpedicion || '', fechaExpedicion: profile.documentoIdentidad.fechaExpedicion || '' }
          : { tipo: '', numero: typeof profile.documentoIdentidad === 'string' ? profile.documentoIdentidad : '', lugarExpedicion: '', fechaExpedicion: '' },
        fotoPaciente: profile.fotoPaciente || '',
        contactoEmergencia: (() => {
          const ce = profile.contactoEmergencia;
          const empty = () => ({ nombre: '', telefono: '', correo: '', parentesco: '' });
          if (Array.isArray(ce)) return [ce[0] || empty(), ce[1] || empty()];
          if (ce && typeof ce === 'object') return [ce, empty()];
          return [empty(), empty()];
        })(),
        consentimientosFirmados: profile.consentimientosFirmados || [],
        motivoConsulta: profile.anamnesisClinica?.motivoConsulta || sourceData.reason || sourceData.interes || '',
        sintomasAuditivos: profile.anamnesisClinica?.sintomasAuditivos || defaultSintomasAuditivos,
        antecedentesMedicos: profile.anamnesisClinica?.antecedentesMedicos || defaultAntecedentesMedicos,
        antecedentesOtorrinolaringologicos: profile.anamnesisClinica?.antecedentesOtorrinolaringologicos || defaultAntecedentesORL,
        antecedentesFamiliares: profile.anamnesisClinica?.antecedentesFamiliares || defaultAntecedentesFamiliares,
        desarrollo: profile.anamnesisClinica?.desarrollo || defaultDesarrollo,
        estadoCivil: profile.anamnesisSocial?.estadoCivil || '',
        ocupacion: profile.anamnesisSocial?.ocupacion || '',
        nivelEducativo: profile.anamnesisSocial?.nivelEducativo || '',
        contextoFamiliar: profile.anamnesisSocial?.contextoFamiliar || defaultContextoFamiliar,
        contextoLaboral: profile.anamnesisSocial?.contextoLaboral || defaultContextoLaboral,
        contextoSocial: profile.anamnesisSocial?.contextoSocial || defaultContextoSocial,
        habitos: profile.anamnesisSocial?.habitos || defaultHabitos,
        // Observaciones: priorizar perfil, luego notas del lead
        observacionesGenerales: profile.observacionesGenerales || profile.notas || sourceData.notas || '',
      });
    } else {
      // Si no hay perfil, inicializar con valores por defecto
      // Asegurar que el email siempre esté disponible
      const emailToUse = email || sourceData?.patientEmail || sourceData?.email || formData.email || '';
      
      console.log('[PatientProfileDialog] No hay perfil, usando email:', emailToUse);
      
      setFormData({
        nombre: sourceData.patientName || sourceData.nombre || '',
        email: emailToUse,
        telefono: sourceData.patientPhone || sourceData.telefono || '',
        direccion: sourceData.direccion || '',
        ciudad: sourceData.ciudad || '',
        fechaNacimiento: '',
        genero: '',
        documentoIdentidad: '',
        fotoPaciente: '',
        contactoEmergencia: [
          { nombre: '', telefono: '', correo: '', parentesco: '' },
          { nombre: '', telefono: '', correo: '', parentesco: '' },
        ],
        motivoConsulta: sourceData.reason || sourceData.interes || '',
        sintomasAuditivos: {
          hipoacusia: { presente: false, grado: '', oido: '', inicio: '', evolucion: '' },
          acufeno: { presente: false, tipo: '', frecuencia: '', intensidad: '', oido: '' },
          vertigo: { presente: false, frecuencia: '', duracion: '', desencadenantes: '' },
          dificultadPercepcionHabla: { presente: false, descripcion: '' },
          dificultadInteligibilidad: { presente: false, descripcion: '' },
          dificultadLocalizacionSonora: { presente: false, descripcion: '' },
        },
        antecedentesMedicos: {
          patologiasGenerales: [],
          cirugias: [],
          medicamentos: [],
          alergias: [],
          enfermedadesCronicas: [],
        },
        antecedentesOtorrinolaringologicos: {
          otitis: { presente: false, tipo: '', frecuencia: '', tratamiento: '' },
          perforacionTimpanica: { presente: false, oido: '', fecha: '' },
          traumaAcustico: { presente: false, descripcion: '', fecha: '' },
          exposicionRuido: { presente: false, tipo: '', duracion: '', intensidad: '' },
          otros: '',
        },
        antecedentesFamiliares: {
          hipoacusia: { presente: false, familiar: '', grado: '' },
          otrasPatologias: [],
        },
        desarrollo: {
          embarazo: { normal: true, complicaciones: '' },
          parto: { normal: true, tipo: '', complicaciones: '' },
          desarrolloMotor: { normal: true, observaciones: '' },
          desarrolloLenguaje: { normal: true, observaciones: '' },
        },
        estadoCivil: '',
        ocupacion: '',
        nivelEducativo: '',
        contextoFamiliar: {
          composicionFamiliar: '',
          apoyoFamiliar: '',
          observaciones: '',
        },
        contextoLaboral: {
          tipoTrabajo: '',
          ambienteRuido: false,
          usoProteccionAuditiva: false,
          observaciones: '',
        },
        contextoSocial: {
          actividadesRecreativas: [],
          participacionSocial: '',
          limitaciones: '',
        },
        habitos: {
          tabaquismo: { presente: false, frecuencia: '', duracion: '' },
          alcohol: { presente: false, frecuencia: '', cantidad: '' },
          otros: '',
        },
        observacionesGenerales: sourceData.notas || '',
      });
    }

      // Cargar citas del paciente
      try {
        const allAppointments = await getAllAppointments();
        const patientApts = allAppointments.filter(apt => apt.patientEmail === email);
        setPatientAppointments(patientApts);
        
        // Cargar consultas (registros de tipo 'consultation')
        const records = getPatientRecords(email);
        const consultations = records.filter(r => r.type === 'consultation');
        setPatientConsultations(consultations);
      } catch (error) {
        console.error('[PatientProfileDialog] Error loading appointments:', error);
        setPatientAppointments([]);
        setPatientConsultations([]);
      }

      // Cargar interacciones del paciente
      try {
        const interactions = getPatientInteractions(email);
        setPatientInteractions(interactions);
      } catch (error) {
        console.error('[PatientProfileDialog] Error loading interactions:', error);
        setPatientInteractions([]);
      }

      // Cargar productos del paciente
      try {
        const products = await getPatientProducts(email);
        setPatientProducts(products);
      } catch (error) {
        console.error('[PatientProfileDialog] Error loading products:', error);
        setPatientProducts([]);
      }

      // Cargar mantenimientos del paciente
      try {
        const maintenances = getPatientMaintenances(email);
        setPatientMaintenances(maintenances);
        const upcoming = getUpcomingMaintenances(email, 90);
        setUpcomingMaintenances(upcoming);
      } catch (error) {
        console.error('[PatientProfileDialog] Error loading maintenances:', error);
        setPatientMaintenances([]);
        setUpcomingMaintenances([]);
      }
    } catch (error) {
      console.error('[PatientProfileDialog] Error in loadPatientData:', error);
      // Asegurar que los estados estén inicializados incluso si hay error
      setPatientAppointments([]);
      setPatientConsultations([]);
      setPatientInteractions([]);
      setPatientProducts([]);
      setPatientMaintenances([]);
      setUpcomingMaintenances([]);
    }
  };

  // Tipos de citas con duraciones
  const appointmentTypes = [
    { value: 'primera-vez', label: 'Cita primera vez', duration: 60 },
    { value: 'adaptacion', label: 'Cita de adaptación', duration: 60 },
    { value: 'prueba-audifonos', label: 'Prueba de audífonos', duration: 40 },
    { value: 'entrega-mantenimiento', label: 'Entrega de mantenimiento', duration: 20 },
    { value: 'revision', label: 'Revisión de audífonos', duration: 20 },
    { value: 'examenes', label: 'Cita de exámenes', duration: 40 },
    { value: 'control', label: 'Cita control', duration: 30 },
  ];

  useEffect(() => {
    if (!appointmentDate || !appointmentType) {
      setAvailableTimes([]);
      return;
    }
    getAvailableTimeSlots(appointmentDate, '07:00', '18:00').then(setAvailableTimes);
  }, [appointmentDate, appointmentType]);

  const handleCreateAppointmentFromProfile = async () => {
    const email = getPatientEmail();
    if (!email || !appointmentDate || !appointmentTime || !appointmentType) {
      setSnackbar({ open: true, message: 'Por favor completa todos los campos obligatorios', severity: 'error' });
      return;
    }
    const selectedType = appointmentTypes.find(t => t.value === appointmentType);
    const duration = selectedType ? selectedType.duration : 50;
    const patientName = formData.nombre || appointment?.patientName || lead?.nombre || '';
    const patientPhone = formData.telefono || appointment?.patientPhone || lead?.telefono || '';
    if (!patientName || !patientPhone) {
      setSnackbar({ open: true, message: 'Por favor completa los datos del paciente (nombre y teléfono)', severity: 'error' });
      return;
    }
    const result = await createAppointment({
      date: appointmentDate,
      time: appointmentTime,
      patientName: patientName,
      patientEmail: email,
      patientPhone: patientPhone,
      reason: appointmentReason || selectedType.label,
      appointmentType: appointmentType,
      procedencia: 'paciente-existente',
      durationMinutes: duration,
    });

    if (result.success) {
      // Crear recordatorios (email, WhatsApp, llamada)
      const reminderDate = new Date(`${appointmentDate}T${appointmentTime}`);
      reminderDate.setDate(reminderDate.getDate() - 1); // Recordatorio 1 día antes

      // Recordatorio por email
      recordReminder(email, {
        title: `Recordatorio: ${selectedType.label}`,
        description: `Tienes una cita programada para ${selectedType.label} el ${new Date(appointmentDate + 'T00:00:00').toLocaleDateString('es-ES')} a las ${appointmentTime}`,
        scheduledDate: appointmentDate,
        scheduledTime: appointmentTime,
        relatedAppointmentId: result.appointment.id,
        channel: 'email',
        status: 'scheduled',
      });

      // Recordatorio por WhatsApp
      recordReminder(email, {
        title: `Recordatorio WhatsApp: ${selectedType.label}`,
        description: `Recordatorio por WhatsApp para ${selectedType.label}`,
        scheduledDate: appointmentDate,
        scheduledTime: appointmentTime,
        relatedAppointmentId: result.appointment.id,
        channel: 'whatsapp',
        status: 'scheduled',
      });

      // Recordatorio por llamada
      recordReminder(email, {
        title: `Recordatorio Llamada: ${selectedType.label}`,
        description: `Recordatorio por llamada para ${selectedType.label}`,
        scheduledDate: appointmentDate,
        scheduledTime: appointmentTime,
        relatedAppointmentId: result.appointment.id,
        channel: 'call',
        status: 'scheduled',
      });

      await loadPatientData();
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentType('');
      setAppointmentReason('');
      setAvailableTimes([]);

      setSnackbar({
        open: true,
        message: `Cita agendada exitosamente. Se enviarán recordatorios por email, WhatsApp y llamada.`,
        severity: 'success',
      });
    } else {
      // Mostrar error más descriptivo
      console.error('[PatientProfileDialog] Error al crear cita:', result.error);
      setSnackbar({
        open: true,
        message: result.error || 'Error al agendar la cita. Por favor, verifica que el horario esté disponible.',
        severity: 'error',
      });
    }
  };

  // Nueva Cita: Evolucionar abre el diálogo de evolución; al guardar se marca como asistida y se registra la consulta
  const handleOpenEvolucionar = (apt) => {
    setEvolucionarAppointment(apt);
    setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
    const aptType = apt.appointmentType ?? appointmentTypes.find((t) => t.label === apt.reason)?.value ?? null;
    setEvolucionarPrimeraVezStep(aptType === 'primera-vez' ? 'asistencia' : 'form');
    setEvolucionarDialogOpen(true);
  };

  const handleEvolucionarNoAsistio = async () => {
    if (!evolucionarAppointment) return;
    const result = await updateAppointmentStatus(evolucionarAppointment.id, 'no-show');
    if (result.success) {
      await loadPatientData();
      setEvolucionarDialogOpen(false);
      setEvolucionarAppointment(null);
      setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
      setEvolucionarPrimeraVezStep('asistencia');
      setSnackbar({ open: true, message: 'Cita marcada como no asistida.', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: result.error || 'Error al actualizar.', severity: 'error' });
    }
  };

  // Cita primera vez: Asistió → pasar a diligenciar historia clínica
  const handleEvolucionarAsistio = () => {
    setEvolucionarPrimeraVezStep('form');
  };

  // Exportar historial de citas (solo historial, no historia clínica) a Excel
  const handleExportarHistorialCitas = () => {
    const labelPorEstado = (s) => ({ confirmed: 'Agendada', completed: 'Asistida', 'no-show': 'No asistida', rescheduled: 'Re-agendada', cancelled: 'Cancelada', patient: 'Paciente' }[s] || s);
    const filas = [...patientAppointments]
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .map((apt) => {
        const tieneEvolucion = patientConsultations.some((c) => c.appointmentId === apt.id);
        return {
          Fecha: new Date(apt.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          Hora: apt.time,
          Paciente: apt.patientName || '',
          'Motivo / Tipo': apt.reason || '',
          Estado: labelPorEstado(apt.status),
          Procedencia: apt.procedencia ? formatProcedencia(apt.procedencia) : '',
          'Tiene evolución registrada': tieneEvolucion ? 'Sí' : 'No',
        };
      });
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Historial de citas');
    const nombrePaciente = (formData.nombre || appointment?.patientName || lead?.nombre || 'Paciente').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 30);
    XLSX.writeFile(libro, `Historial_citas_${nombrePaciente}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setSnackbar({ open: true, message: 'Historial de citas exportado correctamente.', severity: 'success' });
  };

  // Menú Exportar historia clínica: abrir/cerrar
  const handleOpenExportarHC = (event) => setAnchorElExportarHC(event.currentTarget);
  const handleCloseExportarHC = () => setAnchorElExportarHC(null);

  // Usuario que exporta (logueado en CRM); clave usada en LoginCRMPage
  const getUsuarioExportador = () => (typeof localStorage !== 'undefined' && localStorage.getItem('oirconecta_crm_user')) || '—';

  // Exportar historia clínica completa como Excel (paciente + todas las consultas; incluye fecha/hora y usuario exportador)
  const handleExportarHistoriaClinicaExcel = () => {
    handleCloseExportarHC();
    const fechaHoraExportacion = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
    const usuarioExportador = getUsuarioExportador();
    const nombrePaciente = (formData.nombre || appointment?.patientName || lead?.nombre || 'Paciente').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 30);
    const libro = XLSX.utils.book_new();
    const doc = typeof formData.documentoIdentidad === 'object' ? formData.documentoIdentidad : { tipo: '', numero: String(formData.documentoIdentidad || '') };
    const ce = Array.isArray(formData.contactoEmergencia) ? formData.contactoEmergencia : [];
    // Hoja 1: Datos del paciente (incluye fecha/hora, usuario exportador y todos los datos registrados)
    const datosPaciente = [
      { Campo: 'Fecha y hora de exportación', Valor: fechaHoraExportacion },
      { Campo: 'Exportado por (usuario)', Valor: usuarioExportador },
      { Campo: 'Nombre', Valor: formData.nombre || appointment?.patientName || lead?.nombre || '' },
      { Campo: 'Email', Valor: formData.email || appointment?.patientEmail || lead?.email || '' },
      { Campo: 'Teléfono', Valor: formData.telefono || appointment?.patientPhone || lead?.telefono || '' },
      { Campo: 'Dirección', Valor: formData.direccion || '' },
      { Campo: 'Ciudad', Valor: formData.ciudad || '' },
      { Campo: 'Fecha nacimiento', Valor: formData.fechaNacimiento || '' },
      { Campo: 'Género', Valor: formData.genero || '' },
      { Campo: 'Documento (tipo)', Valor: doc.tipo || '' },
      { Campo: 'Documento (número)', Valor: doc.numero || '' },
      { Campo: 'Documento (lugar expedición)', Valor: doc.lugarExpedicion || '' },
      { Campo: 'Contacto emergencia 1', Valor: ce[0] ? [ce[0].nombre, ce[0].telefono, ce[0].correo, ce[0].parentesco].filter(Boolean).join(' · ') : '' },
      { Campo: 'Contacto emergencia 2', Valor: ce[1] ? [ce[1].nombre, ce[1].telefono, ce[1].correo, ce[1].parentesco].filter(Boolean).join(' · ') : '' },
      { Campo: 'Motivo consulta', Valor: formData.motivoConsulta || '' },
      { Campo: 'Observaciones generales', Valor: formData.observacionesGenerales || '' },
      { Campo: 'Estado civil', Valor: formData.estadoCivil || '' },
      { Campo: 'Ocupación', Valor: formData.ocupacion || '' },
      { Campo: 'Nivel educativo', Valor: formData.nivelEducativo || '' },
    ];
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datosPaciente), 'Datos del paciente');
    // Hoja 2: Todas las consultas registradas (cada fila = una consulta con todos sus datos)
    const labelTipo = (t) => ({ 'primera-vez': 'Primera vez', adaptacion: 'Adaptación', 'prueba-audifonos': 'Prueba audífonos', 'entrega-mantenimiento': 'Entrega/mantenimiento', revision: 'Revisión', examenes: 'Exámenes', control: 'Control' }[t] || t || '—');
    const consultasOrdenadas = [...patientConsultations].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const filasConsultas = consultasOrdenadas.map((c) => {
      const apt = patientAppointments.find((a) => a.id === c.appointmentId);
      return {
        Fecha: c.date ? new Date(c.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
        Hora: apt?.time || '',
        Tipo: labelTipo(c.appointmentType),
        Notas: c.consultationNotes || '',
        'Pérdida auditiva': c.hearingLoss ? 'Sí' : 'No',
        'Próximos pasos': c.nextSteps || '',
        'Historia clínica (formData)': c.formData && typeof c.formData === 'object' ? JSON.stringify(c.formData, null, 2) : '',
      };
    });
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasConsultas.length ? filasConsultas : [{ Fecha: '', Hora: '', Tipo: 'Sin consultas registradas.', Notas: '', 'Pérdida auditiva': '', 'Próximos pasos': '', 'Historia clínica (formData)': '' }]), 'Consultas');
    // Hoja 3: Perfil completo (JSON) por si se necesita todo el dato crudo
    const perfilCompleto = [{ 'Fecha y hora de exportación': fechaHoraExportacion, 'Exportado por (usuario)': usuarioExportador, 'Perfil (JSON)': JSON.stringify(formData, null, 2) }];
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(perfilCompleto), 'Perfil completo');
    XLSX.writeFile(libro, `Historia_clinica_${nombrePaciente}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setSnackbar({ open: true, message: 'Historia clínica exportada en Excel.', severity: 'success' });
  };

  // Exportar historia clínica completa como PDF (logo + fecha/hora + usuario exportador + todos los datos y consultas)
  const handleExportarHistoriaClinicaPDF = async () => {
    handleCloseExportarHC();
    const fechaHoraExportacion = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
    const usuarioExportador = getUsuarioExportador();
    const labelTipo = (t) => ({ 'primera-vez': 'Primera vez', adaptacion: 'Adaptación', 'prueba-audifonos': 'Prueba audífonos', 'entrega-mantenimiento': 'Entrega/mantenimiento', revision: 'Revisión', examenes: 'Exámenes', control: 'Control' }[t] || t || '—');
    const consultasOrdenadas = [...patientConsultations].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const bloqueConsultas = consultasOrdenadas.map((c, i) => {
      const apt = patientAppointments.find((a) => a.id === c.appointmentId);
      const fd = c.formData && typeof c.formData === 'object' ? c.formData : {};
      const formDataStr = Object.keys(fd).length ? Object.entries(fd).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join('<br/>') : '—';
      return `<div style="margin-top:16px; padding:12px; border:1px solid #ddd; border-radius:8px;"><strong>Consulta ${i + 1}</strong> — ${c.date || ''} ${apt?.time || ''} — ${labelTipo(c.appointmentType)}<br/>
        Notas: ${(c.consultationNotes || '—')}<br/>Pérdida auditiva: ${c.hearingLoss ? 'Sí' : 'No'}<br/>Próximos pasos: ${(c.nextSteps || '—')}<br/>
        <details open><summary>Historia clínica (formData)</summary><pre style="margin:8px 0; white-space:pre-wrap; font-size:12px;">${formDataStr}</pre></details></div>`;
    }).join('');
    let logoDataUrl = '';
    try {
      const res = await fetch(`${window.location.origin}/logo-oirconecta.png`);
      if (res.ok) {
        const blob = await res.blob();
        logoDataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      }
    } catch (_) {}
    const logoImg = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="OirConecta" style="max-width:280px; max-height:80px; height:auto; object-fit:contain; display:block; margin:0 auto;" />`
      : '';
    const doc = typeof formData.documentoIdentidad === 'object' ? formData.documentoIdentidad : { tipo: '', numero: String(formData.documentoIdentidad || '') };
    const ce = Array.isArray(formData.contactoEmergencia) ? formData.contactoEmergencia : [];
    const datosPacienteHtml = `
      <p><strong>Nombre:</strong> ${formData.nombre || appointment?.patientName || lead?.nombre || '—'}</p>
      <p><strong>Email:</strong> ${formData.email || appointment?.patientEmail || lead?.email || '—'}</p>
      <p><strong>Teléfono:</strong> ${formData.telefono || appointment?.patientPhone || lead?.telefono || '—'}</p>
      <p><strong>Dirección:</strong> ${formData.direccion || '—'}</p>
      <p><strong>Ciudad:</strong> ${formData.ciudad || '—'}</p>
      <p><strong>Fecha nacimiento:</strong> ${formData.fechaNacimiento || '—'}</p>
      <p><strong>Género:</strong> ${formData.genero || '—'}</p>
      <p><strong>Documento (tipo):</strong> ${doc.tipo || '—'}</p>
      <p><strong>Documento (número):</strong> ${doc.numero || '—'}</p>
      <p><strong>Contacto emergencia 1:</strong> ${ce[0] ? [ce[0].nombre, ce[0].telefono, ce[0].parentesco].filter(Boolean).join(' · ') || '—' : '—'}</p>
      <p><strong>Contacto emergencia 2:</strong> ${ce[1] ? [ce[1].nombre, ce[1].telefono, ce[1].parentesco].filter(Boolean).join(' · ') || '—' : '—'}</p>
      <p><strong>Motivo consulta:</strong> ${formData.motivoConsulta || '—'}</p>
      <p><strong>Estado civil:</strong> ${formData.estadoCivil || '—'}</p>
      <p><strong>Ocupación:</strong> ${formData.ocupacion || '—'}</p>
      <p><strong>Nivel educativo:</strong> ${formData.nivelEducativo || '—'}</p>
      <p><strong>Observaciones generales:</strong> ${formData.observacionesGenerales || '—'}</p>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Historia clínica</title></head><body style="font-family:system-ui; padding:24px; max-width:800px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #085946;">${logoImg}
        <p style="margin:12px 0 0; font-size:14px; color:#085946; font-weight:600;">Exportado el: ${fechaHoraExportacion}</p>
        <p style="margin:4px 0 0; font-size:13px; color:#272F50;">Exportado por: ${usuarioExportador}</p>
      </div>
      <h1 style="color:#085946;">Historia clínica</h1>
      <h2>Datos del paciente</h2>${datosPacienteHtml}
      <h2>Consultas registradas (${consultasOrdenadas.length})</h2>${bloqueConsultas || '<p>Sin consultas registradas.</p>'}
      <p style="margin-top:24px; color:#666; font-size:12px;">Documento exportado el ${fechaHoraExportacion} por ${usuarioExportador}. Use Archivo → Imprimir → Guardar como PDF.</p>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setSnackbar({ open: true, message: 'Se abrió la historia clínica en una nueva ventana. Use Imprimir → Guardar como PDF.', severity: 'info' });
  };

  const handleSaveEvolucionar = async () => {
    if (!evolucionarAppointment) return;
    const email = evolucionarAppointment.patientEmail || getPatientEmail();
    const aptType = evolucionarAppointment.appointmentType ?? appointmentTypes.find((t) => t.label === evolucionarAppointment.reason)?.value ?? null;
    const statusResult = await updateAppointmentStatus(evolucionarAppointment.id, 'completed');
    if (statusResult.success) {
      recordConsultation(email, evolucionarAppointment.id, {
        notes: evolucionarData.notes,
        hearingLoss: evolucionarData.hearingLoss,
        nextSteps: evolucionarData.nextSteps,
        appointmentType: aptType,
        formData: evolucionarData.formData && Object.keys(evolucionarData.formData).length ? evolucionarData.formData : null,
      });
      await loadPatientData();
      setEvolucionarDialogOpen(false);
      setEvolucionarAppointment(null);
      setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
      setSnackbar({ open: true, message: 'Evolución registrada y cita marcada como asistida.', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: statusResult.error || 'Error al guardar.', severity: 'error' });
    }
  };

  // Calcular displayEmail antes de usarlo en las funciones
  const getPatientEmail = () => {
    return formData.email || appointment?.patientEmail || lead?.email || '';
  };

  const handleQuoteSuccess = async (product) => {
    const email = getPatientEmail();
    if (!email?.trim()) {
      alert('Error: No se encontró el email del paciente. Verifica que el perfil tenga un email válido.');
      return;
    }
    const products = await getPatientProducts(email);
    setPatientProducts([...products]);
    setActiveTab(4);
    setQuoteDialogOpen(false);
  };

  const handleSaleSuccess = async (product) => {
    const email = getPatientEmail();
    if (!email?.trim()) {
      alert('Error: No se encontró el email del paciente. Verifica que el perfil tenga un email válido.');
      return;
    }
    const products = await getPatientProducts(email);
    setPatientProducts([...products]);
    setActiveTab(4);
    setSaleDialogOpen(false);
  };

  const handleConvertQuoteToSale = async (quoteId) => {
    const email = appointment?.patientEmail || lead?.email;
    if (!email) {
      console.error('[PatientProfileDialog] No email found for converting quote');
      return;
    }

    const quote = patientProducts.find(p => p.id === quoteId && p.type === 'quote');
    if (!quote) {
      console.error('[PatientProfileDialog] Quote not found');
      return;
    }

    const result = await convertQuoteToSale(email, quoteId, {
      saleDate: new Date().toISOString().split('T')[0],
    });

    if (result.success) {
      const products = await getPatientProducts(email);
      setPatientProducts(products);
    } else {
      console.error('[PatientProfileDialog] Error al convertir cotización:', result.error);
    }
  };

  const handleSave = () => {
    const email = appointment?.patientEmail || lead?.email;
    if (!email) return;

    const profileData = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      fechaNacimiento: formData.fechaNacimiento,
      genero: formData.genero,
      documentoIdentidad: formData.documentoIdentidad && typeof formData.documentoIdentidad === 'object' ? formData.documentoIdentidad : { tipo: '', numero: formData.documentoIdentidad || '', lugarExpedicion: '', fechaExpedicion: '' },
      anamnesisClinica: {
        motivoConsulta: formData.motivoConsulta,
        sintomasAuditivos: formData.sintomasAuditivos,
        antecedentesMedicos: formData.antecedentesMedicos,
        antecedentesOtorrinolaringologicos: formData.antecedentesOtorrinolaringologicos,
        antecedentesFamiliares: formData.antecedentesFamiliares,
        desarrollo: formData.desarrollo,
      },
      anamnesisSocial: {
        estadoCivil: formData.estadoCivil,
        ocupacion: formData.ocupacion,
        nivelEducativo: formData.nivelEducativo,
        contextoFamiliar: formData.contextoFamiliar,
        contextoLaboral: formData.contextoLaboral,
        contextoSocial: formData.contextoSocial,
        habitos: formData.habitos,
      },
      observacionesGenerales: formData.observacionesGenerales,
    };

    const result = savePatientProfile(email, profileData);
    if (result.success) {
      setPatientProfile(result.profile);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Perfil guardado exitosamente', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar el perfil', severity: 'error' });
    }
  };

  // Guardar solo Datos Generales
  const handleSaveDatosGenerales = () => {
    // Priorizar: formData.email > appointment?.patientEmail > lead?.email
    const email = formData.email || appointment?.patientEmail || lead?.email;
    
    console.log('[PatientProfileDialog] handleSaveDatosGenerales - Email a usar:', email);
    console.log('[PatientProfileDialog] formData.email:', formData.email);
    console.log('[PatientProfileDialog] appointment?.patientEmail:', appointment?.patientEmail);
    console.log('[PatientProfileDialog] lead?.email:', lead?.email);
    
    if (!email || email.trim() === '') {
      setSnackbar({ 
        open: true, 
        message: 'Error: No se encontró el email del paciente. Por favor, verifica que el campo Email esté completo en Información Personal.', 
        severity: 'error' 
      });
      return;
    }

    // Obtener perfil actual o crear uno nuevo
    let currentProfile = getPatientProfile(email);
    if (!currentProfile) {
      // Si no hay perfil, inicializar con los datos disponibles
      const sourceData = appointment || lead;
      if (sourceData) {
        const initResult = initializePatientProfile(sourceData);
        if (initResult.success) {
          currentProfile = initResult.profile;
        }
      }
      
      // Si aún no hay perfil, crear uno básico
      if (!currentProfile) {
        currentProfile = {
          nombre: formData.nombre || '',
          email: email,
          telefono: formData.telefono || '',
          direccion: formData.direccion || '',
          ciudad: formData.ciudad || '',
          fechaNacimiento: formData.fechaNacimiento || '',
          genero: formData.genero || '',
          documentoIdentidad: formData.documentoIdentidad || '',
          fotoPaciente: formData.fotoPaciente || '',
          contactoEmergencia: Array.isArray(formData.contactoEmergencia) ? formData.contactoEmergencia : [{ nombre: '', telefono: '', correo: '', parentesco: '' }, { nombre: '', telefono: '', correo: '', parentesco: '' }],
          consentimientosFirmados: formData.consentimientosFirmados || [],
          anamnesisClinica: {},
          anamnesisSocial: {},
          createdAt: new Date().toISOString(),
        };
      }
    }

    const profileData = {
      ...currentProfile,
      nombre: formData.nombre || currentProfile.nombre || '',
      email: email, // Usar el email validado
      telefono: formData.telefono || currentProfile.telefono || '',
      direccion: formData.direccion || currentProfile.direccion || '',
      ciudad: formData.ciudad || currentProfile.ciudad || '',
      fechaNacimiento: formData.fechaNacimiento || currentProfile.fechaNacimiento || '',
      genero: formData.genero || currentProfile.genero || '',
      documentoIdentidad: (formData.documentoIdentidad && typeof formData.documentoIdentidad === 'object')
        ? formData.documentoIdentidad
        : (currentProfile.documentoIdentidad && typeof currentProfile.documentoIdentidad === 'object')
          ? currentProfile.documentoIdentidad
          : { tipo: '', numero: (typeof formData.documentoIdentidad === 'string' ? formData.documentoIdentidad : '') || (typeof currentProfile?.documentoIdentidad === 'string' ? currentProfile.documentoIdentidad : '') || '', lugarExpedicion: '', fechaExpedicion: '' },
      fotoPaciente: formData.fotoPaciente ?? currentProfile.fotoPaciente ?? '',
      contactoEmergencia: (() => {
        const ce = formData.contactoEmergencia ?? currentProfile.contactoEmergencia;
        const empty = () => ({ nombre: '', telefono: '', correo: '', parentesco: '' });
        if (Array.isArray(ce)) return [ce[0] || empty(), ce[1] || empty()];
        if (ce && typeof ce === 'object') return [ce, empty()];
        return [empty(), empty()];
      })(),
      consentimientosFirmados: formData.consentimientosFirmados ?? currentProfile.consentimientosFirmados ?? [],
    };

    console.log('[PatientProfileDialog] Guardando perfil con email:', email);
    const result = savePatientProfile(email, profileData);
    if (result.success) {
      setPatientProfile(result.profile);
      setSnackbar({ open: true, message: 'Datos generales guardados exitosamente', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar los datos generales', severity: 'error' });
    }
  };

  // Guardar solo Anamnesis Clínica
  const handleSaveAnamnesisClinica = () => {
    // Priorizar: formData.email > appointment?.patientEmail > lead?.email
    const email = formData.email || appointment?.patientEmail || lead?.email;
    if (!email || email.trim() === '') {
      setSnackbar({ open: true, message: 'Error: No se encontró el email del paciente. Por favor, verifica que el campo Email esté completo.', severity: 'error' });
      return;
    }

    let currentProfile = getPatientProfile(email);
    if (!currentProfile) {
      const initResult = initializePatientProfile(appointment || lead);
      currentProfile = initResult.profile;
    }

    const profileData = {
      ...currentProfile,
      anamnesisClinica: {
        motivoConsulta: formData.motivoConsulta,
        sintomasAuditivos: formData.sintomasAuditivos,
        antecedentesMedicos: formData.antecedentesMedicos,
        antecedentesOtorrinolaringologicos: formData.antecedentesOtorrinolaringologicos,
        antecedentesFamiliares: formData.antecedentesFamiliares,
        desarrollo: formData.desarrollo,
      },
    };

    const result = savePatientProfile(email, profileData);
    if (result.success) {
      setPatientProfile(result.profile);
      setSnackbar({ open: true, message: 'Anamnesis clínica guardada exitosamente', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar la anamnesis clínica', severity: 'error' });
    }
  };

  // Guardar solo Anamnesis Social
  const handleSaveAnamnesisSocial = () => {
    // Priorizar: formData.email > appointment?.patientEmail > lead?.email
    const email = formData.email || appointment?.patientEmail || lead?.email;
    if (!email || email.trim() === '') {
      setSnackbar({ open: true, message: 'Error: No se encontró el email del paciente. Por favor, verifica que el campo Email esté completo.', severity: 'error' });
      return;
    }

    let currentProfile = getPatientProfile(email);
    if (!currentProfile) {
      const initResult = initializePatientProfile(appointment || lead);
      currentProfile = initResult.profile;
    }

    const profileData = {
      ...currentProfile,
      anamnesisSocial: {
        estadoCivil: formData.estadoCivil,
        ocupacion: formData.ocupacion,
        nivelEducativo: formData.nivelEducativo,
        contextoFamiliar: formData.contextoFamiliar,
        contextoLaboral: formData.contextoLaboral,
        contextoSocial: formData.contextoSocial,
        habitos: formData.habitos,
      },
      observacionesGenerales: formData.observacionesGenerales,
    };

    const result = savePatientProfile(email, profileData);
    if (result.success) {
      setPatientProfile(result.profile);
      setSnackbar({ open: true, message: 'Anamnesis social guardada exitosamente', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar la anamnesis social', severity: 'error' });
    }
  };

  const handleFieldChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleContactoEmergenciaChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contactoEmergencia: (prev.contactoEmergencia || [{ nombre: '', telefono: '', correo: '', parentesco: '' }, { nombre: '', telefono: '', correo: '', parentesco: '' }]).map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  // Iniciar cámara para tomar foto del paciente
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setSnackbar({ open: true, message: 'No se pudo acceder a la cámara. Verifica permisos o usa "Subir imagen".', severity: 'error' });
    }
  };

  // Cuando la cámara está activa, asignar stream al video (ya montado)
  React.useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
    return () => {};
  }, [cameraActive]);

  // Detener cámara
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capturar foto desde el video
  const handleCapturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData(prev => ({ ...prev, fotoPaciente: dataUrl }));
    handleStopCamera();
    setSnackbar({ open: true, message: 'Foto capturada. Haz clic en "Guardar Información" para guardar en el perfil.', severity: 'success' });
  };

  // Subir imagen desde archivo
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, fotoPaciente: reader.result }));
      setSnackbar({ open: true, message: 'Imagen cargada. Haz clic en "Guardar Información" para guardar en el perfil.', severity: 'success' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Tablet de firma / consentimientos informados ---
  // Tipos fijos: el paciente firma una sola vez; el administrador asigna esa firma a los consentimientos que correspondan.
  const TIPOS_CONSENTIMIENTO = [
    'Consentimiento de protección y uso de datos',
    'Autorización para toma de impresiones',
    'Uso de imagen y datos para fines publicitarios',
    'Grabación de audio y video en consulta',
    'Otros',
  ];
  const toggleConsentimientoParaAsignar = (tipo) => {
    setConsentimientosSeleccionadosParaAsignar((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const getCoords = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleSignatureStart = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const coords = getCoords(e);
    if (coords) {
      lastPointRef.current = coords;
      setIsDrawing(true);
    }
  };
  const handleSignatureMove = (e) => {
    e.preventDefault();
    if (!isDrawing || readOnly) return;
    const coords = getCoords(e);
    const canvas = signatureCanvasRef.current;
    if (!coords || !canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#272F50';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastPointRef.current = coords;
  };
  const handleSignatureEnd = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAsignarFirmaAConsentimientos = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const firmaBase64 = canvas.toDataURL('image/png');
    const fecha = new Date().toISOString();
    const tipos = consentimientosSeleccionadosParaAsignar.filter((t) => t.trim());
    if (tipos.length === 0) {
      setSnackbar({ open: true, message: 'Seleccione al menos un consentimiento al que asignar la firma.', severity: 'warning' });
      return;
    }
    const labelOtros = otroTipoConsentimiento.trim() || 'Otros';
    const nuevos = tipos.map((tipo) => ({
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tipoConsentimiento: tipo === 'Otros' ? labelOtros : tipo,
      fecha,
      firmaBase64,
    }));
    setFormData((prev) => ({
      ...prev,
      consentimientosFirmados: [...(prev.consentimientosFirmados || []), ...nuevos],
    }));
    handleClearSignature();
    setConsentimientosSeleccionadosParaAsignar([]);
    setOtroTipoConsentimiento('');
    setSnackbar({
      open: true,
      message: `Firma asignada a ${nuevos.length} consentimiento(s). Use "Guardar Información" para anexar a la historia clínica.`,
      severity: 'success',
    });
  };

  const handleRemoveConsentimiento = (id) => {
    setFormData(prev => ({
      ...prev,
      consentimientosFirmados: (prev.consentimientosFirmados || []).filter(c => c.id !== id),
    }));
  };

  // Inicializar tamaño del canvas de firma cuando se muestra la pestaña Datos generales
  React.useEffect(() => {
    if (activeTab !== 0) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const w = 400;
    const h = 160;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, [activeTab]);

  // Limpiar stream al cerrar o desmontar
  React.useEffect(() => {
    if (!open) handleStopCamera();
    return () => handleStopCamera();
  }, [open]);

  const handleNestedFieldChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const sourceData = appointment || lead;
  const displayName = formData.nombre || sourceData?.patientName || sourceData?.nombre || 'Paciente';
  const displayEmail = formData.email || appointment?.patientEmail || lead?.email || '';
  const displayCedula = (formData.documentoIdentidad && (formData.documentoIdentidad.numero || '').trim()) || '';
  const horaAperturaStr = historiaAbiertaAt ? historiaAbiertaAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '95vh',
          height: '95vh',
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e0e0e0', p: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#085946',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50' }}>
                Perfil del Paciente
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                {displayName}
              </Typography>
              {displayCedula && (
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                  #{displayCedula}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 16, color: '#085946' }} />
                  <Typography variant="caption" sx={{ color: '#86899C' }}>
                    Apertura: {horaAperturaStr}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#86899C' }}>
                  •
                </Typography>
                <Typography variant="caption" sx={{ color: '#272F50', fontWeight: 600 }}>
                  {minutosTranscurridos} min
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isEditing ? (
              <>
                <Button
                  startIcon={<Save />}
                  onClick={handleSave}
                  variant="contained"
                  sx={{ bgcolor: '#085946' }}
                >
                  Guardar
                </Button>
                <Button
                  startIcon={<Close />}
                  onClick={() => setIsEditing(false)}
                  variant="outlined"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
                variant="outlined"
              >
                Editar
              </Button>
            )}
            <Button onClick={onClose} variant="outlined" size="small">
              Cerrar
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
            }}
          >
            <Tab icon={<Person />} iconPosition="start" label="Datos Generales" />
            <Tab icon={<LocalHospital />} iconPosition="start" label="Anamnesis Clínica" />
            <Tab icon={<FamilyRestroom />} iconPosition="start" label="Anamnesis Social" />
            <Tab icon={<CalendarToday />} iconPosition="start" label="Citas" />
            <Tab icon={<ShoppingCart />} iconPosition="start" label="Productos" />
            <Tab icon={<Build />} iconPosition="start" label="Mantenimientos" />
            <Tab icon={<History />} iconPosition="start" label="Interacciones" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f8fafc' }}>
          {/* Tab 0: Datos Generales */}
          {activeTab === 0 && (
            <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Información Personal
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nombre Completo"
                          value={formData.nombre}
                          onChange={(e) => handleFieldChange(null, 'nombre', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange(null, 'email', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Teléfono"
                          value={formData.telefono}
                          onChange={(e) => handleFieldChange(null, 'telefono', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Dirección"
                          value={formData.direccion}
                          onChange={(e) => handleFieldChange(null, 'direccion', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Ciudad"
                          value={formData.ciudad}
                          onChange={(e) => handleFieldChange(null, 'ciudad', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Fecha de Nacimiento"
                          type="date"
                          value={formData.fechaNacimiento}
                          onChange={(e) => handleFieldChange(null, 'fechaNacimiento', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth disabled={readOnly}>
                          <InputLabel>Género</InputLabel>
                          <Select
                            value={formData.genero}
                            label="Género"
                            onChange={(e) => handleFieldChange(null, 'genero', e.target.value)}
                            disabled={readOnly}
                          >
                            <MenuItem value="masculino">Masculino</MenuItem>
                            <MenuItem value="femenino">Femenino</MenuItem>
                            <MenuItem value="otro">Otro</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth disabled={readOnly}>
                          <InputLabel>Tipo de documento</InputLabel>
                          <Select
                            value={formData.documentoIdentidad?.tipo ?? ''}
                            label="Tipo de documento"
                            onChange={(e) => handleFieldChange('documentoIdentidad', 'tipo', e.target.value)}
                          >
                            <MenuItem value="Cédula de ciudadanía">Cédula de ciudadanía</MenuItem>
                            <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                            <MenuItem value="Registro civil">Registro civil</MenuItem>
                            <MenuItem value="Otro">Otro</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Número del documento"
                          value={formData.documentoIdentidad?.numero ?? ''}
                          onChange={(e) => handleFieldChange('documentoIdentidad', 'numero', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Lugar de expedición"
                          value={formData.documentoIdentidad?.lugarExpedicion ?? ''}
                          onChange={(e) => handleFieldChange('documentoIdentidad', 'lugarExpedicion', e.target.value)}
                          disabled={readOnly}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Fecha de expedición"
                          type="date"
                          value={formData.documentoIdentidad?.fechaExpedicion ?? ''}
                          onChange={(e) => handleFieldChange('documentoIdentidad', 'fechaExpedicion', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={readOnly}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  {!readOnly && (
                    <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveDatosGenerales}
                        sx={{ bgcolor: '#085946' }}
                      >
                        Guardar Información
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Foto del Paciente - al lado derecho de Información Personal (mismo tamaño) */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Foto del Paciente
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        flex: 1,
                        minHeight: 220,
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: '#f0f4f3',
                        border: '1px dashed rgba(8, 89, 70, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {formData.fotoPaciente ? (
                        <Box component="img" src={formData.fotoPaciente} alt="Foto del paciente" sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
                      ) : cameraActive ? (
                        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                          <Box
                            component="video"
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            sx={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }}
                          />
                          {!readOnly && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                              <Button variant="contained" startIcon={<CameraAlt />} onClick={handleCapturePhoto} sx={{ bgcolor: '#085946' }} size="small">
                                Capturar
                              </Button>
                              <Button variant="outlined" startIcon={<Close />} onClick={handleStopCamera} size="small">
                                Cancelar
                              </Button>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <CameraAlt sx={{ fontSize: 48, color: '#86899C', mb: 1, opacity: 0.6 }} />
                          <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                            Conectar cámara o subir imagen
                          </Typography>
                          {!readOnly && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                              <Button variant="contained" startIcon={<CameraAlt />} onClick={handleStartCamera} sx={{ bgcolor: '#085946' }} size="small">
                                Tomar fotografía
                              </Button>
                              <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                                Subir imagen
                                <input type="file" accept="image/*" hidden onChange={handlePhotoFileChange} />
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                    {!readOnly && formData.fotoPaciente && (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => setFormData(prev => ({ ...prev, fotoPaciente: '' }))}
                      >
                        Quitar foto
                      </Button>
                    )}
                  </CardContent>
                  {!readOnly && (
                    <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" startIcon={<Save />} onClick={handleSaveDatosGenerales} sx={{ bgcolor: '#085946' }}>
                        Guardar Información
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Firma de consentimientos informados - subida debajo de Foto */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Draw fontSize="small" />
                      Firma de consentimientos informados
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                      El paciente firma una sola vez (en pantalla o con tablet de firma). El administrador asigna esa firma a los consentimientos que correspondan. Los documentos firmados quedan anexados en la historia clínica.
                    </Typography>
                    {!readOnly && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1 }}>
                          1. Firma del paciente
                        </Typography>
                        <Box
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: '#fafafa',
                            touchAction: 'none',
                            mb: 2,
                          }}
                        >
                          <canvas
                            ref={signatureCanvasRef}
                            onMouseDown={handleSignatureStart}
                            onMouseMove={handleSignatureMove}
                            onMouseUp={handleSignatureEnd}
                            onMouseLeave={handleSignatureEnd}
                            onTouchStart={handleSignatureStart}
                            onTouchMove={handleSignatureMove}
                            onTouchEnd={handleSignatureEnd}
                            style={{
                              width: '100%',
                              height: 160,
                              display: 'block',
                              cursor: readOnly ? 'default' : 'crosshair',
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Button variant="outlined" size="small" onClick={handleClearSignature}>
                            Limpiar firma
                          </Button>
                        </Box>
                        <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1 }}>
                          2. Asignar esta firma a los consentimientos (administrador)
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                          {TIPOS_CONSENTIMIENTO.map((tipo) => (
                            <FormControlLabel
                              key={tipo}
                              control={
                                <Checkbox
                                  checked={consentimientosSeleccionadosParaAsignar.includes(tipo)}
                                  onChange={() => toggleConsentimientoParaAsignar(tipo)}
                                  size="small"
                                  sx={{ color: '#085946', '&.Mui-checked': { color: '#085946' } }}
                                />
                              }
                              label={<Typography variant="body2">{tipo}</Typography>}
                            />
                          ))}
                        </Box>
                        {consentimientosSeleccionadosParaAsignar.includes('Otros') && (
                          <TextField
                            fullWidth
                            size="small"
                            label="Especifique (Otros)"
                            value={otroTipoConsentimiento}
                            onChange={(e) => setOtroTipoConsentimiento(e.target.value)}
                            sx={{ mb: 2 }}
                            placeholder="Ej: Consentimiento para cirugía"
                          />
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Save />}
                          onClick={handleAsignarFirmaAConsentimientos}
                          sx={{ bgcolor: '#085946' }}
                        >
                          Asignar firma a consentimientos seleccionados
                        </Button>
                      </>
                    )}
                    {(formData.consentimientosFirmados || []).length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1 }}>
                          Consentimientos firmados (anexados a la historia clínica)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(formData.consentimientosFirmados || []).map((c) => (
                            <Paper
                              key={c.id}
                              variant="outlined"
                              sx={{
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                maxWidth: '100%',
                              }}
                            >
                              <Box
                                component="img"
                                src={c.firmaBase64}
                                alt={`Firma ${c.tipoConsentimiento}`}
                                sx={{ height: 36, maxWidth: 80, objectFit: 'contain', border: '1px solid #eee', borderRadius: 0.5 }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }} noWrap>
                                  {c.tipoConsentimiento}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#86899C' }}>
                                  {c.fecha ? new Date(c.fecha).toLocaleDateString('es-CL') : '-'}
                                </Typography>
                              </Box>
                              {!readOnly && (
                                <IconButton size="small" color="error" onClick={() => handleRemoveConsentimiento(c.id)} aria-label="Eliminar firma">
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  {!readOnly && (formData.consentimientosFirmados || []).length > 0 && (
                    <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" startIcon={<Save />} onClick={handleSaveDatosGenerales} sx={{ bgcolor: '#085946' }}>
                        Guardar Información
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Información de Procedencia y debajo Contacto de Emergencia (misma columna) */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                        Información de Procedencia
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sourceData?.procedencia && (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                              Procedencia
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatProcedencia(sourceData.procedencia)}
                            </Typography>
                          </Box>
                        )}
                        {sourceData?.medicoReferente && (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                              Médico Referente
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {sourceData.medicoReferente}
                            </Typography>
                          </Box>
                        )}
                        {sourceData?.usuarioAudifonosMedicados && (
                          <Box>
                            <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                              Usuario de Audífonos Medicados
                            </Typography>
                            <Chip
                              label={sourceData.usuarioAudifonosMedicados}
                              size="small"
                              color={sourceData.usuarioAudifonosMedicados === 'SI' ? 'success' : 'default'}
                            />
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
                            Fecha del contacto o creación
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {sourceData?.createdAt
                              ? new Date(sourceData.createdAt).toLocaleDateString('es-CL', { dateStyle: 'medium' })
                              : sourceData?.date || sourceData?.fecha
                                ? (typeof (sourceData?.date || sourceData?.fecha) === 'string'
                                    ? new Date(sourceData.date || sourceData.fecha).toLocaleDateString('es-CL', { dateStyle: 'medium' })
                                    : (sourceData?.date || sourceData?.fecha))
                                : '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Contacto de Emergencia - debajo de Información de Procedencia */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                        Contacto de Emergencia
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        Diligencie los datos de hasta 2 personas de contacto en caso de emergencia.
                      </Typography>
                      {[0, 1].map((idx) => {
                        const c = (formData.contactoEmergencia && formData.contactoEmergencia[idx]) || { nombre: '', telefono: '', correo: '', parentesco: '' };
                        return (
                          <Box key={idx} sx={{ mb: idx < 1 ? 3 : 0 }}>
                            <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1.5 }}>
                              Persona {idx + 1}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                  fullWidth
                                  label="Nombre"
                                  value={c.nombre ?? ''}
                                  onChange={(e) => handleContactoEmergenciaChange(idx, 'nombre', e.target.value)}
                                  disabled={readOnly}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                  fullWidth
                                  label="Teléfono"
                                  value={c.telefono ?? ''}
                                  onChange={(e) => handleContactoEmergenciaChange(idx, 'telefono', e.target.value)}
                                  disabled={readOnly}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                  fullWidth
                                  label="Correo"
                                  type="email"
                                  value={c.correo ?? ''}
                                  onChange={(e) => handleContactoEmergenciaChange(idx, 'correo', e.target.value)}
                                  disabled={readOnly}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                  fullWidth
                                  label="Parentesco"
                                  value={c.parentesco ?? ''}
                                  onChange={(e) => handleContactoEmergenciaChange(idx, 'parentesco', e.target.value)}
                                  placeholder="Ej: Cónyuge, Hijo(a), Padre, Madre..."
                                  disabled={readOnly}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        );
                      })}
                    </CardContent>
                    {!readOnly && (
                      <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveDatosGenerales}
                          sx={{ bgcolor: '#085946' }}
                        >
                          Guardar Información
                        </Button>
                      </Box>
                    )}
                  </Card>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Anamnesis Clínica */}
          {activeTab === 1 && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#272F50' }}>
                    Motivo de Consulta
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.motivoConsulta || ''}
                    onChange={(e) => handleFieldChange(null, 'motivoConsulta', e.target.value)}
                    placeholder="Describa el motivo principal de la consulta..."
                    disabled={readOnly}
                  />
                </CardContent>
              </Card>

              {/* Síntomas Auditivos */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Síntomas Auditivos
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Hipoacusia */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.sintomasAuditivos.hipoacusia.presente}
                              onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'hipoacusia', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Hipoacusia (Pérdida Auditiva)"
                        />
                        {formData.sintomasAuditivos.hipoacusia.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Grado</InputLabel>
                                <Select
                                  value={formData.sintomasAuditivos.hipoacusia.grado}
                                  label="Grado"
                                  onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'hipoacusia', 'grado', e.target.value)}
                                disabled={readOnly}
                                >
                                  <MenuItem value="leve">Leve</MenuItem>
                                  <MenuItem value="moderada">Moderada</MenuItem>
                                  <MenuItem value="severa">Severa</MenuItem>
                                  <MenuItem value="profunda">Profunda</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Oído</InputLabel>
                                <Select
                                  value={formData.sintomasAuditivos.hipoacusia.oido}
                                  label="Oído"
                                  onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'hipoacusia', 'oido', e.target.value)}
                                disabled={readOnly}
                                >
                                  <MenuItem value="derecho">Derecho</MenuItem>
                                  <MenuItem value="izquierdo">Izquierdo</MenuItem>
                                  <MenuItem value="ambos">Ambos</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Inicio"
                                value={formData.sintomasAuditivos.hipoacusia.inicio}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'hipoacusia', 'inicio', e.target.value)}
                                placeholder="Ej: Hace 2 años"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Evolución"
                                value={formData.sintomasAuditivos.hipoacusia.evolucion}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'hipoacusia', 'evolucion', e.target.value)}
                                placeholder="Ej: Progresiva"
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>

                    {/* Acúfeno */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.sintomasAuditivos.acufeno.presente}
                              onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'acufeno', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Acúfeno (Tinnitus)"
                        />
                        {formData.sintomasAuditivos.acufeno.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Tipo"
                                value={formData.sintomasAuditivos.acufeno.tipo}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'acufeno', 'tipo', e.target.value)}
                                placeholder="Ej: Zumbido, pitido"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Frecuencia"
                                value={formData.sintomasAuditivos.acufeno.frecuencia}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'acufeno', 'frecuencia', e.target.value)}
                                placeholder="Ej: Constante, intermitente"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Intensidad"
                                value={formData.sintomasAuditivos.acufeno.intensidad}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'acufeno', 'intensidad', e.target.value)}
                                placeholder="Ej: Leve, moderada, intensa"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth disabled={readOnly}>
                                <InputLabel>Oído</InputLabel>
                                <Select
                                  value={formData.sintomasAuditivos.acufeno.oido}
                                  label="Oído"
                                  onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'acufeno', 'oido', e.target.value)}
                                  disabled={readOnly}
                                >
                                  <MenuItem value="derecho">Derecho</MenuItem>
                                  <MenuItem value="izquierdo">Izquierdo</MenuItem>
                                  <MenuItem value="ambos">Ambos</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>

                    {/* Vértigo */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.sintomasAuditivos.vertigo.presente}
                              onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'vertigo', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Vértigo / Mareo"
                        />
                        {formData.sintomasAuditivos.vertigo.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Frecuencia"
                                value={formData.sintomasAuditivos.vertigo.frecuencia}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'vertigo', 'frecuencia', e.target.value)}
                                placeholder="Ej: Diario, semanal"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Duración"
                                value={formData.sintomasAuditivos.vertigo.duracion}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'vertigo', 'duracion', e.target.value)}
                                placeholder="Ej: Minutos, horas"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Desencadenantes"
                                value={formData.sintomasAuditivos.vertigo.desencadenantes}
                                onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'vertigo', 'desencadenantes', e.target.value)}
                                placeholder="Ej: Cambios de posición"
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>

                    {/* Dificultades adicionales */}
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.sintomasAuditivos.dificultadPercepcionHabla.presente}
                            onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadPercepcionHabla', 'presente', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Dificultad en Percepción del Habla"
                      />
                      {formData.sintomasAuditivos.dificultadPercepcionHabla.presente && (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={formData.sintomasAuditivos.dificultadPercepcionHabla.descripcion}
                          onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadPercepcionHabla', 'descripcion', e.target.value)}
                          sx={{ mt: 1 }}
                          disabled={readOnly}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.sintomasAuditivos.dificultadInteligibilidad.presente}
                            onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadInteligibilidad', 'presente', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Dificultad en Inteligibilidad"
                      />
                      {formData.sintomasAuditivos.dificultadInteligibilidad.presente && (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={formData.sintomasAuditivos.dificultadInteligibilidad.descripcion}
                          onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadInteligibilidad', 'descripcion', e.target.value)}
                          sx={{ mt: 1 }}
                          disabled={readOnly}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.sintomasAuditivos.dificultadLocalizacionSonora.presente}
                            onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadLocalizacionSonora', 'presente', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Dificultad para Localizar la Fuente Sonora"
                      />
                      {formData.sintomasAuditivos.dificultadLocalizacionSonora.presente && (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={formData.sintomasAuditivos.dificultadLocalizacionSonora.descripcion}
                          onChange={(e) => handleNestedFieldChange('sintomasAuditivos', 'dificultadLocalizacionSonora', 'descripcion', e.target.value)}
                          sx={{ mt: 1 }}
                          disabled={readOnly}
                        />
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Antecedentes Médicos */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Antecedentes Médicos
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Patologías Generales"
                        value={formData.antecedentesMedicos.patologiasGenerales.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesMedicos', 'patologiasGenerales', e.target.value.split(', ').filter(p => p.trim()))}
                        placeholder="Ej: Hipertensión, Diabetes (separar por comas)"
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Cirugías"
                        value={formData.antecedentesMedicos.cirugias.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesMedicos', 'cirugias', e.target.value.split(', ').filter(c => c.trim()))}
                        placeholder="Ej: Apendicectomía, 2010 (separar por comas)"
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Medicamentos Actuales"
                        value={formData.antecedentesMedicos.medicamentos.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesMedicos', 'medicamentos', e.target.value.split(', ').filter(m => m.trim()))}
                        placeholder="Ej: Metformina, Losartán (separar por comas)"
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Alergias"
                        value={formData.antecedentesMedicos.alergias.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesMedicos', 'alergias', e.target.value.split(', ').filter(a => a.trim()))}
                        placeholder="Ej: Penicilina, Polen (separar por comas)"
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Enfermedades Crónicas"
                        value={formData.antecedentesMedicos.enfermedadesCronicas.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesMedicos', 'enfermedadesCronicas', e.target.value.split(', ').filter(e => e.trim()))}
                        placeholder="Ej: Artritis, Asma (separar por comas)"
                        disabled={readOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Antecedentes Otorrinolaringológicos */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Antecedentes Otorrinolaringológicos
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.antecedentesOtorrinolaringologicos.otitis.presente}
                              onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'otitis', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Otitis"
                        />
                        {formData.antecedentesOtorrinolaringologicos.otitis.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Tipo"
                                value={formData.antecedentesOtorrinolaringologicos.otitis.tipo}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'otitis', 'tipo', e.target.value)}
                                placeholder="Ej: Media, externa"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Frecuencia"
                                value={formData.antecedentesOtorrinolaringologicos.otitis.frecuencia}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'otitis', 'frecuencia', e.target.value)}
                                placeholder="Ej: Recurrente"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Tratamiento"
                                value={formData.antecedentesOtorrinolaringologicos.otitis.tratamiento}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'otitis', 'tratamiento', e.target.value)}
                                placeholder="Ej: Antibióticos"
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.antecedentesOtorrinolaringologicos.perforacionTimpanica.presente}
                              onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'perforacionTimpanica', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Perforación Timpánica"
                        />
                        {formData.antecedentesOtorrinolaringologicos.perforacionTimpanica.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Oído</InputLabel>
                                <Select
                                  value={formData.antecedentesOtorrinolaringologicos.perforacionTimpanica.oido}
                                  label="Oído"
                                  onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'perforacionTimpanica', 'oido', e.target.value)}
                                >
                                  <MenuItem value="derecho">Derecho</MenuItem>
                                  <MenuItem value="izquierdo">Izquierdo</MenuItem>
                                  <MenuItem value="ambos">Ambos</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Fecha"
                                type="date"
                                value={formData.antecedentesOtorrinolaringologicos.perforacionTimpanica.fecha}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'perforacionTimpanica', 'fecha', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.antecedentesOtorrinolaringologicos.traumaAcustico.presente}
                              onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'traumaAcustico', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Trauma Acústico"
                        />
                        {formData.antecedentesOtorrinolaringologicos.traumaAcustico.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Descripción"
                                value={formData.antecedentesOtorrinolaringologicos.traumaAcustico.descripcion}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'traumaAcustico', 'descripcion', e.target.value)}
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Fecha"
                                type="date"
                                value={formData.antecedentesOtorrinolaringologicos.traumaAcustico.fecha}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'traumaAcustico', 'fecha', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.antecedentesOtorrinolaringologicos.exposicionRuido.presente}
                              onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'exposicionRuido', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Exposición a Ruido"
                        />
                        {formData.antecedentesOtorrinolaringologicos.exposicionRuido.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Tipo"
                                value={formData.antecedentesOtorrinolaringologicos.exposicionRuido.tipo}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'exposicionRuido', 'tipo', e.target.value)}
                                placeholder="Ej: Laboral, recreativo"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Duración"
                                value={formData.antecedentesOtorrinolaringologicos.exposicionRuido.duracion}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'exposicionRuido', 'duracion', e.target.value)}
                                placeholder="Ej: 10 años"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Intensidad (dB)"
                                value={formData.antecedentesOtorrinolaringologicos.exposicionRuido.intensidad}
                                onChange={(e) => handleNestedFieldChange('antecedentesOtorrinolaringologicos', 'exposicionRuido', 'intensidad', e.target.value)}
                                placeholder="Ej: 85 dB"
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Otros Antecedentes ORL"
                        value={formData.antecedentesOtorrinolaringologicos.otros}
                        onChange={(e) => handleFieldChange('antecedentesOtorrinolaringologicos', 'otros', e.target.value)}
                        disabled={readOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Antecedentes Familiares */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Antecedentes Familiares
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.antecedentesFamiliares.hipoacusia.presente}
                              onChange={(e) => handleNestedFieldChange('antecedentesFamiliares', 'hipoacusia', 'presente', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Hipoacusia Familiar"
                        />
                        {formData.antecedentesFamiliares.hipoacusia.presente && (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Familiar"
                                value={formData.antecedentesFamiliares.hipoacusia.familiar}
                                onChange={(e) => handleNestedFieldChange('antecedentesFamiliares', 'hipoacusia', 'familiar', e.target.value)}
                                placeholder="Ej: Padre, abuelo"
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Grado"
                                value={formData.antecedentesFamiliares.hipoacusia.grado}
                                onChange={(e) => handleNestedFieldChange('antecedentesFamiliares', 'hipoacusia', 'grado', e.target.value)}
                                placeholder="Ej: Moderada"
                                disabled={readOnly}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Otras Patologías Familiares"
                        value={formData.antecedentesFamiliares.otrasPatologias.join(', ')}
                        onChange={(e) => handleFieldChange('antecedentesFamiliares', 'otrasPatologias', e.target.value.split(', ').filter(p => p.trim()))}
                        placeholder="Ej: Diabetes, Hipertensión (separar por comas)"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Desarrollo */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Desarrollo
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Embarazo
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.desarrollo.embarazo.normal}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'embarazo', 'normal', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Normal"
                        />
                        {!formData.desarrollo.embarazo.normal && (
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Complicaciones"
                            value={formData.desarrollo.embarazo.complicaciones}
                            onChange={(e) => handleNestedFieldChange('desarrollo', 'embarazo', 'complicaciones', e.target.value)}
                            sx={{ mt: 1 }}
                            disabled={readOnly}
                          />
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Parto
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.desarrollo.parto.normal}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'parto', 'normal', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Normal"
                        />
                        {!formData.desarrollo.parto.normal && (
                          <>
                            <TextField
                              fullWidth
                              label="Tipo"
                              value={formData.desarrollo.parto.tipo}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'parto', 'tipo', e.target.value)}
                              sx={{ mt: 1 }}
                              placeholder="Ej: Cesárea"
                              disabled={readOnly}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Complicaciones"
                              value={formData.desarrollo.parto.complicaciones}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'parto', 'complicaciones', e.target.value)}
                              sx={{ mt: 1 }}
                              disabled={readOnly}
                            />
                          </>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Desarrollo Motor
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.desarrollo.desarrolloMotor.normal}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'desarrolloMotor', 'normal', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Normal"
                        />
                        {!formData.desarrollo.desarrolloMotor.normal && (
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Observaciones"
                            value={formData.desarrollo.desarrolloMotor.observaciones}
                            onChange={(e) => handleNestedFieldChange('desarrollo', 'desarrolloMotor', 'observaciones', e.target.value)}
                            sx={{ mt: 1 }}
                            disabled={readOnly}
                          />
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Desarrollo del Lenguaje
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.desarrollo.desarrolloLenguaje.normal}
                              onChange={(e) => handleNestedFieldChange('desarrollo', 'desarrolloLenguaje', 'normal', e.target.checked)}
                              disabled={readOnly}
                            />
                          }
                          label="Normal"
                        />
                        {!formData.desarrollo.desarrolloLenguaje.normal && (
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Observaciones"
                            value={formData.desarrollo.desarrolloLenguaje.observaciones}
                            onChange={(e) => handleNestedFieldChange('desarrollo', 'desarrolloLenguaje', 'observaciones', e.target.value)}
                            sx={{ mt: 1 }}
                            disabled={readOnly}
                          />
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              {!readOnly && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveAnamnesisClinica}
                    sx={{ bgcolor: '#085946' }}
                  >
                    Guardar Información
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Anamnesis Social */}
          {activeTab === 2 && (
            <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Información Socioeconómica
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth disabled={readOnly}>
                          <InputLabel>Estado Civil</InputLabel>
                          <Select
                            value={formData.estadoCivil}
                            label="Estado Civil"
                            onChange={(e) => handleFieldChange(null, 'estadoCivil', e.target.value)}
                            disabled={readOnly}
                          >
                            <MenuItem value="soltero">Soltero(a)</MenuItem>
                            <MenuItem value="casado">Casado(a)</MenuItem>
                            <MenuItem value="divorciado">Divorciado(a)</MenuItem>
                            <MenuItem value="viudo">Viudo(a)</MenuItem>
                            <MenuItem value="union-libre">Unión Libre</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Ocupación"
                          value={formData.ocupacion}
                          onChange={(e) => handleFieldChange(null, 'ocupacion', e.target.value)}
                          placeholder="Ej: Ingeniero, Docente"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Nivel Educativo</InputLabel>
                          <Select
                            value={formData.nivelEducativo}
                            label="Nivel Educativo"
                            onChange={(e) => handleFieldChange(null, 'nivelEducativo', e.target.value)}
                          >
                            <MenuItem value="primaria">Primaria</MenuItem>
                            <MenuItem value="secundaria">Secundaria</MenuItem>
                            <MenuItem value="tecnico">Técnico</MenuItem>
                            <MenuItem value="universitario">Universitario</MenuItem>
                            <MenuItem value="postgrado">Postgrado</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Contexto Familiar
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Composición Familiar"
                          value={formData.contextoFamiliar.composicionFamiliar}
                          onChange={(e) => handleFieldChange('contextoFamiliar', 'composicionFamiliar', e.target.value)}
                          placeholder="Ej: Vive con esposa e hijos"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Apoyo Familiar"
                          value={formData.contextoFamiliar.apoyoFamiliar}
                          onChange={(e) => handleFieldChange('contextoFamiliar', 'apoyoFamiliar', e.target.value)}
                          placeholder="Ej: Recibe apoyo de la familia"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Observaciones"
                          value={formData.contextoFamiliar.observaciones}
                          onChange={(e) => handleFieldChange('contextoFamiliar', 'observaciones', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Contexto Laboral
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Tipo de Trabajo"
                          value={formData.contextoLaboral.tipoTrabajo}
                          onChange={(e) => handleFieldChange('contextoLaboral', 'tipoTrabajo', e.target.value)}
                          placeholder="Ej: Oficina, Construcción"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.contextoLaboral.ambienteRuido}
                              onChange={(e) => handleFieldChange('contextoLaboral', 'ambienteRuido', e.target.checked)}
                            />
                          }
                          label="Ambiente con Ruido"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.contextoLaboral.usoProteccionAuditiva}
                              onChange={(e) => handleFieldChange('contextoLaboral', 'usoProteccionAuditiva', e.target.checked)}
                            />
                          }
                          label="Usa Protección Auditiva"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Observaciones"
                          value={formData.contextoLaboral.observaciones}
                          onChange={(e) => handleFieldChange('contextoLaboral', 'observaciones', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Contexto Social
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Actividades Recreativas"
                          value={formData.contextoSocial.actividadesRecreativas.join(', ')}
                          onChange={(e) => handleFieldChange('contextoSocial', 'actividadesRecreativas', e.target.value.split(', ').filter(a => a.trim()))}
                          placeholder="Ej: Música, Deportes (separar por comas)"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Participación Social"
                          value={formData.contextoSocial.participacionSocial}
                          onChange={(e) => handleFieldChange('contextoSocial', 'participacionSocial', e.target.value)}
                          placeholder="Ej: Participa en grupos comunitarios"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Limitaciones"
                          value={formData.contextoSocial.limitaciones}
                          onChange={(e) => handleFieldChange('contextoSocial', 'limitaciones', e.target.value)}
                          placeholder="Ej: Dificultades para participar en reuniones"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Hábitos
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.habitos.tabaquismo.presente}
                                onChange={(e) => handleNestedFieldChange('habitos', 'tabaquismo', 'presente', e.target.checked)}
                              />
                            }
                            label="Tabaquismo"
                          />
                          {formData.habitos.tabaquismo.presente && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Frecuencia"
                                  value={formData.habitos.tabaquismo.frecuencia}
                                  onChange={(e) => handleNestedFieldChange('habitos', 'tabaquismo', 'frecuencia', e.target.value)}
                                  placeholder="Ej: Diario, ocasional"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Duración"
                                  value={formData.habitos.tabaquismo.duracion}
                                  onChange={(e) => handleNestedFieldChange('habitos', 'tabaquismo', 'duracion', e.target.value)}
                                  placeholder="Ej: 10 años"
                                />
                              </Grid>
                            </Grid>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.habitos.alcohol.presente}
                                onChange={(e) => handleNestedFieldChange('habitos', 'alcohol', 'presente', e.target.checked)}
                              />
                            }
                            label="Consumo de Alcohol"
                          />
                          {formData.habitos.alcohol.presente && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Frecuencia"
                                  value={formData.habitos.alcohol.frecuencia}
                                  onChange={(e) => handleNestedFieldChange('habitos', 'alcohol', 'frecuencia', e.target.value)}
                                  placeholder="Ej: Semanal, ocasional"
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Cantidad"
                                  value={formData.habitos.alcohol.cantidad}
                                  onChange={(e) => handleNestedFieldChange('habitos', 'alcohol', 'cantidad', e.target.value)}
                                  placeholder="Ej: 2-3 copas"
                                />
                              </Grid>
                            </Grid>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Otros Hábitos"
                          value={formData.habitos.otros}
                          onChange={(e) => handleFieldChange('habitos', 'otros', e.target.value)}
                          placeholder="Ej: Ejercicio regular, meditación"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                      Observaciones Generales
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.observacionesGenerales}
                      onChange={(e) => handleFieldChange(null, 'observacionesGenerales', e.target.value)}
                      placeholder="Notas adicionales sobre el paciente..."
                      disabled={readOnly}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {!readOnly && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveAnamnesisSocial}
                  sx={{ bgcolor: '#085946' }}
                >
                  Guardar Información
                </Button>
              </Box>
            )}
            </Box>
          )}

          {/* Tab 6: Interacciones (al final) */}
          {activeTab === 6 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#272F50' }}>
                Historial de Interacciones
              </Typography>
              {patientInteractions.length > 0 ? (
                <Box>
                  {patientInteractions.map((interaction) => {
                    const getIcon = () => {
                      switch (interaction.type) {
                        case 'call':
                          return <Call sx={{ fontSize: 20 }} />;
                        case 'message':
                          return <Message sx={{ fontSize: 20 }} />;
                        case 'email':
                          return <Mail sx={{ fontSize: 20 }} />;
                        case 'reminder':
                          return <Notifications sx={{ fontSize: 20 }} />;
                        case 'appointment':
                          return <CalendarToday sx={{ fontSize: 20 }} />;
                        default:
                          return <Note sx={{ fontSize: 20 }} />;
                      }
                    };

                    const getColor = () => {
                      switch (interaction.type) {
                        case 'call':
                          return interaction.direction === 'inbound' ? '#1976d2' : '#085946';
                        case 'message':
                          return '#25d366';
                        case 'email':
                          return '#ea4335';
                        case 'reminder':
                          return '#ff9800';
                        case 'appointment':
                          return '#7b1fa2';
                        default:
                          return '#86899C';
                      }
                    };

                    return (
                      <Card key={interaction.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: getColor(),
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getIcon()}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                  {interaction.title}
                                </Typography>
                                <Chip
                                  label={interaction.status === 'completed' ? 'Completado' : interaction.status === 'sent' ? 'Enviado' : interaction.status === 'scheduled' ? 'Programado' : interaction.status}
                                  size="small"
                                  color={
                                    interaction.status === 'completed' || interaction.status === 'sent' ? 'success' :
                                    interaction.status === 'scheduled' ? 'warning' :
                                    'default'
                                  }
                                />
                              </Box>
                              <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
                                {new Date(interaction.createdAt).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {interaction.channel && ` • ${interaction.channel === 'whatsapp' ? 'WhatsApp' : interaction.channel === 'sms' ? 'SMS' : interaction.channel === 'email' ? 'Email' : interaction.channel === 'phone' ? 'Teléfono' : interaction.channel}`}
                                {interaction.duration && ` • ${interaction.duration} min`}
                                {interaction.direction && ` • ${interaction.direction === 'inbound' ? 'Entrante' : 'Saliente'}`}
                              </Typography>
                              {interaction.description && (
                                <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                                  {interaction.description}
                                </Typography>
                              )}
                              {interaction.metadata && Object.keys(interaction.metadata).length > 0 && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                                  {interaction.metadata.phoneNumber && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                                      Teléfono: {interaction.metadata.phoneNumber}
                                    </Typography>
                                  )}
                                  {interaction.metadata.outcome && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                                      Resultado: {interaction.metadata.outcome}
                                    </Typography>
                                  )}
                                  {interaction.metadata.notes && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                                      Notas: {interaction.metadata.notes}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <History sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ color: '#86899C' }}>
                    No hay interacciones registradas
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 4: Productos */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50' }}>
                  Productos y Servicios
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ShoppingCart />}
                    onClick={() => {
                      const email = getPatientEmail();
                      console.log('[PatientProfileDialog] Abriendo cotización');
                      console.log('[PatientProfileDialog] Email del paciente:', email);
                      console.log('[PatientProfileDialog] formData:', formData);
                      console.log('[PatientProfileDialog] appointment:', appointment);
                      console.log('[PatientProfileDialog] lead:', lead);
                      console.log('[PatientProfileDialog] patientData que se pasará:', {
                        nombre: formData.nombre || appointment?.patientName || lead?.nombre,
                        email: formData.email || appointment?.patientEmail || lead?.email,
                        telefono: formData.telefono || appointment?.patientPhone || lead?.telefono,
                      });
                      setEditQuoteId(null);
                      setEditQuoteData(null);
                      setQuoteDialogOpen(true);
                    }}
                    sx={{ borderColor: '#085946', color: '#085946' }}
                  >
                    Nueva Cotización
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AttachMoney />}
                    onClick={() => {
                      console.log('[PatientProfileDialog] Abriendo venta, displayEmail:', displayEmail);
                      setSaleDialogOpen(true);
                    }}
                    sx={{ bgcolor: '#085946' }}
                  >
                    Nueva Venta
                  </Button>
                </Box>
              </Box>
              
              {/* Cotizaciones */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                  Cotizaciones ({patientProducts.filter(p => p.type === 'quote').length})
                </Typography>
                {patientProducts.filter(p => p.type === 'quote').length > 0 ? (
                  <Box>
                    {patientProducts.filter(p => p.type === 'quote').map((product) => (
                      <Card key={product.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                {product.productName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#86899C' }}>
                                {product.brand}
                                {product.metadata?.technology && ` - ${product.metadata.technology}`}
                                {product.metadata?.platform && ` (${product.metadata.platform})`}
                              </Typography>
                              {product.metadata?.technology && (
                                <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                                  Tecnología: {product.metadata.technology} | Plataforma: {product.metadata.platform || 'N/A'}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => setViewProductDialog({ open: true, product, type: 'quote' })}
                                sx={{ color: '#085946' }}
                                title="Ver cotización"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {product.status !== 'converted' && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditQuoteId(product.id);
                                    setEditQuoteData(product);
                                    setQuoteDialogOpen(true);
                                  }}
                                  sx={{ color: '#1976d2' }}
                                  title="Editar cotización"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  const res = await getQuoteHistory(product.id);
                                  if (res.success) setQuoteHistoryDialog({ open: true, quoteId: product.id, history: res.history || [], quote: res.quote });
                                  else setSnackbar({ open: true, message: res.error || 'Error al cargar historial', severity: 'error' });
                                }}
                                sx={{ color: '#e65100' }}
                                title="Ver historial"
                              >
                                <History fontSize="small" />
                              </IconButton>
                              <Chip
                                label={product.status === 'pending' ? 'Pendiente' : product.status === 'approved' ? 'Aprobada' : product.status === 'rejected' ? 'Rechazada' : product.status}
                                size="small"
                                color={
                                  product.status === 'approved' ? 'success' :
                                  product.status === 'rejected' ? 'error' :
                                  'warning'
                                }
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ color: '#86899C' }}>
                              Cantidad: {product.quantity} {product.quantity === 1 ? 'audífono' : 'audífonos'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#86899C' }}>
                              Valor Unitario: ${product.unitPrice?.toLocaleString() || '0'}
                            </Typography>
                            {product.discount > 0 && (
                              <Typography variant="body2" sx={{ color: '#c62828' }}>
                                Descuento: {product.discount}%
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#272F50' }}>
                              Valor Total: ${product.totalPrice?.toLocaleString() || '0'}
                            </Typography>
                          </Box>
                          {product.quoteDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mt: 1 }}>
                              Fecha: {new Date(product.quoteDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.metadata?.warrantyYears && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mt: 1 }}>
                              Garantía: {product.metadata.warrantyYears} {product.metadata.warrantyYears === 1 ? 'año' : 'años'}
                            </Typography>
                          )}
                          {product.metadata?.bondades && (
                            <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mb: 0.5, fontWeight: 600 }}>
                                Bondades:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#272F50' }}>
                                {product.metadata.bondades}
                              </Typography>
                            </Box>
                          )}
                          {product.metadata?.images && product.metadata.images.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mb: 1, fontWeight: 600 }}>
                                Imágenes del Producto:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {product.metadata.images.map((img, idx) => (
                                  <Paper
                                    key={idx}
                                    sx={{
                                      width: 100,
                                      height: 100,
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      border: '1px solid #e0e0e0',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        transition: 'transform 0.2s',
                                      },
                                    }}
                                    onClick={() => {
                                      // Abrir imagen en nueva ventana
                                      const newWindow = window.open();
                                      newWindow.document.write(`<img src="${img.data}" style="max-width: 100%; height: auto;" />`);
                                    }}
                                  >
                                    <img
                                      src={img.data}
                                      alt={img.name || `Imagen ${idx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                  </Paper>
                                ))}
                              </Box>
                            </Box>
                          )}
                          {product.notes && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              <strong>Notas:</strong> {product.notes}
                            </Typography>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<AttachMoney />}
                              onClick={() => handleConvertQuoteToSale(product.id)}
                              sx={{ bgcolor: '#085946' }}
                              size="small"
                            >
                              Venta Realizada
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#86899C', fontStyle: 'italic' }}>
                    No hay cotizaciones registradas
                  </Typography>
                )}
              </Box>

              {/* Ventas */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                  Ventas ({patientProducts.filter(p => p.type === 'sale').length})
                </Typography>
                {patientProducts.filter(p => p.type === 'sale').length > 0 ? (
                  <Box>
                    {patientProducts.filter(p => p.type === 'sale').map((product) => (
                      <Card key={product.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                {product.productName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#86899C' }}>
                                {product.brand}
                                {product.metadata?.technology && ` - ${product.metadata.technology}`}
                                {product.metadata?.platform && ` (${product.metadata.platform})`}
                              </Typography>
                              {product.metadata?.technology && (
                                <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                                  Tecnología: {product.metadata.technology} | Plataforma: {product.metadata.platform || 'N/A'}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              {(product.category || 'hearing-aid') === 'service' && (
                                <Chip label="Consulta" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                              )}
                              {(product.category || 'hearing-aid') === 'accessory' && (
                                <Chip label="Accesorio" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />
                              )}
                              {(product.category || 'hearing-aid') === 'hearing-aid' && (
                                <Chip label="Audífonos" size="small" sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }} />
                              )}
                              <IconButton
                                size="small"
                                onClick={() => setViewProductDialog({ open: true, product, type: 'sale' })}
                                sx={{ color: '#085946' }}
                                title="Ver venta"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <Chip
                                label={product.status === 'completed' ? 'Vendido' : product.status === 'delivered' ? 'Entregado' : product.status}
                                size="small"
                                color="success"
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ color: '#86899C' }}>
                              Cantidad: {(product.category || 'hearing-aid') === 'service'
                                ? '1 consulta'
                                : (product.category || 'hearing-aid') === 'accessory'
                                  ? `${product.quantity || 1} unidad${(product.quantity || 1) === 1 ? '' : 'es'}`
                                  : `${product.quantity || 1} ${(product.quantity || 1) === 1 ? 'audífono' : 'audífonos'}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#86899C' }}>
                              Valor Unitario: ${product.unitPrice?.toLocaleString() || '0'}
                            </Typography>
                            {product.discount > 0 && (
                              <Typography variant="body2" sx={{ color: '#c62828' }}>
                                Descuento: {product.discount}%
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#085946' }}>
                              Total: ${product.totalPrice?.toLocaleString() || '0'}
                            </Typography>
                          </Box>
                          {product.saleDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mt: 1 }}>
                              Fecha de Venta: {new Date(product.saleDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.adaptationDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              Fecha de Adaptación: {new Date(product.adaptationDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.metadata?.firstMaintenanceDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              Primer Mantenimiento: {new Date(product.metadata.firstMaintenanceDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.deliveryDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              Fecha de Entrega: {new Date(product.deliveryDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.metadata?.warrantyYears && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              Garantía: {product.metadata.warrantyYears} {product.metadata.warrantyYears === 1 ? 'año' : 'años'}
                            </Typography>
                          )}
                          {product.warrantyStartDate && product.warrantyEndDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              Período de Garantía: {new Date(product.warrantyStartDate).toLocaleDateString('es-ES')} - {new Date(product.warrantyEndDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.metadata?.bondades && (
                            <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mb: 0.5, fontWeight: 600 }}>
                                Bondades:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#272F50' }}>
                                {product.metadata.bondades}
                              </Typography>
                            </Box>
                          )}
                          {product.metadata?.accessories && product.metadata.accessories.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mb: 0.5 }}>
                                Accesorios:
                              </Typography>
                              {product.metadata.accessories.map((acc, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${acc.name} - $${acc.price?.toLocaleString() || '0'}`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                          {product.metadata?.comments && product.metadata.comments.length > 0 && (
                            <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mb: 1, fontWeight: 600 }}>
                                Comentarios:
                              </Typography>
                              {product.metadata.comments.map((comment, idx) => (
                                <Box key={idx} sx={{ mb: 1 }}>
                                  <Typography variant="body2" sx={{ color: '#272F50' }}>
                                    {comment.text}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#86899C' }}>
                                    {new Date(comment.date).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {product.notes && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              {product.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#86899C', fontStyle: 'italic' }}>
                    No hay ventas registradas
                  </Typography>
                )}
              </Box>

              {/* Adaptaciones */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                  Adaptaciones ({patientProducts.filter(p => p.type === 'adaptation').length})
                </Typography>
                {patientProducts.filter(p => p.type === 'adaptation').length > 0 ? (
                  <Box>
                    {patientProducts.filter(p => p.type === 'adaptation').map((product) => (
                      <Card key={product.id} sx={{ mb: 2, border: '1px solid #7b1fa2' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                {product.productName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#86899C' }}>
                                {product.brand} {product.model && `- ${product.model}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={product.status === 'adapted' ? 'Adaptado' : product.status}
                              size="small"
                              sx={{ bgcolor: '#7b1fa2', color: '#ffffff' }}
                            />
                          </Box>
                          {product.adaptationDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mt: 1 }}>
                              Fecha de Adaptación: {new Date(product.adaptationDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {product.notes && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              {product.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#86899C', fontStyle: 'italic' }}>
                    No hay adaptaciones registradas
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Tab 5: Mantenimientos */}
          {activeTab === 5 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#272F50' }}>
                Mantenimientos
              </Typography>

              {/* Próximos Mantenimientos */}
              {upcomingMaintenances.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#085946' }}>
                    Próximos Mantenimientos ({upcomingMaintenances.length})
                  </Typography>
                  {upcomingMaintenances.map((maintenance) => (
                    <Card key={maintenance.id} sx={{ mb: 2, border: '2px solid #085946' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                              {maintenance.type === 'cleaning' ? 'Limpieza' :
                               maintenance.type === 'repair' ? 'Reparación' :
                               maintenance.type === 'adjustment' ? 'Ajuste' :
                               maintenance.type === 'battery-replacement' ? 'Cambio de Batería' :
                               maintenance.type === 'check-up' ? 'Revisión' :
                               maintenance.type}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#86899C' }}>
                              {new Date(maintenance.scheduledDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                              {maintenance.scheduledTime && ` a las ${maintenance.scheduledTime}`}
                            </Typography>
                          </Box>
                          <Chip
                            label="Programado"
                            size="small"
                            sx={{ bgcolor: '#085946', color: '#ffffff' }}
                          />
                        </Box>
                        {maintenance.description && (
                          <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                            {maintenance.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Historial de Mantenimientos */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#272F50' }}>
                  Historial de Mantenimientos ({patientMaintenances.length})
                </Typography>
                {patientMaintenances.length > 0 ? (
                  <Box>
                    {patientMaintenances.map((maintenance) => (
                      <Card key={maintenance.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                {maintenance.type === 'cleaning' ? 'Limpieza' :
                                 maintenance.type === 'repair' ? 'Reparación' :
                                 maintenance.type === 'adjustment' ? 'Ajuste' :
                                 maintenance.type === 'battery-replacement' ? 'Cambio de Batería' :
                                 maintenance.type === 'check-up' ? 'Revisión' :
                                 maintenance.type}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#86899C' }}>
                                {maintenance.status === 'completed' && maintenance.completedDate
                                  ? `Completado: ${new Date(maintenance.completedDate).toLocaleDateString('es-ES')}`
                                  : `Programado: ${new Date(maintenance.scheduledDate).toLocaleDateString('es-ES')}`}
                                {maintenance.scheduledTime && ` ${maintenance.scheduledTime}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={maintenance.status === 'completed' ? 'Completado' : maintenance.status === 'cancelled' ? 'Cancelado' : maintenance.status === 'rescheduled' ? 'Re-programado' : 'Programado'}
                              size="small"
                              color={
                                maintenance.status === 'completed' ? 'success' :
                                maintenance.status === 'cancelled' ? 'error' :
                                maintenance.status === 'rescheduled' ? 'warning' :
                                'default'
                              }
                            />
                          </Box>
                          {maintenance.description && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              <strong>Descripción:</strong> {maintenance.description}
                            </Typography>
                          )}
                          {maintenance.workPerformed && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              <strong>Trabajo Realizado:</strong> {maintenance.workPerformed}
                            </Typography>
                          )}
                          {maintenance.cost > 0 && (
                            <Typography variant="body2" sx={{ color: '#085946', mt: 1, fontWeight: 600 }}>
                              Costo: ${maintenance.cost.toLocaleString()}
                            </Typography>
                          )}
                          {maintenance.nextMaintenanceDate && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C', mt: 1 }}>
                              Próximo Mantenimiento: {new Date(maintenance.nextMaintenanceDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                          {maintenance.notes && (
                            <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>
                              {maintenance.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Build sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#86899C' }}>
                      No hay mantenimientos registrados
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Tab 3: Citas (después de Anamnesis Social) */}
          {activeTab === 3 && (
            <Box>
              {/* Sub-tabs: Historial, Agendar Cita, Nueva Cita */}
              <Tabs
                value={appointmentsSubTab}
                onChange={(e, newValue) => setAppointmentsSubTab(newValue)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Historial de Consultas" />
                <Tab label="Agendar Cita" />
                <Tab label="Nueva Cita" />
              </Tabs>

              {/* Sub-tab 0: Historial de Consultas — todas las citas (agendadas, asistidas, no asistidas, re-agendadas, canceladas) */}
              {appointmentsSubTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#272F50' }}>
                        Historial de Consultas
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#86899C' }}>
                        Historial completo por ley y estadísticas. Solo las citas con icono de ojo son clicables para ver detalle (donde hay información registrada).
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<FileDownload />}
                        onClick={handleExportarHistorialCitas}
                        sx={{ borderColor: '#085946', color: '#085946' }}
                        disabled={patientAppointments.length === 0}
                      >
                        Exportar historial
                      </Button>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<FileDownload />}
                        onClick={handleOpenExportarHC}
                        sx={{ borderColor: '#085946', color: '#085946' }}
                        aria-controls={anchorElExportarHC ? 'menu-exportar-hc' : undefined}
                        aria-haspopup="true"
                        aria-expanded={!!anchorElExportarHC}
                      >
                        Exportar historia clínica
                      </Button>
                      <Menu
                        id="menu-exportar-hc"
                        anchorEl={anchorElExportarHC}
                        open={Boolean(anchorElExportarHC)}
                        onClose={handleCloseExportarHC}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <MenuItem onClick={handleExportarHistoriaClinicaExcel}>
                          <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
                          <ListItemText>Exportar como Excel</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleExportarHistoriaClinicaPDF}>
                          <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
                          <ListItemText>Exportar como PDF</ListItemText>
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>
                  {(() => {
                    const todasLasCitas = [...patientAppointments].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
                    const labelPorEstado = (s) => ({ confirmed: 'Agendada', completed: 'Asistida', 'no-show': 'No asistida', rescheduled: 'Re-agendada', cancelled: 'Cancelada', patient: 'Paciente' }[s] || s);
                    const colorPorEstado = (s) => ({ confirmed: 'primary', completed: 'success', 'no-show': 'warning', rescheduled: 'info', cancelled: 'error', patient: 'default' }[s] || 'default');
                    return todasLasCitas.length > 0 ? (
                      <Box>
                        {todasLasCitas.map((apt) => {
                          const consultation = patientConsultations.find((c) => c.appointmentId === apt.id);
                          const tieneInfo = !!consultation;
                          return (
                            <Card
                              key={apt.id}
                              sx={{
                                mb: 2,
                                cursor: tieneInfo ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                opacity: tieneInfo ? 1 : 0.85,
                                ...(tieneInfo && { '&:hover': { boxShadow: 3, bgcolor: 'rgba(8, 89, 70, 0.04)' } }),
                              }}
                              onClick={tieneInfo ? () => {
                                setHistConsultaSeleccionada({ consultation, appointment: apt });
                                setHistConsultaDetalleOpen(true);
                              } : undefined}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 1 }}>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                      {new Date(apt.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#86899C' }}>
                                      Hora: {apt.time}
                                      {apt.reason ? ` • ${apt.reason}` : ''}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip label={labelPorEstado(apt.status)} size="small" color={colorPorEstado(apt.status)} />
                                    {tieneInfo && <Visibility sx={{ color: '#085946', fontSize: 20 }} titleAccess="Ver detalle" />}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <CalendarToday sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          No hay citas en el historial. Use &quot;Agendar Cita&quot; o &quot;Nueva Cita&quot; para registrar.
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}

              {/* Sub-tab 1: Agendar Cita - formulario para crear/agendar cita (mismo contenido que era Nueva Cita) */}
              {appointmentsSubTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#272F50' }}>
                    Agendar Cita
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Selector de Tipo de Cita */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Cita *</InputLabel>
                        <Select
                          value={appointmentType}
                          onChange={(e) => {
                            setAppointmentType(e.target.value);
                            setAppointmentTime(''); // Resetear hora al cambiar tipo
                          }}
                          label="Tipo de Cita *"
                        >
                          {appointmentTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label} ({type.duration} minutos)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Calendario */}
                    {appointmentType && (
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            backgroundColor: '#ffffff',
                            border: '1px solid rgba(8, 89, 70, 0.1)',
                            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                          }}
                        >
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ color: '#085946' }} />
                            Selecciona Fecha
                          </Typography>
                          <DateSelector
                            selectedDate={appointmentDate}
                            onDateSelect={(date) => {
                              setAppointmentDate(date);
                              setAppointmentTime(''); // Resetear hora al cambiar fecha
                            }}
                          />
                        </Paper>
                      </Grid>
                    )}

                    {/* Selector de Hora */}
                    {appointmentDate && appointmentType && (
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            backgroundColor: '#ffffff',
                            border: '1px solid rgba(8, 89, 70, 0.1)',
                            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                            minHeight: '400px',
                          }}
                        >
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#272F50', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule sx={{ color: '#085946' }} />
                            Selecciona Hora
                          </Typography>
                          <TimeSelector
                            selectedDate={appointmentDate}
                            selectedTime={appointmentTime}
                            onTimeSelect={setAppointmentTime}
                            availableTimes={availableTimes}
                          />
                        </Paper>
                      </Grid>
                    )}

                    {/* Campo de motivo adicional (opcional) */}
                    {appointmentDate && appointmentTime && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Motivo o Notas Adicionales (Opcional)"
                          value={appointmentReason}
                          onChange={(e) => setAppointmentReason(e.target.value)}
                          multiline
                          rows={3}
                          placeholder="Agrega cualquier información adicional sobre esta cita..."
                        />
                      </Grid>
                    )}

                    {/* Botón de confirmación */}
                    {appointmentDate && appointmentTime && appointmentType && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setAppointmentDate('');
                              setAppointmentTime('');
                              setAppointmentType('');
                              setAppointmentReason('');
                              setAvailableTimes([]);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleCreateAppointmentFromProfile}
                            sx={{ bgcolor: '#085946' }}
                            startIcon={<CalendarToday />}
                          >
                            Confirmar Cita
                          </Button>
                        </Box>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Se enviarán recordatorios automáticos por email, WhatsApp y llamada 1 día antes de la cita.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Sub-tab 2: Nueva Cita - citas agendadas, solo botón Evolucionar */}
              {appointmentsSubTab === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#272F50' }}>
                    Nueva Cita
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86899C', mb: 3 }}>
                    Citas agendadas del paciente. Haga clic en &quot;Evolucionar&quot; para registrar la consulta en la historia clínica.
                  </Typography>
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const tieneEvolucion = (aptId) => patientConsultations.some((c) => c.appointmentId === aptId);
                    const citasAgendadas = patientAppointments.filter(
                      (apt) =>
                        ((apt.status === 'confirmed' || apt.status === 'rescheduled') && apt.date >= today) ||
                        (apt.status === 'completed' && apt.date === today && !tieneEvolucion(apt.id))
                    ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
                    return citasAgendadas.length > 0 ? (
                      <Box>
                        {citasAgendadas.map((apt) => {
                          const yaAsistida = apt.status === 'completed';
                          return (
                          <Card key={apt.id} sx={{ mb: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                                    {new Date(apt.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#86899C' }}>
                                    Hora: {apt.time} {apt.reason ? ` • ${apt.reason}` : ''}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={yaAsistida ? 'Asistida' : 'Agendada'}
                                  size="small"
                                  color={yaAsistida ? 'success' : 'primary'}
                                />
                              </Box>
                              {!readOnly && (
                                <Box sx={{ mt: 2 }}>
                                  <Button
                                    type="button"
                                    variant="contained"
                                    size="small"
                                    startIcon={<Assessment />}
                                    onClick={() => handleOpenEvolucionar(apt)}
                                    sx={{ bgcolor: '#085946' }}
                                  >
                                    Evolucionar
                                  </Button>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Schedule sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: '#86899C' }}>
                          No hay citas agendadas. Use &quot;Agendar Cita&quot; para programar una.
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f8fafc' }}>
        {isEditing && (
          <Button
            startIcon={<Save />}
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#085946' }}
          >
            Guardar Cambios
          </Button>
        )}
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>

      {/* Diálogos de Cotización y Venta */}
      <QuoteDialog
        open={quoteDialogOpen}
        onClose={() => {
          setQuoteDialogOpen(false);
          setEditQuoteId(null);
          setEditQuoteData(null);
        }}
        patientEmail={getPatientEmail()}
        onSuccess={handleQuoteSuccess}
        quoteId={editQuoteId}
        editQuote={editQuoteData}
        patientData={(() => {
          const data = {
            nombre: formData.nombre || appointment?.patientName || lead?.nombre,
            patientName: appointment?.patientName || lead?.nombre,
            email: formData.email || appointment?.patientEmail || lead?.email,
            telefono: formData.telefono || appointment?.patientPhone || lead?.telefono,
            patientPhone: appointment?.patientPhone || lead?.telefono,
          };
          console.log('[PatientProfileDialog] patientData que se pasa a QuoteDialog:', data);
          console.log('[PatientProfileDialog] formData:', formData);
          console.log('[PatientProfileDialog] appointment:', appointment);
          console.log('[PatientProfileDialog] lead:', lead);
          return data;
        })()}
      />
      <SaleDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
        patientEmail={getPatientEmail()}
        onSuccess={handleSaleSuccess}
        patientData={{
          nombre: formData.nombre || appointment?.patientName || lead?.nombre,
          patientName: appointment?.patientName || lead?.nombre,
          email: formData.email || appointment?.patientEmail || lead?.email,
          telefono: formData.telefono || appointment?.patientPhone || lead?.telefono,
          patientPhone: appointment?.patientPhone || lead?.telefono,
        }}
      />

      {/* Diálogo Ver cotización / Ver venta */}
      <Dialog
        open={viewProductDialog.open}
        onClose={() => setViewProductDialog({ open: false, product: null, type: null })}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <span>{viewProductDialog.type === 'quote' ? 'Ver cotización' : 'Ver venta'}</span>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Print />}
              endIcon={<ArrowDropDown />}
              onClick={(e) => setPrintMenuAnchor(e.currentTarget)}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              Imprimir / PDF
            </Button>
            <Menu
              anchorEl={printMenuAnchor}
              open={Boolean(printMenuAnchor)}
              onClose={() => setPrintMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { window.print(); setPrintMenuAnchor(null); }}>
                <ListItemIcon><Print fontSize="small" /></ListItemIcon>
                <ListItemText>Imprimir</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                if (printContentRef.current) {
                  html2pdf().set({ margin: 10, filename: `${viewProductDialog.type === 'quote' ? 'cotizacion' : 'venta'}-${viewProductDialog.product?.productName || 'documento'}.pdf` }).from(printContentRef.current).save();
                }
                setPrintMenuAnchor(null);
              }}
              >
                <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
                <ListItemText>Exportar a PDF</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {viewProductDialog.product && (
            <Box ref={printContentRef}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50' }}>
                    {viewProductDialog.product.productName}
                  </Typography>
                  {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'service' && (
                    <Chip label="Consulta" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                  )}
                  {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'accessory' && (
                    <Chip label="Accesorio" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />
                  )}
                  {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'hearing-aid' && (
                    <Chip label="Audífonos" size="small" sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }} />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: '#86899C' }}>
                  {viewProductDialog.product.brand}
                  {viewProductDialog.product.metadata?.technology && ` • ${viewProductDialog.product.metadata.technology}`}
                  {viewProductDialog.product.metadata?.platform && ` • ${viewProductDialog.product.metadata.platform}`}
                </Typography>
                {viewProductDialog.product.metadata?.technology && (
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.5 }}>
                    Tecnología: {viewProductDialog.product.metadata.technology} | Plataforma: {viewProductDialog.product.metadata.platform || 'N/A'}
                  </Typography>
                )}
                {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'service' && viewProductDialog.product.metadata?.descripcionConsulta && (
                  <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}>{viewProductDialog.product.metadata.descripcionConsulta}</Typography>
                )}
                {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'accessory' && viewProductDialog.product.metadata?.tipoAccesorio && !viewProductDialog.product.metadata?.accesoriosItems?.length && (
                  <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.5 }}>Tipo: {viewProductDialog.product.metadata.tipoAccesorio}</Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: '#86899C' }}>Cantidad</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'service'
                      ? '1 consulta'
                      : viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'accessory'
                        ? `${viewProductDialog.product.quantity || 1} unidad${(viewProductDialog.product.quantity || 1) === 1 ? '' : 'es'}`
                        : `${viewProductDialog.product.quantity || 1} ${(viewProductDialog.product.quantity || 1) === 1 ? 'audífono' : 'audífonos'}`}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: '#86899C' }}>Valor unitario</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ${viewProductDialog.product.unitPrice?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                {viewProductDialog.product.discount > 0 && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Descuento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#c62828' }}>
                      {viewProductDialog.product.discount}%
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: '#86899C' }}>Valor total</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#085946' }}>
                    ${viewProductDialog.product.totalPrice?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                {viewProductDialog.type === 'quote' && viewProductDialog.product.quoteDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.quoteDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && viewProductDialog.product.saleDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha de venta</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.saleDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && viewProductDialog.product.adaptationDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha de adaptación</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.adaptationDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && viewProductDialog.product.metadata?.firstControlDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha primer control</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.metadata.firstControlDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && viewProductDialog.product.metadata?.firstMaintenanceDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha primer mantenimiento</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.metadata.firstMaintenanceDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && viewProductDialog.product.deliveryDate && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Fecha de entrega</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(viewProductDialog.product.deliveryDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.product.metadata?.warrantyYears && (
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Garantía</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {viewProductDialog.product.metadata.warrantyYears} {viewProductDialog.product.metadata.warrantyYears === 1 ? 'año' : 'años'}
                    </Typography>
                  </Grid>
                )}
                {viewProductDialog.type === 'sale' && (viewProductDialog.product.warrantyStartDate || viewProductDialog.product.warrantyEndDate) && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#86899C' }}>Período de garantía / Fecha finalización</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {viewProductDialog.product.warrantyStartDate && viewProductDialog.product.warrantyEndDate
                        ? `${new Date(viewProductDialog.product.warrantyStartDate).toLocaleDateString('es-ES')} – ${new Date(viewProductDialog.product.warrantyEndDate).toLocaleDateString('es-ES')}`
                        : viewProductDialog.product.warrantyEndDate
                          ? `Fin: ${new Date(viewProductDialog.product.warrantyEndDate).toLocaleDateString('es-ES')}`
                          : `Inicio: ${new Date(viewProductDialog.product.warrantyStartDate).toLocaleDateString('es-ES')}`}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              {viewProductDialog.product.metadata?.bondades && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600 }}>Bondades</Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', mt: 0.5 }}>{viewProductDialog.product.metadata.bondades}</Typography>
                </Box>
              )}
              {viewProductDialog.type === 'sale' && viewProductDialog.product.metadata?.accessories?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600 }}>Accesorios</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {viewProductDialog.product.metadata.accessories.map((acc, idx) => (
                      <Chip key={idx} label={`${acc.name} - $${acc.price?.toLocaleString() || '0'}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Box>
              )}
              {viewProductDialog.type === 'sale' && (viewProductDialog.product.category || 'hearing-aid') === 'accessory' && viewProductDialog.product.metadata?.accesoriosItems?.length > 0 && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600 }}>Accesorios ({viewProductDialog.product.metadata.accesoriosItems.length})</Typography>
                  {viewProductDialog.product.metadata.accesoriosItems.map((it, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" sx={{ color: '#272F50' }}>{it.nombre} — {it.cantidad} × ${it.valorUnitario?.toLocaleString()}{it.descuento > 0 ? ` − ${it.descuento}%` : ''}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${it.subtotal?.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {viewProductDialog.type === 'sale' && viewProductDialog.product.metadata?.comments?.length > 0 && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600 }}>Comentarios</Typography>
                  {viewProductDialog.product.metadata.comments.map((c, idx) => (
                    <Box key={idx} sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: '#272F50' }}>{c.text}</Typography>
                      <Typography variant="caption" sx={{ color: '#86899C' }}>
                        {c.date ? new Date(c.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {viewProductDialog.product.metadata?.images?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600, display: 'block', mb: 1 }}>Imágenes del producto</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewProductDialog.product.metadata.images.map((img, idx) => (
                      <Paper
                        key={idx}
                        onClick={() => {
                          const w = window.open();
                          if (w) w.document.write(`<img src="${img.data}" style="max-width:100%;height:auto;" alt="${img.name || ''}" />`);
                        }}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.9 },
                        }}
                      >
                        <img src={img.data} alt={img.name || `Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
              {viewProductDialog.product.notes && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#86899C', fontWeight: 600 }}>Notas</Typography>
                  <Typography variant="body2" sx={{ color: '#272F50', mt: 0.5 }}>{viewProductDialog.product.notes}</Typography>
                </Box>
              )}
              {viewProductDialog.type === 'quote' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AttachMoney />}
                    onClick={() => {
                      setViewProductDialog({ open: false, product: null, type: null });
                      handleConvertQuoteToSale(viewProductDialog.product.id);
                    }}
                    sx={{ bgcolor: '#085946' }}
                    size="small"
                  >
                    Venta realizada
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            startIcon={<Close />}
            onClick={() => setViewProductDialog({ open: false, product: null, type: null })}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Historial de cotización */}
      <Dialog
        open={quoteHistoryDialog.open}
        onClose={() => setQuoteHistoryDialog({ open: false, quoteId: null, history: [], quote: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#e65100', color: '#ffffff', fontWeight: 700 }}>
          Historial de cambios de la cotización
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {quoteHistoryDialog.quote && (
            <Typography variant="body2" sx={{ mb: 2, color: '#272F50' }}>
              Cotización actual: {quoteHistoryDialog.quote.productName} — ${quoteHistoryDialog.quote.totalPrice?.toLocaleString() || '0'}
            </Typography>
          )}
          {quoteHistoryDialog.history.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#86899C' }}>
              No hay historial de cambios para esta cotización.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {quoteHistoryDialog.history.map((h, idx) => {
                const s = h.snapshot || {};
                const dateStr = h.createdAt ? new Date(h.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '';
                return (
                  <Paper key={h.id} sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 1 }}>
                      Versión {quoteHistoryDialog.history.length - idx} — {dateStr}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#272F50' }}>
                      {s.marca} · {s.cantidad} audífono{s.cantidad > 1 ? 's' : ''} · Valor: ${(s.valorTotal ?? 0).toLocaleString()} · Descuento: {s.descuento ?? 0}%
                    </Typography>
                    {s.notas && <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mt: 0.5 }}>{s.notas}</Typography>}
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuoteHistoryDialog({ open: false, quoteId: null, history: [], quote: null })} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Evolucionar consulta — formulario de historia clínica por tipo de cita */}
      <Dialog
        open={evolucionarDialogOpen}
        onClose={() => {
          setEvolucionarDialogOpen(false);
          setEvolucionarAppointment(null);
          setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
          setEvolucionarPrimeraVezStep('asistencia');
        }}
        maxWidth={
          evolucionarAppointment &&
          (evolucionarAppointment.appointmentType ?? appointmentTypes.find((t) => t.label === evolucionarAppointment.reason)?.value) === 'primera-vez' &&
          evolucionarPrimeraVezStep === 'form'
            ? 'lg'
            : 'sm'
        }
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Evolucionar consulta — {evolucionarAppointment && (evolucionarAppointment.appointmentType ?? appointmentTypes.find((t) => t.label === evolucionarAppointment.reason)?.value) === 'primera-vez' && evolucionarPrimeraVezStep === 'asistencia' ? 'Cita primera vez' : 'Historia clínica'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {evolucionarAppointment ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                {evolucionarAppointment.patientName} • {new Date(evolucionarAppointment.date + 'T00:00:00').toLocaleDateString('es-ES')} {evolucionarAppointment.time}
                {evolucionarAppointment.reason && ` • ${evolucionarAppointment.reason}`}
              </Alert>
              {(() => {
                const aptType = evolucionarAppointment.appointmentType ?? appointmentTypes.find((t) => t.label === evolucionarAppointment.reason)?.value ?? null;
                const isPrimeraVez = aptType === 'primera-vez';
                const showAsistenciaStep = isPrimeraVez && evolucionarPrimeraVezStep === 'asistencia';

                if (showAsistenciaStep) {
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                      <Typography variant="body1" sx={{ color: '#272F50', mb: 1 }}>
                        ¿El paciente asistió a la cita?
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button
                          type="button"
                          variant="contained"
                          size="large"
                          onClick={handleEvolucionarAsistio}
                          sx={{ bgcolor: '#2e7d32' }}
                          startIcon={<CheckCircle />}
                        >
                          Asistió
                        </Button>
                        <Button
                          type="button"
                          variant="outlined"
                          size="large"
                          color="error"
                          onClick={handleEvolucionarNoAsistio}
                          startIcon={<Cancel />}
                        >
                          No asistió
                        </Button>
                      </Box>
                    </Box>
                  );
                }

                const ClinicalHistoryForm = getClinicalHistoryForm(aptType);
                return (
                  <>
                    {ClinicalHistoryForm ? (
                      <Box sx={{ mb: 3 }}>
                        <ClinicalHistoryForm
                          data={evolucionarData.formData || {}}
                          onChange={(field, value) => setEvolucionarData((prev) => ({ ...prev, formData: { ...(prev.formData || {}), [field]: value } }))}
                          onNuevaCotizacion={isPrimeraVez ? () => { setEvolucionarDialogOpen(false); setEvolucionarAppointment(null); setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} }); setEvolucionarPrimeraVezStep('asistencia'); setEditQuoteId(null); setEditQuoteData(null); setQuoteDialogOpen(true); } : undefined}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        Sin formulario específico para este tipo de cita. Use las notas generales abajo.
                      </Typography>
                    )}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        Notas de la consulta
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Resumen o notas adicionales..."
                        value={evolucionarData.notes}
                        onChange={(e) => setEvolucionarData((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={evolucionarData.hearingLoss}
                            onChange={(e) => setEvolucionarData((prev) => ({ ...prev, hearingLoss: e.target.checked }))}
                            sx={{ color: '#085946', '&.Mui-checked': { color: '#085946' } }}
                          />
                        }
                        label="Paciente tiene pérdida auditiva confirmada"
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        Próximos pasos
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="Próximos pasos o recomendaciones..."
                        value={evolucionarData.nextSteps}
                        onChange={(e) => setEvolucionarData((prev) => ({ ...prev, nextSteps: e.target.value }))}
                      />
                    </Box>
                  </>
                );
              })()}
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
          {evolucionarAppointment && (evolucionarAppointment.appointmentType ?? appointmentTypes.find((t) => t.label === evolucionarAppointment.reason)?.value) === 'primera-vez' && evolucionarPrimeraVezStep === 'asistencia' ? (
            <Button
              onClick={() => {
                setEvolucionarDialogOpen(false);
                setEvolucionarAppointment(null);
                setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
                setEvolucionarPrimeraVezStep('asistencia');
              }}
              variant="outlined"
            >
              Cerrar
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEvolucionarDialogOpen(false);
                  setEvolucionarAppointment(null);
                  setEvolucionarData({ notes: '', hearingLoss: false, nextSteps: '', formData: {} });
                  setEvolucionarPrimeraVezStep('asistencia');
                }}
                variant="outlined"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveEvolucionar}
                sx={{ bgcolor: '#085946' }}
                startIcon={<CheckCircle />}
              >
                Guardar y marcar como asistida
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo Detalle de consulta (Historial — ver todo lo registrado) */}
      <Dialog
        open={histConsultaDetalleOpen}
        onClose={() => { setHistConsultaDetalleOpen(false); setHistConsultaSeleccionada(null); }}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Detalle de la consulta — Ver todo
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          {histConsultaSeleccionada ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                {histConsultaSeleccionada.appointment.patientName} • {new Date(histConsultaSeleccionada.appointment.date + 'T00:00:00').toLocaleDateString('es-ES')} {histConsultaSeleccionada.appointment.time}
                {histConsultaSeleccionada.appointment.reason && ` • ${histConsultaSeleccionada.appointment.reason}`}
              </Alert>

              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#272F50', mb: 0.5 }}>Estado de la cita</Typography>
                <Typography variant="body2" sx={{ color: '#272F50' }}>
                  {({ confirmed: 'Agendada', completed: 'Asistida', 'no-show': 'No asistida', rescheduled: 'Re-agendada', cancelled: 'Cancelada', patient: 'Paciente' })[histConsultaSeleccionada.appointment.status] || histConsultaSeleccionada.appointment.status}
                </Typography>
                {histConsultaSeleccionada.appointment.procedencia && (
                  <Typography variant="body2" sx={{ color: '#272F50', mt: 1 }}><strong>Procedencia:</strong> {formatProcedencia(histConsultaSeleccionada.appointment.procedencia)}</Typography>
                )}
              </Box>

              {!histConsultaSeleccionada.consultation ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Sin evolución registrada. Esta cita no tiene notas ni historia clínica guardada.
                </Alert>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#272F50', mb: 0.5 }}>Notas de la consulta</Typography>
                    <Typography variant="body2" sx={{ color: '#272F50', whiteSpace: 'pre-wrap' }}>{histConsultaSeleccionada.consultation.consultationNotes || '—'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#272F50', mb: 0.5 }}>Pérdida auditiva confirmada</Typography>
                    <Typography variant="body2" sx={{ color: '#272F50' }}>{histConsultaSeleccionada.consultation.hearingLoss === true ? 'Sí' : histConsultaSeleccionada.consultation.hearingLoss === false ? 'No' : '—'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#272F50', mb: 0.5 }}>Próximos pasos</Typography>
                    <Typography variant="body2" sx={{ color: '#272F50', whiteSpace: 'pre-wrap' }}>{histConsultaSeleccionada.consultation.nextSteps || '—'}</Typography>
                  </Box>
                </>
              )}

              {histConsultaSeleccionada.consultation && histConsultaSeleccionada.consultation.appointmentType === 'primera-vez' && histConsultaSeleccionada.consultation.formData && typeof histConsultaSeleccionada.consultation.formData === 'object' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#085946', mb: 2 }}>Historia clínica — Cita primera vez</Typography>
                  {[
                    { key: 'anamnesisClinica', title: '1. Anamnesis clínica', render: (fd) => fd.anamnesisClinica && (fd.anamnesisClinica.motivoConsulta || fd.anamnesisClinica.antecedentesMedicosResumen || fd.anamnesisClinica.desarrolloResumen || (fd.anamnesisClinica.sintomasAuditivos && (fd.anamnesisClinica.sintomasAuditivos.hipoacusia?.presente || fd.anamnesisClinica.sintomasAuditivos.acufeno?.presente))) ? ['Motivo: ' + (fd.anamnesisClinica.motivoConsulta || '—'), 'Antecedentes: ' + (fd.anamnesisClinica.antecedentesMedicosResumen || fd.anamnesisClinica.antecedentesOtorrinolaringologicos?.otros || '—'), 'Desarrollo: ' + (fd.anamnesisClinica.desarrolloResumen || '—'), fd.anamnesisClinica.antecedentesFamiliares?.hipoacusia?.familiar ? 'Ant. familiares: ' + fd.anamnesisClinica.antecedentesFamiliares.hipoacusia.familiar : null].filter(Boolean).join('\n\n') : null },
                    { key: 'anamnesisSocial', title: '2. Anamnesis social', render: (fd) => fd.anamnesisSocial && (fd.anamnesisSocial.estadoCivil || fd.anamnesisSocial.ocupacion || fd.anamnesisSocial.nivelEducativo || fd.anamnesisSocial.contextoFamiliar?.composicionFamiliar || fd.anamnesisSocial.contextoLaboral?.tipoTrabajo || fd.anamnesisSocial.habitos?.otros) ? ['Estado civil: ' + (fd.anamnesisSocial.estadoCivil || '—'), 'Ocupación: ' + (fd.anamnesisSocial.ocupacion || '—'), 'Nivel educativo: ' + (fd.anamnesisSocial.nivelEducativo || '—'), 'Contexto familiar: ' + (fd.anamnesisSocial.contextoFamiliar?.composicionFamiliar || '—'), 'Contexto laboral: ' + (fd.anamnesisSocial.contextoLaboral?.tipoTrabajo || '—'), fd.anamnesisSocial.contextoLaboral?.ambienteRuido ? 'Ambiente con ruido: Sí' : null, fd.anamnesisSocial.contextoLaboral?.usoProteccionAuditiva ? 'Usa protección auditiva: Sí' : null, 'Hábitos: ' + (fd.anamnesisSocial.habitos?.otros || '—')].filter(Boolean).join('\n') : null },
                    { key: 'audiograma', title: '3. Audiograma (audiometría)', render: (fd) => fd.audiograma && (fd.audiograma.od || fd.audiograma.oi || fd.audiograma.observaciones) ? fd : null },
                    { key: 'otoscopiaImpedanciometria', title: '4. Otoscopia e impedanciometría', render: (fd) => fd.otoscopiaImpedanciometria || null },
                    { key: 'logoaudiometria', title: '5. Logoaudiometría', render: (fd) => fd.logoaudiometria || null },
                    { key: 'pruebasAudifonos', title: '6. Pruebas de audífonos y resultados', render: (fd) => fd.pruebasAudifonos || null },
                    { key: 'informeMedico', title: '7. Informe médico', render: (fd) => fd.informeMedico || null },
                    { key: 'conclusiones', title: '8. Conclusiones', render: (fd) => fd.conclusiones || null },
                  ].map(({ key, title, render }) => {
                    const fd = histConsultaSeleccionada.consultation.formData;
                    const out = render(fd);
                    if (key === 'audiograma') {
                      const FREC = [250, 500, 1000, 2000, 4000, 8000];
                      const aud = (out && typeof out === 'object') ? out : {};
                      const hasData = FREC.some((f) => (aud.od && (aud.od[f] ?? aud.od[String(f)])) != null && (aud.od[f] ?? aud.od[String(f)]) !== '') || FREC.some((f) => (aud.oi && (aud.oi[f] ?? aud.oi[String(f)])) != null && (aud.oi[f] ?? aud.oi[String(f)]) !== '') || aud.observaciones;
                      return (
                        <Accordion key={key} defaultExpanded={hasData} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography></AccordionSummary>
                          <AccordionDetails>
                            {hasData ? (
                              <>
                                <Table size="small" sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                  <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Frecuencia (Hz)</TableCell>{FREC.map((f) => <TableCell key={f} align="center">{f}</TableCell>)}</TableRow></TableHead>
                                  <TableBody>
                                    <TableRow><TableCell sx={{ fontWeight: 600 }}>OD (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center">{aud.od?.[f] ?? aud.od?.[String(f)] ?? '—'}</TableCell>)}</TableRow>
                                    <TableRow><TableCell sx={{ fontWeight: 600 }}>OI (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center">{aud.oi?.[f] ?? aud.oi?.[String(f)] ?? '—'}</TableCell>)}</TableRow>
                                  </TableBody>
                                </Table>
                                {aud.observaciones && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{aud.observaciones}</Typography>}
                              </>
                            ) : <Typography variant="body2" sx={{ color: '#86899C' }}>—</Typography>}
                          </AccordionDetails>
                        </Accordion>
                      );
                    }
                    const text = typeof out === 'string' ? out : (out && typeof out === 'object' && key !== 'audiograma' ? null : null);
                    return (
                      <Accordion key={key} defaultExpanded={!!(text || (key === 'conclusiones'))} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography></AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ color: '#272F50', whiteSpace: 'pre-wrap' }}>{text || '—'}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {histConsultaSeleccionada.consultation && histConsultaSeleccionada.consultation.appointmentType === 'control' && histConsultaSeleccionada.consultation.formData && typeof histConsultaSeleccionada.consultation.formData === 'object' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#085946', mb: 2 }}>Historia clínica — Cita control</Typography>
                  {[
                    { key: 'motivoControl', title: '1. Motivo del control', field: 'motivoControl' },
                    { key: 'otoscopia', title: '2. Otoscopia (si se realizó)', field: 'otoscopia' },
                    { key: 'estadoGeneral', title: '3. Estado general — Audición/audífonos', field: 'estadoGeneral' },
                    { key: 'quejasSintomas', title: '3. Quejas o síntomas desde última visita', field: 'quejasSintomas' },
                    { key: 'ajustesIntervenciones', title: '4. Ajustes o intervenciones realizadas', field: 'ajustesIntervenciones' },
                    { key: 'conclusiones', title: '5. Conclusiones', field: 'conclusiones' },
                    { key: 'proximaCita', title: '5. Próxima cita o seguimiento', field: 'proximaCita' },
                  ].map(({ key, title, field }) => {
                    const v = histConsultaSeleccionada.consultation.formData[field];
                    if (v == null || v === '') return null;
                    return (
                      <Accordion key={key} defaultExpanded={key === 'motivoControl' || key === 'conclusiones'} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography></AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ color: '#272F50', whiteSpace: 'pre-wrap' }}>{String(v)}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {histConsultaSeleccionada.consultation && histConsultaSeleccionada.consultation.appointmentType === 'adaptacion' && histConsultaSeleccionada.consultation.formData && typeof histConsultaSeleccionada.consultation.formData === 'object' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#085946', mb: 2 }}>Historia clínica — Cita de adaptación</Typography>
                  {[
                    { key: 'motivoSeguimiento', title: '1. Motivo de la cita de seguimiento', field: 'motivoSeguimiento' },
                    { key: 'equipoEnAdaptacion', title: '1. Equipo en adaptación', field: 'equipoEnAdaptacion' },
                    { key: 'antecedentesDesdeUltima', title: '2. Antecedentes desde última cita', field: 'antecedentesDesdeUltima' },
                    { key: 'otoscopiaControl', title: '3. Otoscopia de control', field: 'otoscopiaControl' },
                    { key: 'usoDiario', title: '4. Uso de los audífonos', field: 'usoDiario' },
                    { key: 'toleraBien', title: '4. Tolera bien la amplificación', field: 'toleraBien', isBool: true },
                    { key: 'estadoAdaptacion', title: '5. Estado general de la adaptación', field: 'estadoAdaptacion' },
                    { key: 'molestiasReportadas', title: '6. Molestias y quejas reportadas', field: 'molestiasReportadas' },
                    { key: 'gananciaFuncional', title: '7. Ganancia funcional', field: 'gananciaFuncional' },
                    { key: 'verificacionVivo', title: '8. Verificación en vivo / mediciones', field: 'verificacionVivo' },
                    { key: 'ajustesProgramacion', title: '9. Ajustes de programación', field: 'ajustesProgramacion' },
                    { key: 'ajustesFisicos', title: '10. Ajustes físicos', field: 'ajustesFisicos' },
                    { key: 'ajustesRealizados', title: '11. Resumen de ajustes realizados', field: 'ajustesRealizados' },
                    { key: 'satisfaccion', title: '12. Satisfacción y observaciones', field: 'satisfaccion' },
                    { key: 'formacionReforzada', title: '13. Formación reforzada', field: 'formacionReforzada' },
                    { key: 'proximaCita', title: '14. Próxima cita / plan de seguimiento', field: 'proximaCita' },
                    { key: 'conclusiones', title: '15. Conclusiones de la cita de adaptación', field: 'conclusiones' },
                  ].map(({ key, title, field, isBool }) => {
                    const v = histConsultaSeleccionada.consultation.formData[field];
                    if (isBool) { if (v !== true && v !== false) return null; } else if (v == null || v === '') return null;
                    return (
                      <Accordion key={key} defaultExpanded={key === 'motivoSeguimiento' || key === 'conclusiones'} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography></AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ color: '#272F50', whiteSpace: 'pre-wrap' }}>{isBool ? (v ? 'Sí' : 'No') : String(v)}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}

              {(!histConsultaSeleccionada.consultation.formData || (histConsultaSeleccionada.consultation.appointmentType !== 'primera-vez' && histConsultaSeleccionada.consultation.appointmentType !== 'control' && histConsultaSeleccionada.consultation.appointmentType !== 'adaptacion')) && histConsultaSeleccionada.consultation.formData && typeof histConsultaSeleccionada.consultation.formData === 'object' && Object.keys(histConsultaSeleccionada.consultation.formData).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#085946', mb: 2 }}>Datos adicionales de la consulta</Typography>
                  {Object.entries(histConsultaSeleccionada.consultation.formData).map(([k, v]) => {
                    if (v == null || v === '') return null;
                    if (typeof v === 'object') return (
                      <Box key={k} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="overline" sx={{ color: '#085946', fontWeight: 600 }}>{String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</Typography>
                        <Typography variant="body2" sx={{ color: '#272F50', mt: 0.5, whiteSpace: 'pre-wrap' }}>{JSON.stringify(v, null, 2)}</Typography>
                      </Box>
                    );
                    return (
                      <Box key={k} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="overline" sx={{ color: '#085946', fontWeight: 600 }}>{String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</Typography>
                        <Typography variant="body2" sx={{ color: '#272F50', mt: 0.5, whiteSpace: 'pre-wrap' }}>{String(v)}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setHistConsultaDetalleOpen(false); setHistConsultaSeleccionada(null); }} variant="contained" sx={{ bgcolor: '#085946' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PatientProfileDialog;
