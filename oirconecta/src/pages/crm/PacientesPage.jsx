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
import PageHeader from '../../components/crm/ui/PageHeader';
import KpiCard from '../../components/crm/ui/KpiCard';
import SearchBar from '../../components/crm/ui/SearchBar';
import Toolbar from '../../components/crm/ui/Toolbar';
import DataTableCard from '../../components/crm/ui/DataTableCard';

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
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
      <PageHeader
        icon={People}
        title="Pacientes"
        subtitle="Gestiona la información de todos los pacientes del consultorio"
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* KPIs */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <KpiCard label="Total pacientes" value={patients.length} tone="success" />
          <KpiCard label="Citas como paciente" value={appointments.length} tone="info" />
          <KpiCard label="Promedio citas / paciente" value={avgCitas} tone="violet" />
        </Box>

        {/* Toolbar: búsqueda + contador */}
        <Toolbar
          left={
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre, cédula o teléfono…"
            />
          }
          right={
            <Box sx={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
              {filteredPatients.length} de {patients.length} pacientes
            </Box>
          }
        />

        {/* Tabla */}
        <DataTableCard>
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
        </DataTableCard>
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
