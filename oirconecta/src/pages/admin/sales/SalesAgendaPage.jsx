/**
 * Agenda del comercial de captación (portal-admin → Captación comercial → Agenda).
 *
 * Misma agenda interna que consume el bot de WhatsApp (rama "Soy profesional"):
 * las reuniones que agenda el bot aparecen aquí. El comercial ve su calendario,
 * define su horario semanal y bloquea espacios. Fuente: /api/sales/comercial-agenda.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Tabs, Tab, Snackbar, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, TextField, IconButton,
  Switch, CircularProgress, MenuItem,
} from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { salesApi } from '../../../services/salesApi';
import { SalesPageHeader, softCard } from './SalesShell';
import AgendaCalendarView from '../../../components/profesional/AgendaCalendarView';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const asArray = (r) => (Array.isArray(r) ? r : (r?.items || []));

export default function SalesAgendaPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState({ items: [], upcoming: 0 });
  const [availability, setAvailability] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [snack, setSnack] = useState(null);

  const showSnack = (message, severity = 'success') => setSnack({ message, severity });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, av, bl] = await Promise.all([
        salesApi.agenda.appointments(),
        salesApi.agenda.availability(),
        salesApi.agenda.blocks(),
      ]);
      setAppts({ items: asArray(a), upcoming: a?.upcoming || 0 });
      setAvailability(asArray(av));
      setBlocks(asArray(bl));
    } catch (e) {
      showSnack(e.message || 'No se pudo cargar la agenda', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <SalesPageHeader
        icon={EventAvailableOutlinedIcon}
        title="Agenda del comercial"
        subtitle="Reuniones con prospectos · el bot de WhatsApp agenda aquí automáticamente"
      />

      <Card sx={{ ...softCard, mt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #eee', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label={`Reuniones (${appts.upcoming})`} />
          <Tab label="Horario semanal" />
          <Tab label={`Bloqueos (${blocks.length})`} />
        </Tabs>

        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              {tab === 0 && <AgendaCalendarView appointments={appts.items} blocks={blocks} availability={availability} />}
              {tab === 1 && <HorarioTab availability={availability} setAvailability={setAvailability} showSnack={showSnack} />}
              {tab === 2 && <BloqueosTab blocks={blocks} reload={load} showSnack={showSnack} />}
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}

function HorarioTab({ availability, setAvailability, showSnack }) {
  const [rows, setRows] = useState(availability.map((r) => ({ ...r })));
  const [saving, setSaving] = useState(false);

  const update = (i, field, val) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: val } : r)));
  const removeRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));
  const addRow = () => setRows((rs) => [...rs, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', active: true }]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        dayOfWeek: Number(r.dayOfWeek), startTime: r.startTime, endTime: r.endTime, active: r.active !== false,
      }));
      const fresh = await salesApi.agenda.saveWeekly(payload);
      const arr = asArray(fresh) || payload;
      setAvailability(arr);
      setRows(arr.map((r) => ({ ...r })));
      showSnack('Horario guardado');
    } catch (e) {
      showSnack(e.message || 'No se pudo guardar', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define las franjas en que estás disponible para reuniones. El bot solo ofrece horarios dentro de estas franjas.
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Día</TableCell><TableCell>Desde</TableCell><TableCell>Hasta</TableCell><TableCell>Activo</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>
                <TextField select size="small" value={r.dayOfWeek} onChange={(e) => update(i, 'dayOfWeek', e.target.value)} sx={{ minWidth: 130 }}>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => <MenuItem key={d} value={d}>{DIAS[d]}</MenuItem>)}
                </TextField>
              </TableCell>
              <TableCell><TextField type="time" size="small" value={r.startTime} onChange={(e) => update(i, 'startTime', e.target.value)} /></TableCell>
              <TableCell><TextField type="time" size="small" value={r.endTime} onChange={(e) => update(i, 'endTime', e.target.value)} /></TableCell>
              <TableCell><Switch checked={r.active !== false} onChange={(e) => update(i, 'active', e.target.checked)} /></TableCell>
              <TableCell><IconButton size="small" onClick={() => removeRow(i)}><DeleteOutlineIcon fontSize="small" /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button startIcon={<AddIcon />} onClick={addRow} size="small">Agregar franja</Button>
        <Button variant="contained" onClick={save} disabled={saving} sx={{ ml: 'auto' }}>{saving ? 'Guardando…' : 'Guardar horario'}</Button>
      </Box>
    </Box>
  );
}

function BloqueosTab({ blocks, reload, showSnack }) {
  const [form, setForm] = useState({ startAt: '', endAt: '', motivo: '' });
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!form.startAt || !form.endAt) return showSnack('Indica inicio y fin', 'error');
    setSaving(true);
    try {
      await salesApi.agenda.createBlock({ startAt: form.startAt, endAt: form.endAt, motivo: form.motivo || null });
      setForm({ startAt: '', endAt: '', motivo: '' });
      await reload();
      showSnack('Bloqueo creado');
    } catch (e) {
      showSnack(e.message || 'No se pudo crear', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await salesApi.agenda.deleteBlock(id); await reload(); showSnack('Bloqueo eliminado'); }
    catch (e) { showSnack(e.message || 'Error', 'error'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
        <TextField label="Desde" type="datetime-local" size="small" InputLabelProps={{ shrink: true }} value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
        <TextField label="Hasta" type="datetime-local" size="small" InputLabelProps={{ shrink: true }} value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        <TextField label="Motivo (opcional)" size="small" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
        <Button variant="contained" onClick={create} disabled={saving}>Bloquear</Button>
      </Box>
      <Table size="small">
        <TableHead><TableRow><TableCell>Desde</TableCell><TableCell>Hasta</TableCell><TableCell>Motivo</TableCell><TableCell /></TableRow></TableHead>
        <TableBody>
          {blocks.length === 0 && <TableRow><TableCell colSpan={4}><Typography variant="body2" color="text.secondary">Sin bloqueos.</Typography></TableCell></TableRow>}
          {blocks.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.startAt ? new Date(b.startAt).toLocaleString('es-CO') : '—'}</TableCell>
              <TableCell>{b.endAt ? new Date(b.endAt).toLocaleString('es-CO') : '—'}</TableCell>
              <TableCell>{b.motivo || '—'}</TableCell>
              <TableCell><IconButton size="small" onClick={() => remove(b.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
