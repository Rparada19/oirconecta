import React, { useState, useEffect } from 'react';
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Assessment,
  ArrowBack,
  Download,
  CalendarToday,
  TrendingUp,
  People,
  CheckCircle,
} from '@mui/icons-material';
import { getAllAppointments } from '../../services/appointmentService';

const ReportesPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const allAppointments = getAllAppointments();
    setAppointments(allAppointments);
  }, []);

  const getFilteredAppointments = () => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
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

  const filteredAppointments = getFilteredAppointments();
  const confirmedAppointments = filteredAppointments.filter((apt) => apt.status === 'confirmed');
  const cancelledAppointments = filteredAppointments.filter((apt) => apt.status === 'cancelled');
  const uniquePatients = new Set(filteredAppointments.map((apt) => apt.patientEmail)).size;

  // Estadísticas por día de la semana
  const appointmentsByDay = {
    Lunes: 0,
    Martes: 0,
    Miércoles: 0,
    Jueves: 0,
    Viernes: 0,
  };

  filteredAppointments.forEach((apt) => {
    const date = new Date(apt.date + 'T00:00:00');
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    if (appointmentsByDay[dayName] !== undefined) {
      appointmentsByDay[dayName]++;
    }
  });

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
                Reportes y Estadísticas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Análisis y estadísticas del sistema
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#085946',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                Exportar
              </Button>
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
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Filtro de Período */}
        <Card
          sx={{
            mb: 4,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select value={period} label="Período" onChange={(e) => setPeriod(e.target.value)}>
                <MenuItem value="week">Última Semana</MenuItem>
                <MenuItem value="month">Último Mes</MenuItem>
                <MenuItem value="quarter">Último Trimestre</MenuItem>
                <MenuItem value="year">Último Año</MenuItem>
                <MenuItem value="all">Todo el Período</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Métricas Principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
              }}
            >
              <CalendarToday sx={{ fontSize: 40, color: '#085946', mb: 1 }} />
              <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                {filteredAppointments.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Total de Citas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
              }}
            >
              <CheckCircle sx={{ fontSize: 40, color: '#0a6b56', mb: 1 }} />
              <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                {confirmedAppointments.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Citas Confirmadas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
              }}
            >
              <People sx={{ fontSize: 40, color: '#272F50', mb: 1 }} />
              <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                {uniquePatients}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Pacientes Únicos
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
              }}
            >
              <TrendingUp sx={{ fontSize: 40, color: '#085946', mb: 1 }} />
              <Typography variant="h3" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                {filteredAppointments.length > 0
                  ? Math.round((confirmedAppointments.length / filteredAppointments.length) * 100)
                  : 0}
                %
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Tasa de Confirmación
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Distribución por Día */}
        <Card
          sx={{
            mb: 4,
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700, mb: 3 }}>
              Distribución de Citas por Día de la Semana
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Día</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#272F50' }} align="right">
                      Cantidad de Citas
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#272F50' }}>Porcentaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(appointmentsByDay).map(([day, count]) => (
                    <TableRow key={day}>
                      <TableCell sx={{ fontWeight: 500 }}>{day}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: 8,
                              bgcolor: '#f0f4f3',
                              borderRadius: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${filteredAppointments.length > 0 ? (count / filteredAppointments.length) * 100 : 0}%`,
                                height: '100%',
                                bgcolor: '#085946',
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                            {filteredAppointments.length > 0
                              ? Math.round((count / filteredAppointments.length) * 100)
                              : 0}
                            %
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Resumen de Cancelaciones */}
        <Card
          sx={{
            border: '1px solid rgba(8, 89, 70, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700, mb: 3 }}>
              Resumen de Cancelaciones
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#c62828', fontWeight: 700, mb: 0.5 }}>
                    {cancelledAppointments.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86899C' }}>
                    Citas Canceladas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700, mb: 0.5 }}>
                    {filteredAppointments.length > 0
                      ? Math.round((cancelledAppointments.length / filteredAppointments.length) * 100)
                      : 0}
                    %
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86899C' }}>
                    Tasa de Cancelación
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ReportesPage;
