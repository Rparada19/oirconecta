import React, { useState, useEffect, useMemo } from 'react';
import { errorDeContacto } from '../utils/validacionContacto';
import { Helmet } from 'react-helmet';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Stack, Chip, ToggleButton, ToggleButtonGroup,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, MenuItem,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const GREEN = '#085946';
const NAVY = '#272F50';
const GOLD = '#C9A86A';
const MUTED = '#5b6b66';

const fmt = (n) => `$${(n || 0).toLocaleString('es-CO')}`;

/** Subtítulo y etiqueta por tier. El resto (precio, beneficios) viene del API. */
const TIER_META = {
  VISIBLE: { sub: 'Que te encuentren y te escriban', tag: null },
  PRO:     { sub: 'Que te agenden sin contestar el teléfono', tag: 'Más elegido' },
  TOTAL:   { sub: 'Que te respondan por ti, a cualquier hora', tag: 'Con agente IA' },
};

/**
 * Tarifa por sede para organizaciones con más de una sede (NIT único,
 * una sola factura, un administrador global). No se vende en línea:
 * de dos sedes en adelante la cotización pasa por el equipo comercial.
 */
const MULTISEDE = [
  { tier: 'Visible', porSede: 27000 },
  { tier: 'Pro',     porSede: 60000 },
  { tier: 'Total',   porSede: 105000 },
];

const FAQ = [
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. No hay permanencia ni cláusula de salida. Cancelas desde tu portal y el plan sigue activo hasta el final del periodo que ya pagaste.',
  },
  {
    q: '¿Qué pasa si me atraso en un pago?',
    a: 'Tienes 10 días de gracia con el perfil funcionando normalmente. Te avisamos por correo y WhatsApp antes de que se oculte del directorio.',
  },
  {
    q: '¿Cómo pago?',
    a: 'Con tarjeta, que se debita automáticamente cada mes, o por PSE. Si eliges PSE te enviamos el recordatorio con el enlace de pago antes de cada vencimiento.',
  },
  {
    q: 'Tengo varias sedes. ¿Pago una suscripción por cada una?',
    a: 'Sí, una por sede, pero con tarifa reducida y una sola factura para toda la organización. Una IPS de una sola sede paga lo mismo que un profesional independiente.',
  },
  {
    q: '¿Qué es una conversación del agente IA?',
    a: 'Un intercambio con un paciente, sin importar cuántos mensajes tenga. Cuentan igual las del chat del sitio, las del widget en tu web y las de WhatsApp, sobre el mismo cupo.',
  },
  {
    q: '¿El WhatsApp del Plan Total es mi número?',
    a: 'Sí, es tu propio número conectado a la API de Meta, no uno nuestro. Ten en cuenta que un número conectado a la API deja de funcionar en la aplicación del celular, así que normalmente se usa uno dedicado. Nosotros te acompañamos en el montaje.',
  },
];

const DEMO_INICIAL = { nombre: '', empresa: '', email: '', telefono: '', ciudad: '', sedes: '', plan: '', mensaje: '' };

export default function PreciosPage() {
  const [periodo, setPeriodo] = useState('MENSUAL');
  const [demoAbierto, setDemoAbierto] = useState(false);
  const [demo, setDemo] = useState(DEMO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [demoOk, setDemoOk] = useState(false);
  const [audiencia, setAudiencia] = useState('profesional');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/subscriptions/public/plans`)
      .then((r) => r.json())
      .then((j) => setPlans(j?.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // La solicitud entra a Captación comercial → Leads (SalesLead), que es el
  // embudo de clientes del directorio. No se mezcla con los leads de pacientes.
  const enviarDemo = async () => {
    setDemoError('');
    if (!demo.nombre.trim()) return setDemoError('Necesitamos tu nombre.');
    if (!demo.email.trim() && !demo.telefono.trim()) {
      return setDemoError('Déjanos un correo o un teléfono para responderte.');
    }
    setEnviando(true);
    try {
      const r = await fetch(`${API}/api/sales/public/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demo),
      });
      const j = await r.json();
      if (j?.success) { setDemoOk(true); setDemo(DEMO_INICIAL); }
      else setDemoError(j?.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.');
    } catch {
      setDemoError('No pudimos enviar tu solicitud. Revisa tu conexión.');
    } finally {
      setEnviando(false);
    }
  };

  const visibles = useMemo(
    () => plans.filter((p) => p.periodo === periodo),
    [plans, periodo],
  );

  return (
    <Box sx={{ bgcolor: '#fbfcfc', minHeight: '100vh' }}>
      <Helmet>
        <title>Precios · Planes para profesionales de la audición | OírConecta</title>
        <meta
          name="description"
          content="Planes de OírConecta para audiólogos, fonoaudiólogos, otólogos, centros auditivos e IPS en Colombia. Directorio, agenda online y agente de IA en WhatsApp desde $40.000 al mes."
        />
        <link rel="canonical" href="https://oirconecta.com/precios/" />
        <meta property="og:title" content="Precios · Planes para profesionales de la audición | OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/precios/" />
      </Helmet>

      <Header />
      <Box sx={{ height: 72 }} />

      {/* Hero */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, mb: 2,
          }}
        >
          Planes y precios
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 600, color: NAVY,
            lineHeight: 1.08, letterSpacing: '-0.02em', mb: 2.5,
          }}
        >
          Elige cómo quieres que te <em style={{ color: GREEN }}>encuentren</em>.
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: '1.0625rem', maxWidth: 620, mx: 'auto', lineHeight: 1.65 }}>
          Un solo lugar donde los pacientes te buscan, agendan contigo y reciben respuesta.
          Sin permanencia: cancelas cuando quieras.
        </Typography>

        {/* Audiencia */}
        <ToggleButtonGroup
          exclusive
          value={audiencia}
          onChange={(e, v) => v && setAudiencia(v)}
          sx={{
            mt: 4,
            bgcolor: '#fff', borderRadius: '999px', p: 0.5,
            border: '1px solid rgba(8,89,70,0.14)',
            '& .MuiToggleButton-root': {
              border: 0, borderRadius: '999px !important', px: 3, py: 1,
              textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', color: MUTED,
              '&.Mui-selected': { bgcolor: NAVY, color: '#fff', '&:hover': { bgcolor: NAVY } },
            },
          }}
        >
          <ToggleButton value="profesional">Profesional independiente</ToggleButton>
          <ToggleButton value="ips">IPS y centros auditivos</ToggleButton>
        </ToggleButtonGroup>
      </Container>

      {audiencia === 'profesional' ? (
        <Container maxWidth="lg" sx={{ pb: 10 }}>
          {/* Periodo */}
          <Stack alignItems="center" sx={{ mb: 5 }}>
            <ToggleButtonGroup
              exclusive
              value={periodo}
              onChange={(e, v) => v && setPeriodo(v)}
              size="small"
              sx={{
                bgcolor: '#eef4f2', borderRadius: '999px', p: 0.4,
                '& .MuiToggleButton-root': {
                  border: 0, borderRadius: '999px !important', px: 2.5, py: 0.75,
                  textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', color: MUTED,
                  '&.Mui-selected': { bgcolor: '#fff', color: GREEN, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
                },
              }}
            >
              <ToggleButton value="MENSUAL">Mensual</ToggleButton>
              <ToggleButton value="ANUAL">Anual · 12 meses</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress size={36} sx={{ color: GREEN }} />
            </Stack>
          ) : visibles.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: MUTED, py: 6 }}>
              No pudimos cargar los planes en este momento.{' '}
              <Box component={RouterLink} to="/contacto" sx={{ color: GREEN, fontWeight: 600 }}>
                Escríbenos
              </Box>{' '}
              y te los contamos.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                alignItems: 'stretch',
              }}
            >
              {visibles.map((p) => {
                const meta = TIER_META[p.tier] || {};
                const destacado = p.tier === 'PRO';
                return (
                  <Box
                    key={p.code}
                    sx={{
                      position: 'relative',
                      bgcolor: '#fff',
                      border: destacado ? `2px solid ${GREEN}` : '1px solid rgba(8,89,70,0.12)',
                      borderRadius: '16px',
                      p: { xs: 3, md: 3.5 },
                      display: 'flex', flexDirection: 'column',
                      boxShadow: destacado ? '0 12px 32px rgba(8,89,70,0.12)' : '0 2px 10px rgba(39,47,80,0.05)',
                    }}
                  >
                    {meta.tag && (
                      <Chip
                        label={meta.tag}
                        size="small"
                        sx={{
                          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                          bgcolor: destacado ? GREEN : GOLD, color: '#fff',
                          fontWeight: 700, fontSize: '0.6875rem', letterSpacing: '0.06em',
                        }}
                      />
                    )}

                    <Typography
                      sx={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '1.75rem', fontWeight: 600, color: NAVY, mb: 0.5,
                      }}
                    >
                      {p.nombre.split('·')[0].trim()}
                    </Typography>
                    <Typography sx={{ color: MUTED, fontSize: '0.9375rem', mb: 3, minHeight: 44 }}>
                      {meta.sub}
                    </Typography>

                    <Stack direction="row" alignItems="baseline" spacing={0.75}>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, color: NAVY, letterSpacing: '-0.02em' }}>
                        {fmt(p.precioCOP)}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontSize: '0.9375rem' }}>
                        {p.periodo === 'ANUAL' ? '/año' : '/mes'}
                      </Typography>
                    </Stack>
                    <Typography sx={{ color: MUTED, fontSize: '0.8125rem', mt: 0.5, mb: 2.5 }}>
                      + IVA 19% — total {fmt(p.totalCOP)}
                    </Typography>

                    {p.trialDays > 0 && (
                      <Chip
                        label={`${p.trialDays} días de prueba gratis`}
                        size="small"
                        sx={{
                          alignSelf: 'flex-start', mb: 2.5,
                          bgcolor: 'rgba(8,89,70,0.08)', color: GREEN, fontWeight: 600, fontSize: '0.75rem',
                        }}
                      />
                    )}

                    <Stack spacing={1.25} sx={{ mb: 3, flexGrow: 1 }}>
                      {(p.beneficios || []).map((b) => (
                        <Stack key={b} direction="row" spacing={1.25} alignItems="flex-start">
                          <CheckIcon sx={{ fontSize: 18, color: GREEN, mt: '2px', flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '0.9375rem', color: '#3b4a46', lineHeight: 1.5 }}>
                            {b}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      component={RouterLink}
                      to="/registro-profesional"
                      variant={destacado ? 'contained' : 'outlined'}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 600, py: 1.25,
                        ...(destacado
                          ? { bgcolor: GREEN, '&:hover': { bgcolor: '#064c3c' } }
                          : { color: GREEN, borderColor: 'rgba(8,89,70,0.35)', '&:hover': { borderColor: GREEN, bgcolor: 'rgba(8,89,70,0.04)' } }),
                      }}
                    >
                      Empezar
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Container>
      ) : (
        /* ── IPS y centros ── */
        <Container maxWidth="md" sx={{ pb: 10 }}>
          <Box sx={{ bgcolor: '#fff', border: '1px solid rgba(8,89,70,0.12)', borderRadius: '16px', p: { xs: 3, md: 5 } }}>
            <Typography
              sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.875rem', fontWeight: 600, color: NAVY, mb: 1.5 }}
            >
              Una organización, una factura
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '1rem', lineHeight: 1.7, mb: 4 }}>
              Cada sede tiene su ficha, su agenda y su equipo. La organización tiene un solo
              administrador que las ve todas y recibe una sola factura, sin importar cuántas sean.
              Una IPS de una sola sede paga la misma tarifa que un profesional independiente.
            </Typography>

            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, mb: 1.5,
              }}
            >
              Tarifa por sede · desde dos sedes
            </Typography>

            <Table size="small" sx={{ mb: 4 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: NAVY }}>Plan</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: NAVY }}>Por sede / mes</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: NAVY }}>Con IVA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MULTISEDE.map((m) => (
                  <TableRow key={m.tier}>
                    <TableCell sx={{ fontWeight: 600, color: '#3b4a46' }}>{m.tier}</TableCell>
                    <TableCell align="right" sx={{ color: '#3b4a46' }}>{fmt(m.porSede)}</TableCell>
                    <TableCell align="right" sx={{ color: MUTED }}>{fmt(Math.round(m.porSede * 1.19))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography sx={{ color: MUTED, fontSize: '0.875rem', lineHeight: 1.65, mb: 4 }}>
              En el plan Total cada sede suma 160 conversaciones al mes del agente de IA, y el
              cupo se comparte entre todas: tres sedes disponen de 480 conversaciones en común.
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                onClick={() => { setDemoOk(false); setDemoError(''); setDemoAbierto(true); }}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, py: 1.25, px: 3, bgcolor: GREEN, '&:hover': { bgcolor: '#064c3c' } }}
              >
                Solicitar una demostración
              </Button>
              <Typography sx={{ color: MUTED, fontSize: '0.875rem' }}>
                Te acompañamos en el montaje de las sedes y la capacitación del equipo.
              </Typography>
            </Stack>
          </Box>
        </Container>
      )}

      {/* Preguntas */}
      <Box sx={{ bgcolor: '#f4f7f6', py: { xs: 6, md: 9 } }}>
        <Container maxWidth="md">
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 600, color: NAVY,
              textAlign: 'center', mb: 5,
            }}
          >
            Tus preguntas, nuestras respuestas
          </Typography>
          <Stack spacing={3}>
            {FAQ.map((f) => (
              <Box key={f.q} sx={{ bgcolor: '#fff', borderRadius: '12px', p: 3, border: '1px solid rgba(8,89,70,0.08)' }}>
                <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '1.0625rem', mb: 1 }}>
                  {f.q}
                </Typography>
                <Typography sx={{ color: MUTED, fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  {f.a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Solicitud de demostración → Captación comercial */}
      <Dialog open={demoAbierto} onClose={() => setDemoAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: NAVY }}>
          {demoOk ? 'Recibimos tu solicitud' : 'Solicitar una demostración'}
        </DialogTitle>
        <DialogContent>
          {demoOk ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Gracias. Un asesor te contacta en las próximas 24 horas hábiles para agendar la demostración.
            </Alert>
          ) : (
            <>
              <Typography sx={{ color: MUTED, fontSize: '0.9375rem', mb: 2.5 }}>
                Cuéntanos de tu organización y te mostramos cómo quedaría con tus sedes.
              </Typography>
              {demoError && <Alert severity="error" sx={{ mb: 2 }}>{demoError}</Alert>}
              <Stack spacing={2}>
                <TextField label="Tu nombre" required size="small" fullWidth
                  value={demo.nombre} onChange={(e) => setDemo({ ...demo, nombre: e.target.value })} />
                <TextField label="Nombre de la IPS o centro" size="small" fullWidth
                  value={demo.empresa} onChange={(e) => setDemo({ ...demo, empresa: e.target.value })} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Correo" type="email" size="small" fullWidth
                    value={demo.email} onChange={(e) => setDemo({ ...demo, email: e.target.value })}
                    error={!!errorDeContacto('email', demo.email)}
                    helperText={errorDeContacto('email', demo.email) || ' '} />
                  <TextField label="Teléfono" size="small" fullWidth
                    value={demo.telefono} onChange={(e) => setDemo({ ...demo, telefono: e.target.value })}
                    error={!!errorDeContacto('telefono', demo.telefono)}
                    helperText={errorDeContacto('telefono', demo.telefono) || ' '} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Ciudad" size="small" fullWidth
                    value={demo.ciudad} onChange={(e) => setDemo({ ...demo, ciudad: e.target.value })} />
                  <TextField label="¿Cuántas sedes?" size="small" fullWidth
                    value={demo.sedes} onChange={(e) => setDemo({ ...demo, sedes: e.target.value })} />
                </Stack>
                <TextField label="Plan de interés" select size="small" fullWidth
                  value={demo.plan} onChange={(e) => setDemo({ ...demo, plan: e.target.value })}>
                  <MenuItem value="">Aún no lo sé</MenuItem>
                  <MenuItem value="Visible">Visible</MenuItem>
                  <MenuItem value="Pro">Pro</MenuItem>
                  <MenuItem value="Total">Total</MenuItem>
                </TextField>
                <TextField label="¿Algo que debamos saber?" size="small" fullWidth multiline rows={3}
                  value={demo.mensaje} onChange={(e) => setDemo({ ...demo, mensaje: e.target.value })} />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDemoAbierto(false)} sx={{ textTransform: 'none', color: MUTED }}>
            {demoOk ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!demoOk && (
            <Button onClick={enviarDemo} disabled={enviando} variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', bgcolor: GREEN, '&:hover': { bgcolor: '#064c3c' } }}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
}
