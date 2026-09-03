/**
 * CRM · Aliados referidores — /portal-crm/aliados  (solo ADMIN)
 *
 * Dos niveles: la lista de aliados y, al entrar a uno, sus referidos con la
 * historia clínica y el corte de comisiones.
 *
 * OJO con la frontera de datos: esta pantalla es del equipo interno, así que
 * muestra nombre completo, contacto y si tiene pérdida auditiva. La pantalla
 * del aliado (/portal-crm/aliado/:code) NO muestra nada de eso — ver
 * partnerPortal.service en el backend.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, Stack, Button, TextField, Alert, Chip, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Grid, FormControlLabel, Checkbox, MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/apiClient';

const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

const ESTADO_META = {
  REFERIDO: { label: 'Referido', color: '#64748b', bg: '#f1f5f9' },
  AGENDADO: { label: 'Cita agendada', color: '#6d28d9', bg: '#faf5ff' },
  VALORADO: { label: 'Valoración hecha', color: '#0369a1', bg: '#eff6ff' },
  COTIZADO: { label: 'Cotizado', color: '#b45309', bg: '#fffbeb' },
  VENDIDO: { label: 'Vendido', color: '#15803d', bg: '#f0fdf4' },
};

const COMISION_META = {
  CAUSADA: { label: 'Por liquidar', color: '#b45309', bg: '#fffbeb' },
  LIQUIDADA: { label: 'Liquidada', color: '#0369a1', bg: '#eff6ff' },
  PAGADA: { label: 'Pagada', color: '#15803d', bg: '#f0fdf4' },
  ANULADA: { label: 'Anulada', color: '#78716c', bg: '#f5f5f4' },
};

const cop = (n) =>
  n == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fecha = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

function Etiqueta({ meta }) {
  return <Chip label={meta.label} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }} />;
}

/** Copia al portapapeles y avisa. Sin librería: es una línea del navegador. */
function BotonCopiar({ texto, titulo }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sin permiso de portapapeles */ }
  };
  return (
    <Tooltip title={copiado ? '¡Copiado!' : (titulo || 'Copiar')}>
      <IconButton onClick={copiar} size="small"><ContentCopyOutlinedIcon fontSize="small" /></IconButton>
    </Tooltip>
  );
}

const CATEGORIAS = [
  { v: 'HEARING_AID', l: 'Audífonos' },
  { v: 'ACCESSORY', l: 'Accesorios' },
  { v: 'SERVICE', l: 'Consultas y servicios' },
];

const VACIO = {
  nombre: '', tipo: 'EMPRESA', comisionPct: '10', nit: '', direccion: '', ciudad: '',
  sitioWeb: '', instagram: '', facebook: '', linkedin: '', tiktok: '',
  contactoNombre: '', contactoCargo: '', contactoEmail: '', contactoTelefono: '',
  convenioDesde: '', convenioHasta: '', notas: '',
  comisionaCategorias: ['HEARING_AID'], newsletterOptIn: false,
};

/**
 * Ficha del aliado. El mismo formulario crea y edita: son los mismos campos y
 * mantener dos formularios en paralelo es la forma segura de que se desincronicen.
 */
function DialogoFicha({ abierto, aliado, onCerrar, onGuardado }) {
  const editando = !!aliado;
  const [f, setF] = useState(VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setError('');
    if (!aliado) { setF(VACIO); return; }
    setF({
      ...VACIO,
      ...Object.fromEntries(Object.keys(VACIO).map((k) => [k, aliado[k] ?? VACIO[k]])),
      comisionPct: String(aliado.comisionPct ?? 10),
      comisionaCategorias: aliado.comisionaCategorias?.length ? aliado.comisionaCategorias : ['HEARING_AID'],
      newsletterOptIn: !!aliado.newsletterOptIn,
    });
  }, [abierto, aliado]);

  const set = (campo) => (e) => setF((p) => ({ ...p, [campo]: e.target.value }));

  const alternarCategoria = (v) => setF((p) => ({
    ...p,
    comisionaCategorias: p.comisionaCategorias.includes(v)
      ? p.comisionaCategorias.filter((x) => x !== v)
      : [...p.comisionaCategorias, v],
  }));

  const guardar = async () => {
    setError(''); setGuardando(true);
    const cuerpo = { ...f, comisionPct: Number(f.comisionPct) };
    const res = editando
      ? await api.patch(`/api/aliados-admin/${aliado.id}`, cuerpo)
      : await api.post('/api/aliados-admin', cuerpo);
    setGuardando(false);
    if (res?.data?.success) onGuardado(res.data.data);
    else setError(res?.data?.error || res?.error || 'No se pudo guardar');
  };

  const Seccion = ({ children }) => (
    <Grid item xs={12}>
      <Typography sx={{ ...SERIF, fontSize: 15, color: NAVY, mt: 1 }}>{children}</Typography>
      <Divider sx={{ mt: 1 }} />
    </Grid>
  );

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="md" fullWidth>
      <DialogTitle sx={{ ...SERIF, color: NAVY }}>
        {editando ? `Editar ${aliado.nombre}` : 'Nuevo aliado'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Seccion>Identificación</Seccion>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre" value={f.nombre} onChange={set('nombre')} size="small" fullWidth required
              helperText={editando ? 'Cambiarlo cambia el texto del QR: las tarjetas ya impresas siguen sirviendo por el código.' : 'Aparece en el mensaje del QR: “Vengo de …”'} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select label="Tipo" value={f.tipo} onChange={set('tipo')} size="small" fullWidth>
              <MenuItem value="EMPRESA">Empresa</MenuItem>
              <MenuItem value="MEDICO">Médico que remite</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="NIT o cédula" value={f.nit} onChange={set('nit')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Dirección" value={f.direccion} onChange={set('direccion')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Ciudad" value={f.ciudad} onChange={set('ciudad')} size="small" fullWidth />
          </Grid>

          <Seccion>Persona de contacto</Seccion>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre" value={f.contactoNombre} onChange={set('contactoNombre')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Cargo" value={f.contactoCargo} onChange={set('contactoCargo')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Correo" type="email" value={f.contactoEmail} onChange={set('contactoEmail')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Teléfono" value={f.contactoTelefono} onChange={set('contactoTelefono')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox checked={f.newsletterOptIn}
                onChange={(e) => setF((p) => ({ ...p, newsletterOptIn: e.target.checked }))} />}
              label="Incluir este contacto en el newsletter y en los envíos comerciales"
            />
            <Typography sx={{ color: MUTED, fontSize: 12, ml: 4 }}>
              Entra como suscriptor del segmento “Aliado”. Si lo quitas, queda dado de baja,
              no borrado. Puede darse de baja él mismo desde cualquier correo.
            </Typography>
          </Grid>

          <Seccion>Presencia digital</Seccion>
          <Grid item xs={12} sm={6}>
            <TextField label="Sitio web" value={f.sitioWeb} onChange={set('sitioWeb')} size="small" fullWidth placeholder="https://" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Instagram" value={f.instagram} onChange={set('instagram')} size="small" fullWidth placeholder="@usuario" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Facebook" value={f.facebook} onChange={set('facebook')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="LinkedIn" value={f.linkedin} onChange={set('linkedin')} size="small" fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="TikTok" value={f.tiktok} onChange={set('tiktok')} size="small" fullWidth />
          </Grid>

          <Seccion>Condiciones del convenio</Seccion>
          <Grid item xs={12} sm={4}>
            <TextField label="Comisión (%)" type="number" value={f.comisionPct} onChange={set('comisionPct')}
              size="small" fullWidth inputProps={{ min: 0, max: 100, step: 0.5 }}
              helperText="Es el valor por defecto; cada venta puede pactar otro." />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Convenio desde" type="date" value={f.convenioDesde} onChange={set('convenioDesde')}
              size="small" fullWidth InputLabelProps={{ shrink: true }} helperText="Vacío = sin límite" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Convenio hasta" type="date" value={f.convenioHasta} onChange={set('convenioHasta')}
              size="small" fullWidth InputLabelProps={{ shrink: true }} helperText="Vacío = sin límite" />
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ color: MUTED, fontSize: 13, mb: 0.5 }}>Qué ventas comisionan</Typography>
            <Stack direction="row" spacing={2}>
              {CATEGORIAS.map((c) => (
                <FormControlLabel key={c.v}
                  control={<Checkbox checked={f.comisionaCategorias.includes(c.v)}
                    onChange={() => alternarCategoria(c.v)} />}
                  label={c.l} />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notas del acuerdo" value={f.notas} onChange={set('notas')}
              size="small" fullWidth multiline rows={3}
              helperText="Lo que se pactó y no cabe en un campo: exclusividades, topes, quién factura." />
          </Grid>

          {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCerrar} sx={{ textTransform: 'none', color: MUTED }}>Cancelar</Button>
        <Button onClick={guardar} variant="contained"
          disabled={!f.nombre.trim() || f.comisionaCategorias.length === 0 || guardando}
          sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#5b21b6' } }}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear aliado'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Crea una cuenta de acceso para el equipo del aliado, o una de demostración. */
function DialogoCuenta({ abierto, aliado, onCerrar, onCreada }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setError(''); setGuardando(true);
    const res = await api.post(`/api/aliados-admin/${aliado.id}/cuentas`, { nombre, email, password });
    setGuardando(false);
    if (res?.data?.success) {
      setNombre(''); setEmail(''); setPassword('');
      onCreada(res.data.data);
    } else {
      setError(res?.data?.error || res?.error || 'No se pudo crear la cuenta');
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ ...SERIF, color: NAVY }}>Crear cuenta de acceso</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>
          Entra a {`https://oirconecta.com/portal-crm/aliado/${String(aliado?.code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`} con
          este correo y esta contraseña. Solo verá los referidos de {aliado?.nombre}.
        </Typography>
        <Stack spacing={2}>
          <TextField label="Nombre de la persona" value={nombre} size="small" fullWidth autoFocus
            onChange={(e) => setNombre(e.target.value)} />
          <TextField label="Correo" type="email" value={email} size="small" fullWidth required
            onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Contraseña" value={password} size="small" fullWidth required
            onChange={(e) => setPassword(e.target.value)}
            helperText="Mínimo 10 caracteres. Se la entregas tú; después la puede cambiar desde “Olvidé mi contraseña”." />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} sx={{ textTransform: 'none', color: MUTED }}>Cancelar</Button>
        <Button onClick={crear} variant="contained"
          disabled={!email.trim() || password.length < 10 || guardando}
          sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#5b21b6' } }}>
          {guardando ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Lista({ aliados, onAbrir, onNuevo }) {
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ ...SERIF, fontSize: 28, color: NAVY }}>Aliados referidores</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>
            Empresas que te mandan pacientes con su tarjeta y QR
          </Typography>
        </Box>
        <Button
          onClick={onNuevo} startIcon={<AddIcon />} variant="contained"
          sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#5b21b6' } }}
        >
          Nuevo aliado
        </Button>
      </Stack>

      {aliados.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Typography sx={{ color: MUTED }}>Todavía no hay aliados. Crea el primero.</Typography>
        </Card>
      ) : (
        <Card sx={{ border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Aliado', 'Código del QR', 'Comisión', 'Referidos', 'Ventas', 'Cuentas', ''].map((h) => (
                  <TableCell key={h} sx={{ color: MUTED, fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {aliados.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: NAVY }}>
                    {a.nombre}
                    {!a.activo && <Chip label="Inactivo" size="small" sx={{ ml: 1, bgcolor: '#f5f5f4', color: '#78716c' }} />}
                  </TableCell>
                  <TableCell><code>{a.code}</code></TableCell>
                  <TableCell>{a.comisionPct}%</TableCell>
                  <TableCell>{a._count.patients + a._count.leads}</TableCell>
                  <TableCell>{a._count.commissions}</TableCell>
                  <TableCell>{a._count.accounts}</TableCell>
                  <TableCell align="right">
                    <Button onClick={() => onAbrir(a)} size="small" sx={{ textTransform: 'none', color: ACCENT }}>
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

function Detalle({ aliado, onVolver, onCambio, onEditar }) {
  const [referidos, setReferidos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [dialogoCuenta, setDialogoCuenta] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const [res, resCuentas] = await Promise.all([
      api.get(`/api/aliados-admin/${aliado.id}/referidos`),
      api.get(`/api/aliados-admin/${aliado.id}/cuentas`),
    ]);
    setCargando(false);
    if (res?.data?.success) setReferidos(res.data.data || []);
    else setError(res?.data?.error || res?.error || 'No se pudieron cargar los referidos');
    if (resCuentas?.data?.success) setCuentas(resCuentas.data.data || []);
  }, [aliado.id]);

  const cambiarCuenta = async (cuentaId, cambios) => {
    const res = await api.patch(`/api/aliados-admin/cuentas/${cuentaId}`, cambios);
    if (res?.data?.success) cargar();
    else setError(res?.data?.error || 'No se pudo actualizar la cuenta');
  };

  useEffect(() => { cargar(); }, [cargar]);

  const rotarCodigo = async () => {
    const res = await api.patch(`/api/aliados-admin/${aliado.id}`, { rotarCodigoRegistro: true });
    if (res?.data?.success) onCambio(res.data.data);
  };

  const moverComision = async (comisionId, estado) => {
    const res = await api.patch(`/api/aliados-admin/comisiones/${comisionId}`, { estado });
    if (res?.data?.success) cargar();
    else setError(res?.data?.error || 'No se pudo actualizar la comisión');
  };

  const urlPortal = `https://oirconecta.com/portal-crm/aliado/${String(aliado.code).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

  return (
    <>
      <Button onClick={onVolver} startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />} size="small"
        sx={{ textTransform: 'none', color: MUTED, mb: 2 }}>
        Todos los aliados
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ ...SERIF, fontSize: 28, color: NAVY }}>{aliado.nombre}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13 }}>
            {[
              aliado.tipo === 'MEDICO' ? 'Médico que remite' : aliado.tipo === 'OTRO' ? 'Otro' : 'Empresa',
              `${aliado.comisionPct}% de comisión`,
              aliado.ciudad,
              aliado.contactoNombre && `Contacto: ${aliado.contactoNombre}${aliado.contactoCargo ? ` (${aliado.contactoCargo})` : ''}`,
            ].filter(Boolean).join(' · ')}
          </Typography>
          {(aliado.contactoEmail || aliado.contactoTelefono) && (
            <Typography sx={{ color: MUTED, fontSize: 13 }}>
              {[aliado.contactoEmail, aliado.contactoTelefono].filter(Boolean).join(' · ')}
              {aliado.newsletterOptIn && ' · recibe newsletter'}
            </Typography>
          )}
          {(aliado.convenioDesde || aliado.convenioHasta) && (
            <Typography sx={{ color: MUTED, fontSize: 13 }}>
              Convenio {aliado.convenioDesde ? `desde ${aliado.convenioDesde}` : ''}
              {aliado.convenioHasta ? ` hasta ${aliado.convenioHasta}` : ''}
            </Typography>
          )}
        </Box>
        <Button onClick={onEditar} size="small" variant="outlined"
          sx={{ textTransform: 'none', color: ACCENT, borderColor: ACCENT }}>
          Editar ficha
        </Button>
      </Stack>

      <Card sx={{ p: 2.5, mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Typography sx={{ ...SERIF, fontSize: 17, color: NAVY, mb: 2 }}>Lo que le entregas al aliado</Typography>
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ color: MUTED, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enlace para el QR de las tarjetas
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: 13, wordBreak: 'break-all' }}>{aliado.enlaceQr}</Typography>
              <BotonCopiar texto={aliado.enlaceQr} />
            </Stack>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>
              El QR de la tarjeta debe apuntar exactamente aquí. El texto prellenado es lo que
              nos deja saber que el paciente viene de {aliado.nombre}.
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography sx={{ color: MUTED, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Código de invitación
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: NAVY, letterSpacing: '0.05em' }}>
                {aliado.registroCode || '—'}
              </Typography>
              {aliado.registroCode && <BotonCopiar texto={aliado.registroCode} />}
              <Tooltip title="Generar uno nuevo: los códigos viejos dejan de servir">
                <IconButton onClick={rotarCodigo} size="small"><AutorenewIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>
              Con esto la gente de {aliado.nombre} se crea su cuenta en {urlPortal}.
              Nunca lo imprimas: es lo único que impide que un desconocido abra una cuenta.
            </Typography>
          </Box>
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1.5 }}>
          <Box>
            <Typography sx={{ ...SERIF, fontSize: 17, color: NAVY }}>Cuentas de acceso</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13 }}>
              Quién de {aliado.nombre} puede entrar a ver sus referidos
            </Typography>
          </Box>
          <Button
            onClick={() => setDialogoCuenta(true)} startIcon={<AddIcon />} size="small" variant="outlined"
            sx={{ textTransform: 'none', color: ACCENT, borderColor: ACCENT }}
          >
            Crear cuenta
          </Button>
        </Stack>
        <Divider />

        {cuentas.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>
              Nadie tiene acceso todavía. Crea una cuenta aquí, o pásales el código de invitación
              para que se registren solos.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Persona', 'Correo', 'Último ingreso', 'Estado', ''].map((h) => (
                  <TableCell key={h} sx={{ color: MUTED, fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cuentas.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: NAVY }}>{c.nombre || '—'}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell sx={{ color: MUTED }}>
                    {c.lastLoginAt ? fecha(c.lastLoginAt) : 'Nunca entró'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.activo ? 'Activa' : 'Bloqueada'}
                      size="small"
                      sx={c.activo
                        ? { bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 600 }
                        : { bgcolor: '#f5f5f4', color: '#78716c', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => cambiarCuenta(c.id, { activo: !c.activo })}
                      size="small"
                      sx={{ textTransform: 'none', color: c.activo ? '#b91c1c' : ACCENT }}
                    >
                      {c.activo ? 'Bloquear' : 'Reactivar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card sx={{ border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Typography sx={{ ...SERIF, fontSize: 17, color: NAVY, p: 2.5, pb: 1.5 }}>
          Referidos ({referidos.length})
        </Typography>
        <Divider />

        {cargando ? (
          <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={24} /></Box>
        ) : referidos.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography sx={{ color: MUTED }}>
              Nadie ha escaneado el QR todavía.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Paciente', 'Contacto', 'Ciudad', 'Llegó', 'Estado', 'Pérdida auditiva',
                    'Citas', 'Cotizado', 'Vendido', 'Comisión'].map((h) => (
                    <TableCell key={h} sx={{ color: MUTED, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {referidos.map((r) => {
                  const ultimaCot = r.cotizaciones[0] || null;
                  const ultimaVenta = r.ventas[0] || null;
                  const com = ultimaVenta?.comision || null;
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap' }}>{r.nombre}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>
                        {r.telefono}{r.email ? <><br />{r.email}</> : null}
                      </TableCell>
                      <TableCell>{r.ciudad}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fecha(r.fechaReferido)}</TableCell>
                      <TableCell><Etiqueta meta={ESTADO_META[r.estado] || ESTADO_META.REFERIDO} /></TableCell>
                      <TableCell>
                        {r.tienePerdidaAuditiva
                          ? <Chip label="Sí" size="small" sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontWeight: 600 }} />
                          : <Typography sx={{ color: MUTED, fontSize: 13 }}>No registrada</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.citas === 0 ? '—' : (
                          <>
                            {r.citas} en total
                            {r.proximaCita && <><br /><span style={{ color: ACCENT }}>Próxima: {fecha(r.proximaCita.fecha)} {r.proximaCita.hora}</span></>}
                            {!r.proximaCita && r.ultimaCita && <><br /><span style={{ color: MUTED }}>Última: {fecha(r.ultimaCita.fecha)}</span></>}
                          </>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {ultimaCot ? <>{cop(ultimaCot.valor)}<br /><span style={{ fontSize: 11, color: MUTED }}>{ultimaCot.marca}</span></> : '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {ultimaVenta ? <>{cop(ultimaVenta.valor)}<br /><span style={{ fontSize: 11, color: MUTED }}>{fecha(ultimaVenta.fecha)}</span></> : '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {com ? (
                          <Stack spacing={0.5}>
                            <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{cop(com.monto)}</Typography>
                            <Etiqueta meta={COMISION_META[com.estado] || COMISION_META.CAUSADA} />
                            {com.estado === 'CAUSADA' && (
                              <Button onClick={() => moverComision(com.id, 'LIQUIDADA')} size="small"
                                sx={{ textTransform: 'none', color: ACCENT, fontSize: 12, p: 0, minWidth: 0 }}>
                                Liquidar
                              </Button>
                            )}
                            {com.estado === 'LIQUIDADA' && (
                              <Button onClick={() => moverComision(com.id, 'PAGADA')} size="small"
                                sx={{ textTransform: 'none', color: '#15803d', fontSize: 12, p: 0, minWidth: 0 }}>
                                Marcar pagada
                              </Button>
                            )}
                          </Stack>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <DialogoCuenta
        abierto={dialogoCuenta}
        aliado={aliado}
        onCerrar={() => setDialogoCuenta(false)}
        onCreada={() => { setDialogoCuenta(false); cargar(); }}
      />
    </>
  );
}

export default function AliadosPage() {
  const [aliados, setAliados] = useState([]);
  const [abierto, setAbierto] = useState(null);
  const [dialogo, setDialogo] = useState(false);
  // Null = el diálogo crea; con aliado = edita ese.
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await api.get('/api/aliados-admin');
    setCargando(false);
    if (res?.data?.success) setAliados(res.data.data || []);
    else setError(res?.data?.error || res?.error || 'No se pudieron cargar los aliados');
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Tras crear o editar, refrescamos la lista y dejamos el detalle al día.
  const refrescar = (actualizado) => {
    cargar();
    if (actualizado && abierto?.id === actualizado.id) setAbierto(actualizado);
  };

  if (cargando) {
    return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {abierto ? (
        <Detalle
          aliado={abierto}
          onVolver={() => { setAbierto(null); cargar(); }}
          onCambio={refrescar}
          onEditar={() => { setEditando(abierto); setDialogo(true); }}
        />
      ) : (
        <Lista
          aliados={aliados}
          onAbrir={setAbierto}
          onNuevo={() => { setEditando(null); setDialogo(true); }}
        />
      )}

      <DialogoFicha
        abierto={dialogo}
        aliado={editando}
        onCerrar={() => { setDialogo(false); setEditando(null); }}
        onGuardado={(guardado) => {
          setDialogo(false);
          setEditando(null);
          cargar();
          setAbierto(guardado);
        }}
      />
    </Box>
  );
}
