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

function DialogoNuevo({ abierto, onCerrar, onCreado }) {
  const [nombre, setNombre] = useState('');
  const [pct, setPct] = useState('10');
  const [contactoEmail, setContactoEmail] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setError(''); setGuardando(true);
    const res = await api.post('/api/aliados-admin', {
      nombre, comisionPct: Number(pct), contactoEmail: contactoEmail || null,
    });
    setGuardando(false);
    if (res?.data?.success) {
      setNombre(''); setPct('10'); setContactoEmail('');
      onCreado(res.data.data);
    } else {
      setError(res?.data?.error || res?.error || 'No se pudo crear');
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ ...SERIF, color: NAVY }}>Nuevo aliado</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre del aliado" value={nombre} size="small" fullWidth autoFocus
            onChange={(e) => setNombre(e.target.value)}
            helperText="Así aparecerá en el mensaje del QR: “Vengo de …”"
          />
          <TextField
            label="Comisión (%)" value={pct} size="small" fullWidth type="number"
            onChange={(e) => setPct(e.target.value)}
          />
          <TextField
            label="Correo de contacto (opcional)" value={contactoEmail} size="small" fullWidth type="email"
            onChange={(e) => setContactoEmail(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} sx={{ textTransform: 'none', color: MUTED }}>Cancelar</Button>
        <Button
          onClick={crear} variant="contained" disabled={!nombre.trim() || guardando}
          sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#5b21b6' } }}
        >
          {guardando ? 'Creando…' : 'Crear aliado'}
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

function Detalle({ aliado, onVolver, onCambio }) {
  const [referidos, setReferidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await api.get(`/api/aliados-admin/${aliado.id}/referidos`);
    setCargando(false);
    if (res?.data?.success) setReferidos(res.data.data || []);
    else setError(res?.data?.error || res?.error || 'No se pudieron cargar los referidos');
  }, [aliado.id]);

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

      <Typography sx={{ ...SERIF, fontSize: 28, color: NAVY, mb: 3 }}>{aliado.nombre}</Typography>

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
    </>
  );
}

export default function AliadosPage() {
  const [aliados, setAliados] = useState([]);
  const [abierto, setAbierto] = useState(null);
  const [dialogo, setDialogo] = useState(false);
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
        <Detalle aliado={abierto} onVolver={() => { setAbierto(null); cargar(); }} onCambio={refrescar} />
      ) : (
        <Lista aliados={aliados} onAbrir={setAbierto} onNuevo={() => setDialogo(true)} />
      )}

      <DialogoNuevo
        abierto={dialogo}
        onCerrar={() => setDialogo(false)}
        onCreado={(nuevo) => { setDialogo(false); cargar(); setAbierto(nuevo); }}
      />
    </Box>
  );
}
