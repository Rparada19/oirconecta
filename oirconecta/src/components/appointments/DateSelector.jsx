import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton, Button } from '@mui/material';
import { CalendarToday, ChevronLeft, ChevronRight, Today } from '@mui/icons-material';

const DateSelector = ({ selectedDate, onDateSelect, datesWithCounts = {}, allowAllDates = false }) => {
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
    if (!day) return;
    if (!allowAllDates && (isPast(day) || isWeekend(day))) return;
    onDateSelect(formatDate(day));
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

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    onDateSelect(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const hasAppointments = (day) => {
    if (!day) return 0;
    const dateStr = formatDate(day);
    return datesWithCounts[dateStr] || 0;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(8, 89, 70, 0.08)',
          boxShadow: '0 4px 24px rgba(8, 89, 70, 0.08), 0 0 0 1px rgba(8, 89, 70, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Header del calendario */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid rgba(8, 89, 70, 0.12)',
          }}
        >
          <IconButton
            onClick={goToPreviousMonth}
            size="small"
            sx={{
              color: '#085946',
              bgcolor: 'rgba(8, 89, 70, 0.06)',
              '&:hover': { bgcolor: '#085946', color: '#fff' },
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              color: '#272F50',
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              textTransform: 'capitalize',
            }}
          >
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Typography>
          <IconButton
            onClick={goToNextMonth}
            size="small"
            sx={{
              color: '#085946',
              bgcolor: 'rgba(8, 89, 70, 0.06)',
              '&:hover': { bgcolor: '#085946', color: '#fff' },
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Días de la semana */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 1,
          }}
        >
          {weekDays.map((d, i) => (
            <Typography
              key={d}
              variant="caption"
              sx={{
                textAlign: 'center',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                py: 1,
              }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* Días del mes - grid 7 columnas */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
          }}
        >
          {days.map((day, index) => (
            <Box key={`day-${index}`} sx={{ aspectRatio: '1', minHeight: 44 }}>
              {day ? (
                <Box
                  onClick={() => handleDateClick(day)}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: 44,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: !allowAllDates && (isPast(day) || isWeekend(day)) ? 'not-allowed' : 'pointer',
                    background: isSelected(day)
                      ? 'linear-gradient(135deg, #085946 0%, #0d7a63 100%)'
                      : isToday(day)
                      ? 'rgba(8, 89, 70, 0.08)'
                      : isWeekend(day)
                      ? 'rgba(0,0,0,0.02)'
                      : 'transparent',
                    color: isSelected(day)
                      ? '#fff'
                      : !allowAllDates && (isPast(day) || isWeekend(day))
                      ? '#94a3b8'
                      : isToday(day)
                      ? '#085946'
                      : isWeekend(day)
                      ? '#64748b'
                      : '#334155',
                    fontWeight: isSelected(day) ? 700 : isToday(day) ? 600 : 500,
                    border: isSelected(day)
                      ? 'none'
                      : isToday(day)
                      ? '2px solid #085946'
                      : '1px solid transparent',
                    opacity: isWeekend(day) && !allowAllDates ? 0.6 : 1,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': !allowAllDates && (isPast(day) || isWeekend(day))
                      ? {}
                      : {
                          background: isSelected(day)
                            ? 'linear-gradient(135deg, #0a6b56 0%, #0d7a63 100%)'
                            : 'rgba(8, 89, 70, 0.12)',
                          transform: 'scale(1.06)',
                          boxShadow: '0 2px 8px rgba(8, 89, 70, 0.2)',
                        },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      fontWeight: 'inherit',
                      color: 'inherit',
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </Typography>
                  {hasAppointments(day) > 0 && !isSelected(day) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.25,
                      }}
                    >
                      {[...Array(Math.min(hasAppointments(day), 3))].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: isToday(day) ? '#085946' : '#64748b',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {!allowAllDates && (isPast(day) || isWeekend(day)) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '15%',
                        right: '15%',
                        height: 1,
                        bgcolor: '#cbd5e1',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  )}
                </Box>
              ) : null}
            </Box>
          ))}
        </Box>

        {/* Acción: Ir a hoy */}
        <Button
          fullWidth
          size="small"
          startIcon={<Today />}
          onClick={goToToday}
          sx={{
            mt: 2,
            py: 1,
            color: '#085946',
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(8, 89, 70, 0.08)' },
          }}
        >
          Ir a hoy
        </Button>
      </Paper>

      {selectedDate && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(8, 89, 70, 0.06)',
            border: '1px solid rgba(8, 89, 70, 0.12)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#085946',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CalendarToday sx={{ fontSize: 18, opacity: 0.8 }} />
            {(() => {
              try {
                const date = new Date(selectedDate + 'T00:00:00');
                return date.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
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
