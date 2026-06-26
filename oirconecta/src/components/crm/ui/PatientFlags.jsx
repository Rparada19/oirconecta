/**
 * Chip-cluster con alertas inteligentes para un paciente o lead.
 * Calcula automáticamente flags útiles a partir de los datos disponibles
 * (sin requerir backend nuevo).
 *
 * Flags posibles:
 *  - Sin contacto reciente (más de N días)
 *  - Cumpleaños esta semana
 *  - Garantía por vencer
 *  - Adaptación reciente (<30 días)
 *  - Lead caliente (interés explícito + contacto reciente)
 *  - VIP (más de X compras)
 */
import React from 'react';
import { Box } from '@mui/material';

const FLAG = {
  vip:        { label: 'VIP',                 bg: 'rgba(139,92,246,0.10)', fg: '#5b21b6' },
  caliente:   { label: 'Lead caliente',        bg: 'rgba(239,68,68,0.10)',  fg: '#b91c1c' },
  silencio:   { label: 'Sin contacto',         bg: 'rgba(245,158,11,0.10)', fg: '#b45309' },
  cumple:     { label: 'Cumple esta semana',   bg: 'rgba(236,72,153,0.10)', fg: '#9d174d' },
  garantia:   { label: 'Garantía por vencer',  bg: 'rgba(245,158,11,0.10)', fg: '#b45309' },
  reciente:   { label: 'Adaptación reciente',  bg: 'rgba(8,89,70,0.10)',    fg: '#065f46' },
  nuevo:      { label: 'Sin atender',          bg: 'rgba(59,130,246,0.10)', fg: '#1d4ed8' },
  reagendar:  { label: 'Reagendar',            bg: 'rgba(239,68,68,0.10)',  fg: '#b91c1c' },
};

function daysBetween(a, b) {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

function isBirthdayThisWeek(fechaNacimiento) {
  if (!fechaNacimiento) return false;
  const d = new Date(fechaNacimiento);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const next7 = new Date(); next7.setDate(today.getDate() + 7);
  const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  const nextYear = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return (thisYear >= today && thisYear <= next7) || (nextYear >= today && nextYear <= next7);
}

export function computePatientFlags(p = {}, opts = {}) {
  const today = new Date();
  const flags = [];

  // VIP: 3+ ventas o pacientes con varias citas
  if ((p.totalCitas || 0) >= 3 || (p.purchases || 0) >= 2) {
    flags.push('vip');
  }
  // Cumpleaños esta semana
  if (isBirthdayThisWeek(p.fechaNacimiento)) flags.push('cumple');

  // Sin contacto reciente (90 d desde última interacción/cita)
  const lastTouch = p.ultimaCita || p.lastContactAt || p.updatedAt;
  const days = daysBetween(lastTouch, today);
  if (days != null && days > 90) flags.push('silencio');

  // Garantía por vencer
  if (p.garantiaFin) {
    const d = daysBetween(today, p.garantiaFin);
    if (d != null && d >= 0 && d <= 60) flags.push('garantia');
  }

  // Adaptación reciente (<= 30 d)
  if (p.fechaAdaptacion) {
    const d = daysBetween(p.fechaAdaptacion, today);
    if (d != null && d >= 0 && d <= 30) flags.push('reciente');
  }

  return flags;
}

export function computeLeadFlags(l = {}) {
  const flags = [];
  const today = new Date();

  // Caliente: estado contactado/agendado + última actividad <= 3 d
  const last = l.updatedAt || l.fecha;
  const d = daysBetween(last, today);
  const estado = (l.estado || '').toLowerCase();
  if ((estado === 'contactado' || estado === 'agendado') && d != null && d <= 3) {
    flags.push('caliente');
  }
  // Sin atender: nuevo + más de 1 día sin contactar
  if (estado === 'nuevo' && d != null && d > 1) flags.push('nuevo');
  // Silencio: más de 7 d sin contacto y no convertido
  if (d != null && d > 7 && !['convertido','paciente','perdido'].includes(estado)) {
    flags.push('silencio');
  }
  return flags;
}

export default function PatientFlags({ flags = [], dense = false }) {
  if (!flags || flags.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {flags.map((f) => {
        const fl = FLAG[f];
        if (!fl) return null;
        return (
          <Box key={f} sx={{
            display: 'inline-flex', alignItems: 'center',
            px: 0.875, py: dense ? 0.125 : 0.25, borderRadius: 0.75,
            bgcolor: fl.bg, color: fl.fg,
            fontSize: dense ? 10 : 10.5, fontWeight: 700, letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>
            {fl.label}
          </Box>
        );
      })}
    </Box>
  );
}
