/**
 * Estilos compartidos del portal profesional.
 * Centralizar aquí evita drift y permite cambios globales en un solo lugar.
 */

export const PRO_COLORS = {
  green:      '#085946',
  greenDark:  '#064a38',
  greenSoft:  'rgba(8,89,70,0.08)',
  navy:       '#041a12',
  navyText:   '#0f1923',
  ink:        '#272F50',
  textMuted:  '#5b6b7a',
  border:     '#e5e7eb',
  borderSoft: '#eef0f2',
  bg:         '#f5f7fa',
  bgCard:     '#ffffff',
  teal:       '#6ee7c8',
  amber:      '#f59e0b',
  red:        '#ef4444',
};

/**
 * Card suave: fondo blanco sólido, borde sutil, sombra mínima.
 * Más legible que el glass en mobile y con menos coste de render.
 */
export const softCard = {
  bgcolor: '#fff',
  border: `1px solid ${PRO_COLORS.border}`,
  borderRadius: 2.5,
  boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
};

/**
 * Card con acento — para destacar bloques en hero/dashboard.
 */
export const accentCard = (color = PRO_COLORS.green) => ({
  bgcolor: '#fff',
  border: `1px solid ${PRO_COLORS.border}`,
  borderLeft: `4px solid ${color}`,
  borderRadius: 2.5,
  boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
});

/**
 * Glass card legacy — mantener para hero del Dashboard si se quiere.
 * Nuevas pantallas: preferir softCard.
 */
export const glassCard = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
};

/**
 * Hero con gradiente verde — para card de plan/suscripción.
 */
export const greenHero = {
  background: `linear-gradient(135deg, ${PRO_COLORS.green} 0%, #003c2c 100%)`,
  color: '#fff',
  borderRadius: 2.5,
};

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: '#fff',
  },
};

/** Page wrapper estándar — limita ancho y agrega padding consistente. */
export const pagePad = { py: { xs: 0, md: 1 } };
