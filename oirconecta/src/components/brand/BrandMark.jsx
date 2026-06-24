/**
 * Artefacto de marca OírConecta — la "u" del logo extrapolada como swoosh
 * editorial. Se usa como decorador recurrente en hero, manifesto, dividers.
 *
 * Variantes:
 *   - "swoosh": la curva grande para hero / fondos (con punto sobre la i)
 *   - "wave":   onda sonora estilizada (3 senoides)
 *   - "dot":    el punto solo
 */
import React from 'react';

export function Swoosh({ width = 480, color = '#272F50', accent = '#C9A86A', opacity = 1, ...rest }) {
  return (
    <svg viewBox="0 0 480 220" width={width} style={{ display: 'block' }} aria-hidden {...rest}>
      <defs>
        <linearGradient id="oc-swoosh-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.55} />
        </linearGradient>
      </defs>
      <path
        d="M28 50 C30 162 130 210 230 200 C330 190 410 130 452 56"
        fill="none" stroke="url(#oc-swoosh-grad)" strokeWidth="56" strokeLinecap="round"
      />
      <circle cx="358" cy="44" r="22" fill={accent} opacity={opacity * 0.9} />
    </svg>
  );
}

export function SoundWave({ width = 600, height = 160, color = '#272F50', accent = '#C9A86A', ...rest }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden {...rest}>
      <g style={{ transformOrigin: 'center' }}>
        <path
          d={wavePath(width, height, 1, 6, 0)}
          fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.85"
        >
          <animate attributeName="d" dur="6s" repeatCount="indefinite"
            values={`${wavePath(width, height, 1, 6, 0)};
                     ${wavePath(width, height, 1.1, 6, 1)};
                     ${wavePath(width, height, 0.92, 6, 2)};
                     ${wavePath(width, height, 1, 6, 0)}`}
          />
        </path>
        <path
          d={wavePath(width, height, 0.62, 9, 1)}
          fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
        >
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
            values={`${wavePath(width, height, 0.62, 9, 1)};
                     ${wavePath(width, height, 0.7, 9, 0)};
                     ${wavePath(width, height, 0.55, 9, 2)};
                     ${wavePath(width, height, 0.62, 9, 1)}`}
          />
        </path>
        <path
          d={wavePath(width, height, 0.4, 12, 2)}
          fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.45"
        >
          <animate attributeName="d" dur="10s" repeatCount="indefinite"
            values={`${wavePath(width, height, 0.4, 12, 2)};
                     ${wavePath(width, height, 0.5, 12, 1)};
                     ${wavePath(width, height, 0.35, 12, 0)};
                     ${wavePath(width, height, 0.4, 12, 2)}`}
          />
        </path>
      </g>
    </svg>
  );
}

function wavePath(w, h, amp, freq, phase) {
  const mid = h / 2;
  const segs = 60;
  let d = `M 0 ${mid}`;
  for (let i = 1; i <= segs; i++) {
    const x = (i / segs) * w;
    const y = mid + Math.sin((i / segs) * freq * Math.PI + phase) * (h * 0.35 * amp);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function BigQuote({ color = '#C9A86A', size = 180, ...rest }) {
  return (
    <svg width={size} viewBox="0 0 200 160" aria-hidden {...rest}>
      <text x="0" y="160" fontFamily='"Playfair Display", Georgia, serif'
        fontSize="280" fontWeight="700" fill={color} opacity="0.9">“</text>
    </svg>
  );
}
