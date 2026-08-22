import { useEffect, useState } from 'react';
import {
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  MenuItem,
  Divider,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import UnsubscribeRoundedIcon from '@mui/icons-material/UnsubscribeRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { adminFetch } from './adminAuth';
import { exportRowsToExcel, exportRowsToPdf } from '../../utils/adminExport';

const SEGMENTO_LABEL = { PACIENTE: 'Paciente', FAMILIAR: 'Familiar', PROFESIONAL: 'Profesional', OTRO: 'Otro' };
const SEGMENTOS = ['PACIENTE', 'FAMILIAR', 'PROFESIONAL', 'OTRO'];
const CAMPANA_VACIA = { asunto: '', preheader: '', htmlContent: '', imagenUrl: '', segmentos: [], blogPostId: '' };

const subsToRows = (subs) => subs.map((s) => ({
  Nombre: s.nombre || '',
  Correo: s.email || '',
  Teléfono: s.telefono || '',
  Ciudad: s.ciudad || '',
  Segmento: SEGMENTO_LABEL[s.tipo] || 'Sin clasificar',
  Estado: s.status === 'ACTIVE' ? 'Activo' : s.status === 'UNSUBSCRIBED' ? 'Baja' : 'Rebote',
  Alta: s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-CO') : '',
}));

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
  const [posts, setPosts] = useState([]);
  const [editor, setEditor] = useState(false);
  const [campana, setCampana] = useState(CAMPANA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  // Destinatarios de la selección actual: se calcula sobre los suscriptores ya
  // cargados, sin pedir nada al servidor.
  const destinatarios = subs.filter(
    (x) => x.status === 'ACTIVE' && (campana.segmentos.length === 0 || campana.segmentos.includes(x.tipo || 'OTRO')),
  ).length;

  const toggleSegmento = (code) =>
    setCampana((c) => ({
      ...c,
      segmentos: c.segmentos.includes(code) ? c.segmentos.filter((x) => x !== code) : [...c.segmentos, code],
    }));

  // Al elegir un artículo se rellenan asunto e imagen; el cuerpo lo arma el
  // backend al crear la campaña desde el post.
  const elegirPost = (id) => {
    const post = posts.find((p) => (p.id || p._id) === id);
    setCampana((c) => ({
      ...c,
      blogPostId: id,
      asunto: post ? post.titulo : c.asunto,
      preheader: post?.resumen ? post.resumen.slice(0, 160) : c.preheader,
      imagenUrl: post?.coverUrl || c.imagenUrl,
    }));
  };

  const cuerpoHtml = () => {
    const img = campana.imagenUrl
      ? `<img src="${campana.imagenUrl}" alt="" style="width:100%;max-width:560px;border-radius:12px;margin-bottom:24px;" />`
      : '';
    const cuerpo = campana.htmlContent.trim().startsWith('<')
      ? campana.htmlContent
      : campana.htmlContent
          .split(/\n{2,}/)
          .map((par) => `<p style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 18px;">${par.replace(/\n/g, '<br/>')}</p>`)
          .join('');
    return `${img}${cuerpo}`;
  };

  const guardarCampana = async (enviarYa) => {
    setAviso(null);
    if (!campana.asunto.trim()) return setAviso({ tipo: 'error', msg: 'Ponle un asunto.' });
    if (!campana.blogPostId && !campana.htmlContent.trim()) {
      return setAviso({ tipo: 'error', msg: 'Escribe el contenido o elige un artículo.' });
    }
    setGuardando(true);
    let creada;
    if (campana.blogPostId) {
      creada = await adminFetch(`/api/newsletter/admin/campaigns/from-blog/${campana.blogPostId}`, {
        method: 'POST',
        body: JSON.stringify({ segmentos: campana.segmentos }),
      });
    } else {
      creada = await adminFetch('/api/newsletter/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          asunto: campana.asunto,
          preheader: campana.preheader || undefined,
          htmlContent: cuerpoHtml(),
          segmentos: campana.segmentos,
        }),
      });
    }
    if (!creada?.data?.success) {
      setGuardando(false);
      return setAviso({ tipo: 'error', msg: creada?.error || 'No se pudo crear la campaña' });
    }
    if (!enviarYa) {
      setGuardando(false);
      setEditor(false);
      setCampana(CAMPANA_VACIA);
      loadCampaigns();
      return;
    }
    const id = creada.data.data.id;
    const env = await adminFetch(`/api/newsletter/admin/campaigns/${id}/send`, { method: 'POST' });
    setGuardando(false);
    if (env?.data?.success) {
      setAviso({ tipo: 'success', msg: `Enviada a ${env.data.data.recipients} suscriptores.` });
      setCampana(CAMPANA_VACIA);
      loadCampaigns();
      loadStats();
    } else {
      setAviso({ tipo: 'error', msg: env?.error || 'Quedó como borrador pero no se pudo enviar' });
      loadCampaigns();
    }
  };

  const enviarBorrador = async (c) => {
    if (!window.confirm(`¿Enviar "${c.asunto}" ahora?`)) return;
    const env = await adminFetch(`/api/newsletter/admin/campaigns/${c.id}/send`, { method: 'POST' });
    if (env?.data?.success) { loadCampaigns(); loadStats(); }
  };

  const loadStats = () => adminFetch('/api/newsletter/admin/stats').then((r) => r.data?.success && setStats(r.data.data));
  const loadSubs = (search = '') =>
    adminFetch(`/api/newsletter/admin/subscribers?limit=200${search ? `&q=${encodeURIComponent(search)}` : ''}`)
      .then((r) => r.data?.success && setSubs(r.data.data.items || []));
  const loadCampaigns = () => adminFetch('/api/newsletter/admin/campaigns').then((r) => r.data?.success && setCampaigns(r.data.data || []));
  const loadPosts = () => adminFetch('/api/blog/admin/all').then((r) => {
    const lista = r.data?.data || r.data?.posts || [];
    setPosts(lista.filter((p) => p.estado === 'PUBLICADO'));
  });

  useEffect(() => {
    Promise.all([loadStats(), loadSubs(), loadCampaigns(), loadPosts()]).finally(() => setLoading(false));
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
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre, correo o ciudad…"
              value={q}
              onChange={(e) => { setQ(e.target.value); loadSubs(e.target.value); }}
              sx={{ width: { xs: '100%', sm: 360 } }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} disabled={!subs.length}
              onClick={() => exportRowsToExcel(subsToRows(subs), 'newsletter_suscriptores', 'Suscriptores')}>
              Excel
            </Button>
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} disabled={!subs.length}
              onClick={() => exportRowsToPdf(subsToRows(subs), 'newsletter_suscriptores', 'Suscriptores — Newsletter OírConecta')}>
              PDF
            </Button>
          </Stack>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100', overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Correo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ciudad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Segmento</TableCell>
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
                        label={SEGMENTO_LABEL[s.tipo] || 'Sin clasificar'}
                        sx={{ bgcolor: '#eef4f2', color: '#085946', fontWeight: 600, fontSize: '0.6875rem' }}
                      />
                    </TableCell>
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
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => { setCampana(CAMPANA_VACIA); setAviso(null); setEditor(true); }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#085946', '&:hover': { bgcolor: '#064c3c' } }}
            >
              Nueva campaña
            </Button>
          </Stack>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100', overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Asunto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Para</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Enviados</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Aperturas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tasa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.asunto}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {(c.segmentos || []).length
                        ? c.segmentos.map((t) => SEGMENTO_LABEL[t]).join(', ')
                        : 'Todos'}
                    </TableCell>
                    <TableCell><Chip size="small" label={c.status} /></TableCell>
                    <TableCell>{c.sentCount}</TableCell>
                    <TableCell>{c.openCount}</TableCell>
                    <TableCell>{c.sentCount ? `${Math.round((c.openCount / c.sentCount) * 100)}%` : '—'}</TableCell>
                    <TableCell>{c.sentAt ? new Date(c.sentAt).toLocaleDateString('es-CO') : '—'}</TableCell>
                    <TableCell>
                      {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                        <Button size="small" onClick={() => enviarBorrador(c)} sx={{ textTransform: 'none', color: '#085946', fontWeight: 700 }}>
                          Enviar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin campañas todavía.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </Box>
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

      {/* Compositor de campaña */}
      <Dialog open={editor} onClose={() => !guardando && setEditor(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Nueva campaña</DialogTitle>
        <DialogContent>
          {aviso && <Alert severity={aviso.tipo} sx={{ mb: 2 }}>{aviso.msg}</Alert>}

          <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1, mt: 1 }}>
            ¿Sobre qué es?
          </Typography>
          <TextField
            select fullWidth size="small" label="Partir de un artículo publicado (opcional)"
            value={campana.blogPostId}
            onChange={(e) => (e.target.value ? elegirPost(e.target.value) : setCampana({ ...campana, blogPostId: '' }))}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="">Escribir desde cero</MenuItem>
            {posts.map((p) => (
              <MenuItem key={p.id || p._id} value={p.id || p._id}>{p.titulo}</MenuItem>
            ))}
          </TextField>

          <Stack spacing={2}>
            <TextField
              label="Asunto" size="small" fullWidth required
              value={campana.asunto}
              onChange={(e) => setCampana({ ...campana, asunto: e.target.value })}
              helperText="Es lo único que se ve en la bandeja de entrada. Sé concreto."
            />
            <TextField
              label="Vista previa (preheader)" size="small" fullWidth
              value={campana.preheader}
              onChange={(e) => setCampana({ ...campana, preheader: e.target.value })}
              helperText="La línea gris que aparece junto al asunto."
            />
            {!campana.blogPostId && (
              <>
                <TextField
                  label="Imagen de portada (URL)" size="small" fullWidth
                  value={campana.imagenUrl}
                  onChange={(e) => setCampana({ ...campana, imagenUrl: e.target.value })}
                  helperText="Opcional. Debe ser una imagen ya publicada en el sitio."
                />
                <TextField
                  label="Contenido" multiline rows={9} fullWidth
                  value={campana.htmlContent}
                  onChange={(e) => setCampana({ ...campana, htmlContent: e.target.value })}
                  helperText="Escribe normal: cada párrafo se separa con una línea en blanco. Si escribes HTML, se respeta tal cual."
                />
              </>
            )}
            {campana.blogPostId && (
              <Alert severity="info">
                El correo se arma solo con la portada, el título, el resumen y un botón al artículo.
              </Alert>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', mb: 1 }}>¿A quién se lo mandamos?</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {SEGMENTOS.map((code) => {
              const activo = campana.segmentos.includes(code);
              const cuantos = subs.filter((x) => x.status === 'ACTIVE' && (x.tipo || 'OTRO') === code).length;
              return (
                <Chip
                  key={code}
                  label={`${SEGMENTO_LABEL[code]} (${cuantos})`}
                  onClick={() => toggleSegmento(code)}
                  sx={{
                    cursor: 'pointer', fontWeight: 600,
                    ...(activo ? { bgcolor: '#085946', color: '#fff' } : { bgcolor: '#f1f5f9', color: '#64748b' }),
                  }}
                />
              );
            })}
          </Stack>
          <Typography sx={{ mt: 1.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            {campana.segmentos.length === 0
              ? `Sin filtro: llega a los ${destinatarios} suscriptores activos.`
              : `Llega a ${destinatarios} ${destinatarios === 1 ? 'persona' : 'personas'}.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditor(false)} disabled={guardando} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={() => guardarCampana(false)} disabled={guardando} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Guardar borrador
          </Button>
          <Button
            onClick={() => guardarCampana(true)} disabled={guardando || destinatarios === 0}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#085946', '&:hover': { bgcolor: '#064c3c' } }}
          >
            {guardando ? 'Enviando…' : `Enviar a ${destinatarios}`}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
