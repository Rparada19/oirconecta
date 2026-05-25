import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Container, Typography, Grid, Card, CardContent, FormControl, InputLabel,
  Select, MenuItem, Box, Chip, Divider, CircularProgress, Button, Alert, Paper, TextField,
} from '@mui/material';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StarIcon from '@mui/icons-material/Star';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const formatPrice = (p) => (p == null ? 'Consultar' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p));
const etiqueta = (c) => [c.marca, c.tecnologia, c.plataforma].filter(Boolean).join(' · ');

const TEST = [
  { key: 'perdida', label: 'Grado de pérdida auditiva', opts: ['Leve', 'Moderada', 'Severa', 'Profunda', 'No sé'] },
  { key: 'estiloVida', label: 'Estilo de vida', opts: ['Tranquilo (casa)', 'Activo (trabajo/reuniones)', 'Muy activo (ruido/exteriores)'] },
  { key: 'prioridad', label: 'Lo más importante para ti', opts: ['Discreción', 'Calidad de sonido', 'Conectividad', 'Precio'] },
  { key: 'destreza', label: 'Manejo / destreza', opts: ['Buena', 'Prefiero recargable y fácil'] },
  { key: 'conectividad', label: '¿Conectividad (celular/TV) importante?', opts: ['Sí', 'No es importante'] },
];

const EMPTY_CAND = { marca: '', tecnologia: '', plataforma: '' };

export default function ComparadorPage() {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [cands, setCands] = useState([{ ...EMPTY_CAND }, { ...EMPTY_CAND }]);
  const [test, setTest] = useState({});
  const [result, setResult] = useState(null);
  const [reco, setReco] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lead, setLead] = useState({ nombre: '', telefono: '', email: '', ciudad: '' });
  const [leadState, setLeadState] = useState({ sending: false, done: false, error: null });

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/comparador`).then((r) => r.json())
      .then((j) => setItems(j?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  const marcas = useMemo(() => [...new Set(items.map((i) => i.marca))].sort(), [items]);
  const tecnologiasDe = (marca) => [...new Set(items.filter((i) => i.marca === marca).map((i) => i.tecnologia))].sort();
  const plataformasDe = (marca, tec) => [...new Set(items.filter((i) => i.marca === marca && i.tecnologia === tec).map((i) => i.plataforma))].sort();

  const setCand = (idx, field, value) => {
    setCands((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      if (field === 'marca') return { marca: value, tecnologia: '', plataforma: '' };
      if (field === 'tecnologia') return { ...c, tecnologia: value, plataforma: '' };
      return { ...c, [field]: value };
    }));
  };
  const addCand = () => setCands((prev) => (prev.length >= 3 ? prev : [...prev, { ...EMPTY_CAND }]));
  const removeCand = (idx) => setCands((prev) => prev.filter((_, i) => i !== idx));

  const completos = cands.filter((c) => c.marca && c.tecnologia && c.plataforma);
  const modoReco = completos.length === 0;
  const testListo = !!(test.perdida || test.presupuestoCOP);
  const puedeAccionar = !loading && (modoReco ? testListo : true);

  const enviarLead = async () => {
    setLeadState((s) => ({ ...s, error: null }));
    if (!lead.nombre.trim() || !lead.telefono.trim()) {
      setLeadState((s) => ({ ...s, error: 'Nombre y teléfono son obligatorios.' })); return;
    }
    setLeadState((s) => ({ ...s, sending: true }));
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/comparador/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          marcaSugerida: result?.recomendacion?.ganadorEtiqueta || reco?.recomendaciones?.[0]?.opcion || null,
          candidatos: completos,
          test,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) setLeadState({ sending: false, done: false, error: j?.error || 'No se pudo enviar.' });
      else setLeadState({ sending: false, done: true, error: null });
    } catch {
      setLeadState({ sending: false, done: false, error: 'Error de conexión.' });
    }
  };

  const recomendar = async () => {
    setError(null); setResult(null); setReco(null); setLoading(true);
    setLeadState({ sending: false, done: false, error: null });
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/comparador/ai-recommend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) setError(j?.error || 'No se pudo generar la recomendación.');
      else setReco(j.data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally { setLoading(false); }
  };

  const comparar = async () => {
    if (modoReco) return recomendar();
    setError(null); setResult(null); setReco(null); setLoading(true);
    setLeadState({ sending: false, done: false, error: null });
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/comparador/ai-compare`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatos: completos, test }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) setError(j?.error || 'No se pudo generar la comparación.');
      else setResult(j.data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const precioDe = (et) => result?.precios?.find((p) => p.etiqueta === et)?.precio ?? null;

  const leadCapture = (
    <Paper sx={{ p: 3, borderRadius: 3, mt: 3, border: '1px solid rgba(8,89,70,0.15)' }} elevation={0}>
      {leadState.done ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <PhoneInTalkOutlinedIcon sx={{ fontSize: 44, color: '#085946', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>¡Gracias! Te contactaremos pronto.</Typography>
          <Typography color="text.secondary">Un asesor te llamará para orientarte sobre la opción que más te conviene.</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#085946', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneInTalkOutlinedIcon /> ¿Quieres que te orientemos?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Déjanos tus datos y un asesor te llamará para ayudarte a elegir y adaptar la mejor opción para tu pérdida.
          </Typography>
          {leadState.error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{leadState.error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Nombre" value={lead.nombre} onChange={(e) => setLead((l) => ({ ...l, nombre: e.target.value }))} fullWidth size="small" required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Teléfono" value={lead.telefono} onChange={(e) => setLead((l) => ({ ...l, telefono: e.target.value }))} fullWidth size="small" required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email (opcional)" type="email" value={lead.email} onChange={(e) => setLead((l) => ({ ...l, email: e.target.value }))} fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Ciudad (opcional)" value={lead.ciudad} onChange={(e) => setLead((l) => ({ ...l, ciudad: e.target.value }))} fullWidth size="small" /></Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" disabled={leadState.sending} onClick={enviarLead}
              sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
              {leadState.sending ? 'Enviando…' : 'Quiero que me llamen'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );

  return (
    <>
      <Helmet>
        <title>Comparador de audífonos con IA | OírConecta</title>
        <meta name="description" content="Compara hasta 3 audífonos por marca, tecnología y plataforma. Fortalezas, debilidades, precios reales en Colombia y un consejo según tu pérdida auditiva." />
        <link rel="canonical" href="https://oirconecta.com/comparador" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ height: '80px' }} />

        <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, color: '#085946', mb: 2 }}>
            Comparador de audífonos
          </Typography>
          <Typography variant="h6" component="p" sx={{ textAlign: 'center', color: '#6b7280', mb: 6, maxWidth: 820, mx: 'auto' }}>
            Elige hasta 3 opciones (marca, tecnología y plataforma), responde un breve test y la IA te muestra fortalezas, debilidades, precios reales y cuál te conviene según tu pérdida.
          </Typography>

          {loadingItems ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">Pronto habilitaremos el comparador.</Typography>
            </Box>
          ) : (
            <>
              {/* Selección de candidatos */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {cands.map((c, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(8,89,70,0.12)' }} elevation={0}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#085946' }}>Opción {idx + 1}</Typography>
                        {cands.length > 1 && (
                          <Button size="small" color="inherit" onClick={() => removeCand(idx)} sx={{ color: '#9ca3af', minWidth: 0 }}>Quitar</Button>
                        )}
                      </Box>
                      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                        <InputLabel>Marca</InputLabel>
                        <Select value={c.marca} label="Marca" onChange={(e) => setCand(idx, 'marca', e.target.value)}>
                          {marcas.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" sx={{ mb: 1.5 }} disabled={!c.marca}>
                        <InputLabel>Tecnología</InputLabel>
                        <Select value={c.tecnologia} label="Tecnología" onChange={(e) => setCand(idx, 'tecnologia', e.target.value)}>
                          {tecnologiasDe(c.marca).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" disabled={!c.tecnologia}>
                        <InputLabel>Plataforma</InputLabel>
                        <Select value={c.plataforma} label="Plataforma" onChange={(e) => setCand(idx, 'plataforma', e.target.value)}>
                          {plataformasDe(c.marca, c.tecnologia).map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Paper>
                  </Grid>
                ))}
                {cands.length < 3 && (
                  <Grid item xs={12} md={4}>
                    <Button onClick={addCand} fullWidth sx={{ height: '100%', minHeight: 120, border: '1px dashed rgba(8,89,70,0.4)', borderRadius: 3, color: '#085946' }}>
                      + Agregar opción
                    </Button>
                  </Grid>
                )}
              </Grid>

              {/* Test */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Cuéntanos un poco sobre ti</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Si no eliges marcas arriba, la IA te <strong>recomienda</strong> opciones según esto. Si eliges marcas, las <strong>compara</strong>.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {TEST.map((q) => (
                  <Grid item xs={12} sm={6} md={4} key={q.key}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{q.label}</InputLabel>
                      <Select value={test[q.key] || ''} label={q.label} onChange={(e) => setTest((t) => ({ ...t, [q.key]: e.target.value }))}>
                        {q.opts.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Presupuesto disponible (COP)" type="number" fullWidth size="small"
                    value={test.presupuestoCOP || ''} onChange={(e) => setTest((t) => ({ ...t, presupuestoCOP: e.target.value }))} />
                </Grid>
              </Grid>

              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Button variant="contained" size="large" startIcon={<AutoAwesomeIcon />} disabled={!puedeAccionar} onClick={comparar}
                  sx={{ borderRadius: '12px', fontWeight: 700, px: 4, py: 1.2, background: '#085946', '&:hover': { background: '#064a3a' } }}>
                  {loading ? 'Analizando…' : modoReco ? 'Recomiéndame con IA' : 'Comparar con IA'}
                </Button>
                {modoReco && !testListo && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Indica al menos tu pérdida o presupuesto, o elige marcas para comparar.</Typography>}
              </Box>

              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
              {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#085946' }} /></Box>}

              {/* Resultado */}
              {result && (
                <>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {result.candidatos.map((c) => {
                      const esGanador = result.recomendacion?.ganadorEtiqueta === c.etiqueta;
                      return (
                        <Grid item xs={12} md={result.candidatos.length > 1 ? 6 : 12} lg={result.candidatos.length >= 3 ? 4 : 6} key={c.etiqueta}>
                          <Card sx={{ height: '100%', borderRadius: 3, border: esGanador ? '2px solid #085946' : '1px solid rgba(0,0,0,0.08)' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{c.etiqueta}</Typography>
                                {esGanador && <Chip icon={<StarIcon />} label="Recomendado" size="small" color="success" sx={{ fontWeight: 700 }} />}
                              </Box>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: '#085946', mb: 2 }}>{formatPrice(precioDe(c.etiqueta))}</Typography>
                              <Divider sx={{ mb: 1.5 }} />
                              <Section icon={<CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#10B981' }} />} title="Fortalezas" items={c.fortalezas} color="#10B981" />
                              <Section icon={<ErrorOutlineIcon sx={{ fontSize: 18, color: '#F59E0B' }} />} title="Debilidades" items={c.debilidades} color="#F59E0B" />
                              <Section title="Bondades" items={c.bondades} color="#272F50" />
                              {c.usoRecomendado && (
                                <Box sx={{ mt: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Uso recomendado</Typography>
                                  <Typography variant="body2" color="text.secondary">{c.usoRecomendado}</Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {result.recomendacion && (
                    <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(8,89,70,0.05)', border: '1px solid rgba(8,89,70,0.15)' }} elevation={0}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#085946', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon /> Nuestra recomendación: {result.recomendacion.ganadorEtiqueta}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1.5 }}>{result.recomendacion.razon}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Consejo según tu pérdida</Typography>
                      <Typography variant="body2" color="text.secondary">{result.recomendacion.consejoPorPerdida}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Esta comparación es orientativa y generada con IA. No reemplaza la valoración de un profesional. Agenda una cita para una recomendación personalizada.
                      </Typography>
                    </Paper>
                  )}

                  {/* Captura de lead: orientación personalizada */}
                  {leadCapture}
                </>
              )}

              {/* Recomendaciones IA (modo recomendador) */}
              {reco && (
                <>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {reco.recomendaciones.map((r, i) => (
                      <Grid item xs={12} md={reco.recomendaciones.length >= 3 ? 4 : 6} key={i}>
                        <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{r.opcion}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#085946', mb: 1.5 }}>{r.rangoPrecioAprox}</Typography>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Por qué</Typography>
                              <Typography variant="body2" color="text.secondary">{r.porque}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ideal para</Typography>
                              <Typography variant="body2" color="text.secondary">{r.idealPara}</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(8,89,70,0.05)', border: '1px solid rgba(8,89,70,0.15)' }} elevation={0}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#085946', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon /> En resumen
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>{reco.resumen}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Consejo según tu pérdida</Typography>
                    <Typography variant="body2" color="text.secondary">{reco.consejoPorPerdida}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Recomendación orientativa generada con IA; los precios son aproximados. Agenda una valoración para confirmar la mejor opción.
                    </Typography>
                  </Paper>
                  {leadCapture}
                </>
              )}
            </>
          )}
        </Container>

        <Footer />
      </div>
    </>
  );
}

function Section({ icon, title, items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color }}>{title}</Typography>
      </Box>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {items.map((it, i) => <Typography component="li" variant="body2" color="text.secondary" key={i}>{it}</Typography>)}
      </Box>
    </Box>
  );
}
