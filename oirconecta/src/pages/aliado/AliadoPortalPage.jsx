/**
 * Sección del aliado referidor — /portal-crm/aliado/:code
 *
 * Vive bajo /portal-crm pero NO es el CRM: sesión propia, token propio, y solo
 * los datos del aliado que inició sesión. El backend filtra por el partnerId
 * del token; aquí no se manda ningún identificador que el usuario controle.
 *
 * Lo que se muestra es estado COMERCIAL. Nada clínico, nunca.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, Stack, Button, TextField, Alert, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Divider,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { aliadoApi, getToken, setToken, clearToken } from '../../services/aliadoApi';

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

const mesLargo = (periodo) => {
  const [a, m] = String(periodo).split('-');
  const texto = new Date(Number(a), Number(m) - 1, 1)
    .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  // Solo la primera letra: `text-transform: capitalize` dejaba "Septiembre De 2026".
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

function Etiqueta({ meta }) {
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, border: 'none' }}
    />
  );
}

/**
 * Puerta del portal: entrar, crear cuenta, pedir enlace y fijar clave nueva.
 * Los cuatro modos comparten tarjeta para que el aliado no salte entre
 * pantallas distintas.
 */
function Puerta({ onEntrar }) {
  // El enlace del correo llega como ?reset=<token>: si viene, arranca ahí.
  const tokenReset = React.useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('reset'); } catch { return null; }
  }, []);

  const [modo, setModo] = useState(tokenReset ? 'restablecer' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiar = (m) => { setModo(m); setError(''); setAviso(''); };

  const enviar = async (e) => {
    e.preventDefault();
    setError(''); setAviso(''); setCargando(true);
    try {
      if (modo === 'login') {
        const data = await aliadoApi.login(email, password);
        setToken(data.token);
        onEntrar(data.aliado);
      } else if (modo === 'registro') {
        const data = await aliadoApi.registro({ nombre, email, password, codigoInvitacion: codigo });
        setToken(data.token);
        onEntrar(data.aliado);
      } else if (modo === 'recuperar') {
        const data = await aliadoApi.recuperar(email);
        setAviso(data.mensaje);
      } else {
        const data = await aliadoApi.restablecer(tokenReset, password);
        setAviso(data.mensaje);
        setPassword('');
        setModo('login');
        // Deja la URL limpia: el token ya se usó.
        try { window.history.replaceState({}, '', window.location.pathname); } catch { /* nada */ }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const TEXTOS = {
    login: { titulo: 'Portal de aliados', boton: 'Entrar', cargando: 'Entrando…' },
    registro: { titulo: 'Crear cuenta', boton: 'Crear cuenta', cargando: 'Creando…' },
    recuperar: { titulo: 'Recuperar contraseña', boton: 'Enviarme el enlace', cargando: 'Enviando…' },
    restablecer: { titulo: 'Nueva contraseña', boton: 'Guardar contraseña', cargando: 'Guardando…' },
  };
  const t = TEXTOS[modo];

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f8fafc', p: 2 }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 420, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
        <Typography sx={{ ...SERIF, fontSize: 26, color: NAVY, mb: 0.5 }}>{t.titulo}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, mb: 3 }}>
          {modo === 'registro'
            ? 'Pide el código de invitación a quien coordina el convenio.'
            : modo === 'recuperar'
            ? 'Te mandamos un enlace para crear una contraseña nueva.'
            : 'OírConecta · Programa de referidos'}
        </Typography>

        <form onSubmit={enviar}>
          <Stack spacing={2}>
            {modo === 'registro' && (
              <TextField
                label="Tu nombre" value={nombre} size="small" fullWidth required
                onChange={(e) => setNombre(e.target.value)} autoComplete="name"
              />
            )}

            {modo !== 'restablecer' && (
              <TextField
                label="Correo" type="email" value={email} size="small" fullWidth required
                onChange={(e) => setEmail(e.target.value)} autoComplete="username"
              />
            )}

            {modo !== 'recuperar' && (
              <TextField
                label={modo === 'login' ? 'Contraseña' : 'Contraseña nueva'}
                type="password" value={password} size="small" fullWidth required
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                helperText={modo === 'login' ? undefined : 'Mínimo 10 caracteres'}
              />
            )}

            {modo === 'registro' && (
              <TextField
                label="Código de invitación" value={codigo} size="small" fullWidth required
                onChange={(e) => setCodigo(e.target.value)}
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {aviso && <Alert severity="success">{aviso}</Alert>}

            <Button
              type="submit" variant="contained" disabled={cargando}
              sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 600, py: 1.2, '&:hover': { bgcolor: '#5b21b6' } }}
            >
              {cargando ? t.cargando : t.boton}
            </Button>
          </Stack>
        </form>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2.5 }}>
          {modo === 'login' ? (
            <>
              <Button onClick={() => cambiar('registro')} size="small" sx={{ textTransform: 'none', color: ACCENT }}>
                Crear cuenta
              </Button>
              <Button onClick={() => cambiar('recuperar')} size="small" sx={{ textTransform: 'none', color: MUTED }}>
                Olvidé mi contraseña
              </Button>
            </>
          ) : (
            <Button onClick={() => cambiar('login')} size="small" sx={{ textTransform: 'none', color: MUTED }}>
              ← Volver a entrar
            </Button>
          )}
        </Stack>
      </Card>
    </Box>
  );
}


function Metrica({ titulo, valor, detalle }) {
  return (
    <Card sx={{ p: 2.5, flex: 1, minWidth: 180, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
      <Typography sx={{ color: MUTED, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
        {titulo}
      </Typography>
      <Typography sx={{ ...SERIF, fontSize: 28, color: NAVY, lineHeight: 1.1 }}>{valor}</Typography>
      {detalle && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.5 }}>{detalle}</Typography>}
    </Card>
  );
}

export default function AliadoPortalPage() {
  const [aliado, setAliado] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [referidos, setReferidos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // ¿Hay sesión viva? El token puede haber expirado desde la última visita.
  useEffect(() => {
    if (!getToken()) { setVerificando(false); return; }
    aliadoApi.me()
      .then(setAliado)
      .catch(() => clearToken())
      .finally(() => setVerificando(false));
  }, []);

  const cargar = useCallback(async () => {
    if (!aliado) return;
    setCargando(true);
    setError('');
    try {
      const [filas, res] = await Promise.all([
        aliadoApi.referidos(aliado.code),
        aliadoApi.resumen(aliado.code),
      ]);
      setReferidos(filas);
      setResumen(res);
    } catch (e) {
      if (e.unauthorized) { setAliado(null); return; }
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [aliado]);

  useEffect(() => { cargar(); }, [cargar]);

  const salir = () => { clearToken(); setAliado(null); setReferidos([]); setResumen(null); };

  if (verificando) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }
  if (!aliado) {
    return <Puerta onEntrar={setAliado} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography sx={{ ...SERIF, fontSize: 30, color: NAVY }}>{aliado.nombre}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>
              Referidos a OírConecta · {aliado.usuario}
            </Typography>
          </Box>
          <Button
            onClick={salir} startIcon={<LogoutOutlinedIcon />} size="small"
            sx={{ color: MUTED, textTransform: 'none' }}
          >
            Salir
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {resumen && (
          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Metrica titulo="Referidos" valor={resumen.referidos} detalle="desde el inicio del convenio" />
            <Metrica titulo="Ventas" valor={resumen.ventas} detalle={`${cop(resumen.facturado)} facturados`} />
            <Metrica titulo="Comisión causada" valor={cop(resumen.comisionTotal)} detalle="10% sobre factura" />
            <Metrica titulo="Por pagar" valor={cop(resumen.comisionPendiente)} detalle={`${cop(resumen.comisionPagada)} ya pagados`} />
          </Stack>
        )}

        {resumen?.periodos?.length > 0 && (
          <Card sx={{ mb: 3, border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
            <Typography sx={{ ...SERIF, fontSize: 18, color: NAVY, p: 2.5, pb: 1.5 }}>
              Corte por mes
            </Typography>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }}>Mes</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Ventas</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Facturado</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Comisión</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Pagado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumen.periodos.map((p) => (
                  <TableRow key={p.periodo}>
                    <TableCell>{mesLargo(p.periodo)}</TableCell>
                    <TableCell align="right">{p.ventas}</TableCell>
                    <TableCell align="right">{cop(p.facturado)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: NAVY }}>{cop(p.comision)}</TableCell>
                    <TableCell align="right">{cop(p.pagado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Card sx={{ border: `1px solid ${BORDER}`, boxShadow: 'none' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1.5 }}>
            <Typography sx={{ ...SERIF, fontSize: 18, color: NAVY }}>Tus referidos</Typography>
            <Button onClick={cargar} size="small" disabled={cargando} sx={{ textTransform: 'none', color: ACCENT }}>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </Button>
          </Stack>
          <Divider />

          {referidos.length === 0 && !cargando ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography sx={{ color: MUTED }}>
                Todavía no hay referidos. Aparecerán aquí en cuanto alguien escanee el QR de tus tarjetas.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }}>Referido</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }}>Ciudad</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }}>Llegó</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Cotizado</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Vendido</TableCell>
                  <TableCell sx={{ color: MUTED, fontWeight: 600 }} align="right">Tu comisión</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referidos.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: NAVY }}>{r.nombre}</TableCell>
                    <TableCell>{r.ciudad}</TableCell>
                    <TableCell>{fecha(r.fechaReferido)}</TableCell>
                    <TableCell><Etiqueta meta={ESTADO_META[r.estado] || ESTADO_META.REFERIDO} /></TableCell>
                    <TableCell align="right">{cop(r.cotizado)}</TableCell>
                    <TableCell align="right">{cop(r.vendido)}</TableCell>
                    <TableCell align="right">
                      {r.comision ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>
                            {cop(r.comision.monto)}
                          </Typography>
                          <Etiqueta meta={COMISION_META[r.comision.estado] || COMISION_META.CAUSADA} />
                        </Stack>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Typography sx={{ color: MUTED, fontSize: 12, mt: 3, maxWidth: 720 }}>
          Por respeto a la privacidad de los pacientes y por la Ley 1581 de 2012, esta pantalla
          muestra únicamente el estado comercial de cada referido. No incluye resultados de
          exámenes, diagnósticos ni datos de contacto.
        </Typography>

      </Box>
    </Box>
  );
}
