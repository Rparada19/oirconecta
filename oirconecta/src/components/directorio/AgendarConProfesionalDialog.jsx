/**
 * F2.5 — Wizard público de reserva con un profesional del directorio.
 *
 * Pasos:
 *  0. Tipo de consulta
 *  1. Día (chips próximos 14 días) → slots disponibles
 *  2. Datos del paciente
 *  3. Confirmación (resumen + reservar)
 *  4. Éxito (id + rescheduleToken)
 *
 * Endpoints (sin auth):
 *  GET  /api/booking/public/:profileId/types
 *  GET  /api/booking/public/:profileId/slots?date=...&appointmentTypeId=...
 *  POST /api/booking/public/:profileId/appointments
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  Stack, Card, CardActionArea, CardContent, Chip, IconButton, TextField,
  CircularProgress, Alert, Divider, Stepper, Step, StepLabel,
} from '@mui/material';
import {
  EventOutlined, AccessTimeOutlined, AttachMoneyOutlined, CloseOutlined,
  CheckCircleOutlineOutlined, ArrowBackOutlined,
} from '@mui/icons-material';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { trackEvent, trackEntityEvent } from '../../utils/analytics';

const BASE_URL = getApiBaseUrl();
const ACCENT = '#15803d';
const NAVY = '#0F2A4A';

const STEPS = ['Tipo', 'Fecha y hora', 'Datos', 'Confirmar'];

async function publicGet(path) {
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data?.error || `Error ${res.status}`, code: data?.code, status: res.status };
    return { data: data?.data, error: null, status: res.status };
  } catch (e) {
    return { data: null, error: 'No se pudo conectar con el servidor.', status: 0 };
  }
}

async function publicPost(path, body) {
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: data?.error || `Error ${res.status}`, code: data?.code, status: res.status };
    return { data: data?.data, error: null, status: res.status };
  } catch (e) {
    return { data: null, error: 'No se pudo conectar con el servidor.', status: 0 };
  }
}

function fmtDay(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function nextNDates(n) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PP', label: 'Pasaporte' },
];

export default function AgendarConProfesionalDialog({ open, onClose, profileId, profesionalNombre }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patient, setPatient] = useState({
    nombre: '', telefono: '', email: '', tipoDocumento: 'CC', numeroDocumento: '',
  });
  const [notas, setNotas] = useState('');
  const [result, setResult] = useState(null); // cita creada

  const dateOptions = useMemo(() => nextNDates(14), []);

  const reset = useCallback(() => {
    setStep(0); setLoading(false); setError(null);
    setTypes([]); setSelectedType(null); setSelectedDate(null);
    setSlots([]); setSelectedSlot(null);
    setPatient({ nombre: '', telefono: '', email: '', tipoDocumento: 'CC', numeroDocumento: '' });
    setNotas(''); setResult(null);
  }, []);

  // D2 — trackea inicio del wizard cuando se abre
  useEffect(() => {
    if (open && profileId) {
      trackEntityEvent('booking_wizard_start', {
        entityType: 'DirectoryProfile',
        entityId: profileId,
      });
    }
  }, [open, profileId]);

  // Carga tipos al abrir
  useEffect(() => {
    if (!open || !profileId) return;
    reset();
    setLoading(true);
    publicGet(`/api/booking/public/${profileId}/types`).then((r) => {
      setLoading(false);
      if (r.error) {
        setError({ message: r.error, code: r.code });
        return;
      }
      setTypes(r.data || []);
      if ((r.data || []).length === 0) {
        setError({ message: 'Este profesional no ha definido tipos de consulta todavía.' });
      }
    });
  }, [open, profileId, reset]);

  // Carga slots cuando hay tipo + fecha
  useEffect(() => {
    if (!selectedType || !selectedDate || !profileId) return;
    setLoading(true);
    setSlots([]);
    publicGet(`/api/booking/public/${profileId}/slots?date=${selectedDate}&appointmentTypeId=${selectedType.id}`)
      .then((r) => {
        setLoading(false);
        if (r.error) return setError({ message: r.error, code: r.code });
        setSlots(r.data?.slots || []);
      });
  }, [selectedType, selectedDate, profileId]);

  const canReserve = patient.nombre.trim().length >= 3 && patient.telefono.trim().length >= 7 && selectedSlot;

  const reservar = async () => {
    if (!canReserve) return;
    setLoading(true); setError(null);
    // T2-Gap4 — Si el usuario llegó por un enlace /invita/:code, propagamos el
    // código para vincular al paciente con quien lo refirió.
    let referredByCode = null;
    try { referredByCode = sessionStorage.getItem('oc_referred_by_code') || null; } catch {}
    const r = await publicPost(`/api/booking/public/${profileId}/appointments`, {
      appointmentTypeId: selectedType.id,
      scheduledAt: `${selectedDate}T${selectedSlot.time}`,
      notas: notas || null,
      referredByCode,
      patient: {
        nombre: patient.nombre.trim(),
        telefono: patient.telefono.trim(),
        email: patient.email.trim() || null,
        tipoDocumento: patient.tipoDocumento || null,
        numeroDocumento: patient.numeroDocumento.trim() || null,
      },
    });
    setLoading(false);
    if (r.error) {
      // Si el slot se tomó en paralelo, recargamos slots y devolvemos al paso 1
      if (r.code === 'SLOT_TAKEN') {
        setStep(1);
        setSelectedSlot(null);
        setSlots([]);
        setError({ message: 'Ese horario acaba de ocuparse. Elige otro disponible.' });
        // recarga slots
        publicGet(`/api/booking/public/${profileId}/slots?date=${selectedDate}&appointmentTypeId=${selectedType.id}`)
          .then((rr) => { if (!rr.error) setSlots(rr.data?.slots || []); });
        return;
      }
      setError({ message: r.error, code: r.code });
      return;
    }
    setResult(r.data);
    setStep(4);
    // D2 — cita creada exitosamente (marca conversión de la sesión)
    trackEvent('booking_created', selectedType?.nombre || null, {
      profileId,
      appointmentId: r.data?.id,
      tipoConsulta: selectedType?.nombre || null,
      durationMinutes: selectedType?.durationMinutes || null,
      priceCOP: selectedType?.priceCOP || null,
    }, {
      entityType: 'DirectoryProfile',
      entityId: profileId,
    });
  };

  const close = () => { if (!loading) onClose(); };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ pr: 6, fontWeight: 800, color: NAVY }}>
        Agendar con {profesionalNombre || 'el profesional'}
        <IconButton onClick={close} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {step < 4 && (
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 3,
              '& .Mui-active': { color: `${ACCENT} !important` },
              '& .Mui-completed': { color: `${ACCENT} !important` } }}>
            {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
        )}

        {error && (
          <Alert severity={error.code === 'AGENDA_NOT_INCLUDED' || error.code === 'AGENDA_PAUSED' ? 'info' : 'error'}
            onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}

        {/* Paso 0: tipo */}
        {!loading && step === 0 && (
          <Stack spacing={1.5}>
            {types.map((t) => (
              <Card key={t.id} sx={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <CardActionArea onClick={() => { setSelectedType(t); setStep(1); }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {t.color && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: t.color }} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: NAVY }}>{t.nombre}</Typography>
                        {t.descripcion && <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>{t.descripcion}</Typography>}
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.3}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#475569' }}>
                          <AccessTimeOutlined sx={{ fontSize: 16 }} />
                          <Typography sx={{ fontSize: '0.8125rem' }}>{t.durationMinutes} min</Typography>
                        </Stack>
                        {t.priceCOP != null && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: ACCENT }}>
                            <AttachMoneyOutlined sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontWeight: 700 }}>{`$${t.priceCOP.toLocaleString('es-CO')}`}</Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}

        {/* Paso 1: día + slot */}
        {!loading && step === 1 && selectedType && (
          <Box>
            <Typography sx={{ fontWeight: 700, color: NAVY, mb: 1 }}>Elige día</Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2 }}>
              {dateOptions.map((d) => (
                <Chip key={d} label={fmtDay(d)}
                  onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                  sx={{
                    borderRadius: '10px', px: 1, py: 2.5, fontWeight: 600,
                    bgcolor: d === selectedDate ? ACCENT : '#f1f5f9',
                    color: d === selectedDate ? '#fff' : NAVY,
                    '&:hover': { bgcolor: d === selectedDate ? ACCENT : '#e2e8f0' },
                  }} />
              ))}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography sx={{ fontWeight: 700, color: NAVY, mb: 1 }}>Slots disponibles</Typography>
            {!selectedDate ? (
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>Selecciona primero un día.</Typography>
            ) : slots.length === 0 ? (
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                No hay horarios disponibles ese día. Prueba otra fecha.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 1 }}>
                {slots.map((s) => (
                  <Button key={s.time} variant={selectedSlot?.time === s.time ? 'contained' : 'outlined'}
                    onClick={() => setSelectedSlot(s)}
                    sx={{
                      borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                      ...(selectedSlot?.time === s.time
                        ? { background: ACCENT, '&:hover': { background: '#166534' } }
                        : { borderColor: '#cbd5e1', color: NAVY, '&:hover': { borderColor: ACCENT, color: ACCENT } }),
                    }}>
                    {s.time}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Paso 2: paciente */}
        {!loading && step === 2 && (
          <Stack spacing={2}>
            <TextField label="Nombre completo" required size="small"
              value={patient.nombre} onChange={(e) => setPatient({ ...patient, nombre: e.target.value })} />
            <TextField label="Teléfono (WhatsApp preferido)" required size="small"
              value={patient.telefono} onChange={(e) => setPatient({ ...patient, telefono: e.target.value })} />
            <TextField label="Email (opcional, para recordatorios)" size="small" type="email"
              value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} />
            <Stack direction="row" spacing={1}>
              <TextField select SelectProps={{ native: true }} label="Tipo doc." size="small" sx={{ width: 130 }}
                value={patient.tipoDocumento} onChange={(e) => setPatient({ ...patient, tipoDocumento: e.target.value })}>
                {TIPOS_DOCUMENTO.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
              </TextField>
              <TextField label="Número de documento" size="small" sx={{ flex: 1 }}
                value={patient.numeroDocumento} onChange={(e) => setPatient({ ...patient, numeroDocumento: e.target.value })} />
            </Stack>
            <TextField label="Motivo de consulta (opcional)" size="small" multiline minRows={2}
              value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Stack>
        )}

        {/* Paso 3: confirmación */}
        {!loading && step === 3 && (
          <Box>
            <Typography sx={{ color: '#475569', mb: 2 }}>Verifica los datos antes de reservar:</Typography>
            <Card sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '10px', mb: 2, bgcolor: '#f8fafc' }}>
              <RowKV k="Profesional" v={profesionalNombre} />
              <RowKV k="Tipo" v={selectedType?.nombre} />
              <RowKV k="Duración" v={`${selectedType?.durationMinutes} min`} />
              <RowKV k="Fecha" v={selectedDate ? fmtDay(selectedDate) : '—'} />
              <RowKV k="Hora" v={selectedSlot?.time} />
              {selectedType?.priceCOP != null && (
                <RowKV k="Valor consulta" v={`$${selectedType.priceCOP.toLocaleString('es-CO')} COP`} />
              )}
              <Divider sx={{ my: 1.5 }} />
              <RowKV k="Paciente" v={patient.nombre} />
              <RowKV k="Teléfono" v={patient.telefono} />
              {patient.email && <RowKV k="Email" v={patient.email} />}
              {patient.numeroDocumento && <RowKV k="Documento" v={`${patient.tipoDocumento} ${patient.numeroDocumento}`} />}
              {notas && <RowKV k="Motivo" v={notas} />}
            </Card>
          </Box>
        )}

        {/* Paso 4: éxito */}
        {!loading && step === 4 && result && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlineOutlined sx={{ fontSize: 64, color: ACCENT, mb: 1 }} />
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: NAVY, mb: 1 }}>
              ¡Reserva confirmada!
            </Typography>
            <Typography sx={{ color: '#475569', mb: 2 }}>
              Tu cita con {result.professionalNombre || profesionalNombre} quedó agendada el{' '}
              <strong>{fmtDay(selectedDate)} a las {result.hora}</strong>.
            </Typography>
            {patient.email && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                Te enviamos confirmación a <strong>{patient.email}</strong> con instrucciones y enlace para reagendar.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === 4 ? (
          <Button onClick={close} variant="contained"
            sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>Listo</Button>
        ) : (
          <>
            {step > 0 && (
              <Button startIcon={<ArrowBackOutlined />} onClick={() => setStep(step - 1)} disabled={loading}
                sx={{ textTransform: 'none' }}>Atrás</Button>
            )}
            <Box sx={{ flex: 1 }} />
            {step === 1 && (
              <Button variant="contained" disabled={!selectedSlot || loading} onClick={() => setStep(2)}
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>Continuar</Button>
            )}
            {step === 2 && (
              <Button variant="contained"
                disabled={!patient.nombre.trim() || !patient.telefono.trim() || loading}
                onClick={() => setStep(3)}
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>Continuar</Button>
            )}
            {step === 3 && (
              <Button variant="contained" disabled={!canReserve || loading} onClick={reservar}
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>
                {loading ? 'Reservando…' : 'Confirmar reserva'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function RowKV({ k, v }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>{k}</Typography>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F2A4A', textAlign: 'right', maxWidth: '60%' }}>{v || '—'}</Typography>
    </Stack>
  );
}
