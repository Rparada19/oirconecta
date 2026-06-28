/**
 * Logo de marca con fallback.
 *
 * Carga primero /img/marcas/{slug}.svg (o .png). Si no existe, muestra un
 * chip con las iniciales en el color oficial de la marca. Cuando agregues
 * los SVG reales a /public/img/marcas/, todos los componentes que usen
 * <BrandLogo brand="phonak" /> los heredan automáticamente.
 */
import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

// Color oficial / dominante de cada marca + slug para nombre de archivo.
export const BRAND_META = {
  // Audífonos
  Widex:        { slug: 'widex',        color: '#0099CC', initials: 'W',  group: 'audifonos' },
  Oticon:       { slug: 'oticon',       color: '#005A9C', initials: 'O',  group: 'audifonos' },
  Signia:       { slug: 'signia',       color: '#76C043', initials: 'S',  group: 'audifonos' },
  Phonak:       { slug: 'phonak',       color: '#003D7C', initials: 'P',  group: 'audifonos' },
  ReSound:      { slug: 'resound',      color: '#0078D4', initials: 'R',  group: 'audifonos' },
  Starkey:      { slug: 'starkey',      color: '#E31837', initials: 'St', group: 'audifonos' },
  Beltone:      { slug: 'beltone',      color: '#003A70', initials: 'B',  group: 'audifonos' },
  Rexton:       { slug: 'rexton',       color: '#5BC2E7', initials: 'Rx', group: 'audifonos' },
  Audioservice: { slug: 'audioservice', color: '#003E7E', initials: 'As', group: 'audifonos' },
  Bernafon:     { slug: 'bernafon',     color: '#C8102E', initials: 'Bn', group: 'audifonos' },
  Hansaton:     { slug: 'hansaton',     color: '#0033A0', initials: 'H',  group: 'audifonos' },
  Sonic:        { slug: 'sonic',        color: '#F39200', initials: 'Sn', group: 'audifonos' },
  Unitron:      { slug: 'unitron',      color: '#5E2750', initials: 'U',  group: 'audifonos' },
  // Implantes
  Cochlear:           { slug: 'cochlear',           color: '#FBB034', initials: 'C',  group: 'implantes' },
  'Advanced Bionics': { slug: 'advanced-bionics',   color: '#0066B3', initials: 'AB', group: 'implantes' },
  'MED-EL':           { slug: 'medel',              color: '#E5007D', initials: 'ME', group: 'implantes' },
};

export function brandsByGroup(group) {
  return Object.entries(BRAND_META)
    .filter(([, m]) => m.group === group)
    .map(([name]) => name);
}

/**
 * Variantes:
 *  - size: 'sm' | 'md' | 'lg'  (32 / 44 / 64 px)
 *  - showName: bool (muestra el nombre debajo)
 */
export default function BrandLogo({ brand, size = 'md', showName = false, selected = false, onClick }) {
  const meta = BRAND_META[brand];
  const [imgFailed, setImgFailed] = useState(false);
  const dim = size === 'sm' ? 32 : size === 'lg' ? 64 : 44;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 18 : 13;

  if (!meta) {
    return (
      <Box sx={{
        width: dim, height: dim, borderRadius: 1.5, bgcolor: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color: '#6b7280',
      }}>
        {brand?.slice(0, 2).toUpperCase() || '?'}
      </Box>
    );
  }

  const imgSrc = `/img/marcas/${meta.slug}.svg`;

  const inner = (
    <Box sx={{
      position: 'relative', width: dim, height: dim, borderRadius: 1.5,
      bgcolor: '#fff', border: `1.5px solid ${selected ? meta.color : '#e5e7eb'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: selected ? `0 2px 8px ${meta.color}30` : 'none',
      transition: 'all 120ms ease',
    }}>
      {!imgFailed ? (
        <Box
          component="img"
          src={imgSrc}
          alt={brand}
          onError={() => setImgFailed(true)}
          sx={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }}
        />
      ) : (
        <Typography sx={{
          fontSize, fontWeight: 800, color: meta.color, letterSpacing: '-0.02em',
        }}>
          {meta.initials}
        </Typography>
      )}
      {selected && (
        <Box sx={{
          position: 'absolute', right: -4, top: -4, width: 14, height: 14, borderRadius: '50%',
          bgcolor: meta.color, color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 9, fontWeight: 800, border: '2px solid #fff',
        }}>✓</Box>
      )}
    </Box>
  );

  if (showName) {
    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
          cursor: onClick ? 'pointer' : 'default',
          p: 1, borderRadius: 1.5,
          bgcolor: selected ? `${meta.color}10` : 'transparent',
          transition: 'background 120ms ease',
          '&:hover': onClick ? { bgcolor: selected ? `${meta.color}15` : '#f8fafc' } : {},
        }}
      >
        {inner}
        <Typography sx={{
          fontSize: 11.5, fontWeight: selected ? 700 : 600,
          color: selected ? meta.color : '#272F50', textAlign: 'center', lineHeight: 1.1,
        }}>
          {brand}
        </Typography>
      </Box>
    );
  }

  return onClick ? (
    <Box onClick={onClick} sx={{ cursor: 'pointer' }}>{inner}</Box>
  ) : inner;
}
