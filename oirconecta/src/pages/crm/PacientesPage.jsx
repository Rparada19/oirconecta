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

  useEffect(() => {
    const loadPatients = async () => {
      const allAppointments = await getAllAppointments();
      const patientAppointments = allAppointments.filter(
        (apt) => apt.status === 'patient'
      );
      
      console.log('[PacientesPage] Citas con estado "patient":', patientAppointments.length);
      
      setAppointments(patientAppointments);
      
      // Crear lista única de pacientes (solo los marcados explícitamente como paciente)
      const uniquePatients = [];
      const patientMap = new Map();
      
      patientAppointments.forEach((apt) => {
        if (!patientMap.has(apt.patientEmail)) {
          patientMap.set(apt.patientEmail, {
            id: apt.patientEmail,
            nombre: apt.patientName,
            email: apt.patientEmail,
            telefono: apt.patientPhone,
            totalCitas: 1,
            ultimaCita: apt.date,
            procedencia: apt.procedencia || 'visita-medica',
            primeraCita: apt.date,
          });
        } else {
          const patient = patientMap.get(apt.patientEmail);
          patient.totalCitas += 1;
          if (new Date(apt.date) > new Date(patient.ultimaCita)) {
            patient.ultimaCita = apt.date;
          }
          if (new Date(apt.date) < new Date(patient.primeraCita)) {
            patient.primeraCita = apt.date;
          }
        }
      });
      
      const patientsList = Array.from(patientMap.values());
      console.log('[PacientesPage] Total pacientes únicos:', patientsList.length);
      setPatients(patientsList);
    };
    
    loadPatients();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'oirconecta_appointments' || !e.key) {
        console.log('[PacientesPage] Cambio detectado en localStorage, recargando...');
        setTimeout(() => {
          loadPatients();
        }, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(loadPatients, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telefono.includes(searchTerm)
  );

  const handleViewDetails = (patient) => {
    console.log('[PacientesPage] handleViewDetails llamado para:', patient);
    setSelectedPatient(patient);
    
    // Buscar la cita más reciente del paciente para pasarla al perfil
    const patientAppointmentsList = appointments.filter((apt) => apt.patientEmail === patient.email);
    
    console.log('[PacientesPage] Citas encontradas para el paciente:', patientAppointmentsList.length);
    
    if (patientAppointmentsList.length > 0) {
      // Ordenar por fecha más reciente y tomar la primera
      const sortedAppointments = patientAppointmentsList.sort((a, b) => {
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
                Base de Datos de Pacientes
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Gestiona la información de todos los pacientes
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
        {/* Búsqueda */}
        <Card
          sx={{
            mb: 3,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar pacientes por nombre, email o teléfono..."
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
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                {patients.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Total de Pacientes
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                {appointments.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Citas como Paciente
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#0a6b56', fontWeight: 700 }}>
                {patients.length > 0
                  ? Math.round(
                      appointments.length / patients.length
                    )
                  : 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Promedio Citas/Paciente
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabla de Pacientes */}
        <Card
          sx={{
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {filteredPatients.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Paciente</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Contacto</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Procedencia</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Total Citas</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Última Cita</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="right">
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} hover>
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
                              {patient.nombre.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {patient.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              <Email sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                              {patient.email}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#86899C' }}>
                              <Phone sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                              {patient.telefono}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatProcedencia(patient.procedencia)}
                            size="small"
                            sx={{
                              bgcolor: '#f0f4f3',
                              color: '#085946',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={patient.totalCitas}
                            size="small"
                            sx={{
                              bgcolor: '#e8f5e9',
                              color: '#085946',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(patient.ultimaCita + 'T00:00:00').toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(patient)}
                            sx={{ color: '#085946' }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <People sx={{ fontSize: 64, color: '#86899C', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ color: '#272F50', mb: 1 }}>
                  No se encontraron pacientes
                </Typography>
                <Typography variant="body2" sx={{ color: '#86899C' }}>
                  {searchTerm
                    ? 'Intenta ajustar los términos de búsqueda'
                    : 'No hay pacientes registrados aún'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Dialog de Perfil Completo del Paciente */}
      <PatientProfileDialog
        open={patientProfileDialogOpen}
        onClose={() => {
          setPatientProfileDialogOpen(false);
          setSelectedPatient(null);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </Box>
  );
};

export default PacientesPage;
