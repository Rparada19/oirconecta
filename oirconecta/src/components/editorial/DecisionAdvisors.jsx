import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { OC, Pill, Eyebrow } from '../home/Home2027';
import { STYLE_GUIDE } from './brandDecision';

const FONT = '"Gotham", "Helvetica", "Arial", sans-serif';
const wrap = { maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } };

function Option({ on, onClick, children }) {
  return (
    <Box component="button" type="button" aria-pressed={on} onClick={onClick} sx={{
      fontFamily: FONT, fontSize: 15, fontWeight: 700, textAlign: 'left', minHeight: 52, px: 2.5, py: 1.5,
      borderRadius: '16px', cursor: 'pointer', width: '100%',
      bgcolor: on ? OC.deep : '#fff', color: on ? '#fff' : OC.text, border: `1.5px solid ${on ? OC.deep : OC.line}`,
      transition: 'all .2s ease', '&:hover': { borderColor: OC.deep },
      '&:focus-visible': { outline: `3px solid ${OC.sky}`, outlineOffset: 3 },
    }}>{children}</Box>
  );
}

function Step({ n, title, children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: OC.blue }}>Paso {n}</Typography>
      <Typography component="h3" sx={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, color: OC.text }}>{title}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</Box>
    </Box>
  );
}

/* ── Asistente de formato (audífonos) ─────────────────────────────── */
const GRADOS = [
  { id: 'nose', label: 'No lo sé todavía' },
  { id: 'leve', label: 'Leve a moderada' },
  { id: 'severa', label: 'Severa o profunda' },
];
const PRIORIDADES = [
  { id: 'discreto', label: 'Que casi no se note' },
  { id: 'facil', label: 'Que sea fácil de usar' },
  { id: 'conectado', label: 'Llamadas y TV directo al oído' },
];
const MANOS = [
  { id: 'bien', label: 'Manejo objetos pequeños sin problema' },
  { id: 'dificil', label: 'Me cuesta manipular cosas pequeñas' },
];

function recommend(g, p, m) {
  if (!g || !p || !m) return null;
  if (g === 'severa') return { keys: ['BTE', 'RIC'], why: 'Con pérdidas severas o profundas se necesita más potencia: el retroauricular la ofrece y algunos RIC tienen auriculares de alta potencia.' };
  if (m === 'dificil') return { keys: ['RIC', 'BTE'], why: 'Los formatos detrás de la oreja son más fáciles de poner y quitar, y casi todos tienen versión recargable: nada de pilas diminutas.' };
  if (p === 'discreto') return { keys: ['CIC', 'ITC', 'RIC'], why: 'Los intracanal son los más discretos si tu oído tiene espacio suficiente; el RIC es la alternativa discreta con más funciones.' };
  if (p === 'conectado') return { keys: ['RIC', 'BTE'], why: 'Los formatos detrás de la oreja tienen espacio para Bluetooth y batería recargable, ideales para llamadas y TV.' };
  return { keys: ['RIC', 'ITC'], why: 'El RIC es el formato más elegido por su equilibrio entre comodidad, discreción y funciones; el ITC es una buena opción a la medida.' };
}

export function FormatAdvisor() {
  const [g, setG] = useState(null);
  const [p, setP] = useState(null);
  const [m, setM] = useState(null);
  const r = recommend(g, p, m);
  return (
    <Box component="section" id="asistente" sx={{ bgcolor: OC.ground, py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 680 }}>
          <Eyebrow>Asistente de 3 pasos</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 28, md: 40 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance' }}>¿Por dónde empiezo?</Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.muted }}>Responde tres preguntas y te mostramos qué formatos suelen funcionar mejor en tu caso. Antes de elegir marca, conviene elegir formato.</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 3 }}>
          <Step n={1} title="¿Cómo es tu pérdida auditiva?">{GRADOS.map((x) => <Option key={x.id} on={g === x.id} onClick={() => setG(x.id)}>{x.label}</Option>)}</Step>
          <Step n={2} title="¿Qué es lo más importante para ti?">{PRIORIDADES.map((x) => <Option key={x.id} on={p === x.id} onClick={() => setP(x.id)}>{x.label}</Option>)}</Step>
          <Step n={3} title="¿Cómo te va con objetos pequeños?">{MANOS.map((x) => <Option key={x.id} on={m === x.id} onClick={() => setM(x.id)}>{x.label}</Option>)}</Step>
        </Box>
        <Box aria-live="polite" sx={{ bgcolor: r ? OC.deep : '#fff', color: r ? '#fff' : OC.muted, border: r ? 'none' : `1.5px dashed ${OC.line}`, borderRadius: '28px', p: { xs: 3, md: 5 }, transition: 'all .3s ease' }}>
          {!r ? (
            <Typography sx={{ fontFamily: FONT, fontSize: 16 }}>Completa los tres pasos para ver tu orientación.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Eyebrow light>Formatos que te sugerimos explorar</Eyebrow>
                <Typography sx={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.mist, mt: 1.5, maxWidth: 720 }}>{r.why}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${r.keys.length}, minmax(0,1fr))` }, gap: 2 }}>
                {r.keys.map((k, i) => (
                  <Box key={k} sx={{ bgcolor: 'rgba(255,255,255,.07)', border: `1px solid ${i === 0 ? OC.sky : 'rgba(157,184,255,.2)'}`, borderRadius: '20px', p: 2.5 }}>
                    {i === 0 && <Typography sx={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: OC.sky, mb: 1 }}>Primera opción</Typography>}
                    <Typography sx={{ fontFamily: FONT, fontSize: 17, fontWeight: 700 }}>{STYLE_GUIDE[k].nombre}</Typography>
                    <Typography sx={{ fontFamily: FONT, fontSize: 14, color: OC.mist, mt: 1, lineHeight: 1.5 }}>{STYLE_GUIDE[k].para}</Typography>
                  </Box>
                ))}
              </Box>
              {g === 'nose' && (
                <Typography sx={{ fontFamily: FONT, fontSize: 15, color: '#fff', bgcolor: 'rgba(76,125,240,.25)', borderRadius: '14px', px: 2.5, py: 1.75 }}>
                  Como aún no conoces tu grado de pérdida, el primer paso es una valoración auditiva: sin ella ningún formato se puede confirmar.
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Pill to="/agendar">Agendar valoración sin costo</Pill>
                <Pill href="#marcas" variant="ghost">Ver marcas</Pill>
              </Box>
              <Typography sx={{ fontFamily: FONT, fontSize: 12.5, color: OC.sky }}>Orientación general. La recomendación definitiva la hace tu audióloga con tu audiometría.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ── Orientación de candidatura (implantes) ───────────────────────── */
const SIGNOS = [
  'Uso audífonos bien adaptados y aun así me cuesta entender conversaciones.',
  'Dependo mucho de la lectura labial para seguir una charla.',
  'El teléfono se volvió casi imposible, incluso con ayudas.',
  'Me dijeron que mi pérdida es severa o profunda en uno o ambos oídos.',
  'Tengo una pérdida conductiva o mixta que los audífonos no resuelven.',
  'Escucho muy poco o nada por un oído y bien por el otro.',
];

export function CandidacyCheck() {
  const [sel, setSel] = useState([]);
  const toggle = (i) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const coclear = [0, 1, 2, 3].some((i) => sel.includes(i));
  const osea = [4, 5].some((i) => sel.includes(i));
  return (
    <Box component="section" id="orientacion" sx={{ bgcolor: OC.ground, py: { xs: 8, md: 11 } }}>
      <Box sx={{ ...wrap, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1fr)' }, gap: { xs: 4, md: 7 }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Eyebrow>Orientación rápida</Eyebrow>
          <Typography component="h2" sx={{ fontFamily: FONT, fontSize: { xs: 28, md: 40 }, fontWeight: 900, lineHeight: 1.1, color: OC.text, textWrap: 'balance' }}>¿Te identificas con alguna de estas situaciones?</Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.6, color: OC.muted }}>Marca las que vivas a diario. No es un diagnóstico: te ayuda a saber qué preguntar y con quién hablar.</Typography>
          <Box aria-live="polite" sx={{ bgcolor: sel.length ? OC.deep : '#fff', color: sel.length ? '#fff' : OC.muted, border: sel.length ? 'none' : `1.5px dashed ${OC.line}`, borderRadius: '24px', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!sel.length ? (
              <Typography sx={{ fontFamily: FONT, fontSize: 15 }}>Tu orientación aparecerá aquí.</Typography>
            ) : (
              <>
                {coclear && <Typography sx={{ fontFamily: FONT, fontSize: 15.5, lineHeight: 1.55 }}><Box component="strong">Vale la pena evaluar un implante coclear.</Box> Pide una valoración de candidatura con otorrino y audiología.</Typography>}
                {osea && <Typography sx={{ fontFamily: FONT, fontSize: 15.5, lineHeight: 1.55 }}><Box component="strong">Un sistema de conducción ósea podría ayudarte.</Box> Funciona sin pasar por el canal auditivo; también requiere evaluación médica.</Typography>}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Pill to="/agendar">Agendar valoración</Pill>
                  <Pill to="/directorio/profesion/otorrinolaringologia" variant="ghost">Buscar otorrino</Pill>
                </Box>
                <Typography sx={{ fontFamily: FONT, fontSize: 12.5, color: OC.sky }}>Orientación general, no reemplaza la valoración médica.</Typography>
              </>
            )}
          </Box>
        </Box>
        <Box role="group" aria-label="Situaciones" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {SIGNOS.map((s, i) => <Option key={s} on={sel.includes(i)} onClick={() => toggle(i)}>{sel.includes(i) ? '✓ ' : ''}{s}</Option>)}
        </Box>
      </Box>
    </Box>
  );
}
