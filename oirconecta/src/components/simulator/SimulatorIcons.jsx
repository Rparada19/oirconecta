/**
 * Íconos custom monolínea para "Ponte en sus oídos".
 * Diseñados a mano sobre grid 24×24, stroke 1.6, sin fill por defecto.
 * Usan currentColor para heredar el color del Typography/Box padre.
 */
import React from 'react';

const base = {
  width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

export const IcCasa = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.7V20h13V9.7" />
    <path d="M10 20v-5h4v5" />
    <path d="M9 12.5h.01M15 12.5h.01" />
  </svg>
);

export const IcCena = (p) => (
  <svg {...base} {...p}>
    <path d="M3 14h18" />
    <path d="M5 14a7 7 0 0 1 14 0" />
    <path d="M4 14v.5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V14" />
    <path d="M9 6c0-1 1-1.5 1-2.5M12 6c0-1 1-1.5 1-2.5M15 6c0-1 1-1.5 1-2.5" />
  </svg>
);

export const IcLlamada = (p) => (
  <svg {...base} {...p}>
    <path d="M5 4.5 7 3.5l3 4-1.5 2a11 11 0 0 0 6 6l2-1.5 4 3-1 2c-9 1.5-15.5-5-14.5-14.5Z" />
    <path d="M16 4.5c2 .5 3.5 2 4 4M16 8c1 .3 1.7 1 2 2" />
  </svg>
);

export const IcSusurro = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v10" />
    <path d="M9 8.5c0-1 1.3-1.7 3-1.7s3 .7 3 1.7" />
    <path d="M7.5 16.5c0-1.5 2-2.5 4.5-2.5s4.5 1 4.5 2.5" />
    <path d="M5 20c1-1 3-1.5 7-1.5s6 .5 7 1.5" />
    <path d="M17 7l2-1M18 11l2 0" />
  </svg>
);

export const IcTV = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="6.5" width="18" height="11.5" rx="1.5" />
    <path d="M8 4l4 2.5M16 4l-4 2.5" />
    <path d="M7 21h4M13 21h4" />
    <circle cx="18.5" cy="9.5" r="0.6" fill="currentColor" />
  </svg>
);

export const IcEstetoscopio = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 3v6a4.5 4.5 0 0 0 9 0V3" />
    <path d="M5 3h3M14 3h3" />
    <path d="M11 13.5v3.5a3.5 3.5 0 0 0 7 0v-1" />
    <circle cx="18" cy="13" r="2" />
  </svg>
);

export const IcCopa = (p) => (
  <svg {...base} {...p}>
    <path d="M7 3h10c0 4-2 7-5 7s-5-3-5-7Z" />
    <path d="M12 10v8" />
    <path d="M8.5 21h7" />
  </svg>
);

export const IcTelefonoFijo = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="9" width="16" height="11" rx="1.5" />
    <path d="M7 9V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V9" />
    <circle cx="9" cy="14" r="0.7" fill="currentColor" />
    <circle cx="12" cy="14" r="0.7" fill="currentColor" />
    <circle cx="15" cy="14" r="0.7" fill="currentColor" />
    <path d="M9 17h6" />
  </svg>
);

// PASOS
export const IcAudifonos = (p) => (
  <svg {...base} {...p}>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="13.5" width="4" height="6.5" rx="1.5" />
    <rect x="17" y="13.5" width="4" height="6.5" rx="1.5" />
  </svg>
);

export const IcPlay = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const IcSlider = (p) => (
  <svg {...base} {...p}>
    <path d="M5 8h14M5 16h14" />
    <circle cx="9" cy="8" r="2.2" fill="#fff" />
    <circle cx="15" cy="16" r="2.2" fill="#fff" />
  </svg>
);

export const IcCompartir = (p) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="12" r="2.3" />
    <circle cx="18" cy="6" r="2.3" />
    <circle cx="18" cy="18" r="2.3" />
    <path d="M8 10.7l8-3.4M8 13.3l8 3.4" />
  </svg>
);
