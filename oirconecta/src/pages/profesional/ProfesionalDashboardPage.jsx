import React, { useState, useEffect } from 'react';
import { useOutletContext, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Divider,
} from '@mui/material';
import {
  VisibilityOutlined,
  WhatsApp,
  MailOutlined,
  VerifiedOutlined,
  ArrowForward,
  InfoOutlined,
  ErrorOutline,
  PhoneInTalkOutlined,
  DashboardOutlined,
} from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';
import ProfesionalInsights from '../../components/profesional/ProfesionalInsights';
import WelcomeHero from '../../components/profesional/WelcomeHero';
import KpiCard from '../../components/crm/ui/KpiCard';

const glassCard = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

function statusChipConfig(status) {
  const map = {
    PENDING: { label: 'En revisión', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    APPROVED: { label: 'Aprobado', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    REJECTED: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  };
  return map[status] || { label: status || '—', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
}

function StatCard({ icon, label, value, sub, iconBg, loading }) {
  return (
    <Card elevation={0} sx={glassCard}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: iconBg, width: 44, height: 44 }}>{icon}</Avatar>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
            {label}
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={22} sx={{ color: '#085946' }} />
        ) : (
          <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#041a12', lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
            {sub != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mt: 0.75 }}>
                {sub}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function inquiryStatusChip(status) {
  const map = {
    NEW: { label: 'Nueva', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    READ: { label: 'Leída', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
    ARCHIVED: { label: 'Archivada', color: '#374151', bg: 'rgba(55,65,81,0.12)' },
  };
  const s = map[status] || { label: status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  return (
    <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem' }} />
  );
}

export default function ProfesionalDashboardPage() {
  const { profile: ctxProfile } = useOutletContext() || {};
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      directoryApi.get(DIRECTORY_API.me),
      directoryApi.get(DIRECTORY_API.meInquiries),
      directoryApi.get(DIRECTORY_API.myStats),
    ]).then(([meRes, inquiriesRes, statsRes]) => {
      if (meRes.error) setError(meRes.error);
      else setProfile(meRes.data?.data || null);
      const rawInq = inquiriesRes.data?.data;
      setInquiries(Array.isArray(rawInq) ? rawInq : (rawInq?.items || []));
      if (statsRes?.data?.data) setStats(statsRes.data.data);
      setLoading(false);
    });
  }, []);

  const p = profile || ctxProfile;
  const newCount = inquiries.filter((i) => i.status === 'NEW').length;
  const latestThree = [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const statusCfg = statusChipConfig(p?.status);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#085946' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero con gradiente navy→verde, saludo, trial y CTA */}
      <WelcomeHero
        profile={p}
        stats={stats}
        inquiriesNew={newCount}
        onActivate={() => navigate('/portal-profesional/suscripcion')}
      />

      {/* Recomendaciones interpretadas */}
      <ProfesionalInsights
        profile={p}
        stats={stats}
        inquiries={inquiries}
        onNavigate={(path) => navigate(path)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Banners de estado */}
      {p?.status === 'PENDING' && (
        <Alert
          severity="info"
          icon={<InfoOutlined />}
          sx={{ mb: 3, borderRadius: '14px', bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#1E40AF' }}
        >
          <strong>Tu perfil está en revisión</strong> — te notificaremos cuando sea aprobado. Mientras tanto puedes completar y mejorar tu información.
        </Alert>
      )}
      {p?.status === 'REJECTED' && (
        <Alert
          severity="error"
          icon={<ErrorOutline />}
          sx={{ mb: 3, borderRadius: '14px' }}
        >
          <strong>Tu perfil fue rechazado.</strong>{' '}
          {p.rejectionReason ? `Motivo: ${p.rejectionReason}.` : ''} Edita tu perfil y contáctanos para una nueva revisión.
        </Alert>
      )}

      {/* Stats del mes */}
      <Typography sx={{
        fontSize: 11, fontWeight: 700, color: '#085946', mb: 1.25,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Este mes
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <KpiCard
          label="Visitas al perfil"
          value={stats?.visitas?.mes ?? 0}
          hint={`${stats?.visitas?.total ?? p?.perfilVisitas ?? 0} en total`}
          tone="info"
        />
        <KpiCard
          label="Consultas"
          value={stats?.consultas?.mes ?? 0}
          hint={`${stats?.consultas?.total ?? inquiries.length} en total · ${newCount} nuevas`}
          tone="violet"
        />
        <KpiCard
          label="Clics WhatsApp"
          value={stats?.whatsapp?.mes ?? 0}
          hint={`${stats?.whatsapp?.total ?? p?.whatsappClickCount ?? 0} en total`}
          tone="success"
        />
        <KpiCard
          label="Llamadas directas"
          value={stats?.llamadas?.mes ?? 0}
          hint={`${stats?.llamadas?.total ?? p?.callClickCount ?? 0} en total`}
          tone="warning"
        />
        <KpiCard
          label="Clics en Email"
          value={stats?.email?.mes ?? 0}
          hint={`${stats?.email?.total ?? 0} en total`}
          tone="violet"
        />
        <KpiCard
          label="Clics en Agendar"
          value={stats?.agendar?.mes ?? 0}
          hint={`${stats?.agendar?.total ?? 0} en total`}
          tone="info"
        />
      </Box>
      <Typography sx={{ fontSize: 11.5, color: '#5b6b7a', mb: 3, fontStyle: 'italic' }}>
        Solo cuentas los contactos: no almacenamos ni leemos los mensajes que te envían los pacientes desde la ficha pública.
      </Typography>

      {/* Últimas consultas */}
      <Card elevation={0} sx={glassCard}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#041a12' }}>
              Últimas consultas recibidas
            </Typography>
            <Button
              component={RouterLink}
              to="/portal-profesional/consultas"
              endIcon={<ArrowForward />}
              size="small"
              sx={{ color: '#085946', fontWeight: 700, textTransform: 'none' }}
            >
              Ver todas
            </Button>
          </Box>

          {latestThree.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              Aún no has recibido consultas.
            </Typography>
          ) : (
            latestThree.map((inq, idx) => (
              <Box key={inq.id || idx}>
                <Box sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#041a12', flex: 1 }}>
                      {inq.nombre || inq.name || 'Sin nombre'}
                    </Typography>
                    {inquiryStatusChip(inq.status)}
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(inq.createdAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {inq.mensaje || inq.message || '—'}
                  </Typography>
                </Box>
                {idx < latestThree.length - 1 && <Divider />}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
