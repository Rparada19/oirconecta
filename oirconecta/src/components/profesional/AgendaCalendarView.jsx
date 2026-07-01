/**
 * C7 — Vista calendario para agenda profesional (semana/día/mes).
 *
 * Sin dependencias externas: grid CSS + MUI.
 *
 * Fuentes de datos ya cargadas en la página padre:
 *  - appointments.items  → citas con { id, fecha (ISO), hora "HH:MM", durationMinutes, estado, patient/patientName, tipoConsulta, color }
 *  - blocks             → bloqueos con { startAt, endAt, allDay, tipo, motivo }
 *  - availability       → franjas semanales { dayOfWeek, startTime, endTime, active }
 */

import React, { useMemo, useState } from 'react';
import {
  Box, Button, ButtonGroup, Chip, IconButton, Stack, Tooltip, Typography,
  Popover, Divider,
} from '@mui/material';
import {
  ChevronLeftOutlined, ChevronRightOutlined, TodayOutlined,
  EventOutlined, BlockOutlined,
} from '@mui/icons-material';

const ACCENT = '#15803d';
const NAVY = '#0F2A4A';
const DOW_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DOW_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─────────── Helpers de fecha (sin librería) ───────────
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const startOfWeek = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // domingo como inicio (coincide con DOW 0-6)
  return x;
};
const isSameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const fmtHHMM = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
const parseHHMM = (s) => { const [h,m] = (s||'00:00').split(':').map(Number); return h*60+m; };

// Convierte "YYYY-MM-DD" de fecha + "HH:MM" hora a Date local
function combineDateAndTime(fechaISO, horaHHMM) {
  const d = new Date(fechaISO);
  // La fecha viene como ISO; usar parte fecha, no la hora
  const [h, m] = (horaHHMM || '00:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─────────── Componente principal ───────────
export default function AgendaCalendarView({ appointments = [], blocks = [], availability = [], onSelectAppointment }) {
  const [view, setView] = useState('week'); // 'week' | 'day' | 'month'
  const [cursor, setCursor] = useState(startOfDay(new Date()));

  const goPrev = () => setCursor(view === 'month' ? addMonths(cursor, -1) : addDays(cursor, view === 'day' ? -1 : -7));
  const goNext = () => setCursor(view === 'month' ? addMonths(cursor, +1) : addDays(cursor, view === 'day' ? +1 : +7));
  const goToday = () => setCursor(startOfDay(new Date()));

  const rangeLabel = useMemo(() => {
    if (view === 'day') {
      return `${DOW_LONG[cursor.getDay()]} ${cursor.getDate()} de ${MONTH_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (view === 'month') {
      return `${MONTH_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    const sm = MONTH_LONG[start.getMonth()].slice(0,3);
    const em = MONTH_LONG[end.getMonth()].slice(0,3);
    return `${start.getDate()} ${sm} — ${end.getDate()} ${em} ${end.getFullYear()}`;
  }, [view, cursor]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ButtonGroup size="small">
            <Tooltip title="Anterior"><IconButton size="small" onClick={goPrev}><ChevronLeftOutlined /></IconButton></Tooltip>
            <Button size="small" startIcon={<TodayOutlined />} onClick={goToday} sx={{ textTransform: 'none' }}>Hoy</Button>
            <Tooltip title="Siguiente"><IconButton size="small" onClick={goNext}><ChevronRightOutlined /></IconButton></Tooltip>
          </ButtonGroup>
          <Typography sx={{ fontWeight: 800, color: NAVY, ml: 1 }}>{rangeLabel}</Typography>
        </Stack>
        <ButtonGroup size="small">
          {[
            { v: 'day', l: 'Día' },
            { v: 'week', l: 'Semana' },
            { v: 'month', l: 'Mes' },
          ].map((opt) => (
            <Button key={opt.v} onClick={() => setView(opt.v)}
              variant={view === opt.v ? 'contained' : 'outlined'}
              sx={{ textTransform: 'none', fontWeight: 700,
                    ...(view === opt.v ? { background: ACCENT, '&:hover': { background: ACCENT, filter: 'brightness(0.95)' } } : { color: ACCENT, borderColor: ACCENT }) }}>
              {opt.l}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      {view === 'month'
        ? <MonthGrid cursor={cursor} appointments={appointments} onSelectAppointment={onSelectAppointment} onSelectDay={(d) => { setCursor(d); setView('day'); }} />
        : <TimeGrid view={view} cursor={cursor} appointments={appointments} blocks={blocks} availability={availability} onSelectAppointment={onSelectAppointment} />}

      {/* Leyenda */}
      <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <LegendItem color={ACCENT} label="Cita confirmada" />
        <LegendItem color="#94a3b8" label="Cita completada" />
        <LegendItem color="#dc2626" label="Cancelada / no asistió" />
        <LegendItem color="#f59e0b" label="Bloqueo" icon={BlockOutlined} />
      </Stack>
    </Box>
  );
}

function LegendItem({ color, label, icon: Icon }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {Icon ? <Icon sx={{ fontSize: 14, color }} /> : <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: color }} />}
      <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</Typography>
    </Stack>
  );
}

// ─────────── Grid de tiempo (semana o día) ───────────
function TimeGrid({ view, cursor, appointments, blocks, availability, onSelectAppointment }) {
  // Horas mostradas: 6:00 a 21:00 (ajustable)
  const HOUR_START = 6;
  const HOUR_END = 21;
  const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const HOUR_PX = 48; // altura por hora
  const totalHeight = HOURS.length * HOUR_PX;

  const days = useMemo(() => {
    if (view === 'day') return [new Date(cursor)];
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, cursor]);

  // Prepara citas por día
  const apptsByDay = useMemo(() => {
    const map = new Map();
    days.forEach((d) => map.set(d.toDateString(), []));
    for (const a of appointments) {
      if (!a?.fecha || !a?.hora) continue;
      const dt = combineDateAndTime(a.fecha, a.hora);
      const key = dt.toDateString();
      if (!map.has(key)) continue;
      map.get(key).push({ ...a, _startMin: parseHHMM(a.hora), _dur: a.durationMinutes || 30 });
    }
    return map;
  }, [days, appointments]);

  // Prepara bloqueos por día (recorta al rango visible)
  const blocksByDay = useMemo(() => {
    const map = new Map();
    days.forEach((d) => map.set(d.toDateString(), []));
    for (const b of blocks) {
      const s = new Date(b.startAt);
      const e = new Date(b.endAt);
      for (const d of days) {
        const dayStart = startOfDay(d);
        const dayEnd = addDays(dayStart, 1);
        if (e < dayStart || s > dayEnd) continue;
        const from = s < dayStart ? dayStart : s;
        const to = e > dayEnd ? dayEnd : e;
        const startMin = from.getHours() * 60 + from.getMinutes();
        const endMin = to.getHours() * 60 + to.getMinutes() || 24 * 60;
        map.get(d.toDateString()).push({ ...b, _startMin: startMin, _endMin: endMin });
      }
    }
    return map;
  }, [days, blocks]);

  // Franjas de disponibilidad por día (para pintar fondo suave)
  const availByDay = useMemo(() => {
    const map = new Map();
    days.forEach((d) => {
      const dow = d.getDay();
      const franjas = availability.filter((a) => a.dayOfWeek === dow && a.active !== false)
        .map((a) => ({ start: parseHHMM(a.startTime), end: parseHHMM(a.endTime) }));
      map.set(d.toDateString(), franjas);
    });
    return map;
  }, [days, availability]);

  const today = startOfDay(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff' }}>
      {/* Encabezado de días */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, borderBottom: '1px solid #e5e7eb', bgcolor: '#f8fafc' }}>
        <Box />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <Box key={d.toISOString()} sx={{ p: 1, textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                {DOW_SHORT[d.getDay()]}
              </Typography>
              <Typography sx={{ fontWeight: 800, color: isToday ? '#fff' : NAVY, fontSize: '0.95rem',
                display: 'inline-block', minWidth: 28, lineHeight: '28px',
                bgcolor: isToday ? ACCENT : 'transparent', borderRadius: '50%', px: isToday ? 1 : 0 }}>
                {d.getDate()}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Cuerpo con horas + columnas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, position: 'relative' }}>
        {/* Columna de horas */}
        <Box>
          {HOURS.map((h) => (
            <Box key={h} sx={{ height: HOUR_PX, borderBottom: '1px dashed #f1f5f9', pr: 0.5, textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: '-8px' }}>{`${String(h).padStart(2,'0')}:00`}</Typography>
            </Box>
          ))}
        </Box>
        {/* Columnas por día */}
        {days.map((d) => {
          const key = d.toDateString();
          const dayAppts = apptsByDay.get(key) || [];
          const dayBlocks = blocksByDay.get(key) || [];
          const dayAvail = availByDay.get(key) || [];
          const isToday = isSameDay(d, today);
          return (
            <Box key={key} sx={{ position: 'relative', borderLeft: '1px solid #e5e7eb', height: totalHeight, bgcolor: isToday ? 'rgba(21,128,61,0.03)' : 'transparent' }}>
              {/* Franjas de disponibilidad (fondo verde suave) */}
              {dayAvail.map((f, i) => {
                const top = ((f.start - HOUR_START*60) / 60) * HOUR_PX;
                const height = ((f.end - f.start) / 60) * HOUR_PX;
                if (top + height < 0 || top > totalHeight) return null;
                return (
                  <Box key={`av-${i}`} sx={{
                    position: 'absolute', left: 0, right: 0,
                    top: Math.max(0, top),
                    height: Math.min(totalHeight - Math.max(0, top), height + Math.min(0, top)),
                    bgcolor: 'rgba(21,128,61,0.04)',
                    borderLeft: `2px solid ${ACCENT}22`,
                    pointerEvents: 'none',
                  }} />
                );
              })}
              {/* Bloqueos (overlay ámbar) */}
              {dayBlocks.map((b, i) => {
                const top = ((b._startMin - HOUR_START*60) / 60) * HOUR_PX;
                const height = ((b._endMin - b._startMin) / 60) * HOUR_PX;
                return (
                  <Tooltip key={`bl-${i}`} title={`Bloqueo${b.tipo ? ` · ${b.tipo}` : ''}${b.motivo ? ` — ${b.motivo}` : ''}`}>
                    <Box sx={{
                      position: 'absolute', left: 2, right: 2,
                      top: Math.max(0, top),
                      height: Math.max(18, height),
                      bgcolor: 'rgba(245,158,11,0.15)',
                      border: '1px dashed #f59e0b',
                      borderRadius: '4px',
                      pointerEvents: 'auto',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BlockOutlined sx={{ fontSize: 14, color: '#92400e' }} />
                    </Box>
                  </Tooltip>
                );
              })}
              {/* Líneas de hora (guía visual) */}
              {HOURS.map((_, i) => (
                <Box key={`gh-${i}`} sx={{ position: 'absolute', left: 0, right: 0, top: i * HOUR_PX, height: HOUR_PX, borderBottom: '1px dashed #f1f5f9', pointerEvents: 'none' }} />
              ))}
              {/* Línea "ahora" */}
              {isToday && nowMin >= HOUR_START*60 && nowMin <= HOUR_END*60 && (
                <Box sx={{
                  position: 'absolute', left: 0, right: 0,
                  top: ((nowMin - HOUR_START*60) / 60) * HOUR_PX,
                  height: 0, borderTop: '2px solid #dc2626', zIndex: 2, pointerEvents: 'none',
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626', mt: '-5px', ml: '-4px' }} />
                </Box>
              )}
              {/* Citas */}
              {dayAppts.map((a) => <ApptBlock key={a.id} appt={a} hourStart={HOUR_START} hourPx={HOUR_PX} onClick={onSelectAppointment} />)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ApptBlock({ appt, hourStart, hourPx, onClick }) {
  const top = ((appt._startMin - hourStart * 60) / 60) * hourPx;
  const height = Math.max(24, (appt._dur / 60) * hourPx - 2);
  const isCancel = appt.estado === 'CANCELLED' || appt.estado === 'NO_SHOW';
  const isDone = appt.estado === 'COMPLETED';
  const baseColor = isCancel ? '#dc2626' : isDone ? '#94a3b8' : (appt.color || ACCENT);

  const patientName = appt.patient?.nombre || appt.patientName || 'Paciente';
  const tipo = appt.tipoConsulta || '';

  return (
    <Tooltip title={`${appt.hora} · ${patientName}${tipo ? ` · ${tipo}` : ''}`}>
      <Box onClick={() => onClick && onClick(appt)}
        sx={{
          position: 'absolute', left: 3, right: 3, top, height,
          bgcolor: `${baseColor}18`,
          borderLeft: `3px solid ${baseColor}`,
          borderRadius: '4px',
          px: 0.75, py: 0.25,
          cursor: onClick ? 'pointer' : 'default',
          overflow: 'hidden',
          textDecoration: isCancel ? 'line-through' : 'none',
          '&:hover': { bgcolor: `${baseColor}30` },
        }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: baseColor, lineHeight: 1.1 }}>
          {appt.hora}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: NAVY, fontWeight: 600, lineHeight: 1.15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {patientName}
        </Typography>
        {height > 40 && tipo && (
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tipo}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

// ─────────── Vista mes ───────────
function MonthGrid({ cursor, appointments, onSelectAppointment, onSelectDay }) {
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)); // 6 semanas

  const apptsByDay = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      if (!a?.fecha) continue;
      const d = new Date(a.fecha);
      const key = startOfDay(d).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    // Ordena por hora
    for (const arr of map.values()) arr.sort((x, y) => parseHHMM(x.hora) - parseHHMM(y.hora));
    return map;
  }, [appointments]);

  const today = startOfDay(new Date());

  return (
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
        {DOW_SHORT.map((l) => (
          <Typography key={l} sx={{ p: 1, textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{l}</Typography>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          const isToday = isSameDay(d, today);
          const dayAppts = apptsByDay.get(d.toDateString()) || [];
          const shown = dayAppts.slice(0, 3);
          const rest = dayAppts.length - shown.length;
          return (
            <Box key={i}
              onClick={() => onSelectDay && onSelectDay(d)}
              sx={{
                minHeight: 92, p: 0.5,
                borderBottom: '1px solid #f1f5f9',
                borderLeft: i % 7 === 0 ? 'none' : '1px solid #f1f5f9',
                bgcolor: isCurrentMonth ? '#fff' : '#fafbfc',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f8fafc' },
              }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.25 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700,
                  color: isToday ? '#fff' : (isCurrentMonth ? NAVY : '#cbd5e1'),
                  bgcolor: isToday ? ACCENT : 'transparent',
                  borderRadius: '50%', minWidth: 22, textAlign: 'center', lineHeight: '22px', px: isToday ? 0.5 : 0 }}>
                  {d.getDate()}
                </Typography>
              </Box>
              <Stack spacing={0.25}>
                {shown.map((a) => {
                  const isCancel = a.estado === 'CANCELLED' || a.estado === 'NO_SHOW';
                  const color = isCancel ? '#dc2626' : (a.color || ACCENT);
                  return (
                    <Box key={a.id}
                      onClick={(e) => { e.stopPropagation(); onSelectAppointment && onSelectAppointment(a); }}
                      sx={{
                        bgcolor: `${color}18`, borderLeft: `2px solid ${color}`,
                        px: 0.5, py: 0.15, borderRadius: '3px',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        textDecoration: isCancel ? 'line-through' : 'none',
                        '&:hover': { bgcolor: `${color}30` },
                      }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: NAVY,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong style={{ color }}>{a.hora}</strong> · {a.patient?.nombre || a.patientName || 'Paciente'}
                      </Typography>
                    </Box>
                  );
                })}
                {rest > 0 && (
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748b', pl: 0.5, fontWeight: 600 }}>
                    +{rest} más
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
