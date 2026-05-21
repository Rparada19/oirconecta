import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import UnsubscribeRoundedIcon from '@mui/icons-material/UnsubscribeRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { adminFetch } from './adminAuth';

function StatCard({ icon, value, label, color = 'primary.main' }) {
  return (
    <Card elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.100', flex: 1, minWidth: 160 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [subs, setSubs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStats = () => adminFetch('/api/newsletter/admin/stats').then((r) => r.data?.success && setStats(r.data.data));
  const loadSubs = (search = '') =>
    adminFetch(`/api/newsletter/admin/subscribers?limit=200${search ? `&q=${encodeURIComponent(search)}` : ''}`)
      .then((r) => r.data?.success && setSubs(r.data.data.items || []));
  const loadCampaigns = () => adminFetch('/api/newsletter/admin/campaigns').then((r) => r.data?.success && setCampaigns(r.data.data || []));

  useEffect(() => {
    Promise.all([loadStats(), loadSubs(), loadCampaigns()]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>Newsletter</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Suscriptores, campañas y métricas de apertura del boletín.
      </Typography>

      {stats && (
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 2 }}>
          <StatCard icon={<PeopleAltRoundedIcon />} value={stats.activos} label="Suscriptores activos" />
          <StatCard icon={<UnsubscribeRoundedIcon />} value={stats.bajas} label="Bajas" color="error.main" />
          <StatCard icon={<MarkEmailReadRoundedIcon />} value={stats.total} label="Total histórico" color="secondary.main" />
          <StatCard
            icon={<CampaignRoundedIcon />}
            value={stats.ultimasCampanas?.[0]?.openRate != null ? `${stats.ultimasCampanas[0].openRate}%` : '—'}
            label="Apertura última campaña"
            color="success.main"
          />
        </Stack>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Suscriptores (${subs.length})`} />
        <Tab label={`Campañas (${campaigns.length})`} />
        <Tab label="Por ciudad" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <TextField
            size="small"
            placeholder="Buscar por nombre, correo o ciudad…"
            value={q}
            onChange={(e) => { setQ(e.target.value); loadSubs(e.target.value); }}
            sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
          />
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100', overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Correo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ciudad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Alta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.telefono || '—'}</TableCell>
                    <TableCell>{s.ciudad || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.status === 'ACTIVE' ? 'Activo' : s.status === 'UNSUBSCRIBED' ? 'Baja' : 'Rebote'}
                        color={s.status === 'ACTIVE' ? 'success' : s.status === 'UNSUBSCRIBED' ? 'default' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  </TableRow>
                ))}
                {subs.length === 0 && (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin suscriptores aún.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {tab === 1 && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Asunto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Enviados</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Aperturas</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tasa</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.asunto}</TableCell>
                  <TableCell><Chip size="small" label={c.status} /></TableCell>
                  <TableCell>{c.sentCount}</TableCell>
                  <TableCell>{c.openCount}</TableCell>
                  <TableCell>{c.sentCount ? `${Math.round((c.openCount / c.sentCount) * 100)}%` : '—'}</TableCell>
                  <TableCell>{c.sentAt ? new Date(c.sentAt).toLocaleDateString('es-CO') : '—'}</TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin campañas todavía.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === 2 && stats && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100', p: 2 }}>
          <Stack spacing={1}>
            {(stats.porCiudad || []).map((c) => (
              <Stack key={c.ciudad || 'sin'} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'grey.50' }}>
                <Typography>{c.ciudad || 'Sin ciudad'}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{c._count._all}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
}
