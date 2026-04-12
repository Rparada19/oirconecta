/**
 * Página de Reportes y Análisis
 * Tipos: Citas | Leads | Ventas | Agenda | Pacientes | Funnel
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Chip,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  PictureAsPdf,
  TableChart,
  CalendarToday,
  TrendingUp,
  People,
  CheckCircle,
  Cancel,
  EventBusy,
  PersonAdd,
  AttachMoney,
  Hearing,
  ShoppingCart,
  Schedule,
  Person,
  LocationOn,
  PhoneCallback,
} from '@mui/icons-material';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllLeadsCombined } from '../../services/leadService';
import { getAllPatientProducts, recordSale, updateSale } from '../../services/productService';
import { getPatients } from '../../services/patientService';
import { getConfig } from '../../services/configService';
import { formatProcedencia } from '../../utils/procedenciaUtils';
import { useAuth } from '../../context/AuthContext';
import { canRegisterSales } from '../../utils/rolePermissions';
import PatientProfileDialog from '../../components/patient/PatientProfileDialog';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const SLOTS_PER_DAY = 19;

const getDateRange = (period) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'month') start.setMonth(now.getMonth() - 1);
  else if (period === 'quarter') start.setMonth(now.getMonth() - 3);
  else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
  else if (period === 'all') start.setTime(0);
  return { start, end: now };
};

const filterByDate = (items, dateField, period) => {
  if (period === 'all') return items;
  const { start, end } = getDateRange(period);
  return items.filter((item) => {
    const d = item[dateField] ? new Date(String(item[dateField]).slice(0, 10) + 'T00:00:00') : null;
    return d && d >= start && d <= end;
  });
};

const getWorkingDays = (start, end) => {
  let count = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  while (d <= endDate) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const ReportesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSales = canRegisterSales(user?.role);
  const exportRef = useRef(null);
  const [exportAnchor, setExportAnchor] = useState(null);
  const tabIndices = canSales ? [0, 1, 2, 3, 4, 5] : [0, 1, 3, 4, 5];
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState({});
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileAppointment, setProfileAppointment] = useState(null);
  const [renovacionDialogOpen, setRenovacionDialogOpen] = useState(false);
  const [renovacionRow, setRenovacionRow] = useState(null);
  const [renovacionForm, setRenovacionForm] = useState({ fechaFinGarantia: '', marca: '', notas: '' });
  const [renovacionSaving, setRenovacionSaving] = useState(false);
  const [noComproSaving, setNoComproSaving] = useState(null); // saleId when saving "No compró"

  const loadData = async () => {
    setLoading(true);
    const [aptRes, leadsRes, prodRes, patientsRes] = await Promise.allSettled([
      getAllAppointments(),
      getAllLeadsCombined(),
      getAllPatientProducts(),
      getPatients({ limit: 500 }).then((r) => r.patients || []),
    ]);
    setAppointments(aptRes.status === 'fulfilled' ? (aptRes.value || []) : []);
    setLeads(leadsRes.status === 'fulfilled' ? (leadsRes.value || []) : []);
    setProducts(prodRes.status === 'fulfilled' ? (prodRes.value || {}) : {});
    setPatients(patientsRes.status === 'fulfilled' ? (patientsRes.value || []) : []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshProducts = async () => {
    const p = await getAllPatientProducts();
    setProducts(p || {});
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange(period);
  const workingDays = period === 'all' ? 365 : getWorkingDays(rangeStart, rangeEnd);
  const totalSlots = workingDays * SLOTS_PER_DAY;

  // Citas
  const aptsFiltered = filterByDate(appointments, 'date', period);
  const aptsByStatus = {
    confirmed: aptsFiltered.filter((a) => a.status === 'confirmed' || a.status === 'rescheduled'),
    completed: aptsFiltered.filter((a) => a.status === 'completed' || a.status === 'patient'),
    noShow: aptsFiltered.filter((a) => a.status === 'no-show'),
    cancelled: aptsFiltered.filter((a) => a.status === 'cancelled'),
  };
  const aptsByDay = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0, Sábado: 0, Domingo: 0 };
  aptsFiltered.forEach((a) => {
    const day = new Date(a.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
    if (aptsByDay[day] !== undefined) aptsByDay[day]++;
  });
  const profesionales = (getConfig().profesionales || []).filter((p) => p.activo);
  const aptsByProf = {};
  aptsFiltered.forEach((a) => {
    const id = a.professionalId || '_sin_asignar';
    aptsByProf[id] = (aptsByProf[id] || 0) + 1;
  });
  const aptsByProcedencia = {};
  aptsFiltered.forEach((a) => {
    const p = a.procedencia || 'visita-medica';
    aptsByProcedencia[p] = (aptsByProcedencia[p] || 0) + 1;
  });
  const uniquePatientsApt = new Set(aptsFiltered.filter((a) => a.patientEmail).map((a) => a.patientEmail)).size;

  // Leads
  const leadsFiltered = filterByDate(
    leads.map((l) => ({ ...l, fecha: l.fecha || l.createdAt?.slice?.(0, 10) })),
    'fecha',
    period
  );
  const leadsByEstado = { nuevo: 0, contactado: 0, convertido: 0 };
  leadsFiltered.forEach((l) => {
    const e = (l.estado || 'nuevo').toLowerCase();
    if (leadsByEstado[e] !== undefined) leadsByEstado[e]++;
    else leadsByEstado.nuevo++;
  });
  const leadsByProcedencia = {};
  leadsFiltered.forEach((l) => {
    const p = l.procedencia || 'visita-medica';
    leadsByProcedencia[p] = (leadsByProcedencia[p] || 0) + 1;
  });
  const convertidosCount = leadsFiltered.filter((l) => (l.estado || '').toLowerCase() === 'convertido' && l.appointmentId).length;

  // Ventas
  let allSales = [];
  Object.values(products).forEach((arr) => {
    (arr || []).forEach((p) => {
      if (p.type === 'sale') allSales.push(p);
    });
  });
  const salesFiltered = filterByDate(allSales, 'saleDate', period);
  const ventasPorProf = {};
  const ventasPorSede = {};
  const ventasPorProcedencia = {}; // { procedencia: { total, count } } para ASP
  const serviciosPorServicio = {};
  let valorTotal = 0;
  let factAudifonos = 0;
  let factConsultas = 0;
  let factAccesorios = 0;
  salesFiltered.forEach((s) => {
    valorTotal += s.totalPrice || 0;
    const profId = s.professionalId || s.metadata?.professionalId || '_sin_asignar';
    const sedeId = s.sedeId || s.metadata?.sedeId || '_sin_asignar';
    const proc = s.procedencia || 'visita-medica';
    ventasPorProf[profId] = (ventasPorProf[profId] || 0) + (s.totalPrice || 0);
    ventasPorSede[sedeId] = (ventasPorSede[sedeId] || 0) + (s.totalPrice || 0);
    if (!ventasPorProcedencia[proc]) ventasPorProcedencia[proc] = { total: 0, count: 0 };
    ventasPorProcedencia[proc].total += s.totalPrice || 0;
    ventasPorProcedencia[proc].count += 1;
    const cat = s.category || 'hearing-aid';
    if (cat === 'service') {
      factConsultas += s.totalPrice || 0;
      const serv = s.productName || s.metadata?.descripcionConsulta || 'Consulta';
      serviciosPorServicio[serv] = (serviciosPorServicio[serv] || 0) + 1;
    } else if (cat === 'hearing-aid') factAudifonos += s.totalPrice || 0;
    else if (cat === 'accessory') factAccesorios += s.totalPrice || 0;
  });

  // Cotizaciones (quotes)
  let allQuotes = [];
  Object.values(products).forEach((arr) => {
    (arr || []).forEach((p) => {
      if (p.type === 'quote') allQuotes.push(p);
    });
  });
  const quotesFiltered = filterByDate(allQuotes.map((q) => ({ ...q, quoteDate: q.quoteDate || q.createdAt?.slice?.(0, 10) })), 'quoteDate', period);
  const cotizacionesPorProductoMarca = {};
  quotesFiltered.forEach((q) => {
    const marca = q.brand || q.productName || 'Sin marca';
    cotizacionesPorProductoMarca[marca] = (cotizacionesPorProductoMarca[marca] || 0) + 1;
  });

  // Remisiones por médico (leads con medicoReferente)
  const remisionesPorMedico = {};
  leadsFiltered.filter((l) => l.medicoReferente && String(l.medicoReferente).trim()).forEach((l) => {
    const med = String(l.medicoReferente).trim();
    remisionesPorMedico[med] = (remisionesPorMedico[med] || 0) + 1;
  });

  // Agenda
  const ocupados = aptsFiltered.length;
  const pctOcupacion = totalSlots > 0 ? Math.round((ocupados / totalSlots) * 100) : 0;
  const pctLibre = totalSlots > 0 ? Math.round(((totalSlots - ocupados) / totalSlots) * 100) : 100;
  const sedes = getConfig().sedes || [];

  // Funnel
  const totalLeads = leads.length;
  const totalConCita = leads.filter((l) => l.appointmentId).length;
  const totalPacientes = leads.filter((l) => (l.estado || '').toLowerCase() === 'paciente' || (l.estado || '').toLowerCase() === 'convertido').length;
  const totalVentas = allSales.length;

  // Renovaciones en audiología: ventas de audífonos; excluir las ya gestionadas (renovationHandledAt)
  const patientsByEmail = {};
  (patients || []).forEach((p) => { patientsByEmail[(p.email || '').toLowerCase()] = p.nombre || p.email || ''; });
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  sixMonthsFromNow.setHours(23, 59, 59, 999);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const renovacionesList = allSales
    .filter((s) => (s.category || '') === 'hearing-aid' && !(s.metadata?.renovationHandledAt))
    .map((s) => {
      const warrantyEnd = s.warrantyEndDate ? new Date(String(s.warrantyEndDate).slice(0, 10)) : null;
      const listoParaRenovar = warrantyEnd && warrantyEnd.getTime() <= sixMonthsFromNow.getTime();
      return {
        id: s.id,
        patientEmail: s.patientEmail || '',
        patientName: patientsByEmail[(s.patientEmail || '').toLowerCase()] || s.patientEmail || '—',
        technology: s.metadata?.technology || s.model || '—',
        platform: s.metadata?.platform || '—',
        brand: s.brand || s.productName || '—',
        saleDate: s.saleDate || '—',
        warrantyEndDate: s.warrantyEndDate || '—',
        listoParaRenovar: !!listoParaRenovar,
        saleMetadata: s.metadata && typeof s.metadata === 'object' ? s.metadata : {},
        saleRef: s,
      };
    })
    .sort((a, b) => {
      if (a.listoParaRenovar !== b.listoParaRenovar) return a.listoParaRenovar ? -1 : 1;
      const da = a.warrantyEndDate !== '—' ? new Date(a.warrantyEndDate) : new Date(0);
      const db = b.warrantyEndDate !== '—' ? new Date(b.warrantyEndDate) : new Date(0);
      return da.getTime() - db.getTime();
    });

  const MetricCard = ({ icon: Icon, value, label, color = '#085946' }) => (
    <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 2, p: 2, textAlign: 'center', height: '100%' }}>
      <Icon sx={{ fontSize: 36, color, mb: 0.5 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#272F50' }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: '#86899C' }}>{label}</Typography>
    </Card>
  );

  const TableBar = ({ count, total }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 8, bgcolor: '#f0f4f3', borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, height: '100%', bgcolor: '#085946' }} />
      </Box>
      <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
        {total > 0 ? Math.round((count / total) * 100) : 0}%
      </Typography>
    </Box>
  );

  const tabNames = ['Citas', 'Leads', 'Ventas', 'Agenda', 'Pacientes', 'Funnel'];
  const tabConfig = [
    { icon: CalendarToday, label: 'Citas' },
    { icon: PersonAdd, label: 'Leads' },
    { icon: AttachMoney, label: 'Ventas' },
    { icon: Schedule, label: 'Agenda' },
    { icon: People, label: 'Pacientes' },
    { icon: TrendingUp, label: 'Funnel' },
  ];
  const realTab = tabIndices[activeTab] ?? 0;

  const handleExportExcel = () => {
    setExportAnchor(null);
    try {
    const wsData = [];
    if (realTab === 0) {
      wsData.push(['Reporte de Citas', ''], ['Período', period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Todo']);
      wsData.push([]);
      wsData.push(['Métrica', 'Valor']);
      wsData.push(['Total citas', aptsFiltered.length]);
      wsData.push(['Asistidas', aptsByStatus.completed.length]);
      wsData.push(['No asistidas', aptsByStatus.noShow.length]);
      wsData.push(['Canceladas', aptsByStatus.cancelled.length]);
      wsData.push(['Pacientes únicos', uniquePatientsApt]);
      wsData.push([]);
      wsData.push(['Citas por día', 'Cantidad', '%']);
      Object.entries(aptsByDay).forEach(([d, c]) => wsData.push([d, c, aptsFiltered.length ? Math.round((c / aptsFiltered.length) * 100) : 0]));
      wsData.push([]);
      wsData.push(['Citas por profesional', 'Cantidad']);
      Object.entries(aptsByProf).forEach(([id, c]) => wsData.push([id === '_sin_asignar' ? 'Sin asignar' : profesionales.find((p) => p.id === id)?.nombre || id, c]));
      wsData.push([]);
      wsData.push(['Procedencia', 'Cantidad', '%']);
      Object.entries(aptsByProcedencia).forEach(([p, c]) => wsData.push([formatProcedencia(p), c, aptsFiltered.length ? Math.round((c / aptsFiltered.length) * 100) : 0]));
    } else if (realTab === 1) {
      wsData.push(['Reporte de Leads', ''], ['Período', period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Todo']);
      wsData.push([]);
      wsData.push(['Métrica', 'Valor']);
      wsData.push(['Total leads', leadsFiltered.length]);
      wsData.push(['Convertidos a cita', convertidosCount]);
      wsData.push(['% Conversión', leadsFiltered.length ? Math.round((convertidosCount / leadsFiltered.length) * 100) : 0]);
      wsData.push([]);
      wsData.push(['Estado', 'Cantidad']);
      Object.entries(leadsByEstado).forEach(([e, c]) => wsData.push([e, c]));
      wsData.push([]);
      wsData.push(['Procedencia', 'Cantidad', '%']);
      Object.entries(leadsByProcedencia).forEach(([p, c]) => wsData.push([formatProcedencia(p), c, leadsFiltered.length ? Math.round((c / leadsFiltered.length) * 100) : 0]));
      wsData.push([]);
      wsData.push(['Remisiones por médico', 'Leads']);
      Object.entries(remisionesPorMedico).forEach(([med, c]) => wsData.push([med, c]));
    } else if (realTab === 2) {
      wsData.push(['Reporte de Ventas', ''], ['Período', period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Todo']);
      wsData.push([]);
      wsData.push(['Métrica', 'Valor']);
      wsData.push(['Valor total', valorTotal]);
      wsData.push(['Total ventas', salesFiltered.length]);
      wsData.push(['Audífonos', factAudifonos]);
      wsData.push(['Consultas', factConsultas]);
      wsData.push(['Accesorios', factAccesorios]);
      wsData.push([]);
      wsData.push(['Ventas por profesional', 'Valor']);
      Object.entries(ventasPorProf).forEach(([id, v]) => wsData.push([id === '_sin_asignar' ? 'Sin asignar' : profesionales.find((p) => p.id === id)?.nombre || id, v]));
      wsData.push([]);
      wsData.push(['Ventas por sede', 'Valor']);
      Object.entries(ventasPorSede).forEach(([id, v]) => wsData.push([id === '_sin_asignar' ? 'Sin asignar' : sedes.find((s) => s.id === id)?.nombre || id, v]));
      wsData.push([]);
      wsData.push(['Ventas por procedencia', 'Cantidad', 'Valor total', 'ASP']);
      Object.entries(ventasPorProcedencia).forEach(([p, d]) => wsData.push([formatProcedencia(p), d.count, d.total, d.count > 0 ? d.total / d.count : 0]));
      wsData.push([]);
      wsData.push(['Servicios por tipo', 'Cantidad']);
      Object.entries(serviciosPorServicio).forEach(([s, c]) => wsData.push([s, c]));
      wsData.push([]);
      wsData.push(['Cotizaciones por marca', 'Cantidad']);
      Object.entries(cotizacionesPorProductoMarca).forEach(([m, c]) => wsData.push([m, c]));
    } else if (realTab === 3) {
      wsData.push(['Reporte de Agenda', ''], ['Período', period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Todo']);
      wsData.push([]);
      wsData.push(['Métrica', 'Valor']);
      wsData.push(['Espacios totales', totalSlots]);
      wsData.push(['Ocupados', ocupados]);
      wsData.push(['% Ocupación', pctOcupacion]);
      wsData.push(['% Libre', pctLibre]);
      wsData.push([`Base: ${workingDays} días laborables × ${SLOTS_PER_DAY} slots/día`]);
      wsData.push([]);
      wsData.push(['Sede', 'Audiólogo', 'Citas']);
      sedes.forEach((sede) => {
        profesionales.filter((prof) => (prof.asignaciones || []).some((a) => a.sedeId === sede.id && a.activo !== false)).forEach((prof) => {
          const c = aptsFiltered.filter((a) => a.professionalId === prof.id).length;
          wsData.push([sede.nombre || sede.id, prof.nombre || prof.id, c]);
        });
      });
    } else if (realTab === 4) {
      wsData.push(['Reporte de Pacientes', ''], ['Período', period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Todo']);
      wsData.push([]);
      wsData.push(['Métrica', 'Valor']);
      wsData.push(['Pacientes únicos (citas)', uniquePatientsApt]);
      wsData.push(['Pacientes atendidos', aptsByStatus.completed.length]);
      wsData.push([]);
      wsData.push(['Procedencia', 'Cantidad']);
      Object.entries(aptsByProcedencia).forEach(([p, c]) => wsData.push([formatProcedencia(p), c]));
    } else if (realTab === 5) {
      wsData.push(['Reporte Funnel', ''], ['Métrica', 'Valor']);
      wsData.push(['Leads totales', totalLeads]);
      wsData.push(['Con cita agendada', totalConCita]);
      wsData.push(['% Conversión', totalLeads ? Math.round((totalConCita / totalLeads) * 100) : 0]);
      wsData.push(['Pacientes / Convertidos', totalPacientes]);
      wsData.push(['Ventas realizadas', totalVentas]);
    }
    if (wsData.length === 0) wsData.push(['Sin datos']);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    const sheetName = String(tabNames[realTab] || 'Reporte').replace(/[\\/:*?[\]]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `Reporte_${tabNames[realTab]}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('Error al exportar a Excel. Revisa la consola para más detalles.');
    }
  };

  const handleExportPdf = () => {
    setExportAnchor(null);
    const el = exportRef.current;
    if (!el) {
      alert('No se pudo obtener el contenido para exportar.');
      return;
    }
    try {
      const sheetName = String(tabNames[realTab] || 'Reporte').replace(/[\\/:*?[\]]/g, '_');
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Reporte_${sheetName}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4' },
      };
      html2pdf().set(opt).from(el).save().catch((err) => {
        console.error('Error exportando PDF:', err);
        alert('Error al exportar a PDF. Revisa la consola para más detalles.');
      });
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al exportar a PDF. Revisa la consola para más detalles.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#085946' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #085946 0%, #272F50 100%)', color: '#fff', py: 3, boxShadow: '0 4px 20px rgba(8,89,70,0.2)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Reportes y Análisis</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Análisis detallado del sistema</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Download />} onClick={(e) => setExportAnchor(e.currentTarget)} sx={{ bgcolor: '#fff', color: '#085946', '&:hover': { bgcolor: '#f5f5f5' } }}>
                Exportar
              </Button>
              <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <MenuItem onClick={handleExportPdf}>
                  <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Exportar a PDF" />
                </MenuItem>
                <MenuItem onClick={handleExportExcel}>
                  <ListItemIcon><TableChart fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Exportar a Excel" />
                </MenuItem>
              </Menu>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/portal-crm')} sx={{ borderColor: '#fff', color: '#fff' }}>
                Volver
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box ref={exportRef}>
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Período:</Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Período</InputLabel>
            <Select value={period} label="Período" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="week">Última semana</MenuItem>
              <MenuItem value="month">Último mes</MenuItem>
              <MenuItem value="quarter">Último trimestre</MenuItem>
              <MenuItem value="year">Último año</MenuItem>
              <MenuItem value="all">Todo</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          {tabIndices.map((idx) => {
            const TabIcon = tabConfig[idx].icon;
            return <Tab key={idx} icon={<TabIcon />} iconPosition="start" label={tabConfig[idx].label} />;
          })}
        </Tabs>

        {/* TAB CITAS */}
        {realTab === 0 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={CalendarToday} value={aptsFiltered.length} label="Total citas" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={CheckCircle} value={aptsByStatus.completed.length} label="Asistidas" color="#2e7d32" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={EventBusy} value={aptsByStatus.noShow.length} label="No asistidas" color="#e65100" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={Cancel} value={aptsByStatus.cancelled.length} label="Canceladas" color="#c62828" /></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={People} value={uniquePatientsApt} label="Pacientes únicos" /></Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard
                  icon={TrendingUp}
                  value={aptsFiltered.length > 0 ? Math.round((aptsByStatus.completed.length / aptsFiltered.length) * 100) : 0}
                  label="% Asistencia"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard
                  icon={TrendingUp}
                  value={aptsFiltered.length > 0 ? Math.round((aptsByStatus.cancelled.length / aptsFiltered.length) * 100) : 0}
                  label="% Cancelación"
                  color="#c62828"
                />
              </Grid>
            </Grid>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Citas por día de la semana</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Día</TableCell><TableCell align="right">Cantidad</TableCell><TableCell>%</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(aptsByDay).map(([d, c]) => (
                        <TableRow key={d}><TableCell>{d}</TableCell><TableCell align="right">{c}</TableCell><TableCell><TableBar count={c} total={aptsFiltered.length} /></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Citas por profesional</Typography>
                <Grid container spacing={2}>
                  {Object.entries(aptsByProf).map(([id, c]) => (
                    <Grid item xs={12} sm={6} md={4} key={id}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ color: '#86899C' }}>{id === '_sin_asignar' ? 'Sin asignar' : (profesionales.find((p) => p.id === id)?.nombre || id)}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{c}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Citas por procedencia</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Procedencia</TableCell><TableCell align="right">Cantidad</TableCell><TableCell>%</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(aptsByProcedencia).map(([p, c]) => (
                        <TableRow key={p}><TableCell>{formatProcedencia(p)}</TableCell><TableCell align="right">{c}</TableCell><TableCell><TableBar count={c} total={aptsFiltered.length} /></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB LEADS */}
        {realTab === 1 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={PersonAdd} value={leadsFiltered.length} label="Total leads" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={CheckCircle} value={convertidosCount} label="Convertidos a cita" color="#2e7d32" /></Grid>
              <Grid item xs={6} sm={3}>
                <MetricCard
                  icon={TrendingUp}
                  value={leadsFiltered.length > 0 ? Math.round((convertidosCount / leadsFiltered.length) * 100) : 0}
                  label="% Conversión"
                />
              </Grid>
            </Grid>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Leads por estado</Typography>
                <Grid container spacing={2}>
                  {Object.entries(leadsByEstado).map(([e, c]) => (
                    <Grid item xs={4} key={e}><Chip label={`${e}: ${c}`} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} /></Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Leads por procedencia</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Procedencia</TableCell><TableCell align="right">Cantidad</TableCell><TableCell>%</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(leadsByProcedencia).map(([p, c]) => (
                        <TableRow key={p}><TableCell>{formatProcedencia(p)}</TableCell><TableCell align="right">{c}</TableCell><TableCell><TableBar count={c} total={leadsFiltered.length} /></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Remisiones por médico</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Médico referente</TableCell><TableCell align="right">Leads</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(remisionesPorMedico).map(([med, c]) => (
                        <TableRow key={med}><TableCell>{med}</TableCell><TableCell align="right">{c}</TableCell></TableRow>
                      ))}
                      {Object.keys(remisionesPorMedico).length === 0 && (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ color: '#86899C' }}>Sin remisiones con médico referente en el período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB VENTAS */}
        {realTab === 2 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={AttachMoney} value={formatCurrency(valorTotal)} label="Valor total" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={ShoppingCart} value={salesFiltered.length} label="Ventas" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={Hearing} value={formatCurrency(factAudifonos)} label="Audífonos" color="#2e7d32" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={CalendarToday} value={formatCurrency(factConsultas)} label="Consultas" /></Grid>
            </Grid>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Ventas por profesional</Typography>
                <Grid container spacing={2}>
                  {Object.entries(ventasPorProf).map(([id, v]) => (
                    <Grid item xs={12} sm={6} md={4} key={id}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ color: '#085946', fontSize: 20 }} />
                          <Typography variant="body2">{id === '_sin_asignar' ? 'Sin asignar' : (profesionales.find((p) => p.id === id)?.nombre || id)}</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(v)}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Ventas por sede</Typography>
                <Grid container spacing={2}>
                  {Object.entries(ventasPorSede).map(([id, v]) => (
                    <Grid item xs={12} sm={6} md={4} key={id}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn sx={{ color: '#085946', fontSize: 20 }} />
                          <Typography variant="body2">{id === '_sin_asignar' ? 'Sin asignar' : (sedes.find((s) => s.id === id)?.nombre || id)}</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(v)}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Ventas por procedencia</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Procedencia</TableCell><TableCell align="right">Ventas</TableCell><TableCell align="right">Valor total</TableCell><TableCell align="right">ASP</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(ventasPorProcedencia).map(([p, d]) => (
                        <TableRow key={p}>
                          <TableCell>{formatProcedencia(p)}</TableCell>
                          <TableCell align="right">{d.count}</TableCell>
                          <TableCell align="right">{formatCurrency(d.total)}</TableCell>
                          <TableCell align="right">{d.count > 0 ? formatCurrency(d.total / d.count) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}># Servicios por tipo</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Servicio</TableCell><TableCell align="right">Cantidad</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(serviciosPorServicio).map(([s, c]) => (
                        <TableRow key={s}><TableCell>{s}</TableCell><TableCell align="right">{c}</TableCell></TableRow>
                      ))}
                      {Object.keys(serviciosPorServicio).length === 0 && (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ color: '#86899C' }}>Sin servicios facturados en el período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}># Cotizaciones por producto por marca</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Marca</TableCell><TableCell align="right">Cotizaciones</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(cotizacionesPorProductoMarca).map(([m, c]) => (
                        <TableRow key={m}><TableCell>{m}</TableCell><TableCell align="right">{c}</TableCell></TableRow>
                      ))}
                      {Object.keys(cotizacionesPorProductoMarca).length === 0 && (
                        <TableRow><TableCell colSpan={2} align="center" sx={{ color: '#86899C' }}>Sin cotizaciones en el período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Renovaciones en audiología: listado para llamar a renovar (rojo = vence en ≤6 meses) */}
            <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Hearing sx={{ color: '#085946', fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Renovaciones en audiología</Typography>
                    <Typography variant="body2" sx={{ color: '#86899C' }}>
                      Pacientes con audífonos vendidos. En <strong style={{ color: '#c62828' }}>rojo</strong>: garantía vence en 6 meses o menos — listos para llamar a renovar.
                    </Typography>
                  </Box>
                </Box>
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 640 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Paciente</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tecnología</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Plataforma</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Marca</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha compra</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Venc. garantía</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Estado</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Paciente compró</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {renovacionesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ color: '#86899C', py: 3 }}>
                            No hay ventas de audífonos pendientes de gestionar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        renovacionesList.map((r) => (
                          <TableRow
                            key={r.id}
                            sx={{
                              bgcolor: r.listoParaRenovar ? 'rgba(198, 40, 40, 0.08)' : undefined,
                              borderLeft: r.listoParaRenovar ? '4px solid #c62828' : '4px solid transparent',
                            }}
                          >
                            <TableCell sx={{ fontWeight: r.listoParaRenovar ? 600 : 400 }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => {
                                  setProfileAppointment({ patientEmail: r.patientEmail, patientName: r.patientName });
                                  setProfileDialogOpen(true);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  color: '#085946',
                                  fontWeight: 'inherit',
                                  p: 0,
                                  minWidth: 0,
                                  '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
                                }}
                              >
                                {r.patientName}
                              </Button>
                            </TableCell>
                            <TableCell>{r.technology}</TableCell>
                            <TableCell>{r.platform}</TableCell>
                            <TableCell>{r.brand}</TableCell>
                            <TableCell>{r.saleDate !== '—' ? new Date(r.saleDate).toLocaleDateString('es-ES') : '—'}</TableCell>
                            <TableCell>{r.warrantyEndDate !== '—' ? new Date(r.warrantyEndDate).toLocaleDateString('es-ES') : '—'}</TableCell>
                            <TableCell align="center">
                              {r.listoParaRenovar ? (
                                <Chip size="small" icon={<PhoneCallback sx={{ fontSize: 16 }} />} label="Listo para llamar" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} />
                              ) : (
                                <Chip size="small" label="Vigente" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={false}
                                      disabled={noComproSaving === r.id}
                                      onChange={() => {
                                        setRenovacionRow(r);
                                        setRenovacionForm({
                                          fechaFinGarantia: '',
                                          marca: r.brand !== '—' ? r.brand : '',
                                          notas: '',
                                        });
                                        setRenovacionDialogOpen(true);
                                      }}
                                      sx={{ color: '#085946', '&.Mui-checked': { color: '#085946' } }}
                                    />
                                  }
                                  label={<Typography variant="body2">Sí</Typography>}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={false}
                                      disabled={renovacionDialogOpen && renovacionRow?.id === r.id}
                                      onChange={async () => {
                                        setNoComproSaving(r.id);
                                        const res = await updateSale(r.id, {
                                          metadata: { ...r.saleMetadata, renovationHandledAt: new Date().toISOString(), renovationBought: false },
                                        });
                                        setNoComproSaving(null);
                                        if (res.success) await refreshProducts();
                                      }}
                                      sx={{ color: '#666', '&.Mui-checked': { color: '#c62828' } }}
                                    />
                                  }
                                  label={<Typography variant="body2">No</Typography>}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Diálogo: Paciente compró — registrar nueva venta con nuevas fechas de garantía */}
            <Dialog open={renovacionDialogOpen} onClose={() => { setRenovacionDialogOpen(false); setRenovacionRow(null); }} maxWidth="sm" fullWidth>
              <DialogTitle>Paciente compró — Registrar nueva venta</DialogTitle>
              <DialogContent>
                {renovacionRow && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#86899C' }}>
                      Se creará un nuevo registro de venta para {renovacionRow.patientName} con las nuevas fechas de garantía. El paciente saldrá del listado de renovaciones.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      label="Fecha fin garantía"
                      type="date"
                      required
                      value={renovacionForm.fechaFinGarantia}
                      onChange={(e) => setRenovacionForm((f) => ({ ...f, fechaFinGarantia: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Marca"
                      value={renovacionForm.marca}
                      onChange={(e) => setRenovacionForm((f) => ({ ...f, marca: e.target.value }))}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Notas"
                      multiline
                      rows={2}
                      value={renovacionForm.notas}
                      onChange={(e) => setRenovacionForm((f) => ({ ...f, notas: e.target.value }))}
                    />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => { setRenovacionDialogOpen(false); setRenovacionRow(null); }}>Cancelar</Button>
                <Button
                  variant="contained"
                  disabled={!renovacionForm.fechaFinGarantia || renovacionSaving}
                  sx={{ bgcolor: '#085946' }}
                  onClick={async () => {
                    if (!renovacionRow || !renovacionForm.fechaFinGarantia) return;
                    setRenovacionSaving(true);
                    const s = renovacionRow.saleRef;
                    const today = new Date().toISOString().slice(0, 10);
                    const res = await recordSale(renovacionRow.patientEmail, {
                      category: 'hearing-aid',
                      brand: renovacionForm.marca || s.brand || '',
                      model: s.model || '',
                      quantity: s.quantity ?? 1,
                      unitPrice: s.unitPrice ?? 0,
                      totalPrice: s.totalPrice ?? s.unitPrice ?? 0,
                      saleDate: today,
                      warrantyEndDate: renovacionForm.fechaFinGarantia,
                      adaptationDate: today,
                      notes: renovacionForm.notas || null,
                      metadata: {
                        technology: s.metadata?.technology || null,
                        platform: s.metadata?.platform || null,
                        warrantyYears: s.metadata?.warrantyYears ?? null,
                      },
                    });
                    if (res.success) {
                      await updateSale(renovacionRow.id, {
                        metadata: { ...renovacionRow.saleMetadata, renovationHandledAt: new Date().toISOString(), renovationBought: true },
                      });
                      await refreshProducts();
                      setRenovacionDialogOpen(false);
                      setRenovacionRow(null);
                      setRenovacionForm({ fechaFinGarantia: '', marca: '', notas: '' });
                    }
                    setRenovacionSaving(false);
                  }}
                >
                  {renovacionSaving ? 'Guardando…' : 'Crear nueva venta y quitar del listado'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* TAB AGENDA */}
        {realTab === 3 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={Schedule} value={totalSlots} label="Espacios totales" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={CheckCircle} value={ocupados} label="Ocupados" color="#2e7d32" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={TrendingUp} value={`${pctOcupacion}%`} label="% Ocupación" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={CalendarToday} value={`${pctLibre}%`} label="% Libre" color="#0a6b56" /></Grid>
            </Grid>
            <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
              Base: {workingDays} días laborables × {SLOTS_PER_DAY} slots/día
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Agenda por sede por audiólogo</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Sede</TableCell><TableCell>Audiologo/a</TableCell><TableCell align="right">Citas</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(() => {
                        const rows = sedes.flatMap((sede) =>
                          profesionales
                            .filter((prof) => (prof.asignaciones || []).some((a) => a.sedeId === sede.id && a.activo !== false))
                            .map((prof) => ({
                              sede: sede.nombre || sede.id,
                              prof: prof.nombre || prof.id,
                              c: aptsFiltered.filter((a) => a.professionalId === prof.id).length,
                              key: `${sede.id}-${prof.id}`,
                            }))
                        );
                        if (rows.length === 0) {
                          return (
                            <TableRow><TableCell colSpan={3} align="center" sx={{ color: '#86899C' }}>Sin datos. Configura sedes y profesionales con asignaciones.</TableCell></TableRow>
                          );
                        }
                        return rows.map((r) => (
                          <TableRow key={r.key}><TableCell>{r.sede}</TableCell><TableCell>{r.prof}</TableCell><TableCell align="right">{r.c}</TableCell></TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB PACIENTES */}
        {realTab === 4 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}><MetricCard icon={People} value={uniquePatientsApt} label="Pacientes únicos (citas)" /></Grid>
              <Grid item xs={6} sm={3}><MetricCard icon={People} value={aptsByStatus.completed.length} label="Pacientes atendidos" color="#2e7d32" /></Grid>
            </Grid>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pacientes por procedencia (desde citas)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Procedencia</TableCell><TableCell align="right">Cantidad</TableCell></TableRow></TableHead>
                    <TableBody>
                      {Object.entries(aptsByProcedencia).map(([p, c]) => (
                        <TableRow key={p}><TableCell>{formatProcedencia(p)}</TableCell><TableCell align="right">{c}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB FUNNEL */}
        {realTab === 5 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Funnel comercial</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Leads totales</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalLeads}</Typography>
                </Box>
              </Paper>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#86899C' }}>↓</Typography>
              <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Con cita agendada</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalConCita}</Typography>
                </Box>
                {totalLeads > 0 && <Typography variant="caption">{Math.round((totalConCita / totalLeads) * 100)}% conversión</Typography>}
              </Paper>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#86899C' }}>↓</Typography>
              <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Pacientes / Convertidos</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalPacientes}</Typography>
                </Box>
              </Paper>
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#86899C' }}>↓</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Ventas realizadas</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalVentas}</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
        </Box>
      </Container>

      <PatientProfileDialog
        open={profileDialogOpen}
        onClose={() => {
          setProfileDialogOpen(false);
          setProfileAppointment(null);
        }}
        appointment={profileAppointment}
      />
    </Box>
  );
};

export default ReportesPage;
