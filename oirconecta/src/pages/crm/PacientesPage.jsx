import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  People,
  Search,
  Phone,
  Email,
  CalendarToday,
  ArrowBack,
  Visibility,
  LocationOn,
} from '@mui/icons-material';
import { getAllAppointments } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { formatProcedencia } from '../../utils/procedenciaUtils';
import PatientProfileDialog from '../../components/patient/PatientProfileDialog';

const PacientesPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientProfileDialogOpen, setPatientProfileDialogOpen] = useState(false);

  const loadPatientsList = useCallback(async () => {
    const emailNorm = (e) => (e || '').trim().toLowerCase();

    const fromApi = await getPatients({ limit: 500 }).catch((err) => {
      console.warn('[PacientesPage] getPatients error:', err);
      return { patients: [] };
    });
    const apiPatients = fromApi.patients || [];
    const apiList = apiPatients.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      email: p.email,
      telefono: p.telefono || '',
      totalCitas: 0,
      ultimaCita: '',
      procedencia: p.procedencia || 'visita-medica',
      primeraCita: '',
    }));

    const allAppointments = await getAllAppointments();
    const patientAppointments = allAppointments.filter((apt) => apt.status === 'patient');
    setAppointments(patientAppointments);
    const byEmailFromApts = new Map();
    patientAppointments.forEach((apt) => {
      const email = emailNorm(apt.patientEmail);
      if (!email) return;
      if (!byEmailFromApts.has(email)) {
        byEmailFromApts.set(email, {
          id: apt.patientEmail,
          nombre: apt.patientName,
          email: apt.patientEmail,
          telefono: apt.patientPhone || '',
          totalCitas: 1,
          ultimaCita: apt.date,
          procedencia: apt.procedencia || 'visita-medica',
          primeraCita: apt.date,
        });
      } else {
        const row = byEmailFromApts.get(email);
        row.totalCitas += 1;
        if (new Date(apt.date) > new Date(row.ultimaCita)) row.ultimaCita = apt.date;
        if (new Date(apt.date) < new Date(row.primeraCita)) row.primeraCita = apt.date;
      }
    });
    const fromAppointments = Array.from(byEmailFromApts.values());

    const seen = new Set(apiList.map((p) => emailNorm(p.email)));
    fromAppointments.forEach((p) => {
      if (!seen.has(emailNorm(p.email))) {
        seen.add(emailNorm(p.email));
        apiList.push(p);
      }
    });
    setPatients(apiList);
  }, []);

  useEffect(() => {
    loadPatientsList();
    const interval = setInterval(loadPatientsList, 30000);
    return () => clearInterval(interval);
  }, [loadPatientsList]);

  const filteredPatients = patients.filter(
    (patient) => {
      const term = (searchTerm || '').toLowerCase().trim();
      if (!term) return true;
      return (
        (patient.nombre || '').toLowerCase().includes(term) ||
        (patient.email || '').toLowerCase().includes(term) ||
        (patient.telefono || '').includes(searchTerm) ||
        (patient.numeroDocumento || '').includes(searchTerm)
      );
    }
  );

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    let patientAppointmentsList = appointments.filter((apt) => (apt.patientEmail || '').toLowerCase() === (patient.email || '').toLowerCase());
    if (patientAppointmentsList.length === 0) {
      const byEmail = await getAllAppointments({ patientEmail: patient.email });
      patientAppointmentsList = byEmail;
    }
    if (patientAppointmentsList.length > 0) {
      const sortedAppointments = [...patientAppointmentsList].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateB - dateA;
      });
      
      console.log('[PacientesPage] Cita seleccionada:', sortedAppointments[0]);
      setSelectedAppointment(sortedAppointments[0]);
    } else {
      // Si no hay cita, crear un objeto appointment básico desde los datos del paciente
      const fallbackAppointment = {
        id: `patient_${patient.email}`,
        patientName: patient.nombre,
        patientEmail: patient.email,
        patientPhone: patient.telefono,
        date: patient.ultimaCita || new Date().toISOString().split('T')[0],
        time: '10:00',
        status: 'patient',
        procedencia: patient.procedencia || 'visita-medica',
        reason: 'Paciente',
      };
      
      console.log('[PacientesPage] Creando appointment de respaldo:', fallbackAppointment);
      setSelectedAppointment(fallbackAppointment);
    }
    
    console.log('[PacientesPage] Abriendo PatientProfileDialog');
    setPatientProfileDialogOpen(true);
  };

  const avgCitas = patients.length > 0 ? Math.round(appointments.length / patients.length) : 0;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f2 0%, #f8fafc 100%)' }}>
      {/* Hero Header */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 60% at 5% 50%, rgba(13,122,92,0.38) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 80% at 95% 20%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(135deg, #063c2c 0%, #085946 40%, #1a2240 75%, #272F50 100%)',
        color: '#fff', pt: 4, pb: 4,
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5,
                borderRadius: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 1.5 }}>
                <People sx={{ fontSize: 14, color: 'rgba(255,255,255,0.80)' }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.80)' }}>PACIENTES</Typography>
              </Box>
              <Typography component="h1" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff' }}>
                Base de Datos de{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Pacientes
                </Box>
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.68)', fontSize: '0.9375rem' }}>
                Gestiona la información de todos los pacientes
              </Typography>
            </Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/portal-crm')}
              sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', px: 2.5, py: 1.25,
                borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.30)',
                background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)',
                '&:hover': { background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.50)' } }}>
              Portal
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: 'Total Pacientes', value: patients.length, gradient: 'linear-gradient(135deg,#0d7a5c,#085946)', glow: 'rgba(8,89,70,0.22)', icon: People },
            { label: 'Citas como Paciente', value: appointments.length, gradient: 'linear-gradient(135deg,#0284c7,#0369a1)', glow: 'rgba(2,132,199,0.22)', icon: People },
            { label: 'Promedio Citas/Paciente', value: avgCitas, gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)', glow: 'rgba(124,58,237,0.22)', icon: People },
          ].map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Box sx={{ p: 3, borderRadius: '8px',
                background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: '0 2px 16px rgba(8,89,70,0.06)',
                transition: 'all 0.28s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 14px 36px ${stat.glow}` },
                display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: stat.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: `0 6px 20px ${stat.glow}` }}>
                  <stat.icon sx={{ color: '#fff', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: '#0f1923', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#4a5568', fontWeight: 600 }}>{stat.label}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Search */}
        <Box sx={{ mb: 3, p: 2.5, borderRadius: '8px',
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 2px 12px rgba(8,89,70,0.06)' }}>
          <TextField fullWidth placeholder="Buscar por nombre, cédula o teléfono..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ color: '#085946' }} /></InputAdornment>) }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px',
              '&:hover fieldset': { borderColor: '#085946' },
              '&.Mui-focused fieldset': { borderColor: '#085946' } } }} />
        </Box>

        {/* Table */}
        <Box sx={{ borderRadius: '22px', overflow: 'hidden',
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
          {filteredPatients.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(8,89,70,0.04)' }}>
                    {['Paciente','Contacto','Procedencia','Total Citas','Última Cita',''].map((h) => (
                      <TableCell key={h} align={h === '' ? 'right' : 'left'}
                        sx={{ fontWeight: 700, color: '#272F50', fontSize: '0.75rem',
                          letterSpacing: '0.06em', textTransform: 'uppercase', py: 1.75, border: 'none' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}
                      sx={{ '&:hover': { bgcolor: 'rgba(8,89,70,0.025)' }, '& td': { border: 'none', py: 1.5 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 38, height: 38, bgcolor: '#085946', fontWeight: 700, fontSize: '0.9rem' }}>
                            {patient.nombre.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f1923' }}>{patient.nombre}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email sx={{ fontSize: 12 }} />{patient.email}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Phone sx={{ fontSize: 12 }} />{patient.telefono}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={formatProcedencia(patient.procedencia)} size="small"
                          sx={{ bgcolor: 'rgba(8,89,70,0.08)', color: '#085946', fontWeight: 600, borderRadius: '8px', fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={patient.totalCitas} size="small"
                          sx={{ bgcolor: 'rgba(8,89,70,0.10)', color: '#085946', fontWeight: 800, borderRadius: '8px', fontSize: '0.875rem', minWidth: 32 }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#4a5568' }}>
                          {new Date(patient.ultimaCita + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleViewDetails(patient)}
                          sx={{ color: '#085946', borderRadius: '10px', bgcolor: 'rgba(8,89,70,0.08)',
                            '&:hover': { bgcolor: 'rgba(8,89,70,0.16)' } }}>
                          <Visibility sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <People sx={{ fontSize: 56, color: 'rgba(8,89,70,0.15)', mb: 2 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', color: '#272F50', mb: 0.5 }}>
                No se encontraron pacientes
              </Typography>
              <Typography sx={{ color: '#86899C', fontSize: '0.875rem' }}>
                {searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'No hay pacientes registrados aún'}
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      <PatientProfileDialog
        open={patientProfileDialogOpen}
        onClose={() => {
          setPatientProfileDialogOpen(false);
          setSelectedPatient(null);
          setSelectedAppointment(null);
          // Refresca el listado al cerrar para reflejar cambios persistidos
          // sin tener que recargar la página.
          loadPatientsList();
        }}
        onSaved={loadPatientsList}
        appointment={selectedAppointment}
        patient={selectedPatient}
      />
    </Box>
  );
};

export default PacientesPage;
