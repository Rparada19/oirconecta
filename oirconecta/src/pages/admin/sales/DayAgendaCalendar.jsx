/**
 * Calendario visual del día — timeline horaria con tareas posicionadas
 * en su slot real. Hoy de 7:00 a 20:00 con líneas cada hora.
 *
 * Las tareas aparecen como bloques de color por tipo (CALL/EMAIL/WA/MEETING/
 * FOLLOWUP). Click en un bloque navega al detalle del lead.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  PhoneOutlined, EmailOutlined, EventOutlined, ReplayOutlined,
} from '@mui/icons-material';
import { WhatsApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { softCard } from './SalesShell';

const START_HOUR = 7;
const END_HOUR = 20; // 13 horas
const HOUR_HEIGHT = 56; // px por hora — densidad cómoda
const NOW_LINE_COLOR = '#ef4444';

const TYPE_META = {
  CALL:     { icon: PhoneOutlined,  color: '#4054B2', bg: '#eef0fb' },
  EMAIL:    { icon: EmailOutlined,  color: '#8b5cf6', bg: '#f3edff' },
  WHATSAPP: { icon: WhatsApp,       color: '#25D366', bg: '#dcf8c6' },
  MEETING:  { icon: EventOutlined,  color: '#0099CC', bg: '#e0f7ff' },
  FOLLOWUP: { icon: ReplayOutlined, color: '#f59e0b', bg: '#fffbeb' },
};

function isToday(iso) {
  const d = new Date(iso);
  const t = new Date();
  return d.getFullYear() === t.getFullYear()
    && d.getMonth() === t.getMonth()
    && d.getDate() === t.getDate();
}

function minutesSinceStart(date) {
  const d = new Date(date);
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}

function isInRange(date) {
  const d = new Date(date);
  const h = d.getHours();
  return h >= START_HOUR && h < END_HOUR;
}

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const totalMinutes = (END_HOUR - START_HOUR) * 60;
const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

export default function DayAgendaCalendar({ tasks = [] }) {
  const navigate = useNavigate();

  const todays = tasks.filter((t) => isToday(t.dueAt));
  const inRange = todays.filter((t) => isInRange(t.dueAt));
  const earlyOrLate = todays.filter((t) => !isInRange(t.dueAt));

  const now = new Date();
  const nowInRange = now.getHours() >= START_HOUR && now.getHours() < END_HOUR;
  const nowTop = nowInRange
    ? ((now.getHours() - START_HOUR) * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)
    : null;

  return (
    <Box sx={{ ...softCard, p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{
          fontSize: 11, fontWeight: 700, color: '#5b6b7a',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Agenda de hoy · {todays.length} programada{todays.length === 1 ? '' : 's'}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#5b6b7a' }}>
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' })}
        </Typography>
      </Box>

      {todays.length === 0 ? (
        <Box sx={{
          py: 3, textAlign: 'center',
          color: '#5b6b7a', fontSize: 13.5,
        }}>
          Sin tareas agendadas para hoy. Programa una desde el detalle de un lead.
        </Box>
      ) : (
        <>
          {/* Timeline */}
          <Box sx={{ position: 'relative', display: 'flex', mt: 1 }}>
            {/* Columna de horas */}
            <Box sx={{ width: 52, flexShrink: 0, position: 'relative', height: totalHeight }}>
              {hours.slice(0, -1).map((h) => (
                <Box key={h} sx={{
                  position: 'absolute', top: (h - START_HOUR) * HOUR_HEIGHT,
                  right: 8, transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {h.toString().padStart(2, '0')}:00
                </Box>
              ))}
            </Box>

            {/* Columna de slots con eventos */}
            <Box sx={{
              flex: 1, position: 'relative', height: totalHeight,
              borderLeft: '1px solid #e5e7eb',
              borderTop: '1px solid #f0f2f4',
            }}>
              {/* Líneas horarias */}
              {hours.map((h) => (
                <Box key={h} sx={{
                  position: 'absolute', left: 0, right: 0,
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                  borderTop: h === START_HOUR ? 'none' : '1px dashed #f0f2f4',
                  height: HOUR_HEIGHT,
                  '&::after': h % 1 === 0 ? {
                    content: '""', position: 'absolute', left: 0, right: 0,
                    top: HOUR_HEIGHT / 2, borderTop: '1px dotted #f6f7fb',
                  } : {},
                }} />
              ))}

              {/* Línea "ahora" */}
              {nowTop != null && (
                <Box sx={{
                  position: 'absolute', left: 0, right: 0, top: nowTop, zIndex: 2,
                  height: 2, bgcolor: NOW_LINE_COLOR,
                  '&::before': {
                    content: '""', position: 'absolute', left: -5, top: -4,
                    width: 10, height: 10, borderRadius: '50%', bgcolor: NOW_LINE_COLOR,
                    boxShadow: `0 0 0 3px ${NOW_LINE_COLOR}22`,
                  },
                }} />
              )}

              {/* Bloques de eventos */}
              {inRange.map((t) => {
                const m = TYPE_META[t.type] || TYPE_META.FOLLOWUP;
                const Icon = m.icon;
                const startMin = minutesSinceStart(t.dueAt);
                // Asumimos 30 min por defecto para visualizar; reuniones reales podrían ser más.
                const durMin = t.type === 'MEETING' ? 30 : 20;
                const top = startMin * (HOUR_HEIGHT / 60);
                const height = Math.max(28, durMin * (HOUR_HEIGHT / 60));
                const time = new Date(t.dueAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                return (
                  <Box
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => t.lead?.id && navigate(`/portal-admin/sales/leads/${t.lead.id}`)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && t.lead?.id) {
                        navigate(`/portal-admin/sales/leads/${t.lead.id}`);
                      }
                    }}
                    sx={{
                      position: 'absolute', left: 4, right: 4, top, height,
                      bgcolor: m.bg, border: `1px solid ${m.color}40`,
                      borderLeft: `3px solid ${m.color}`, borderRadius: 1,
                      px: 1, py: 0.5, cursor: 'pointer', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', gap: 0.75,
                      transition: 'transform 120ms ease, box-shadow 120ms ease',
                      '&:hover': {
                        transform: 'translateX(2px)',
                        boxShadow: `0 4px 10px ${m.color}25`,
                      },
                    }}
                  >
                    <Box sx={{
                      width: 22, height: 22, borderRadius: 0.75, flexShrink: 0,
                      bgcolor: `${m.color}25`, color: m.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon sx={{ fontSize: 13 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{
                        fontSize: 12, fontWeight: 700, color: m.color,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.15,
                      }}>
                        {time} · {t.lead?.nombre || 'Sin lead'}
                      </Typography>
                      {t.notes && height > 36 && (
                        <Typography sx={{
                          fontSize: 11, color: '#475569',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {t.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Tareas fuera del rango 7-20h */}
          {earlyOrLate.length > 0 && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #e5e7eb' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5b6b7a', mb: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Fuera de horario laboral
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.875, flexWrap: 'wrap' }}>
                {earlyOrLate.map((t) => {
                  const time = new Date(t.dueAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Box key={t.id}
                      onClick={() => t.lead?.id && navigate(`/portal-admin/sales/leads/${t.lead.id}`)}
                      role="button"
                      sx={{
                        cursor: 'pointer', px: 1, py: 0.375, borderRadius: 0.75,
                        bgcolor: '#f3f4f6', color: '#4b5563',
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#e5e7eb' },
                      }}>
                      {time} · {t.lead?.nombre || 'Sin lead'}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
