/**
 * F5.7b — Rediseño ficha profesional pública (versión landing Airbnb-style).
 *
 * Estructura:
 *  1. Banner cover 420px (bannerUrl o gradient fallback) con título Playfair sobrepuesto
 *  2. Sticky sub-nav con anchor links (Sobre mí · Servicios · Reseñas · Ubicación)
 *  3. Fila de fotos secundarias (galería) si photoUrls > 0
 *  4. Grid 2 columnas:
 *     · Izquierda: About storytelling · Credenciales · Servicios · Reseñas · Ubicación · FAQ
 *     · Derecha: sticky booking card con precio, horarios rápidos, botón principal + WhatsApp/Llamar
 *  5. CTA final grande
 *
 * Fallbacks para perfiles incompletos (completeness < 60%):
 *  · Sin bannerUrl → gradient púrpura/navy con textura
 *  · Sin foto → iniciales grandes en avatar circular
 *  · Sin servicios → oculto (o "consulta general")
 *  · Sin reseñas → destacar credenciales + "Sé el primero en agendar"
 *  · Sin precio → botón "Consultar por WhatsApp"
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, CircularProgress, Alert, IconButton,
  Container,
} from '@mui/material';
import {
  Verified, LocationOn, WhatsApp, Phone, CalendarMonth,
  Share as ShareIcon, FavoriteBorder, Star, ChevronRight,
  MedicalServicesOutlined, WorkspacePremiumOutlined, HeadphonesOutlined,
  FormatQuote, EmojiEventsOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContactoProfesionalDialog from '../components/directorio/ContactoProfesionalDialog';
import AgendarConProfesionalDialog from '../components/directorio/AgendarConProfesionalDialog';
import AgenteIAFloatingChat from '../components/directorio/AgenteIAFloatingChat';
import { fetchDirectoryProfilePublic, trackDirectoryWhatsAppClick, trackDirectoryCallClick } from '../services/directorySearchService';
import { trackEntityEvent } from '../utils/analytics';
import {
  directoryInitials,
  directoryPrimaryCity,
  directoryPrimaryPhonePublic,
  directoryPublicDisplayName,
  directoryPublicEmail,
  directoryProfileBio,
  directoryProfilePhoto,
  directoryServicesByProfession,
  waMeHrefFromPhone,
} from '../utils/directoryPresentation';
import { getWhatsAppHrefWithText } from '../config/publicSite';
import { DEMO_PROFILE_MAP } from '../data/directoryDemoData';

// ─── Design tokens ────────────────────────────────────────────
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

// Paleta de gradients para las mini fotos (cuando el profesional no tiene fotos reales)
const PLACEHOLDER_GRADIENTS = [
  ['#dbeafe', '#eff6ff', '#1e40af'],
  ['#dcfce7', '#ecfdf5', '#14532d'],
  ['#fef3c7', '#fef9c3', '#78350f'],
  ['#f3e8ff', '#faf5ff', '#6b21a8'],
  ['#fee2e2', '#fef2f2', '#991b1b'],
];

// ─── Helpers ──────────────────────────────────────────────────
function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function overline(text) {
  return (
    <Typography sx={{
      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
      color: MUTED, textTransform: 'uppercase',
    }}>{text}</Typography>
  );
}

function editorialTitle(text, size = '1.75rem') {
  return (
    <Typography sx={{
      ...SERIF, fontWeight: 600, color: NAVY,
      fontSize: { xs: '1.4rem', md: size }, lineHeight: 1.15,
    }}>{text}</Typography>
  );
}

// ─── Componentes internos ────────────────────────────────────

function StickySubNav({ sections, name, rating, onBook }) {
  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 20,
      bgcolor: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${BORDER}`,
      px: { xs: 2, md: 4 }, py: 1.25,
      display: 'flex', alignItems: 'center', gap: 3,
    }}>
      <Typography sx={{ ...SERIF, fontSize: '1.05rem', color: NAVY, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
        {name}
      </Typography>
      <Stack direction="row" spacing={2.5} sx={{ flex: 1, overflow: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {sections.map((s) => (
          <Box key={s.id} onClick={() => scrollTo(s.id)}
            sx={{
              fontSize: '0.85rem', color: MUTED, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              pb: 0.5, borderBottom: '2px solid transparent',
              '&:hover': { color: NAVY, borderBottomColor: NAVY },
            }}>
            {s.label}
          </Box>
        ))}
      </Stack>
      {rating > 0 && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Star sx={{ color: '#f59e0b', fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600 }}>{rating.toFixed(1)}</Typography>
        </Stack>
      )}
      <Button variant="contained" onClick={onBook}
        sx={{ background: NAVY, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
              px: 2.25, py: 0.75, borderRadius: '10px',
              '&:hover': { background: NAVY, filter: 'brightness(0.92)' } }}>
        Reservar
      </Button>
    </Box>
  );
}

function BannerCover({ profile, name, city, professional, initials, rating, reviewsCount, yearsExp }) {
  const bannerUrl = profile?.bannerUrl?.trim();
  const bgStyle = bannerUrl
    ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${NAVY} 0%, ${ACCENT} 55%, #a855f7 100%)` };

  return (
    <Box sx={{
      position: 'relative',
      height: { xs: 340, md: 460 },
      overflow: 'hidden',
      ...bgStyle,
    }}>
      {/* Textura decorativa si no hay banner */}
      {!bannerUrl && (
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.18), transparent 50%),
            radial-gradient(ellipse at 75% 60%, rgba(168,85,247,0.35), transparent 60%)`,
        }} />
      )}
      {/* Overlay para legibilidad */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(15,42,74,0.28) 0%, transparent 30%, rgba(15,42,74,0.65) 100%)',
      }} />

      {/* Ghost buttons esquina */}
      <Stack direction="row" spacing={1} sx={{
        position: 'absolute', top: 20, right: { xs: 16, md: 32 },
      }}>
        <IconButton size="small" sx={{
          bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.28)', color: '#fff',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
        }}>
          <FavoriteBorder fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{
          bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.28)', color: '#fff',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
        }}>
          <ShareIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Contenido sobre el cover */}
      <Container maxWidth="lg" sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        pb: { xs: 3, md: 5 }, color: '#fff',
      }}>
        <Typography sx={{
          fontSize: { xs: '0.7rem', md: '0.75rem' }, letterSpacing: '0.14em',
          textTransform: 'uppercase', opacity: 0.85, mb: 1.25,
        }}>
          Directorio · {professional || 'Profesional de la salud'} · {city || 'Colombia'}
        </Typography>
        <Typography sx={{
          ...SERIF, fontWeight: 500, color: '#fff',
          fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
          lineHeight: 1.02, mb: 1,
        }}>
          {name}
          <Box component="span" sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: { xs: 22, md: 28 }, height: { xs: 22, md: 28 },
            background: '#15803d', borderRadius: '50%',
            fontSize: { xs: '0.85rem', md: '1rem' }, verticalAlign: { xs: '5px', md: '8px' }, ml: 1,
          }}>
            <Verified sx={{ fontSize: { xs: 14, md: 18 }, color: '#fff' }} />
          </Box>
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" sx={{ fontSize: '0.95rem', opacity: 0.95 }}>
          <Box><strong>{professional || 'Profesional de la salud'}</strong></Box>
          {city && <><Box sx={{ opacity: 0.5 }}>·</Box><Box>{city}</Box></>}
          {yearsExp && <><Box sx={{ opacity: 0.5 }}>·</Box><Box>{yearsExp} años</Box></>}
          {rating > 0 && (
            <>
              <Box sx={{ opacity: 0.5 }}>·</Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Star sx={{ color: '#fbbf24', fontSize: 16 }} />
                <strong>{rating.toFixed(1)}</strong>
                <Box sx={{ opacity: 0.7 }}>({reviewsCount})</Box>
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function SecondaryPhotos({ photoUrls }) {
  const hasPhotos = Array.isArray(photoUrls) && photoUrls.length > 0;
  const slots = hasPhotos ? photoUrls.slice(0, 4) : [];
  // Si el profesional no tiene fotos, mostramos placeholders sutiles para que la ficha no se vea desnuda
  const placeholders = Array.from({ length: 4 - slots.length });

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      <Box sx={{
        display: 'grid', gap: 1.25,
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
      }}>
        {slots.map((url, i) => (
          <Box key={i} sx={{
            height: { xs: 90, md: 130 },
            borderRadius: '12px',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            border: `1px solid ${BORDER}`,
          }} />
        ))}
        {placeholders.map((_, i) => {
          const [c1, c2, ink] = PLACEHOLDER_GRADIENTS[(slots.length + i) % PLACEHOLDER_GRADIENTS.length];
          const labels = ['Consultorio', 'Equipo', 'Con pacientes', 'Ambiente'];
          return (
            <Box key={`ph-${i}`} sx={{
              height: { xs: 90, md: 130 },
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: ink, fontSize: '0.75rem', fontWeight: 500,
              border: `1px dashed ${c2}`,
            }}>
              {labels[(slots.length + i) % labels.length]}
            </Box>
          );
        })}
      </Box>
    </Container>
  );
}

function AboutSection({ name, initials, bio, quote }) {
  return (
    <Box id="sobre" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 2.5 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...SERIF, fontSize: '1.4rem', fontWeight: 500,
        }}>{initials}</Box>
        <Box>
          {overline('Sobre la profesional')}
          {editorialTitle(quote?.title || 'Cuidado personalizado, resultados reales', '1.4rem')}
        </Box>
      </Stack>
      <Typography sx={{ fontSize: '1rem', color: '#334155', lineHeight: 1.7, mb: 2 }}>
        {bio || `${name} es un profesional verificado en OírConecta. Solicita una consulta para conocer su enfoque, servicios y disponibilidad.`}
      </Typography>
      {quote?.text && (
        <Box sx={{
          borderLeft: `3px solid ${NAVY}`, pl: 2.5, py: 0.5, mt: 2.5,
          ...SERIF, fontStyle: 'italic', fontSize: '1.15rem',
          color: NAVY, lineHeight: 1.5,
        }}>
          <FormatQuote sx={{ color: `${NAVY}44`, fontSize: 24, mr: 0.5, verticalAlign: '-4px' }} />
          {quote.text}
        </Box>
      )}
    </Box>
  );
}

function CredentialsSection({ studies, professional, yearsExp }) {
  const items = [];
  if (Array.isArray(studies) && studies.length > 0) {
    for (const s of studies.slice(0, 4)) {
      items.push({
        icon: WorkspacePremiumOutlined,
        tint: '#eff6ff', ink: '#1e40af',
        title: s.institucion || s.institution || s.titulo || 'Estudio',
        sub: [s.titulo, s.ano].filter(Boolean).join(' · '),
      });
    }
  }
  if (professional) {
    items.push({
      icon: EmojiEventsOutlined,
      tint: '#ecfdf5', ink: '#14532d',
      title: `Registro RETHUS`, sub: 'Profesional verificado por OírConecta',
    });
  }
  if (yearsExp) {
    items.push({
      icon: HeadphonesOutlined,
      tint: '#fef3c7', ink: '#78350f',
      title: `${yearsExp} años de experiencia`, sub: 'En consulta profesional',
    });
  }
  if (items.length === 0) return null;

  return (
    <Box id="credenciales" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Credenciales verificadas')}
      <Box sx={{ mb: 2.5 }} />
      <Box sx={{
        display: 'grid', gap: 1.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
      }}>
        {items.map((it, i) => {
          const Ico = it.icon;
          return (
            <Stack key={i} direction="row" spacing={1.5} sx={{
              p: 1.75, border: `1px solid ${BORDER}`, borderRadius: '12px', bgcolor: '#fafbfc',
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '8px',
                bgcolor: it.tint, color: it.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ico sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.9rem' }}>{it.title}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: MUTED }}>{it.sub}</Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

function ServiciosSection({ servicios }) {
  const list = Array.isArray(servicios) ? servicios : [];
  if (list.length === 0) return null;

  return (
    <Box id="servicios" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Servicios')}
      <Box sx={{ mt: 1, mb: 2.5 }}>
        {editorialTitle('Lo que puedo hacer por ti', '1.7rem')}
      </Box>
      <Box sx={{
        display: 'grid', gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
      }}>
        {list.slice(0, 6).map((s, i) => {
          const [c1, c2] = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
          const nombre = s.nombre || s.name || s.titulo || 'Servicio';
          const desc = s.descripcion || s.description || '';
          const precio = s.precio || s.price;
          const duracion = s.duracion || s.duration;
          return (
            <Box key={i} sx={{
              border: `1px solid ${BORDER}`, borderRadius: '14px',
              overflow: 'hidden', bgcolor: '#fff',
            }}>
              <Box sx={{
                height: 100,
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
              }} />
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '1rem', mb: 0.5 }}>{nombre}</Typography>
                {desc && <Typography sx={{ fontSize: '0.85rem', color: MUTED, lineHeight: 1.5, mb: 1.25 }}>{desc}</Typography>}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>{duracion || ''}</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>
                    {precio ? `desde $${Number(precio).toLocaleString('es-CO')}` : 'Consulta precio'}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ContactCTA({ phone, wa, direccion, onBook, name, city }) {
  return (
    <Box id="ubicacion" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Cómo contactarme')}
      <Box sx={{ mt: 1, mb: 2.5 }}>
        {editorialTitle('Estoy aquí para ayudarte', '1.5rem')}
      </Box>
      <Stack spacing={1.5}>
        {direccion && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: NAVY }}>
            <LocationOn sx={{ color: ACCENT }} />
            <Typography sx={{ fontSize: '0.95rem' }}>{direccion}, {city}</Typography>
          </Stack>
        )}
        {phone && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: NAVY }}>
            <Phone sx={{ color: ACCENT }} />
            <Typography sx={{ fontSize: '0.95rem' }}>{phone}</Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function StickyBookingCard({ profile, name, phone, wa, onBook, onContact, reviewsCount, rating, servicios }) {
  const priceFrom = servicios?.[0]?.precio || servicios?.[0]?.price;
  return (
    <Box sx={{
      position: { md: 'sticky' }, top: { md: 100 },
      border: `1px solid ${BORDER}`, borderRadius: '16px',
      p: 3, bgcolor: '#fff',
      boxShadow: '0 4px 24px rgba(15,42,74,0.06)',
    }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 500, color: NAVY }}>
          {priceFrom ? `$${Number(priceFrom).toLocaleString('es-CO')}` : 'Consulta precio'}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>
          {priceFrom ? 'desde / consulta' : 'por WhatsApp'}
        </Typography>
      </Stack>
      {rating > 0 && (
        <Typography sx={{ fontSize: '0.75rem', color: MUTED, mb: 2 }}>
          <Star sx={{ color: '#f59e0b', fontSize: 12, verticalAlign: '-2px', mr: 0.25 }} />
          {rating.toFixed(1)} · {reviewsCount} reseñas
        </Typography>
      )}
      {!rating && <Box sx={{ mb: 2 }} />}

      <Button fullWidth variant="contained" onClick={onBook}
        startIcon={<CalendarMonth />}
        sx={{
          background: NAVY, color: '#fff',
          textTransform: 'none', fontWeight: 600, fontSize: '1rem',
          py: 1.5, borderRadius: '12px', mb: 1.25,
          '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
        }}>
        Reservar consulta
      </Button>
      <Typography sx={{ fontSize: '0.75rem', color: MUTED, textAlign: 'center', mb: 2 }}>
        Confirmación en menos de 2 horas · No se cobra ahora
      </Typography>

      <Stack direction="row" spacing={1}>
        {wa && (
          <Button
            fullWidth
            component="a"
            href={wa}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackDirectoryWhatsAppClick(profile?.id)}
            startIcon={<WhatsApp />}
            sx={{
              border: '1px solid #15803d', color: '#15803d',
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
              py: 1.1, borderRadius: '10px',
              '&:hover': { bgcolor: '#ecfdf5' },
            }}>
            WhatsApp
          </Button>
        )}
        {phone && (
          <Button
            fullWidth
            component="a"
            href={`tel:${phone}`}
            onClick={() => trackDirectoryCallClick(profile?.id)}
            startIcon={<Phone />}
            sx={{
              border: `1px solid ${NAVY}`, color: NAVY,
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
              py: 1.1, borderRadius: '10px',
              '&:hover': { bgcolor: '#eef2f7' },
            }}>
            Llamar
          </Button>
        )}
      </Stack>

      {/* Trust indicator */}
      <Box sx={{
        mt: 2.5, pt: 2.5, borderTop: `1px solid ${BORDER}`,
        display: 'flex', gap: 1.25, alignItems: 'center',
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: '#15803d', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Verified sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: NAVY }}>Profesional verificado</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>OírConecta valida credenciales</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Página principal ──────────────────────────────────────
export default function DirectorioProfesionalPageV2() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchDirectoryProfilePublic(profileId);
    const fromApi = data?.data;
    const fallback = DEMO_PROFILE_MAP[profileId] || null;
    setLoading(false);
    if (fromApi) return setProfile(fromApi);
    if (fallback) return setProfile(fallback);
    setError(err || 'No se pudo cargar la ficha.');
    setProfile(null);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!profileId) return;
    trackEntityEvent('profile_view_v2', { entityType: 'DirectoryProfile', entityId: profileId });
  }, [profileId]);

  const name = profile ? directoryPublicDisplayName(profile) : '';
  const initials = profile ? (directoryInitials(profile) || 'P').toUpperCase() : '';
  const city = directoryPrimaryCity(profile?.workplaces) || '';
  const phone = directoryPrimaryPhonePublic(profile);
  const wa = waMeHrefFromPhone(phone);
  const bio = profile ? directoryProfileBio(profile) : '';
  const professional = profile?.profesion || '';
  const yearsExp = profile?.anosExperiencia;
  const rating = Number(profile?.ratingAvg || 0);
  const reviewsCount = Number(profile?.reviewsCount || 0);
  const photoUrls = Array.isArray(profile?.photoUrls) ? profile.photoUrls.filter(Boolean) : [];
  const servicios = Array.isArray(profile?.servicios) ? profile.servicios : [];
  const studies = Array.isArray(profile?.studies) ? profile.studies : [];
  const direccion = profile?.direccionPublica?.trim();

  const sections = useMemo(() => {
    const s = [{ id: 'sobre', label: 'Sobre mí' }];
    if (studies.length || professional || yearsExp) s.push({ id: 'credenciales', label: 'Credenciales' });
    if (servicios.length > 0) s.push({ id: 'servicios', label: 'Servicios' });
    if (reviewsCount > 0) s.push({ id: 'resenas', label: `Reseñas · ${reviewsCount}` });
    if (direccion || phone) s.push({ id: 'ubicacion', label: 'Contacto' });
    return s;
  }, [studies.length, professional, yearsExp, servicios.length, reviewsCount, direccion, phone]);

  const quote = useMemo(() => {
    // Si el profesional no tiene bio larga, usamos una quote editorial genérica pero cálida
    if (bio && bio.length > 120) {
      return { title: 'Cada consulta es única', text: bio.slice(0, 140).trim() + (bio.length > 140 ? '…' : '') };
    }
    return { title: 'Cuidado personalizado, resultados reales', text: null };
  }, [bio]);

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ py: 12, textAlign: 'center' }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
        <Footer />
      </>
    );
  }

  if (error && !profile) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
        <Footer />
      </>
    );
  }

  const handleBook = () => setBookingOpen(true);
  const handleContact = () => setContactOpen(true);

  return (
    <Box sx={{ bgcolor: '#fff' }}>
      <Helmet>
        <title>{name} · Directorio OírConecta</title>
        <meta name="description" content={bio?.slice(0, 160) || `${professional} en ${city}. Agenda tu consulta en OírConecta.`} />
      </Helmet>

      <Header />

      <BannerCover
        profile={profile} name={name} city={city}
        professional={professional} initials={initials}
        rating={rating} reviewsCount={reviewsCount} yearsExp={yearsExp}
      />

      <StickySubNav sections={sections} name={name} rating={rating} onBook={handleBook} />

      <SecondaryPhotos photoUrls={photoUrls} />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{
          display: 'grid', gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: '1fr', md: '1.55fr 1fr' },
          alignItems: 'start',
        }}>
          <Box>
            <AboutSection name={name} initials={initials} bio={bio} quote={quote} />
            <CredentialsSection studies={studies} professional={professional} yearsExp={yearsExp} />
            <ServiciosSection servicios={servicios} />
            <ContactCTA phone={phone} wa={wa} direccion={direccion} onBook={handleBook} name={name} city={city} />
          </Box>
          <Box>
            <StickyBookingCard
              profile={profile} name={name} phone={phone} wa={wa}
              onBook={handleBook} onContact={handleContact}
              reviewsCount={reviewsCount} rating={rating} servicios={servicios}
            />
          </Box>
        </Box>
      </Container>

      {/* CTA final full-width */}
      <Box sx={{
        borderTop: `1px solid ${BORDER}`,
        py: { xs: 5, md: 8 },
        textAlign: 'center',
        bgcolor: '#fafbfc',
      }}>
        <Container maxWidth="md">
          {editorialTitle('¿Listo para dar el siguiente paso?', '2rem')}
          <Typography sx={{ fontSize: '1rem', color: MUTED, mt: 1.5, mb: 3 }}>
            Agenda hoy con {name} · Confirmación rápida
          </Typography>
          <Button variant="contained" onClick={handleBook}
            startIcon={<CalendarMonth />}
            sx={{
              background: NAVY, color: '#fff',
              textTransform: 'none', fontWeight: 600, fontSize: '1rem',
              px: 4, py: 1.5, borderRadius: '12px',
              '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
            }}>
            Reservar consulta
          </Button>
        </Container>
      </Box>

      <Footer />

      <ContactoProfesionalDialog
        open={contactOpen} onClose={() => setContactOpen(false)}
        profileId={profileId} profesionalNombre={name}
      />
      <AgendarConProfesionalDialog
        open={bookingOpen} onClose={() => setBookingOpen(false)}
        profileId={profileId} profesionalNombre={name}
      />
      <AgenteIAFloatingChat profileId={profileId} profesionalNombre={name} />
    </Box>
  );
}
