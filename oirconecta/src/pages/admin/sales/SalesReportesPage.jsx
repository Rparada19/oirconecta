/**
 * Reportes del CRM Sales — KPIs del ejecutivo + pipeline + actividad.
 */
import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import { InsightsOutlined } from '@mui/icons-material';
import { salesApi, STATUS_META, PIPELINE_STAGES } from '../../../services/salesApi';
import { SalesPageHeader, softCard } from './SalesShell';

export default function SalesReportesPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#085946' }} /></Box>;

  const counts = stats?.byStatus || {};
  const total = stats?.open + stats?.closed || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SalesPageHeader icon={InsightsOutlined} title="Reportes" subtitle="KPIs de captación, pipeline y actividad" />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
        <Kpi label="Pipeline abierto" value={stats?.open ?? 0} tone="info" />
        <Kpi label="Convertidos" value={counts.CONVERTIDO ?? 0} tone="success" />
        <Kpi label="En prueba" value={counts.EN_PRUEBA ?? 0} tone="violet" />
        <Kpi label="Tasa conversión" value={stats?.conversionRate != null ? `${stats.conversionRate}%` : '—'} tone="warning" />
      </Box>

      {/* Pipeline visual */}
      <Box sx={{ ...softCard, p: 2.5, mb: 3 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
          Pipeline por estado
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
          {PIPELINE_STAGES.map((s) => {
            const c = counts[s] || 0;
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            const m = STATUS_META[s];
            return (
              <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: m.color, minWidth: 130 }}>{m.label}</Typography>
                <Box sx={{ flex: 1, height: 22, bgcolor: '#f3f4f6', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: m.color, transition: 'width 240ms ease' }} />
                </Box>
                <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {c} · {pct}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Actividad */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        <Kpi label="Actividades hoy" value={stats?.activities?.today ?? 0} tone="info" hint="Llamadas + emails + WA" />
        <Kpi label="Esta semana" value={stats?.activities?.week ?? 0} tone="violet" />
        <Kpi label="Este mes" value={stats?.activities?.month ?? 0} tone="success" />
      </Box>
    </Container>
  );
}

const TONES = {
  info:    { bar: '#3b82f6', num: '#1e40af' },
  success: { bar: '#10b981', num: '#065f46' },
  violet:  { bar: '#8b5cf6', num: '#5b21b6' },
  warning: { bar: '#f59e0b', num: '#92400e' },
};

function Kpi({ label, value, hint, tone = 'info' }) {
  const t = TONES[tone] || TONES.info;
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${t.bar}`,
      borderRadius: 2, px: 2, py: 1.75,
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5b6b7a' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: t.num, lineHeight: 1.2, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {hint && <Typography sx={{ fontSize: 11.5, color: '#5b6b7a', mt: 0.25 }}>{hint}</Typography>}
    </Box>
  );
}
