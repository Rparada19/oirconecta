/**
 * Cerebro del asistente: mapa vivo de todo lo que sabe.
 *
 * Dos anillos, dos formas de enseñarle:
 *  · Los 8 nodos internos son las instrucciones escritas. Se encienden mientras
 *    el profesional escribe y su brillo sale de cuánto texto lleva el campo.
 *  · Las motas del anillo exterior son documentos subidos. Orbitan mientras se
 *    procesan y se fijan al núcleo cuando quedan listos para consultarse.
 *
 * No es decoración: cada punto es un dato real y se puede tocar para ir a él.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

const CX = 200;
const CY = 160;
const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

// Anillo irregular a propósito: un círculo perfecto se lee como diagrama.
const SLOTS = [
  { key: 'personality',     x: 160, y: 49,  label: 'Tono' },
  { key: 'expertise',       x: 276, y: 52,  label: 'Expertise' },
  { key: 'technologies',    x: 318, y: 139, label: 'Marcas' },
  { key: 'services',        x: 305, y: 234, label: 'Servicios' },
  { key: 'logistics',       x: 220, y: 270, label: 'Atención' },
  { key: 'differentiators', x: 122, y: 259, label: 'Diferencia' },
  { key: 'avoidTopics',     x: 83,  y: 176, label: 'Vetado' },
  { key: 'signature',       x: 112, y: 105, label: 'Cierre' },
];

const DOC_STATE = {
  PENDING:    { label: 'En cola',    color: '#94a3b8', vivo: true },
  PROCESSING: { label: 'Leyendo',    color: '#67e8f9', vivo: true },
  READY:      { label: 'Aprendido',  color: '#2dd4bf', vivo: false },
  FAILED:     { label: 'No se pudo', color: '#f87171', vivo: false },
};

function synapse(x, y) {
  const mx = (x + CX) / 2;
  const my = (y + CY) / 2;
  const dx = CX - x;
  const dy = CY - y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = 16;
  return `M ${x} ${y} Q ${mx + (-dy / len) * bend} ${my + (dx / len) * bend} ${CX} ${CY}`;
}

const kb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function BrainEducation({
  fields = {}, limits = {}, faqCount = 0, faqMax = 20,
  docs = [], onPick, onUpload, onDeleteDoc, uploading = false, uploadError = null,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const nodes = useMemo(() => SLOTS.map((s, i) => {
    const raw = (fields[s.key] || '').trim();
    const limit = limits[s.key] || 600;
    // Saturación rápida: con ~35% del cupo la instrucción ya es útil.
    const fill = raw ? Math.min(1, raw.length / (limit * 0.35)) : 0;
    return { ...s, i, on: raw.length > 0, fill, path: synapse(s.x, s.y) };
  }), [fields, limits]);

  const activos = nodes.filter((n) => n.on).length;
  const pct = Math.round((nodes.reduce((a, n) => a + n.fill, 0) / nodes.length) * 100);
  const listos = docs.filter((d) => d.status === 'READY');
  const procesando = docs.filter((d) => d.status === 'PENDING' || d.status === 'PROCESSING');
  const totalChunks = listos.reduce((a, d) => a + (d.chunkCount || 0), 0);

  const pick = (files) => {
    const arr = Array.from(files || []);
    if (arr.length && onUpload) onUpload(arr);
  };

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(120% 90% at 30% 10%, #131c33 0%, #0a0f1c 45%, #05070d 100%)',
      borderBottom: '1px solid #0f1729',
      '&:before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.32,
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.09) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
      },
      '@keyframes ocBreathe': {
        '0%,100%': { transform: 'scale(1)', opacity: 0.55 },
        '50%': { transform: 'scale(1.09)', opacity: 0.9 },
      },
      '@keyframes ocOrbit': { to: { transform: 'rotate(360deg)' } },
      '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
    }}>
      <Box sx={{
        position: 'relative', zIndex: 1, display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 400px) 1fr' },
        alignItems: 'center', gap: { xs: 1, md: 3 },
        px: { xs: 2, md: 3.5 }, pt: { xs: 2.5, md: 3 }, pb: 1,
      }}>
        {/* Constelación */}
        <Box sx={{ justifySelf: 'center', width: '100%', maxWidth: 400 }}>
          <svg viewBox="0 0 400 320" width="100%" role="img"
            aria-label={`Conocimiento del asistente: ${activos} de 8 instrucciones, ${faqCount} preguntas verificadas, ${listos.length} documentos aprendidos.`}
            style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <radialGradient id="ocCore">
                <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </radialGradient>
              <filter id="ocGlow" x="-70%" y="-70%" width="240%" height="240%">
                <feGaussianBlur stdDeviation="3.4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <circle cx={CX} cy={CY} r={44 + pct * 0.42} fill="url(#ocCore)"
              style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'ocBreathe 4.5s ease-in-out infinite',
                       transition: 'r 700ms cubic-bezier(.2,.7,.3,1)' }} />

            {nodes.map((n) => (
              <path key={`s-${n.key}`} d={n.path} fill="none"
                stroke={n.on ? '#8b5cf6' : '#334155'}
                strokeOpacity={n.on ? 0.28 + n.fill * 0.5 : 0.32}
                strokeWidth={n.on ? 1 + n.fill * 1.2 : 1}
                strokeDasharray={n.on ? 'none' : '3 5'}
                style={{ transition: 'stroke .5s, stroke-opacity .5s, stroke-width .5s' }} />
            ))}

            {nodes.filter((n) => n.on).map((n) => {
              const dur = `${2.6 + (n.i % 4) * 0.55}s`;
              const begin = `${(n.i * 0.42).toFixed(2)}s`;
              return (
                <circle key={`p-${n.key}`} r={2.1} fill="#67e8f9" opacity="0.9">
                  <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={n.path} />
                  <animate attributeName="opacity" values="0;0.95;0" dur={dur} begin={begin} repeatCount="indefinite" />
                </circle>
              );
            })}

            {/* Documentos en órbita — giran mientras se procesan, se fijan al quedar listos */}
            <g style={{ transformOrigin: `${CX}px ${CY}px`,
                        animation: procesando.length ? 'ocOrbit 26s linear infinite' : 'none' }}>
              {docs.slice(0, 24).map((d, i) => {
                const a = (i / Math.max(6, Math.min(24, docs.length))) * Math.PI * 2;
                const r = d.status === 'READY' ? 138 : 168;
                const st = DOC_STATE[d.status] || DOC_STATE.PENDING;
                return (
                  <circle key={d.id}
                    cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r}
                    r={d.status === 'READY' ? 3.6 : 2.8}
                    fill={st.color}
                    opacity={d.status === 'FAILED' ? 0.75 : 0.95}
                    filter={d.status === 'READY' ? 'url(#ocGlow)' : undefined}
                    style={{ transition: 'cx .9s cubic-bezier(.2,.7,.3,1), cy .9s cubic-bezier(.2,.7,.3,1), r .5s, fill .5s' }}>
                    {st.vivo && (
                      <animate attributeName="opacity" values="0.35;1;0.35" dur="1.6s" repeatCount="indefinite" />
                    )}
                  </circle>
                );
              })}
            </g>

            <circle cx={CX} cy={CY} r="15" fill="#0a0f1c" stroke="#8b5cf6" strokeOpacity="0.7" strokeWidth="1.2" />
            <circle cx={CX} cy={CY} r={4 + (pct / 100) * 6} fill="#c4b5fd" filter="url(#ocGlow)"
              style={{ transition: 'r 700ms cubic-bezier(.2,.7,.3,1)' }} />

            {nodes.map((n) => (
              <g key={n.key} onClick={() => onPick?.(n.key)} style={{ cursor: onPick ? 'pointer' : 'default' }}>
                <circle cx={n.x} cy={n.y} r="20" fill="transparent" />
                <circle cx={n.x} cy={n.y} r={n.on ? 5.5 + n.fill * 3.5 : 3.6}
                  fill={n.on ? '#c4b5fd' : '#1e293b'} stroke={n.on ? '#a78bfa' : '#475569'} strokeWidth="1.1"
                  filter={n.on ? 'url(#ocGlow)' : undefined}
                  style={{ transition: 'r .55s cubic-bezier(.2,.7,.3,1), fill .55s, stroke .55s' }} />
                <text x={n.x} y={n.y - (n.on ? 15 : 12)} textAnchor="middle"
                  style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.13em',
                           fill: n.on ? '#a5b4fc' : '#475569', transition: 'fill .55s', userSelect: 'none' }}>
                  {n.label.toUpperCase()}
                </text>
              </g>
            ))}
          </svg>
        </Box>

        {/* Lectura */}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: '#5eead4', mb: 1.25 }}>
            Cerebro del asistente
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: { xs: 44, md: 56 }, lineHeight: 0.9,
                              fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.04em',
                              fontVariantNumeric: 'tabular-nums' }}>
              {pct}<Box component="span" sx={{ fontSize: '0.42em', color: '#8b5cf6', ml: 0.5 }}>%</Box>
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: '#64748b', letterSpacing: '0.08em', lineHeight: 1.7 }}>
              {activos}/8 INSTRUCCIONES<br />
              {faqCount}/{faqMax} VERIFICADAS<br />
              {listos.length} DOCUMENTOS · {totalChunks} PASAJES
            </Typography>
          </Box>

          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600,
                            fontSize: { xs: '1.3rem', md: '1.55rem' }, lineHeight: 1.15,
                            color: '#e2e8f0', letterSpacing: '-0.02em', mt: 1.5, mb: 0.75 }}>
            {pct === 0 && listos.length === 0
              ? 'Todavía no sabe nada de ti'
              : pct < 40 ? 'Empieza a reconocer tu consultorio'
              : pct < 80 ? 'Ya responde con tu criterio'
              : 'Sabe lo que tú sabes'}
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55, maxWidth: 460 }}>
            Cada nodo es una instrucción; se enciende mientras escribes. Toca uno para ir a su campo.
            Los documentos que subas orbitan hasta quedar aprendidos.
          </Typography>
        </Box>
      </Box>

      {/* Materia prima: adjuntos */}
      <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 2, md: 3.5 }, pb: 3, pt: 1 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em',
                          textTransform: 'uppercase', color: '#475569', mb: 1.25 }}>
          Material del consultorio
        </Typography>

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          sx={{
            border: `1px dashed ${dragging ? '#2dd4bf' : '#1e293b'}`,
            background: dragging ? 'rgba(45,212,191,0.06)' : 'rgba(255,255,255,0.015)',
            borderRadius: '10px', p: 2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 1.5,
            transition: 'border-color .2s, background .2s',
            '&:hover': { borderColor: '#334155' },
            '&:focus-visible': { outline: '2px solid #2dd4bf', outlineOffset: 2 },
          }}
        >
          {uploading
            ? <CircularProgress size={18} sx={{ color: '#2dd4bf' }} />
            : <CloudUploadOutlinedIcon sx={{ color: dragging ? '#2dd4bf' : '#475569', fontSize: 22 }} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 600 }}>
              {uploading ? 'Subiendo…' : 'Arrastra tus documentos o toca aquí'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              PDF, Word o texto · hasta 10 MB. Protocolos, fichas de producto, listas de precios, guiones de atención.
            </Typography>
          </Box>
          <input ref={inputRef} type="file" multiple hidden
            accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain"
            onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        </Box>

        {uploadError && (
          <Typography sx={{ fontSize: '0.8rem', color: '#f87171', mt: 1 }}>{uploadError}</Typography>
        )}

        {docs.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {docs.map((d) => {
              const st = DOC_STATE[d.status] || DOC_STATE.PENDING;
              return (
                <Tooltip key={d.id} title={d.errorMessage || `${st.label}${d.chunkCount ? ` · ${d.chunkCount} pasajes` : ''}`}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    border: '1px solid #1e293b', borderRadius: '8px',
                    bgcolor: 'rgba(255,255,255,0.02)', pl: 1.25, pr: 0.5, py: 0.6, maxWidth: 320,
                  }}>
                    <Box sx={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: st.color,
                      animation: st.vivo ? 'ocBreathe 1.6s ease-in-out infinite' : 'none',
                    }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: '0.8rem', color: '#cbd5e1', maxWidth: 210 }}>
                        {d.filename}
                      </Typography>
                      <Typography sx={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em',
                                        color: st.color, textTransform: 'uppercase' }}>
                        {st.label}{d.status === 'READY' && d.chunkCount ? ` · ${d.chunkCount} pasajes` : ''}
                        {d.sizeBytes ? ` · ${kb(d.sizeBytes)}` : ''}
                      </Typography>
                    </Box>
                    {onDeleteDoc && (
                      <Box component="button" type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteDoc(d); }}
                        aria-label={`Quitar ${d.filename}`}
                        sx={{ ml: 'auto', border: 0, bgcolor: 'transparent', color: '#475569',
                              cursor: 'pointer', p: 0.5, lineHeight: 0, borderRadius: '6px',
                              '&:hover': { color: '#f87171' } }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
