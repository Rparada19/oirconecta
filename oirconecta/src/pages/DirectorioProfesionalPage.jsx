import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Rating,
  TextField,
  Grid,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  ChevronLeft,
  CalendarMonth,
  Phone,
  Verified,
  AutoAwesome,
  WhatsApp,
  Email,
  MedicalServices,
  CoPresent,
  Psychology,
  FavoriteBorder,
  FormatQuote,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  fetchDirectoryProfilePublic,
  submitDirectoryProfileInquiry,
  trackDirectoryWhatsAppClick,
} from '../services/directorySearchService';
import { getWhatsAppHrefWithText } from '../config/publicSite';
import { DEMO_PROFILE_MAP } from '../data/directoryDemoData';
import {
  directoryInitials,
  directoryPrimaryCity,
  directoryPrimaryPhonePublic,
  directoryPublicDisplayName,
  directoryPublicEmail,
  directoryProfileBio,
  directoryProfilePhoto,
  directoryAvailabilitySummary,
  directoryServiceChips,
  directoryAlliesGrouped,
  waMeHrefFromPhone,
} from '../utils/directoryPresentation';

/** Full-bleed: solo ancho + color; el contenido va en `dirContentSx`. */
const DIR_SECTION_PY = { xs: 6.5, sm: 7.5, md: 8.5 };

const dirContentSx = {
  width: '100%',
  maxWidth: 1220,
  mx: 'auto',
  px: { xs: 2, sm: 2.5, md: 3 },
};

/** Escala editorial ficha pública (px ≈ rem×16). */
const dirType = {
  h1: {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: 'clamp(2rem, 2.2vw, 2.5rem)' },
  },
  h2: {
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'text.primary',
    lineHeight: 1.25,
    fontSize: { xs: '1.125rem', sm: '1.25rem', md: 'clamp(1.375rem, 1.6vw, 1.625rem)' },
    mb: 1,
  },
  h3: {
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'text.primary',
    lineHeight: 1.3,
    fontSize: { xs: '1.05rem', md: '1.15rem' },
    mb: 1,
  },
  body: {
    fontSize: { xs: '0.9375rem', md: '1rem' },
    lineHeight: 1.6,
    color: 'text.secondary',
  },
  small: {
    fontSize: { xs: '0.8125rem', md: '0.875rem' },
    lineHeight: 1.55,
    color: 'text.secondary',
  },
  overline: {
    fontWeight: 800,
    letterSpacing: '0.16em',
    color: 'primary.main',
    fontSize: '0.72rem',
    lineHeight: 1.5,
    mb: 0.75,
    display: 'block',
  },
};

const dirH2Sx = { ...dirType.h2 };

const dirCtaPrimarySx = {
  textTransform: 'none',
  fontWeight: 800,
  borderRadius: 2.5,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': { transform: 'translateY(-1px)' },
};

const HELP_PILLAR_ICONS = [MedicalServices, Psychology, CoPresent, FavoriteBorder];
const HELP_PILLAR_COPY = [
  { title: 'Escucha activa', text: 'Tiempo real para entender tu historia y lo que te preocupa del oído o del equilibrio.' },
  { title: 'Explicación clara', text: 'Te cuento en lenguaje sencillo qué puede estar pasando y qué opciones existen.' },
  { title: 'Plan a tu medida', text: 'Priorizamos lo que necesitas ahora: valoración, seguimiento o adaptación de audífonos.' },
  { title: 'Acompañamiento', text: 'Seguimiento humano; no te quedas solo con dudas después de la consulta.' },
];

const dirBleed = (sx = {}) => ({
  width: '100%',
  py: DIR_SECTION_PY,
  ...sx,
});

const dirCardSx = {
  borderRadius: 2,
  p: { xs: 2, md: 2.5 },
  border: '1px solid rgba(8, 89, 70, 0.08)',
  boxShadow: '0 1px 2px rgba(16, 40, 32, 0.04), 0 12px 32px rgba(16, 40, 32, 0.06)',
  bgcolor: 'background.paper',
};

const dirCardMediaSx = {
  ...dirCardSx,
  p: 0,
  overflow: 'hidden',
};

const dirFormCardSx = {
  ...dirCardSx,
  p: { xs: 2, md: 2.75 },
  maxWidth: 560,
  mx: 'auto',
  borderRadius: 3,
  boxShadow: '0 2px 8px rgba(16, 40, 32, 0.06), 0 24px 48px rgba(16, 40, 32, 0.08)',
};

const dirFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(8, 89, 70, 0.35)',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1.5px',
  },
  '& .MuiOutlinedInput-root.Mui-focused': {
    boxShadow: '0 0 0 3px rgba(8, 89, 70, 0.1)',
  },
};

const dirBodyMaxSx = { maxWidth: '62ch', lineHeight: 1.65 };

const DIR_BG = {
  page: '#eef2f0',
  a: '#ffffff',
  b: '#f6faf8',
  c: '#edf5f1',
  contact: '#e8f2ec',
};

const DIR_PROFILE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isDirectoryProfileUuid(id) {
  return typeof id === 'string' && DIR_PROFILE_UUID_RE.test(id);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Título de sección opcional configurado por el titular (`titulosSecciones`). */
function directorySectionTitle(titulosSecciones, key, fallback) {
  const t = titulosSecciones;
  if (t && typeof t === 'object' && typeof t[key] === 'string' && t[key].trim()) return t[key].trim();
  return fallback;
}

/** Título por defecto de la sección de pólizas (género en primera persona o centro). */
function defaultTituloEmpresasSalud(profile) {
  if (!profile) return 'Empresas de salud con las que tengo vínculo';
  if (profile.esCentro) return 'Empresas de salud vinculadas';
  if (profile.generoFicha === 'FEMENINO') return 'Empresas de salud con las que estoy vinculada';
  if (profile.generoFicha === 'MASCULINO') return 'Empresas de salud con las que estoy vinculado';
  return 'Empresas de salud con las que tengo vínculo';
}

/** Mensaje corto y humano para el hero (máx. 2 líneas). */
function heroEmpathyLine(profile, cityLabel) {
  if (profile?._demo?.tagline) {
    const t = String(profile._demo.tagline).trim();
    if (t.length <= 140) return t;
    return `${t.slice(0, 137)}…`;
  }
  const prof = profile?.profesion || 'tu audición';
  if (cityLabel) {
    return `Te acompaño a entender qué pasa con tu audición, con calma y en un lenguaje claro. Atiendo en ${cityLabel}.`;
  }
  return `Te acompaño a entender lo que está pasando con tu audición, paso a paso y sin prisa.`;
}

/** Texto para “¿En qué puedo ayudarte?” (3–5 líneas). */
function humanHelpBlock(profile, bio) {
  if (bio && bio.length > 40) {
    const max = 420;
    return bio.length <= max ? bio : `${bio.slice(0, max - 1)}…`;
  }
  const n = profile?.account?.nombre?.split(' ')?.[0] || 'Hola';
  return `${n}, gracias por visitar mi perfil. Cuéntame qué te preocupa: desde una primera valoración hasta el seguimiento de audífonos, mi prioridad es que te vayas con claridad y un plan que tenga sentido para ti. Si no sabes por dónde empezar, podemos ordenar las ideas juntos en la consulta.`;
}

export default function DirectorioProfesionalPage() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const contactRef = useRef(null);

  const [leadNombre, setLeadNombre] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadTelefono, setLeadTelefono] = useState('');
  const [leadMensaje, setLeadMensaje] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchDirectoryProfilePublic(profileId);
    const fromApi = data?.data;
    const fallback = DEMO_PROFILE_MAP[profileId] || null;
    setLoading(false);
    if (fromApi) {
      setProfile(fromApi);
      setError('');
      return;
    }
    if (fallback) {
      setProfile(fallback);
      setError('');
      return;
    }
    setProfile(null);
    setError(err || 'No se pudo cargar la ficha.');
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLeadNombre('');
    setLeadEmail('');
    setLeadTelefono('');
    setLeadMensaje('');
    setLeadError('');
    setLeadSuccess(false);
  }, [profileId]);

  const name = profile ? directoryPublicDisplayName(profile) : '';
  const photo = profile ? directoryProfilePhoto(profile) : null;
  const bannerUrl = profile?.bannerUrl?.trim();
  const mapsEmbed = profile?.googleMapsEmbedUrl?.trim();
  const mapsLugar = profile?.googleMapsLugarUrl?.trim();
  const city = directoryPrimaryCity(profile?.workplaces);
  const phone = directoryPrimaryPhonePublic(profile);
  const emailPublico = profile ? directoryPublicEmail(profile) : null;
  const direccionPublica = profile?.direccionPublica?.trim();
  const wa = waMeHrefFromPhone(phone);
  const bio = profile ? directoryProfileBio(profile) : '';
  const chips = profile ? directoryServiceChips(profile, 10) : [];
  const alliesGrouped = useMemo(() => (profile ? directoryAlliesGrouped(profile.allies) : []), [profile]);
  const polizas = Array.isArray(profile?.polizasAceptadas) ? profile.polizasAceptadas.filter(Boolean) : [];

  const empathyHero = useMemo(() => heroEmpathyLine(profile, city), [profile, city]);
  const helpBody = useMemo(() => humanHelpBlock(profile, bio), [profile, bio]);

  const sectionTitles = useMemo(() => {
    if (!profile) return {};
    const ts = profile.titulosSecciones;
    const pick = (k, fb) => directorySectionTitle(ts, k, fb);
    return {
      ayuda: pick('ayuda', '¿En qué puedo ayudarte?'),
      contacto: pick('contacto', 'Cuéntame qué necesitas'),
      servicios: pick('servicios', 'Servicios'),
      serviciosDesc: pick('serviciosDesc', 'Servicios que realizo con mayor frecuencia'),
      marcas: pick('marcas', 'Aliados'),
      marcasDesc: pick('marcasDesc', 'Marcas y soluciones con las que trabajo para cuidarte mejor'),
      ubicaciones: pick('ubicaciones', 'Ubicaciones'),
      ubicacionesDesc: pick('ubicacionesDesc', 'Dónde puedes encontrarme'),
      empresasSalud: pick('empresasSalud', defaultTituloEmpresasSalud(profile)),
      blog: pick('blog', 'Blog'),
      chat: pick('chat', 'Chat en vivo'),
      infoPacientes: pick('infoPacientes', 'Información para pacientes'),
    };
  }, [profile]);

  const consultationBlocks = useMemo(() => {
    const c = profile?.consultation;
    if (!c || typeof c !== 'object') return { costos: '', preparacion: '', contactoCentro: '' };
    return {
      costos: typeof c.costos === 'string' ? c.costos.trim() : '',
      preparacion: typeof c.preparacion === 'string' ? c.preparacion.trim() : '',
      contactoCentro: typeof c.contactoCentro === 'string' ? c.contactoCentro.trim() : '',
    };
  }, [profile]);

  const galleryPhotos = useMemo(() => {
    const raw = profile?.photoUrls;
    if (!Array.isArray(raw)) return [];
    const main = directoryProfilePhoto(profile);
    return raw
      .map((u) => String(u).trim())
      .filter(Boolean)
      .filter((u) => !main || u !== main)
      .slice(0, 2);
  }, [profile]);

  const galleryVideos = useMemo(() => {
    const raw = profile?.videoUrls;
    if (!Array.isArray(raw)) return [];
    return raw.map((u) => String(u).trim()).filter(Boolean).slice(0, 1);
  }, [profile]);

  const introVideoSrc = galleryVideos[0] || null;
  const introPhotoUrls = galleryPhotos;
  const showIntroMedia = Boolean(introVideoSrc || introPhotoUrls.length > 0);
  const firstName = useMemo(() => {
    const n = (name || '').trim();
    if (!n) return 'este profesional';
    return n.split(/\s+/)[0];
  }, [name]);

  const liveChatSrc = useMemo(() => {
    const u = profile?.liveChatUrl && String(profile.liveChatUrl).trim();
    if (!u) return null;
    if (!/^https?:\/\//i.test(u)) return null;
    return u;
  }, [profile]);

  const availabilityNote = useMemo(() => {
    if (!profile) return '';
    const structured = directoryAvailabilitySummary(profile);
    if (structured) return structured;
    const a = profile?.availability;
    if (!a || typeof a !== 'object') return '';
    const days = Array.isArray(a.dias) ? a.dias.join(', ') : typeof a.dias === 'string' ? a.dias.trim() : '';
    const hi = typeof a.horaInicio === 'string' ? a.horaInicio.trim() : typeof a.apertura === 'string' ? a.apertura.trim() : '';
    const hf = typeof a.horaFin === 'string' ? a.horaFin.trim() : typeof a.cierre === 'string' ? a.cierre.trim() : '';
    const parts = [];
    if (days) parts.push(`Días: ${days}`);
    if (hi && hf) parts.push(`Horario: ${hi} – ${hf}`);
    return parts.join(' · ');
  }, [profile]);

  const mapsEmbedSafe = useMemo(() => {
    if (!mapsEmbed) return null;
    const u = mapsEmbed.trim();
    if (!/^https:\/\/(www\.)?google\.com\/maps\/embed/i.test(u) && !/^https:\/\/maps\.google\.com\//i.test(u)) return null;
    return u;
  }, [mapsEmbed]);

  const waConversionHref = useMemo(() => {
    if (wa) return wa;
    const n = (name || 'este profesional').trim();
    return getWhatsAppHrefWithText(
      `Hola, vi el perfil de ${n} en el directorio de OírConecta y quiero información.`
    );
  }, [wa, name]);

  const agendarDesdeDirectorio = useMemo(
    () =>
      `/agendar${profileId && isDirectoryProfileUuid(profileId) ? `?desdeDirectorio=${encodeURIComponent(profileId)}` : ''}`,
    [profileId]
  );

  const onWhatsappTrack = useCallback(() => {
    trackDirectoryWhatsAppClick(profileId).catch(() => {});
  }, [profileId]);

  const telHref = useMemo(() => {
    if (!phone) return null;
    return `tel:${String(phone).replace(/\s/g, '')}`;
  }, [phone]);

  const mailtoProfessionalHref = useMemo(() => {
    const raw = emailPublico || profile?.account?.email;
    const em = raw && String(raw).trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return null;
    if (em.endsWith('@oirconecta.local')) return null;
    const sub = encodeURIComponent(`Consulta desde el directorio OírConecta — ${name || 'profesional'}`);
    return `mailto:${em}?subject=${sub}`;
  }, [profile, name, emailPublico]);

  const scrollToContact = useCallback(() => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleLeadSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLeadError('');
      setLeadSubmitting(true);
      try {
        const payload = {
          nombre: leadNombre.trim(),
          email: leadEmail.trim(),
          telefono: leadTelefono.trim(),
          mensaje: leadMensaje.trim() || undefined,
        };
        if (!payload.nombre || !payload.email || !payload.telefono) {
          setLeadError('Completa nombre, correo y teléfono para enviar.');
          return;
        }
        if (!isDirectoryProfileUuid(profileId)) {
          await sleep(450);
          setLeadSuccess(true);
          setLeadNombre('');
          setLeadEmail('');
          setLeadTelefono('');
          setLeadMensaje('');
          return;
        }
        const { data, error: apiErr } = await submitDirectoryProfileInquiry(profileId, payload);
        if (apiErr) {
          setLeadError(typeof apiErr === 'string' ? apiErr : 'No se pudo enviar. Inténtalo de nuevo.');
          return;
        }
        if (data?.success === false) {
          setLeadError(data?.error || 'No se pudo enviar.');
          return;
        }
        setLeadSuccess(true);
        setLeadNombre('');
        setLeadEmail('');
        setLeadTelefono('');
        setLeadMensaje('');
      } catch (err) {
        setLeadError(err?.message || 'Error al enviar.');
      } finally {
        setLeadSubmitting(false);
      }
    },
    [profileId, leadNombre, leadEmail, leadTelefono, leadMensaje]
  );

  const resetLeadForm = useCallback(() => {
    setLeadSuccess(false);
    setLeadError('');
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: DIR_BG.page }}>
      <Header />
      <Box sx={{ height: 72 }} />

      <Box sx={{ width: '100%', bgcolor: DIR_BG.page, pt: { xs: 2, md: 2.5 }, pb: 0 }}>
        <Box sx={dirContentSx}>
          <Button
            component={RouterLink}
            to="/directorio"
            startIcon={<ChevronLeft />}
            sx={{ mb: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Volver al directorio
          </Button>
        </Box>
      </Box>

      {loading && (
        <Stack alignItems="center" py={10}>
          <CircularProgress />
        </Stack>
      )}

      {!loading && error && (
        <Box sx={{ width: '100%', pt: 0, pb: 1 }}>
          <Box sx={dirContentSx}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        </Box>
      )}

      {!loading && !error && profile && (
        <>
          <Box sx={{ width: '100%', px: { xs: 0, md: 1.5 }, pb: 0 }}>
            <Box
              component="article"
              aria-label="Ficha del profesional"
              sx={{
                width: '100%',
                maxWidth: { md: dirContentSx.maxWidth },
                mx: 'auto',
                overflow: 'hidden',
                borderRadius: { xs: 0, md: 3 },
                /* Sin borde inferior: evita la línea que se veía entre el cierre de la tarjeta y la barra fija */
                border: { xs: 'none', md: 'none' },
                borderTop: { md: '1px solid rgba(8, 89, 70, 0.2)' },
                borderLeft: { md: '1px solid rgba(8, 89, 70, 0.2)' },
                borderRight: { md: '1px solid rgba(8, 89, 70, 0.2)' },
                boxShadow: { md: 'none' },
                bgcolor: { md: 'background.paper' },
              }}
            >
          {/* ——— Hero full-width ——— */}
          <Box
            component="section"
            aria-labelledby="perfil-hero-nombre"
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: { xs: 400, sm: 420, md: 440 },
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {bannerUrl || photo ? (
              <Box
                component="img"
                src={bannerUrl || photo}
                alt=""
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'blur(22px) saturate(1.05)',
                  transform: 'scale(1.12)',
                  opacity: 0.85,
                }}
              />
            ) : null}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: [
                  'radial-gradient(80% 60% at 20% 20%, rgba(255,255,255,0.35) 0%, transparent 55%)',
                  'radial-gradient(70% 50% at 100% 0%, rgba(113, 160, 149, 0.45) 0%, transparent 50%)',
                  'linear-gradient(165deg, rgba(8, 89, 70, 0.88) 0%, rgba(13, 109, 88, 0.78) 38%, rgba(26, 40, 64, 0.88) 100%)',
                ].join(', '),
              }}
            />
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                py: { xs: 3.5, md: 4.5 },
              }}
            >
              <Box
                sx={{
                  ...dirContentSx,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: 3, md: 4 },
                  alignItems: { xs: 'center', md: 'center' },
                }}
              >
                <Avatar
                  src={photo || undefined}
                  sx={{
                    width: { xs: 112, md: 144 },
                    height: { xs: 112, md: 144 },
                    fontSize: { xs: '2.1rem', md: '2.5rem' },
                    fontWeight: 800,
                    border: '4px solid rgba(255,255,255,0.92)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                    bgcolor: 'primary.light',
                    flexShrink: 0,
                  }}
                >
                  {!photo ? directoryInitials(name) : null}
                </Avatar>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: 'common.white',
                    textAlign: { xs: 'center', md: 'left' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1.25, md: 1.5 },
                    borderRadius: { xs: 0, md: 3 },
                    bgcolor: { xs: 'transparent', md: 'rgba(0,0,0,0.2)' },
                    backdropFilter: { xs: 'none', md: 'blur(14px)' },
                    WebkitBackdropFilter: { xs: 'none', md: 'blur(14px)' },
                    border: { xs: 'none', md: '1px solid rgba(255,255,255,0.14)' },
                    p: { xs: 0, md: 2.5 },
                    boxShadow: { md: '0 20px 48px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Stack direction="row" flexWrap="wrap" gap={1} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 0 }}>
                    <Chip
                      icon={<Verified sx={{ color: 'inherit !important', '&&': { fontSize: 18 } }} />}
                      label="Verificado en red"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'common.white',
                        fontWeight: 700,
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    />
                    {profile._demo?.premium ? (
                      <Chip
                        icon={<AutoAwesome sx={{ color: 'inherit !important', '&&': { fontSize: 17 } }} />}
                        label="Premium"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.14)',
                          color: 'common.white',
                          fontWeight: 700,
                          border: '1px solid rgba(255,255,255,0.28)',
                        }}
                      />
                    ) : null}
                    {typeof profile.perfilVisitas === 'number' && profile.perfilVisitas > 0 ? (
                      <Chip
                        label={`${profile.perfilVisitas.toLocaleString('es-CO')} visitas al perfil`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.12)',
                          color: 'common.white',
                          fontWeight: 700,
                          border: '1px solid rgba(255,255,255,0.22)',
                        }}
                      />
                    ) : null}
                  </Stack>

                  <Typography
                    id="perfil-hero-nombre"
                    component="h1"
                    sx={{
                      ...dirType.h1,
                      color: 'common.white',
                      textShadow: '0 2px 24px rgba(0,0,0,0.25)',
                    }}
                  >
                    {name}
                  </Typography>

                  <Stack spacing={0.5} sx={{ opacity: 0.95 }}>
                    {profile.profesion ? (
                      <Typography
                        component="p"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1.0625rem', md: 'clamp(1.0625rem, 1.2vw, 1.1875rem)' },
                          lineHeight: 1.45,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {profile.profesion}
                        {city ? ` · ${city}` : ''}
                      </Typography>
                    ) : city ? (
                      <Stack direction="row" alignItems="center" spacing={0.75} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                        <LocationOn sx={{ fontSize: 20, opacity: 0.9 }} />
                        <Typography sx={{ fontWeight: 600, fontSize: { xs: '1.0625rem', md: '1.125rem' } }}>{city}</Typography>
                      </Stack>
                    ) : null}
                  </Stack>

                  {(direccionPublica || mailtoProfessionalHref) ? (
                    <Stack spacing={1} sx={{ mt: 0.5, alignItems: { xs: 'center', md: 'flex-start' } }}>
                      {direccionPublica ? (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="flex-start"
                          justifyContent={{ xs: 'center', md: 'flex-start' }}
                        >
                          <LocationOn sx={{ fontSize: 22, opacity: 0.95, mt: 0.25 }} />
                          <Typography
                            component="p"
                            sx={{
                              fontWeight: 600,
                              textAlign: { xs: 'center', md: 'left' },
                              maxWidth: 560,
                              lineHeight: 1.45,
                            }}
                          >
                            {direccionPublica}
                          </Typography>
                        </Stack>
                      ) : null}
                      {mailtoProfessionalHref ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent={{ xs: 'center', md: 'flex-start' }}
                          spacing={0.75}
                        >
                          <Email sx={{ fontSize: 20, opacity: 0.95 }} />
                          <Typography
                            component="a"
                            href={mailtoProfessionalHref}
                            sx={{
                              color: 'inherit',
                              fontWeight: 700,
                              textDecoration: 'underline',
                              textUnderlineOffset: 3,
                              wordBreak: 'break-word',
                            }}
                          >
                            {emailPublico || profile?.account?.email}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>
                  ) : null}

                  {profile.parentProfile?.id ? (
                    <Button
                      component={RouterLink}
                      to={`/directorio/profesional/${profile.parentProfile.id}`}
                      variant="text"
                      size="small"
                      sx={{
                        mt: 1.5,
                        alignSelf: { xs: 'center', md: 'flex-start' },
                        color: 'common.white',
                        fontWeight: 700,
                        textTransform: 'none',
                        textDecoration: 'underline',
                      }}
                    >
                      Ver ficha del centro:{' '}
                      {profile.parentProfile.nombreConsultorio?.trim() ||
                        profile.parentProfile.account?.nombre ||
                        'Centro auditivo'}
                    </Button>
                  ) : null}

                  <Typography
                    component="p"
                    sx={{
                      mt: 0.5,
                      maxWidth: '52ch',
                      mx: { xs: 'auto', md: 0 },
                      fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                      lineHeight: 1.6,
                      fontWeight: 500,
                      opacity: 0.94,
                    }}
                  >
                    {empathyHero}
                  </Typography>

                  {profile._demo?.rating != null ? (
                    <Stack direction="row" alignItems="center" spacing={1.25} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mt: 1.5 }}>
                      <Rating value={profile._demo.rating} precision={0.1} readOnly sx={{ color: '#f0d78c' }} />
                      <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{profile._demo.rating.toFixed(1)}</Typography>
                      {profile._demo.reviewCount != null ? (
                        <Typography sx={{ opacity: 0.85, fontWeight: 600 }}>
                          ({profile._demo.reviewCount} reseñas)
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 1.25, sm: 1.5 }}
                    useFlexGap
                    sx={{
                      mt: 2,
                      maxWidth: 640,
                      mx: { xs: 'auto', md: 0 },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      component={RouterLink}
                      to={agendarDesdeDirectorio}
                      variant="contained"
                      size="large"
                      startIcon={<CalendarMonth />}
                      sx={{
                        ...dirCtaPrimarySx,
                        flex: { sm: '0 0 auto' },
                        minWidth: { sm: 200 },
                        py: 1.35,
                        px: 2.75,
                        fontSize: { xs: '1rem', md: '1.0625rem' },
                        bgcolor: 'common.white',
                        color: 'primary.dark',
                        boxShadow: '0 10px 36px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: '#f7fffb', boxShadow: '0 14px 42px rgba(0,0,0,0.24)' },
                      }}
                    >
                      Agendar cita
                    </Button>
                    <Button
                      onClick={onWhatsappTrack}
                      href={waConversionHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="medium"
                      startIcon={<WhatsApp />}
                      sx={{
                        flex: { sm: '0 1 auto' },
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                        color: 'rgba(255,255,255,0.92)',
                        borderColor: 'rgba(255,255,255,0.42)',
                        borderWidth: 1,
                        '&:hover': { borderColor: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      WhatsApp
                    </Button>
                    {telHref ? (
                      <Button
                        href={telHref}
                        variant="text"
                        size="small"
                        startIcon={<Phone />}
                        sx={{
                          color: 'common.white',
                          textTransform: 'none',
                          fontWeight: 600,
                          opacity: 0.85,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        Llamar
                      </Button>
                    ) : null}
                    {mailtoProfessionalHref ? (
                      <Button
                        href={mailtoProfessionalHref}
                        variant="text"
                        size="small"
                        startIcon={<Email />}
                        sx={{
                          color: 'common.white',
                          textTransform: 'none',
                          fontWeight: 600,
                          opacity: 0.82,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        Correo
                      </Button>
                    ) : null}
                  </Stack>
                  <Stack spacing={0.35} sx={{ mt: 1.5, maxWidth: '52ch', mx: { xs: 'auto', md: 0 } }}>
                    <Typography component="p" sx={{ fontSize: { xs: '0.8125rem', md: '0.875rem' }, fontWeight: 600, opacity: 0.92, lineHeight: 1.5 }}>
                      Agenda en menos de 1 minuto · Respondo rápido por WhatsApp
                    </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontSize: { xs: '0.8125rem', md: '0.875rem' },
                      fontWeight: 500,
                      opacity: 0.82,
                      lineHeight: 1.55,
                    }}
                  >
                    Sin compromiso: elige cómo empezar.{' '}
                    <Box
                      component="button"
                      type="button"
                      onClick={scrollToContact}
                      sx={{
                        display: 'inline',
                        color: 'common.white',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: 3,
                        border: 0,
                        bgcolor: 'transparent',
                        p: 0,
                        font: 'inherit',
                        textAlign: 'inherit',
                      }}
                    >
                      O deja tus datos y te escribimos
                    </Box>
                    .
                  </Typography>
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: '100%',
              py: { xs: 1.75, md: 2 },
              bgcolor: 'background.paper',
              borderBottom: '1px solid rgba(8, 89, 70, 0.08)',
            }}
          >
            <Box sx={dirContentSx}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'center' }}
                justifyContent="space-between"
              >
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography component="p" sx={{ ...dirType.h3, mb: 0.5, color: 'text.primary' }}>
                    ¿Lista o listo para dar el paso?
                  </Typography>
                  <Typography sx={{ ...dirType.small, color: 'text.secondary', maxWidth: 480 }}>
                    Reserva en línea en pocos clics o escribe por WhatsApp; también puedes dejar tus datos abajo.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent={{ xs: 'center', md: 'flex-end' }}>
                  <Button
                    component={RouterLink}
                    to={agendarDesdeDirectorio}
                    variant="contained"
                    size="medium"
                    startIcon={<CalendarMonth />}
                    sx={{
                      ...dirCtaPrimarySx,
                      bgcolor: 'primary.main',
                      color: 'common.white',
                      px: 2.5,
                      boxShadow: '0 8px 24px rgba(8, 89, 70, 0.35)',
                      '&:hover': { bgcolor: 'primary.dark', boxShadow: '0 10px 28px rgba(8, 89, 70, 0.4)' },
                    }}
                  >
                    Agendar ahora
                  </Button>
                  <Button
                    onClick={onWhatsappTrack}
                    href={waConversionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    color="success"
                    size="medium"
                    startIcon={<WhatsApp />}
                    sx={{ ...dirCtaPrimarySx, fontWeight: 700, borderWidth: 2 }}
                  >
                    WhatsApp
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* ——— Cuerpo ancho ——— */}
          {/* Sin pb aquí: el padding bajo el último bloque iba con fondo de página y se veía como línea sobre la barra fija */}
          <Box component="main" sx={{ width: '100%', pb: 0 }}>
            <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.b }) }}>
              <Box sx={dirContentSx}>
                <Typography component="h2" variant="h5" sx={{ ...dirH2Sx, mb: 1 }}>
                  {sectionTitles.ayuda}
                </Typography>
                <Typography component="p" sx={{ ...dirType.small, mb: 2, maxWidth: '56ch' }}>
                  Cada consulta es conversación, claridad y un plan que tenga sentido para ti.
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    ...dirType.body,
                    ...dirBodyMaxSx,
                  }}
                >
                  {helpBody}
                </Typography>
                <Typography component="h3" sx={{ ...dirType.h3, mt: 3, mb: 1.5 }}>
                  Cómo te acompaño
                </Typography>
                <Grid container spacing={2}>
                  {HELP_PILLAR_COPY.map((pill, idx) => {
                    const Icon = HELP_PILLAR_ICONS[idx] || MedicalServices;
                    return (
                      <Grid item xs={12} sm={6} key={pill.title}>
                        <Paper
                          elevation={0}
                          sx={{
                            ...dirCardSx,
                            height: '100%',
                            p: 2,
                            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 8px 28px rgba(16, 40, 32, 0.1)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: 'rgba(8, 89, 70, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'primary.dark',
                              }}
                            >
                              <Icon sx={{ fontSize: 26 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ ...dirType.h3, mb: 0.75, fontSize: { xs: '1rem', md: '1.0625rem' } }}>{pill.title}</Typography>
                              <Typography sx={{ ...dirType.small, lineHeight: 1.55 }}>{pill.text}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
                {profile.nombreConsultorio ? (
                  <Typography component="p" sx={{ ...dirType.h3, mt: 3.5, color: 'primary.dark' }}>
                    {profile.nombreConsultorio}
                  </Typography>
                ) : null}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  useFlexGap
                  sx={{ mt: 3, flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <Button
                    component={RouterLink}
                    to={agendarDesdeDirectorio}
                    variant="contained"
                    size="large"
                    startIcon={<CalendarMonth />}
                    sx={{
                      ...dirCtaPrimarySx,
                      fontWeight: 800,
                      px: 2.75,
                      flex: { sm: '0 0 auto' },
                      bgcolor: 'primary.main',
                      color: 'common.white',
                      boxShadow: '0 8px 24px rgba(8, 89, 70, 0.3)',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    Reservar cita
                  </Button>
                  <Button
                    onClick={onWhatsappTrack}
                    href={waConversionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    color="primary"
                    size="medium"
                    startIcon={<WhatsApp />}
                    sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2, borderWidth: 1.5, flex: { sm: '0 1 auto' } }}
                  >
                    WhatsApp
                  </Button>
                  {telHref ? (
                    <Button href={telHref} variant="text" size="medium" startIcon={<Phone />} sx={{ fontWeight: 600, textTransform: 'none' }}>
                      Llamar ahora
                    </Button>
                  ) : null}
                  <Button onClick={scrollToContact} variant="text" size="medium" sx={{ fontWeight: 600, textTransform: 'none', opacity: 0.92 }}>
                    Formulario de contacto
                  </Button>
                </Stack>
              </Box>
            </Box>

            {showIntroMedia ? (
              <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.a }) }}>
                <Box sx={dirContentSx}>
                  <Typography component="p" sx={dirType.overline}>
                    {introVideoSrc ? 'Video' : 'Imágenes'} · contenido publicado por el titular
                  </Typography>
                  <Typography component="h2" sx={{ ...dirH2Sx, mb: 1 }}>
                    {introVideoSrc ? `Conoce a ${firstName}` : 'Tu consultorio'}
                  </Typography>
                  <Typography sx={{ ...dirType.small, mb: 2.25, maxWidth: '58ch' }}>
                    {introVideoSrc
                      ? 'Un mensaje breve ayuda a conectar antes de la cita: escucha el tono y la forma de explicar de este profesional.'
                      : 'Fotos del entorno donde te atenderás: transparencia y cercanía antes de reservar.'}
                  </Typography>
                  <Stack spacing={3}>
                    {introVideoSrc ? (
                      <Paper
                        elevation={0}
                        sx={{
                          ...dirCardMediaSx,
                          maxWidth: 760,
                          mx: 'auto',
                          width: '100%',
                          borderRadius: 3,
                          boxShadow: '0 16px 48px rgba(16, 40, 32, 0.12)',
                        }}
                      >
                        <Box
                          component="video"
                          src={introVideoSrc}
                          controls
                          playsInline
                          preload="metadata"
                          sx={{
                            width: '100%',
                            display: 'block',
                            aspectRatio: '16 / 9',
                            maxHeight: { xs: 280, md: 440 },
                            objectFit: 'contain',
                            bgcolor: '#0a1210',
                          }}
                        />
                      </Paper>
                    ) : null}
                    {introPhotoUrls.length > 0 ? (
                      <Grid container spacing={2.5}>
                        {introPhotoUrls.map((src, i) => (
                          <Grid item xs={12} md={6} key={src}>
                            <Paper
                              elevation={0}
                              sx={{
                                ...dirCardMediaSx,
                                borderRadius: 3,
                                overflow: 'hidden',
                                boxShadow: '0 12px 40px rgba(16, 40, 32, 0.08)',
                              }}
                            >
                              <Box
                                component="img"
                                src={src}
                                alt={i === 0 ? 'Entorno de consulta' : 'Atención al paciente'}
                                sx={{
                                  width: '100%',
                                  height: { xs: 220, md: 280 },
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                              <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(8, 89, 70, 0.04)', borderTop: '1px solid rgba(8, 89, 70, 0.08)' }}>
                                <Typography sx={{ ...dirType.small, fontWeight: 700, color: 'primary.dark' }}>
                                  {i === 0 ? 'Consultorio y entorno' : 'Acompañamiento en consulta'}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : null}
                  </Stack>
                </Box>
              </Box>
            ) : null}

            {profile.blogMarkdown && String(profile.blogMarkdown).trim() ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.a }) }}>
                  <Box sx={dirContentSx}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.14em', color: 'primary.main' }}>
                      {sectionTitles.blog}
                    </Typography>
                    <Paper elevation={0} sx={{ ...dirCardSx, mt: 2 }}>
                      <Typography
                        component="div"
                        sx={{ ...dirType.body, whiteSpace: 'pre-wrap', fontSize: { xs: '0.9375rem', md: '1.0625rem' }, lineHeight: 1.65 }}
                      >
                        {String(profile.blogMarkdown).trim()}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </>
            ) : null}

            <Box
              id="contacto-perfil"
              ref={contactRef}
              sx={{ ...dirBleed({ bgcolor: DIR_BG.contact }), scrollMarginTop: 96 }}
            >
              <Box sx={dirContentSx}>
                <Typography component="h2" variant="h5" sx={{ ...dirH2Sx, mb: 0.75 }}>
                  {sectionTitles.contacto}
                </Typography>
                <Typography sx={{ ...dirType.body, mb: 0.5, ...dirBodyMaxSx, fontWeight: 500, color: 'text.secondary' }}>
                  Respuesta humana: deja tus datos y te escribimos o llamamos. Si prefieres, usa WhatsApp al instante.
                </Typography>
                <Typography sx={{ ...dirType.small, mb: 2.25, fontWeight: 600, color: 'primary.dark' }}>
                  Agenda en menos de 1 minuto desde «Agendar» arriba, o cuéntanos tu caso aquí.
                </Typography>
                {leadSuccess ? (
                  <Alert
                    severity="success"
                    sx={{ maxWidth: 560, mx: 'auto', borderRadius: 2 }}
                    action={
                      <Button color="inherit" size="small" onClick={resetLeadForm} sx={{ fontWeight: 700, textTransform: 'none' }}>
                        Enviar otro
                      </Button>
                    }
                  >
                    Listo: recibimos tu solicitud. Revisa tu correo y mantén el teléfono a mano por si te llamamos.
                  </Alert>
                ) : (
                  <Paper component="div" elevation={0} sx={dirFormCardSx}>
                    <Box component="form" onSubmit={handleLeadSubmit} noValidate>
                      <Stack spacing={2.25}>
                        {leadError ? (
                          <Alert severity="error" onClose={() => setLeadError('')} sx={{ borderRadius: 2 }}>
                            {leadError}
                          </Alert>
                        ) : null}
                        <TextField
                          required
                          label="Nombre"
                          name="nombre"
                          value={leadNombre}
                          onChange={(e) => setLeadNombre(e.target.value)}
                          autoComplete="name"
                          fullWidth
                          sx={dirFieldSx}
                        />
                        <TextField
                          required
                          type="email"
                          label="Correo electrónico"
                          name="email"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          autoComplete="email"
                          fullWidth
                          sx={dirFieldSx}
                          helperText="Para enviarte la confirmación y poder responderte."
                        />
                        <TextField
                          required
                          label="Teléfono"
                          name="telefono"
                          value={leadTelefono}
                          onChange={(e) => setLeadTelefono(e.target.value)}
                          autoComplete="tel"
                          fullWidth
                          sx={dirFieldSx}
                          helperText="Si es WhatsApp, mejor: así te respondemos más rápido."
                        />
                        <TextField
                          label="Mensaje"
                          name="mensaje"
                          value={leadMensaje}
                          onChange={(e) => setLeadMensaje(e.target.value)}
                          multiline
                          minRows={4}
                          fullWidth
                          sx={dirFieldSx}
                          inputProps={{ maxLength: 2000 }}
                          placeholder="Ej.: acúfenos, audífonos, valoración para un familiar…"
                          helperText="Opcional pero nos ayuda a prepararnos antes de contactarte."
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5, alignItems: { sm: 'center' } }}>
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={leadSubmitting}
                            sx={{
                              ...dirCtaPrimarySx,
                              fontWeight: 800,
                              px: 3,
                              py: 1.25,
                              flex: { sm: '0 0 auto' },
                              bgcolor: 'primary.main',
                              color: 'common.white',
                              boxShadow: '0 8px 24px rgba(8, 89, 70, 0.28)',
                              '&:hover': { bgcolor: 'primary.dark' },
                            }}
                          >
                            {leadSubmitting ? 'Enviando…' : 'Enviar solicitud'}
                          </Button>
                          <Button
                            onClick={onWhatsappTrack}
                            href={waConversionHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            size="medium"
                            startIcon={<WhatsApp />}
                            sx={{ ...dirCtaPrimarySx, fontWeight: 700, flex: { sm: '0 1 auto' } }}
                          >
                            Prefiero WhatsApp
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </Paper>
                )}
              </Box>
            </Box>

            {liveChatSrc ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.b }) }}>
                  <Box sx={dirContentSx}>
                    <Typography component="h2" variant="h5" sx={{ ...dirH2Sx, mb: 0.75 }}>
                      {sectionTitles.chat}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720, lineHeight: 1.65 }}>
                      Si no ves el cuadro, tu navegador puede bloquear contenido incrustado; en ese caso usa el enlace que te
                      compartió el profesional.
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        ...dirCardMediaSx,
                        height: { xs: 360, md: 420 },
                        bgcolor: 'grey.100',
                      }}
                    >
                      <Box
                        component="iframe"
                        src={liveChatSrc}
                        title={sectionTitles.chat}
                        sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    </Paper>
                  </Box>
                </Box>
              </>
            ) : profile?.liveChatUrl && String(profile.liveChatUrl).trim() && !liveChatSrc ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.b }) }}>
                  <Box sx={dirContentSx}>
                    <Typography component="h2" variant="h5" sx={{ ...dirH2Sx, mb: 1 }}>
                      {sectionTitles.chat}
                    </Typography>
                    <Button
                      href={String(profile.liveChatUrl).trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                    >
                      Abrir chat en nueva pestaña
                    </Button>
                  </Box>
                </Box>
              </>
            ) : null}

            <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.a }) }}>
              <Box sx={dirContentSx}>
                <Typography
                  component="h2"
                  variant="overline"
                  sx={{ fontWeight: 800, letterSpacing: '0.14em', color: 'primary.main' }}
                >
                  {sectionTitles.servicios}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.75, fontWeight: 500 }}>
                  {sectionTitles.serviciosDesc}
                </Typography>
                {chips.length > 0 ? (
                  <Grid container spacing={1.75}>
                    {chips.map((c, idx) => {
                      const SvcIcon = HELP_PILLAR_ICONS[idx % HELP_PILLAR_ICONS.length];
                      return (
                        <Grid item xs={12} sm={6} md={4} key={c}>
                          <Paper
                            elevation={0}
                            sx={{
                              height: '100%',
                              p: 2,
                              borderRadius: 2.5,
                              border: '1px solid rgba(8, 89, 70, 0.1)',
                              bgcolor: 'rgba(255,255,255,0.85)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 32px rgba(16, 40, 32, 0.08)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.75,
                                bgcolor: 'rgba(8, 89, 70, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'primary.dark',
                                flexShrink: 0,
                              }}
                            >
                              <SvcIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.9375rem', md: '1rem' }, lineHeight: 1.45, color: '#0f1f18' }}>
                              {c}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Typography sx={{ ...dirType.body }}>
                    Podemos revisar juntos qué necesitas; en consulta te cuento con más detalle cómo te puedo apoyar.
                  </Typography>
                )}

                {availabilityNote ? (
                  <Typography variant="body2" sx={{ mt: 3, maxWidth: 720, fontWeight: 600, color: 'primary.dark' }}>
                    {availabilityNote}
                  </Typography>
                ) : null}

                {(consultationBlocks.costos || consultationBlocks.preparacion || consultationBlocks.contactoCentro) ? (
                  <Box sx={{ mt: 4, pt: 3, borderTop: '1px dashed rgba(8, 89, 70, 0.2)' }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'primary.main' }}>
                      {sectionTitles.infoPacientes}
                    </Typography>
                    <Stack spacing={2.5} sx={{ mt: 2 }}>
                      {consultationBlocks.costos ? (
                        <Paper elevation={0} sx={dirCardSx}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                            Costos y pagos
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                            {consultationBlocks.costos}
                          </Typography>
                        </Paper>
                      ) : null}
                      {consultationBlocks.preparacion ? (
                        <Paper elevation={0} sx={dirCardSx}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                            Preparación para exámenes
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                            {consultationBlocks.preparacion}
                          </Typography>
                        </Paper>
                      ) : null}
                      {consultationBlocks.contactoCentro ? (
                        <Paper elevation={0} sx={dirCardSx}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                            Cómo contactar
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                            {consultationBlocks.contactoCentro}
                          </Typography>
                        </Paper>
                      ) : null}
                    </Stack>
                  </Box>
                ) : null}

                {polizas.length > 0 ? (
                  <Box sx={{ mt: 4 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: '0.14em',
                        color: 'primary.main',
                        display: 'block',
                        mb: 1.75,
                      }}
                    >
                      {sectionTitles.empresasSalud}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                      {polizas.map((p) => (
                        <Chip key={p} label={p} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }} />
                      ))}
                    </Stack>
                  </Box>
                ) : null}

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  useFlexGap
                  sx={{ mt: 4, pt: 3, borderTop: '1px dashed rgba(8, 89, 70, 0.2)', flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <Box sx={{ width: { xs: '100%', sm: 'auto' }, mr: { sm: 2 }, minWidth: { sm: 200 } }}>
                    <Typography component="p" sx={{ ...dirType.h3, color: '#0f1f18', mb: 0.25 }}>
                      ¿Listo para dar el paso?
                    </Typography>
                    <Typography sx={{ ...dirType.small, fontWeight: 600, color: 'text.secondary' }}>
                      Agenda en menos de 1 minuto · WhatsApp con respuesta ágil
                    </Typography>
                  </Box>
                  <Button
                    component={RouterLink}
                    to={agendarDesdeDirectorio}
                    variant="contained"
                    size="medium"
                    startIcon={<CalendarMonth />}
                    sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, flex: { sm: '0 0 auto' } }}
                  >
                    Agendar
                  </Button>
                  <Button
                    onClick={onWhatsappTrack}
                    href={waConversionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<WhatsApp />}
                    sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2, flex: { sm: '0 1 auto' } }}
                  >
                    WhatsApp
                  </Button>
                  <Button onClick={scrollToContact} variant="text" size="small" sx={{ fontWeight: 600, textTransform: 'none', opacity: 0.9 }}>
                    Ir al formulario
                  </Button>
                </Stack>
              </Box>
            </Box>

            {alliesGrouped.length > 0 ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.c }) }}>
                  <Box sx={dirContentSx}>
                    <Paper
                      component="section"
                      elevation={0}
                      aria-labelledby="dir-aliados-titulo"
                      sx={{
                        p: { xs: 2, sm: 2.25, md: 2.5 },
                        borderRadius: 3,
                        bgcolor: '#ffffff',
                        border: '1px solid rgba(8, 89, 70, 0.16)',
                        boxShadow: '0 8px 28px rgba(16, 40, 32, 0.07)',
                        maxWidth: { md: 820, lg: 920 },
                        mx: { md: 'auto' },
                      }}
                    >
                      <Typography
                        id="dir-aliados-titulo"
                        variant="overline"
                        sx={{ fontWeight: 800, letterSpacing: '0.14em', color: 'primary.main', display: 'block' }}
                      >
                        {sectionTitles.marcas}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0, fontWeight: 500, maxWidth: '52ch' }}>
                        {sectionTitles.marcasDesc}
                      </Typography>
                      <Stack
                        spacing={2}
                        divider={
                          <Divider flexItem sx={{ borderColor: 'rgba(8, 89, 70, 0.1)', my: 0 }} />
                        }
                        sx={{ mt: 1.75 }}
                      >
                        {alliesGrouped.map((block) => (
                          <Box key={block.label}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'primary.dark' }}>
                              {block.label}
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1.25} useFlexGap>
                              {block.names.map((a) => (
                                <Paper
                                  key={`${block.label}-${a}`}
                                  elevation={0}
                                  sx={{
                                    px: 1.75,
                                    py: 1.15,
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    color: '#1a2332',
                                    bgcolor: 'rgba(8, 89, 70, 0.04)',
                                    border: '1px solid rgba(8, 89, 70, 0.12)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-1px)',
                                      borderColor: 'rgba(8, 89, 70, 0.22)',
                                      boxShadow: '0 6px 18px rgba(16, 40, 32, 0.08)',
                                    },
                                  }}
                                >
                                  {a}
                                </Paper>
                              ))}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Box>
                </Box>
              </>
            ) : null}

            {profile.workplaces?.length ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.a }) }}>
                  <Box sx={dirContentSx}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.14em', color: 'primary.main' }}>
                      {sectionTitles.ubicaciones}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.75, fontWeight: 500 }}>
                      {sectionTitles.ubicacionesDesc}
                    </Typography>
                    <Stack spacing={2} alignItems="stretch">
                      {profile.workplaces.map((w) => {
                        const waSede = w.telefono ? waMeHrefFromPhone(w.telefono) : null;
                        return (
                          <Paper
                            key={w.id}
                            elevation={0}
                            sx={{
                              p: { xs: 2, md: 2.25 },
                              borderRadius: 2.5,
                              bgcolor: '#ffffff',
                              border: '1px solid rgba(8, 89, 70, 0.16)',
                              boxShadow: '0 6px 22px rgba(16, 40, 32, 0.07)',
                              maxWidth: { md: 680, lg: 720 },
                              width: '100%',
                              mx: { md: 'auto' },
                            }}
                          >
                            <Stack spacing={1.5}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f1f18', lineHeight: 1.3 }}>
                                  {w.nombreCentro}
                                </Typography>
                                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 0.75 }}>
                                  <LocationOn sx={{ fontSize: 22, color: 'primary.main', opacity: 0.85, mt: 0.15, flexShrink: 0 }} />
                                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, fontWeight: 500 }}>
                                    {[w.ciudad, w.direccion].filter(Boolean).join(' · ') || 'Ubicación publicada por el titular'}
                                  </Typography>
                                </Stack>
                              </Box>
                              {w.telefono ? (
                                <Box
                                  sx={{
                                    pt: 1.5,
                                    borderTop: '1px solid rgba(8, 89, 70, 0.1)',
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <Phone sx={{ fontSize: 20, color: 'primary.main' }} />
                                    <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: '0.01em' }}>
                                      {w.telefono}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                                    <Button
                                      href={`tel:${String(w.telefono).replace(/\s/g, '')}`}
                                      variant="contained"
                                      size="small"
                                      startIcon={<Phone />}
                                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                    >
                                      Llamar a esta sede
                                    </Button>
                                    {waSede ? (
                                      <Button
                                        onClick={onWhatsappTrack}
                                        href={waSede}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outlined"
                                        size="small"
                                        startIcon={<WhatsApp />}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                      >
                                        WhatsApp
                                      </Button>
                                    ) : null}
                                  </Stack>
                                </Box>
                              ) : null}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                </Box>
              </>
            ) : null}

            {mapsEmbedSafe || mapsLugar ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.a }) }}>
                  <Box sx={dirContentSx}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.14em', color: 'primary.main' }}>
                      Mapa
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, fontWeight: 500 }}>
                      {direccionPublica || 'Ubicación aproximada según la información publicada por el titular.'}
                    </Typography>
                    {mapsEmbedSafe ? (
                      <Paper
                        elevation={0}
                        sx={{
                          ...dirCardMediaSx,
                          height: { xs: 280, md: 360 },
                          bgcolor: 'grey.100',
                        }}
                      >
                        <Box
                          component="iframe"
                          src={mapsEmbedSafe}
                          title="Mapa Google"
                          sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </Paper>
                    ) : null}
                    {mapsLugar ? (
                      <Button
                        href={mapsLugar}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        sx={{ mt: mapsEmbedSafe ? 2 : 0, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
                      >
                        Abrir en Google Maps
                      </Button>
                    ) : null}
                    {!mapsEmbedSafe && mapsEmbed ? (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        La URL del mapa incrustado debe ser la que genera Google al usar «Insertar mapa» (suele empezar por{' '}
                        https://www.google.com/maps/embed). Enlaces normales de Maps van en «Abrir en Google Maps».
                      </Alert>
                    ) : null}
                  </Box>
                </Box>
              </>
            ) : null}

            {profile._demo?.testimonials?.length ? (
              <>
                <Box sx={{ ...dirBleed({ bgcolor: DIR_BG.b }) }}>
                  <Box sx={dirContentSx}>
                    <Typography component="h2" variant="h5" sx={{ ...dirH2Sx, mb: 0.5 }}>
                      Lo que dicen mis pacientes
                    </Typography>
                    <Typography sx={{ ...dirType.small, mb: 2.25, fontWeight: 600 }}>
                      Historias reales de quienes ya dieron el primer paso
                    </Typography>
                    <Stack spacing={2.5}>
                      {profile._demo.testimonials.slice(0, 3).map((t, i) => (
                        <Paper
                          key={i}
                          elevation={0}
                          sx={{
                            ...dirCardSx,
                            borderRadius: 3,
                            position: 'relative',
                            pl: { xs: 2.5, md: 3.5 },
                            borderLeft: '4px solid',
                            borderLeftColor: 'primary.main',
                            overflow: 'hidden',
                          }}
                        >
                          <FormatQuote
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 16,
                              fontSize: 48,
                              opacity: 0.08,
                              color: 'primary.main',
                            }}
                          />
                          <Typography
                            sx={{
                              fontStyle: 'italic',
                              lineHeight: 1.65,
                              color: 'text.primary',
                              fontSize: { xs: '1rem', md: '1.0625rem' },
                              fontWeight: 500,
                              position: 'relative',
                              zIndex: 1,
                            }}
                          >
                            “{t.text}”
                          </Typography>
                          <Typography sx={{ ...dirType.small, mt: 2, fontWeight: 800, color: 'primary.dark', fontStyle: 'normal' }}>
                            — {t.author}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </>
            ) : null}

            <Box
              sx={{
                width: '100%',
                pt: { xs: 4.5, md: 5.5 },
                /* Misma reserva que antes en `main` pb, pero con fondo del bloque: evita franja del color de página sobre la barra fija */
                pb: {
                  xs: 'calc(36px + 88px + env(safe-area-inset-bottom, 0px))',
                  sm: 'calc(36px + 80px + env(safe-area-inset-bottom, 0px))',
                  md: 'calc(44px + 80px + env(safe-area-inset-bottom, 0px))',
                },
                background: 'linear-gradient(135deg, rgba(8, 89, 70, 0.95) 0%, rgba(26, 40, 64, 0.92) 100%)',
              }}
            >
              <Box sx={{ ...dirContentSx, textAlign: 'center', color: 'common.white' }}>
                <Typography
                  component="h2"
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: 'common.white',
                    fontSize: { xs: '1.25rem', sm: '1.35rem', md: 'clamp(1.35rem, 2vw, 1.6rem)' },
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                  }}
                >
                  Da el primer paso
                </Typography>
                <Typography sx={{ opacity: 0.9, mb: 0.75, maxWidth: '52ch', mx: 'auto', fontWeight: 600, lineHeight: 1.55, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>
                  Agenda en menos de 1 minuto en línea.
                </Typography>
                <Typography sx={{ opacity: 0.82, mb: 2.25, maxWidth: '52ch', mx: 'auto', fontWeight: 500, lineHeight: 1.65, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}>
                  Respondo rápido por WhatsApp; también puedes llamar o dejar tus datos en el formulario.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.75}
                  justifyContent="center"
                  alignItems="center"
                  sx={{ flexWrap: 'wrap', rowGap: 1.5 }}
                >
                  <Button
                    component={RouterLink}
                    to={agendarDesdeDirectorio}
                    variant="contained"
                    size="large"
                    startIcon={<CalendarMonth />}
                    sx={{
                      py: 1.35,
                      px: 3.25,
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2.5,
                      bgcolor: 'common.white',
                      color: 'primary.dark',
                      boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
                      '&:hover': { bgcolor: '#f0fff8' },
                    }}
                  >
                    Agendar cita
                  </Button>
                  <Button
                    onClick={onWhatsappTrack}
                    href={waConversionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="medium"
                    startIcon={<WhatsApp />}
                    sx={{
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      color: 'rgba(255,255,255,0.92)',
                      borderColor: 'rgba(255,255,255,0.45)',
                      borderWidth: 1,
                      '&:hover': { borderColor: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.06)' },
                    }}
                  >
                    WhatsApp
                  </Button>
                  {telHref ? (
                    <Button
                      href={telHref}
                      variant="text"
                      size="medium"
                      startIcon={<Phone />}
                      sx={{
                        color: 'rgba(255,255,255,0.88)',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      Llamar
                    </Button>
                  ) : null}
                  {mailtoProfessionalHref ? (
                    <Button
                      href={mailtoProfessionalHref}
                      variant="text"
                      size="medium"
                      startIcon={<Email />}
                      sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'none' }}
                    >
                      Correo
                    </Button>
                  ) : null}
                  <Button
                    onClick={scrollToContact}
                    variant="text"
                    size="medium"
                    sx={{ color: 'rgba(255,255,255,0.78)', fontWeight: 600, textTransform: 'none' }}
                  >
                    Formulario
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Box>
            </Box>
          </Box>

          <Paper
            component="nav"
            aria-label="Reserva y contacto"
            elevation={0}
            sx={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1200,
              width: '100%',
              maxWidth: '100%',
              borderRadius: 0,
              px: 0,
              py: 1.25,
              pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              bgcolor: '#ffffff',
              backgroundImage: 'none',
              /* Sin backdrop-filter: en WebKit suele dejar una línea oscura en el borde inferior de elementos fixed */
              border: 'none',
              borderTop: '1px solid rgba(8, 89, 70, 0.14)',
              borderBottom: 'none',
              boxShadow: 'none',
              /* Evita rendija de 1px entre la barra y el borde del viewport (se veía el fondo de la página). */
              bottom: -1,
              boxSizing: 'border-box',
            }}
          >
            <Box sx={dirContentSx}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                alignItems="stretch"
                justifyContent={{ xs: 'stretch', sm: 'flex-start' }}
                sx={{ width: '100%' }}
              >
              <Button
                component={RouterLink}
                to={agendarDesdeDirectorio}
                variant="contained"
                size="medium"
                startIcon={<CalendarMonth />}
                sx={{
                  fontWeight: 800,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  py: 1.1,
                  flex: { sm: '0 0 auto' },
                  minWidth: { sm: 168 },
                  boxShadow: 'none',
                  '&:hover': { boxShadow: '0 4px 14px rgba(8, 89, 70, 0.22)' },
                }}
              >
                Agendar cita
              </Button>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', sm: 'flex-start' }} flexWrap="wrap" useFlexGap sx={{ flex: { sm: '1 1 auto' } }}>
                <Button
                  onClick={onWhatsappTrack}
                  href={waConversionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<WhatsApp />}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    flex: { xs: '1 1 140px', sm: '0 0 auto' },
                    boxShadow: 'none',
                  }}
                >
                  WhatsApp
                </Button>
                {telHref ? (
                  <Button
                    href={telHref}
                    variant="text"
                    size="small"
                    startIcon={<Phone />}
                    sx={{ fontWeight: 600, textTransform: 'none', flex: { xs: '1 1 120px', sm: '0 0 auto' } }}
                  >
                    Llamar
                  </Button>
                ) : null}
                {mailtoProfessionalHref ? (
                  <Button
                    href={mailtoProfessionalHref}
                    variant="text"
                    size="medium"
                    startIcon={<Email />}
                    sx={{ fontWeight: 700, textTransform: 'none', minWidth: 0, display: { xs: 'none', lg: 'inline-flex' } }}
                  >
                    Correo
                  </Button>
                ) : null}
                <Button onClick={scrollToContact} variant="text" size="small" sx={{ fontWeight: 600, textTransform: 'none', flexShrink: 0, opacity: 0.9 }}>
                  Formulario
                </Button>
              </Stack>
              </Stack>
            </Box>
          </Paper>
        </>
      )}

      <Footer />
    </Box>
  );
}
