/**
 * Banner de resumen del día. Saludo contextual + agregados clave + tip rotativo.
 * No solo lista lo que hay; **interpreta** y sugiere prioridades.
 */
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { WbSunny, NightsStay, WbTwilight, LightbulbOutlined } from '@mui/icons-material';
import { OC_COLORS } from '../../../theme';

const TIPS = [
  'Confirmar asistencia a las citas del día reduce el no-show hasta en un 40 %.',
  'Antes de una primera consulta envía un cuestionario HHIE-S — el paciente llega más preparado.',
  'Llamar el día anterior al control de 30 días mejora la adherencia a la adaptación.',
  'Una garantía a 60 días es la mejor ventana para ofrecer renovación con descuento.',
  'Si un lead lleva 48 h sin contacto, la probabilidad de conversión cae a la mitad.',
  'Las pilas recargables reducen el costo de mantenimiento mensual del paciente RIC.',
  'Registrar el motivo de pérdida ayuda a refinar las campañas de marketing.',
  'Una cita reprogramada con WhatsApp se confirma 3× más rápido que por email.',
];

function pickTip(seed = new Date().getDate()) {
  return TIPS[seed % TIPS.length];
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return { label: 'Buenos días', icon: WbSunny, color: '#f59e0b' };
  if (h < 19) return { label: 'Buenas tardes', icon: WbTwilight, color: '#f97316' };
  return { label: 'Buenas noches', icon: NightsStay, color: '#6366f1' };
}

export default function DailyBriefing({ userName, kpis = [] }) {
  const { label, icon: TimeIcon, color: timeColor } = useMemo(timeOfDay, []);
  const tip = useMemo(() => pickTip(), []);

  // Mensaje contextual a partir de los KPIs (vencidas, hoy, próximas, leads, etc.)
  const summary = useMemo(() => {
    const segments = [];
    const v = kpis.find((k) => k.key === 'vencidas')?.value || 0;
    const h = kpis.find((k) => k.key === 'hoy')?.value || 0;
    const p = kpis.find((k) => k.key === 'proximas')?.value || 0;
    if (v > 0) segments.push({ text: `${v} ${v === 1 ? 'tarea' : 'tareas'} vencida${v === 1 ? '' : 's'}`, tone: '#b91c1c' });
    if (h > 0) segments.push({ text: `${h} para hoy`, tone: '#1d4ed8' });
    if (p > 0) segments.push({ text: `${p} en los próximos días`, tone: '#b45309' });
    if (segments.length === 0) segments.push({ text: 'sin pendientes inmediatos', tone: '#047857' });
    return segments;
  }, [kpis]);

  const fechaLarga = useMemo(() => {
    return new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota',
    });
  }, []);

  return (
    <Box sx={{
      display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexWrap: 'wrap',
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2.5, mb: 2.5,
    }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
        bgcolor: `${timeColor}1A`, color: timeColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TimeIcon sx={{ fontSize: 22 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: OC_COLORS.navyPrincipal }}>
          {label}{userName ? `, ${userName.split(' ')[0]}` : ''}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: OC_COLORS.grisMedio, mt: 0.25,
          textTransform: 'capitalize' }}>
          {fechaLarga}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: '#374151', mt: 1, lineHeight: 1.55 }}>
          Tienes{' '}
          {summary.map((s, i) => (
            <React.Fragment key={i}>
              <Box component="span" sx={{ color: s.tone, fontWeight: 700 }}>{s.text}</Box>
              {i < summary.length - 1 && (i === summary.length - 2 ? ' y ' : ', ')}
            </React.Fragment>
          ))}
          .
        </Typography>
      </Box>

      {/* Tip del día */}
      <Box sx={{
        flex: '0 1 320px', minWidth: 240,
        bgcolor: '#fef9e7', border: '1px solid #fde68a', borderRadius: 1.5, p: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <LightbulbOutlined sx={{ fontSize: 14, color: '#92400e' }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#92400e',
            textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tip del día</Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.5 }}>
          {tip}
        </Typography>
      </Box>
    </Box>
  );
}
