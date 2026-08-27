/**
 * Cerebro del asistente: no es un gráfico encima de un formulario, es la
 * interfaz. Tocas una región de la red y editas esa región ahí mismo.
 *
 *  · Los 8 nodos internos son las instrucciones. El brillo sale de cuánto texto
 *    lleva el campo y crece mientras se escribe.
 *  · Las motas exteriores son documentos: orbitan mientras se procesan y se
 *    fijan al núcleo al quedar aprendidas.
 *  · Al guardar, el nodo dispara un pulso hacia el núcleo y queda una línea en
 *    el registro. Aprender algo tiene que verse.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { C, MONO, SERIF } from './iaConsole';

const CX = 200;
const CY = 160;

// Anillo irregular a propósito: un círculo perfecto se lee como diagrama.
const SLOTS = [
  { key: 'personality', x: 160, y: 49, label: 'Tono', title: 'Personalidad y tono',
    hint: 'Cómo le hablas a un paciente. ¿Cálida o técnica? ¿Tuteo o usted?',
    ej: 'Cercana, empática, usa términos cotidianos en vez de jerga médica.' },
  { key: 'expertise', x: 276, y: 52, label: 'Expertise', title: 'Áreas de expertise',
    hint: 'Lo que de verdad haces, para que no ofrezca lo que no.',
    ej: 'Adaptación de audífonos pediátricos, terapia auditiva verbal, manejo de tinnitus.' },
  { key: 'technologies', x: 318, y: 139, label: 'Marcas', title: 'Marcas y tecnología',
    hint: 'Las que adaptas. Si preguntan por una que no manejas, lo dice en vez de inventar.',
    ej: 'Widex Moment y Allure, Phonak Lumity, Signia IX. Accesorios: micrófonos remotos.' },
  { key: 'services', x: 305, y: 234, label: 'Servicios', title: 'Servicios y qué incluye',
    hint: 'De aquí sale la respuesta a "¿ustedes hacen X?" y a cuánto cuesta.',
    ej: 'Valoración: audiometría, logoaudiometría e impedanciometría, 45 min.' },
  { key: 'logistics', x: 220, y: 270, label: 'Atención', title: 'Cómo funciona la atención',
    hint: 'Sedes, horarios, convenios, tiempos. Lo que repites veinte veces al día.',
    ej: 'Sede norte de Bogotá, lunes a viernes 8am-5pm. Los audífonos llegan en 5 días.' },
  { key: 'differentiators', x: 122, y: 259, label: 'Diferencia', title: 'Qué te hace diferente',
    hint: 'Lo usa cuando el paciente compara. Nunca para presionar.',
    ej: 'Somos multimarca, no casados con un fabricante. Controles de por vida.' },
  { key: 'avoidTopics', x: 83, y: 176, label: 'Vetado', title: 'Lo que NO debe tocar',
    hint: 'Los límites. Aquí se protege tu criterio clínico.',
    ej: 'Diagnósticos, promesas de resultados clínicos, precios exactos por chat.' },
  { key: 'signature', x: 112, y: 105, label: 'Cierre', title: 'Frase de firma',
    hint: 'Tu frase de siempre al despedirte. Detalle pequeño, pero suena a ti.',
    ej: 'Cuídate mucho — Piedad.' },
];

const DOC_STATE = {
  PENDING: { color: '#94a3b8', vivo: true },
  PROCESSING: { color: '#67e8f9', vivo: true },
  READY: { color: '#2dd4bf', vivo: false },
  FAILED: { color: '#f87171', vivo: false },
};

function synapse(x, y) {
  const mx = (x + CX) / 2;
  const my = (y + CY) / 2;
  const dx = CX - x;
  const dy = CY - y;
  const len = Math.hypot(dx, dy) || 1;
  return `M ${x} ${y} Q ${mx + (-dy / len) * 16} ${my + (dx / len) * 16} ${CX} ${CY}`;
}

export default function BrainEducation({
  fields = {}, limits = {}, faqCount = 0, faqMax = 20, docs = [],
  onChange, onSave, saving = false,
}) {
  const [sel, setSel] = useState(null);
  const [firing, setFiring] = useState(null);
  const [log, setLog] = useState([]);
  const textRef = useRef(null);

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
  const chunks = listos.reduce((a, d) => a + (d.chunkCount || 0), 0);
  const nodo = nodes.find((n) => n.key === sel) || null;

  useEffect(() => { if (nodo && textRef.current) textRef.current.focus(); }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Los documentos que terminan de procesarse también dejan rastro en el registro.
  const vistos = useRef(new Set());
  useEffect(() => {
    listos.forEach((d) => {
      if (vistos.current.has(d.id)) return;
      vistos.current.add(d.id);
      setLog((l) => [{ t: Date.now(), k: 'DOCUMENTO', m: `${d.filename} · ${d.chunkCount || 0} pasajes` }, ...l].slice(0, 6));
    });
  }, [listos]);

  const guardar = async () => {
    if (!nodo) return;
    const ok = await onSave?.();
    if (ok === false) return;
    setFiring(nodo.key);
    setLog((l) => [{ t: Date.now(), k: nodo.label.toUpperCase(), m: 'asimilado' }, ...l].slice(0, 6));
    setTimeout(() => setFiring(null), 1600);
  };

  return (
    <Box sx={{
      position: 'relative',
      background: 'radial-gradient(120% 90% at 30% 10%, #131c33 0%, #0a0f1c 45%, #05070d 100%)',
      borderBottom: `1px solid ${C.line}`,
      '&:before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.09) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
      },
      '@keyframes ocBreathe': {
        '0%,100%': { transform: 'scale(1)', opacity: 0.55 },
        '50%': { transform: 'scale(1.09)', opacity: 0.9 },
      },
      '@keyframes ocOrbit': { to: { transform: 'rotate(360deg)' } },
      '@keyframes ocFlash': {
        '0%': { r: 6, opacity: 1 }, '100%': { r: 34, opacity: 0 },
      },
      '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
    }}>
      <Box sx={{
        position: 'relative', zIndex: 1, display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 420px) 1fr' },
        gap: { xs: 2, md: 3 }, alignItems: 'stretch',
        px: { xs: 2, md: 3.5 }, py: { xs: 2.5, md: 3 },
      }}>
        {/* La red */}
        <Box sx={{ justifySelf: 'center', width: '100%', maxWidth: 420 }}>
          <svg viewBox="0 0 400 320" width="100%" role="group"
            aria-label={`Red del asistente: ${activos} de 8 instrucciones, ${listos.length} documentos aprendidos`}
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
                stroke={n.key === sel ? '#c4b5fd' : n.on ? '#8b5cf6' : '#334155'}
                strokeOpacity={n.on ? 0.3 + n.fill * 0.5 : 0.32}
                strokeWidth={n.key === sel ? 2.2 : n.on ? 1 + n.fill * 1.2 : 1}
                strokeDasharray={n.on ? 'none' : '3 5'}
                style={{ transition: 'stroke .4s, stroke-opacity .4s, stroke-width .4s' }} />
            ))}

            {nodes.filter((n) => n.on).map((n) => {
              const dur = `${2.6 + (n.i % 4) * 0.55}s`;
              return (
                <circle key={`p-${n.key}`} r={2.1} fill="#67e8f9" opacity="0.9">
                  <animateMotion dur={dur} begin={`${(n.i * 0.42).toFixed(2)}s`} repeatCount="indefinite" path={n.path} />
                  <animate attributeName="opacity" values="0;0.95;0" dur={dur}
                    begin={`${(n.i * 0.42).toFixed(2)}s`} repeatCount="indefinite" />
                </circle>
              );
            })}

            {/* Ráfaga al guardar: tres pulsos seguidos hacia el núcleo */}
            {firing && (() => {
              const n = nodes.find((x) => x.key === firing);
              if (!n) return null;
              return (
                <g>
                  {[0, 0.18, 0.36].map((d) => (
                    <circle key={d} r="3.4" fill="#35E0C8" filter="url(#ocGlow)">
                      <animateMotion dur="0.85s" begin={`${d}s`} repeatCount="2" path={n.path} />
                    </circle>
                  ))}
                  <circle cx={n.x} cy={n.y} fill="none" stroke="#35E0C8" strokeWidth="1.5"
                    style={{ animation: 'ocFlash .9s ease-out 2' }} />
                </g>
              );
            })()}

            {/* Documentos */}
            <g style={{ transformOrigin: `${CX}px ${CY}px`,
                        animation: procesando.length ? 'ocOrbit 26s linear infinite' : 'none' }}>
              {docs.slice(0, 24).map((d, i) => {
                const a = (i / Math.max(6, Math.min(24, docs.length))) * Math.PI * 2;
                const r = d.status === 'READY' ? 138 : 172;
                const st = DOC_STATE[d.status] || DOC_STATE.PENDING;
                return (
                  <circle key={d.id} cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r}
                    r={d.status === 'READY' ? 3.6 : 2.8} fill={st.color}
                    filter={d.status === 'READY' ? 'url(#ocGlow)' : undefined}
                    style={{ transition: 'cx 1s cubic-bezier(.2,.7,.3,1), cy 1s cubic-bezier(.2,.7,.3,1), r .5s, fill .5s' }}>
                    {st.vivo && <animate attributeName="opacity" values="0.35;1;0.35" dur="1.6s" repeatCount="indefinite" />}
                  </circle>
                );
              })}
            </g>

            <circle cx={CX} cy={CY} r="15" fill="#0a0f1c" stroke="#8b5cf6" strokeOpacity="0.7" strokeWidth="1.2" />
            <circle cx={CX} cy={CY} r={4 + (pct / 100) * 6} fill="#c4b5fd" filter="url(#ocGlow)"
              style={{ transition: 'r 700ms cubic-bezier(.2,.7,.3,1)' }} />

            {nodes.map((n) => (
              <g key={n.key} onClick={() => setSel(n.key === sel ? null : n.key)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(n.key === sel ? null : n.key); } }}
                style={{ cursor: 'pointer' }}>
                <circle cx={n.x} cy={n.y} r="22" fill="transparent" />
                {n.key === sel && (
                  <circle cx={n.x} cy={n.y} r="14" fill="none" stroke="#c4b5fd" strokeOpacity="0.5" strokeWidth="1" />
                )}
                <circle cx={n.x} cy={n.y} r={n.on ? 5.5 + n.fill * 3.5 : 3.6}
                  fill={n.on ? '#c4b5fd' : '#1e293b'} stroke={n.on ? '#a78bfa' : '#475569'} strokeWidth="1.1"
                  filter={n.on ? 'url(#ocGlow)' : undefined}
                  style={{ transition: 'r .5s cubic-bezier(.2,.7,.3,1), fill .5s, stroke .5s' }} />
                <text x={n.x} y={n.y - (n.on ? 15 : 12)} textAnchor="middle"
                  style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.13em',
                           fill: n.key === sel ? '#e2e8f0' : n.on ? '#a5b4fc' : '#475569',
                           transition: 'fill .4s', userSelect: 'none' }}>
                  {n.label.toUpperCase()}
                </text>
              </g>
            ))}
          </svg>
        </Box>

        {/* Panel contextual: lectura o editor de la región tocada */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!nodo ? (
            <>
              <Box component="p" sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em',
                                       textTransform: 'uppercase', color: C.trace, m: 0, mb: 1.25 }}>
                Cerebro del asistente
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Box component="span" sx={{ fontFamily: MONO, fontSize: { xs: 44, md: 56 }, lineHeight: 0.9,
                                            fontWeight: 600, color: C.bone, letterSpacing: '-0.04em',
                                            fontVariantNumeric: 'tabular-nums' }}>
                  {pct}<Box component="span" sx={{ fontSize: '0.42em', color: C.signal, ml: 0.5 }}>%</Box>
                </Box>
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 10.5, color: C.mute, lineHeight: 1.7 }}>
                  {activos}/8 INSTRUCCIONES<br />
                  {faqCount}/{faqMax} VERIFICADAS<br />
                  {listos.length} DOCUMENTOS · {chunks} PASAJES
                </Box>
              </Box>
              <Typography sx={{ ...SERIF, fontWeight: 600, fontSize: { xs: '1.3rem', md: '1.6rem' },
                                lineHeight: 1.15, color: C.bone, mt: 1.75, mb: 0.75 }}>
                {pct === 0 && !listos.length ? 'Todavía no sabe nada de ti'
                  : pct < 40 ? 'Empieza a reconocer tu consultorio'
                  : pct < 80 ? 'Ya responde con tu criterio'
                  : 'Sabe lo que tú sabes'}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: C.mute, lineHeight: 1.6, maxWidth: '52ch' }}>
                Toca un nodo de la red para enseñarle esa parte. Los apagados son lo que
                todavía no sabe — ahí es donde improvisa.
              </Typography>
            </>
          ) : (
            <>
              <Box component="p" sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em',
                                       textTransform: 'uppercase', color: C.trace, m: 0, mb: 1 }}>
                Región · {nodo.label}
              </Box>
              <Typography sx={{ ...SERIF, fontWeight: 600, fontSize: { xs: '1.2rem', md: '1.4rem' },
                                color: C.bone, lineHeight: 1.15, mb: 0.5 }}>
                {nodo.title}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: C.mute, mb: 1.75, maxWidth: '54ch', lineHeight: 1.5 }}>
                {nodo.hint}
              </Typography>
              <TextField
                inputRef={textRef}
                multiline minRows={4} maxRows={10} fullWidth size="small"
                value={fields[nodo.key] || ''}
                onChange={(e) => onChange?.(nodo.key, e.target.value)}
                inputProps={{ maxLength: limits[nodo.key] || 600 }}
                placeholder={nodo.ej}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={guardar} disabled={saving}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={{ bgcolor: C.signal, '&:hover': { bgcolor: C.signal, filter: 'brightness(1.1)' } }}>
                  {saving ? 'Asimilando…' : 'Enseñarle esto'}
                </Button>
                <Button onClick={() => setSel(null)} sx={{ color: C.mute }}>Volver a la red</Button>
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 10, color: C.dim, ml: 'auto' }}>
                  {(fields[nodo.key] || '').length}/{limits[nodo.key] || 600}
                </Box>
              </Box>
            </>
          )}

          {/* Registro */}
          <Box sx={{ mt: 'auto', pt: 2.5 }}>
            <Box component="p" sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em',
                                     textTransform: 'uppercase', color: C.dim, m: 0, mb: 0.75 }}>
              Registro
            </Box>
            <Box sx={{ borderTop: `1px solid ${C.line}`, pt: 1, minHeight: 66 }}>
              {log.length === 0 ? (
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>
                  Sin actividad en esta sesión.
                </Box>
              ) : log.map((l) => (
                <Box key={l.t} sx={{ fontFamily: MONO, fontSize: 11, color: C.mute, lineHeight: 1.85 }}>
                  <Box component="span" sx={{ color: C.trace }}>{l.k}</Box>
                  {' · '}{l.m}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
