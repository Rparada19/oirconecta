/**
 * Widgets compartidos del CRM Sales: tips de coaching, metas con
 * progreso, selector de rangos, KPI grande.
 */
import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { TipsAndUpdatesOutlined, EditOutlined, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { salesApi, RANGE_OPTIONS } from '../../../services/salesApi';
import { softCard } from './SalesShell';

/* ─── Tips rotativos ────────────────────────────────────── */

const DAILY_TIPS = [
  { tag: 'Apertura', body: 'Los primeros 8 segundos definen la llamada. Saluda con tu nombre, el de OírConecta y declara el motivo en una frase corta. Sin disculpas por interrumpir.' },
  { tag: 'Objeción "no tengo tiempo"', body: 'Responde: "Entiendo, te pido 90 segundos para mostrarte qué pacientes están buscando audiólogo esta semana en tu ciudad." Específico bate al genérico.' },
  { tag: 'Email frío', body: 'Asunto corto y útil: el nombre del profesional + un dato relevante ("Dra. Quintero, 12 búsquedas de audiólogo en Cúcuta esta semana"). 0% jerga.' },
  { tag: 'Seguimiento', body: 'Reagenda el segundo contacto en 48–72 h. Más allá, la tasa de respuesta cae 40%. Programa el follow-up al cerrar la llamada — no después.' },
  { tag: 'WhatsApp', body: 'WhatsApp es para confirmar y mover, no para vender. Úsalo para "te queda firme la demo de mañana 4pm?". Resto va por llamada o email.' },
  { tag: 'Demo', body: 'No muestres 20 features. Muestra 3: ficha pública, panel de consultas y métricas. Pregunta "¿cuál te ahorra más tiempo?" y profundiza ahí.' },
  { tag: 'Cierre', body: 'Cuando la persona dice "interesante", no respondas con más beneficios. Pregunta: "¿qué pacientes nuevos esperas atender este mes?". El número te abre el cierre.' },
  { tag: 'CRM', body: 'Registra la actividad ANTES de la siguiente llamada. Tu memoria a las 5pm no es la misma de las 10am — y los datos del CRM son los que defienden tu pipeline.' },
  { tag: 'Conversión', body: 'Cuando creas la cuenta, no termines ahí. Llama al día siguiente: "¿pudiste entrar?". Esa llamada eleva la activación al 80% (vs 35% sin llamada).' },
  { tag: 'Energía', body: 'Llama de pie. Sonríe antes de marcar (sí, se nota en la voz). Bloquea 90 minutos de llamadas seguidas — el cambio de contexto mata el ritmo.' },
];

export function DailyTipCard() {
  const day = new Date();
  // Rota basado en el día del año para que el equipo vea el mismo tip si mira al tiempo.
  const dayOfYear = Math.floor((day - new Date(day.getFullYear(), 0, 0)) / 86400000);
  const [idx, setIdx] = useState(dayOfYear % DAILY_TIPS.length);
  const tip = DAILY_TIPS[idx];
  const total = DAILY_TIPS.length;
  return (
    <Box sx={{
      ...softCard, p: 2, borderLeft: '4px solid #f59e0b', mb: 2,
      display: 'flex', alignItems: 'flex-start', gap: 1.5,
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1, flexShrink: 0,
        bgcolor: '#fef3c7', color: '#b45309',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TipsAndUpdatesOutlined sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#b45309', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tip del día · {tip.tag}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 11, color: '#9a8055' }}>{idx + 1}/{total}</Typography>
          <IconButton size="small" onClick={() => setIdx((i) => (i - 1 + total) % total)} sx={{ p: 0.25 }}>
            <ChevronLeft sx={{ fontSize: 18, color: '#b45309' }} />
          </IconButton>
          <IconButton size="small" onClick={() => setIdx((i) => (i + 1) % total)} sx={{ p: 0.25 }}>
            <ChevronRight sx={{ fontSize: 18, color: '#b45309' }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: 13, color: '#0f1923', lineHeight: 1.55 }}>
          {tip.body}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Metas con progreso ────────────────────────────────── */

const tone = (pct) => pct >= 100 ? { bar: '#10b981', fg: '#047857', bg: '#ecfdf5' }
  : pct >= 60 ? { bar: '#3b82f6', fg: '#1e40af', bg: '#eef0fb' }
  : pct >= 30 ? { bar: '#f59e0b', fg: '#b45309', bg: '#fffbeb' }
              : { bar: '#ef4444', fg: '#b91c1c', bg: '#fef2f2' };

export function GoalsCard() {
  const [data, setData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const reload = () => salesApi.goalsProgress().then(setData).catch(() => {});
  useEffect(() => { reload(); }, []);

  if (!data) return null;
  return (
    <>
      <Box sx={{ ...softCard, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5b6b7a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tus metas
          </Typography>
          <IconButton size="small" onClick={() => setEditOpen(true)} title="Editar metas">
            <EditOutlined sx={{ fontSize: 17, color: '#5b6b7a' }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.25 }}>
          {data.items.map((it) => {
            const t = tone(it.pct);
            return (
              <Box key={it.key} sx={{
                bgcolor: t.bg, border: `1px solid ${t.fg}25`, borderRadius: 1.5, p: 1.25,
              }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: t.fg, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
                  {it.label}
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#041a12', fontVariantNumeric: 'tabular-nums' }}>
                  {it.actual} <Box component="span" sx={{ color: '#5b6b7a', fontSize: 13, fontWeight: 600 }}>/ {it.goal}</Box>
                </Typography>
                <LinearProgress
                  variant="determinate" value={Math.min(100, it.pct)}
                  sx={{
                    mt: 0.625, height: 4, borderRadius: 2, bgcolor: `${t.fg}15`,
                    '& .MuiLinearProgress-bar': { bgcolor: t.bar, borderRadius: 2 },
                  }}
                />
                <Typography sx={{ fontSize: 10.5, color: t.fg, mt: 0.375, fontWeight: 700 }}>
                  {it.pct}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <EditGoalsDialog open={editOpen} onClose={() => setEditOpen(false)} goals={data.goals} onSaved={() => { setEditOpen(false); reload(); }} />
    </>
  );
}

function EditGoalsDialog({ open, onClose, goals, onSaved }) {
  const [form, setForm] = useState(goals);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(goals); }, [goals]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) || 0 }));
  const submit = async () => {
    setSaving(true);
    try { await salesApi.setGoals(form); onSaved(); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
        Editar metas
        <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
          Define cuánto esperas hacer en tu jornada. Útil para no estancarte.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
          <TextField label="Llamadas / día"   type="number" value={form.callsPerDay}        onChange={set('callsPerDay')}        size="small" />
          <TextField label="Emails / día"     type="number" value={form.emailsPerDay}       onChange={set('emailsPerDay')}       size="small" />
          <TextField label="WhatsApp / día"   type="number" value={form.whatsappPerDay}     onChange={set('whatsappPerDay')}     size="small" />
          <TextField label="Demos / semana"   type="number" value={form.demosPerWeek}       onChange={set('demosPerWeek')}       size="small" />
          <TextField label="Conversiones / mes" type="number" value={form.conversionsPerMonth} onChange={set('conversionsPerMonth')} size="small" sx={{ gridColumn: '1 / -1' }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
        <Button onClick={submit} disabled={saving} variant="contained"
          sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#064a38' } }}>
          {saving ? 'Guardando…' : 'Guardar metas'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Selector de rango ─────────────────────────────────── */

export function RangeChips({ value, onChange, hideAll }) {
  const opts = hideAll ? RANGE_OPTIONS.filter((o) => o.key !== 'all') : RANGE_OPTIONS;
  return (
    <Box sx={{ display: 'flex', gap: 0.625, flexWrap: 'wrap' }}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <Box key={o.key} role="button" tabIndex={0} onClick={() => onChange(o.key)}
            sx={{
              cursor: 'pointer', px: 1.25, py: 0.5, borderRadius: 1,
              bgcolor: active ? '#272F50' : '#eef0fb', color: active ? '#fff' : '#272F50',
              border: `1px solid ${active ? '#272F50' : '#272F5025'}`,
              fontSize: 12, fontWeight: 700, transition: 'all 120ms ease',
              '&:hover': { bgcolor: active ? '#272F50' : '#dde0f5' },
            }}>
            {o.label}
          </Box>
        );
      })}
    </Box>
  );
}
