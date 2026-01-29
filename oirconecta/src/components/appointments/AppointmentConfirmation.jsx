import React from 'react';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { CheckCircle, CalendarToday, AccessTime, Person, Email, Phone, Description } from '@mui/icons-material';

const AppointmentConfirmation = ({ appointment, onReset }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle sx={{ fontSize: 80, color: '#085946', mb: 2 }} />
        <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700, mb: 1 }}>
          ¡Cita Agendada Exitosamente!
        </Typography>
        <Typography variant="body1" sx={{ color: '#86899C' }}>
          Tu cita ha sido confirmada. Te hemos enviado un correo de confirmación.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(8, 89, 70, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600, mb: 3 }}>
          Detalles de tu Cita
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ color: '#085946' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                Fecha
              </Typography>
              <Typography variant="body1" sx={{ color: '#272F50', fontWeight: 600 }}>
                {formatDate(appointment.date)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTime sx={{ color: '#085946' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                Hora
              </Typography>
              <Typography variant="body1" sx={{ color: '#272F50', fontWeight: 600 }}>
                {formatTime(appointment.time)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person sx={{ color: '#085946' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                Paciente
              </Typography>
              <Typography variant="body1" sx={{ color: '#272F50', fontWeight: 600 }}>
                {appointment.patientName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Email sx={{ color: '#085946' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                Email
              </Typography>
              <Typography variant="body1" sx={{ color: '#272F50' }}>
                {appointment.patientEmail}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Phone sx={{ color: '#085946' }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                Teléfono
              </Typography>
              <Typography variant="body1" sx={{ color: '#272F50' }}>
                {appointment.patientPhone}
              </Typography>
            </Box>
          </Box>

          {appointment.reason && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Description sx={{ color: '#085946', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#86899C', display: 'block' }}>
                  Motivo
                </Typography>
                <Typography variant="body1" sx={{ color: '#272F50' }}>
                  {appointment.reason}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 1 }}>
              ID de Cita
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#272F50',
                fontFamily: 'monospace',
                backgroundColor: '#ffffff',
                p: 1,
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {appointment.id}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f0f4f3', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: '#272F50', mb: 2 }}>
          <strong>Importante:</strong>
        </Typography>
        <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
          • Llegar 15 minutos antes de la hora agendada
        </Typography>
        <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
          • Traer documento de identidad
        </Typography>
        <Typography variant="body2" sx={{ color: '#86899C' }}>
          • Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación
        </Typography>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={onReset}
          sx={{
            bgcolor: '#085946',
            '&:hover': {
              bgcolor: '#272F50',
            },
            px: 4,
            py: 1.5,
          }}
        >
          Agendar Otra Cita
        </Button>
      </Box>
    </Box>
  );
};

export default AppointmentConfirmation;
