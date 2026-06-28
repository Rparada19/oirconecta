/**
 * Librería de logos de marcas — diseño propio, una sola línea gráfica.
 *
 * Cada marca usa exactamente la misma composición:
 *   [ Cuadrado redondeado en color marca con inicial blanca ] [ Wordmark en color marca ]
 *
 * Lo que cambia entre marcas es UNICAMENTE: color, inicial, nombre.
 * Esto garantiza consistencia visual donde sea que se use (perfil del
 * profesional, ficha pública, cards del directorio, blog, marketplace).
 *
 * Exports:
 *   - BRANDS: tabla de metadata por marca
 *   - BrandMark:     solo el cuadrado (logomark/favicon)
 *   - BrandWordmark: solo el texto
 *   - BrandLogo:     cuadrado + texto, ideal para listados
 *
 * Escalado: pasa `size` (preset) o `height` en px. Como es SVG, no
 * pierde calidad a ningún tamaño.
 */
import React from 'react';
import { Box } from '@mui/material';

// Una sola fuente de verdad para todas las marcas.
export const BRANDS = {
  // Audífonos
  Widex:        { slug: 'widex',        color: '#0099CC', initial: 'W',  group: 'audifonos' },
  Oticon:       { slug: 'oticon',       color: '#005A9C', initial: 'O',  group: 'audifonos' },
  Signia:       { slug: 'signia',       color: '#76C043', initial: 'S',  group: 'audifonos' },
  Phonak:       { slug: 'phonak',       color: '#003D7C', initial: 'P',  group: 'audifonos' },
  ReSound:      { slug: 'resound',      color: '#0078D4', initial: 'R',  group: 'audifonos' },
  Starkey:      { slug: 'starkey',      color: '#E31837', initial: 'S',  group: 'audifonos' },
  Beltone:      { slug: 'beltone',      color: '#003A70', initial: 'B',  group: 'audifonos' },
  Rexton:       { slug: 'rexton',       color: '#0A4D8C', initial: 'R',  group: 'audifonos' },
  Audioservice: { slug: 'audioservice', color: '#003E7E', initial: 'A',  group: 'audifonos' },
  Bernafon:     { slug: 'bernafon',     color: '#C8102E', initial: 'B',  group: 'audifonos' },
  Hansaton:     { slug: 'hansaton',     color: '#0033A0', initial: 'H',  group: 'audifonos' },
  Sonic:        { slug: 'sonic',        color: '#F39200', initial: 'S',  group: 'audifonos' },
  Unitron:      { slug: 'unitron',      color: '#5E2750', initial: 'U',  group: 'audifonos' },
  // Implantes
  Cochlear:           { slug: 'cochlear',         color: '#D89020', initial: 'C',  group: 'implantes' },
  'Advanced Bionics': { slug: 'advanced-bionics', color: '#0066B3', initial: 'AB', group: 'implantes' },
  'MED-EL':           { slug: 'medel',            color: '#E5007D', initial: 'M',  group: 'implantes' },
};

const SIZES = {
  xs: { mark: 20, font: 11, gap: 6,  wordmark: 12 },
  sm: { mark: 28, font: 14, gap: 8,  wordmark: 14 },
  md: { mark: 40, font: 18, gap: 10, wordmark: 18 },
  lg: { mark: 56, font: 24, gap: 12, wordmark: 22 },
  xl: { mark: 80, font: 34, gap: 16, wordmark: 28 },
};

function resolveSize(size, height) {
  if (height) {
    // Escala lineal desde xs (20) hasta xl (80).
    const mark = height;
    return {
      mark,
      font: Math.round(mark * 0.48),
      gap: Math.round(mark * 0.25),
      wordmark: Math.round(mark * 0.50),
    };
  }
  return SIZES[size] || SIZES.md;
}

function getMeta(brand) {
  return BRANDS[brand] || null;
}

/* ─────────────────────────────────────────────────────────
 * BrandMark — solo el cuadrado redondeado con la inicial.
 * Útil como ícono pequeño, favicon, chip de marca en filas.
 * ───────────────────────────────────────────────────────── */
export function BrandMark({ brand, size = 'md', height, title }) {
  const meta = getMeta(brand);
  const s = resolveSize(size, height);
  const m = s.mark;

  if (!meta) {
    return (
      <Box sx={{
        width: m, height: m, borderRadius: m * 0.22 + 'px',
        bgcolor: '#e5e7eb', color: '#6b7280',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: s.font,
      }} title={title || brand}>?</Box>
    );
  }

  // SVG inline: escala sin pixelar a cualquier tamaño.
  const r = m * 0.22; // radio proporcional → mismo "lenguaje" en todos los tamaños
  return (
    <svg
      width={m} height={m} viewBox={`0 0 ${m} ${m}`}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title || `Logo de ${brand}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect x="0" y="0" width={m} height={m} rx={r} ry={r} fill={meta.color} />
      <text
        x="50%" y="50%"
        dy={m * 0.04}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="-apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800" fontSize={s.font}
        fill="#ffffff"
        letterSpacing={meta.initial.length > 1 ? '-1' : '0'}
      >
        {meta.initial}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
 * BrandWordmark — solo el nombre, en color de la marca.
 * Útil al lado del mark o en menciones de texto.
 * ───────────────────────────────────────────────────────── */
export function BrandWordmark({ brand, size = 'md', height }) {
  const meta = getMeta(brand);
  const s = resolveSize(size, height);
  if (!meta) return <span style={{ color: '#6b7280', fontWeight: 700 }}>{brand}</span>;
  return (
    <span style={{
      fontFamily: '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 800,
      fontSize: s.wordmark,
      color: meta.color,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>{brand}</span>
  );
}

/* ─────────────────────────────────────────────────────────
 * BrandLogo — Mark + Wordmark en horizontal.
 * Variantes:
 *   - layout: 'row' (default) | 'stack' (mark arriba, nombre debajo)
 *   - selectable: agrega ring + check al estado 'selected'
 *   - onClick: lo vuelve clickable
 *
 * Tamaño con `size` (xs/sm/md/lg/xl) o `height` en px (sobreescribe).
 * ───────────────────────────────────────────────────────── */
export default function BrandLogo({
  brand, size = 'md', height,
  layout = 'row', showName = true,
  selected = false, onClick,
}) {
  const meta = getMeta(brand);
  const s = resolveSize(size, height);

  if (!meta) return null;

  const markEl = <BrandMark brand={brand} height={s.mark} />;

  const wordEl = showName ? (
    <span style={{
      fontFamily: '-apple-system, system-ui, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 800,
      fontSize: s.wordmark,
      color: meta.color,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>{brand}</span>
  ) : null;

  // Estilo común para la caja contenedora.
  const baseBox = {
    display: 'inline-flex',
    alignItems: layout === 'stack' ? 'center' : 'center',
    flexDirection: layout === 'stack' ? 'column' : 'row',
    gap: layout === 'stack' ? `${Math.round(s.gap * 0.6)}px` : `${s.gap}px`,
    cursor: onClick ? 'pointer' : 'default',
    padding: selected ? 4 : 0,
    border: selected ? `2px solid ${meta.color}` : '2px solid transparent',
    borderRadius: 10,
    background: selected ? `${meta.color}10` : 'transparent',
    transition: 'background 120ms ease, border-color 120ms ease, transform 120ms ease',
    position: 'relative',
  };

  const hoverStyles = onClick ? {
    '&:hover': {
      background: selected ? `${meta.color}18` : '#f8fafc',
      transform: 'translateY(-1px)',
    },
  } : {};

  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
      sx={{ ...baseBox, ...hoverStyles }}
    >
      {markEl}
      {wordEl}
      {selected && (
        <Box sx={{
          position: 'absolute', right: -6, top: -6,
          width: 18, height: 18, borderRadius: '50%',
          bgcolor: meta.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, border: '2px solid #fff',
          boxShadow: `0 1px 3px ${meta.color}55`,
        }}>✓</Box>
      )}
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────
 * Utilidades de listado.
 * ───────────────────────────────────────────────────────── */
export function brandsByGroup(group) {
  return Object.entries(BRANDS)
    .filter(([, m]) => m.group === group)
    .map(([name]) => name);
}

export function isBrand(name) {
  return !!BRANDS[name];
}

// Re-export named para compat con código previo:
//   import { BRAND_META } from '...BrandLogo'
export const BRAND_META = BRANDS;
