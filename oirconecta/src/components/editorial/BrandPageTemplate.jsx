/**
 * BrandPageTemplate — Plantilla compartida para las 16 páginas de marca
 * (13 de audífonos + 3 de implantes). Diseño 2027: hero azul profundo y
 * herramientas de decisión (buscador por necesidad, comparador, guía de
 * formatos y preguntas para la cita). Cada página solo pasa data.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowForward, CheckCircleOutline, Check, Remove } from '@mui/icons-material';
import Header from '../Header';
import Footer from '../Footer';
import { C } from './EditorialKit';
import BrandLogo, { isBrand } from '../profesional/BrandLogo';
import { articulosDeMarca } from '../../data/articulosPorMarca';
import { OC, Pill, Eyebrow, FinalCta } from '../home/Home2027';
import { NEEDS, traitsOf, scoreProducts, STYLE_GUIDE, QUESTIONS } from './brandDecision';

const FONT = '"Gotham", "Helvetica", "Arial", sans-serif';
const wrap = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } };
const h2 = { fontFamily: FONT, fontSize: { xs: 28, md: 38 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance', m: 0 };
const lead = { fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.muted, maxWidth: 620 };

/* Silueta del formato: ilustra el estilo, no un modelo exacto. */
function StyleGlyph({ categoria, color = OC.blue }) {
  const c = (categoria || '').toLowerCase();
  let shape;
  if (c === 'bte' || c.includes('procesador')) {
    shape = <><path d="M52 18c14 0 22 10 22 24v26c0 10-7 16-15 16h-8c-6 0-10-5-10-11V30c0-7 4-12 11-12z" fill={color} /><path d="M50 22c-12 2-18 14-17 28" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /><circle cx="33" cy="52" r="5" fill={color} opacity=".7" /></>;
  } else if (c === 'ric') {
    shape = <><path d="M56 16c11 0 18 8 18 19v20c0 8-5 13-12 13h-5c-5 0-9-4-9-9V25c0-5 3-9 8-9z" fill={color} /><path d="M52 24c-14 4-20 18-18 34" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><ellipse cx="34" cy="62" rx="6" ry="7" fill={color} opacity=".75" /></>;
  } else if (c === 'itc' || c === 'cic' || c === 'iic') {
    const s = c === 'itc' ? 1 : 0.78;
    shape = <g transform={`translate(50 46) scale(${s}) translate(-50 -46)`}><path d="M34 34c6-10 26-12 34-2 7 9 3 24-8 28l-12 4c-9 3-18-4-18-13 0-6 1-12 4-17z" fill={color} /><circle cx="46" cy="44" r="4" fill="#fff" opacity=".6" /></g>;
  } else if (c.includes('off-the-ear')) {
    shape = <><circle cx="50" cy="46" r="24" fill={color} /><circle cx="50" cy="46" r="11" fill="#fff" opacity=".35" /></>;
  } else if (c.includes('ósea') || c.includes('osea')) {
    shape = <><rect x="34" y="28" width="32" height="38" rx="10" fill={color} /><circle cx="50" cy="47" r="6" fill="#fff" opacity=".5" /><path d="M22 47h8M70 47h8" stroke={color} strokeWidth="3" strokeLinecap="round" /></>;
  } else {
    shape = <><circle cx="50" cy="46" r="18" fill={color} /><path d="M50 64c0 10 6 14 14 16" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /></>;
  }
  return <svg viewBox="0 0 100 92" width="100%" height="100%" aria-hidden="true">{shape}</svg>;
}

function SectionHead({ eyebrow, title, text, light }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 680 }}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <Typography component="h2" sx={{ ...h2, color: light ? '#fff' : OC.text }}>{title}</Typography>
      {text && <Typography sx={{ ...lead, color: light ? OC.mist : OC.muted }}>{text}</Typography>}
    </Box>
  );
}
function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <Box key={i} component="strong" sx={{ fontWeight: 700, color: C.navy }}>{p.slice(2, -2)}</Box>;
    }
    return <React.Fragment key={i}>{p.replace(/\*\*/g, '')}</React.Fragment>;
  });
}

// Render markdown ligero para el formato controlado del contenido de marca
// (## títulos, párrafos y viñetas "- "). Evita cargar react-markdown aquí.
function BrandEditorialBody({ md, accent }) {
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push({ type: 'ul', items: list }); list = null; } };
  md.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith('## ')) { flush(); blocks.push({ type: 'h', text: line.slice(3) }); return; }
    if (line.startsWith('- ') || line.startsWith('* ')) { (list = list || []).push(line.slice(2)); return; }
    flush(); blocks.push({ type: 'p', text: line });
  });
  flush();
  return (
    <Box sx={{ columnGap: { md: 6 }, columnCount: { xs: 1 } }}>
      {blocks.map((b, i) => {
        if (b.type === 'h') return (
          <Box key={i} sx={{ mt: i ? 5 : 0, mb: 2, breakInside: 'avoid' }}>
            <Box sx={{ width: 40, height: 3, bgcolor: accent, borderRadius: 2, mb: 1.5 }} />
            <Typography component="h2" sx={{ fontFamily: '"Gotham", sans-serif', fontSize: { xs: '1.45rem', md: '1.75rem' }, fontWeight: 600, color: C.navy, lineHeight: 1.2 }}>{b.text}</Typography>
          </Box>
        );
        if (b.type === 'ul') return (
          <Box key={i} sx={{ my: 2.5, breakInside: 'avoid' }}>
            {b.items.map((it, j) => (
              <Box key={j} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
                <CheckCircleOutline sx={{ fontSize: 20, color: accent, mt: 0.3, flexShrink: 0 }} />
                <Typography sx={{ fontFamily: '"Gotham", sans-serif', fontSize: '1.05rem', color: C.gris, lineHeight: 1.7 }}>{renderInline(it)}</Typography>
              </Box>
            ))}
          </Box>
        );
        return (
          <Typography key={i} sx={{ fontFamily: '"Gotham", sans-serif', fontSize: '1.1rem', color: C.gris, lineHeight: 1.85, mb: 2.5, textAlign: 'justify', hyphens: 'auto' }}>{renderInline(b.text)}</Typography>
        );
      })}
    </Box>
  );
}

/* ── HERO ─────────────────────────────────────────────────────────── */
function BrandHero({ brand, productos, categoria, needs }) {
  const estilos = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];
  const allTraits = new Set(productos.flatMap((p) => [...traitsOf(p)]));
  const funciones = needs.filter((n) => allTraits.has(n.id));
  const kind = categoria === 'implantes' ? 'sistemas' : 'modelos';
  return (
    <Box component="section" sx={{ background: 'radial-gradient(120% 90% at 85% 15%, #2C3E8F 0%, #1B2550 55%, #141B3D 100%)', color: '#fff', pt: { xs: 5, md: 8 }, pb: { xs: 7, md: 10 } }}>
      <Box sx={wrap}>
        <Box component="nav" aria-label="Ruta" sx={{ fontFamily: FONT, fontSize: 13, color: OC.sky, mb: { xs: 3, md: 5 }, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box component={RouterLink} to="/" sx={{ color: OC.sky, textDecoration: 'none', '&:hover': { color: '#fff' } }}>Inicio</Box>
          <span aria-hidden="true">/</span>
          <Box component={RouterLink} to={`/${categoria}/`} sx={{ color: OC.sky, textDecoration: 'none', '&:hover': { color: '#fff' } }}>{categoria === 'implantes' ? 'Implantes' : 'Marcas'}</Box>
          <span aria-hidden="true">/</span>
          <span style={{ color: '#fff' }}>{brand.nombre}</span>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.15fr) minmax(0,0.85fr)' }, gap: { xs: 5, md: 7 }, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {brand.eslogan && <Eyebrow light>{brand.eslogan}</Eyebrow>}
            <Typography component="h1" sx={{ fontFamily: FONT, fontWeight: 900, fontSize: { xs: 40, md: 64 }, lineHeight: 1.02, letterSpacing: '-.02em', m: 0 }}>
              {brand.nombre}
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 18, lineHeight: 1.6, color: OC.mist, maxWidth: 560 }}>{brand.descripcion}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Pill href="#encuentra" variant="bright">Encontrar mi {categoria === 'implantes' ? 'opción' : 'modelo'}</Pill>
              <Pill to="/agendar" variant="ghost">Agendar valoración sin costo</Pill>
            </Box>
          </Box>
          <Box sx={{ bgcolor: '#fff', color: OC.text, borderRadius: '28px', p: { xs: 3, md: 4 }, boxShadow: '0 30px 70px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${OC.line}`, pb: 3 }}>
              {isBrand(brand.nombre)
                ? <BrandLogo brand={brand.nombre} height={56} layout="row" />
                : <Box component="img" src={brand.logo} alt={brand.nombre} sx={{ maxHeight: 64, maxWidth: '80%', objectFit: 'contain' }} />}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: FONT, fontSize: 40, fontWeight: 900, lineHeight: 1, color: OC.blue }}>{productos.length}</Typography>
                <Typography sx={{ fontFamily: FONT, fontSize: 13, color: OC.muted, mt: .5 }}>{kind} en esta guía</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: FONT, fontSize: 40, fontWeight: 900, lineHeight: 1, color: OC.blue }}>{estilos.length}</Typography>
                <Typography sx={{ fontFamily: FONT, fontSize: 13, color: OC.muted, mt: .5 }}>{estilos.length === 1 ? 'formato' : 'formatos'} disponibles</Typography>
              </Box>
            </Box>
            {funciones.length > 0 && (
              <Box>
                <Typography sx={{ fontFamily: FONT, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: OC.muted, fontWeight: 700, mb: 1.25 }}>Lo que ofrece la línea</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {funciones.map((f) => <Box key={f.id} component="span" sx={{ fontFamily: FONT, fontSize: 13, px: 1.5, py: .75, borderRadius: 999, bgcolor: OC.wash, color: '#272F50' }}>{f.short}</Box>)}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ── BUSCADOR POR NECESIDAD + MODELOS ─────────────────────────────── */
function ModelCard({ r, selected, needs, brand }) {
  const { p, hits, t } = r;
  const top = selected.length > 0 && hits.length === selected.length;
  return (
    <Box component="article" sx={{
      bgcolor: '#fff', borderRadius: '24px', border: `1.5px solid ${top ? OC.bright : OC.line}`,
      boxShadow: top ? '0 18px 40px rgba(76,125,240,.18)' : 'none',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all .25s ease',
      opacity: selected.length && hits.length === 0 ? 0.55 : 1,
    }}>
      <Box sx={{ position: 'relative', bgcolor: OC.wash, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        {p.imagen
          ? <Box component="img" src={p.imagen} alt={p.nombre} loading="lazy" sx={{ maxHeight: '100%', maxWidth: '80%', objectFit: 'contain' }} />
          : <Box sx={{ width: 110, height: 100 }}><StyleGlyph categoria={p.categoria} /></Box>}
        <Box component="span" sx={{ position: 'absolute', top: 14, left: 14, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', bgcolor: '#fff', color: OC.blue, px: 1.25, py: .5, borderRadius: 999 }}>{p.categoria}</Box>
        {top && <Box component="span" sx={{ position: 'absolute', top: 14, right: 14, fontFamily: FONT, fontSize: 11, fontWeight: 700, bgcolor: OC.bright, color: '#fff', px: 1.25, py: .5, borderRadius: 999 }}>Mejor coincidencia</Box>}
        {!top && p.destacado && !selected.length && <Box component="span" sx={{ position: 'absolute', top: 14, right: 14, fontFamily: FONT, fontSize: 11, fontWeight: 700, bgcolor: OC.deep, color: '#fff', px: 1.25, py: .5, borderRadius: 999 }}>Lo más reciente</Box>}
      </Box>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: OC.text }}>{p.nombre}</Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.55, color: OC.muted }}>{p.descripcion}</Typography>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: .75 }}>
          {(p.caracteristicas || []).map((c) => (
            <Box component="li" key={c} sx={{ display: 'flex', gap: 1, fontFamily: FONT, fontSize: 13.5, color: OC.text, lineHeight: 1.45 }}>
              <CheckCircleOutline sx={{ fontSize: 17, color: OC.blue, mt: '1px' }} />{c}
            </Box>
          ))}
        </Box>
        {selected.length > 0 && (
          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: `1px solid ${OC.line}`, display: 'flex', flexWrap: 'wrap', gap: .75 }}>
            {selected.map((id) => {
              const n = needs.find((x) => x.id === id);
              const ok = t.has(id);
              return <Box key={id} component="span" sx={{ fontFamily: FONT, fontSize: 12, px: 1.25, py: .5, borderRadius: 999, bgcolor: ok ? '#E6F4EF' : '#F1F2F6', color: ok ? OC.ok : '#6B7280' }}>{ok ? '✓' : '–'} {n?.short}</Box>;
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Finder({ brand, productos, needs, categoria }) {
  const [sel, setSel] = useState([]);
  const available = useMemo(() => {
    const all = new Set(productos.flatMap((p) => [...traitsOf(p)]));
    return needs.filter((n) => all.has(n.id));
  }, [productos, needs]);
  const ranked = scoreProducts(productos, sel);
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const best = sel.length ? ranked.filter((r) => r.hits.length === sel.length).length : 0;
  return (
    <Box component="section" id="encuentra" sx={{ py: { xs: 8, md: 11 }, scrollMarginTop: 90 }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SectionHead
          eyebrow={categoria === 'implantes' ? 'Encuentra tu opción' : 'Encuentra tu modelo'}
          title="¿Qué es lo más importante para ti?"
          text={`Marca lo que necesitas y ordenamos los ${categoria === 'implantes' ? 'sistemas' : 'modelos'} de ${brand.nombre} según lo que ofrecen. Es una guía para llegar mejor preparado: la recomendación final la da tu especialista con tu audiometría.`}
        />
        <Box role="group" aria-label="Necesidades" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {available.map((n) => {
            const on = sel.includes(n.id);
            return (
              <Box key={n.id} component="button" type="button" aria-pressed={on} onClick={() => toggle(n.id)} sx={{
                fontFamily: FONT, fontSize: 14, fontWeight: 700, minHeight: 44, px: 2.25, borderRadius: 999, cursor: 'pointer',
                bgcolor: on ? OC.deep : '#fff', color: on ? '#fff' : OC.text, border: `1.5px solid ${on ? OC.deep : OC.line}`,
                transition: 'all .2s ease', '&:hover': { borderColor: OC.deep },
                '&:focus-visible': { outline: `3px solid ${OC.sky}`, outlineOffset: 3 },
              }}>{on ? '✓ ' : ''}{n.label}</Box>
            );
          })}
          {sel.length > 0 && (
            <Box component="button" type="button" onClick={() => setSel([])} sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, minHeight: 44, px: 2, border: 'none', bgcolor: 'transparent', color: OC.blue, cursor: 'pointer', textDecoration: 'underline' }}>Limpiar</Box>
          )}
        </Box>
        <Typography aria-live="polite" sx={{ fontFamily: FONT, fontSize: 14, color: OC.muted, minHeight: 21 }}>
          {sel.length === 0 ? `Mostrando los ${productos.length} ${categoria === 'implantes' ? 'sistemas' : 'modelos'}.`
            : best > 0 ? `${best} ${best === 1 ? 'coincide' : 'coinciden'} con todo lo que marcaste.`
              : 'Ninguno reúne todo lo que marcaste; te mostramos los más cercanos primero.'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', md: `repeat(${Math.min(productos.length, 4)}, minmax(0,1fr))` }, gap: 2.5 }}>
          {ranked.map((r) => <ModelCard key={r.p.nombre} r={r} selected={sel} needs={needs} brand={brand} />)}
        </Box>
      </Box>
    </Box>
  );
}

/* ── COMPARADOR ───────────────────────────────────────────────────── */
function Compare({ productos, needs }) {
  const rows = needs.filter((n) => productos.some((p) => traitsOf(p).has(n.id)));
  if (productos.length < 2 || rows.length === 0) return null;
  return (
    <Box component="section" sx={{ pb: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SectionHead eyebrow="Comparar" title="Lado a lado, sin letra pequeña." text="Resumen de lo que cada uno declara en su ficha. Si una celda está vacía, pregúntale a tu especialista: puede depender de la versión o del accesorio." />
        <Box sx={{ overflowX: 'auto', borderRadius: '24px', border: `1px solid ${OC.line}`, bgcolor: '#fff' }}>
          <Box component="table" sx={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontFamily: FONT, fontSize: 14 }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" scope="col" sx={{ textAlign: 'left', p: 2.5, color: OC.muted, fontWeight: 700, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: `1px solid ${OC.line}` }}>Característica</Box>
                {productos.map((p) => (
                  <Box component="th" scope="col" key={p.nombre} sx={{ textAlign: 'center', p: 2.5, color: OC.text, fontWeight: 700, borderBottom: `1px solid ${OC.line}` }}>
                    {p.nombre}<Box sx={{ fontWeight: 400, fontSize: 12, color: OC.muted, mt: .5 }}>{p.categoria}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {rows.map((n, i) => (
                <Box component="tr" key={n.id} sx={{ bgcolor: i % 2 ? '#fff' : OC.ground }}>
                  <Box component="th" scope="row" sx={{ textAlign: 'left', p: 2.25, fontWeight: 400, color: OC.text }}>{n.short}</Box>
                  {productos.map((p) => {
                    const ok = traitsOf(p).has(n.id);
                    return (
                      <Box component="td" key={p.nombre} sx={{ textAlign: 'center', p: 2.25 }}>
                        {ok ? <Check sx={{ color: OC.ok, fontSize: 22 }} aria-label="Sí" /> : <Remove sx={{ color: '#C3CDE6', fontSize: 20 }} aria-label="No indicado" />}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ── GUÍA DE FORMATOS ─────────────────────────────────────────────── */
function StyleGuide({ productos, categoria }) {
  const keys = [...new Set(productos.map((p) => (p.categoria === 'IIC' ? 'CIC' : p.categoria)))].filter((k) => STYLE_GUIDE[k]);
  if (!keys.length) return null;
  return (
    <Box component="section" sx={{ bgcolor: OC.deep, color: '#fff', py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <SectionHead light eyebrow="Guía de formatos" title={categoria === 'implantes' ? '¿Qué tipo de sistema es para ti?' : '¿Qué formato es para ti?'} text="El formato depende de tu tipo de pérdida, la forma de tu oído y tu rutina. Esto te ayuda a entender las opciones antes de la cita." />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(keys.length, 3)}, minmax(0,1fr))` }, gap: 2.5 }}>
          {keys.map((k) => {
            const g = STYLE_GUIDE[k];
            return (
              <Box key={k} sx={{ bgcolor: 'rgba(255,255,255,.06)', border: '1px solid rgba(157,184,255,.2)', borderRadius: '24px', p: 3.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 56, height: 52, flexShrink: 0 }}><StyleGlyph categoria={k} color={OC.sky} /></Box>
                  <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>{g.nombre}</Typography>
                </Box>
                <Typography sx={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.55, color: OC.mist }}><Box component="strong" sx={{ color: '#fff' }}>Ideal para: </Box>{g.para}</Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: .75 }}>
                  {g.pros.map((x) => <Box component="li" key={x} sx={{ display: 'flex', gap: 1, fontFamily: FONT, fontSize: 14, color: '#fff' }}><Check sx={{ fontSize: 18, color: OC.sky }} />{x}</Box>)}
                </Box>
                <Typography sx={{ mt: 'auto', fontFamily: FONT, fontSize: 13.5, lineHeight: 1.5, color: OC.sky, borderTop: '1px solid rgba(157,184,255,.2)', pt: 1.75 }}>A tener en cuenta: {g.ojo}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

/* ── TECNOLOGÍA ───────────────────────────────────────────────────── */
function Tech({ tecnologias, brand }) {
  if (!tecnologias.length) return null;
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SectionHead eyebrow="Tecnología" title={`Lo que distingue a ${brand.nombre}.`} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', md: `repeat(${Math.min(tecnologias.length, 4)}, minmax(0,1fr))` }, gap: 2.5 }}>
          {tecnologias.map(({ Icon, titulo, descripcion }) => (
            <Box key={titulo} sx={{ bgcolor: '#fff', border: `1px solid ${OC.line}`, borderRadius: '24px', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: OC.wash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon && <Icon sx={{ color: OC.blue }} />}</Box>
              <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: OC.text }}>{titulo}</Typography>
              <Typography sx={{ fontFamily: FONT, fontSize: 14.5, lineHeight: 1.55, color: OC.muted }}>{descripcion}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ── PREGUNTAS PARA LA CITA ───────────────────────────────────────── */
function Questions({ categoria, brand }) {
  const qs = QUESTIONS[categoria] || QUESTIONS.audifonos;
  return (
    <Box component="section" sx={{ bgcolor: OC.wash, py: { xs: 8, md: 10 } }}>
      <Box sx={{ ...wrap, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,.9fr) minmax(0,1.1fr)' }, gap: { xs: 4, md: 7 }, alignItems: 'start' }}>
        <SectionHead eyebrow="Antes de decidir" title="Lleva estas preguntas a tu cita." text={`Te ayudan a comparar ${brand.nombre} con otras opciones con criterio propio, sin presión.`} />
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {qs.map((q, i) => (
            <Box component="li" key={q} sx={{ bgcolor: '#fff', borderRadius: '18px', px: 2.5, py: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: OC.deep, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</Box>
              <Typography sx={{ fontFamily: FONT, fontSize: 15.5, color: OC.text, lineHeight: 1.45 }}>{q}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function BrandPageTemplate({
  brand, productos = [], tecnologias = [],
  categoria = 'audifonos',
  seoTitle, seoDescription, canonical,
}) {
  const [editorial, setEditorial] = useState(null);
  useEffect(() => {
    if (!brand.slug) return;
    const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';
    fetch(`${API}/api/brands/${brand.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data?.contenidoMd) setEditorial(j.data.contenidoMd); })
      .catch(() => {});
  }, [brand.slug]);
  const baseUrl = `https://oirconecta.com/${categoria}/${brand.slug || ''}`;
  const canon = (canonical || baseUrl).replace(/\/?$/, '/');
  const needs = NEEDS[categoria] || NEEDS.audifonos;
  const lecturas = articulosDeMarca(brand.slug);

  return (
    <Box component="main" sx={{ bgcolor: OC.ground, minHeight: '100vh' }}>
      <Helmet>
        <title>{seoTitle || `Audífonos ${brand.nombre} en Colombia — OírConecta`}</title>
        <meta name="description" content={seoDescription || `Conoce los audífonos ${brand.nombre} disponibles en Colombia. ${brand.eslogan}.`} />
        <link rel="canonical" href={canon} />
        <meta property="og:title" content={seoTitle || `${brand.nombre} — OírConecta`} />
        <meta property="og:url" content={canon} />
      </Helmet>

      <Header />
      <BrandHero brand={brand} productos={productos} categoria={categoria} needs={needs} />
      {productos.length > 0 && <Finder brand={brand} productos={productos} needs={needs} categoria={categoria} />}
      <Compare productos={productos} needs={needs} />
      <StyleGuide productos={productos} categoria={categoria} />
      <Tech tecnologias={tecnologias} brand={brand} />

      {editorial && (
        <Box component="section" sx={{ pb: { xs: 8, md: 11 } }}>
          <Box sx={{ ...wrap, maxWidth: 880 }}>
            <Box sx={{ mb: 4 }}><SectionHead eyebrow="La marca" title={`Conoce ${brand.nombre}`} /></Box>
            <Box sx={{ bgcolor: '#fff', borderRadius: '28px', p: { xs: 3, md: 6 }, border: `1px solid ${OC.line}` }}>
              <BrandEditorialBody md={editorial} accent={OC.blue} />
            </Box>
          </Box>
        </Box>
      )}

      <Questions categoria={categoria} brand={brand} />

      {lecturas.length > 0 && (
        <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
          <Box sx={{ ...wrap, maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionHead eyebrow="Para leer antes de decidir" title="Guías relacionadas" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {lecturas.map((a) => (
                <Box key={a.slug} component={RouterLink} to={`/blog/${a.slug}/`} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                  bgcolor: '#fff', border: `1px solid ${OC.line}`, borderRadius: '18px', px: 3, py: 2.25,
                  color: OC.text, textDecoration: 'none', fontFamily: FONT, fontSize: 16, fontWeight: 700,
                  transition: 'all .2s ease', '&:hover': { borderColor: OC.blue, transform: 'translateX(4px)' },
                }}>
                  {a.titulo}<ArrowForward sx={{ fontSize: 18, color: OC.blue, flexShrink: 0 }} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <FinalCta />
      <Box sx={{ bgcolor: OC.deep, pb: 6, textAlign: 'center' }}>
        <Box component={RouterLink} to={`/${categoria}/`} sx={{ fontFamily: FONT, fontSize: 14, color: OC.sky, '&:hover': { color: '#fff' } }}>
          ← Ver todas las {categoria === 'implantes' ? 'marcas de implantes' : 'marcas'}
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
