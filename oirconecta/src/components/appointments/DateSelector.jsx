import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, IconButton } from '@mui/material';
import { CalendarToday, ChevronLeft, ChevronRight } from '@mui/icons-material';

const DateSelector = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Obtener el primer día del mes y cuántos días tiene
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { firstDay, lastDay, daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  // Generar array de días del mes
  const days = [];
  
  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = (day) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (day) => {
    if (!day) return false;
    try {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      return date < today;
    } catch (e) {
      return false;
    }
  };

  // Verificar si es fin de semana (sábado = 6, domingo = 0)
  const isWeekend = (day) => {
    if (!day) return false;
    try {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
    } catch (e) {
      return false;
    }
  };

  const formatDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const handleDateClick = (day) => {
    if (day && !isPast(day) && !isWeekend(day)) {
      onDateSelect(formatDate(day));
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const dateStr = formatDate(day);
    return dateStr === selectedDate;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalendarToday sx={{ color: '#085946', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
          Selecciona una fecha
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
          backgroundColor: '#ffffff',
          border: '1px solid rgba(8, 89, 70, 0.1)',
          boxShadow: '0 8px 32px rgba(8, 89, 70, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #085946 0%, #272F50 100%)',
          },
        }}
      >
        {/* Header del calendario mejorado */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '2px solid rgba(8, 89, 70, 0.1)',
          }}
        >
          <IconButton
            onClick={goToPreviousMonth}
            sx={{
              color: '#085946',
              bgcolor: '#f0f4f3',
              '&:hover': {
                backgroundColor: '#085946',
                color: '#ffffff',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#272F50', 
              fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
            }}
          >
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton
            onClick={goToNextMonth}
            sx={{
              color: '#085946',
              bgcolor: '#f0f4f3',
              '&:hover': {
                backgroundColor: '#085946',
                color: '#ffffff',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Días de la semana mejorados */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {weekDays.map((day, idx) => (
            <Grid item xs={12/7} key={`weekday-${idx}`}>
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  display: 'block',
                  color: '#272F50',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  py: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Días del mes */}
        <Grid container spacing={1.5}>
          {days.map((day, index) => (
            <Grid item xs={12/7} key={`day-${index}`} sx={{ minHeight: '70px' }}>
              {day ? (
                <Box
                  onClick={() => handleDateClick(day)}
                  sx={{
                    width: '100%',
                    minHeight: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    cursor: (isPast(day) || isWeekend(day)) ? 'not-allowed' : 'pointer',
                    backgroundColor: isSelected(day)
                      ? 'linear-gradient(135deg, #085946 0%, #272F50 100%)'
                      : isToday(day) && !isWeekend(day)
                      ? 'linear-gradient(135deg, #e8f5e9 0%, #f0f4f3 100%)'
                      : isWeekend(day)
                      ? '#fafafa'
                      : '#ffffff',
                    background: isSelected(day)
                      ? 'linear-gradient(135deg, #085946 0%, #272F50 100%)'
                      : isToday(day) && !isWeekend(day)
                      ? 'linear-gradient(135deg, #e8f5e9 0%, #f0f4f3 100%)'
                      : isWeekend(day)
                      ? '#fafafa'
                      : '#ffffff',
                    color: isSelected(day)
                      ? '#ffffff'
                      : isPast(day) || isWeekend(day)
                      ? '#A1AFB5'
                      : isToday(day)
                      ? '#085946'
                      : '#272F50',
                    fontWeight: isSelected(day) ? 700 : (isToday(day) && !isWeekend(day)) ? 600 : 500,
                    border: isSelected(day)
                      ? '2px solid #085946'
                      : isToday(day) && !isSelected(day) && !isWeekend(day) 
                      ? '2px solid #085946' 
                      : isWeekend(day)
                      ? '1px solid #e0e0e0'
                      : '1px solid #e0e0e0',
                    opacity: isWeekend(day) ? 0.5 : 1,
                    position: 'relative',
                    py: 1,
                    px: 0.5,
                    boxShadow: isSelected(day)
                      ? '0 4px 16px rgba(8, 89, 70, 0.3)'
                      : isToday(day) && !isWeekend(day)
                      ? '0 2px 8px rgba(8, 89, 70, 0.15)'
                      : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      backgroundColor: (isPast(day) || isWeekend(day))
                        ? (isWeekend(day) ? '#fafafa' : '#ffffff')
                        : isSelected(day)
                        ? 'linear-gradient(135deg, #085946 0%, #272F50 100%)'
                        : 'linear-gradient(135deg, #e8f5e9 0%, #f0f4f3 100%)',
                      background: (isPast(day) || isWeekend(day))
                        ? (isWeekend(day) ? '#fafafa' : '#ffffff')
                        : isSelected(day)
                        ? 'linear-gradient(135deg, #085946 0%, #272F50 100%)'
                        : 'linear-gradient(135deg, #e8f5e9 0%, #f0f4f3 100%)',
                      transform: (isPast(day) || isWeekend(day)) ? 'none' : 'scale(1.08) translateY(-2px)',
                      boxShadow: (isPast(day) || isWeekend(day)) 
                        ? 'none' 
                        : isSelected(day)
                        ? '0 6px 20px rgba(8, 89, 70, 0.4)'
                        : '0 4px 12px rgba(8, 89, 70, 0.2)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      component="span"
                      sx={{ 
                        fontSize: isSelected(day) ? '1.5rem' : '1.25rem',
                        fontWeight: isSelected(day) ? 700 : (isToday(day) && !isWeekend(day)) ? 600 : 500,
                        position: 'relative',
                        zIndex: 20,
                        lineHeight: 1,
                        color: 'inherit',
                      }}
                    >
                      {day}
                    </Typography>
                    {(isWeekend(day) || (isPast(day) && !isWeekend(day))) && (
                      <Box
                        component="span"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '10%',
                          right: '10%',
                          height: '3px',
                          backgroundColor: '#757575',
                          zIndex: 10,
                          opacity: 0.8,
                          transform: 'translateY(-50%)',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ minHeight: '70px', width: '100%' }} />
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {selectedDate && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 3, 
            background: 'linear-gradient(135deg, #e8f5e9 0%, #f0f4f3 100%)',
            borderRadius: 3,
            border: '2px solid #085946',
            boxShadow: '0 4px 16px rgba(8, 89, 70, 0.15)',
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#085946', 
              fontWeight: 700,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CalendarToday sx={{ fontSize: 24 }} />
            Fecha seleccionada: {(() => {
              try {
                const date = new Date(selectedDate + 'T00:00:00');
                return date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              } catch (e) {
                return selectedDate;
              }
            })()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DateSelector;
