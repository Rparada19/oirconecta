import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { adminFetch, getAdminToken } from './adminAuth';

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 4px 24px rgba(8,89,70,0.08)',
};

const HEADER_GRADIENT = {
  background: 'linear-gradient(135deg, #085946 0%, #6ee7c8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const statusColors = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  PUBLICADO: 'success',
  BORRADOR: 'default',
  ARCHIVADO: 'secondary',
};

const statusLabels = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PUBLICADO: 'Publicado',
  BORRADOR: 'Borrador',
  ARCHIVADO: 'Archivado',
};

function StatCard({ icon, label, value, color, loading }) {
  return (
    <Card sx={{ ...GLASS_CARD, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={24} sx={{ color }} />
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a2035', lineHeight: 1 }}>
                {value ?? '—'}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${color}22, ${color}44)`,
              border: `2px solid ${color}33`,
            }}
          >
            {React.cloneElement(icon, { sx: { color } })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profesionales, setProfesionales] = useState([]);
  const [posts, setPosts] = useState([]);
  const [marketplace, setMarketplace] = useState([]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { navigate('/login-crm', { replace: true }); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const [profRes, blogRes, mktRes] = await Promise.all([
      adminFetch('/api/directory/admin/profiles'),
      adminFetch('/api/blog/admin/all?estado=PUBLICADO'),
      adminFetch('/api/marketplace/admin/all?estado=ACTIVO'),
    ]);
    if (profRes.error && blogRes.error && mktRes.error) {
      setError('No se pudieron cargar los datos. Verifica tu conexión.');
    }
    setProfesionales(profRes.data?.data || profRes.data || []);
    setPosts(blogRes.data?.data || blogRes.data || []);
    setMarketplace(mktRes.data?.data || mktRes.data || []);
    setLoading(false);
  };

  const allProf = Array.isArray(profesionales) ? profesionales : [];
  const pending = allProf.filter((p) => p.status === 'PENDING' || p.status === 'pending');
  const allPosts = Array.isArray(posts) ? posts : [];
  const allMkt = Array.isArray(marketplace) ? marketplace : [];

  const recentPending = pending.slice(0, 5);

  // Fetch all blog posts for "últimos 5"
  const [allBlogPosts, setAllBlogPosts] = useState([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  useEffect(() => {
    (async () => {
      const res = await adminFetch('/api/blog/admin/all');
      setAllBlogPosts(res.data?.data || res.data || []);
      setLoadingBlog(false);
    })();
  }, []);
  const recentPosts = Array.isArray(allBlogPosts) ? allBlogPosts.slice(0, 5) : [];

  const stats = [
    {
      label: 'Profesionales registrados',
      value: allProf.length,
      icon: <PeopleOutlinedIcon />,
      color: '#085946',
    },
    {
      label: 'Pendientes de aprobación',
      value: pending.length,
      icon: <HourglassEmptyOutlinedIcon />,
      color: '#f59e0b',
    },
    {
      label: 'Posts publicados',
      value: allPosts.length,
      icon: <ArticleOutlinedIcon />,
      color: '#6ee7c8',
    },
    {
      label: 'Servicios activos',
      value: allMkt.length,
      icon: <StorefrontOutlinedIcon />,
      color: '#272F50',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>
          Panel de administración
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Resumen general de OírConecta
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <StatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Pending professionals */}
        <Grid item xs={12} md={7}>
          <Card sx={GLASS_CARD}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2035' }}>
                  Solicitudes pendientes
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  onClick={() => navigate('/portal-admin/profesionales')}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#085946',
                    '&:hover': { background: 'rgba(8,89,70,0.06)' },
                  }}
                >
                  Ver todas
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#085946' }} />
                </Box>
              ) : recentPending.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  No hay solicitudes pendientes
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Nombre', 'Profesión', 'Ciudad', 'Fecha'].map((h) => (
                          <TableCell
                            key={h}
                            sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', border: 0, pb: 1 }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPending.map((p, i) => (
                        <TableRow
                          key={p._id || p.accountId || i}
                          sx={{
                            '&:hover': { background: 'rgba(8,89,70,0.04)' },
                            cursor: 'pointer',
                            borderRadius: '8px',
                          }}
                          onClick={() => navigate('/portal-admin/profesionales')}
                        >
                          <TableCell sx={{ border: 0, py: 1.2, fontWeight: 600, fontSize: '0.82rem' }}>
                            {p.displayName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}>
                            {p.profession || p.profesion || '—'}
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}>
                            {p.workplaces?.[0]?.city || p.ciudad || '—'}
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 1.2, fontSize: '0.78rem', color: 'text.secondary' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent blog posts */}
        <Grid item xs={12} md={5}>
          <Card sx={GLASS_CARD}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2035' }}>
                  Últimos posts
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  size="small"
                  onClick={() => navigate('/portal-admin/blog')}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#085946',
                    '&:hover': { background: 'rgba(8,89,70,0.06)' },
                  }}
                >
                  Ver todos
                </Button>
              </Box>
              {loadingBlog ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#085946' }} />
                </Box>
              ) : recentPosts.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  No hay posts todavía
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentPosts.map((post, i) => (
                    <Box
                      key={post._id || i}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '12px',
                        background: 'rgba(8,89,70,0.03)',
                        border: '1px solid rgba(8,89,70,0.06)',
                        cursor: 'pointer',
                        '&:hover': { background: 'rgba(8,89,70,0.06)' },
                      }}
                      onClick={() => navigate('/portal-admin/blog')}
                    >
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: '#1a2035',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {post.titulo || post.title || '(Sin título)'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {post.categoria || post.category || 'general'}
                          {post.createdAt && ` · ${new Date(post.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabels[post.estado || post.status] || post.estado || '—'}
                        color={statusColors[post.estado || post.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
