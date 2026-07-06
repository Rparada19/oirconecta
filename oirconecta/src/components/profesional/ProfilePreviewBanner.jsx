/**
 * F5.7a — Banner insistente cuando la ficha pública está incompleta.
 * Aparece en el dashboard del profesional si la completitud es < 60%.
 * Muestra vista previa "editorial" del look potencial + lista de faltantes + CTA.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack, LinearProgress } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';

const CHECKS = [
  { key: 'foto',      label: 'Foto de perfil',        icon: PhotoCameraOutlinedIcon,   test: (p) => !!(p?.fotoPerfilUrl || p?.foto),                          tabHint: 'perfil' },
  { key: 'servicios', label: 'Al menos 3 servicios',  icon: MedicalServicesOutlinedIcon, test: (p) => Array.isArray(p?.servicios) && p.servicios.length >= 3, tabHint: 'servicios' },
  { key: 'telefono',  label: 'Teléfono público',      icon: PhoneOutlinedIcon,         test: (p) => !!(p?.telefonoPublico || p?.whatsappPublico),             tabHint: 'contacto' },
  { key: 'direccion', label: 'Dirección del consultorio', icon: PlaceOutlinedIcon,     test: (p) => !!p?.direccionPublica,                                    tabHint: 'contacto' },
  { key: 'bio',       label: 'Historia / bio',        icon: ChatBubbleOutlineRoundedIcon, test: (p) => !!(p?.descripcion && p.descripcion.length > 80),       tabHint: 'perfil' },
  { key: 'anos',      label: 'Años de experiencia',   icon: StarBorderRoundedIcon,     test: (p) => !!p?.anosExperiencia,                                     tabHint: 'perfil' },
];

function computeCompleteness(profile) {
  const done = CHECKS.map((c) => ({ ...c, ok: !!c.test(profile) }));
  const pct = Math.round((done.filter((d) => d.ok).length / CHECKS.length) * 100);
  return { done, pct, missing: done.filter((d) => !d.ok) };
}

export default function ProfilePreviewBanner({ profile }) {
  const navigate = useNavigate();
  const { pct, missing } = useMemo(() => computeCompleteness(profile), [profile]);

  // Solo aparece cuando la ficha se ve pobre (bajo 60%)
  if (!profile || pct >= 60) return null;

  const nombre = profile?.account?.nombre?.split(' ')?.[0] || 'tu ficha';
  const top3Missing = missing.slice(0, 3);

  return (
    <Box sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '20px',
      background: '#fff',
      border: '1px solid #eef0f3',
      mb: 3,
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1.35fr 1fr' },
    }}>
      {/* Lado izquierdo: mensaje + CTA */}
      <Box sx={{ p: { xs: 3, md: 4.5 } }}>
        <Typography sx={{
          fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
          color: '#b45309', textTransform: 'uppercase', mb: 1,
        }}>
          Tu ficha pública · {pct}% completa
        </Typography>

        <Typography sx={{
          ...SERIF, fontWeight: 600, color: NAVY,
          fontSize: { xs: '1.7rem', md: '2.15rem' }, lineHeight: 1.08, mb: 1.5,
        }}>
          Tu ficha aún no se ve como una landing page profesional
        </Typography>

        <Typography sx={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.55, mb: 2, maxWidth: 480 }}>
          Los perfiles completos reciben hasta <strong style={{ color: NAVY }}>4× más visitas</strong> y agendan hasta 3× más citas. Complétala en 5 minutos:
        </Typography>

        {/* Lista de 3 faltantes destacadas */}
        <Stack spacing={1} sx={{ mb: 2.5 }}>
          {top3Missing.map((m) => {
            const Ico = m.icon;
            return (
              <Box key={m.key} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: 1.25, borderRadius: '10px',
                bgcolor: '#fef3c7',
                border: '1px solid #fde68a',
              }}>
                <Ico sx={{ color: '#b45309', fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.9rem', color: '#78350f', fontWeight: 600, flex: 1 }}>
                  Falta: {m.label}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => navigate('/portal-profesional/wizard')}
            sx={{
              background: NAVY, color: '#fff',
              textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
              px: 3, py: 1.25, borderRadius: '12px',
              '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
            }}
          >
            Completar mi ficha
          </Button>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Toma menos de 5 minutos
          </Typography>
        </Stack>
      </Box>

      {/* Lado derecho: preview visual de cómo se verá */}
      <Box sx={{
        display: { xs: 'none', md: 'block' },
        background: 'linear-gradient(135deg, #f7fafc 0%, #eef2f7 100%)',
        borderLeft: '1px solid #eef0f3',
        p: 3,
        position: 'relative',
      }}>
        <Typography sx={{
          fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.16em',
          color: '#94a3b8', textTransform: 'uppercase', mb: 1.25, textAlign: 'center',
        }}>
          Vista previa · así se ve
        </Typography>

        {/* Miniatura de la ficha estilo landing */}
        <Box sx={{
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid #e5e7eb', background: '#fff',
          boxShadow: '0 12px 32px rgba(15,42,74,0.10)',
          transform: 'perspective(1200px) rotateY(-3deg) rotateX(2deg)',
          transformOrigin: 'center',
        }}>
          {/* mini banner cover */}
          <Box sx={{
            height: 56,
            background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
            position: 'relative',
          }}>
            <Box sx={{
              position: 'absolute', bottom: -18, left: 14,
              width: 40, height: 40, borderRadius: '50%',
              bgcolor: '#fff', border: '3px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: ACCENT, fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>{(nombre[0] || 'P')}</Box>
          </Box>
          <Box sx={{ p: 1.5, pt: 3 }}>
            <Box sx={{ height: 6, width: '65%', bgcolor: '#e5e7eb', borderRadius: 3, mb: 0.75 }} />
            <Box sx={{ height: 4, width: '40%', bgcolor: '#f1f5f9', borderRadius: 2, mb: 1.25 }} />
            <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
              <Box sx={{ height: 5, width: 32, bgcolor: '#ecfdf5', borderRadius: 3 }} />
              <Box sx={{ height: 5, width: 28, bgcolor: '#eff6ff', borderRadius: 3 }} />
              <Box sx={{ height: 5, width: 34, bgcolor: '#fef3c7', borderRadius: 3 }} />
            </Stack>
            {/* galería mini */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 0.5, height: 44, mb: 1 }}>
              <Box sx={{ gridRow: 'span 2', background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', borderRadius: '4px' }} />
              <Box sx={{ background: 'linear-gradient(135deg, #fef3c7, #fef9c3)', borderRadius: '4px' }} />
              <Box sx={{ background: 'linear-gradient(135deg, #dcfce7, #ecfdf5)', borderRadius: '4px' }} />
            </Box>
            <Stack direction="row" spacing={0.75} justifyContent="flex-end">
              <Box sx={{ height: 12, width: 42, bgcolor: NAVY, borderRadius: '4px' }} />
              <Box sx={{ height: 12, width: 26, bgcolor: '#f1f5f9', borderRadius: '4px' }} />
            </Stack>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate" value={pct}
            sx={{
              height: 6, borderRadius: 3, bgcolor: '#e5e7eb',
              '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' },
            }}
          />
          <Typography sx={{
            fontSize: '0.7rem', color: '#64748b', mt: 0.75, textAlign: 'center', fontStyle: 'italic',
          }}>
            De {pct}% actual a 100% profesional
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
