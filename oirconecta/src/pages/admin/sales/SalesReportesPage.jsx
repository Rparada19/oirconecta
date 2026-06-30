/**
 * Reportes del CRM Sales: KPIs por rango (semana / quincena / mes / trimestre /
 * año / histórico), pipeline visual, actividad por tipo y revenue captado.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Container, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, Alert,
} from '@mui/material';
import {
  InsightsOutlined, PersonAddAlt1Outlined, PhoneOutlined, EmailOutlined,
  WhatsApp, EventOutlined, AttachMoneyOutlined,
} from '@mui/icons-material';
import { salesApi, STATUS_META, PIPELINE_STAGES, fmtCOP } from '../../../services/salesApi';
import { SalesPageHeader, softCard } from './SalesShell';
import { RangeChips } from './SalesWidgets';
import { getAdminUser } from '../adminAuth';
import { canAccessAllAdminPages } from '../../../utils/rolePermissions';

const TONES = {
  info:    { bar: '#3b82f6', num: '#1e40af', bg: '#eef0fb' },
  success: { bar: '#10b981', num: '#065f46', bg: '#ecfdf5' },
  violet:  { bar: '#8b5cf6', num: '#5b21b6', bg: '#f3edff' },
  warning: { bar: '#f59e0b', num: '#92400e', bg: '#fffbeb' },
  navy:    { bar: '#272F50', num: '#272F50', bg: '#eef0fb' },
};

export default function SalesReportesPage() {
  const [range, setRange] = useState('month');
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState(null);
  const isAdmin = canAccessAllAdminPages(getAdminUser()?.role || 'ADMIN');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        salesApi.stats({ range }),
        salesApi.revenue({ range }),
      ]);
      setStats(s);
      setRevenue(r);
    } catch (e) {
      setSnack({ severity: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { if (isAdmin) salesApi.listUsers().then(setUsers).catch(() => {}); }, [isAdmin]);

  const reloadUsers = () => salesApi.listUsers().then(setUsers).catch(() => {});

  const counts = stats?.byStatus || {};
  const total = (stats?.open || 0) + (stats?.closed || 0);
  const byType = stats?.activities?.byType || {};
  const totalAct = stats?.activities?.rangeTotal || 0;
  const conv = counts.CONVERTIDO || 0;
  const enPrueba = counts.EN_PRUEBA || 0;
  const demos = counts.DEMO_AGENDADA || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SalesPageHeader
        icon={InsightsOutlined}
        title="Reportes"
        subtitle="KPIs, pipeline, actividad y revenue"
        actions={isAdmin ? (
          <Button onClick={() => setCreateOpen(true)} startIcon={<PersonAddAlt1Outlined />} variant="contained"
            sx={{ bgcolor: '#4054B2', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#32449a' } }}>
            Crear ejecutivo
          </Button>
        ) : null}
      />

      {/* Range chips */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: '#5b6b7a', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
          Rango
        </Typography>
        <RangeChips value={range} onChange={setRange} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
      ) : (
        <>
          {/* Bloque revenue */}
          <Box sx={{
            ...softCard, p: 2.5, mb: 3,
            background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 50%, #085946 100%)',
            color: '#fff',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <AttachMoneyOutlined sx={{ fontSize: 22, color: '#6ee7c8' }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6ee7c8', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                Revenue captado · {stats?.rangeLabel}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <RevenueKpi label="MRR comprometido" value={fmtCOP(revenue?.mrrCommittedCOP || 0)} bigValue />
              <RevenueKpi label="ARR proyectado" value={fmtCOP(revenue?.arrCommittedCOP || 0)} />
              <RevenueKpi label="Cuentas pagas activas" value={revenue?.paidAccounts ?? 0} />
              <RevenueKpi label="Cuentas totales creadas" value={revenue?.totalAccounts ?? 0} />
            </Box>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap', pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <RevenueKpi label={`Cobrado · ${stats?.rangeLabel}`} value={fmtCOP(revenue?.payments?.totalCOP || 0)} />
              <RevenueKpi label="Pagos exitosos" value={revenue?.payments?.count ?? 0} />
            </Box>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', mt: 1.5 }}>
              MRR/ARR = valor mensualizado de tus cuentas ACTIVE/EXPIRING_SOON (sin IVA). Cobrado = pagos APROBADOS en el rango. Atribución: DirectoryAccount.createdByUserId.
            </Typography>
          </Box>

          {/* Desglose por plan de las cuentas captadas */}
          {revenue?.byPlan?.length > 0 && (
            <Box sx={{ ...softCard, p: 2.5, mb: 3 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
                MRR por plan · {stats?.rangeLabel}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {revenue.byPlan.map((p) => (
                  <Box key={p.code} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#272F50', fontSize: 13.5 }}>{p.nombre}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>{p.count} cuenta(s)</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: '#085946', fontSize: 14 }}>{fmtCOP(p.mrrCOP)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* KPIs operativos */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
            <Kpi label="Actividades totales" value={totalAct} hint={stats?.rangeLabel} tone="info" />
            <Kpi label="Demos agendadas" value={demos} tone="violet" hint="En el pipeline ahora" />
            <Kpi label="En prueba" value={enPrueba} tone="warning" hint="Cuentas trial activas" />
            <Kpi label="Convertidos" value={conv} tone="success" hint={`Tasa: ${stats?.conversionRate ?? 0}%`} />
          </Box>

          {/* Actividad por tipo */}
          <Box sx={{ ...softCard, p: 2.5, mb: 3 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
              Mix de actividad · {stats?.rangeLabel}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1.25 }}>
              <ActivityKpi icon={PhoneOutlined}     label="Llamadas" value={byType.CALL || 0}      color="#4054B2" />
              <ActivityKpi icon={EmailOutlined}     label="Emails"   value={byType.EMAIL || 0}     color="#8b5cf6" />
              <ActivityKpi icon={WhatsApp}          label="WhatsApp" value={byType.WHATSAPP || 0}  color="#25D366" />
              <ActivityKpi icon={EventOutlined}     label="Reuniones" value={byType.MEETING || 0}  color="#0099CC" />
              <ActivityKpi icon={InsightsOutlined}  label="Notas"    value={byType.NOTE || 0}      color="#5b6b7a" />
            </Box>
          </Box>

          {/* Pipeline */}
          <Box sx={{ ...softCard, p: 2.5, mb: 3 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
              Pipeline por estado (histórico)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
              {PIPELINE_STAGES.map((s) => {
                const c = counts[s] || 0;
                const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                const m = STATUS_META[s];
                return (
                  <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: m.color, minWidth: 130 }}>{m.label}</Typography>
                    <Box sx={{ flex: 1, height: 22, bgcolor: '#f3f4f6', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: m.color, transition: 'width 240ms ease' }} />
                    </Box>
                    <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', minWidth: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {c} · {pct}%
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Equipo */}
          {isAdmin && (
            <Box sx={{ ...softCard, p: 2.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
                Equipo de captación
              </Typography>
              {users.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: '#5b6b7a', textAlign: 'center', py: 2 }}>
                  Sin usuarios. Crea un ejecutivo para asignar leads.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
                  {users.map((u) => (
                    <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, border: '1px solid #f0f2f4', borderRadius: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, fontSize: 13, fontWeight: 800,
                        bgcolor: u.role === 'ADMIN' ? '#272F50' : '#4054B2', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(u.nombre || '?').charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#041a12' }}>{u.nombre}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#5b6b7a' }}>{u.email}</Typography>
                      </Box>
                      <Box sx={{
                        bgcolor: u.role === 'ADMIN' ? '#eef0fb' : '#ecfdf5',
                        color: u.role === 'ADMIN' ? '#272F50' : '#047857',
                        px: 1, py: 0.25, borderRadius: 0.75, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
                      }}>{u.role}</Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      <CreateExecutiveDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); reloadUsers(); setSnack({ severity: 'success', msg: 'Ejecutivo creado' }); }}
        setSnack={setSnack} />

      <Snackbar open={!!snack} autoHideDuration={2400} onClose={() => setSnack(null)}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Container>
  );
}

function Kpi({ label, value, hint, tone = 'info' }) {
  const t = TONES[tone] || TONES.info;
  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${t.bar}`, borderRadius: 2, px: 2, py: 1.75 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5b6b7a' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: t.num, lineHeight: 1.2, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {hint && <Typography sx={{ fontSize: 11.5, color: '#5b6b7a', mt: 0.25 }}>{hint}</Typography>}
    </Box>
  );
}

function RevenueKpi({ label, value, bigValue }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: bigValue ? 24 : 18, fontWeight: 800, color: '#fff', mt: 0.25, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

function ActivityKpi({ icon: Icon, label, value, color }) {
  return (
    <Box sx={{ bgcolor: `${color}10`, border: `1px solid ${color}25`, borderRadius: 1.5, p: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#041a12', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function CreateExecutiveDialog({ open, onClose, onCreated, setSnack }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.nombre || !form.email || !form.password) { setSnack({ severity: 'error', msg: 'Todos los campos son requeridos' }); return; }
    if (form.password.length < 8) { setSnack({ severity: 'error', msg: 'Password mínimo 8 caracteres' }); return; }
    setSaving(true);
    try { await salesApi.createUser(form); setForm({ nombre: '', email: '', password: '' }); onCreated(); }
    catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
        Crear ejecutivo comercial
        <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
          Tendrá acceso solo al CRM Sales en portal-admin.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Nombre completo" value={form.nombre} onChange={set('nombre')} size="small" />
          <TextField label="Email corporativo" type="email" value={form.email} onChange={set('email')} size="small" />
          <TextField label="Password temporal" type="password" value={form.password} onChange={set('password')} size="small" helperText="Mínimo 8 caracteres" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
        <Button onClick={submit} disabled={saving} variant="contained"
          sx={{ bgcolor: '#4054B2', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#32449a' } }}>
          {saving ? 'Creando…' : 'Crear ejecutivo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
