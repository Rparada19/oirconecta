/**
 * Consola de Aura, el bot del WhatsApp corporativo de OírConecta.
 *
 * Solo aparece en el perfil del consultorio (el backend responde isAura:false a
 * los demás). Antes el flujo vivía escrito en el código y esta página solo
 * mostraba el "cerebro": aquí se ve, en el orden del chat, qué dice Aura en
 * cada paso, se editan esos mensajes y los precios, y se ve dónde se queda la
 * gente.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, Typography, Button, Stack, Chip, CircularProgress, Alert, Tabs, Tab,
  TextField, Switch, FormControlLabel, IconButton, Tooltip, Snackbar, MenuItem,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { directoryApi } from '../../services/directoryAccountApi';
import { C, MONO, PanelHead, Label } from './iaConsole';

const WA_BUBBLE = '#005C4B';

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** *negrita* de WhatsApp y saltos de línea, como se ve en el teléfono. */
function WhatsText({ text }) {
  return String(text || '').split(/(\*[^*\n]+\*)/g).map((part, i) =>
    /^\*[^*\n]+\*$/.test(part)
      ? <strong key={i}>{part.slice(1, -1)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>);
}

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clone(s) {
  return { precios: { ...s.precios }, textos: { ...s.textos } };
}

export default function AuraConsole() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState(0);
  const [dias, setDias] = useState(30);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async (d = dias) => {
    const r = await directoryApi.get(`/api/ia/me/aura?dias=${d}`);
    if (r.error) { setError(r.error); return; }
    const v = r.data?.data;
    setData(v);
    if (v?.isAura) setDraft(clone(v.settings));
  };

  useEffect(() => { load(); }, []);

  const cambios = useMemo(() => {
    if (!data?.isAura || !draft) return 0;
    let n = 0;
    for (const g of ['precios', 'textos']) {
      for (const k of Object.keys(draft[g])) if (draft[g][k] !== data.settings[g][k]) n += 1;
    }
    return n;
  }, [data, draft]);

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>No se pudo cargar la consola de Aura: {error}</Alert>;
  if (!data) return <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={22} /></Box>;
  if (!data.isAura) return null;

  const { defaults, pasos, stats } = data;
  const setTexto = (k, v) => setDraft((d) => ({ ...d, textos: { ...d.textos, [k]: v } }));
  const setPrecio = (k, v) => setDraft((d) => ({ ...d, precios: { ...d.precios, [k]: v } }));

  const guardar = async () => {
    setSaving(true);
    const r = await directoryApi.put('/api/ia/me/aura', draft);
    setSaving(false);
    if (r.error) { setToast({ severity: 'error', msg: r.error }); return; }
    const s = r.data.data;
    setData((d) => ({ ...d, settings: s }));
    setDraft(clone(s));
    setEditing(null);
    setToast({ severity: 'success', msg: 'Guardado. Aura lo usa desde el próximo mensaje.' });
  };

  return (
    <Card sx={{ mt: 2, overflow: 'visible' }}>
      <PanelHead
        eyebrow="Aura · WhatsApp del consultorio"
        title="Cómo responde Aura"
        hint="Lo que Aura dice en cada paso del chat, los precios que da y dónde se queda la gente. Los cambios que guardes aquí los usa el bot de inmediato."
        right={(
          <TextField select size="small" value={dias} label="Periodo"
            onChange={(e) => { setDias(e.target.value); load(e.target.value); }} sx={{ minWidth: 140 }}>
            {[7, 30, 90].map((d) => <MenuItem key={d} value={d}>Últimos {d} días</MenuItem>)}
          </TextField>
        )}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile
        sx={{ px: { xs: 1, md: 2 }, borderBottom: `1px solid ${C.line}` }}>
        <Tab label="Resumen" sx={{ textTransform: 'none' }} />
        <Tab label="Flujo de respuestas" sx={{ textTransform: 'none' }} />
        <Tab label="Precios y promoción" sx={{ textTransform: 'none' }} />
        <Tab label="Seguimientos" sx={{ textTransform: 'none' }} />
      </Tabs>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {tab === 0 && <Resumen stats={stats} precios={data.settings.precios} />}
        {tab === 1 && (
          <Flujo pasos={pasos} draft={draft} defaults={defaults} saved={data.settings}
            editing={editing} setEditing={setEditing} setTexto={setTexto} />
        )}
        {tab === 2 && <Precios draft={draft} setPrecio={setPrecio} />}
        {tab === 3 && <Seguimientos stats={stats} />}
      </Box>

      {cambios > 0 && (
        <Box sx={{
          position: 'sticky', bottom: 0, zIndex: 2, px: { xs: 2, md: 3 }, py: 1.5,
          borderTop: `1px solid ${C.line}`, bgcolor: C.ink3, borderRadius: '0 0 12px 12px',
          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
        }}>
          <Typography sx={{ flex: 1, fontSize: '0.85rem', color: C.bone }}>
            {cambios === 1 ? '1 cambio sin guardar' : `${cambios} cambios sin guardar`}
          </Typography>
          <Button onClick={() => { setDraft(clone(data.settings)); setEditing(null); }} sx={{ textTransform: 'none', color: C.mute }}>
            Descartar
          </Button>
          <Button variant="contained" onClick={guardar} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Box>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Card>
  );
}

function Resumen({ stats, precios }) {
  const e = stats.embudo;
  const filas = [
    { label: 'Escribieron', n: e.conversaciones },
    { label: 'Vieron horarios', n: e.vieronHorarios },
    { label: 'Agendaron', n: e.agendadas },
    { label: 'Asistieron', n: e.asistieron },
  ];
  const alertas = [];
  const r2 = stats.recordatorios.dosHoras;
  if (r2.fallidos > 0) {
    alertas.push(`El recordatorio de 2 horas falló ${r2.fallidos} ${r2.fallidos === 1 ? 'vez' : 'veces'}${r2.error ? ` (${r2.error.slice(0, 120)})` : ''}.`);
  }
  if (stats.promesas.sinCumplir > 0) {
    alertas.push(`Aura prometió que "el equipo te escribe" en ${stats.promesas.hechas} chats y en ${stats.promesas.sinCumplir} nadie escribió después.`);
  }
  if (e.sinCorreo > 0) {
    alertas.push(`${e.sinCorreo} de ${e.agendadas} citas quedaron sin correo, así que no reciben la confirmación por email.`);
  }
  if (precios.promoActiva && precios.promoHasta && precios.promoHasta < hoy()) {
    alertas.push(`La promoción venció el ${precios.promoHasta} y Aura ya no la menciona. Actualízala en "Precios y promoción".`);
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Label color={C.trace}>Embudo · últimos {stats.dias} días</Label>
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {filas.map((f) => {
            const w = pct(f.n, filas[0].n);
            return (
              <Box key={f.label} sx={{ display: 'grid', gridTemplateColumns: { xs: '110px 1fr 70px', md: '160px 1fr 90px' }, alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: C.mute }}>{f.label}</Typography>
                <Box sx={{ height: 22, bgcolor: C.ink3, borderRadius: '6px', overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.max(w, f.n ? 2 : 0)}%`, height: '100%', bgcolor: C.signal, opacity: 0.85 }} />
                </Box>
                <Typography sx={{ fontFamily: MONO, fontSize: '0.85rem', color: C.bone, textAlign: 'right' }}>
                  {f.n} <Box component="span" sx={{ color: C.dim }}>{w}%</Box>
                </Typography>
              </Box>
            );
          })}
        </Stack>
        <Typography sx={{ fontSize: '0.8rem', color: C.mute, mt: 1.5 }}>
          {e.otraCiudad} personas dijeron que estaban en otra ciudad. De las citas: {e.noLlegaron} no llegaron, {e.canceladas} se cancelaron y {e.porVenir} están por venir.
        </Typography>
      </Box>

      <Box>
        <Label color={alertas.length ? C.warn : C.ok}>{alertas.length ? 'Para revisar' : 'Sin alertas'}</Label>
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {alertas.map((a) => <Alert key={a} severity="warning" variant="outlined">{a}</Alert>)}
          {!alertas.length && <Typography sx={{ fontSize: '0.85rem', color: C.mute }}>Nada fallando en este periodo.</Typography>}
        </Stack>
      </Box>
    </Stack>
  );
}

function Flujo({ pasos, draft, defaults, saved, editing, setEditing, setTexto }) {
  return (
    <Stack spacing={2.5}>
      <Typography sx={{ fontSize: '0.85rem', color: C.mute }}>
        Así va el chat, en orden. Toca el lápiz para cambiar un mensaje. Usa *asteriscos* para negrita, como en WhatsApp. Los botones los arma el sistema y no se editan aquí.
      </Typography>
      {pasos.map((p, i) => {
        const v = draft.textos[p.key];
        const cambiado = v !== saved.textos[p.key];
        const personalizado = v !== defaults.textos[p.key];
        const abierto = editing === p.key;
        return (
          <Box key={p.key} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: { xs: 1, md: 2.5 } }}>
            <Box>
              <Label color={C.trace}>Paso {i + 1}</Label>
              <Typography sx={{ fontWeight: 700, color: C.bone, fontSize: '0.95rem', mt: 0.5 }}>{p.titulo}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: C.mute, mt: 0.25, lineHeight: 1.5 }}>{p.cuando}</Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                {cambiado && <Chip size="small" label="Sin guardar" sx={{ bgcolor: 'rgba(251,191,36,0.12)', color: C.warn }} />}
                {!cambiado && personalizado && <Chip size="small" label="Editado" sx={{ bgcolor: 'rgba(124,92,255,0.12)', color: C.signalLo }} />}
              </Stack>
            </Box>
            <Box sx={{ maxWidth: 520 }}>
              {abierto ? (
                <Box>
                  <TextField value={v} onChange={(e) => setTexto(p.key, e.target.value)} multiline minRows={3} fullWidth autoFocus
                    inputProps={{ maxLength: 900 }}
                    helperText={p.variables?.length
                      ? `Puedes usar ${p.variables.map((x) => `{${x}}`).join(', ')}. ${v.length}/900`
                      : `${v.length}/900`} />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" startIcon={<CheckRoundedIcon />} onClick={() => setEditing(null)} sx={{ textTransform: 'none' }}>
                      Listo
                    </Button>
                    {personalizado && (
                      <Button size="small" startIcon={<RestartAltRoundedIcon />} onClick={() => setTexto(p.key, defaults.textos[p.key])}
                        sx={{ textTransform: 'none', color: C.mute }}>
                        Restaurar original
                      </Button>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{
                    bgcolor: WA_BUBBLE, color: '#E9EDEF', borderRadius: '10px 10px 10px 2px', px: 1.75, py: 1.25, pr: 5,
                    fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    <WhatsText text={v} />
                  </Box>
                  <Tooltip title="Editar mensaje">
                    <IconButton size="small" onClick={() => setEditing(p.key)}
                      sx={{ position: 'absolute', top: 4, right: 4, color: '#E9EDEF' }}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {p.botones?.length > 0 && (
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                  {p.botones.map((b) => (
                    <Chip key={b} label={b} size="small" variant="outlined" sx={{ borderColor: C.line, color: C.trace }} />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function Precios({ draft, setPrecio }) {
  const p = draft.precios;
  const campo = (k, label, helper) => (
    <TextField label={label} value={p[k] || ''} onChange={(e) => setPrecio(k, e.target.value)} helperText={helper} fullWidth size="small" />
  );
  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Alert severity="info" variant="outlined">
        Estos precios mandan sobre el campo de texto "Precios" del cerebro más abajo. Aura los usa en los botones de precios y cuando le preguntan.
      </Alert>
      <Box>
        <Label color={C.trace}>Precios</Label>
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {campo('audifonosDesde', 'Audífonos desde', 'El precio más bajo que Aura menciona. Ejemplo: $800.000')}
          {campo('impresos', 'Valoración con exámenes impresos', 'Si la persona quiere llevarse los exámenes impresos')}
        </Stack>
      </Box>
      <Box>
        <Label color={C.trace}>Promoción del mes</Label>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControlLabel
            control={<Switch checked={!!p.promoActiva} onChange={(e) => setPrecio('promoActiva', e.target.checked)} />}
            label={<Typography sx={{ fontSize: '0.9rem' }}>Aura menciona la promoción</Typography>} />
          {campo('promoProducto', 'Producto', 'Ejemplo: audífonos recargables')}
          {campo('promoPrecio', 'Precio de la promoción', 'Ejemplo: $1.800.000')}
          <TextField label="Vigente hasta" type="date" value={p.promoHasta || ''} size="small" fullWidth
            onChange={(e) => setPrecio('promoHasta', e.target.value)} InputLabelProps={{ shrink: true }}
            helperText="Después de esta fecha Aura deja de mencionarla sola" />
        </Stack>
      </Box>
    </Stack>
  );
}

function Seguimientos({ stats }) {
  const s = stats.seguimientos;
  const filas = [
    { label: 'A las 3 horas sin respuesta', d: s.retoma },
    { label: 'A las 20 horas (último toque)', d: s.ultimoToque },
    { label: 'Días 3 y 7 (maduración)', d: s.maduracion },
  ];
  const r = stats.recordatorios;
  return (
    <Stack spacing={3}>
      <Box>
        <Label color={C.trace}>Mensajes automáticos · últimos {stats.dias} días</Label>
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {filas.map((f) => (
            <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: `1px solid ${C.line}`, borderRadius: '10px' }}>
              <Typography sx={{ flex: 1, fontSize: '0.88rem', color: C.bone }}>{f.label}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: '0.82rem', color: C.mute }}>
                {f.d.enviados} enviados · {f.d.respondidos} respondieron
              </Typography>
              <Chip size="small" label={`${pct(f.d.respondidos, f.d.enviados)}%`} sx={{ bgcolor: C.ink3, color: C.bone, fontFamily: MONO }} />
            </Box>
          ))}
        </Stack>
        <Typography sx={{ fontSize: '0.8rem', color: C.mute, mt: 1 }}>
          Los textos de las 3 y 20 horas se editan en "Flujo de respuestas".
        </Typography>
      </Box>
      <Box>
        <Label color={C.trace}>Recordatorios de cita</Label>
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {[
            { label: 'Un día antes', d: r.dia },
            { label: 'Dos horas antes', d: r.dosHoras },
          ].map((f) => (
            <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: `1px solid ${f.d.fallidos ? C.warn : C.line}`, borderRadius: '10px' }}>
              <Typography sx={{ flex: 1, fontSize: '0.88rem', color: C.bone }}>{f.label}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: '0.82rem', color: f.d.fallidos ? C.warn : C.mute }}>
                {f.d.enviados} enviados · {f.d.fallidos} fallidos
              </Typography>
            </Box>
          ))}
          {r.dosHoras.error && (
            <Typography sx={{ fontSize: '0.78rem', color: C.mute, fontFamily: MONO }}>Último error: {r.dosHoras.error.slice(0, 200)}</Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
