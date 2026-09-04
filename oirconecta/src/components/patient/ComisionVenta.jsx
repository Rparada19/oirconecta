/**
 * Recaudo, comisión del referidor y funnel de controles — dentro de la ficha
 * de una venta ya registrada.
 *
 * Existe porque el bloque de comisión del formulario solo aparece al CREAR la
 * venta: sin esto, una venta de hace un mes no tenía dónde marcarse como
 * recaudada y nunca podía comisionar.
 *
 * Se pinta solo para ventas de audífonos: es lo único que comisiona y lo único
 * que dispara el funnel.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, TextField, MenuItem, Button, Chip, Alert, Divider, Stack,
} from '@mui/material';
import { api } from '../../services/apiClient';

const VERDE = '#085946';
const MUTED = '#86899C';

const COMISION_META = {
  CAUSADA:   { label: 'Por liquidar', color: '#b45309', bg: '#fffbeb' },
  LIQUIDADA: { label: 'Liquidada',    color: '#0369a1', bg: '#eff6ff' },
  PAGADA:    { label: 'Pagada',       color: '#15803d', bg: '#f0fdf4' },
  ANULADA:   { label: 'Anulada',      color: '#78716c', bg: '#f5f5f4' },
};

const FUNNEL_META = {
  PENDING:   { label: 'Programado', color: '#64748b', bg: '#f1f5f9' },
  REMINDED:  { label: 'Recordado',  color: '#6d28d9', bg: '#faf5ff' },
  SCHEDULED: { label: 'Agendado',   color: '#15803d', bg: '#f0fdf4' },
  OVERDUE:   { label: 'Vencido',    color: '#b91c1c', bg: '#fef2f2' },
  COMPLETED: { label: 'Realizado',  color: '#0369a1', bg: '#eff6ff' },
  SKIPPED:   { label: 'Omitido',    color: '#78716c', bg: '#f5f5f4' },
};

const PASOS = {
  W1: '1 semana', D10: '10 días', M1: '1 mes', M3: '3 meses', M6: '6 meses',
  Y1: '12 meses', Y1_5: '18 meses', Y2: '24 meses', Y2_5: '30 meses', Y3: '36 meses',
};

const cop = (n) =>
  n == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const soloFecha = (d) => (d ? String(d).slice(0, 10) : '');

export default function ComisionVenta({ saleId, readOnly = false, onGuardado }) {
  const [venta, setVenta] = useState(null);
  const [aliados, setAliados] = useState([]);
  const [recaudo, setRecaudo] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [pct, setPct] = useState('');
  const [costo, setCosto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    if (!saleId) return;
    const [v, lista] = await Promise.all([
      api.get(`/api/products/sales/${saleId}`),
      api.get('/api/patients/meta/aliados'),
    ]);
    if (v?.data?.success) {
      const s = v.data.data;
      setVenta(s);
      setRecaudo(soloFecha(s.fechaRecaudo));
      setPartnerId(s.comisionPartnerId || '');
      setPct(s.comisionPct == null ? '' : String(s.comisionPct));
      setCosto(s.costoUnitario == null ? '' : String(s.costoUnitario));
    }
    if (lista?.data?.success) setAliados(lista.data.data || []);
  }, [saleId]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!venta || venta.categoria !== 'HEARING_AID') return null;

  const com = venta.partnerCommission;
  const referidorPaciente = venta.patient?.partnerId
    ? aliados.find((a) => a.id === venta.patient.partnerId)
    : null;

  const guardar = async () => {
    setError(''); setAviso(''); setGuardando(true);
    const res = await api.put(`/api/products/sales/${saleId}`, {
      fechaRecaudo: recaudo || null,
      comisionPartnerId: partnerId || null,
      comisionPct: pct === '' ? null : Number(pct),
      costoUnitario: costo === '' ? null : Number(costo),
    });
    setGuardando(false);
    if (res?.data?.success) {
      setAviso(recaudo
        ? 'Guardado. Con la venta recaudada, la comisión queda causada.'
        : 'Guardado. Sin fecha de recaudo no se causa comisión.');
      cargar();
      onGuardado?.();
    } else {
      setError(res?.data?.error || res?.error || 'No se pudo guardar');
    }
  };

  const bloqueada = com && com.estado !== 'CAUSADA';

  // El costo es POR UNIDAD y Finanzas lo multiplica por la cantidad. Quien
  // registra la venta piensa en el total de la factura, así que aquí se
  // muestran los dos números: el que se escribe y el que termina contando.
  const unidades = venta.cantidad || 1;
  const costoTotal = costo === '' ? null : Number(costo) * unidades;
  const utilidad = costoTotal == null ? null : (venta.valorTotal || 0) - costoTotal;
  const margen = utilidad == null || !venta.valorTotal
    ? null
    : (utilidad / venta.valorTotal) * 100;

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: VERDE, mb: 1.5 }}>
        Recaudo y comisión
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth size="small" type="date" label="Fecha de recaudo"
            value={recaudo} onChange={(e) => setRecaudo(e.target.value)}
            InputLabelProps={{ shrink: true }} disabled={readOnly || bloqueada}
            helperText="Sin ella no se causa comisión"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select fullWidth size="small" label="Comisión para"
            value={partnerId} onChange={(e) => setPartnerId(e.target.value)}
            disabled={readOnly || bloqueada}
            helperText={referidorPaciente ? `Por defecto: ${referidorPaciente.nombre}` : 'El paciente no tiene referidor'}
          >
            <MenuItem value=""><em>El del paciente</em></MenuItem>
            {aliados.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth size="small" type="number" label="% de comisión"
            value={pct} onChange={(e) => setPct(e.target.value)}
            disabled={readOnly || bloqueada}
            inputProps={{ min: 0, max: 100, step: 0.5 }}
            helperText="Vacío = el % del convenio"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: VERDE, mb: 1.5 }}>
            Costo y utilidad
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" type="number" label="Costo unitario (lo que te costó)"
                value={costo} onChange={(e) => setCosto(e.target.value)}
                disabled={readOnly}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                helperText={
                  costoTotal == null
                    ? 'Sin costo cargado, el margen del mes sale inflado'
                    : `× ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} = ${cop(costoTotal)} de costo total`
                }
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1, pt: 0.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: MUTED }}>Venta</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{cop(venta.valorTotal || 0)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: MUTED }}>Costo total</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{costoTotal == null ? '—' : cop(costoTotal)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: MUTED }}>Utilidad</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 700, color: utilidad == null ? undefined : utilidad < 0 ? '#b91c1c' : VERDE,
                  }}>
                    {utilidad == null ? '—' : cop(utilidad)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: MUTED }}>Margen</Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 700, color: margen == null ? undefined : margen < 0 ? '#b91c1c' : VERDE,
                  }}>
                    {margen == null ? '—' : `${margen.toFixed(0)}%`}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Grid>

        {com && (
          <Grid item xs={12}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ color: MUTED }}>Comisión causada:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {cop(com.monto)} <span style={{ color: MUTED, fontWeight: 400 }}>({com.pct}% de {cop(com.baseFacturada)})</span>
              </Typography>
              <Chip
                label={(COMISION_META[com.estado] || COMISION_META.CAUSADA).label}
                size="small"
                sx={{
                  bgcolor: (COMISION_META[com.estado] || COMISION_META.CAUSADA).bg,
                  color: (COMISION_META[com.estado] || COMISION_META.CAUSADA).color,
                  fontWeight: 600,
                }}
              />
              <Typography variant="caption" sx={{ color: MUTED }}>periodo {com.periodo}</Typography>
            </Stack>
            {bloqueada && (
              <Typography variant="caption" sx={{ color: MUTED }}>
                Ya está {(COMISION_META[com.estado] || {}).label?.toLowerCase()}: para cambiarla,
                anúlala primero desde Aliados referidores.
              </Typography>
            )}
          </Grid>
        )}

        {aviso && <Grid item xs={12}><Alert severity="success">{aviso}</Alert></Grid>}
        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}

        {!readOnly && !bloqueada && (
          <Grid item xs={12}>
            <Button variant="contained" size="small" onClick={guardar} disabled={guardando}
              sx={{ bgcolor: VERDE }}>
              {guardando ? 'Guardando…' : 'Guardar recaudo y comisión'}
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Funnel: qué controles quedaron programados y para cuándo. */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: VERDE, mb: 1 }}>
        Controles programados
      </Typography>

      {!venta.fechaAdaptacion ? (
        <Typography variant="body2" sx={{ color: MUTED }}>
          Sin fecha de adaptación no arranca el seguimiento. Regístrala arriba y los controles
          se programan solos desde esa fecha.
        </Typography>
      ) : venta.followUps?.length ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {venta.followUps.map((f) => {
            const meta = FUNNEL_META[f.status] || FUNNEL_META.PENDING;
            return (
              <Chip
                key={f.id}
                size="small"
                label={`${PASOS[f.step] || f.step} · ${fmt(f.dueDate)}`}
                sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }}
              />
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: MUTED }}>
          Hay fecha de adaptación pero no se programaron controles. Vuelve a guardarla para
          reprogramarlos.
        </Typography>
      )}
    </Box>
  );
}
