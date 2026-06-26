/**
 * Caja de recomendación / contexto informativo.
 * Más sutil que un Alert de MUI, pensada para acompañar tareas con consejos.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  LightbulbOutlined, MedicalServices, Phone, Schedule, WarningAmber,
  CheckCircleOutline, Info,
} from '@mui/icons-material';
import { OC_COLORS } from '../../../theme';

const TONES = {
  info:    { bg: '#eff6ff', border: '#bfdbfe', fg: '#1e40af', icon: Info },
  success: { bg: '#ecfdf5', border: '#a7f3d0', fg: '#047857', icon: CheckCircleOutline },
  warning: { bg: '#fef9e7', border: '#fde68a', fg: '#92400e', icon: WarningAmber },
  clinical:{ bg: '#f5f3ff', border: '#ddd6fe', fg: '#5b21b6', icon: MedicalServices },
  contact: { bg: '#ecfeff', border: '#a5f3fc', fg: '#0e7490', icon: Phone },
  schedule:{ bg: '#fff7ed', border: '#fed7aa', fg: '#9a3412', icon: Schedule },
  tip:     { bg: '#fef9e7', border: '#fde68a', fg: '#92400e', icon: LightbulbOutlined },
};

export default function RecommendationCard({ tone = 'info', title, children, compact = false }) {
  const t = TONES[tone] || TONES.info;
  const Icon = t.icon;
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', gap: 1.25,
      bgcolor: t.bg, border: `1px solid ${t.border}`, borderRadius: 1.5,
      px: compact ? 1.25 : 1.75, py: compact ? 1 : 1.5,
    }}>
      <Icon sx={{ fontSize: compact ? 16 : 18, color: t.fg, mt: 0.125, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography sx={{
            fontSize: 10.5, fontWeight: 700, color: t.fg,
            textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25,
          }}>
            {title}
          </Typography>
        )}
        <Typography component="div" sx={{ fontSize: compact ? 12 : 12.5, color: t.fg, lineHeight: 1.55 }}>
          {children}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Heurística: genera recomendaciones según la acción del día.
 * Devuelve un array de { tone, title, body } listo para renderizar.
 */
export function recommendationsForAction(a = {}) {
  const recs = [];
  const motivo = (a.title || a.description || '').toLowerCase();

  // Tipo cita
  if (a.type === 'cita_agenda' || String(a.id || '').startsWith('cita-')) {
    recs.push({ tone: 'contact', title: 'Antes de la cita',
      body: 'Confirma asistencia por WhatsApp o llamada 24 h antes; reduce el no-show.' });

    // Heurística por motivo
    if (/sordo|escuch|hipoa|oig/.test(motivo)) {
      recs.push({ tone: 'clinical', title: 'Protocolo sugerido',
        body: 'Otoscopia + audiometría tonal aérea y ósea. Si tinnitus, agregar logo-audiometría.' });
    }
    if (/control|seguimiento|adapt/.test(motivo)) {
      recs.push({ tone: 'clinical', title: 'Control de adaptación',
        body: 'Revisar uso diario, datalogger del audífono y ajustes de ganancia. Aplicar IOI-HA si es 30 d.' });
    }
    if (/primera/.test(motivo)) {
      recs.push({ tone: 'tip', title: 'Primera consulta',
        body: 'Si no recibió HHIE-S, envíalo ahora por WhatsApp — el paciente llega más preparado.' });
    }
  }

  // Garantía
  if (a.type === 'garantia') {
    recs.push({ tone: 'warning', title: 'Garantía próxima',
      body: 'Ventana ideal para ofrecer renovación con descuento de campaña vigente.' });
  }

  // Consumibles
  if (a.type === 'consumibles') {
    recs.push({ tone: 'tip', title: 'Recomendación de uso',
      body: 'Si el paciente compra pilas cada 1–2 semanas, sugiérele un modelo recargable.' });
  }

  // Vencidas
  const due = a.dueDate ? a.dueDate.slice(0,10) : null;
  if (due && !a.resolvedAt) {
    const today = new Date().toISOString().slice(0,10);
    if (due < today) {
      recs.push({ tone: 'warning', title: 'Acción vencida',
        body: 'Resuelve primero las tareas vencidas para evitar afectar la experiencia del paciente.' });
    }
  }

  return recs;
}
