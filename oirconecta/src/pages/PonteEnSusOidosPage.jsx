import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Button, Stack, Grid, Chip, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  PlayArrow, Pause, RestartAlt, ArrowForward, FavoriteOutlined,
  HearingOutlined, ShareOutlined,
} from '@mui/icons-material';
import { HearingLossProcessor, LEVELS } from '../utils/hearingLossProcessor';

const C = {
  navy: '#272F50',
  verde: '#085946',
  verdeProfundo: '#00382B',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
};

const SCENES = [
  { id: 'familia',   src: '/audio/cena_familiar.wav',         titulo: 'Cena con tu familia',         emoji: '🍲', desc: 'Varias voces hablando al mismo tiempo en la mesa.' },
  { id: 'nieto',     src: '/audio/nieto_llamada.wav',         titulo: 'Llamada de tu nieto',         emoji: '📞', desc: '"Abuelita, ¿cuándo nos visitas?"' },
  { id: 'te_amo',    src: '/audio/te_amo.wav',                titulo: 'Un "te amo" en voz baja',     emoji: '💛', desc: 'La frase más importante, susurrada al oído.' },
  { id: 'tv',        src: '/audio/television.wav',            titulo: 'Las noticias en la TV',       emoji: '📺', desc: 'Lo que se pierde frente al televisor.' },
  { id: 'doctor',    src: '/audio/consulta_medica.wav',       titulo: 'En la consulta médica',       emoji: '🩺', desc: 'Las instrucciones del médico que no se pueden perder.' },
  { id: 'restaurante', src: '/audio/familia_conversacion_restaurante.wav', titulo: 'Conversación en un restaurante', emoji: '🍷', desc: 'Música, platos y voces de fondo.' },
  { id: 'telefono',  src: '/audio/llamada_telefono.wav',      titulo: 'Una llamada importante',      emoji: '☎️', desc: 'Sin poder ver los labios del otro.' },
  { id: 'familia_casa', src: '/audio/familia_conversacion.wav', titulo: 'Conversación en casa',     emoji: '🏠', desc: 'Una charla cotidiana en la sala.' },
];

export default function PonteEnSusOidosPage() {
  const audioRef = useRef(null);
  const processorRef = useRef(null);
  const [activeSceneId, setActiveSceneId] = useState(SCENES[0].id);
  const [level, setLevel] = useState('normal');
  const [playing, setPlaying] = useState(false);

  const activeScene = SCENES.find((s) => s.id === activeSceneId) || SCENES[0];
  const activeLevel = LEVELS.find((l) => l.id === level) || LEVELS[0];

  useEffect(() => {
    return () => {
      if (processorRef.current) processorRef.current.destroy();
    };
  }, []);

  const ensureProcessor = useCallback(async () => {
    if (!audioRef.current) return;
    if (!processorRef.current) {
      processorRef.current = new HearingLossProcessor();
    }
    processorRef.current.attach(audioRef.current);
    await processorRef.current.ensureRunning();
    processorRef.current.applyLevel(level);
  }, [level]);

  useEffect(() => {
    if (processorRef.current) processorRef.current.applyLevel(level);
  }, [level]);

  const handlePlayPause = async () => {
    await ensureProcessor();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const handlePickScene = async (sceneId) => {
    setActiveSceneId(sceneId);
    setLevel('normal');
    setTimeout(async () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await ensureProcessor();
        try {
          await audioRef.current.play();
          setPlaying(true);
        } catch (e) { /* autoplay denied */ }
      }
    }, 80);
  };

  const handleRestart = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await ensureProcessor();
      await audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleShare = async () => {
    const url = 'https://oirconecta.com/ponte-en-sus-oidos';
    const text = 'Esto escuchan las personas con pérdida auditiva. Es duro.';
    if (navigator.share) {
      try { await navigator.share({ title: 'Ponte en sus oídos · OírConecta', text, url }); } catch (e) { /* user cancelled */ }
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      window.open(wa, '_blank');
    }
  };

  return (
    <>
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

      <Box component="section" sx={{ bgcolor: C.blanco, pt: { xs: 12, md: 14 }, pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box sx={{ width: 32, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.verde,
            }}>
              Experiencia sonora · No es un diagnóstico
            </Typography>
          </Stack>

          <Typography component="h1" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem', lg: '4rem' },
            fontWeight: 600, lineHeight: 1.06, color: C.navy,
            letterSpacing: '-0.018em', mb: 3, maxWidth: 900,
          }}>
            Ponte en sus oídos.{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde }}>
              Escucha lo que ellos escuchan.
            </Box>
          </Typography>

          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1.0625rem', md: '1.1875rem' }, lineHeight: 1.6,
            color: C.gris, fontWeight: 400, maxWidth: 680, mb: 4,
          }}>
            Cuando tu mamá no contesta, no es que te ignore. Cuando tu papá sube la TV, no es por molestar.
            Esto es lo que están viviendo. Elige una escena, súbele el volumen y cambia entre los niveles para sentirlo.
          </Typography>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
            <Chip icon={<HearingOutlined />} label="Audífonos con audio recomendado" sx={{ bgcolor: `${C.verde}10`, color: C.verde, fontWeight: 600 }} />
            <Chip icon={<FavoriteOutlined />} label="Hecho con respeto" sx={{ bgcolor: `${C.oro}20`, color: C.navy, fontWeight: 600 }} />
          </Stack>
        </Container>
      </Box>

      {/* PLAYER */}
      <Box component="section" sx={{ bgcolor: C.navy, color: '#fff', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: C.arena, mb: 1.5,
              }}>
                Escena actual
              </Typography>
              <Typography component="h2" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 600,
                lineHeight: 1.15, mb: 1.5,
              }}>
                {activeScene.emoji} {activeScene.titulo}
              </Typography>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1rem', color: '#D9CDBFcc', mb: 3, lineHeight: 1.55,
              }}>
                {activeScene.desc}
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <IconButton onClick={handlePlayPause} sx={{
                  bgcolor: C.verde, color: '#fff', width: 56, height: 56,
                  '&:hover': { bgcolor: '#0a6a54' },
                }}>
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={handleRestart} sx={{
                  border: `1px solid #ffffff44`, color: '#fff', width: 44, height: 44,
                }} aria-label="Reiniciar">
                  <RestartAlt />
                </IconButton>
                <IconButton onClick={handleShare} sx={{
                  border: `1px solid #ffffff44`, color: '#fff', width: 44, height: 44,
                }} aria-label="Compartir por WhatsApp">
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

            <Grid item xs={12} md={7}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: C.arena, mb: 1.5,
              }}>
                Nivel de pérdida
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
                        bgcolor: isActive ? C.verde : 'transparent',
                        border: `1.5px solid ${isActive ? C.verde : '#ffffff33'}`,
                        color: isActive ? '#fff' : '#fff',
                        textTransform: 'none', fontWeight: 700,
                        px: 2.5, py: 1.25, borderRadius: '8px',
                        '&:hover': { bgcolor: isActive ? '#0a6a54' : '#ffffff10' },
                        flexDirection: 'column', alignItems: 'flex-start',
                        minWidth: 120,
                      }}
                    >
                      <Box sx={{ fontSize: '0.95rem' }}>{l.label}</Box>
                      <Box sx={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 500 }}>{l.shortDb}</Box>
                    </Button>
                  );
                })}
              </Stack>
              <Box sx={{
                bgcolor: '#ffffff0d', border: '1px solid #ffffff1f',
                borderRadius: '10px', p: 2.5,
              }}>
                <Typography sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '1.15rem', fontStyle: 'italic', color: '#fff', lineHeight: 1.5,
                }}>
                  "{activeLevel.tagline}"
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SCENE GRID */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 600,
            color: C.navy, mb: 1, letterSpacing: '-0.01em',
          }}>
            Elige una escena de tu día a día.
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1rem', color: C.gris, mb: 4, maxWidth: 620,
          }}>
            Cada una representa un momento cotidiano donde la pérdida auditiva cambia lo que se percibe.
          </Typography>

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
                      bgcolor: isActive ? C.verde : '#fff',
                      color: isActive ? '#fff' : C.navy,
                      border: `1.5px solid ${isActive ? C.verde : C.arena}`,
                      borderRadius: '12px', p: 2.5,
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? `0 12px 28px ${C.verde}33` : '0 1px 0 rgba(0,0,0,0.02)',
                      '&:hover': {
                        borderColor: C.verde,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${C.navy}1f`,
                      },
                    }}
                  >
                    <Box sx={{ fontSize: '1.75rem', mb: 1.25 }}>{s.emoji}</Box>
                    <Typography sx={{
                      fontWeight: 700, fontSize: '0.95rem',
                      mb: 0.5, lineHeight: 1.3,
                    }}>
                      {s.titulo}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.8125rem', lineHeight: 1.4,
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

      {/* EDUCATIVO */}
      <Box component="section" sx={{ bgcolor: `${C.arena}25`, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {LEVELS.map((l) => (
              <Grid item xs={12} sm={6} md={3} key={l.id}>
                <Box sx={{ borderTop: `2px solid ${C.verde}`, pt: 2 }}>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: C.verde, mb: 1,
                  }}>
                    {l.shortDb}
                  </Typography>
                  <Typography component="h3" sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.5rem', fontWeight: 600, color: C.navy, mb: 1,
                  }}>
                    {l.label}
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.95rem', color: C.gris, lineHeight: 1.55,
                  }}>
                    {l.tagline}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box component="section" sx={{ bgcolor: C.verdeProfundo, color: '#fff', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.85rem', md: '2.5rem' }, fontWeight: 600,
            lineHeight: 1.15, mb: 2.5,
          }}>
            ¿Reconociste a alguien que amas?
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.1rem', color: '#D9CDBFdd', mb: 4.5, maxWidth: 620, mx: 'auto',
          }}>
            La pérdida auditiva sin atender acelera el deterioro cognitivo y aísla. Una valoración auditiva en Colombia toma 45 minutos.
            Conecta con un audiólogo verificado cerca de ti.
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
                bgcolor: '#fff', color: C.verdeProfundo,
                fontWeight: 700, fontSize: '0.95rem',
                px: 4, py: 1.75, borderRadius: '6px',
                '&:hover': { bgcolor: C.arena },
              }}
            >
              Buscar audiólogo cerca
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
    </>
  );
}
