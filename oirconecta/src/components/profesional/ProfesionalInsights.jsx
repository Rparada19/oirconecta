/**
 * Insights interpretados para el dashboard del profesional.
 * Lee profile + stats + inquiries y genera 1-4 cards con acción concreta.
 */
import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import {
  ArrowForward, TrendingUpOutlined, MailOutlined, VisibilityOutlined,
  WhatsApp, VerifiedOutlined, EditOutlined, ShareOutlined,
} from '@mui/icons-material';

const TONES = {
  positive:  { bar: '#10b981', metric: '#047857', bgIcon: 'rgba(16,185,129,0.10)' },
  attention: { bar: '#f59e0b', metric: '#b45309', bgIcon: 'rgba(245,158,11,0.10)' },
  warning:   { bar: '#ef4444', metric: '#b91c1c', bgIcon: 'rgba(239,68,68,0.10)' },
  neutral:   { bar: '#6b7280', metric: '#041a12', bgIcon: 'rgba(0,0,0,0.04)' },
};

function Card({ tone, icon: Icon, title, body, actionLabel, onAction }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      bgcolor: '#fff', border: '1px solid #e5e7eb',
      borderLeft: `3px solid ${t.bar}`, borderRadius: 2,
      p: 2, height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
          bgcolor: t.bgIcon, color: t.metric,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ fontSize: 16 }} />
        </Box>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#041a12', lineHeight: 1.3 }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: '#4a5568', lineHeight: 1.55, flex: 1 }}>
        {body}
      </Typography>
      {actionLabel && onAction && (
        <Button onClick={onAction} endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
          sx={{
            mt: 1.5, alignSelf: 'flex-start', color: '#085946', fontWeight: 600, fontSize: 12.5,
            textTransform: 'none', px: 1, py: 0.25, minWidth: 0,
            '&:hover': { bgcolor: 'rgba(8,89,70,0.06)' },
          }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

function profileCompleteness(p) {
  if (!p) return 0;
  const checks = [
    !!p.nombre, !!p.telefono, !!p.email, !!p.foto, !!p.descripcion,
    !!(p.profesion || p.profesionPrincipal),
    !!(p.servicios && p.servicios.length),
    !!(p.direccion || p.ciudad),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export default function ProfesionalInsights({ profile, stats, inquiries = [], onNavigate }) {
  const cards = [];
  const newInquiries = inquiries.filter((i) => i.status === 'NEW').length;
  const completeness = profileCompleteness(profile);

  if (profile?.status === 'PENDING') {
    cards.push({
      tone: 'attention', icon: VerifiedOutlined,
      title: 'Perfil en revisión',
      body: 'Mientras aprobamos tu perfil, aprovecha para completar fotos y servicios. Los perfiles completos se aprueban más rápido.',
      actionLabel: 'Editar mi perfil',
      onAction: () => onNavigate?.('/portal-profesional/perfil'),
    });
  }

  if (newInquiries > 0) {
    cards.push({
      tone: 'warning', icon: MailOutlined,
      title: `${newInquiries} consulta${newInquiries === 1 ? ' nueva sin responder' : 's nuevas sin responder'}`,
      body: 'Responder en las primeras 24 horas multiplica por 3 la conversión a paciente. Las consultas en frío caen rápido.',
      actionLabel: 'Ver consultas',
      onAction: () => onNavigate?.('/portal-profesional/consultas'),
    });
  }

  if (completeness < 80 && profile?.status !== 'REJECTED') {
    cards.push({
      tone: 'attention', icon: EditOutlined,
      title: `Tu perfil está al ${completeness}%`,
      body: 'Los perfiles con foto, descripción y servicios reciben hasta 4× más visitas. Súbele a 100% para aparecer mejor en búsquedas.',
      actionLabel: 'Completar perfil',
      onAction: () => onNavigate?.('/portal-profesional/perfil'),
    });
  }

  const visitasMes = stats?.visitas?.mes ?? 0;
  const consultasMes = stats?.consultas?.mes ?? 0;
  if (visitasMes > 20 && consultasMes === 0) {
    cards.push({
      tone: 'warning', icon: TrendingUpOutlined,
      title: 'Mucha visita, cero consulta',
      body: `${visitasMes} personas vieron tu perfil este mes pero ninguna escribió. Revisa que tu descripción y servicios sean claros, y que tengas foto profesional.`,
      actionLabel: 'Editar perfil',
      onAction: () => onNavigate?.('/portal-profesional/perfil'),
    });
  }

  if (visitasMes > 0 && consultasMes > 0) {
    const tasa = Math.round((consultasMes / visitasMes) * 100);
    if (tasa >= 8) {
      cards.push({
        tone: 'positive', icon: TrendingUpOutlined,
        title: `Tasa de conversión sólida: ${tasa}%`,
        body: `De ${visitasMes} visitas, ${consultasMes} se convirtieron en consultas. Vas por encima del promedio del directorio. Considera invertir en visibilidad.`,
        actionLabel: 'Ver suscripción',
        onAction: () => onNavigate?.('/portal-profesional/suscripcion'),
      });
    }
  }

  if ((stats?.whatsapp?.mes ?? 0) === 0 && (stats?.consultas?.mes ?? 0) === 0 && visitasMes < 5) {
    cards.push({
      tone: 'neutral', icon: ShareOutlined,
      title: 'Comparte tu ficha pública',
      body: 'Comparte el enlace de tu ficha en redes y WhatsApp con tus pacientes actuales. Es la forma más rápida de ganar primeras visitas.',
      actionLabel: 'Ver mi ficha',
      onAction: () => {
        const id = profile?.id || profile?.profileId || profile?.slug;
        if (id) window.open(`/directorio/profesional/${id}`, '_blank');
      },
    });
  }

  if (cards.length === 0) {
    cards.push({
      tone: 'positive', icon: VerifiedOutlined,
      title: 'Todo al día',
      body: 'No hay alertas pendientes. Buen momento para revisar tus servicios o publicar una novedad en tu perfil.',
      actionLabel: 'Editar perfil',
      onAction: () => onNavigate?.('/portal-profesional/perfil'),
    });
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{
        fontSize: 11, fontWeight: 700, color: '#085946', mb: 1.25,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Recomendaciones para ti
      </Typography>
      <Grid container spacing={2}>
        {cards.slice(0, 4).map((c, i) => (
          <Grid item xs={12} sm={6} md={cards.length >= 4 ? 3 : 4} key={i}>
            <Card {...c} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
