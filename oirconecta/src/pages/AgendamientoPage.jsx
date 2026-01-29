import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Stepper, Step, StepLabel, Paper, Alert, Button, Grid } from '@mui/material';
import { CalendarToday, AccessTime, VerifiedUser, CheckCircle } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateSelector from '../components/appointments/DateSelector';
import TimeSelector from '../components/appointments/TimeSelector';
import PatientForm from '../components/appointments/PatientForm';
import AppointmentConfirmation from '../components/appointments/AppointmentConfirmation';
import { getAvailableTimeSlots, createAppointment } from '../services/appointmentService';

const steps = ['Fecha', 'Hora', 'Datos del Paciente', 'Confirmación'];

const AgendamientoPage = () => {
  console.log('AgendamientoPage renderizado');
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [patientData, setPatientData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: '',
    procedencia: 'visita-medica', // Valor por defecto estandarizado
  });
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cuando se selecciona una fecha, obtener los horarios disponibles
  useEffect(() => {
    if (selectedDate) {
      const times = getAvailableTimeSlots(selectedDate, '07:00', '18:00');
      setAvailableTimes(times);
      setSelectedTime(null); // Resetear hora seleccionada al cambiar fecha
    }
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setError(null);
    if (activeStep === 0) {
      setActiveStep(1);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setError(null);
    if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handlePatientDataChange = (field, value) => {
    setPatientData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleNext = () => {
    if (activeStep === 2) {
      // Validar datos del paciente antes de continuar
      if (!patientData.patientName || !patientData.patientEmail || !patientData.patientPhone) {
        setError('Por favor, completa todos los campos obligatorios');
        return;
      }
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const result = createAppointment({
      date: selectedDate,
      time: selectedTime,
      ...patientData,
      durationMinutes: 50, // Duración de la cita
    });

    setIsLoading(false);

    if (result.success) {
      setAppointment(result.appointment);
      setActiveStep(3);
    } else {
      setError(result.error || 'Error al agendar la cita');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setPatientData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      reason: '',
      procedencia: 'visita-medica',
    });
    setAppointment(null);
    setError(null);
    setAvailableTimes([]);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!selectedDate;
      case 1:
        return !!selectedTime;
      case 2:
        return !!patientData.patientName && !!patientData.patientEmail && !!patientData.patientPhone;
      default:
        return true;
    }
  };

  console.log('AgendamientoPage - Renderizando con activeStep:', activeStep);

  return (
    <>
      <Header />
      
      {/* Banner Principal */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #0a6b56 50%, #272F50 100%)',
          color: '#ffffff',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                  px: 2,
                  py: 0.75,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <VerifiedUser sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Sistema de Agendamiento Confiable
                </Typography>
              </Box>
              
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: { xs: '2.25rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 3,
                  lineHeight: 1.1,
                  color: '#ffffff',
                }}
              >
                Agenda tu Cita Médica
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  fontSize: { xs: '1.2rem', md: '1.6rem' },
                }}
              >
                Reserva tu consulta con nuestros especialistas en audición de forma rápida y sencilla
              </Typography>

              {/* Características rápidas */}
              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20, color: '#71A095' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Disponible 24/7
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ fontSize: 20, color: '#71A095' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Confirmación Inmediata
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser sx={{ fontSize: 20, color: '#71A095' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Sin Costos Ocultos
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: { xs: '100%', md: '350px' },
                    height: { xs: '280px', md: '380px' },
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  }}
                >
                  <CalendarToday sx={{ fontSize: { xs: 120, md: 150 }, opacity: 0.9, mb: 2 }} />
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 600,
                      textAlign: 'center',
                      fontSize: { xs: '1.1rem', md: '1.5rem' },
                    }}
                  >
                    Agendamiento Digital
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          pt: 6,
          pb: 8,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>

          {/* Stepper Mejorado */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(8, 89, 70, 0.1)',
              boxShadow: '0 4px 20px rgba(8, 89, 70, 0.08)',
            }}
          >
            <Stepper 
              activeStep={activeStep} alternativeLabel
              sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#085946',
                },
                '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel': {
                  color: '#085946',
                  fontWeight: 600,
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#085946',
                },
                '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel': {
                  color: '#085946',
                  fontWeight: 700,
                },
                '& .MuiStepLabel-root .Mui-active .MuiStepIcon-text': {
                  fill: '#ffffff',
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.95rem',
                        fontWeight: index === activeStep ? 700 : 500,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Contenido del paso actual */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(8, 89, 70, 0.1)',
              boxShadow: '0 8px 32px rgba(8, 89, 70, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(8, 89, 70, 0.12)',
              },
            }}
          >
            {activeStep === 0 && (
              <>
                <DateSelector selectedDate={selectedDate} onDateSelect={handleDateSelect} />
              </>
            )}

            {activeStep === 1 && (
              <TimeSelector
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                availableTimes={availableTimes}
              />
            )}

            {activeStep === 2 && (
              <PatientForm patientData={patientData} onDataChange={handlePatientDataChange} />
            )}

            {activeStep === 3 && appointment && (
              <AppointmentConfirmation appointment={appointment} onReset={handleReset} />
            )}

            {/* Botones de navegación */}
            {activeStep < 3 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Box>
                  {activeStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outlined"
                      sx={{
                        borderColor: '#085946',
                        borderWidth: 2,
                        color: '#085946',
                        px: 4,
                        py: 1.75,
                        fontWeight: 600,
                        fontSize: '1rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#085946',
                          borderWidth: 2,
                          bgcolor: '#f0f4f3',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Atrás
                    </Button>
                  )}
                </Box>
                <Box>
                  {activeStep < 2 && (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || isLoading}
                      variant="contained"
                      sx={{
                        bgcolor: canProceed() ? '#085946' : '#A1AFB5',
                        px: 4,
                        py: 1.75,
                        fontWeight: 700,
                        fontSize: '1rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: canProceed() ? '0 4px 16px rgba(8, 89, 70, 0.3)' : 'none',
                        '&:hover': {
                          bgcolor: canProceed() ? '#272F50' : '#A1AFB5',
                          transform: canProceed() ? 'translateY(-2px)' : 'none',
                          boxShadow: canProceed() ? '0 6px 20px rgba(8, 89, 70, 0.4)' : 'none',
                        },
                        '&:disabled': {
                          bgcolor: '#A1AFB5',
                          color: '#ffffff',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isLoading ? 'Procesando...' : 'Siguiente'}
                    </Button>
                  )}
                  {activeStep === 2 && (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || isLoading}
                      variant="contained"
                      sx={{
                        bgcolor: canProceed() ? '#085946' : '#A1AFB5',
                        px: 5,
                        py: 1.75,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: canProceed() ? '0 4px 16px rgba(8, 89, 70, 0.3)' : 'none',
                        '&:hover': {
                          bgcolor: canProceed() ? '#272F50' : '#A1AFB5',
                          transform: canProceed() ? 'translateY(-2px)' : 'none',
                          boxShadow: canProceed() ? '0 6px 20px rgba(8, 89, 70, 0.4)' : 'none',
                        },
                        '&:disabled': {
                          bgcolor: '#A1AFB5',
                          color: '#ffffff',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isLoading ? 'Agendando...' : 'Confirmar Cita'}
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Información adicional mejorada */}
          {activeStep < 3 && (
            <Box 
              sx={{ 
                mt: 4, 
                p: 4, 
                background: 'linear-gradient(135deg, #f0f4f3 0%, #e8f5e9 100%)',
                borderRadius: 3,
                border: '1px solid rgba(8, 89, 70, 0.1)',
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.05)',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#272F50', 
                  fontWeight: 700, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 24,
                    bgcolor: '#085946',
                    borderRadius: 1,
                  }}
                />
                Información Importante
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1" sx={{ color: '#272F50', mb: 1.5, fontWeight: 500 }}>
                  • Las citas tienen una duración de 50 minutos
                </Typography>
                <Typography variant="body1" sx={{ color: '#272F50', mb: 1.5, fontWeight: 500 }}>
                  • Horario disponible: Lunes a Jueves de 7:00 AM a 4:00 PM
                </Typography>
                <Typography variant="body1" sx={{ color: '#272F50', mb: 1.5, fontWeight: 500 }}>
                  • Horario Viernes: 7:00 AM a 3:00 PM
                </Typography>
                <Typography variant="body1" sx={{ color: '#272F50', mb: 1.5, fontWeight: 500 }}>
                  • Hora de almuerzo: 12:00 PM a 1:00 PM (no disponible)
                </Typography>
                <Typography variant="body1" sx={{ color: '#272F50', fontWeight: 500 }}>
                  • Los sábados y domingos no están disponibles para agendamiento
                </Typography>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default AgendamientoPage;
