/**
 * Píldora de estado pequeña con color semántico.
 * tones: nuevo | contactado | agendado | convertido | perdido | paciente
 */
import React from 'react';
import { Box } from '@mui/material';

const PILLS = {
  // Leads
  nuevo:       { bg: 'rgba(59,130,246,0.10)',  fg: '#1d4ed8', label: 'Nuevo' },
  contactado:  { bg: 'rgba(245,158,11,0.10)',  fg: '#b45309', label: 'Contactado' },
  agendado:    { bg: 'rgba(124,58,237,0.10)',  fg: '#6d28d9', label: 'Agendado' },
  convertido:  { bg: 'rgba(16,185,129,0.10)',  fg: '#047857', label: 'Convertido' },
  perdido:     { bg: 'rgba(107,114,128,0.10)', fg: '#374151', label: 'Perdido' },
  paciente:    { bg: 'rgba(8,89,70,0.10)',     fg: '#065f46', label: 'Paciente' },
  // Citas
  confirmed:   { bg: 'rgba(16,185,129,0.10)',  fg: '#047857', label: 'Confirmada' },
  completed:   { bg: 'rgba(8,89,70,0.10)',     fg: '#065f46', label: 'Completada' },
  cancelled:   { bg: 'rgba(239,68,68,0.10)',   fg: '#b91c1c', label: 'Cancelada' },
  'no-show':   { bg: 'rgba(239,68,68,0.10)',   fg: '#b91c1c', label: 'No asistió' },
  rescheduled: { bg: 'rgba(245,158,11,0.10)',  fg: '#b45309', label: 'Reprogramada' },
  patient:     { bg: 'rgba(8,89,70,0.10)',     fg: '#065f46', label: 'Paciente' },
  // Genéricos
  activa:      { bg: 'rgba(16,185,129,0.10)',  fg: '#047857', label: 'Activa' },
  vencida:     { bg: 'rgba(239,68,68,0.10)',   fg: '#b91c1c', label: 'Vencida' },
  pendiente:   { bg: 'rgba(245,158,11,0.10)',  fg: '#b45309', label: 'Pendiente' },
};

export default function StatusPill({ status, label }) {
  const key = (status || '').toString().toLowerCase();
  const t = PILLS[key] || { bg: '#f3f4f6', fg: '#374151', label: status || '—' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 0.875, py: 0.25, borderRadius: 0.75,
      bgcolor: t.bg, color: t.fg,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: t.fg, flexShrink: 0 }} />
      {label || t.label}
    </Box>
  );
}
