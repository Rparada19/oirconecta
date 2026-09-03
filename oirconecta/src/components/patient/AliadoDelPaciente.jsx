/**
 * Selector del aliado referidor en la ficha del paciente.
 *
 * El QR no atrapa todos los casos: hay quien llega al consultorio con la
 * tarjeta del aliado en la mano sin haberla escaneado. Sin esto, ese paciente
 * nunca comisiona y el aliado no lo ve en su tabla.
 *
 * Guarda al instante — es un campo, no vale la pena un botón de guardar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, MenuItem, TextField, Alert } from '@mui/material';
import { api } from '../../services/apiClient';

export default function AliadoDelPaciente({ patientId, readOnly = false }) {
  const [aliados, setAliados] = useState([]);
  const [valor, setValor] = useState('');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!patientId) return;
    const [lista, ficha] = await Promise.all([
      api.get('/api/patients/meta/aliados'),
      api.get(`/api/patients/${patientId}`),
    ]);
    if (lista?.data?.success) setAliados(lista.data.data || []);
    if (ficha?.data?.success) setValor(ficha.data.data?.partnerId || '');
  }, [patientId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Sin aliados cargados no tiene sentido ocupar espacio en la ficha.
  if (!patientId || aliados.length === 0) return null;

  const cambiar = async (e) => {
    const nuevo = e.target.value;
    setValor(nuevo);
    setAviso(''); setError(''); setGuardando(true);
    const res = await api.patch(`/api/patients/${patientId}/aliado`, { partnerId: nuevo || null });
    setGuardando(false);
    if (res?.data?.success) {
      const n = res.data.data?.comisionadas || 0;
      setAviso(
        !nuevo
          ? 'Se quitó la atribución.'
          : n > 0
          ? `Atribuido. Se causaron ${n} comisión${n > 1 ? 'es' : ''} de ventas que ya tenía.`
          : 'Atribuido al aliado.',
      );
    } else {
      setError(res?.data?.error || res?.error || 'No se pudo guardar');
      cargar();
    }
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#86899C', display: 'block', mb: 0.5 }}>
        Aliado referidor
      </Typography>
      <TextField
        select fullWidth size="small" value={valor} onChange={cambiar}
        disabled={readOnly || guardando}
        helperText="Márcalo si llegó con la tarjeta de un aliado. De esto depende su comisión."
      >
        <MenuItem value=""><em>Sin aliado</em></MenuItem>
        {aliados.map((a) => (
          <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
        ))}
      </TextField>
      {aviso && <Alert severity="success" sx={{ mt: 1, py: 0 }}>{aviso}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{error}</Alert>}
    </Box>
  );
}
