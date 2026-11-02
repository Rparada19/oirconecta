import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { getWhatsAppHref } from '../../config/publicSite';

export const OC = {
  deep: '#1B2550',
  deeper: '#141B3D',
  blue: '#4054B2',
  bright: '#4C7DF0',
  sky: '#9DB8FF',
  mist: '#C3CDE6',
  wash: '#E8EEFF',
  ground: '#F6F8FD',
  line: '#DDE3F3',
  text: '#1B2550',
  muted: '#4A5478',
  ok: '#085946',
};

const FONT = '"Gotham", "Helvetica", "Arial", sans-serif';

const keyframes = {
  '@keyframes ocSpin': { from: { transform: 'rotateX(68deg) rotateZ(0deg)' }, to: { transform: 'rotateX(68deg) rotateZ(360deg)' } },
  '@keyframes ocPulse': { '0%,100%': { transform: 'scale(1)', opacity: 0.9 }, '50%': { transform: 'scale(1.06)', opacity: 1 } },
  '@keyframes ocFloat': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
  '@keyframes ocEq': { '0%,100%': { transform: 'scaleY(.45)' }, '50%': { transform: 'scaleY(1)' } },
  '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } },
};

const wrap = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } };

export function Eyebrow({ children, light }) {
  return (
    <Typography component="span" sx={{ fontFamily: FONT, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: light ? OC.sky : OC.blue }}>
      {children}
    </Typography>
  );
}

export function Pill({ to, href, children, variant = 'bright', sx }) {
  const styles = {
    bright: { bgcolor: OC.bright, color: '#fff', '&:hover': { bgcolor: OC.blue } },
    white: { bgcolor: '#fff', color: OC.deep, '&:hover': { bgcolor: OC.wash } },
    deep: { bgcolor: OC.deep, color: '#fff', '&:hover': { bgcolor: OC.blue } },
    ghost: { color: '#fff', border: '1.5px solid rgba(255,255,255,.35)', '&:hover': { borderColor: '#fff' } },
    ghostDark: { color: OC.deep, border: `1.5px solid ${OC.line}`, '&:hover': { borderColor: OC.deep } },
  }[variant];
  const linkProps = to ? { component: RouterLink, to } : href?.startsWith('#') ? { component: 'a', href } : { component: 'a', href, target: '_blank', rel: 'noopener noreferrer' };
  return (
    <Box {...linkProps} sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 48,
      fontFamily: FONT, fontWeight: 700, fontSize: 15, textDecoration: 'none',
      px: 3.25, py: 1.75, borderRadius: 999, transition: 'all .2s ease',
      '&:focus-visible': { outline: `3px solid ${OC.sky}`, outlineOffset: 3 },
      ...styles, ...sx,
    }}>
      {children}
    </Box>
  );
}

/* ── 1. HERO con esfera de sonido 3D ─────────────────────────────── */
/* Momentos que vuelven: tarjetas que orbitan sobre las ondas */
const MOMENTS = [
  { img: '/img/abuela-nieta-riendo.jpg', text: 'Volver a reírte de sus chistes' },
  { img: '/img/blog/2027/musica-audifonos.webp', text: 'Disfrutar otra vez la música en vivo' },
  { img: '/img/blog/2027/presbiacusia.webp', text: 'No perderte ninguna charla' },
  { img: '/img/blog/2027/adaptacion-audifonos-primeras-semanas.webp', text: 'Oír los pájaros en la mañana' },
  { img: '/img/blog/2027/bluetooth-audifonos-celular.webp', text: 'Hablar por teléfono sin repetir' },
  { img: '/img/blog/2027/audifonos-demencia.webp', text: 'Jugar y conversar con tus nietos' },
];

function OrbitCards() {
  const refs = useRef([]);
  const box = useRef(null);
  const paused = useRef(false);
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const geo = { rx: 205, ry: 84, n: MOMENTS.length };
    const measure = () => {
      const w = box.current?.offsetWidth || 600;
      const sm = w < 560;
      setSmall(sm);
      const card = sm ? 104 : 136;
      geo.rx = Math.min(205, w / 2 - card / 2 - 8);
      geo.ry = sm ? geo.rx * 0.78 : 84;
      geo.n = sm ? 4 : MOMENTS.length;
    };
    measure();
    window.addEventListener('resize', measure);
    const n = MOMENTS.length;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf; let angle = 0; let last = performance.now();
    const place = () => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        if (i >= geo.n) { el.style.display = 'none'; return; }
        el.style.display = '';
        const a = angle + (i * 2 * Math.PI) / geo.n;
        const x = Math.cos(a) * geo.rx;
        const y = Math.sin(a) * geo.ry;
        const depth = (Math.sin(a) + 1) / 2; // 0 atrás · 1 adelante
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${0.62 + depth * 0.4})`;
        el.style.zIndex = depth > 0.5 ? 3 : 1;
        el.style.opacity = String(0.45 + depth * 0.55);
        el.style.filter = depth < 0.35 ? 'blur(1px)' : 'none';
      });
    };
    const tick = (now) => {
      if (!paused.current) angle += ((now - last) / 1000) * 0.22;
      last = now; place(); raf = requestAnimationFrame(tick);
    };
    place();
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, []);
  return (
    <Box ref={box} onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}
      sx={{ position: 'absolute', inset: 0 }}>
      {MOMENTS.map((m, i) => (
        <Box key={m.img} ref={(el) => { refs.current[i] = el; }} sx={{
          position: 'absolute', left: "50%", top: "50%", width: small ? 104 : 136,
          bgcolor: '#fff', borderRadius: '18px', p: '7px', boxShadow: '0 20px 44px rgba(0,0,0,.32)',
          willChange: 'transform, opacity',
        }}>
          <Box component="img" src={m.img} alt="" loading="lazy" sx={{ width: '100%', height: small ? 84 : 116, objectFit: 'cover', borderRadius: small ? '10px' : '12px', display: 'block' }} />
          <Typography sx={{ fontFamily: FONT, fontSize: small ? 10.5 : 12, fontWeight: 700, color: OC.deep, lineHeight: 1.35, m: '7px 5px 3px' }}>{m.text}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function SoundOrb() {
  const rings = [
    { s: 440, d: 14, c: 'rgba(157,184,255,.55)', r: false },
    { s: 360, d: 18, c: 'rgba(157,184,255,.35)', r: true },
    { s: 280, d: 24, c: 'rgba(255,255,255,.22)', r: false },
    { s: 520, d: 30, c: 'rgba(157,184,255,.18)', r: true },
  ];
  return (
    <Box aria-hidden sx={{ position: 'relative', height: { xs: 330, sm: 460, md: 520 }, perspective: '900px', overflow: 'visible' }}>
      {rings.map((r) => (
        <Box key={r.s} sx={{
          position: 'absolute', inset: 0, m: 'auto', width: { xs: r.s * 0.62, sm: r.s * 0.85, md: r.s }, height: { xs: r.s * 0.62, sm: r.s * 0.85, md: r.s }, borderRadius: '50%',
          border: `1.5px solid ${r.c}`, transformStyle: 'preserve-3d',
          animation: `ocSpin ${r.d}s linear infinite`, animationDirection: r.r ? 'reverse' : 'normal',
        }} />
      ))}
      <Box sx={{
        position: 'absolute', inset: 0, m: 'auto', width: { xs: 110, sm: 180, md: 210 }, height: { xs: 110, sm: 180, md: 210 }, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #9DB8FF 0%, #4C7DF0 45%, #2C3E8F 100%)',
        boxShadow: '0 0 90px rgba(76,125,240,.55)', animation: 'ocPulse 3.2s ease-in-out infinite', zIndex: 2,
      }} />
      <Box sx={{ position: 'absolute', inset: 0, m: 'auto', width: 120, height: 64, zIndex: 2, transform: { xs: 'scale(.55)', sm: 'scale(.8)', md: 'none' }, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '7px' }}>
        {[30, 52, 64, 44, 26].map((h, i) => (
          <Box key={i} sx={{ width: 8, height: h, bgcolor: '#fff', borderRadius: 1, transformOrigin: 'bottom', animation: 'ocEq 1.6s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </Box>
      <OrbitCards />
    </Box>
  );
}

function Hero() {
  return (
    <Box component="section" sx={{ background: 'radial-gradient(120% 90% at 80% 20%, #2C3E8F 0%, #1B2550 55%, #141B3D 100%)', color: '#fff', pt: { xs: 7, md: 9 }, pb: { xs: 8, md: 12 }, overflow: 'hidden' }}>
      <Box sx={{ ...wrap, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.05fr) minmax(0,1fr)' }, gap: 6, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box component="span" sx={{ alignSelf: 'flex-start', fontFamily: FONT, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: OC.sky, border: '1px solid rgba(157,184,255,.4)', px: 1.75, py: 1, borderRadius: 999 }}>
            Salud auditiva en Bogotá
          </Box>
          <Typography component="h1" sx={{ fontFamily: FONT, fontWeight: 900, fontSize: { xs: 40, md: 60 }, lineHeight: 1.04, letterSpacing: '-.02em', textWrap: 'balance', m: 0 }}>
            Volver a escuchar a los tuyos empieza con una conversación.
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 18, lineHeight: 1.6, color: OC.mist, maxWidth: 520 }}>
            Te acompañamos desde la primera duda hasta tu adaptación: audiólogas verificadas, información clara y un plan pensado para tu vida.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Pill to="/agendar">Agendar valoración sin costo</Pill>
            <Pill to="/ponte-en-sus-oidos" variant="ghost">Probar el simulador</Pill>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, fontFamily: FONT, fontSize: 13, color: OC.sky }}>
            <span>✓ Audiólogas verificadas</span><span>✓ Atención los sábados</span><span>✓ Recibimos pacientes EPS</span>
          </Box>
        </Box>
        <SoundOrb />
      </Box>
    </Box>
  );
}

/* ── 2. RUTAS ─────────────────────────────────────────────────────── */
const PATHS = [
  { to: '/agendar', title: 'Quiero escuchar mejor', text: 'Conoce cómo está tu audición con una valoración sin costo y recibe un plan claro, sin presión.', cta: 'Agendar mi valoración', icon: <><path d="M6 9a6 6 0 1 1 10.6 3.9c-1 1.2-1.6 2-1.6 3.6A3 3 0 0 1 9 17" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0" /></> },
  { to: '/ponte-en-sus-oidos', title: 'Me preocupa un familiar', text: 'Escucha el mundo como lo escucha tu mamá o tu papá, y aprende a dar el primer paso juntos.', cta: 'Probar el simulador', featured: true, icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></> },
  { to: '/registro-profesional', title: 'Soy profesional auditivo', text: 'Haz visible tu práctica en el directorio y conecta con pacientes que ya buscan un especialista.', cta: 'Unirme a la red', icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M12 11v5M9.5 13.5h5" /></> },
];

function Paths() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 640 }}>
          <Eyebrow>¿Por dónde empiezas?</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 30, md: 40 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance' }}>Cada historia de audición es distinta. Elige la tuya.</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 2.5 }}>
          {PATHS.map((p) => (
            <Box key={p.title} component={RouterLink} to={p.to} sx={{
              textDecoration: 'none', borderRadius: '24px', p: 4, display: 'flex', flexDirection: 'column', gap: 1.75,
              bgcolor: p.featured ? OC.blue : '#fff', color: p.featured ? '#fff' : OC.text, border: p.featured ? 'none' : `1px solid ${OC.line}`,
              transition: 'transform .25s ease, box-shadow .25s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 40px rgba(27,37,80,.12)' },
            }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: p.featured ? 'rgba(255,255,255,.15)' : OC.wash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={p.featured ? '#fff' : OC.blue} strokeWidth="2" aria-hidden="true">{p.icon}</svg>
              </Box>
              <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 22, fontWeight: 700 }}>{p.title}</Typography>
              <Typography sx={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.6, color: p.featured ? '#D5DDF0' : OC.muted }}>{p.text}</Typography>
              <Typography sx={{ mt: 'auto', fontFamily: FONT, fontWeight: 700, fontSize: 14, color: p.featured ? '#fff' : OC.blue }}>{p.cta} →</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ── 3. SIMULADOR ─────────────────────────────────────────────────── */
const GRADES = [
  { id: 'normal', label: 'Normal', db: '0–20 dB', text: 'Escuchas la conversación completa, con todos sus matices.', blur: 'none' },
  { id: 'leve', label: 'Leve', db: '21–40 dB', text: 'Las voces suaves y los susurros empiezan a perderse.', blur: 'blur(1px)' },
  { id: 'moderada', label: 'Moderada', db: '41–70 dB', text: 'Entiendes a medias en la mesa familiar; pides que te repitan.', blur: 'blur(2.5px) saturate(.8)' },
  { id: 'severa', label: 'Severa', db: '71–90 dB', text: 'Solo llegan las voces fuertes; la conversación se vuelve cansada.', blur: 'blur(4px) saturate(.6)' },
  { id: 'profunda', label: 'Profunda', db: '91+ dB', text: 'El sonido casi desaparece; aparece el aislamiento.', blur: 'blur(6px) saturate(.4)' },
];

function Simulator() {
  const [g, setG] = useState('moderada');
  const cur = GRADES.find((x) => x.id === g);
  return (
    <Box component="section" id="simulador" sx={{ pb: { xs: 8, md: 11 } }}>
      <Box sx={wrap}>
        <Box sx={{ bgcolor: OC.deep, color: '#fff', borderRadius: '32px', overflow: 'hidden', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr)' } }}>
          <Box sx={{ p: { xs: 4, md: 7 }, display: 'flex', flexDirection: 'column', gap: 2.75 }}>
            <Eyebrow light>Simulador OírAsí</Eyebrow>
            <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 30, md: 38 }, fontWeight: 900, lineHeight: 1.1, textWrap: 'balance' }}>Ponte en sus oídos por un minuto.</Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.mist }}>Elige un nivel de pérdida auditiva y descubre cómo vive una conversación familiar quien la tiene.</Typography>
            <Box role="group" aria-label="Nivel de pérdida auditiva" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {GRADES.map((x) => {
                const on = x.id === g;
                return (
                  <Box key={x.id} component="button" type="button" aria-pressed={on} onClick={() => setG(x.id)} sx={{
                    fontFamily: FONT, fontSize: 14, fontWeight: 700, px: 2, py: 1.25, minHeight: 44, borderRadius: 999, cursor: 'pointer',
                    bgcolor: on ? '#fff' : 'transparent', color: on ? OC.deep : '#fff', border: on ? '1.5px solid #fff' : '1.5px solid rgba(255,255,255,.35)',
                    '&:focus-visible': { outline: `3px solid ${OC.sky}`, outlineOffset: 3 },
                  }}>{x.label}</Box>
                );
              })}
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,.07)', borderRadius: '18px', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }} aria-live="polite">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 13, color: OC.sky }}><span>Nivel: {cur.label}</span><span>{cur.db}</span></Box>
              <Typography sx={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.55 }}>{cur.text}</Typography>
            </Box>
            <Pill to="/ponte-en-sus-oidos" variant="white" sx={{ alignSelf: 'flex-start' }}>Escuchar la simulación</Pill>
          </Box>
          <Box sx={{ position: 'relative', minHeight: { xs: 320, md: 420 } }}>
            <Box component="img" src="/img/familia-disfrutando-mejor-audicion.jpg" alt="Familia conversando junta" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: cur.blur, transition: 'filter .5s ease' }} />
            <Box sx={{ position: 'absolute', left: 24, right: 24, bottom: 24, bgcolor: 'rgba(27,37,80,.82)', borderRadius: '16px', px: 2.5, py: 2.25 }}>
              <Typography sx={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.5 }}>“Pensé que mi mamá ya no me quería oír. Cuando lo probé en el simulador, entendí que el problema no era yo.”</Typography>
              <Typography sx={{ fontFamily: FONT, fontSize: 12, color: OC.sky, mt: 1 }}>Hija · Bogotá</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ── 4. CÓMO FUNCIONA ─────────────────────────────────────────────── */
const STEPS = [
  { t: 'Agenda en minutos', d: 'Elige día y hora, incluso sábados. Si eres paciente EPS, no necesitas llevar carné.' },
  { t: 'Valoración con tu audióloga', d: 'Una evaluación completa, explicada sin tecnicismos, para entender qué escuchas y qué no.' },
  { t: 'Acompañamiento continuo', d: 'Si necesitas una solución auditiva, te acompañamos en la adaptación y en cada control.' },
];

function HowItWorks() {
  return (
    <Box component="section" sx={{ pb: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 640 }}>
          <Eyebrow>Cómo funciona</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 30, md: 40 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance' }}>Tres pasos, una misma persona a tu lado.</Typography>
        </Box>
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 2.5 }}>
          {STEPS.map((s, i) => (
            <Box component="li" key={s.t} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 3, borderTop: `2px solid ${OC.blue}` }}>
              <Typography sx={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, color: OC.mist, lineHeight: 1 }}>{i + 1}</Typography>
              <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: OC.text }}>{s.t}</Typography>
              <Typography sx={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.6, color: OC.muted }}>{s.d}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ── 5. ESPECIALISTAS ─────────────────────────────────────────────── */
function Specialists() {
  const tags = ['Valoración auditiva', 'Otorrinolaringología', 'Implantes cocleares', 'Acompañamiento posadaptación'];
  return (
    <Box component="section" sx={{ pb: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr)' }, gap: { xs: 5, md: 7 }, alignItems: 'center' }}>
        <Box sx={{ position: 'relative' }}>
          <Box component="img" src="/img/audiologa-atendiendo-paciente.jpg" alt="Audióloga realizando una valoración auditiva" loading="lazy" sx={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '28px', display: 'block' }} />
          <Box sx={{ position: 'absolute', right: { xs: 12, md: -12 }, top: 24, bgcolor: '#fff', borderRadius: '16px', px: 2.25, py: 1.75, boxShadow: '0 18px 40px rgba(27,37,80,.15)', display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: OC.ok }} />
            <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: OC.text }}>Profesional verificada</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Eyebrow>Especialistas</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 30, md: 40 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance' }}>Personas que escuchan antes de recomendar.</Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.muted }}>Audiólogas, otorrinos y fonoaudiólogos verificados. Revisamos su formación y su práctica para que llegues a manos de confianza.</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((t) => <Box key={t} component="span" sx={{ fontFamily: FONT, fontSize: 13, px: 1.75, py: 1, borderRadius: 999, bgcolor: OC.wash, color: '#272F50' }}>{t}</Box>)}
          </Box>
          <Pill to="/directorio/" variant="deep" sx={{ alignSelf: 'flex-start' }}>Encontrar un especialista</Pill>
        </Box>
      </Box>
    </Box>
  );
}

/* ── 6. TESTIMONIOS ───────────────────────────────────────────────── */
const QUOTES = [
  { q: 'En 45 minutos me hicieron la prueba y me explicaron todo sin tecnicismos. Por primera vez sentí que entendí mi diagnóstico.', a: 'Paciente · Bogotá' },
  { q: 'Probé tres centros antes de encontrar OírConecta. Nadie me presionó. Solo me dieron información honesta.', a: 'Paciente · Bogotá' },
  { q: 'Mi papá no quería dar el paso por orgullo. Ver el simulador con mis hijos lo convenció más que años de discusiones.', a: 'Hijo · Bogotá' },
];

function Testimonials() {
  return (
    <Box component="section" sx={{ bgcolor: OC.wash, py: { xs: 8, md: 10 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 4.5 }}>
        <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 28, md: 36 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, maxWidth: 640 }}>Lo que nos cuentan las familias.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 2.5 }}>
          {QUOTES.map((x) => (
            <Box component="figure" key={x.q} sx={{ m: 0, bgcolor: '#fff', borderRadius: '24px', p: 3.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box component="blockquote" sx={{ m: 0, fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.text }}>“{x.q}”</Box>
              <Box component="figcaption" sx={{ mt: 'auto', fontFamily: FONT, fontSize: 13, color: OC.muted }}>{x.a}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ── 7. PROFESIONALES ─────────────────────────────────────────────── */
function Professionals() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 11 } }}>
      <Box sx={wrap}>
        <Box sx={{ bgcolor: '#fff', border: `1px solid ${OC.line}`, borderRadius: '32px', p: { xs: 4, md: 6 }, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: '1 1 420px', minWidth: 0 }}>
            <Eyebrow>Para profesionales auditivos</Eyebrow>
            <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 26, md: 32 }, fontWeight: 900, lineHeight: 1.15, color: OC.text, textWrap: 'balance' }}>Tu práctica, visible para quienes ya te están buscando.</Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.6, color: OC.muted }}>Perfil en el directorio nacional, panel propio para tus consultas y el acompañamiento del equipo OírConecta.</Typography>
          </Box>
          <Pill to="/registro-profesional" variant="deep" sx={{ bgcolor: OC.blue }}>Suscribir mi perfil</Pill>
        </Box>
      </Box>
    </Box>
  );
}

/* ── 8. CTA FINAL ─────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <Box component="section" sx={{ bgcolor: OC.deep, color: '#fff', py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, maxWidth: 820, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.75, textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 32, md: 44 }, fontWeight: 900, lineHeight: 1.08, textWrap: 'balance' }}>El mejor momento para escuchar mejor es esta semana.</Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: 17, lineHeight: 1.6, color: OC.mist }}>Agenda tu valoración auditiva sin costo en Bogotá. Atendemos de lunes a sábado.</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
          <Pill to="/agendar">Agendar valoración</Pill>
          <Pill href={getWhatsAppHref()} variant="ghost">Hablar con Aura por WhatsApp</Pill>
        </Box>
      </Box>
    </Box>
  );
}

export default function Home2027({ children }) {
  return (
    <Box sx={{ fontFamily: FONT, bgcolor: OC.ground, ...keyframes }}>
      <Hero />
      <Paths />
      <Simulator />
      <HowItWorks />
      <Specialists />
      <Testimonials />
      {children}
      <Professionals />
      <FinalCta />
    </Box>
  );
}
