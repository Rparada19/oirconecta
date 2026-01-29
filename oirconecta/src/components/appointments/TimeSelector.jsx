import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { AccessTime } from '@mui/icons-material';

const TimeSelector = ({ selectedDate, selectedTime, onTimeSelect, availableTimes }) => {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

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

  if (!selectedDate) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: '#86899C' }}>
          Por favor, selecciona una fecha primero
        </Typography>
      </Box>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccessTime sx={{ color: '#085946', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
            Selecciona una hora
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(8, 89, 70, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" sx={{ color: '#86899C', mb: 2 }}>
            No hay horarios disponibles para el {formatDate(selectedDate)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#A1AFB5' }}>
            Por favor, selecciona otra fecha
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AccessTime sx={{ color: '#085946', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
          Selecciona una hora
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(8, 89, 70, 0.1)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#86899C', mb: 3, textAlign: 'center' }}>
          {formatDate(selectedDate)}
        </Typography>

        <Grid container spacing={2}>
          {availableTimes.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <Grid item xs={6} sm={4} md={3} key={time}>
                <Box
                  onClick={() => onTimeSelect(time)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#085946' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#272F50',
                    border: isSelected ? 'none' : '1px solid rgba(8, 89, 70, 0.2)',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: isSelected ? '#085946' : '#f0f4f3',
                      transform: 'translateY(-2px)',
                      boxShadow: isSelected
                        ? '0 4px 12px rgba(8, 89, 70, 0.3)'
                        : '0 2px 8px rgba(39, 47, 80, 0.1)',
                    },
                  }}
                >
                  <Typography variant="body1">{formatTime(time)}</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {selectedTime && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f0f4f3', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: '#085946', fontWeight: 600 }}>
            Hora seleccionada: {formatTime(selectedTime)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TimeSelector;
