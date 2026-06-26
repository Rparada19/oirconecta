/**
 * Checklist de preparación para una cita. Mostrado dentro del modal de detalle.
 * Marca persistida en localStorage por id de acción para no perder estado al cerrar.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Checkbox } from '@mui/material';
import { OC_COLORS } from '../../../theme';

const STORAGE_KEY = 'oirconecta_checklist_state';

function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function writeState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

const ITEMS_DEFAULT = [
  'Confirmar asistencia por WhatsApp o llamada',
  'Revisar historia clínica del paciente',
  'Verificar productos / garantías activas',
  'Preparar instrumental (audiómetro calibrado, otoscopio)',
  'Recordar al paciente traer documentos previos',
];

const ITEMS_PRIMERA_VEZ = [
  'Enviar cuestionario HHIE-S 24 h antes',
  'Confirmar asistencia y direcciones',
  'Preparar formato de anamnesis',
  'Calibración del audiómetro lista',
  'Verificar que el paciente trae estudios médicos previos (si aplica)',
];

const ITEMS_CONTROL = [
  'Confirmar asistencia',
  'Revisar última programación de los audífonos',
  'Preparar tester de audífonos y kit de limpieza',
  'Consultar datalogger de uso del paciente',
  'Considerar aplicar IOI-HA si es control de 30 d',
];

function pickItems(action = {}) {
  const t = (action.title || '').toLowerCase();
  if (/primera/.test(t)) return ITEMS_PRIMERA_VEZ;
  if (/control|seguimiento|adapt/.test(t)) return ITEMS_CONTROL;
  return ITEMS_DEFAULT;
}

export default function PreparationChecklist({ action }) {
  const items = useMemo(() => pickItems(action), [action]);
  const key = `act:${action?.id}`;
  const [state, setState] = useState({});

  useEffect(() => {
    const all = readState();
    setState(all[key] || {});
  }, [key]);

  const toggle = (i) => {
    const next = { ...state, [i]: !state[i] };
    setState(next);
    const all = readState();
    all[key] = next;
    writeState(all);
  };

  const done = items.filter((_, i) => state[i]).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <Box sx={{
      bgcolor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 1.5, p: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: OC_COLORS.navyPrincipal,
          textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Checklist de preparación
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: OC_COLORS.grisMedio, fontWeight: 600 }}>
          {done} / {items.length}
        </Typography>
      </Box>

      {/* Barra de progreso */}
      <Box sx={{ height: 4, bgcolor: '#e5e7eb', borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
        <Box sx={{ width: `${pct}%`, height: '100%',
          bgcolor: pct === 100 ? '#10b981' : OC_COLORS.verdeBienestar,
          transition: 'width 200ms ease' }} />
      </Box>

      {items.map((it, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Checkbox
            size="small"
            checked={Boolean(state[i])}
            onChange={() => toggle(i)}
            sx={{ p: 0.5, color: OC_COLORS.grisClaro,
              '&.Mui-checked': { color: OC_COLORS.verdeBienestar } }}
          />
          <Typography sx={{
            fontSize: 12.5, color: state[i] ? OC_COLORS.grisMedio : '#374151',
            textDecoration: state[i] ? 'line-through' : 'none', pt: 0.75, lineHeight: 1.5,
          }}>
            {it}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
