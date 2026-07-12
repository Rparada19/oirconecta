/**
 * F5.7b — Rediseño ficha profesional pública (versión landing Airbnb-style).
 *
 * Modo demo: `?demo=1` rellena los campos vacíos con datos plausibles (IA)
 * para pre-visualizar cómo se verá la ficha 100% completa.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Chip, CircularProgress, Alert, IconButton,
  Container, Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  TextField,
} from '@mui/material';
import {
  Verified, LocationOn, WhatsApp, Phone, CalendarMonth,
  Share as ShareIcon, FavoriteBorder, Star, ExpandMore,
  MedicalServicesOutlined, WorkspacePremiumOutlined, HeadphonesOutlined,
  FormatQuote, EmojiEventsOutlined, AccessTime, CheckCircleOutline,
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
  directoryProfileBio,
  waMeHrefFromPhone,
} from '../utils/directoryPresentation';
import { DEMO_PROFILE_MAP } from '../data/directoryDemoData';

// ─── Design tokens ────────────────────────────────────────────
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

const PLACEHOLDER_GRADIENTS = [
  ['#dbeafe', '#eff6ff', '#1e40af'],
  ['#dcfce7', '#ecfdf5', '#14532d'],
  ['#fef3c7', '#fef9c3', '#78350f'],
  ['#f3e8ff', '#faf5ff', '#6b21a8'],
  ['#fee2e2', '#fef2f2', '#991b1b'],
];

// Marcas comunes de audífonos en Colombia
const BRAND_COLORS = {
  Widex:    { bg: '#fef3c7', ink: '#78350f' },
  Phonak:   { bg: '#e0e7ff', ink: '#3730a3' },
  Signia:   { bg: '#fee2e2', ink: '#991b1b' },
  Oticon:   { bg: '#dcfce7', ink: '#14532d' },
  Resound:  { bg: '#dbeafe', ink: '#1e40af' },
  Starkey:  { bg: '#fce7f3', ink: '#9d174d' },
  Bernafon: { bg: '#f3e8ff', ink: '#6b21a8' },
  Unitron:  { bg: '#e0f2fe', ink: '#075985' },
};

// ─── DEMO DATA — se aplica cuando ?demo=1 ─────────────────────
const DEMO_DATA = {
  bio: 'Otorrinolaringóloga con más de 12 años acompañando personas de todas las edades a recuperar y cuidar su audición. Formada en la Universidad Nacional con fellowship en audiología pediátrica en el Hospital de la Misericordia, ha adaptado más de 400 procesos de audífonos con seguimiento personalizado en Bogotá. Su consultorio en Chapinero es un espacio pensado para que llegues con confianza y salgas con respuestas claras.',
  quote: 'Cada persona escucha distinto. Mi trabajo es encontrar la respuesta que le corresponde a la suya.',
  anosExperiencia: 12,
  direccionPublica: 'Cra. 13 # 85-32, Consultorio 402, Chapinero',
  telefonoPublico: '3125678901',
  whatsappPublico: '573125678901',
  studies: [
    { institucion: 'Universidad Nacional de Colombia', titulo: 'Especialista en Otorrinolaringología', ano: 2013 },
    { institucion: 'Hospital de la Misericordia', titulo: 'Fellowship en Audiología Pediátrica', ano: 2015 },
    { institucion: 'Widex Academy Berlín', titulo: 'Certificación en adaptación protésica', ano: 2019 },
    { institucion: 'Colegio Médico Colombiano', titulo: 'RETHUS RM-118547 (vigente)', ano: 2013 },
  ],
  servicios: [
    { nombre: 'Valoración auditiva completa', descripcion: 'Audiometría tonal, logoaudiometría e impedanciometría con diagnóstico en la misma sesión.', precio: 180000, duracion: '45 min' },
    { nombre: 'Adaptación de audífonos', descripcion: 'Prueba, ajuste y seguimiento por 90 días con múltiples marcas sin sesgo comercial.', precio: 350000, duracion: '3 sesiones' },
    { nombre: 'Screening auditivo infantil', descripcion: 'Emisiones otoacústicas y PEATC en ambiente amigable para bebés y niños.', precio: 220000, duracion: '30 min' },
    { nombre: 'Manejo de tinnitus', descripcion: 'Terapia sonora y rehabilitación auditiva progresiva.', precio: 160000, duracion: '45 min' },
    { nombre: 'Limpieza y cerumen', descripcion: 'Extracción segura de cerumen con microscopio.', precio: 120000, duracion: '20 min' },
    { nombre: 'Segunda opinión', descripcion: 'Revisión objetiva de diagnósticos o recomendaciones previas.', precio: 150000, duracion: '30 min' },
  ],
  marcas: ['Widex', 'Phonak', 'Signia', 'Oticon', 'Resound', 'Starkey'],
  ratingAvg: 4.9,
  reviewsCount: 47,
  ratingBreakdown: {
    puntualidad: 4.9,
    trato: 5.0,
    diagnostico: 4.8,
    seguimiento: 4.9,
  },
  reviews: [
    { nombre: 'María Camila R.', iniciales: 'MC', bg: '#f3e8ff', ink: '#6b21a8', fecha: 'Marzo 2026', motivo: 'Adaptación audífonos', rating: 5, texto: 'Fue muy amable con mi mamá que tiene 78. Le explicó todo con calma, no la apuró y le probó tres opciones. Nos vino a hacer el ajuste en la casa la segunda vez.' },
    { nombre: 'Juan Pablo M.', iniciales: 'JP', bg: '#dbeafe', ink: '#1e40af', fecha: 'Febrero 2026', motivo: 'Valoración inicial', rating: 5, texto: 'Llevaba años con zumbido y pensé que era normal. Ella me hizo entender qué me estaba pasando y ahora sigo su terapia. Cada control noto mejora.' },
    { nombre: 'Sofía L.', iniciales: 'SL', bg: '#dcfce7', ink: '#14532d', fecha: 'Enero 2026', motivo: 'Screening infantil', rating: 5, texto: 'Excelente trato con mi hija de 4 años. Convirtió el examen en un juego y logró resultados muy precisos. Muy recomendada para niños.' },
    { nombre: 'Carlos E.', iniciales: 'CE', bg: '#fef3c7', ink: '#78350f', fecha: 'Diciembre 2025', motivo: 'Segunda opinión', rating: 5, texto: 'Otro especialista me había dicho que necesitaba cirugía. Angélica me revisó, hizo estudios adicionales y me dio un tratamiento alternativo que funcionó.' },
  ],
  faqs: [
    { q: '¿Cuánto tiempo dura la primera valoración?', a: 'La valoración inicial dura 45 minutos e incluye audiometría, logoaudiometría e impedanciometría. Recibirás el diagnóstico y las recomendaciones en esa misma cita.' },
    { q: '¿Atienden pacientes de EPS?', a: 'Atendemos particular y algunas medicinas prepagadas. Consulta al agendar si tu plan aplica.' },
    { q: '¿Puedo llevar audífonos que compré en otra ciudad?', a: 'Sí, revisamos y ajustamos audífonos de las principales marcas (Widex, Phonak, Signia, Oticon, entre otras). Traer garantía y comprobante.' },
    { q: '¿Hay parqueadero cerca?', a: 'El edificio tiene parqueadero para visitantes desde $6.000/hora. Estamos a 2 cuadras de la estación TransMilenio Calle 85.' },
    { q: '¿Los audífonos tienen garantía?', a: 'Sí, garantía del fabricante entre 2 y 3 años dependiendo del modelo, más 90 días de ajustes sin costo con nosotros.' },
  ],
  horariosSemana: [
    { dia: 'Lun-Vie', horas: '8:00 am - 6:00 pm' },
    { dia: 'Sábados', horas: '8:00 am - 1:00 pm' },
    { dia: 'Domingos', horas: 'Cerrado' },
  ],
  proximosSlots: [
    { fecha: 'Mié 8', hora: '10:30 am' },
    { fecha: 'Vie 10', hora: '2:00 pm' },
    { fecha: 'Sáb 11', hora: '9:00 am' },
    { fecha: 'Lun 13', hora: '11:00 am' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Extrae el src del iframe pegado por el usuario y devuelve un <iframe>
 * canónico solo con los atributos seguros. Si el input es una URL sin
 * envoltorio <iframe>, la usa directamente como src. Evita ejecución de
 * scripts embebidos en la copia del usuario.
 */
function sanitizeMapsEmbed(input) {
  if (!input) return '';
  const s = String(input).trim();
  const match = s.match(/<iframe[^>]*\ssrc="([^"]+)"/i) || s.match(/<iframe[^>]*\ssrc='([^']+)'/i);
  const src = match
    ? match[1]
    : /^https?:\/\//i.test(s) ? s : '';
  if (!src.includes('google.com/maps')) return '';
  return `<iframe src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
}

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

// ─── StickySubNav ─────────────────────────────────────────────
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
        {name?.split(' ').slice(0, 2).join(' ')}
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

// ─── BannerCover ──────────────────────────────────────────────
function BannerCover({ profile, name, city, professional, rating, reviewsCount, yearsExp }) {
  const bannerUrl = profile?.bannerUrl?.trim();
  const bgStyle = bannerUrl
    ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${NAVY} 0%, ${ACCENT} 55%, #a855f7 100%)` };

  return (
    <Box sx={{
      position: 'relative',
      // En móvil, respetar el aspect 16:6 recomendado (~2.67:1) para que la
      // foto del consultorio no salga recortada verticalmente. En desktop
      // priorizamos altura fija para la composición editorial.
      aspectRatio: { xs: bannerUrl ? '16 / 7' : undefined, md: 'unset' },
      height: { xs: bannerUrl ? 'auto' : 240, md: 460 },
      minHeight: { xs: 220, md: 460 },
      overflow: 'hidden',
      ...bgStyle,
    }}>
      {!bannerUrl && (
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.18), transparent 50%),
            radial-gradient(ellipse at 75% 60%, rgba(168,85,247,0.35), transparent 60%)`,
        }} />
      )}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(15,42,74,0.28) 0%, transparent 30%, rgba(15,42,74,0.65) 100%)',
      }} />

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

// ─── SecondaryPhotos ──────────────────────────────────────────
function SecondaryPhotos({ photoUrls }) {
  const hasPhotos = Array.isArray(photoUrls) && photoUrls.length > 0;
  const slots = hasPhotos ? photoUrls.slice(0, 4) : [];
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

// ─── AboutSection ─────────────────────────────────────────────
function AboutSection({ name, initials, bio, quote, fotoUrl, title }) {
  const heading = (title && title.trim())
    || (name && name.trim() ? `Conoce a ${name.trim().split(' ').slice(0, 2).join(' ')}` : 'Sobre este consultorio');
  return (
    <Box id="sobre" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 2.5 }}>
        {fotoUrl ? (
          <Box component="img" src={fotoUrl} alt={name || 'Foto de perfil'}
            sx={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                  border: `1px solid ${BORDER}` }} />
        ) : (
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...SERIF, fontSize: '1.4rem', fontWeight: 500,
          }}>{initials}</Box>
        )}
        <Box>
          {overline('Sobre la profesional')}
          {editorialTitle(heading, '1.4rem')}
        </Box>
      </Stack>
      <Typography sx={{ fontSize: '1rem', color: '#334155', lineHeight: 1.7, mb: 2 }}>
        {bio || `${name} es un profesional verificado en OírConecta. Solicita una consulta para conocer su enfoque, servicios y disponibilidad.`}
      </Typography>
      {quote && (
        <Box sx={{
          borderLeft: `3px solid ${NAVY}`, pl: 2.5, py: 0.5, mt: 2.5,
          ...SERIF, fontStyle: 'italic', fontSize: '1.15rem',
          color: NAVY, lineHeight: 1.5,
        }}>
          <FormatQuote sx={{ color: `${NAVY}44`, fontSize: 24, mr: 0.5, verticalAlign: '-4px' }} />
          {quote}
          <Typography sx={{
            display: 'block', mt: 1.25,
            fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
            fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: MUTED, fontWeight: 700,
          }}>— {name?.split(' ').slice(0, 2).join(' ')}</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── CredentialsSection ───────────────────────────────────────
function CredentialsSection({ studies, professional, yearsExp }) {
  const items = [];
  if (Array.isArray(studies)) {
    for (const s of studies.slice(0, 4)) {
      const [c1, c2, ink] = PLACEHOLDER_GRADIENTS[items.length % PLACEHOLDER_GRADIENTS.length];
      items.push({
        icon: WorkspacePremiumOutlined,
        tint: c1, ink,
        title: s.institucion || s.institution || s.titulo || 'Estudio',
        sub: [s.titulo, s.ano].filter(Boolean).join(' · '),
      });
    }
  }
  if (items.length === 0 && (professional || yearsExp)) {
    if (professional) items.push({
      icon: EmojiEventsOutlined, tint: '#ecfdf5', ink: '#14532d',
      title: 'Registro RETHUS', sub: 'Profesional verificado por OírConecta',
    });
    if (yearsExp) items.push({
      icon: HeadphonesOutlined, tint: '#fef3c7', ink: '#78350f',
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

// ─── ServiciosSection ─────────────────────────────────────────
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
                  <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>
                    {duracion && <><AccessTime sx={{ fontSize: 12, verticalAlign: '-2px', mr: 0.5 }} />{duracion}</>}
                  </Typography>
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

// ─── MarcasSection ────────────────────────────────────────────
function MarcasSection({ marcas }) {
  const list = Array.isArray(marcas) ? marcas.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <Box id="marcas" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Marcas que atiendo')}
      <Box sx={{ mt: 1, mb: 2.5 }}>
        {editorialTitle('Trabajo con las mejores marcas del mundo', '1.7rem')}
      </Box>
      <Typography sx={{ fontSize: '0.95rem', color: MUTED, mb: 3, maxWidth: 620 }}>
        Sin sesgo comercial: comparo y recomiendo la opción que mejor se adapta a tu pérdida auditiva, presupuesto y estilo de vida.
      </Typography>
      <Box sx={{
        display: 'grid', gap: 1.25,
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
      }}>
        {list.slice(0, 8).map((marca, i) => {
          const brand = BRAND_COLORS[marca] || { bg: '#f1f5f9', ink: '#475569' };
          return (
            <Box key={marca + i} sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              p: 2, border: `1px solid ${BORDER}`, borderRadius: '12px',
              bgcolor: '#fff', minHeight: 90,
              transition: 'all 0.15s',
              '&:hover': { borderColor: brand.ink, transform: 'translateY(-2px)' },
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '10px',
                bgcolor: brand.bg, color: brand.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600,
              }}>
                {marca[0]}
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: NAVY }}>{marca}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── ReseñasSection ───────────────────────────────────────────
function ResenasSection({ rating, reviewsCount, breakdown, reviews, profileId }) {
  const list = Array.isArray(reviews) ? reviews : [];
  // Cuando aún no hay reseñas, mostramos un CTA en vez de ocultar la sección
  // completa. Así el paciente sabe que puede dejar una y el profesional ve
  // el placeholder en su vista pública.
  if (reviewsCount === 0 || list.length === 0) {
    return (
      <Box id="resenas" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
        {overline('Reseñas de pacientes')}
        <Box sx={{ mt: 1.5, mb: 2 }}>
          {editorialTitle('Aún no hay reseñas verificadas', '1.4rem')}
        </Box>
        <Typography sx={{ fontSize: '0.95rem', color: MUTED, mb: 2 }}>
          ¿Ya tuviste una consulta? Comparte tu experiencia para ayudar a otros pacientes.
        </Typography>
        {profileId && (
          <Button
            component="a"
            href={`/directorio/profesional/${profileId}/reseña`}
            variant="outlined"
            sx={{
              border: `1px solid ${NAVY}`, color: NAVY,
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
              px: 2, py: 0.75, borderRadius: '10px',
              '&:hover': { bgcolor: '#eef2f7' },
            }}
          >
            Escribir una reseña
          </Button>
        )}
      </Box>
    );
  }

  const rubros = [
    { key: 'puntualidad', label: 'Puntualidad' },
    { key: 'trato', label: 'Trato humano' },
    { key: 'diagnostico', label: 'Diagnóstico' },
    { key: 'seguimiento', label: 'Seguimiento' },
  ];

  return (
    <Box id="resenas" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2.5 }}>
        <Box>
          {overline('Reseñas de pacientes')}
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Star sx={{ color: '#f59e0b', fontSize: 26 }} />
              <Typography sx={{ ...SERIF, fontWeight: 600, fontSize: '1.6rem', color: NAVY }}>
                {rating.toFixed(1)}
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: MUTED }}>· {reviewsCount} reseñas verificadas</Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>

      {breakdown && (
        <Box sx={{
          display: 'grid', gap: 2.5,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          py: 2.5, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, mb: 3,
        }}>
          {rubros.map((r) => {
            const v = breakdown[r.key];
            return (
              <Box key={r.key}>
                <Typography sx={{ fontSize: '0.85rem', color: MUTED, mb: 0.5 }}>{r.label}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LinearProgress variant="determinate" value={(v / 5) * 100}
                    sx={{
                      flex: 1, height: 4, borderRadius: 2, bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': { bgcolor: NAVY },
                    }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: NAVY }}>{v.toFixed(1)}</Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{
        display: 'grid', gap: 2.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
      }}>
        {list.slice(0, 4).map((r, i) => (
          <Box key={i}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: r.bg, color: r.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: '0.85rem',
              }}>{r.iniciales}</Box>
              <Box>
                <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.9rem' }}>{r.nombre}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>{r.fecha} · {r.motivo}</Typography>
              </Box>
            </Stack>
            <Box sx={{ color: '#f59e0b', fontSize: '0.85rem', mb: 0.75 }}>
              {'★'.repeat(r.rating)}
            </Box>
            <Typography sx={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.55 }}>
              {r.texto}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────
function FAQSection({ faqs }) {
  const list = Array.isArray(faqs) ? faqs : [];
  if (list.length === 0) return null;

  return (
    <Box id="faq" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Preguntas frecuentes')}
      <Box sx={{ mt: 1, mb: 2.5 }}>
        {editorialTitle('Antes de agendar, tal vez te preguntas', '1.5rem')}
      </Box>
      <Box>
        {list.slice(0, 8).map((f, i) => (
          <Accordion key={i} elevation={0} disableGutters
            sx={{
              border: 'none', borderBottom: `1px solid ${BORDER}`,
              '&:before': { display: 'none' },
              '&:last-child': { borderBottom: 'none' },
            }}>
            <AccordionSummary expandIcon={<ExpandMore />}
              sx={{
                px: 0, py: 1,
                '& .MuiAccordionSummary-content': { my: 0 },
              }}>
              <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.95rem' }}>
                {f.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pb: 2 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                {f.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}

// ─── Formulario de consulta ───────────────────────────────────
// POST /api/directory/profiles/:profileId/inquiry — llega a la bandeja
// "Consultas recibidas" del profesional.
function ContactoFormularioSection({ profileId, name }) {
  const [form, setForm] = React.useState({ nombre: '', telefono: '', email: '', mensaje: '' });
  const [busy, setBusy] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [err, setErr] = React.useState('');

  if (!profileId) return null;

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(''); setOk(false);
    try {
      const base = (typeof window !== 'undefined' && window.location.hostname.endsWith('oirconecta.com'))
        ? 'https://oirconecta-api.onrender.com' : '';
      const r = await fetch(`${base}/api/directory/profiles/${profileId}/inquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.success) throw new Error(j?.error || 'No se pudo enviar');
      setOk(true);
      setForm({ nombre: '', telefono: '', email: '', mensaje: '' });
    } catch (e2) {
      setErr(e2.message || 'Error');
    } finally { setBusy(false); }
  };

  return (
    <Box id="contacto" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Escríbele directamente')}
      <Box sx={{ mt: 1, mb: 2 }}>
        {editorialTitle(name ? `Envía un mensaje a ${name.split(' ').slice(0, 2).join(' ')}` : 'Envía un mensaje', '1.4rem')}
      </Box>
      <Typography sx={{ fontSize: '0.9rem', color: MUTED, mb: 2 }}>
        Cuéntale brevemente qué necesitas. Verás la respuesta en el correo que dejes.
      </Typography>
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required label="Tu nombre" value={form.nombre} onChange={set('nombre')} size="small" />
        <TextField required type="email" label="Correo" value={form.email} onChange={set('email')} size="small" />
        <TextField label="Teléfono / WhatsApp (opcional)" value={form.telefono} onChange={set('telefono')} size="small" sx={{ gridColumn: { sm: '1 / -1' } }} />
        <TextField required label="Mensaje" value={form.mensaje} onChange={set('mensaje')} multiline rows={4} sx={{ gridColumn: { sm: '1 / -1' } }} />
        <Box sx={{ gridColumn: { sm: '1 / -1' }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button type="submit" disabled={busy || !form.nombre || !form.email || !form.mensaje}
            variant="contained"
            sx={{ background: NAVY, textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5, py: 0.85,
                  '&:hover': { background: NAVY, filter: 'brightness(0.92)' } }}>
            {busy ? 'Enviando…' : 'Enviar mensaje'}
          </Button>
          {ok && <Alert severity="success" sx={{ py: 0 }}>Tu mensaje se envió. Te contactamos pronto.</Alert>}
          {err && <Alert severity="error" sx={{ py: 0 }}>{err}</Alert>}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Ubicación / Contacto ─────────────────────────────────────
function UbicacionSection({ phone, direccion, city, horariosSemana, mapsEmbed }) {
  if (!phone && !direccion && !city && (!horariosSemana || horariosSemana.length === 0)) return null;
  return (
    <Box id="ubicacion" sx={{ borderBottom: `1px solid ${BORDER}`, pb: 4, mb: 4 }}>
      {overline('Ubicación y horarios')}
      <Box sx={{ mt: 1, mb: 2.5 }}>
        {editorialTitle('Cómo llegar a mi consultorio', '1.5rem')}
      </Box>
      <Box sx={{
        display: 'grid', gap: 2.5,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}>
        <Box>
          <Stack spacing={1.25}>
            {direccion && (
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <LocationOn sx={{ color: ACCENT, mt: 0.25 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.95rem' }}>{direccion}</Typography>
                  {city && <Typography sx={{ fontSize: '0.85rem', color: MUTED }}>{city}, Colombia</Typography>}
                </Box>
              </Stack>
            )}
            {phone && (
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Phone sx={{ color: ACCENT, mt: 0.25 }} />
                <Typography sx={{ color: NAVY, fontSize: '0.95rem' }}>{phone}</Typography>
              </Stack>
            )}
            {Array.isArray(horariosSemana) && horariosSemana.length > 0 && (
              <Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                  Horarios
                </Typography>
                <Stack spacing={0.5}>
                  {horariosSemana.map((h, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" sx={{ fontSize: '0.9rem' }}>
                      <Typography sx={{ color: NAVY, fontWeight: 500 }}>{h.dia}</Typography>
                      <Typography sx={{ color: MUTED }}>{h.horas}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
        <Box sx={{
          height: 260, borderRadius: '12px', overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          background: mapsEmbed ? '#fff' : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1e40af', fontSize: '0.85rem', fontWeight: 500,
          '& iframe': { width: '100%', height: '100%', border: 0, display: 'block' },
        }}
        // El usuario pega el iframe completo desde Google Maps → Compartir → Insertar mapa.
        {...(mapsEmbed
          ? { dangerouslySetInnerHTML: { __html: sanitizeMapsEmbed(mapsEmbed) } }
          : {})}
        >
          {!mapsEmbed && 'Vista de mapa'}
        </Box>
      </Box>
    </Box>
  );
}

// ─── StickyBookingCard ────────────────────────────────────────
function StickyBookingCard({ profile, name, phone, wa, onBook, reviewsCount, rating, servicios, proximosSlots }) {
  const priceFrom = servicios?.[0]?.precio || servicios?.[0]?.price;
  const hasSlots = Array.isArray(proximosSlots) && proximosSlots.length > 0;

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
      {rating > 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: MUTED, mb: 2 }}>
          <Star sx={{ color: '#f59e0b', fontSize: 12, verticalAlign: '-2px', mr: 0.25 }} />
          {rating.toFixed(1)} · {reviewsCount} reseñas
        </Typography>
      ) : (
        <Box sx={{ mb: 2 }} />
      )}

      {hasSlots && (
        <Box sx={{ mb: 2, p: 1.5, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
          <Typography sx={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
            Próximos horarios
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
            {proximosSlots.slice(0, 4).map((s, i) => (
              <Box key={i} onClick={onBook}
                sx={{
                  textAlign: 'center', p: 1, borderRadius: '8px',
                  border: i === 0 ? `2px solid ${NAVY}` : `1px solid ${BORDER}`,
                  bgcolor: i === 0 ? NAVY : '#fff',
                  color: i === 0 ? '#fff' : '#475569',
                  fontSize: '0.78rem', fontWeight: i === 0 ? 600 : 500,
                  cursor: 'pointer',
                  '&:hover': { borderColor: NAVY },
                }}>
                {s.fecha} · {s.hora}
              </Box>
            ))}
          </Box>
        </Box>
      )}

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
            fullWidth component="a" href={wa}
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
            fullWidth component="a" href={`tel:${phone}`}
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
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: NAVY }}>Profesional verificada</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>OírConecta valida credenciales</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function DirectorioProfesionalPageV2() {
  const { profileId } = useParams();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [realReviews, setRealReviews] = useState([]);

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

  // F6 — cargar reseñas reales del perfil (APPROVED)
  useEffect(() => {
    if (!profile?.id || !(profile.reviewsCount > 0)) return;
    const url = `${(typeof window !== 'undefined' && window.location.hostname.endsWith('oirconecta.com'))
      ? 'https://oirconecta-api.onrender.com' : ''}/api/directory/profiles/${profile.id}/reviews?limit=6`;
    fetch(url).then((r) => r.json()).then((j) => {
      if (j?.success && Array.isArray(j.data)) setRealReviews(j.data);
    }).catch(() => {});
  }, [profile?.id, profile?.reviewsCount]);

  // ── Merge demo con real ──
  // Solo rellena campos vacíos, nunca sobreescribe datos reales.
  const p = useMemo(() => {
    if (!profile) return null;
    if (!isDemo) return profile;
    const merged = { ...profile };
    if (!merged.anosExperiencia)     merged.anosExperiencia = DEMO_DATA.anosExperiencia;
    if (!merged.direccionPublica)    merged.direccionPublica = DEMO_DATA.direccionPublica;
    if (!merged.telefonoPublico)     merged.telefonoPublico = DEMO_DATA.telefonoPublico;
    if (!merged.whatsappPublico)     merged.whatsappPublico = DEMO_DATA.whatsappPublico;
    if (!merged.descripcion)         merged.descripcion = DEMO_DATA.bio;
    if (!merged.ratingAvg)           merged.ratingAvg = DEMO_DATA.ratingAvg;
    if (!merged.reviewsCount)        merged.reviewsCount = DEMO_DATA.reviewsCount;
    if (!Array.isArray(merged.studies) || merged.studies.length === 0)   merged.studies = DEMO_DATA.studies;
    if (!Array.isArray(merged.servicios) || merged.servicios.length === 0) merged.servicios = DEMO_DATA.servicios;
    return merged;
  }, [profile, isDemo]);

  const name = p ? directoryPublicDisplayName(p) : '';
  const initials = p ? (directoryInitials(p) || 'P').toUpperCase() : '';
  const city = directoryPrimaryCity(p?.workplaces) || (isDemo ? 'Bogotá' : '');
  const phone = directoryPrimaryPhonePublic(p) || (isDemo ? DEMO_DATA.telefonoPublico : null);
  const wa = waMeHrefFromPhone(phone);
  const bio = p ? directoryProfileBio(p) : '';
  const professional = p?.profesion || '';
  const yearsExp = p?.anosExperiencia;
  const rating = Number(p?.ratingAvg || 0);
  const reviewsCount = Number(p?.reviewsCount || 0);
  const photoUrls = Array.isArray(p?.photoUrls) ? p.photoUrls.filter(Boolean) : [];
  const servicios = Array.isArray(p?.servicios) ? p.servicios : [];
  const studies = Array.isArray(p?.studies) ? p.studies : [];
  const direccion = p?.direccionPublica?.trim();

  // ── Demo-only extras ──
  const demoQuote = isDemo ? DEMO_DATA.quote : null;
  const marcas = useMemo(() => {
    if (Array.isArray(p?.marcasAudifonos) && p.marcasAudifonos.length > 0) return p.marcasAudifonos;
    if (isDemo) return DEMO_DATA.marcas;
    return [];
  }, [p, isDemo]);
  const breakdown = isDemo ? DEMO_DATA.ratingBreakdown : null;
  // Reales primero. Si no hay y estamos en demo, mostramos las plausibles.
  const reviews = useMemo(() => {
    if (realReviews.length > 0) {
      const PALETTES = [
        { bg: '#f3e8ff', ink: '#6b21a8' },
        { bg: '#dbeafe', ink: '#1e40af' },
        { bg: '#dcfce7', ink: '#14532d' },
        { bg: '#fef3c7', ink: '#78350f' },
        { bg: '#fce7f3', ink: '#9d174d' },
        { bg: '#e0f2fe', ink: '#075985' },
      ];
      return realReviews.map((r, i) => {
        const nombre = r.authorName || 'Paciente';
        const iniciales = nombre.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
        const palette = PALETTES[i % PALETTES.length];
        return {
          nombre,
          iniciales,
          bg: palette.bg, ink: palette.ink,
          fecha: r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }) : '',
          motivo: '',
          rating: r.rating,
          texto: r.comment || '',
        };
      });
    }
    return isDemo ? DEMO_DATA.reviews : [];
  }, [realReviews, isDemo]);
  const faqs = useMemo(() => {
    if (Array.isArray(p?.qaList) && p.qaList.length > 0) return p.qaList;
    if (isDemo) return DEMO_DATA.faqs;
    return [];
  }, [p, isDemo]);
  const horariosSemana = isDemo ? DEMO_DATA.horariosSemana : [];
  const proximosSlots = isDemo ? DEMO_DATA.proximosSlots : [];

  const sections = useMemo(() => {
    const s = [{ id: 'sobre', label: 'Sobre mí' }];
    if (studies.length || professional || yearsExp) s.push({ id: 'credenciales', label: 'Credenciales' });
    if (servicios.length > 0) s.push({ id: 'servicios', label: 'Servicios' });
    if (marcas.length > 0) s.push({ id: 'marcas', label: 'Marcas' });
    if (reviewsCount > 0) s.push({ id: 'resenas', label: `Reseñas · ${reviewsCount}` });
    if (faqs.length > 0) s.push({ id: 'faq', label: 'Preguntas' });
    if (direccion || phone || horariosSemana.length > 0) s.push({ id: 'ubicacion', label: 'Ubicación' });
    return s;
  }, [studies.length, professional, yearsExp, servicios.length, marcas.length, reviewsCount, faqs.length, direccion, phone, horariosSemana.length]);

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

  if (error && !p) {
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

      {isDemo && (
        <Box sx={{ bgcolor: '#fef3c7', borderBottom: '1px solid #fde68a', px: 3, py: 1.25, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#78350f' }}>
            <strong>Modo demo:</strong> los campos vacíos están rellenos con datos ficticios para preview. Estos datos NO se guardan.
          </Typography>
        </Box>
      )}

      <BannerCover
        profile={p} name={name} city={city}
        professional={professional}
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
            <AboutSection name={name} initials={initials} bio={bio} quote={demoQuote}
              fotoUrl={p?.fotoPerfilUrl}
              title={p?.titulosSecciones?.sobre || p?.nombreConsultorio} />
            <CredentialsSection studies={studies} professional={professional} yearsExp={yearsExp} />
            <ServiciosSection servicios={servicios} />
            <MarcasSection marcas={marcas} />
            <ResenasSection rating={rating} reviewsCount={reviewsCount} breakdown={breakdown} reviews={reviews}
              profileId={p?.id} />
            <FAQSection faqs={faqs} />
            <UbicacionSection phone={phone} direccion={direccion} city={city} horariosSemana={horariosSemana}
              mapsEmbed={p?.googleMapsEmbedUrl} />
            <ContactoFormularioSection profileId={p?.id} name={name} />
          </Box>
          <Box>
            <StickyBookingCard
              profile={p} name={name} phone={phone} wa={wa}
              onBook={handleBook}
              reviewsCount={reviewsCount} rating={rating}
              servicios={servicios} proximosSlots={proximosSlots}
            />
          </Box>
        </Box>
      </Container>

      {/* CTA final */}
      <Box sx={{
        borderTop: `1px solid ${BORDER}`,
        py: { xs: 5, md: 8 }, textAlign: 'center', bgcolor: '#fafbfc',
      }}>
        <Container maxWidth="md">
          {editorialTitle('¿Listo para dar el siguiente paso?', '2rem')}
          <Typography sx={{ fontSize: '1rem', color: MUTED, mt: 1.5, mb: 3 }}>
            Agenda hoy con {name?.split(' ').slice(0, 2).join(' ')} · Confirmación rápida
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
