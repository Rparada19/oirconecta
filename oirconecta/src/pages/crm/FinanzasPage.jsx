/**
 * Finanzas — salud del negocio consolidado (centro auditivo + portal profesional).
 *
 * Los gastos fijos, variables y los activos se capturan aquí; la facturación
 * la trae el sistema (ventas del centro + pagos de suscripciones del portal).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Button, Tabs, Tab, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, Snackbar, Alert, Tooltip,
} from '@mui/material';
import {
  AccountBalance, Add, Delete, TrendingUp, TrendingDown, Refresh, Savings, ContentCopy,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import {
  getFinanceSummary, getExpenses, createExpense, deleteExpense, copyPreviousMonth,
  getAssets, createAsset, deleteAsset,
} from '../../services/financeService';

const CATEGORIAS_GASTO = [
  { value: 'nomina', label: 'Nómina' },
  { value: 'arriendo', label: 'Arriendo' },
  { value: 'servicios', label: 'Servicios públicos' },
  { value: 'software', label: 'Software y tecnología' },
  { value: 'marketing', label: 'Marketing y publicidad' },
  { value: 'mercancia', label: 'Mercancía / costo de venta' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'financieros', label: 'Gastos financieros' },
  { value: 'otros', label: 'Otros' },
];

const CATEGORIAS_ACTIVO = [
  { value: 'equipos', label: 'Equipos audiológicos' },
  { value: 'muebles', label: 'Muebles y enseres' },
  { value: 'tecnologia', label: 'Tecnología / cómputo' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'otros', label: 'Otros' },
];

const labelCategoria = (v) =>
  CATEGORIAS_GASTO.find((c) => c.value === v)?.label ||
  CATEGORIAS_ACTIVO.find((c) => c.value === v)?.label ||
  (v === 'depreciacion' ? 'Depreciación' : v);

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
  return new Date(y, m - 1, 1)
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '');
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

export default function FinanzasPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const [expenseDialog, setExpenseDialog] = useState(null); // 'FIJO' | 'VARIABLE' | null
  const [expenseForm, setExpenseForm] = useState({});
  const [mesGastos, setMesGastos] = useState(periodoActual());
  const [assetDialog, setAssetDialog] = useState(false);
  const [assetForm, setAssetForm] = useState({});
  const [saving, setSaving] = useState(false);

  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, e, a] = await Promise.all([getFinanceSummary(12), getExpenses(), getAssets()]);
    setSummary(s);
    setExpenses(e);
    setAssets(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openExpenseDialog = (tipo) => {
    setExpenseForm({
      tipo,
      concepto: '',
      categoria: 'otros',
      montoCOP: '',
      periodo: mesGastos,
      notas: '',
    });
    setExpenseDialog(tipo);
  };

  const saveExpense = async () => {
    if (!expenseForm.concepto?.trim() || !Number(expenseForm.montoCOP)) {
      notify('Escribe el concepto y un monto mayor a cero', 'error');
      return;
    }
    setSaving(true);
    const r = await createExpense({ ...expenseForm, montoCOP: Number(expenseForm.montoCOP) });
    setSaving(false);
    if (!r.success) return notify('No se pudo guardar el gasto', 'error');
    setExpenseDialog(null);
    notify('Gasto registrado');
    load();
  };

  const removeExpense = async (id) => {
    const r = await deleteExpense(id);
    if (!r.success) return notify('No se pudo eliminar', 'error');
    notify('Gasto eliminado');
    load();
  };

  const openAssetDialog = () => {
    setAssetForm({
      nombre: '', categoria: 'equipos', valorCompra: '', valorResidual: '',
      fechaCompra: new Date().toISOString().slice(0, 10), vidaUtilMeses: 60, notas: '',
    });
    setAssetDialog(true);
  };

  const saveAsset = async () => {
    if (!assetForm.nombre?.trim() || !Number(assetForm.valorCompra)) {
      notify('Escribe el nombre y el valor de compra', 'error');
      return;
    }
    setSaving(true);
    const r = await createAsset({
      ...assetForm,
      valorCompra: Number(assetForm.valorCompra),
      valorResidual: Number(assetForm.valorResidual) || 0,
      vidaUtilMeses: Number(assetForm.vidaUtilMeses) || 60,
    });
    setSaving(false);
    if (!r.success) return notify('No se pudo guardar el activo', 'error');
    setAssetDialog(false);
    notify('Activo registrado');
    load();
  };

  const removeAsset = async (id) => {
    const r = await deleteAsset(id);
    if (!r.success) return notify('No se pudo eliminar', 'error');
    notify('Activo eliminado');
    load();
  };

  // Los gastos antiguos sin periodo (esquema previo) se muestran en el mes vigente.
  const delMes = expenses.filter((e) => (e.periodo || e.vigenteDesde) === mesGastos);
  const fijos = delMes.filter((e) => e.tipo === 'FIJO');
  const variables = delMes.filter((e) => e.tipo === 'VARIABLE');

  const handleCopiarMesAnterior = async () => {
    setSaving(true);
    const r = await copyPreviousMonth(mesGastos);
    setSaving(false);
    if (!r.success) return notify('No se pudo copiar', 'error');
    if (!r.result?.copiados) return notify(`No hay gastos nuevos que copiar desde ${r.result?.desde}`, 'info');
    notify(`${r.result.copiados} gasto(s) copiados desde ${r.result.desde}`);
    load();
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100%' }}>
      <PageHeader
        title="Finanzas"
        subtitle="Salud del negocio consolidado: centro auditivo + portal profesional"
        icon={AccountBalance}
        actions={
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Actualizar
          </Button>
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
            {/* ─────────────── RESUMEN ─────────────── */}
            {tab === 0 && summary && (() => {
              const { actual, anterior, puntoEquilibrio: pe, serie, gastosPorCategoria } = summary;
              const maxSerie = Math.max(1, ...serie.map((m) => Math.max(m.ingresos, m.gastosTotales)));
              const maxCat = Math.max(1, ...gastosPorCategoria.map((c) => c.monto));
              const deltaIngresos = anterior && anterior.ingresos > 0
                ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos) * 100
                : null;

              return (
                <>
                  {/* Punto de equilibrio */}
                  <Card sx={{ mb: 3, p: 3 }}>
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
                          Facturado {cop(pe.facturado)} de {cop(pe.meta)} en gastos totales del mes (incluye depreciación)
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: pe.cubierto ? '#059669' : '#d97706', letterSpacing: '-0.03em' }}>
                        {pe.avancePct == null ? '—' : `${pe.avancePct.toFixed(0)}%`}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 14, borderRadius: '7px', bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${pe.avancePct || 0}%`, height: '100%', borderRadius: '7px',
                        background: pe.cubierto
                          ? 'linear-gradient(90deg,#059669,#10b981)'
                          : 'linear-gradient(90deg,#d97706,#f59e0b)',
                        transition: 'width .6s ease',
                      }} />
                    </Box>
                  </Card>

                  {/* KPIs del mes */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi
                        label="Ingresos del mes" value={cop(actual.ingresos)} color="#059669"
                        icon={<TrendingUp sx={{ fontSize: 16 }} />}
                        hint={deltaIngresos == null ? 'Sin mes anterior comparable'
                          : `${deltaIngresos >= 0 ? '+' : ''}${deltaIngresos.toFixed(0)}% vs mes anterior`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi
                        label="Gastos del mes" value={cop(actual.gastosTotales)} color="#dc2626"
                        icon={<TrendingDown sx={{ fontSize: 16 }} />}
                        hint={`Fijos ${copCorto(actual.gastosFijos)} · Variables ${copCorto(actual.gastosVariables)} · Depr. ${copCorto(actual.depreciacion)}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi
                        label="Utilidad neta" value={cop(actual.utilidadNeta)}
                        color={actual.utilidadNeta >= 0 ? '#059669' : '#dc2626'}
                        icon={<Savings sx={{ fontSize: 16 }} />}
                        hint={`Operativa ${cop(actual.utilidadOperativa)}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Kpi
                        label="Margen neto"
                        value={actual.margenNeto == null ? '—' : `${actual.margenNeto.toFixed(1)}%`}
                        color={(actual.margenNeto || 0) >= 0 ? '#0F2A4A' : '#dc2626'}
                        hint={actual.margenOperativo == null ? 'Sin ingresos este mes'
                          : `Margen operativo ${actual.margenOperativo.toFixed(1)}%`}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Ingresos vs gastos 12 meses */}
                    <Grid item xs={12} lg={8}>
                      <Card>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923', mb: 0.5 }}>
                          Ingresos vs gastos — 12 meses
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
                              <Tooltip
                                arrow
                                title={
                                  <Box sx={{ fontSize: '0.75rem' }}>
                                    <div>Ingresos: {cop(m.ingresos)}</div>
                                    <div>· Centro: {cop(m.ingresosCentro)}</div>
                                    <div>· Portal: {cop(m.ingresosPortal)}</div>
                                    <div>Gastos: {cop(m.gastosTotales)}</div>
                                    <div>Utilidad: {cop(m.utilidadNeta)}</div>
                                  </Box>
                                }
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 150, width: '100%', justifyContent: 'center' }}>
                                  <Box sx={{
                                    width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#059669',
                                    height: `${Math.max((m.ingresos / maxSerie) * 100, m.ingresos > 0 ? 2 : 0)}%`,
                                  }} />
                                  <Box sx={{
                                    width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#dc2626',
                                    height: `${Math.max((m.gastosTotales / maxSerie) * 100, m.gastosTotales > 0 ? 2 : 0)}%`,
                                  }} />
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

                    {/* Composición de ingresos + gastos por categoría */}
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
                            Aún no has registrado gastos. Ve a la pestaña “Gastos”.
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

                  {/* Ingresos discriminados por línea de negocio */}
                  <Card fill={false} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                          Ingresos por línea de negocio — 12 meses
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Centro auditivo (ventas y servicios) vs portal profesional (suscripciones y paquetes IA).
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {[
                          { l: 'Centro auditivo', v: summary.totales.ingresosCentro, c: '#085946' },
                          { l: 'Portal profesional', v: summary.totales.ingresosPortal, c: '#7c3aed' },
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
                              {summary.totales.ingresos > 0
                                ? `${((x.v / summary.totales.ingresos) * 100).toFixed(0)}% del total`
                                : 'sin ingresos'}
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
                                  <Box sx={{
                                    width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#085946',
                                    height: `${Math.max((m.ingresosCentro / maxLinea) * 100, m.ingresosCentro > 0 ? 2 : 0)}%`,
                                  }} />
                                  <Box sx={{
                                    width: '42%', borderRadius: '4px 4px 0 0', bgcolor: '#7c3aed',
                                    height: `${Math.max((m.ingresosPortal / maxLinea) * 100, m.ingresosPortal > 0 ? 2 : 0)}%`,
                                  }} />
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

                  {/* Tabla mes a mes */}
                  <Card fill={false} sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 2.5, pb: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                        Detalle mes a mes
                      </Typography>
                    </Box>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' } }}>
                            <TableCell>Mes</TableCell>
                            <TableCell align="right">Centro</TableCell>
                            <TableCell align="right">Portal</TableCell>
                            <TableCell align="right">Ingresos</TableCell>
                            <TableCell align="right">Fijos</TableCell>
                            <TableCell align="right">Variables</TableCell>
                            <TableCell align="right">Depreciación</TableCell>
                            <TableCell align="right">Utilidad neta</TableCell>
                            <TableCell align="right">Margen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...serie].reverse().map((m) => (
                            <TableRow key={m.periodo} hover>
                              <TableCell sx={{ fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                {mesCorto(m.periodo)} {m.periodo.slice(2, 4)}
                              </TableCell>
                              <TableCell align="right">{cop(m.ingresosCentro)}</TableCell>
                              <TableCell align="right">{cop(m.ingresosPortal)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{cop(m.ingresos)}</TableCell>
                              <TableCell align="right">{cop(m.gastosFijos)}</TableCell>
                              <TableCell align="right">{cop(m.gastosVariables)}</TableCell>
                              <TableCell align="right">{cop(m.depreciacion)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: m.utilidadNeta >= 0 ? '#059669' : '#dc2626' }}>
                                {cop(m.utilidadNeta)}
                              </TableCell>
                              <TableCell align="right">
                                {m.margenNeto == null ? '—' : `${m.margenNeto.toFixed(0)}%`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </>
              );
            })()}

            {/* ─────────────── GASTOS ─────────────── */}
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
                  <Chip label={`Total ${cop(delMes.reduce((t, g) => t + g.montoCOP, 0))}`}
                    sx={{ fontWeight: 800, bgcolor: 'rgba(15,42,74,0.08)', color: '#0F2A4A' }} />
                </Box>
              </Card>
              <Grid container spacing={3}>
                {[
                  { tipo: 'FIJO', titulo: 'Gastos fijos', desc: 'Recurrentes: arriendo, nómina, servicios, software.', items: fijos },
                  { tipo: 'VARIABLE', titulo: 'Gastos variables', desc: 'Puntuales del mes: mercancía, campañas, reparaciones.', items: variables },
                ].map((bloque) => (
                  <Grid item xs={12} lg={6} key={bloque.tipo}>
                    <Card sx={{ p: 0, overflow: 'hidden' }}>
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
                          <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                            Sin registros todavía.
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer sx={{ overflowX: 'auto' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc' } }}>
                                <TableCell>Concepto</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>Mes</TableCell>
                                <TableCell align="right">Monto</TableCell>
                                <TableCell align="right" />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bloque.items.map((g) => (
                                <TableRow key={g.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>{g.concepto}</TableCell>
                                  <TableCell>
                                    <Chip size="small" label={labelCategoria(g.categoria)}
                                      sx={{ fontSize: '0.6875rem', fontWeight: 700 }} />
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {g.periodo || g.vigenteDesde || '—'}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>{cop(g.montoCOP)}</TableCell>
                                  <TableCell align="right">
                                    <IconButton size="small" onClick={() => removeExpense(g.id)}>
                                      <Delete sx={{ fontSize: 16, color: '#dc2626' }} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
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

            {/* ─────────────── ACTIVOS ─────────────── */}
            {tab === 2 && (
              <Card sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0f1923' }}>
                      Activos y depreciación
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Depreciación lineal: (valor de compra − valor residual) ÷ vida útil en meses.
                    </Typography>
                  </Box>
                  <Button size="small" variant="contained" startIcon={<Add />} onClick={openAssetDialog}
                    sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Agregar activo
                  </Button>
                </Box>
                {assets.length === 0 ? (
                  <Box sx={{ px: 2.5, pb: 3 }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      Sin activos registrados.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' } }}>
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
                          const dep = a.vidaUtilMeses > 0
                            ? (a.valorCompra - a.valorResidual) / a.vidaUtilMeses : 0;
                          return (
                            <TableRow key={a.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{a.nombre}</TableCell>
                              <TableCell>
                                <Chip size="small" label={labelCategoria(a.categoria)}
                                  sx={{ fontSize: '0.6875rem', fontWeight: 700 }} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(a.fechaCompra).toLocaleDateString('es-CO')}
                              </TableCell>
                              <TableCell align="right">{cop(a.valorCompra)}</TableCell>
                              <TableCell align="right">{cop(a.valorResidual)}</TableCell>
                              <TableCell align="right">{a.vidaUtilMeses} meses</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>{cop(dep)}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" onClick={() => removeAsset(a.id)}>
                                  <Delete sx={{ fontSize: 16, color: '#dc2626' }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
          {expenseDialog === 'FIJO' ? 'Nuevo gasto fijo' : 'Nuevo gasto variable'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Concepto" value={expenseForm.concepto || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, concepto: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={expenseForm.categoria || 'otros'}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoria: e.target.value })}>
                  {CATEGORIAS_GASTO.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Monto del mes (COP)"
                value={expenseForm.montoCOP || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, montoCOP: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="month" label="Mes del gasto"
                InputLabelProps={{ shrink: true }}
                value={expenseForm.periodo || ''}
                onChange={(e) => setExpenseForm({ ...expenseForm, periodo: e.target.value })} />
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

      {/* Diálogo activo */}
      <Dialog open={assetDialog} onClose={() => setAssetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Nuevo activo</DialogTitle>
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
                  {CATEGORIAS_ACTIVO.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
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
          <Button onClick={() => setAssetDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveAsset} disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
