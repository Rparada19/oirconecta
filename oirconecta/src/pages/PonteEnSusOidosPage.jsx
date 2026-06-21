import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box, Container, Typography, Button, Stack, Grid, Chip, IconButton,
  TextField, Alert, CircularProgress,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  PlayArrow, Pause, RestartAlt, ArrowForward, FavoriteOutlined,
  HearingOutlined, ShareOutlined, CheckCircleOutline,
} from '@mui/icons-material';
import { HearingLossProcessor, LEVELS } from '../utils/hearingLossProcessor';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  IcCasa, IcCena, IcLlamada, IcSusurro, IcTV, IcEstetoscopio, IcCopa, IcTelefonoFijo,
  IcAudifonos, IcPlay, IcSlider, IcCompartir,
} from '../components/simulator/SimulatorIcons';

const C = {
  navy: '#272F50',
  navyDark: '#1B2240',
  verde: '#085946',
  verdeProfundo: '#00382B',
  verdeClaro: '#0d7a5c',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  arenaPale: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
  border: '#E5E0D6',
};

const SCENES = [
  { id: 'familia_casa',  src: '/audio/familia_conversacion.wav',             titulo: 'Conversación en casa',     Icon: IcCasa,          desc: 'Una charla cotidiana entre mamá e hija.' },
  { id: 'familia',       src: '/audio/cena_familiar.wav',                    titulo: 'Cena con la familia',      Icon: IcCena,          desc: 'Varias voces hablando al tiempo en la mesa.' },
  { id: 'nieto',         src: '/audio/nieto_llamada.wav',                    titulo: 'Llamada del nieto',        Icon: IcLlamada,       desc: '"Abuelita, ¿cuándo nos visitas?".' },
  { id: 'te_amo',        src: '/audio/te_amo.wav',                           titulo: 'Un "te amo" en voz baja',  Icon: IcSusurro,       desc: 'La frase más importante, susurrada al oído.' },
  { id: 'tv',            src: '/audio/television.wav',                       titulo: 'Las noticias en la TV',    Icon: IcTV,            desc: 'El presentador frente al televisor.' },
  { id: 'doctor',        src: '/audio/consulta_medica.wav',                  titulo: 'En la consulta médica',    Icon: IcEstetoscopio,  desc: 'Instrucciones que no se pueden perder.' },
  { id: 'restaurante',   src: '/audio/familia_conversacion_restaurante.wav', titulo: 'En un restaurante',        Icon: IcCopa,          desc: 'Voces y ruido de fondo al ordenar.' },
  { id: 'telefono',      src: '/audio/llamada_telefono.wav',                 titulo: 'Llamada del banco',        Icon: IcTelefonoFijo,  desc: 'Sin poder ver los labios del otro.' },
];

const PASOS = [
  { n: 1, titulo: 'Elige una escena',              desc: 'Selecciona un momento del día a día que quieras escuchar.',          Icon: IcAudifonos },
  { n: 2, titulo: 'Dale play y sube el volumen',   desc: 'Idealmente con audífonos o parlantes de buena calidad.',             Icon: IcPlay },
  { n: 3, titulo: 'Cambia el nivel de pérdida',    desc: 'Mientras suena, alterna entre Normal, Leve, Moderada y Severa.',     Icon: IcSlider },
  { n: 4, titulo: 'Compártelo con tu familia',     desc: 'La empatía empieza cuando todos lo viven.',                          Icon: IcCompartir },
];

// Audiograma: umbral promedio de audición por frecuencia (Hz) en cada nivel.
const AUDIOGRAM = {
  normal:    [10, 10, 12, 15, 15, 18, 18],
  leve:     [25, 28, 30, 32, 35, 38, 40],
  moderada: [40, 45, 50, 55, 58, 60, 62],
  severa:   [60, 65, 72, 78, 82, 85, 88],
};
const FREQS = [250, 500, 1000, 2000, 3000, 4000, 8000];

function Audiogram({ level, compact = false }) {
  const W = compact ? 420 : 520;
  const H = compact ? 220 : 280;
  const PAD_L = compact ? 40 : 50;
  const PAD_R = compact ? 14 : 18;
  const PAD_T = compact ? 16 : 24;
  const PAD_B = compact ? 44 : 52;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const xFor = (i) => PAD_L + (i / (FREQS.length - 1)) * plotW;
  const yFor = (db) => PAD_T + (db / 100) * plotH;
  const colors = { normal: C.navy, leve: '#E8B14C', moderada: '#D17A3B', severa: '#B7423B' };
  const activeData = AUDIOGRAM[level] || AUDIOGRAM.normal;
  const points = activeData.map((db, i) => `${xFor(i)},${yFor(db)}`).join(' ');
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box component="svg" viewBox={`0 0 ${W} ${H}`} sx={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={`Audiograma para nivel ${level}`}>
        {/* Grid horizontal cada 20 dB */}
        {[0, 20, 40, 60, 80, 100].map((db) => (
          <g key={db}>
            <line x1={PAD_L} y1={yFor(db)} x2={W - PAD_R} y2={yFor(db)} stroke={C.border} strokeWidth="1" strokeDasharray={db === 0 ? '0' : '3 4'} />
            <text x={PAD_L - 8} y={yFor(db) + 4} textAnchor="end" fontSize="11" fill={C.gris} fontFamily='"DM Sans", sans-serif'>{db} dB</text>
          </g>
        ))}
        {/* Banda de habla (20-60 dB, 500-4000 Hz) */}
        <rect x={xFor(1)} y={yFor(20)} width={xFor(5) - xFor(1)} height={yFor(60) - yFor(20)} fill={`${C.oro}1a`} stroke={`${C.oro}55`} strokeDasharray="2 3" />
        <text x={xFor(3)} y={yFor(20) - 6} textAnchor="middle" fontSize="10" fill={C.gris} fontFamily='"DM Sans", sans-serif' fontWeight="600" letterSpacing="0.1em">ZONA DEL HABLA</text>
        {/* Línea fantasma del normal para referencia */}
        <polyline fill="none" stroke={`${C.gris}55`} strokeWidth="1.5" strokeDasharray="4 4" points={AUDIOGRAM.normal.map((db, i) => `${xFor(i)},${yFor(db)}`).join(' ')} />
        {/* Línea activa */}
        <polyline fill="none" stroke={colors[level]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {/* Puntos */}
        {activeData.map((db, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(db)} r="5" fill={colors[level]} stroke="#fff" strokeWidth="2" />
        ))}
        {/* Ejes X */}
        {FREQS.map((f, i) => (
          <text key={f} x={xFor(i)} y={H - PAD_B + 18} textAnchor="middle" fontSize="11" fill={C.gris} fontFamily='"DM Sans", sans-serif'>
            {f >= 1000 ? `${f / 1000}k` : f}
          </text>
        ))}
      </Box>
      <Box sx={{
        textAlign: 'center', mt: 0.5,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.65rem', color: C.gris, letterSpacing: '0.12em',
      }}>
        FRECUENCIA (Hz)
      </Box>
    </Box>
  );
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'https://oirconecta-api.onrender.com';

export default function PonteEnSusOidosPage() {
  const audioRef = useRef(null);
  const processorRef = useRef(null);
  const playerSectionRef = useRef(null);
  const [activeSceneId, setActiveSceneId] = useState(null); // null = no escena elegida aún
  const [level, setLevel] = useState('normal');
  const [playing, setPlaying] = useState(false);

  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', ciudad: '', mensaje: '' });
  const [formState, setFormState] = useState({ loading: false, ok: false, error: null });

  const activeScene = SCENES.find((s) => s.id === activeSceneId) || null;
  const activeLevel = LEVELS.find((l) => l.id === level) || LEVELS[0];

  useEffect(() => () => {
    if (processorRef.current) processorRef.current.destroy();
  }, []);

  const ensureProcessor = useCallback(async () => {
    if (!audioRef.current) return;
    if (!processorRef.current) processorRef.current = new HearingLossProcessor();
    processorRef.current.attach(audioRef.current);
    await processorRef.current.ensureRunning();
    processorRef.current.applyLevel(level);
  }, [level]);

  useEffect(() => {
    if (processorRef.current) processorRef.current.applyLevel(level);
  }, [level]);

  useEffect(() => {
    if (processorRef.current) processorRef.current.setPlaying(playing);
  }, [playing]);

  const handlePlayPause = async () => {
    await ensureProcessor();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try { await audioRef.current.play(); setPlaying(true); } catch (e) { /* ignore */ }
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const handlePickScene = async (sceneId) => {
    // 1) Detén lo que esté sonando + apaga el ruido inmediatamente.
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) { /* ignore */ }
    }
    setPlaying(false);
    setLevel('normal');
    setActiveSceneId(sceneId);

    setTimeout(async () => {
      // Scroll al player
      if (playerSectionRef.current) {
        playerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await ensureProcessor();
        try { await audioRef.current.play(); setPlaying(true); } catch (e) { /* autoplay denied */ }
      }
    }, 100);
  };

  const handleRestart = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await ensureProcessor();
      try { await audioRef.current.play(); setPlaying(true); } catch (e) { /* ignore */ }
    }
  };

  const handleShare = async () => {
    const url = 'https://oirconecta.com/ponte-en-sus-oidos';
    const text = 'Esto escuchan las personas con pérdida auditiva. Pruébalo, no te va a dejar igual.';
    if (navigator.share) {
      try { await navigator.share({ title: 'Ponte en sus oídos · OírConecta', text, url }); } catch (e) { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.mensaje.trim()) {
      setFormState({ loading: false, ok: false, error: 'Por favor completa nombre, correo y mensaje.' });
      return;
    }
    setFormState({ loading: true, ok: false, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono || null,
          asunto: 'Simulador "Ponte en sus oídos" — solicitud de información',
          mensaje: `${form.mensaje}\n\n— Ciudad: ${form.ciudad || 'No especificada'}\n— Origen: /ponte-en-sus-oidos`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormState({ loading: false, ok: true, error: null });
        setForm({ nombre: '', email: '', telefono: '', ciudad: '', mensaje: '' });
      } else {
        setFormState({ loading: false, ok: false, error: data.error || 'No se pudo enviar tu mensaje.' });
      }
    } catch (err) {
      setFormState({ loading: false, ok: false, error: 'Hubo un problema de conexión. Intenta de nuevo.' });
    }
  };

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Helmet>
        <title>Ponte en sus oídos · Simulador de pérdida auditiva | OírConecta</title>
        <meta name="description" content="Simulador gratuito de pérdida auditiva en español. Escucha cómo oyen las personas con hipoacusia leve, moderada y severa en situaciones del día a día." />
        <link rel="canonical" href="https://oirconecta.com/ponte-en-sus-oidos" />
        <meta property="og:title" content="Ponte en sus oídos · Simulador de pérdida auditiva" />
        <meta property="og:description" content="Escucha cómo escucha tu familiar con pérdida auditiva. Una experiencia sonora para entender lo que ellos viven." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://oirconecta.com/ponte-en-sus-oidos" />
        <meta property="og:image" content="https://oirconecta.com/img/familia-disfrutando-mejor-audicion.jpg" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Ponte en sus oídos',
          description: 'Simulador en vivo de pérdida auditiva con escenas cotidianas en español.',
          url: 'https://oirconecta.com/ponte-en-sus-oidos',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web',
          inLanguage: 'es-CO',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'COP' },
        })}</script>
      </Helmet>

      {/* HERO con imagen */}
      <Box component="section" sx={{
        position: 'relative', overflow: 'hidden',
        pt: { xs: 14, md: 17 }, pb: { xs: 7, md: 10 },
        bgcolor: C.blanco,
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: C.verde }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: C.verde,
                }}>
                  Experiencia sonora · No es un diagnóstico
                </Typography>
              </Stack>
              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem', lg: '3.9rem' },
                fontWeight: 600, lineHeight: 1.05, color: C.navy,
                letterSpacing: '-0.02em', mb: 3,
              }}>
                Ponte en sus oídos.{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: C.verde }}>
                  Escucha lo que ellos escuchan.
                </Box>
              </Typography>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.0625rem', md: '1.1875rem' }, lineHeight: 1.6,
                color: C.gris, fontWeight: 400, maxWidth: 540, mb: 4,
              }}>
                Cuando tu mamá no contesta, no es que te ignore. Cuando tu papá sube la TV, no es por molestar.
                Esto es lo que están viviendo. Una herramienta hecha por audiólogos para que entiendas.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => document.getElementById('escenas')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    background: `${C.navy} !important`, color: '#fff !important',
                    fontWeight: 700, fontSize: '0.9375rem',
                    px: 3.5, py: 1.75, borderRadius: '6px',
                    letterSpacing: '0.01em',
                    boxShadow: `0 8px 22px ${C.navy}33`,
                    '&:hover': {
                      background: `${C.navyDark} !important`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 28px ${C.navy}44`,
                    },
                  }}
                >
                  Empezar la experiencia
                </Button>
                <Button
                  variant="text"
                  size="large"
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: C.navy, fontWeight: 600, fontSize: '0.9375rem',
                    px: 2, py: 1.75, textTransform: 'none',
                  }}
                >
                  Ver cómo funciona
                </Button>
              </Stack>
              <Stack direction="row" spacing={1.25} flexWrap="wrap" sx={{ gap: 1, mt: 4 }}>
                <Chip icon={<HearingOutlined />} label="Mejor con audífonos" sx={{ bgcolor: `${C.navy}0d`, color: C.navy, fontWeight: 600 }} />
                <Chip icon={<FavoriteOutlined />} label="Gratis y sin registro" sx={{ bgcolor: `${C.oro}22`, color: C.navy, fontWeight: 600 }} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{
                position: 'relative', borderRadius: '14px', overflow: 'hidden',
                boxShadow: `0 24px 60px ${C.navy}22`,
                aspectRatio: { xs: '4/3', md: '5/6' },
                maxHeight: { md: 620 },
              }}>
                <Box
                  component="img"
                  src="/img/abuelo-nieto-conversando.jpg"
                  alt="Abuelo escuchando atentamente a su nieto en un momento íntimo"
                  loading="eager"
                  decoding="async"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, ${C.navy}55 100%)`,
                }} />
                <Box sx={{
                  position: 'absolute', left: 20, right: 20, bottom: 20,
                  color: '#fff',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.4,
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>
                  "Pensé que mi mamá ya no me quería oír. Cuando lo probé entendí que no era yo."
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* PASO A PASO */}
      <Box id="como-funciona" component="section" sx={{ bgcolor: C.arenaPale, py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.navy, mb: 1.5,
            }}>
              Cómo funciona
            </Typography>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '1.85rem', md: '2.5rem' }, fontWeight: 600,
              color: C.navy, letterSpacing: '-0.015em',
            }}>
              4 pasos. 2 minutos. Una nueva perspectiva.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {PASOS.map((p) => (
              <Grid item xs={12} sm={6} md={3} key={p.n}>
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '14px', p: 3.5, height: '100%',
                  border: `1px solid ${C.border}`,
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute', top: -16, left: 20,
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: C.navy, color: C.oro,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700, fontSize: '1.05rem',
                    boxShadow: `0 4px 12px ${C.navy}55`,
                  }}>
                    {p.n}
                  </Box>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '10px',
                    bgcolor: `${C.navy}08`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mt: 1, mb: 1.75,
                    color: C.navy,
                  }}>
                    <p.Icon width={26} height={26} />
                  </Box>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 700, fontSize: '1.05rem', color: C.navy, mb: 0.75,
                  }}>
                    {p.titulo}
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.9rem', color: C.gris, lineHeight: 1.55,
                  }}>
                    {p.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ESCENAS — ahora ARRIBA del player */}
      <Box id="escenas" component="section" sx={{ bgcolor: C.blanco, py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.navy, mb: 1.5,
            }}>
              Paso 1 · Elige una escena
            </Typography>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '1.85rem', md: '2.5rem' }, fontWeight: 600,
              color: C.navy, mb: 1, letterSpacing: '-0.015em',
            }}>
              ¿Cuál momento del día a día quieres oír?
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '1rem', color: C.gris, maxWidth: 600,
            }}>
              Toca una tarjeta. El reproductor aparecerá abajo con esa escena lista.
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            {SCENES.map((s) => {
              const isActive = s.id === activeSceneId;
              return (
                <Grid item xs={12} sm={6} md={3} key={s.id}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => handlePickScene(s.id)}
                    aria-pressed={isActive}
                    sx={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      fontFamily: '"DM Sans", sans-serif',
                      bgcolor: isActive ? C.navy : '#fff',
                      color: isActive ? '#fff' : C.navy,
                      border: `1.5px solid ${isActive ? C.navy : C.border}`,
                      borderRadius: '10px', p: 3,
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: isActive ? `0 16px 32px ${C.navy}33` : '0 1px 2px rgba(0,0,0,0.03)',
                      '&:hover': {
                        borderColor: C.navy,
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 28px ${C.navy}1f`,
                      },
                    }}
                  >
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '10px',
                      bgcolor: isActive ? '#ffffff15' : `${C.navy}08`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 2,
                      color: isActive ? C.oro : C.navy,
                    }}>
                      <s.Icon width={26} height={26} />
                    </Box>
                    <Typography sx={{
                      fontWeight: 700, fontSize: '1rem',
                      mb: 0.5, lineHeight: 1.3,
                    }}>
                      {s.titulo}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.85rem', lineHeight: 1.45,
                      color: isActive ? '#ffffffcc' : C.gris,
                    }}>
                      {s.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* PLAYER + AUDIOGRAMA — sólo si hay escena elegida */}
      <Box ref={playerSectionRef} component="section" sx={{
        bgcolor: C.navy, color: '#fff', py: { xs: 6, md: 8 },
        scrollMarginTop: 80,
      }}>
        <Container maxWidth="lg">
          {!activeScene ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '1.5rem', md: '2rem' }, fontStyle: 'italic',
                color: '#ffffffcc',
              }}>
                Elige una escena arriba para empezar.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              {/* Player */}
              <Grid item xs={12} md={5}>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: C.arena, mb: 1.25,
                }}>
                  Paso 2 · Reproduce
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '10px',
                    bgcolor: `${C.oro}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.oro,
                  }}>
                    <activeScene.Icon width={24} height={24} />
                  </Box>
                  <Typography component="h2" sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 600,
                    lineHeight: 1.15,
                  }}>
                    {activeScene.titulo}
                  </Typography>
                </Stack>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.95rem', color: '#D9CDBFcc', mb: 3, lineHeight: 1.55,
                }}>
                  {activeScene.desc}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconButton onClick={handlePlayPause} aria-label={playing ? 'Pausar' : 'Reproducir'} sx={{
                    bgcolor: C.oro, color: C.navy, width: 60, height: 60,
                    boxShadow: `0 8px 22px ${C.oro}66`,
                    '&:hover': { bgcolor: '#D4B97A' },
                  }}>
                    {playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                  </IconButton>
                  <IconButton onClick={handleRestart} aria-label="Reiniciar" sx={{
                    border: `1px solid #ffffff44`, color: '#fff', width: 46, height: 46,
                    '&:hover': { bgcolor: '#ffffff10' },
                  }}>
                    <RestartAlt />
                  </IconButton>
                  <IconButton onClick={handleShare} aria-label="Compartir por WhatsApp" sx={{
                    border: `1px solid #ffffff44`, color: '#fff', width: 46, height: 46,
                    '&:hover': { bgcolor: '#ffffff10' },
                  }}>
                    <ShareOutlined />
                  </IconButton>
                </Stack>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio
                  ref={audioRef}
                  src={activeScene.src}
                  onEnded={() => setPlaying(false)}
                  onPause={() => setPlaying(false)}
                  onPlay={() => setPlaying(true)}
                  preload="auto"
                  crossOrigin="anonymous"
                />
              </Grid>

              {/* Niveles + tagline */}
              <Grid item xs={12} md={7}>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: C.arena, mb: 1.25,
                }}>
                  Paso 3 · Cambia el nivel mientras suena
                </Typography>
                <Stack direction="row" spacing={1.25} flexWrap="wrap" sx={{ gap: 1.25, mb: 2.5 }}>
                  {LEVELS.map((l) => {
                    const isActive = l.id === level;
                    return (
                      <Button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        sx={{
                          fontFamily: '"DM Sans", sans-serif',
                          bgcolor: isActive ? C.oro : 'transparent',
                          border: `1.5px solid ${isActive ? C.oro : '#ffffff33'}`,
                          color: isActive ? C.navy : '#fff',
                          textTransform: 'none', fontWeight: 700,
                          px: 2.5, py: 1.25, borderRadius: '8px',
                          '&:hover': { bgcolor: isActive ? '#D4B97A' : '#ffffff10' },
                          flexDirection: 'column', alignItems: 'flex-start',
                          minWidth: 130,
                        }}
                      >
                        <Box sx={{ fontSize: '0.95rem' }}>{l.label}</Box>
                        <Box sx={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>{l.shortDb}</Box>
                      </Button>
                    );
                  })}
                </Stack>
                <Box sx={{
                  bgcolor: '#ffffff0d', border: '1px solid #ffffff1f',
                  borderRadius: '10px', p: 2, mb: 2,
                }}>
                  <Typography sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.05rem', fontStyle: 'italic', color: '#fff', lineHeight: 1.4,
                  }}>
                    "{activeLevel.tagline}"
                  </Typography>
                </Box>

                {/* Audiograma compacto, en blanco, dentro del player */}
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '12px', p: 2,
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.navy,
                    }}>
                      Audiograma equivalente
                    </Typography>
                    <Chip
                      label={activeLevel.label}
                      size="small"
                      sx={{ bgcolor: `${C.navy}0d`, color: C.navy, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                    />
                  </Stack>
                  <Audiogram level={level} compact />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.7rem', color: C.gris, textAlign: 'center', mt: 0.5,
                  }}>
                    Punteada = audición sana · Banda verde = zona del habla
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>

      {/* EXPLICACIÓN NIVELES */}
      <Box component="section" sx={{ bgcolor: C.arenaPale, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 600,
            color: C.navy, mb: 4, textAlign: 'center', letterSpacing: '-0.015em',
          }}>
            ¿Qué significa cada nivel?
          </Typography>
          <Grid container spacing={3}>
            {LEVELS.map((l) => (
              <Grid item xs={12} sm={6} md={3} key={l.id}>
                <Box sx={{ bgcolor: '#fff', borderRadius: '12px', p: 3, border: `1px solid ${C.border}`, height: '100%' }}>
                  <Box sx={{ borderTop: `3px solid ${C.oro}`, width: 36, mb: 2 }} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: C.navy, mb: 0.75,
                  }}>
                    {l.shortDb}
                  </Typography>
                  <Typography component="h3" sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.4rem', fontWeight: 600, color: C.navy, mb: 1,
                  }}>
                    {l.label}
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.92rem', color: C.gris, lineHeight: 1.55,
                  }}>
                    {l.tagline}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FORMULARIO */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.navy, mb: 1.5,
              }}>
                ¿Necesitas orientación?
              </Typography>
              <Typography component="h2" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '1.85rem', md: '2.4rem' }, fontWeight: 600,
                color: C.navy, lineHeight: 1.1, mb: 2,
              }}>
                Solicita más{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>información.</Box>
              </Typography>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1rem', color: C.gris, lineHeight: 1.6,
              }}>
                Déjanos tus datos y un profesional del equipo OírConecta te contacta para resolver tus dudas sobre pérdida auditiva, opciones de audífonos o cómo agendar una valoración.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box component="form" onSubmit={handleSubmit} sx={{
                bgcolor: C.arenaPale, borderRadius: '14px', p: { xs: 3, md: 4 },
                border: `1px solid ${C.border}`,
              }}>
                {formState.ok ? (
                  <Alert
                    icon={<CheckCircleOutline />}
                    severity="success"
                    sx={{ bgcolor: `${C.verde}15`, color: C.verde, fontFamily: '"DM Sans", sans-serif' }}
                  >
                    ¡Gracias! Recibimos tu mensaje. Te contactaremos pronto.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label="Tu nombre" name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required type="email" label="Correo electrónico" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Teléfono o WhatsApp" name="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} size="small" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Ciudad" name="ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} size="small" />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth required multiline rows={3}
                      label="¿Cómo te podemos ayudar?"
                      placeholder="Ej.: Mi mamá no escucha bien en reuniones, quisiera saber qué hacer."
                      name="mensaje"
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    />
                    {formState.error && (
                      <Alert severity="error" sx={{ fontFamily: '"DM Sans", sans-serif' }}>{formState.error}</Alert>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={formState.loading}
                      endIcon={formState.loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <ArrowForward />}
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        background: `${C.navy} !important`, color: '#fff !important',
                        fontWeight: 700, fontSize: '0.95rem',
                        px: 4, py: 1.5, borderRadius: '6px',
                        letterSpacing: '0.01em',
                        boxShadow: `0 8px 22px ${C.navy}33`,
                        '&:hover': { background: `${C.navyDark} !important`, boxShadow: `0 12px 28px ${C.navy}44` },
                      }}
                    >
                      {formState.loading ? 'Enviando…' : 'Solicitar información'}
                    </Button>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.78rem', color: C.gris,
                    }}>
                      Tus datos se usan únicamente para responder tu solicitud. No compartimos información con terceros.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA final */}
      <Box component="section" sx={{
        bgcolor: C.navy, color: '#fff', py: { xs: 7, md: 9 },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -120, right: -120, width: 380, height: 380,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.oro}33 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.oro, mb: 1.5,
          }}>
            Directorio nacional
          </Typography>
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.85rem', md: '2.5rem' }, fontWeight: 600,
            lineHeight: 1.15, mb: 2.5,
          }}>
            O conéctate con{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
              un audiólogo verificado.
            </Box>
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4, maxWidth: 600, mx: 'auto',
          }}>
            Audiólogos, fonoaudiólogos y otorrinolaringólogos verificados en toda Colombia. Filtra por ciudad y especialidad, agenda directo.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              to="/directorio/listado"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                background: `${C.oro} !important`, color: `${C.navy} !important`,
                fontWeight: 700, fontSize: '0.95rem',
                px: 4, py: 1.75, borderRadius: '6px',
                letterSpacing: '0.01em',
                boxShadow: `0 8px 24px ${C.oro}55`,
                '&:hover': { background: '#D4B97A !important', boxShadow: `0 12px 32px ${C.oro}66`, transform: 'translateY(-2px)' },
              }}
            >
              Buscar profesional en el directorio
            </Button>
            <Button
              onClick={handleShare}
              variant="outlined"
              size="large"
              startIcon={<ShareOutlined />}
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#fff', borderColor: '#ffffff66', borderWidth: '1.5px',
                fontWeight: 600, px: 4, py: 1.75, borderRadius: '6px',
                '&:hover': { borderColor: '#fff', bgcolor: '#ffffff10' },
              }}
            >
              Compartir con mi familia
            </Button>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
