/**
 * Finanzas — salud del negocio consolidado (centro auditivo + portal profesional).
 *
 * Los gastos y activos se capturan aquí, mes a mes; la facturación la trae el
 * sistema (ventas del centro + pagos de suscripciones del portal).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Button, Tabs, Tab, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, Snackbar, Alert, Tooltip, ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AccountBalance, Add, Delete, Edit, TrendingUp, TrendingDown, Refresh, Savings,
  ContentCopy, LibraryAdd,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import {
  getFinanceSummary, getExpenses, createExpense, updateExpense, deleteExpense,
  copyPreviousMonth, replicateExpenses,
  getAssets, createAsset, updateAsset, deleteAsset,
} from '../../services/financeService';

const CATEGORIAS_GASTO = [
  { value: 'nomina', label: 'Nómina' },
  { value: 'arriendo', label: 'Arriendo' },
  { value: 'servicios', label: 'Servicios públicos' },
  { value: 'software', label: 'Software y tecnología' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'bancos', label: 'Bancos y créditos' },
  { value: 'seguros', label: 'Seguros y pólizas' },
  { value: 'honorarios', label: 'Honorarios y asesorías' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'financieros', label: 'Gastos financieros' },
  { value: 'marketing', label: 'Marketing y publicidad' },
  { value: 'mercancia', label: 'Mercancía / costo de venta' },
  { value: 'viajes', label: 'Viajes y hospedaje' },
  { value: 'representacion', label: 'Gastos de representación' },
  { value: 'combustible', label: 'Combustible y transporte' },
  { value: 'mantenimiento', label: 'Mantenimiento y reparaciones' },
  { value: 'papeleria', label: 'Papelería e insumos' },
  { value: 'capacitacion', label: 'Capacitación y congresos' },
  { value: 'otros', label: 'Otros' },
];

const CATEGORIAS_ACTIVO = [
  { value: 'equipos', label: 'Equipos audiológicos' },
  { value: 'muebles', label: 'Muebles y enseres' },
  { value: 'tecnologia', label: 'Tecnología / cómputo' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'otros', label: 'Otros' },
];

const LINEAS = [
  { value: 'CENTRO', label: 'Centro auditivo', color: '#085946' },
  { value: 'PORTAL', label: 'Portal web', color: '#7c3aed' },
  { value: 'COMPARTIDO', label: 'Compartido', color: '#64748b' },
];

const labelCategoria = (v) =>
  CATEGORIAS_GASTO.find((c) => c.value === v)?.label ||
  CATEGORIAS_ACTIVO.find((c) => c.value === v)?.label ||
  (v === 'depreciacion' ? 'Depreciación' : v);

const infoLinea = (v) => LINEAS.find((l) => l.value === v) || LINEAS[2];

const cop = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(Math.round(n || 0));

const copCorto = (n) => {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
};

const mesCorto = (periodo) => {
  const [y, m] = periodo.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
};

const periodoActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const Card = ({ children, sx, fill = true }) => (
  <Box sx={{
    p: 2.5, borderRadius: '16px', bgcolor: '#fff',
    border: '1px solid #e5e7eb', ...(fill ? { height: '100%' } : {}), ...sx,
  }}>
    {children}
  </Box>
);

const Kpi = ({ label, value, hint, color = '#0F2A4A', icon }) => (
  <Card>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, color }}>
      {icon}
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
      {value}
    </Typography>
    {hint && <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>{hint}</Typography>}
  </Card>
);

const TH = { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' };

export default function FinanzasPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const [expenseDialog, setExpenseDialog] = useState(null); // { tipo, id }
  const [expenseForm, setExpenseForm] = useState({});
  const [mesGastos, setMesGastos] = useState(periodoActual());
  const [replicarDialog, setReplicarDialog] = useState(false);
  const [replicarForm, setReplicarForm] = useState({ desde: '', hasta: '', excluir: '' });
  const [assetDialog, setAssetDialog] = useState(null); // { id }
  const [assetForm, setAssetForm] = useState({});
  const [saving, setSaving] = useState(false);

  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, e, a] = await Promise.all([getFinanceSummary(anio), getExpenses(), getAssets()]);
    setSummary(s);
    setExpenses(e);
    setAssets(a);
    setLoading(false);
  }, [anio]);

  useEffect(() => { load(); }, [load]);

  // ── Gastos ──
  const openExpenseDialog = (tipo, gasto = null) => {
    setExpenseForm(gasto
      ? { ...gasto, montoCOP: String(gasto.montoCOP), periodo: gasto.periodo || mesGastos }
      : { tipo, concepto: '', categoria: 'otros', linea: 'COMPARTIDO', montoCOP: '', periodo: mesGastos, notas: '' });
    setExpenseDialog({ tipo, id: gasto?.id || null });
  };

  const saveExpense = async () => {
    if (!expenseForm.concepto?.trim() || !Number(expenseForm.montoCOP)) {
      notify('Escribe el concepto y un monto mayor a cero', 'error');
      return;
    }
    setSaving(true);
    const payload = { ...expenseForm, montoCOP: Number(expenseForm.montoCOP) };
    const r = expenseDialog.id
      ? await updateExpense(expenseDialog.id, payload)
      : await createExpense(payload);
    setSaving(false);
    if (!r.success) return notify('No se pudo guardar el gasto', 'error');
    const eraEdicion = !!expenseDialog.id;
    setExpenseDialog(null);
    notify(eraEdicion ? 'Gasto actualizado' : 'Gasto registrado');
    load();
  };

  const removeExpense = async (id) => {
    const r = await deleteExpense(id);
    if (!r.success) return notify('No se pudo eliminar', 'error');
    notify('Gasto eliminado');
    load();
  };

  const handleCopiarMesAnterior = async () => {
    setSaving(true);
    const r = await copyPreviousMonth(mesGastos);
    setSaving(false);
    if (!r.success) return notify('No se pudo copiar', 'error');
    if (!r.result?.copiados) return notify(`No hay gastos nuevos que copiar desde ${r.result?.desde}`, 'info');
    notify(`${r.result.copiados} gasto(s) copiados desde ${r.result.desde}`);
    load();
  };

  const openReplicar = () => {
    setReplicarForm({ desde: `${anio}-01`, hasta: mesGastos, excluir: '' });
    setReplicarDialog(true);
  };

  const handleReplicar = async () => {
    const { desde, hasta, excluir } = replicarForm;
    if (!desde || !hasta || desde > hasta) {
      notify('Revisa el rango de meses', 'error');
      return;
    }
    const destinos = [];
    let [y, m] = desde.split('-').map(Number);
    const [yf, mf] = hasta.split('-').map(Number);
    while (y < yf || (y === yf && m <= mf)) {
      const p = `${y}-${String(m).padStart(2, '0')}`;
      if (p !== mesGastos) destinos.push(p);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    if (destinos.length === 0) return notify('El rango no incluye meses distintos al actual', 'error');
    setSaving(true);
    const r = await replicateExpenses({
      origen: mesGastos,
      destinos,
      excluirConceptos: excluir.split(',').map((x) => x.trim()).filter(Boolean),
    });
    setSaving(false);
    if (!r.success) return notify('No se pudo replicar', 'error');
    setReplicarDialog(false);
    notify(`${r.result.creados} gasto(s) creados en ${r.result.meses} mes(es). Revisa los valores.`);
    load();
  };

  // ── Activos ──
  const openAssetDialog = (activo = null) => {
    setAssetForm(activo
      ? { ...activo, fechaCompra: String(activo.fechaCompra).slice(0, 10) }
      : {
        nombre: '', categoria: 'equipos', valorCompra: '', valorResidual: '',
        fechaCompra: new Date().toISOString().slice(0, 10), vidaUtilMeses: 60, notas: '',
      });
    setAssetDialog({ id: activo?.id || null });
  };

  const saveAsset = async () => {
    if (!assetForm.nombre?.trim() || !Number(assetForm.valorCompra)) {
      notify('Escribe el nombre y el valor de compra', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      ...assetForm,
      valorCompra: Number(assetForm.valorCompra),
      valorResidual: Number(assetForm.valorResidual) || 0,
      vidaUtilMeses: Number(assetForm.vidaUtilMeses) || 60,
    };
    const r = assetDialog.id ? await updateAsset(assetDialog.id, payload) : await createAsset(payload);
    setSaving(false);
    if (!r.success) return notify('No se pudo guardar el activo', 'error');
    const eraEdicion = !!assetDialog.id;
    setAssetDialog(null);
    notify(eraEdicion ? 'Activo actualizado' : 'Activo registrado');
    load();
  };

  const removeAsset = async (id) => {
    const r = await deleteAsset(id);
    if (!r.success) return notify('No se pudo eliminar', 'error');
    notify('Activo eliminado');
    load();
  };

  const delMes = expenses.filter((e) => (e.periodo || e.vigenteDesde) === mesGastos);
  const fijos = delMes.filter((e) => e.tipo === 'FIJO');
  const variables = delMes.filter((e) => e.tipo === 'VARIABLE');
  const anioHoy = new Date().getFullYear();
  const anios = [anioHoy + 1, anioHoy, anioHoy - 1, anioHoy - 2];

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100%' }}>
      <PageHeader
        title="Finanzas"
        subtitle="Salud del negocio consolidado: centro auditivo + portal profesional"
        icon={AccountBalance}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Año</InputLabel>
              <Select label="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
                {anios.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load}
              sx={{ borderRadius: '10px', fontWeight: 700 }}>
              Actualizar
            </Button>
          </Box>
        }
      />

      <Box sx={{ px: { xs: 2.5, md: 4 }, borderBottom: '1px solid #e5e7eb', bgcolor: '#fff' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Resumen" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Gastos (${expenses.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Activos (${assets.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* ═══════════════ RESUMEN ═══════════════ */}
            {tab === 0 && summary && (() => {
              const { actual, anterior, acumulado, puntoEquilibrio: pe, serie, gastosPorCategoria, totales, porLinea } = summary;
              const maxSerie = Math.max(1, ...serie.map((m) => Math.max(m.ingresos, m.gastosTotales)));
              const maxCat = Math.max(1, ...gastosPorCategoria.map((c) => c.monto));
              const deltaIngresos = anterior && anterior.ingresos > 0
                ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos) * 100 : null;

              return (
                <>
                  {/* Punto de equilibrio */}
                  <Card fill={false} sx={{ mb: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Punto de equilibrio · {mesCorto(actual.periodo)} {actual.periodo.slice(0, 4)}
                        </Typography>
                        <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color: pe.cubierto ? '#059669' : '#0F2A4A', letterSpacing: '-0.02em' }}>
                          {pe.cubierto
                            ? `Gastos cubiertos · utilidad ${cop(actual.utilidadNeta)}`
                            : `Faltan ${cop(pe.faltante)} por facturar`}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          Facturado {cop(pe.facturado)} de {cop(pe.meta)} en gastos del mes (incluye depreciación)
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: pe.cubierto ? '#059669' : '#d97706', letterSpacing: '-0.03em' }}>
                        {pe.avancePct == null ? '—' : `${pe.avancePct.toFixed(0)}%`}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 14, borderRadius: '7px', bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${pe.avancePct || 0}%`, height: '100%', borderRadius: '7px',
                        background: pe.cubierto ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#d97706,#f59e0b)',
                        transition: 'width .6s ease',
                      }} />
                    </Box>
                  </Card>

                  {/* KPIs del mes en curso */}
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.25 }}>
                    Mes en curso · {mesCorto(actual.periodo)} {actual.periodo.slice(0, 4)}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi label="Ingresos del mes" value={cop(actual.ingresos)} color="#059669"
                        icon={<TrendingUp sx={{ fontSize: 16 }} />}
                        hint={deltaIngresos == null ? 'Sin mes anterior comparable'
                          : `${deltaIngresos >= 0 ? '+' : ''}${deltaIngresos.toFixed(0)}% vs mes anterior`} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi label="Gastos del mes" value={cop(actual.gastosTotales)} color="#dc2626"
                        icon={<TrendingDown sx={{ fontSize: 16 }} />}
                        hint={`Fijos ${copCorto(actual.gastosFijos)} · Var. ${copCorto(actual.gastosVariables)} · Depr. ${copCorto(actual.depreciacion)}`} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi label="Utilidad neta" value={cop(actual.utilidadNeta)}
                        color={actual.utilidadNeta >= 0 ? '#059669' : '#dc2626'}
                        icon={<Savings sx={{ fontSize: 16 }} />}
                        hint={`Operativa ${cop(actual.utilidadOperativa)}`} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi label="Margen neto"
                        value={actual.margenNeto == null ? '—' : `${actual.margenNeto.toFixed(1)}%`}
                        color={(actual.margenNeto || 0) >= 0 ? '#0F2A4A' : '#dc2626'}
                        hint={actual.margenOperativo == null ? 'Sin ingresos este mes'
                          : `Margen operativo ${actual.margenOperativo.toFixed(1)}%`} />
                    </Grid>
                  </Grid>

                  {/* KPIs acumulados del año corrido */}
                  {acumulado && (
                    <>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.25 }}>
                        Acumulado {summary.anio} · {acumulado.desde ? mesCorto(acumulado.desde) : '—'} a {mesCorto(acumulado.hasta)}
                        {` (${acumulado.meses} ${acumulado.meses === 1 ? 'mes' : 'meses'})`}
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Kpi label="Ingresos acumulados" value={cop(acumulado.ingresos)} color="#059669"
                            icon={<TrendingUp sx={{ fontSize: 16 }} />}
                            hint={`Centro ${copCorto(acumulado.ingresosCentro)} · Portal ${copCorto(acumulado.ingresosPortal)}`} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Kpi label="Gastos acumulados" value={cop(acumulado.gastosTotales)} color="#dc2626"
                            icon={<TrendingDown sx={{ fontSize: 16 }} />}
                            hint={`Fijos ${copCorto(acumulado.gastosFijos)} · Var. ${copCorto(acumulado.gastosVariables)} · Depr. ${copCorto(acumulado.depreciacion)}`} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Kpi label="Utilidad acumulada" value={cop(acumulado.utilidadNeta)}
                            color={acumulado.utilidadNeta >= 0 ? '#059669' : '#dc2626'}
                            icon={<Savings sx={{ fontSize: 16 }} />}
                            hint={`Promedio ${cop(acumulado.utilidadNeta / (acumulado.meses || 1))} / mes`} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Kpi label="Margen acumulado"
                            value={acumulado.margenNeto == null ? '—' : `${acumulado.margenNeto.toFixed(1)}%`}
                            color={(acumulado.margenNeto || 0) >= 0 ? '#0F2A4A' : '#dc2626'}
                            hint={acumulado.margenOperativo == null
                              ? 'Sin ingresos en el año corrido'
                              : `Margen operativo ${acumulado.margenOperativo.toFixed(1)}%`} />
                        </Grid>
                      </Grid>
                    </>
                  )}

                  {/* Resultado por línea de negocio */}
                  {porLinea && (
                    <Card fill={false} sx={{ mb: 3 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                        Resultado por línea de negocio · {summary.anio}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 2 }}>
                        Solo se imputan los gastos marcados con esa línea. Los compartidos van aparte
                        para no inflar ni castigar a ninguna de las dos.
                      </Typography>
                      <Grid container spacing={2}>
                        {porLinea.map((l) => {
                          const info = infoLinea(l.linea);
                          const esCompartido = l.linea === 'COMPARTIDO';
                          return (
                            <Grid item xs={12} md={4} key={l.linea}>
                              <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${info.color}33`, bgcolor: `${info.color}08`, height: '100%' }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: info.color, textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1 }}>
                                  {info.label}
                                </Typography>
                                {!esCompartido && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>Ingresos</Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{cop(l.ingresos)}</Typography>
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>Gastos</Typography>
                                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{cop(l.gastos)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: `1px solid ${info.color}22` }}>
                                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f1923' }}>
                                    {esCompartido ? 'Gasto común' : 'Resultado'}
                                  </Typography>
                                  <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: esCompartido ? '#64748b' : l.resultado >= 0 ? '#059669' : '#dc2626' }}>
                                    {esCompartido ? cop(l.gastos) : cop(l.resultado)}
                                  </Typography>
                                </Box>
                                {!esCompartido && l.margen != null && (
                                  <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'right' }}>
                                    margen {l.margen.toFixed(0)}%
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Card>
                  )}

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Ingresos vs gastos del año */}
                    <Grid item xs={12} lg={8}>
                      <Card>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923', mb: 0.5 }}>
                          Ingresos vs gastos · {summary.anio}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          {[{ l: 'Ingresos', c: '#059669' }, { l: 'Gastos', c: '#dc2626' }].map((x) => (
                            <Box key={x.l} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: x.c }} />
                              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{x.l}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 190 }}>
                          {serie.map((m) => (
                            <Box key={m.periodo} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                              <Tooltip arrow title={
                                <Box sx={{ fontSize: '0.75rem' }}>
                                  <div>Ingresos: {cop(m.ingresos)}</div>
                                  <div>· Centro: {cop(m.ingresosCentro)}</div>
                                  <div>· Portal: {cop(m.ingresosPortal)}</div>
                                  <div>Gastos: {cop(m.gastosTotales)}</div>
                                  <div>Utilidad: {cop(m.utilidadNeta)}</div>
                                </Box>
                              }>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 150, width: '100%', justifyContent: 'center' }}>
                                  <Box sx={{ width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#059669',
                                    height: `${Math.max((m.ingresos / maxSerie) * 100, m.ingresos > 0 ? 2 : 0)}%` }} />
                                  <Box sx={{ width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#dc2626',
                                    height: `${Math.max((m.gastosTotales / maxSerie) * 100, m.gastosTotales > 0 ? 2 : 0)}%` }} />
                                </Box>
                              </Tooltip>
                              <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>
                                {mesCorto(m.periodo)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                      <Card fill={false} sx={{ mb: 3 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923', mb: 2 }}>
                          De dónde vienen los ingresos
                        </Typography>
                        {[
                          { l: 'Centro auditivo', v: actual.ingresosCentro, c: '#085946' },
                          { l: 'Portal profesional', v: actual.ingresosPortal, c: '#7c3aed' },
                        ].map((x) => {
                          const pct = actual.ingresos > 0 ? (x.v / actual.ingresos) * 100 : 0;
                          return (
                            <Box key={x.l} sx={{ mb: 1.75 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>{x.l}</Typography>
                                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: x.c }}>
                                  {cop(x.v)} · {pct.toFixed(0)}%
                                </Typography>
                              </Box>
                              <Box sx={{ height: 8, borderRadius: '4px', bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: x.c }} />
                              </Box>
                            </Box>
                          );
                        })}
                      </Card>

                      <Card fill={false}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923', mb: 2 }}>
                          Gastos del mes por categoría
                        </Typography>
                        {gastosPorCategoria.length === 0 ? (
                          <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                            Aún no hay gastos en este mes.
                          </Typography>
                        ) : gastosPorCategoria.map((c) => (
                          <Box key={c.categoria} sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                                {labelCategoria(c.categoria)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F2A4A' }}>
                                {cop(c.monto)}
                              </Typography>
                            </Box>
                            <Box sx={{ height: 6, borderRadius: '3px', bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                              <Box sx={{ width: `${(c.monto / maxCat) * 100}%`, height: '100%', bgcolor: '#0F2A4A' }} />
                            </Box>
                          </Box>
                        ))}
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Ingresos por línea de negocio */}
                  <Card fill={false} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                          Ingresos por línea de negocio · {summary.anio}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Centro auditivo (ventas y servicios) vs portal profesional (suscripciones y paquetes IA).
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {[
                          { l: 'Centro auditivo', v: totales.ingresosCentro, c: '#085946' },
                          { l: 'Portal profesional', v: totales.ingresosPortal, c: '#7c3aed' },
                        ].map((x) => (
                          <Box key={x.l}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: x.c }} />
                              <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                                {x.l}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 900, color: x.c, letterSpacing: '-0.02em' }}>
                              {cop(x.v)}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                              {totales.ingresos > 0 ? `${((x.v / totales.ingresos) * 100).toFixed(0)}% del año` : 'sin ingresos'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    {(() => {
                      const maxLinea = Math.max(1, ...serie.map((m) => Math.max(m.ingresosCentro, m.ingresosPortal)));
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 150 }}>
                          {serie.map((m) => (
                            <Box key={m.periodo} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                              <Tooltip arrow title={
                                <Box sx={{ fontSize: '0.75rem' }}>
                                  <div>Centro: {cop(m.ingresosCentro)}</div>
                                  <div>Portal: {cop(m.ingresosPortal)}</div>
                                </Box>
                              }>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 115, width: '100%', justifyContent: 'center' }}>
                                  <Box sx={{ width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#085946',
                                    height: `${Math.max((m.ingresosCentro / maxLinea) * 100, m.ingresosCentro > 0 ? 2 : 0)}%` }} />
                                  <Box sx={{ width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#7c3aed',
                                    height: `${Math.max((m.ingresosPortal / maxLinea) * 100, m.ingresosPortal > 0 ? 2 : 0)}%` }} />
                                </Box>
                              </Tooltip>
                              <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>
                                {mesCorto(m.periodo)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Card>

                  {/* Detalle mes a mes — enero a diciembre + totales */}
                  <Card fill={false} sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, pb: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                        Detalle mes a mes · enero a diciembre {summary.anio}
                      </Typography>
                    </Box>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': TH }}>
                            <TableCell>Mes</TableCell>
                            <TableCell align="right">Centro</TableCell>
                            <TableCell align="right">Portal</TableCell>
                            <TableCell align="right">Ingresos</TableCell>
                            <TableCell align="right">Fijos</TableCell>
                            <TableCell align="right">Variables</TableCell>
                            <TableCell align="right">Depreciación</TableCell>
                            <TableCell align="right">Gastos</TableCell>
                            <TableCell align="right">Utilidad neta</TableCell>
                            <TableCell align="right">Margen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {serie.map((m) => {
                            const sinMovimiento = !m.ingresos && !m.gastosTotales;
                            return (
                              <TableRow key={m.periodo} hover sx={sinMovimiento ? { opacity: 0.45 } : undefined}>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                  {mesCorto(m.periodo)}
                                </TableCell>
                                <TableCell align="right">{cop(m.ingresosCentro)}</TableCell>
                                <TableCell align="right">{cop(m.ingresosPortal)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{cop(m.ingresos)}</TableCell>
                                <TableCell align="right">{cop(m.gastosFijos)}</TableCell>
                                <TableCell align="right">{cop(m.gastosVariables)}</TableCell>
                                <TableCell align="right">{cop(m.depreciacion)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{cop(m.gastosTotales)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: m.utilidadNeta >= 0 ? '#059669' : '#dc2626' }}>
                                  {cop(m.utilidadNeta)}
                                </TableCell>
                                <TableCell align="right">
                                  {m.margenNeto == null ? '—' : `${m.margenNeto.toFixed(0)}%`}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ '& td': { bgcolor: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' } }}>
                            <TableCell>Total {summary.anio}</TableCell>
                            <TableCell align="right">{cop(totales.ingresosCentro)}</TableCell>
                            <TableCell align="right">{cop(totales.ingresosPortal)}</TableCell>
                            <TableCell align="right">{cop(totales.ingresos)}</TableCell>
                            <TableCell align="right">{cop(totales.gastosFijos)}</TableCell>
                            <TableCell align="right">{cop(totales.gastosVariables)}</TableCell>
                            <TableCell align="right">{cop(totales.depreciacion)}</TableCell>
                            <TableCell align="right">{cop(totales.gastosTotales)}</TableCell>
                            <TableCell align="right" sx={{ color: totales.utilidadNeta >= 0 ? '#059669' : '#dc2626' }}>
                              {cop(totales.utilidadNeta)}
                            </TableCell>
                            <TableCell align="right">
                              {totales.ingresos > 0 ? `${((totales.utilidadNeta / totales.ingresos) * 100).toFixed(0)}%` : '—'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </>
              );
            })()}

            {/* ═══════════════ GASTOS ═══════════════ */}
            {tab === 1 && (
              <>
                <Card fill={false} sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                      Gastos de {mesCorto(mesGastos)} {mesGastos.slice(0, 4)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Cada mes se registra por separado: los fijos también cambian (nómina, arriendo con IPC).
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField size="small" type="month" label="Mes" InputLabelProps={{ shrink: true }}
                      value={mesGastos} onChange={(e) => setMesGastos(e.target.value || periodoActual())}
                      sx={{ minWidth: 160 }} />
                    <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                      onClick={handleCopiarMesAnterior} disabled={saving}
                      sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Copiar mes anterior
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<LibraryAdd />}
                      onClick={openReplicar} disabled={saving || delMes.length === 0}
                      sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Replicar a varios meses
                    </Button>
                    <Chip label={`Total ${cop(delMes.reduce((t, g) => t + g.montoCOP, 0))}`}
                      sx={{ fontWeight: 800, bgcolor: 'rgba(15,42,74,0.08)', color: '#0F2A4A' }} />
                  </Box>
                </Card>

                <Grid container spacing={3}>
                  {[
                    { tipo: 'FIJO', titulo: 'Gastos fijos', desc: 'Recurrentes: arriendo, nómina, leasing, bancos, software.', items: fijos },
                    { tipo: 'VARIABLE', titulo: 'Gastos variables', desc: 'Puntuales: mercancía, viajes, combustible, campañas.', items: variables },
                  ].map((bloque) => (
                    <Grid item xs={12} lg={6} key={bloque.tipo}>
                      <Card fill={false} sx={{ p: 0, overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                              {bloque.titulo}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{bloque.desc}</Typography>
                          </Box>
                          <Button size="small" variant="contained" startIcon={<Add />}
                            onClick={() => openExpenseDialog(bloque.tipo)}
                            sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Agregar
                          </Button>
                        </Box>
                        {bloque.items.length === 0 ? (
                          <Box sx={{ px: 2.5, pb: 3 }}>
                            <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Sin registros este mes.</Typography>
                          </Box>
                        ) : (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ '& th': TH }}>
                                  <TableCell>Concepto</TableCell>
                                  <TableCell>Categoría</TableCell>
                                  <TableCell>Línea</TableCell>
                                  <TableCell align="right">Monto</TableCell>
                                  <TableCell align="right" />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {bloque.items.map((g) => {
                                  const info = infoLinea(g.linea);
                                  return (
                                    <TableRow key={g.id} hover>
                                      <TableCell sx={{ fontWeight: 600 }}>
                                        {g.concepto}
                                        {g.notas && (
                                          <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{g.notas}</Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip size="small" label={labelCategoria(g.categoria)} sx={{ fontSize: '0.6875rem', fontWeight: 700 }} />
                                      </TableCell>
                                      <TableCell>
                                        <Chip size="small" label={info.label}
                                          sx={{ fontSize: '0.6875rem', fontWeight: 700, bgcolor: `${info.color}18`, color: info.color }} />
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{cop(g.montoCOP)}</TableCell>
                                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        <IconButton size="small" onClick={() => openExpenseDialog(g.tipo, g)}>
                                          <Edit sx={{ fontSize: 16, color: '#0F2A4A' }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => removeExpense(g.id)}>
                                          <Delete sx={{ fontSize: 16, color: '#dc2626' }} />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow>
                                  <TableCell colSpan={3} sx={{ fontWeight: 800 }}>Total</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 900, color: '#0F2A4A' }}>
                                    {cop(bloque.items.reduce((s, g) => s + g.montoCOP, 0))}
                                  </TableCell>
                                  <TableCell />
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* ═══════════════ ACTIVOS ═══════════════ */}
            {tab === 2 && (
              <Card fill={false} sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                      Activos y depreciación
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Depreciación lineal: (valor de compra − valor residual) ÷ vida útil en meses.
                    </Typography>
                  </Box>
                  <Button size="small" variant="contained" startIcon={<Add />} onClick={() => openAssetDialog()}
                    sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Agregar activo
                  </Button>
                </Box>
                {assets.length === 0 ? (
                  <Box sx={{ px: 2.5, pb: 3 }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Sin activos registrados.</Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': TH }}>
                          <TableCell>Activo</TableCell>
                          <TableCell>Categoría</TableCell>
                          <TableCell>Compra</TableCell>
                          <TableCell align="right">Valor</TableCell>
                          <TableCell align="right">Residual</TableCell>
                          <TableCell align="right">Vida útil</TableCell>
                          <TableCell align="right">Depreciación/mes</TableCell>
                          <TableCell align="right" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assets.map((a) => {
                          const dep = a.vidaUtilMeses > 0 ? (a.valorCompra - a.valorResidual) / a.vidaUtilMeses : 0;
                          return (
                            <TableRow key={a.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{a.nombre}</TableCell>
                              <TableCell>
                                <Chip size="small" label={labelCategoria(a.categoria)} sx={{ fontSize: '0.6875rem', fontWeight: 700 }} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(a.fechaCompra).toLocaleDateString('es-CO')}
                              </TableCell>
                              <TableCell align="right">{cop(a.valorCompra)}</TableCell>
                              <TableCell align="right">{cop(a.valorResidual)}</TableCell>
                              <TableCell align="right">{a.vidaUtilMeses} meses</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>{cop(dep)}</TableCell>
                              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                <IconButton size="small" onClick={() => openAssetDialog(a)}>
                                  <Edit sx={{ fontSize: 16, color: '#0F2A4A' }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => removeAsset(a.id)}>
                                  <Delete sx={{ fontSize: 16, color: '#dc2626' }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ '& td': { bgcolor: '#f8fafc', fontWeight: 900 } }}>
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell align="right">{cop(assets.reduce((s, a) => s + a.valorCompra, 0))}</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell align="right">
                            {cop(assets.reduce((s, a) => s + (a.vidaUtilMeses > 0 ? (a.valorCompra - a.valorResidual) / a.vidaUtilMeses : 0), 0))}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            )}
          </>
        )}
      </Container>

      {/* Diálogo gasto */}
      <Dialog open={!!expenseDialog} onClose={() => setExpenseDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {expenseDialog?.id ? 'Editar gasto' : expenseDialog?.tipo === 'FIJO' ? 'Nuevo gasto fijo' : 'Nuevo gasto variable'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Concepto" value={expenseForm.concepto || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, concepto: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 0.75 }}>
                ¿A qué línea de negocio pertenece?
              </Typography>
              <ToggleButtonGroup exclusive fullWidth size="small"
                value={expenseForm.linea || 'COMPARTIDO'}
                onChange={(_, v) => v && setExpenseForm({ ...expenseForm, linea: v })}>
                {LINEAS.map((l) => (
                  <ToggleButton key={l.value} value={l.value}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8125rem',
                      '&.Mui-selected': { bgcolor: `${l.color}1a`, color: l.color, '&:hover': { bgcolor: `${l.color}26` } } }}>
                    {l.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={expenseForm.categoria || 'otros'}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoria: e.target.value })}>
                  {CATEGORIAS_GASTO.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Monto del mes (COP)" value={expenseForm.montoCOP || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, montoCOP: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="month" label="Mes del gasto" InputLabelProps={{ shrink: true }}
                value={expenseForm.periodo || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, periodo: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={expenseForm.tipo || 'FIJO'}
                  onChange={(e) => setExpenseForm({ ...expenseForm, tipo: e.target.value })}>
                  <MenuItem value="FIJO">Fijo</MenuItem>
                  <MenuItem value="VARIABLE">Variable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notas (opcional)" value={expenseForm.notas || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, notas: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExpenseDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveExpense} disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo replicar */}
      <Dialog open={replicarDialog} onClose={() => setReplicarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Replicar los gastos de {mesCorto(mesGastos)} a varios meses</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Copia los {delMes.length} gasto(s) de {mesGastos} a cada mes del rango. No pisa lo que ya
            exista y marca cada copia con una nota para que revises el valor real del mes.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="month" label="Desde" InputLabelProps={{ shrink: true }}
                value={replicarForm.desde}
                onChange={(e) => setReplicarForm({ ...replicarForm, desde: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="month" label="Hasta" InputLabelProps={{ shrink: true }}
                value={replicarForm.hasta}
                onChange={(e) => setReplicarForm({ ...replicarForm, hasta: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Conceptos a excluir (separados por coma)"
                placeholder="ETB"
                helperText="Útil para servicios que no existían en esos meses."
                value={replicarForm.excluir}
                onChange={(e) => setReplicarForm({ ...replicarForm, excluir: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReplicarDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleReplicar} disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {saving ? 'Replicando…' : 'Replicar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo activo */}
      <Dialog open={!!assetDialog} onClose={() => setAssetDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{assetDialog?.id ? 'Editar activo' : 'Nuevo activo'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre del activo" value={assetForm.nombre || ''}
                onChange={(e) => setAssetForm({ ...assetForm, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={assetForm.categoria || 'equipos'}
                  onChange={(e) => setAssetForm({ ...assetForm, categoria: e.target.value })}>
                  {CATEGORIAS_ACTIVO.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Fecha de compra" InputLabelProps={{ shrink: true }}
                value={assetForm.fechaCompra || ''}
                onChange={(e) => setAssetForm({ ...assetForm, fechaCompra: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Valor compra (COP)" value={assetForm.valorCompra || ''}
                onChange={(e) => setAssetForm({ ...assetForm, valorCompra: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Valor residual" value={assetForm.valorResidual || ''}
                onChange={(e) => setAssetForm({ ...assetForm, valorResidual: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Vida útil (meses)" value={assetForm.vidaUtilMeses || ''}
                onChange={(e) => setAssetForm({ ...assetForm, vidaUtilMeses: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssetDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveAsset} disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
