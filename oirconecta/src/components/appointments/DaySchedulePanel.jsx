/**
 * Panel de agenda del día: muestra todos los horarios con estado
 * (disponible, ocupado, bloqueado)
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { Schedule, Block, CheckCircle } from '@mui/icons-material';
import { getAvailableTimeSlots } from '../../services/appointmentService';
import { getAppointmentDuration } from '../../utils/appointmentDurations';

const ALL_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

const formatTime = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  const hour = h || 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(m || 0).padStart(2, '0')} ${period}`;
};

const DaySchedulePanel = ({
  date,
  appointments = [],
  getStatusChip,
  onAppointmentClick,
  formatDate,
  professionalId = null,
}) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateStr = date ? date.toISOString().split('T')[0] : '';

  useEffect(() => {
    if (!dateStr) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getAvailableTimeSlots(dateStr, '07:00', '18:00', professionalId)
      .then((slots) => {
        setAvailableSlots(slots || []);
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoading(false));
  }, [dateStr, professionalId]);

  const isSlotAvailable = (slot) => availableSlots.includes(slot);
  const getAppointmentAtSlot = (slot) =>
    appointments.find((a) => a.time === slot && a.status !== 'cancelled');

  const getSlotStatus = (slot) => {
    const apt = getAppointmentAtSlot(slot);
    if (apt) return { type: 'occupied', appointment: apt };
    if (isSlotAvailable(slot)) return { type: 'available' };
    // Si la API devolvió vacío (ej. error) y no hay citas, asumir disponible
    if (availableSlots.length === 0) return { type: 'available' };
    return { type: 'blocked' };
  };

  const availableCount = ALL_SLOTS.filter((s) => getSlotStatus(s).type === 'available').length;
  const occupiedCount = appointments.filter((a) => a.status !== 'cancelled').length;

  if (!date) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: '#ffffff',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Agenda del día — {formatDate(dateStr)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label={`${availableCount} disponibles`}
            size="small"
            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }}
          />
          <Chip
            icon={<Schedule sx={{ fontSize: 16 }} />}
            label={`${occupiedCount} ocupados`}
            size="small"
            sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }}
          />
        </Box>
      </Box>

      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} height={48} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <Table size="small">
            <TableBody>
              {ALL_SLOTS.map((slot) => {
                const { type, appointment } = getSlotStatus(slot);
                return (
                  <TableRow
                    key={slot}
                    sx={{
                      '&:hover': { bgcolor: type === 'occupied' ? 'rgba(8, 89, 70, 0.04)' : undefined },
                      cursor: type === 'occupied' ? 'pointer' : 'default',
                    }}
                    onClick={() => type === 'occupied' && onAppointmentClick?.(appointment)}
                  >
                    <TableCell
                      sx={{
                        width: 90,
                        fontWeight: 600,
                        color: '#475569',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      {formatTime(slot)}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: '1px solid #f1f5f9',
                        py: 1.5,
                      }}
                    >
                      {type === 'available' && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: '#16a34a',
                            fontWeight: 500,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#22c55e',
                            }}
                          />
                          Libre
                        </Box>
                      )}
                      {type === 'blocked' && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: '#b45309',
                            fontWeight: 500,
                          }}
                        >
                          <Block sx={{ fontSize: 18 }} />
                          Bloqueado
                        </Box>
                      )}
                      {type === 'occupied' && appointment && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'rgba(8, 89, 70, 0.06)',
                            border: '1px solid rgba(8, 89, 70, 0.15)',
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                              {appointment.patientName}
                            </Typography>
                            {(appointment.reason || appointment.motivo) && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#475569', mb: 0.5 }}>
                                {appointment.reason || appointment.motivo}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                              {getAppointmentDuration(appointment)} min
                            </Typography>
                          </Box>
                          {getStatusChip?.(appointment.status)}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc',
          display: 'flex',
          gap: 2,
          fontSize: '0.75rem',
          color: '#64748b',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
          Disponible para agendar
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />
          Bloqueado
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#085946' }} />
          Con cita (clic para ver)
        </Box>
      </Box>
    </Paper>
  );
};

export default DaySchedulePanel;
