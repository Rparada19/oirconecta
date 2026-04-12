import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { directoryApi, clearDirectoryToken } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import { PROFESIONES_CATALOGO } from '../../utils/profesionFilter';
import { POLIZAS_COLOMBIA } from '../../config/polizasColombia';
import {
  MARCAS_AUDIFONOS,
  MARCAS_IMPLANTES_COCLEARES,
  MARCAS_ACCESORIOS,
  MARCAS_FARMACIA,
} from '../../config/marcasDirectorioCategorias';
import { parseDirectoryAvailability, defaultDirectoryAvailability } from '../../utils/directoryAgendaDefaults';
import DirectoryAgendaEditor from '../../components/directorio/DirectoryAgendaEditor';
import { waMeHrefFromPhone } from '../../utils/directoryPresentation';

function emptyWorkplace(principal) {
  return { nombreCentro: '', ciudad: '', direccion: '', telefono: '', esPrincipal: principal };
}

function namesFromAlliesCategory(allies, key) {
  const arr = allies?.[key];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (item && typeof item === 'object' && item.name ? String(item.name).trim() : ''))
    .filter(Boolean);
}

function loadMarcasFromAllies(allies) {
  return {
    audifonos: namesFromAlliesCategory(allies, 'audifonos'),
    implantes: [
      ...new Set([
        ...namesFromAlliesCategory(allies, 'implantesCocleares'),
        ...namesFromAlliesCategory(allies, 'implantes'),
      ]),
    ],
    accesorios: namesFromAlliesCategory(allies, 'accesorios'),
    farmacia: [
      ...new Set([
        ...namesFromAlliesCategory(allies, 'farmacia'),
        ...namesFromAlliesCategory(allies, 'medicamentos'),
      ]),
    ],
  };
}

function buildAlliesMarcas(mAud, mImpl, mAcc, mFarm) {
  const lim = (arr) =>
    [...new Set((arr || []).map((s) => String(s).trim()).filter(Boolean))].slice(0, 40).map((name) => ({ name }));
  const out = {};
  const a = lim(mAud);
  const i = lim(mImpl);
  const c = lim(mAcc);
  const f = lim(mFarm);
  if (a.length) out.audifonos = a;
  if (i.length) out.implantesCocleares = i;
  if (c.length) out.accesorios = c;
  if (f.length) out.farmacia = f;
  return Object.keys(out).length ? out : null;
}

export default function MiDirectorioPage() {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [personaTipo, setPersonaTipo] = useState('NATURAL');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  /** MASCULINO | FEMENINO | '' (neutro). Solo persona natural; se guarda en `generoFicha`. */
  const [generoFicha, setGeneroFicha] = useState('');
  const [parentProfileId, setParentProfileId] = useState('');

  const [nombreConsultorio, setNombreConsultorio] = useState('');
  const [profesion, setProfesion] = useState('');
  const [polizas, setPolizas] = useState([]);
  const [workplaces, setWorkplaces] = useState([emptyWorkplace(true)]);

  const [direccionPublica, setDireccionPublica] = useState('');
  const [telefonoPublico, setTelefonoPublico] = useState('');
  const [emailPublico, setEmailPublico] = useState('');

  const [bannerUrl, setBannerUrl] = useState('');
  const [photoUrlsText, setPhotoUrlsText] = useState('');
  const [videoUrlsText, setVideoUrlsText] = useState('');

  const [costos, setCostos] = useState('');
  const [preparacion, setPreparacion] = useState('');
  const [contacto, setContacto] = useState('');

  const [blogMarkdown, setBlogMarkdown] = useState('');
  const [liveChatUrl, setLiveChatUrl] = useState('');

  const [tituloAyuda, setTituloAyuda] = useState('');
  const [tituloServicios, setTituloServicios] = useState('');
  const [tituloServiciosDesc, setTituloServiciosDesc] = useState('');
  const [tituloMarcas, setTituloMarcas] = useState('');
  const [tituloMarcasDesc, setTituloMarcasDesc] = useState('');
  const [tituloUbicaciones, setTituloUbicaciones] = useState('');
  const [tituloUbicacionesDesc, setTituloUbicacionesDesc] = useState('');
  const [tituloBlog, setTituloBlog] = useState('');
  const [tituloChat, setTituloChat] = useState('');
  const [tituloInfoPacientes, setTituloInfoPacientes] = useState('');

  const [marcasAudifonos, setMarcasAudifonos] = useState([]);
  const [marcasImplantes, setMarcasImplantes] = useState([]);
  const [marcasAccesorios, setMarcasAccesorios] = useState([]);
  const [marcasFarmacia, setMarcasFarmacia] = useState([]);
  const [agendaDraft, setAgendaDraft] = useState(() => defaultDirectoryAvailability());
  const [inquiryNewCount, setInquiryNewCount] = useState(0);
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesTotal, setInquiriesTotal] = useState(0);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState('ALL');
  const [inquiryNoteDrafts, setInquiryNoteDrafts] = useState({});
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('');
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState('');
  const [googleMapsLugarUrl, setGoogleMapsLugarUrl] = useState('');

  const applyProfile = useCallback((p) => {
    setProfile(p);
    setPersonaTipo(p?.personaTipo === 'JURIDICA' ? 'JURIDICA' : 'NATURAL');
    setDocumentoIdentidad(p?.documentoIdentidad || '');
    setGeneroFicha(p?.generoFicha === 'MASCULINO' || p?.generoFicha === 'FEMENINO' ? p.generoFicha : '');
    setParentProfileId(p?.parentProfileId || '');
    setNombreConsultorio(p?.nombreConsultorio || '');
    setProfesion(p?.profesion || '');
    setPolizas(Array.isArray(p?.polizasAceptadas) ? p.polizasAceptadas.filter(Boolean) : []);
    const wps = Array.isArray(p?.workplaces) && p.workplaces.length ? p.workplaces : [emptyWorkplace(true)];
    setWorkplaces(
      wps.map((w, i) => ({
        nombreCentro: w.nombreCentro || '',
        ciudad: w.ciudad || '',
        direccion: w.direccion || '',
        telefono: w.telefono || '',
        esPrincipal: Boolean(w.esPrincipal) || (i === 0 && !wps.some((x) => x.esPrincipal)),
      }))
    );
    setDireccionPublica(p?.direccionPublica || '');
    setTelefonoPublico(p?.telefonoPublico || '');
    setEmailPublico(p?.emailPublico || '');
    setFotoPerfilUrl(typeof p?.fotoPerfilUrl === 'string' ? p.fotoPerfilUrl : '');
    setGoogleMapsEmbedUrl(typeof p?.googleMapsEmbedUrl === 'string' ? p.googleMapsEmbedUrl : '');
    setGoogleMapsLugarUrl(typeof p?.googleMapsLugarUrl === 'string' ? p.googleMapsLugarUrl : '');
    setBannerUrl(p?.bannerUrl || '');
    setPhotoUrlsText(Array.isArray(p?.photoUrls) ? p.photoUrls.filter(Boolean).join('\n') : '');
    setVideoUrlsText(Array.isArray(p?.videoUrls) ? p.videoUrls.filter(Boolean).join('\n') : '');
    const c = p?.consultation || {};
    setCostos(typeof c.costos === 'string' ? c.costos : '');
    setPreparacion(typeof c.preparacion === 'string' ? c.preparacion : '');
    setContacto(typeof c.contactoCentro === 'string' ? c.contactoCentro : '');
    setBlogMarkdown(typeof p?.blogMarkdown === 'string' ? p.blogMarkdown : '');
    setLiveChatUrl(typeof p?.liveChatUrl === 'string' ? p.liveChatUrl : '');
    const ts = p?.titulosSecciones && typeof p.titulosSecciones === 'object' ? p.titulosSecciones : {};
    setTituloAyuda(typeof ts.ayuda === 'string' ? ts.ayuda : '');
    setTituloServicios(typeof ts.servicios === 'string' ? ts.servicios : '');
    setTituloServiciosDesc(typeof ts.serviciosDesc === 'string' ? ts.serviciosDesc : '');
    setTituloMarcas(typeof ts.marcas === 'string' ? ts.marcas : '');
    setTituloMarcasDesc(typeof ts.marcasDesc === 'string' ? ts.marcasDesc : '');
    setTituloUbicaciones(typeof ts.ubicaciones === 'string' ? ts.ubicaciones : '');
    setTituloUbicacionesDesc(typeof ts.ubicacionesDesc === 'string' ? ts.ubicacionesDesc : '');
    setTituloBlog(typeof ts.blog === 'string' ? ts.blog : '');
    setTituloChat(typeof ts.chat === 'string' ? ts.chat : '');
    setTituloInfoPacientes(typeof ts.infoPacientes === 'string' ? ts.infoPacientes : '');
    const m = loadMarcasFromAllies(p?.allies);
    setMarcasAudifonos(m.audifonos);
    setMarcasImplantes(m.implantes);
    setMarcasAccesorios(m.accesorios);
    setMarcasFarmacia(m.farmacia);
    setAgendaDraft(parseDirectoryAvailability(p?.availability));
  }, []);

  const refreshInquiryNewCount = useCallback(async () => {
    const { data, error } = await directoryApi.get(`${DIRECTORY_API.meInquiries}?status=NEW&limit=1`);
    if (error) return;
    const t = data?.data?.total;
    if (typeof t === 'number') setInquiryNewCount(t);
  }, []);

  const loadInquiries = useCallback(async () => {
    if (!profile) return;
    setInquiriesLoading(true);
    setInquiriesError('');
    const qs = inquiryFilter === 'ALL' ? '?limit=80' : `?status=${inquiryFilter}&limit=80`;
    const { data, error: err } = await directoryApi.get(`${DIRECTORY_API.meInquiries}${qs}`);
    setInquiriesLoading(false);
    if (err) {
      setInquiriesError(err);
      setInquiries([]);
      setInquiriesTotal(0);
      return;
    }
    const payload = data?.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    setInquiries(items);
    setInquiriesTotal(typeof payload?.total === 'number' ? payload.total : items.length);
    setInquiryNoteDrafts((prev) => {
      const next = { ...prev };
      items.forEach((row) => {
        if (next[row.id] === undefined) next[row.id] = row.ownerNote || '';
      });
      return next;
    });
    await refreshInquiryNewCount();
  }, [profile, inquiryFilter, refreshInquiryNewCount]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await directoryApi.get(DIRECTORY_API.me);
    setLoading(false);
    if (err) {
      setProfile(null);
      setError(err);
      return;
    }
    const p = data?.data;
    if (p) {
      applyProfile(p);
      await refreshInquiryNewCount();
    } else {
      setProfile(null);
      setError('El servidor no devolvió datos de perfil. Intenta de nuevo o contacta soporte.');
    }
  }, [applyProfile, refreshInquiryNewCount]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (personaTipo === 'JURIDICA') setGeneroFicha('');
  }, [personaTipo]);

  useEffect(() => {
    if (tab !== 5 || !profile) return;
    loadInquiries();
  }, [tab, profile, loadInquiries]);

  const patchInquiry = async (inquiryId, body) => {
    setInquiriesError('');
    const { error: err } = await directoryApi.patch(DIRECTORY_API.meInquiry(inquiryId), body);
    if (err) {
      setInquiriesError(err);
      return;
    }
    await loadInquiries();
  };

  const setPrincipal = (index) => {
    setWorkplaces((rows) => rows.map((w, i) => ({ ...w, esPrincipal: i === index })));
  };

  const updateWorkplace = (index, field, value) => {
    setWorkplaces((rows) => rows.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  };

  const addWorkplace = () => {
    setWorkplaces((rows) => [...rows, emptyWorkplace(false)]);
  };

  const removeWorkplace = (index) => {
    setWorkplaces((rows) => {
      const next = rows.filter((_, i) => i !== index);
      if (next.length === 0) return [emptyWorkplace(true)];
      if (!next.some((w) => w.esPrincipal)) next[0] = { ...next[0], esPrincipal: true };
      return next;
    });
  };

  const buildPayload = () => {
    const availability = agendaDraft && typeof agendaDraft === 'object' ? agendaDraft : null;

    const titulosSecciones = {};
    if (tituloAyuda.trim()) titulosSecciones.ayuda = tituloAyuda.trim();
    if (tituloServicios.trim()) titulosSecciones.servicios = tituloServicios.trim();
    if (tituloServiciosDesc.trim()) titulosSecciones.serviciosDesc = tituloServiciosDesc.trim();
    if (tituloMarcas.trim()) titulosSecciones.marcas = tituloMarcas.trim();
    if (tituloMarcasDesc.trim()) titulosSecciones.marcasDesc = tituloMarcasDesc.trim();
    if (tituloUbicaciones.trim()) titulosSecciones.ubicaciones = tituloUbicaciones.trim();
    if (tituloUbicacionesDesc.trim()) titulosSecciones.ubicacionesDesc = tituloUbicacionesDesc.trim();
    if (tituloBlog.trim()) titulosSecciones.blog = tituloBlog.trim();
    if (tituloChat.trim()) titulosSecciones.chat = tituloChat.trim();
    if (tituloInfoPacientes.trim()) titulosSecciones.infoPacientes = tituloInfoPacientes.trim();

    const photoUrls = photoUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    const videoUrls = videoUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 1);

    const wpPayload = workplaces
      .filter((w) => w.nombreCentro.trim())
      .map((w, i) => ({
        nombreCentro: w.nombreCentro.trim(),
        direccion: w.direccion.trim() || null,
        ciudad: w.ciudad.trim() || null,
        telefono: w.telefono.trim() || null,
        esPrincipal: !!w.esPrincipal,
        orden: i,
      }));

    const allies = buildAlliesMarcas(marcasAudifonos, marcasImplantes, marcasAccesorios, marcasFarmacia);

    return {
      personaTipo,
      documentoIdentidad: documentoIdentidad.trim() || null,
      nombreConsultorio: nombreConsultorio.trim() || null,
      profesion: profesion || null,
      polizasAceptadas: polizas,
      workplaces: wpPayload,
      direccionPublica: direccionPublica.trim() || null,
      telefonoPublico: telefonoPublico.trim() || null,
      emailPublico: emailPublico.trim() || null,
      bannerUrl: bannerUrl.trim() || null,
      fotoPerfilUrl: fotoPerfilUrl.trim() || null,
      googleMapsEmbedUrl: googleMapsEmbedUrl.trim() || null,
      googleMapsLugarUrl: googleMapsLugarUrl.trim() || null,
      photoUrls,
      videoUrls,
      consultation: {
        costos: costos.trim(),
        preparacion: preparacion.trim(),
        contactoCentro: contacto.trim(),
      },
      blogMarkdown: blogMarkdown.trim() || null,
      liveChatUrl: liveChatUrl.trim() || null,
      titulosSecciones: Object.keys(titulosSecciones).length ? titulosSecciones : null,
      allies,
      availability,
      parentProfileId: personaTipo === 'NATURAL' && parentProfileId.trim() ? parentProfileId.trim() : null,
      generoFicha:
        personaTipo === 'NATURAL' && (generoFicha === 'MASCULINO' || generoFicha === 'FEMENINO')
          ? generoFicha
          : null,
    };
  };

  const save = async () => {
    setSaving(true);
    setOk('');
    setError('');
    let body;
    try {
      body = buildPayload();
    } catch (e) {
      setSaving(false);
      setError(e?.message || 'Revisa los datos.');
      return;
    }

    const { data, error: err } = await directoryApi.patch(DIRECTORY_API.me, body);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    applyProfile(data?.data);
    setOk('Cambios guardados. Si tu ficha estaba aprobada, volverá a estado pendiente de revisión.');
  };

  const logoutDirectory = () => {
    clearDirectoryToken();
    window.location.href = '/login-directorio';
  };

  const publicFichaUrl = profile?.status === 'APPROVED' && profile?.id ? `/directorio/profesional/${profile.id}` : null;

  const visitas = typeof profile?.perfilVisitas === 'number' ? profile.perfilVisitas : null;

  return (
    <>
      <Header />
      <Box sx={{ pt: { xs: 12, md: 14 }, pb: 6, minHeight: '70vh', bgcolor: 'grey.50' }}>
        <Container maxWidth="md">
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#085946' }}>
              Mi ficha pública
            </Typography>
            <Button variant="outlined" color="inherit" size="small" onClick={logoutDirectory}>
              Cerrar sesión
            </Button>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : profile ? (
            <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Edita los datos que verán los pacientes en el directorio. Los cambios se guardan en el mismo servidor que la búsqueda
                pública. Tipo de persona y documento no se muestran en la tarjeta pública.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body1">Estado:</Typography>
                <Chip label={profile.status} color={profile.status === 'APPROVED' ? 'success' : 'default'} />
                {visitas != null ? (
                  <Chip label={`${visitas.toLocaleString('es-CO')} visitas al perfil`} size="small" variant="outlined" />
                ) : null}
                {publicFichaUrl ? (
                  <Button component={RouterLink} to={publicFichaUrl} variant="outlined" size="small" sx={{ textTransform: 'none' }}>
                    Ver ficha pública
                  </Button>
                ) : (
                  <Chip label="La vista pública se activa al aprobar" size="small" variant="outlined" />
                )}
              </Stack>

              {profile.personaTipo === 'JURIDICA' && Array.isArray(profile.profesionalesCentro) && profile.profesionalesCentro.length ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Profesionales vinculados a este centro
                  </Typography>
                  <Stack spacing={0.5}>
                    {profile.profesionalesCentro.map((sub) => (
                      <Typography key={sub.id} variant="body2">
                        {sub.account?.nombre || 'Profesional'}{' '}
                        {sub.status === 'APPROVED' ? (
                          <Button component={RouterLink} size="small" to={`/directorio/profesional/${sub.id}`} sx={{ textTransform: 'none' }}>
                            Ver ficha
                          </Button>
                        ) : (
                          <Chip label={sub.status} size="small" sx={{ ml: 0.5 }} />
                        )}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              ) : null}

              {profile.parentProfile ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Vinculado al centro:{' '}
                  <strong>
                    {profile.parentProfile.nombreConsultorio?.trim() || profile.parentProfile.account?.nombre || 'Centro'}
                  </strong>
                  {profile.parentProfile.id && profile.status === 'APPROVED' ? (
                    <Button
                      component={RouterLink}
                      size="small"
                      to={`/directorio/profesional/${profile.parentProfile.id}`}
                      sx={{ ml: 1, textTransform: 'none' }}
                    >
                      Abrir centro
                    </Button>
                  ) : null}
                </Alert>
              ) : null}

              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Resumen" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Identidad y sedes" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Contacto y medios" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Textos y monetización" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Agenda y marcas" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab
                  label={
                    <Badge color="error" badgeContent={inquiryNewCount} max={99} invisible={!inquiryNewCount}>
                      <Box component="span" sx={{ pr: inquiryNewCount ? 1.5 : 0, fontWeight: 700 }}>
                        Buzón
                      </Box>
                    </Badge>
                  }
                  sx={{ textTransform: 'none' }}
                />
              </Tabs>

              {tab === 0 && (
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    Resumen de tu ficha. Las visitas se cuentan al abrir la ficha pública aprobada. Las tres métricas inferiores se
                    calculan automáticamente (mensajes del formulario, clics en WhatsApp y citas creadas desde el flujo de agenda con
                    enlace desde tu perfil).
                  </Typography>
                  <Typography variant="body1">
                    <strong>Cuenta:</strong> {profile.account?.nombre} ({profile.account?.email})
                  </Typography>
                  {visitas != null ? (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Visitas acumuladas al perfil:</strong> {visitas.toLocaleString('es-CO')}
                    </Typography>
                  ) : null}
                  <Grid container spacing={2}>
                    {[
                      {
                        label: 'Mensajes recibidos',
                        value: profile.directoryStats?.mensajesRecibidos ?? 0,
                        caption: 'Envíos del formulario de contacto en tu ficha pública.',
                      },
                      {
                        label: 'Clics en WhatsApp',
                        value: profile.directoryStats?.whatsappClicks ?? 0,
                        caption: 'Clics en botones de WhatsApp en la ficha (incluye sedes).',
                      },
                      {
                        label: 'Citas agendadas',
                        value: profile.directoryStats?.citasAgendadas ?? 0,
                        caption: 'Citas confirmadas creadas desde «Agendar» enlazado a tu ficha (no canceladas).',
                      },
                    ].map((s) => (
                      <Grid item xs={12} sm={4} key={s.label}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            height: '100%',
                            borderRadius: 2,
                            borderColor: 'rgba(8, 89, 70, 0.14)',
                            bgcolor: 'rgba(8, 89, 70, 0.02)',
                          }}
                        >
                          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: 'text.secondary' }}>
                            {s.label}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.dark', my: 1, lineHeight: 1.1 }}>
                            {Number(s.value).toLocaleString('es-CO')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: 'block' }}>
                            {s.caption}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}

              {tab === 1 && (
                <Stack spacing={2}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Tipo de titular (no se publica en la tarjeta)
                    </FormLabel>
                    <RadioGroup
                      row
                      value={personaTipo}
                      onChange={(e) => setPersonaTipo(e.target.value)}
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      <FormControlLabel value="NATURAL" control={<Radio color="primary" />} label="Persona natural" />
                      <FormControlLabel value="JURIDICA" control={<Radio color="primary" />} label="Persona jurídica (centro)" />
                    </RadioGroup>
                  </FormControl>
                  <TextField
                    label={personaTipo === 'JURIDICA' ? 'NIT' : 'Cédula'}
                    fullWidth
                    value={documentoIdentidad}
                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                    helperText="No aparece en el directorio público."
                  />
                  <TextField
                    label={personaTipo === 'JURIDICA' ? 'Nombre de la clínica o centro' : 'Nombre del consultorio o marca (opcional)'}
                    fullWidth
                    value={nombreConsultorio}
                    onChange={(e) => setNombreConsultorio(e.target.value)}
                  />
                  {personaTipo === 'NATURAL' ? (
                    <TextField
                      label="ID del centro (UUID) si trabajas dentro de una clínica ya aprobada"
                      fullWidth
                      value={parentProfileId}
                      onChange={(e) => setParentProfileId(e.target.value)}
                      helperText="Opcional. Debe ser la ficha pública aprobada del centro (persona jurídica). Si no tienes el ID, pide al administrador del centro que te lo comparta."
                    />
                  ) : null}
                  {personaTipo === 'NATURAL' ? (
                    <FormControl component="fieldset" variant="standard">
                      <FormLabel component="legend" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Redacción en primera persona (sección de empresas de salud en la ficha pública)
                      </FormLabel>
                      <RadioGroup
                        row
                        value={generoFicha}
                        onChange={(e) => setGeneroFicha(e.target.value)}
                        sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
                      >
                        <FormControlLabel value="" control={<Radio color="primary" size="small" />} label="Neutro" />
                        <FormControlLabel
                          value="MASCULINO"
                          control={<Radio color="primary" size="small" />}
                          label="Hombre (vinculado)"
                        />
                        <FormControlLabel
                          value="FEMENINO"
                          control={<Radio color="primary" size="small" />}
                          label="Mujer (vinculada)"
                        />
                      </RadioGroup>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        No publicamos tu género como dato; solo ajusta la frase «…estoy vinculado/vinculada».
                      </Typography>
                    </FormControl>
                  ) : null}
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="dir-prof-label">Profesión (catálogo directorio)</InputLabel>
                    <Select
                      labelId="dir-prof-label"
                      label="Profesión (catálogo directorio)"
                      value={profesion}
                      onChange={(e) => setProfesion(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Sin especificar</em>
                      </MenuItem>
                      {PROFESIONES_CATALOGO.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    multiple
                    options={POLIZAS_COLOMBIA}
                    value={polizas}
                    onChange={(_, v) => setPolizas(v)}
                    renderInput={(params) => (
                      <TextField {...params} margin="normal" label="Pólizas / aseguradoras" placeholder="Elige una o varias" />
                    )}
                  />
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6">Direcciones de consultorio / sedes</Typography>
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={addWorkplace} size="small" sx={{ textTransform: 'none' }}>
                      Añadir sede
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Cada sede debe tener al menos el nombre del centro. Marca una como principal.
                  </Typography>
                  {workplaces.map((w, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Chip
                          size="small"
                          label={w.esPrincipal ? 'Principal' : 'Sede'}
                          color={w.esPrincipal ? 'primary' : 'default'}
                          onClick={() => setPrincipal(index)}
                          sx={{ cursor: 'pointer', mb: 1 }}
                        />
                        <IconButton
                          aria-label="Eliminar sede"
                          onClick={() => removeWorkplace(index)}
                          size="small"
                          disabled={workplaces.length === 1}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                      <TextField
                        label="Nombre del centro"
                        fullWidth
                        required
                        size="small"
                        margin="dense"
                        value={w.nombreCentro}
                        onChange={(e) => updateWorkplace(index, 'nombreCentro', e.target.value)}
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                        <TextField
                          label="Ciudad"
                          fullWidth
                          size="small"
                          value={w.ciudad}
                          onChange={(e) => updateWorkplace(index, 'ciudad', e.target.value)}
                        />
                        <TextField
                          label="Teléfono"
                          fullWidth
                          size="small"
                          value={w.telefono}
                          onChange={(e) => updateWorkplace(index, 'telefono', e.target.value)}
                        />
                      </Stack>
                      <TextField
                        label="Dirección u orientación"
                        fullWidth
                        size="small"
                        margin="dense"
                        value={w.direccion}
                        onChange={(e) => updateWorkplace(index, 'direccion', e.target.value)}
                      />
                    </Paper>
                  ))}
                </Stack>
              )}

              {tab === 2 && (
                <Stack spacing={2}>
                  <TextField
                    label="Dirección pública (texto para la ficha)"
                    fullWidth
                    value={direccionPublica}
                    onChange={(e) => setDireccionPublica(e.target.value)}
                    helperText="Se muestra en el hero junto al mapa, si lo configuras."
                  />
                  <TextField
                    label="URL de incrustación de Google Maps (iframe)"
                    fullWidth
                    multiline
                    minRows={2}
                    value={googleMapsEmbedUrl}
                    onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
                    helperText="En Google Maps use Compartir → Insertar un mapa y pegue la URL completa del iframe (https://www.google.com/maps/embed...)."
                  />
                  <TextField
                    label="Enlace «Abrir en Google Maps» (opcional)"
                    fullWidth
                    value={googleMapsLugarUrl}
                    onChange={(e) => setGoogleMapsLugarUrl(e.target.value)}
                    helperText="URL del lugar (maps.app.goo.gl o google.com/maps/place/…). No sustituye la API de incrustación."
                  />
                  <TextField
                    label="Teléfono público"
                    fullWidth
                    value={telefonoPublico}
                    onChange={(e) => setTelefonoPublico(e.target.value)}
                  />
                  <TextField
                    label="Correo público"
                    fullWidth
                    type="email"
                    value={emailPublico}
                    onChange={(e) => setEmailPublico(e.target.value)}
                    helperText="Si lo dejas vacío, puede usarse el correo de la cuenta solo para contacto interno."
                  />
                  <Divider />
                  <TextField
                    label="URL de la foto de perfil"
                    fullWidth
                    value={fotoPerfilUrl}
                    onChange={(e) => setFotoPerfilUrl(e.target.value)}
                    helperText="Imagen cuadrada recomendada (https…). Es la que verán en listados y en el avatar principal de la ficha."
                  />
                  <TextField
                    label="URL del banner (imagen ancha)"
                    fullWidth
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    helperText="Fondo del hero en la ficha pública (https…)."
                  />
                  <TextField
                    label="URLs de fotos de galería (máx. 2, una por línea)"
                    fullWidth
                    multiline
                    minRows={2}
                    value={photoUrlsText}
                    onChange={(e) => setPhotoUrlsText(e.target.value)}
                    helperText="Adicionales a la foto de perfil; en la ficha se muestran aparte si las hay."
                  />
                  <TextField
                    label="URLs de videos (máx. 1, una por línea)"
                    fullWidth
                    multiline
                    minRows={2}
                    value={videoUrlsText}
                    onChange={(e) => setVideoUrlsText(e.target.value)}
                    helperText="Máximo 1 video; con las fotos de galería el servidor limita el total de ítems multimedia."
                  />
                </Stack>
              )}

              {tab === 3 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Texto para pacientes
                  </Typography>
                  <TextField label="Costos y pagos" fullWidth multiline minRows={2} value={costos} onChange={(e) => setCostos(e.target.value)} />
                  <TextField
                    label="Preparación para exámenes"
                    fullWidth
                    multiline
                    minRows={2}
                    value={preparacion}
                    onChange={(e) => setPreparacion(e.target.value)}
                  />
                  <TextField
                    label="Cómo contactar"
                    fullWidth
                    multiline
                    minRows={2}
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                  />
                  <Divider />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Blog (producto de pago — borrador en tu panel)
                  </Typography>
                  <TextField
                    label="Contenido del blog (texto o Markdown simple)"
                    fullWidth
                    multiline
                    minRows={6}
                    value={blogMarkdown}
                    onChange={(e) => setBlogMarkdown(e.target.value)}
                  />
                  <TextField
                    label="URL de chat en vivo (iframe o enlace)"
                    fullWidth
                    value={liveChatUrl}
                    onChange={(e) => setLiveChatUrl(e.target.value)}
                    helperText="Si es https y permite iframe, se incrusta en la ficha; si no, mostramos un botón."
                  />
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Títulos personalizados en la ficha (opcional)
                  </Typography>
                  <TextField label="Bloque principal de ayuda" fullWidth size="small" value={tituloAyuda} onChange={(e) => setTituloAyuda(e.target.value)} />
                  <TextField label="Sección servicios (título)" fullWidth size="small" value={tituloServicios} onChange={(e) => setTituloServicios(e.target.value)} />
                  <TextField
                    label="Sección servicios (subtítulo)"
                    fullWidth
                    size="small"
                    value={tituloServiciosDesc}
                    onChange={(e) => setTituloServiciosDesc(e.target.value)}
                  />
                  <TextField label="Marcas (título)" fullWidth size="small" value={tituloMarcas} onChange={(e) => setTituloMarcas(e.target.value)} />
                  <TextField label="Marcas (subtítulo)" fullWidth size="small" value={tituloMarcasDesc} onChange={(e) => setTituloMarcasDesc(e.target.value)} />
                  <TextField
                    label="Ubicaciones (título)"
                    fullWidth
                    size="small"
                    value={tituloUbicaciones}
                    onChange={(e) => setTituloUbicaciones(e.target.value)}
                  />
                  <TextField
                    label="Ubicaciones (subtítulo)"
                    fullWidth
                    size="small"
                    value={tituloUbicacionesDesc}
                    onChange={(e) => setTituloUbicacionesDesc(e.target.value)}
                  />
                  <TextField label="Blog (título corto)" fullWidth size="small" value={tituloBlog} onChange={(e) => setTituloBlog(e.target.value)} />
                  <TextField label="Chat (título)" fullWidth size="small" value={tituloChat} onChange={(e) => setTituloChat(e.target.value)} />
                  <TextField
                    label="Bloque información para pacientes"
                    fullWidth
                    size="small"
                    value={tituloInfoPacientes}
                    onChange={(e) => setTituloInfoPacientes(e.target.value)}
                  />
                </Stack>
              )}

              {tab === 4 && (
                <Stack spacing={3}>
                  <DirectoryAgendaEditor value={agendaDraft} onChange={setAgendaDraft} />
                  <Divider />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Marcas con las que trabajas (por categoría)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Elige del catálogo o escribe otra marca y pulsa Enter en cada campo.
                  </Typography>
                  <Stack spacing={2}>
                    <Autocomplete
                      multiple
                      freeSolo
                      options={MARCAS_AUDIFONOS}
                      value={marcasAudifonos}
                      onChange={(_, v) => setMarcasAudifonos(v.map((x) => String(x).trim()).filter(Boolean))}
                      renderInput={(params) => (
                        <TextField {...params} label="Audífonos" placeholder="Ej. Phonak, Oticon…" />
                      )}
                    />
                    <Autocomplete
                      multiple
                      freeSolo
                      options={MARCAS_IMPLANTES_COCLEARES}
                      value={marcasImplantes}
                      onChange={(_, v) => setMarcasImplantes(v.map((x) => String(x).trim()).filter(Boolean))}
                      renderInput={(params) => (
                        <TextField {...params} label="Implantes cocleares" placeholder="Ej. Cochlear, MED-EL…" />
                      )}
                    />
                    <Autocomplete
                      multiple
                      freeSolo
                      options={MARCAS_ACCESORIOS}
                      value={marcasAccesorios}
                      onChange={(_, v) => setMarcasAccesorios(v.map((x) => String(x).trim()).filter(Boolean))}
                      renderInput={(params) => (
                        <TextField {...params} label="Accesorios" placeholder="Ej. Roger, pilas…" />
                      )}
                    />
                    <Autocomplete
                      multiple
                      freeSolo
                      options={MARCAS_FARMACIA}
                      value={marcasFarmacia}
                      onChange={(_, v) => setMarcasFarmacia(v.map((x) => String(x).trim()).filter(Boolean))}
                      renderInput={(params) => (
                        <TextField {...params} label="Farmacia" placeholder="Ej. Audispray, Otofer…" />
                      )}
                    />
                  </Stack>
                </Stack>
              )}

              {tab === 5 && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Mensajes enviados desde el formulario de tu ficha pública. Responde por correo, teléfono o WhatsApp; aquí puedes
                    llevar el seguimiento (leído, respondido, nota interna).
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                    {[
                      { id: 'ALL', label: 'Todos' },
                      { id: 'NEW', label: 'Nuevos' },
                      { id: 'READ', label: 'Leídos' },
                      { id: 'ARCHIVED', label: 'Archivados' },
                    ].map((f) => (
                      <Button
                        key={f.id}
                        size="small"
                        variant={inquiryFilter === f.id ? 'contained' : 'outlined'}
                        onClick={() => setInquiryFilter(f.id)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {f.label}
                      </Button>
                    ))}
                    <Button size="small" variant="text" onClick={() => loadInquiries()} disabled={inquiriesLoading} sx={{ fontWeight: 700 }}>
                      Actualizar
                    </Button>
                  </Stack>
                  {inquiriesError ? (
                    <Alert severity="error">{inquiriesError}</Alert>
                  ) : null}
                  {inquiriesLoading ? (
                    <Stack alignItems="center" py={3}>
                      <CircularProgress size={32} />
                    </Stack>
                  ) : inquiries.length === 0 ? (
                    <Alert severity="info">No hay mensajes en este filtro.</Alert>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Mostrando {inquiries.length} de {inquiriesTotal}
                    </Typography>
                  )}
                  <Stack spacing={2}>
                    {inquiries.map((row) => {
                      const wa = waMeHrefFromPhone(row.telefono);
                      const mailto = `mailto:${row.email}?subject=${encodeURIComponent('Re: tu consulta en OírConecta')}`;
                      const statusLabel =
                        row.status === 'NEW' ? 'Nuevo' : row.status === 'READ' ? 'Leído' : 'Archivado';
                      const statusColor = row.status === 'NEW' ? 'warning' : row.status === 'READ' ? 'primary' : 'default';
                      return (
                        <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {row.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.createdAt
                                  ? new Date(row.createdAt).toLocaleString('es-CO', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })
                                  : ''}
                              </Typography>
                            </Stack>
                            <Chip size="small" label={statusLabel} color={statusColor} sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
                          </Stack>
                          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }} useFlexGap>
                            <Button size="small" variant="outlined" startIcon={<EmailIcon />} href={mailto} sx={{ textTransform: 'none' }}>
                              {row.email}
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<PhoneIcon />} href={`tel:${String(row.telefono).replace(/\s/g, '')}`} sx={{ textTransform: 'none' }}>
                              {row.telefono}
                            </Button>
                            {wa ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<WhatsAppIcon />}
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textTransform: 'none' }}
                              >
                                WhatsApp
                              </Button>
                            ) : null}
                          </Stack>
                          {row.mensaje ? (
                            <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                              {row.mensaje}
                            </Typography>
                          ) : null}
                          <TextField
                            label="Nota interna (solo tú)"
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            sx={{ mt: 2 }}
                            value={inquiryNoteDrafts[row.id] ?? ''}
                            onChange={(e) => setInquiryNoteDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))}
                          />
                          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }} useFlexGap>
                            <Button size="small" variant="contained" sx={{ textTransform: 'none' }} onClick={() => patchInquiry(row.id, { ownerNote: inquiryNoteDrafts[row.id] ?? '' })}>
                              Guardar nota
                            </Button>
                            {row.status === 'NEW' ? (
                              <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => patchInquiry(row.id, { markRead: true })}>
                                Marcar leído
                              </Button>
                            ) : null}
                            <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => patchInquiry(row.id, { markResponded: true })}>
                              Marcar respondido
                            </Button>
                            {row.status !== 'ARCHIVED' ? (
                              <Button size="small" color="inherit" sx={{ textTransform: 'none' }} onClick={() => patchInquiry(row.id, { status: 'ARCHIVED' })}>
                                Archivar
                              </Button>
                            ) : (
                              <Button size="small" sx={{ textTransform: 'none' }} onClick={() => patchInquiry(row.id, { status: 'READ' })}>
                                Desarchivar
                              </Button>
                            )}
                          </Stack>
                          {row.respondedAt ? (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              Respondido:{' '}
                              {new Date(row.respondedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                            </Typography>
                          ) : null}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              )}

              <Divider sx={{ my: 3 }} />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {ok && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {ok}
                </Alert>
              )}
              {tab !== 5 ? (
                <Button variant="contained" sx={{ bgcolor: '#085946', fontWeight: 700 }} onClick={save} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Los mensajes del buzón se guardan al usar los botones de cada tarjeta; no uses «Guardar cambios».
                </Typography>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
              {error ? (
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={load} sx={{ fontWeight: 700, textTransform: 'none' }}>
                      Reintentar
                    </Button>
                  }
                >
                  {error}
                </Alert>
              ) : (
                <Alert severity="warning">No se encontró perfil de directorio.</Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Si acabas de actualizar el servidor o la base de datos, vuelve a entrar tras desplegar el backend. Si el problema
                continúa, cierra sesión y entra de nuevo; el sistema intentará recuperar tu ficha automáticamente.
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
}
