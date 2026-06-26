/**
 * Fila clickeable de una acción/tarea del día.
 * Layout: punto-color · avatar inicial · título + meta · chips · CTA inline.
 */

import React from 'react';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { OC_COLORS } from '../../../theme';

const TYPE_CHIP = {
  cita_agenda: { label: 'Cita', tone: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  consumibles: { label: 'Consumible', tone: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  garantia:    { label: 'Garantía', tone: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  reminder:    { label: 'Recordatorio', tone: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
};

function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

function relativeDateLabel(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${String(dateStr).slice(0,10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const ms = target - today;
  const days = Math.round(ms / (24*3600*1000));
  if (days === 0) return { text: 'Hoy', tone: '#085946' };
  if (days === 1) return { text: 'Mañana', tone: '#3b82f6' };
  if (days < 0)   return { text: `Hace ${Math.abs(days)} d`, tone: '#ef4444' };
  return { text: `En ${days} d`, tone: '#6b7280' };
}

export default function ActionRow({
  action,
  onOpen,
  onOpenPatient,
  rightExtra,
  dense = false,
}) {
  const type = TYPE_CHIP[action.type] || { label: 'Acción', tone: OC_COLORS.grisMedio, bg: '#f3f4f6' };
  const dateChip = relativeDateLabel(action.dueDate);
  const resolved = Boolean(action.resolvedAt);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen && onOpen(action)}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) onOpen(action); }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: dense ? 1.25 : 1.5,
        bgcolor: '#fff', border: '1px solid #eef0f2', borderRadius: 1.5,
        cursor: onOpen ? 'pointer' : 'default',
        opacity: resolved ? 0.55 : 1,
        transition: 'border-color 120ms ease, transform 120ms ease',
        '&:hover': onOpen ? { borderColor: '#d4d8de' } : {},
      }}
    >
      <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 1, bgcolor: type.tone, flexShrink: 0 }} />
      <Avatar sx={{
        width: 34, height: 34, fontSize: 12, fontWeight: 700,
        bgcolor: '#f1f5f9', color: OC_COLORS.navyPrincipal,
      }}>
        {initials(action.patientName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{
            fontSize: 13.5, fontWeight: 600,
            color: resolved ? OC_COLORS.grisMedio : OC_COLORS.navyPrincipal,
            textDecoration: resolved ? 'line-through' : 'none',
          }}>
            {action.title}
          </Typography>
          <Chip
            label={type.label}
            size="small"
            sx={{
              height: 18, fontSize: 10.5, fontWeight: 700,
              bgcolor: type.bg, color: type.tone, border: 'none',
              '& .MuiChip-label': { px: 0.875 },
            }}
          />
          {dateChip && (
            <Typography sx={{
              fontSize: 11, color: dateChip.tone, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>
              · {dateChip.text}
            </Typography>
          )}
        </Box>
        <Typography sx={{
          fontSize: 12.5, color: OC_COLORS.grisMedio, mt: 0.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {action.patientName}
          {action.patientPhone ? ` · ${action.patientPhone}` : ''}
        </Typography>
      </Box>
      {rightExtra}
      {action.patientEmail && onOpenPatient && (
        <Tooltip title="Abrir ficha del paciente">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onOpenPatient(action.patientEmail); }}
            sx={{ color: OC_COLORS.grisMedio, '&:hover': { color: OC_COLORS.verdeBienestar } }}
          >
            <Box sx={{ fontSize: 18, lineHeight: 1, fontWeight: 700 }}>→</Box>
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
