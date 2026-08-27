/**
 * Lenguaje visual de la sección Agente IA: una consola, no un formulario.
 *
 * El resto del portal profesional es claro y editorial. Esta sección se va a
 * negro a propósito — es el único sitio donde el profesional se asoma a la
 * máquina, y merece leerse como un instrumento encendido y no como otra
 * pantalla de configuración.
 *
 * Los tokens y el tema viven acá para que toda la página hable igual: el mismo
 * negro, la misma retícula, la misma tipografía de datos.
 */

import React from 'react';
import { Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';

export const C = {
  ink: '#070A12',
  ink2: '#0D1322',
  ink3: '#131B2E',
  line: '#1D2740',
  bone: '#E8EDF7',
  mute: '#7A8AA6',
  dim: '#4A5872',
  signal: '#7C5CFF',
  signalLo: '#A896FF',
  trace: '#35E0C8',
  ok: '#34D399',
  warn: '#FBBF24',
  danger: '#F87171',
};

export const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';
export const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

/** Tema MUI oscuro, solo para esta sección. Evita repintar cada componente a mano. */
export const consoleTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: C.signal },
    secondary: { main: C.trace },
    background: { default: C.ink, paper: C.ink2 },
    text: { primary: C.bone, secondary: C.mute },
    divider: C.line,
    error: { main: C.danger },
    success: { main: C.ok },
    warning: { main: C.warn },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Poppins", system-ui, sans-serif' },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: C.ink2,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.02)',
          '& fieldset': { borderColor: C.line },
          '&:hover fieldset': { borderColor: '#2A3853' },
          '&.Mui-focused fieldset': { borderColor: C.signal },
        },
        input: { color: C.bone },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: C.mute } } },
    MuiFormHelperText: { styleOverrides: { root: { color: C.dim, fontSize: 11.5 } } },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        outlined: { borderColor: C.line, color: C.bone, '&:hover': { borderColor: C.signal } },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 7 } } },
    MuiDivider: { styleOverrides: { root: { borderColor: C.line } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: C.ink3, border: `1px solid ${C.line}`, fontSize: 12 },
      },
    },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: C.ink2, border: `1px solid ${C.line}` } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: C.ink2, borderColor: C.line } } },
  },
});

/** Fondo de la sección: tinta, retícula fina y dos halos. */
export function ConsoleShell({ children }) {
  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100%',
      bgcolor: C.ink,
      color: C.bone,
      px: { xs: 2, md: 3 },
      py: { xs: 2.5, md: 3 },
      borderRadius: { xs: 0, md: '16px' },
      border: `1px solid ${C.line}`,
      overflow: 'hidden',
      backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px),
                        linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
      '&:before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(80% 45% at 50% 0%, rgba(124,92,255,0.14), transparent 60%),
                     radial-gradient(60% 40% at 50% 100%, rgba(53,224,200,0.06), transparent 60%)`,
      },
      '& > *': { position: 'relative', zIndex: 1 },
    }}>
      {children}
    </Box>
  );
}

/** Encabezado de panel: etiqueta técnica arriba, titular serif debajo. */
export function PanelHead({ eyebrow, title, hint, right }) {
  return (
    <Box sx={{
      px: { xs: 2.5, md: 3 }, py: 2.25, borderBottom: `1px solid ${C.line}`,
      display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box component="p" sx={{
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', m: 0, mb: 0.75,
          textTransform: 'uppercase', color: C.trace,
        }}>
          {eyebrow}
        </Box>
        <Box component="h2" sx={{
          ...SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' },
          lineHeight: 1.15, color: C.bone, m: 0,
        }}>
          {title}
        </Box>
        {hint && (
          <Box component="p" sx={{ fontSize: '0.85rem', color: C.mute, m: 0, mt: 0.75, maxWidth: '62ch', lineHeight: 1.55 }}>
            {hint}
          </Box>
        )}
      </Box>
      {right}
    </Box>
  );
}

/** Etiqueta de dato: monoespaciada, en mayúsculas, para cifras y estados. */
export function Label({ children, color = C.dim, sx }) {
  return (
    <Box component="span" sx={{
      fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em',
      textTransform: 'uppercase', color, ...sx,
    }}>
      {children}
    </Box>
  );
}
