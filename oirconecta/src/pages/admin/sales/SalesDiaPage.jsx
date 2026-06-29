/**
 * "Mi día" — landing del Ejecutivo Comercial.
 * Muestra tareas pendientes ordenadas por dueAt + leads asignados de hoy.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, Container, CircularProgress, Snackbar, Alert } from '@mui/material';
import {
  WbSunnyOutlined, PhoneOutlined, WhatsApp, EmailOutlined,
  EventOutlined, CheckCircleOutline, OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { salesApi, telHref, waMeHref, mailtoHref } from '../../../services/salesApi';
import { SalesPageHeader, softCard, StatusPill } from './SalesShell';
import { DailyTipCard, GoalsCard } from './SalesWidgets';
import DayAgendaCalendar from './DayAgendaCalendar';

const TYPE_ICON = {
  CALL: PhoneOutlined, EMAIL: EmailOutlined, WHATSAPP: WhatsApp,
  MEETING: EventOutlined, FOLLOWUP: EventOutlined,
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const fmtDue = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const hh = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoy · ${hh}`;
  if (isTomorrow) return `Mañana · ${hh}`;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ` · ${hh}`;
};

export default function SalesDiaPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        salesApi.listMyTasks({ onlyPending: true }),
        salesApi.stats(),
      ]);
      setTasks(t || []);
      setStats(s);
    } catch (e) {
      setSnack({ severity: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const markDone = async (id) => {
    try {
      await salesApi.updateTask(id, { status: 'DONE' });
      setSnack({ severity: 'success', msg: 'Tarea marcada como hecha' });
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
  };

  const now = new Date();
  const vencidas = tasks.filter((t) => new Date(t.dueAt) < new Date(now.toDateString()));
  const hoy = tasks.filter((t) => new Date(t.dueAt).toDateString() === now.toDateString());
  const proximas = tasks.filter((t) => new Date(t.dueAt) > new Date(new Date(now.toDateString()).getTime() + 86400000 - 1));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SalesPageHeader
        icon={WbSunnyOutlined}
        title="Mi día"
        subtitle={`${greeting()} — tareas y leads para hoy`}
      />

      {/* Hero con KPIs */}
      <Box sx={{
        position: 'relative', borderRadius: 3, overflow: 'hidden',
        background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 50%, #085946 100%)',
        color: '#fff', p: { xs: 2.5, sm: 3 }, mb: 3,
      }}>
        <Box sx={{
          position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,200,0.22), rgba(110,231,200,0) 70%)',
        }} />
        <Box sx={{ position: 'relative' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6ee7c8', mb: 0.5 }}>
            Tu pulso
          </Typography>
          <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, mb: 1.5, lineHeight: 1.15 }}>
            {tasks.length} {tasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
            {vencidas.length > 0 ? ` · ${vencidas.length} vencidas` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            <Kpi label="Pipeline abierto" value={stats?.open ?? '—'} />
            <Kpi label="En prueba" value={stats?.byStatus?.EN_PRUEBA ?? 0} />
            <Kpi label="Convertidos" value={stats?.byStatus?.CONVERTIDO ?? 0} />
            <Kpi label="Actividades hoy" value={stats?.activities?.today ?? 0} />
            <Kpi label="Tasa conversión" value={stats?.conversionRate != null ? `${stats.conversionRate}%` : '—'} />
          </Box>
        </Box>
      </Box>

      {/* Metas con progreso */}
      <GoalsCard />

      {/* Tip de coaching */}
      <DailyTipCard />

      {/* Agenda visual del día */}
      <DayAgendaCalendar tasks={tasks} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
      ) : (
        <>
          {tasks.length === 0 ? (
            <Box sx={{ ...softCard, textAlign: 'center', py: 6, px: 3 }}>
              <CheckCircleOutline sx={{ fontSize: 48, color: '#10b981', mb: 1.5 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#041a12', mb: 0.5 }}>
                Sin tareas pendientes
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#5b6b7a', mb: 2 }}>
                Aprovecha para agregar leads nuevos o trabajar tu lista.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/portal-admin/sales/leads')}
                sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#064a38' } }}>
                Ir a Leads
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {vencidas.length > 0 && (
                <TaskGroup title="Vencidas" tone="danger" tasks={vencidas} onDone={markDone} onOpen={(id) => navigate(`/portal-admin/sales/leads/${id}`)} />
              )}
              {hoy.length > 0 && (
                <TaskGroup title="Hoy" tone="warning" tasks={hoy} onDone={markDone} onOpen={(id) => navigate(`/portal-admin/sales/leads/${id}`)} />
              )}
              {proximas.length > 0 && (
                <TaskGroup title="Próximas" tone="neutral" tasks={proximas} onDone={markDone} onOpen={(id) => navigate(`/portal-admin/sales/leads/${id}`)} />
              )}
            </Box>
          )}
        </>
      )}

      <Snackbar open={!!snack} autoHideDuration={2400} onClose={() => setSnack(null)}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Container>
  );
}

function Kpi({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#fff', mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

function TaskGroup({ title, tone, tasks, onDone, onOpen }) {
  const colors = {
    danger:  { bar: '#ef4444', label: '#b91c1c' },
    warning: { bar: '#f59e0b', label: '#b45309' },
    neutral: { bar: '#6b7280', label: '#374151' },
  }[tone] || { bar: '#6b7280', label: '#374151' };

  return (
    <Box>
      <Typography sx={{
        fontSize: 11, fontWeight: 700, color: colors.label, mb: 1.25,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {title} · {tasks.length}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {tasks.map((t) => {
          const Icon = TYPE_ICON[t.type] || EventOutlined;
          const tel = telHref(t.lead?.telefono);
          const wa = waMeHref(t.lead?.telefono, `Hola ${t.lead?.nombre || ''}, te contacto de OírConecta.`);
          const mail = mailtoHref(t.lead?.email, 'Hola desde OírConecta', `Hola ${t.lead?.nombre || ''},`);
          return (
            <Box key={t.id} sx={{
              ...softCard, borderLeft: `4px solid ${colors.bar}`,
              p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                bgcolor: `${colors.bar}15`, color: colors.label,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#041a12' }}>
                    {t.lead?.nombre || 'Sin lead'}
                  </Typography>
                  {t.lead?.status && <StatusPill status={t.lead.status} />}
                  <Typography sx={{ fontSize: 12, color: '#5b6b7a' }}>
                    {fmtDue(t.dueAt)}
                  </Typography>
                </Box>
                {t.notes && (
                  <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.notes}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                {tel && <QuickBtn href={tel} icon={PhoneOutlined} color="#4054B2" title="Llamar" />}
                {wa && <QuickBtn href={wa} icon={WhatsApp} color="#25D366" title="WhatsApp" external />}
                {mail && <QuickBtn href={mail} icon={EmailOutlined} color="#8b5cf6" title="Email" />}
                <Button onClick={() => onOpen(t.lead?.id)} size="small"
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', color: '#272F50', fontWeight: 700, fontSize: 12.5 }}>
                  Abrir
                </Button>
                <Button onClick={() => onDone(t.id)} size="small"
                  startIcon={<CheckCircleOutline sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', color: '#10b981', fontWeight: 700, fontSize: 12.5 }}>
                  Hecha
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function QuickBtn({ href, icon: Icon, color, title, external }) {
  return (
    <Box
      component="a"
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      title={title}
      sx={{
        width: 30, height: 30, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `${color}15`, color, textDecoration: 'none',
        '&:hover': { bgcolor: `${color}25` },
      }}
    >
      <Icon sx={{ fontSize: 16 }} />
    </Box>
  );
}
