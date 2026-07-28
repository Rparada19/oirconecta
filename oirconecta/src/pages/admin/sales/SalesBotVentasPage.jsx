/**
 * Cerebro comercial editable del bot de captación (rama "Soy profesional").
 * El equipo edita el argumentario; el bot lo inyecta en su prompt para vender.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem, Switch,
  FormControlLabel, IconButton, Snackbar, Alert, CircularProgress, Divider,
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { salesApi } from '../../../services/salesApi';
import { SalesPageHeader, softCard } from './SalesShell';

const FIELDS = [
  { key: 'propuestaValor',     label: 'Propuesta de valor', help: '¿Por qué a un audiólogo le conviene estar en el directorio? Beneficios concretos.' },
  { key: 'diferenciadores',    label: 'Diferenciadores', help: '¿Por qué OírConecta y no otra opción?' },
  { key: 'planesPrecios',      label: 'Planes y precios', help: 'Qué ofreces y a cuánto (o "el ejecutivo lo presenta en la reunión").' },
  { key: 'objeciones',         label: 'Manejo de objeciones', help: 'Ej: "es caro", "no tengo tiempo", "ya tengo pacientes". Cómo responder.' },
  { key: 'tono',               label: 'Tono y estilo', help: 'Cómo debe sonar (cercano, experto, breve…).' },
  { key: 'instruccionesExtra', label: 'Instrucciones adicionales', help: 'Cualquier regla extra para el bot.' },
];

export default function SalesBotVentasPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(null);
  const showSnack = (message, severity = 'success') => setSnack({ message, severity });

  const load = useCallback(async () => {
    try {
      const cfg = await salesApi.captacionBot.get();
      setForm({ ...cfg, faqs: Array.isArray(cfg.faqs) ? cfg.faqs : [] });
    } catch (e) { showSnack(e.message || 'No se pudo cargar', 'error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFaq = (i, k, v) => setForm((f) => ({ ...f, faqs: f.faqs.map((q, j) => (j === i ? { ...q, [k]: v } : q)) }));
  const addFaq = () => setForm((f) => ({ ...f, faqs: [...f.faqs, { pregunta: '', respuesta: '' }] }));
  const removeFaq = (i) => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      await salesApi.captacionBot.save(form);
      showSnack('Guardado. El bot ya usa este argumentario.');
    } catch (e) { showSnack(e.message || 'No se pudo guardar', 'error'); }
    finally { setSaving(false); }
  };

  if (!form) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <SalesPageHeader
        icon={SmartToyOutlinedIcon}
        title="Bot de ventas · captación"
        subtitle="Edita el argumentario y el bot lo usa para cerrar con profesionales por WhatsApp"
        actions={<Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>}
      />

      <Card sx={{ ...softCard, mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={form.activo !== false} onChange={(e) => set('activo', e.target.checked)} />}
              label="Argumentario activo"
            />
            <TextField
              select size="small" label="Objetivo del bot" value={form.objetivoCierre || 'AGENDAR'}
              onChange={(e) => set('objetivoCierre', e.target.value)} sx={{ minWidth: 260 }}
            >
              <MenuItem value="AGENDAR">Agendar reunión con el ejecutivo</MenuItem>
              <MenuItem value="CERRAR_CHAT">Cerrar la venta en el chat si hay interés</MenuItem>
            </TextField>
          </Box>

          {FIELDS.map((f) => (
            <TextField
              key={f.key} label={f.label} helperText={f.help}
              value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)}
              fullWidth multiline minRows={2} sx={{ mb: 2.5 }}
            />
          ))}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Preguntas frecuentes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El bot responde con estas respuestas cuando le preguntan lo mismo.
          </Typography>
          {form.faqs.map((q, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start' }}>
              <TextField label="Pregunta" size="small" value={q.pregunta || ''} onChange={(e) => setFaq(i, 'pregunta', e.target.value)} sx={{ flex: '0 0 35%' }} />
              <TextField label="Respuesta" size="small" value={q.respuesta || ''} onChange={(e) => setFaq(i, 'respuesta', e.target.value)} fullWidth multiline />
              <IconButton size="small" onClick={() => removeFaq(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addFaq} size="small" sx={{ mt: 1 }}>Agregar pregunta</Button>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar argumentario'}</Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
