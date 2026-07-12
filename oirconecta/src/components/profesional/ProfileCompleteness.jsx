/**
 * Banda con porcentaje de completitud del perfil + checklist por sección.
 * Click en un item navega al tab correspondiente.
 */
import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';

// Los checks miran el shape real que devuelve GET /api/directory/me.
// El backend usa snake-ish domain: nombreConsultorio, telefonoPublico,
// emailPublico, fotoPerfilUrl, allies (Json), redesSociales (Json),
// availability (Json). No cambiar sin sincronizar con directory.service.
const CHECKS = [
  {
    key: 'datos', label: 'Datos básicos', tab: 0,
    test: (p) => !!(
      (p?.nombreConsultorio || p?.nombre)
      && (p?.profesion || p?.professionId || p?.profesionPrincipal)
      && (p?.descripcion && String(p.descripcion).trim().length >= 20)
    ),
  },
  {
    key: 'contacto', label: 'Contacto', tab: 1,
    test: (p) => !!(
      (p?.telefonoPublico || p?.whatsappPublico || p?.telefono)
      && (p?.emailPublico || p?.email)
      && p?.direccionPublica
    ),
  },
  {
    key: 'foto', label: 'Foto', tab: 0,
    test: (p) => !!(p?.fotoPerfilUrl || p?.foto),
  },
  {
    key: 'servicios', label: 'Servicios', tab: 3,
    test: (p) => Array.isArray(p?.servicios) && p.servicios.length > 0,
  },
  {
    key: 'marcas', label: 'Marcas', tab: 4,
    test: (p) => {
      if (Array.isArray(p?.allies) && p.allies.length > 0) return true;
      return (p?.marcasAudifonos?.length || 0) + (p?.marcasImplantes?.length || 0) > 0;
    },
  },
  {
    key: 'horarios', label: 'Horarios', tab: 7,
    test: (p) => {
      if (p?.availability && (Array.isArray(p.availability) ? p.availability.length : Object.keys(p.availability).length) > 0) return true;
      return !!p?.horarios && Object.keys(p.horarios).length > 0;
    },
  },
  {
    key: 'redes', label: 'Redes / web', tab: 2,
    test: (p) => {
      const r = p?.redesSociales;
      if (r && typeof r === 'object' && Object.values(r).some((v) => !!v && String(v).trim() !== '')) return true;
      return !!(p?.redes?.length || p?.web || p?.instagram || p?.facebook);
    },
  },
];

function tone(pct) {
  if (pct >= 80) return { bar: '#10b981', fg: '#047857', bg: '#ecfdf5', label: 'Excelente' };
  if (pct >= 50) return { bar: '#4054B2', fg: '#272F50', bg: '#eef0fb', label: 'Buen avance' };
  return                 { bar: '#f59e0b', fg: '#b45309', bg: '#fffbeb', label: 'Por completar' };
}

export default function ProfileCompleteness({ profile, onJumpTab }) {
  const results = CHECKS.map((c) => ({ ...c, done: !!c.test(profile) }));
  const done = results.filter((r) => r.done).length;
  const pct = Math.round((done / CHECKS.length) * 100);
  const t = tone(pct);

  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5,
      boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
      borderLeft: `4px solid ${t.bar}`,
      p: 2.25, mb: 2.5,
    }}>
      <Box sx={{
        display: 'flex', alignItems: { sm: 'center' }, justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 1.5,
      }}>
        <Box>
          <Typography sx={{
            fontSize: 11, fontWeight: 700, color: t.fg, letterSpacing: '0.08em',
            textTransform: 'uppercase', mb: 0.25,
          }}>
            Completitud del perfil
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#041a12', lineHeight: 1.15 }}>
            {pct}% completado <Box component="span" sx={{ color: t.fg, fontSize: 13, fontWeight: 700, ml: 1 }}>· {t.label}</Box>
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', mt: 0.25 }}>
            Los perfiles al 100% reciben hasta 4× más visitas.
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: t.bg, color: t.fg, px: 1.25, py: 0.5, borderRadius: 1,
          fontSize: 12.5, fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' },
        }}>
          {done} / {CHECKS.length}
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6, borderRadius: 3, bgcolor: '#f3f4f6',
          '& .MuiLinearProgress-bar': { bgcolor: t.bar, borderRadius: 3 },
          mb: 1.5,
        }}
      />

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {results.map((r) => (
          <Box
            key={r.key}
            onClick={() => onJumpTab?.(r.tab)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.625,
              px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer',
              bgcolor: r.done ? '#ecfdf5' : '#fffbeb',
              color: r.done ? '#047857' : '#b45309',
              fontSize: 11.5, fontWeight: 700,
              transition: 'background 120ms ease',
              '&:hover': { bgcolor: r.done ? '#d1fae5' : '#fef3c7' },
            }}
          >
            {r.done ? (
              <CheckCircleOutline sx={{ fontSize: 13 }} />
            ) : (
              <RadioButtonUnchecked sx={{ fontSize: 13 }} />
            )}
            {r.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
