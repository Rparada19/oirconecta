/**
 * Marcas (IA) — panel para poblar/refrescar el contenido editorial de las
 * landings /audifonos/<slug>. Generado con Claude (sin scraping). El cron
 * mensual refresca solo; aquí se genera/regenera bajo demanda.
 */
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Stack, CircularProgress, Alert, Divider,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { adminFetch } from './adminAuth';

export default function AdminMarcasPage() {
  const [known, setKnown] = useState([]);
  const [byslug, setByslug] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // slug en generación
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // { slug, md }

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await adminFetch('/brands');
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error');
      setKnown(j.known || []);
      const map = {};
      (j.data || []).forEach((b) => { map[b.slug] = b; });
      setByslug(map);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const regenerar = async (slug) => {
    setBusy(slug); setError('');
    try {
      const r = await adminFetch(`/brands/${slug}/regenerate`, { method: 'POST' });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error');
      setByslug((m) => ({ ...m, [slug]: j.data }));
    } catch (e) { setError(`${slug}: ${e.message}`); }
    setBusy(null);
  };

  const regenerarTodas = async () => {
    for (const b of known) { await regenerar(b.slug); }
  };

  const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Marcas (IA)</Typography>
      <Typography sx={{ color: '#64748b', mb: 3 }}>
        Contenido editorial de cada landing de marca, generado con IA. Se refresca solo el día 1 de cada mes
        (si <code>BRAND_AUTO_ENABLED=true</code>). Aquí puedes generarlo o regenerarlo ahora.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="contained" startIcon={<AutoAwesomeOutlinedIcon />}
        onClick={regenerarTodas} disabled={!!busy || loading} sx={{ mb: 3 }}
      >
        {busy ? `Generando ${busy}…` : 'Generar / regenerar todas'}
      </Button>

      {loading ? <CircularProgress /> : (
        <Stack spacing={1.5}>
          {known.map((b) => {
            const rec = byslug[b.slug];
            return (
              <Paper key={b.slug} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {b.slug.replace('-', ' ')}
                    <Chip size="small" label={b.categoria} sx={{ ml: 1 }} />
                    {rec ? <Chip size="small" color="success" label="con contenido" sx={{ ml: 1 }} />
                         : <Chip size="small" color="default" label="vacío" sx={{ ml: 1 }} />}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Generado: {fecha(rec?.generatedAt)}
                  </Typography>
                </Box>
                {rec && (
                  <Button size="small" onClick={() => setPreview({ slug: b.slug, md: rec.contenidoMd })}>Ver</Button>
                )}
                <Button size="small" variant="outlined" onClick={() => regenerar(b.slug)} disabled={busy === b.slug}>
                  {busy === b.slug ? <CircularProgress size={16} /> : 'Regenerar'}
                </Button>
              </Paper>
            );
          })}
        </Stack>
      )}

      {preview && (
        <Paper variant="outlined" sx={{ p: 3, mt: 3, position: 'relative', whiteSpace: 'pre-wrap' }}>
          <Button size="small" onClick={() => setPreview(null)} sx={{ position: 'absolute', top: 8, right: 8 }}>Cerrar</Button>
          <Typography sx={{ fontWeight: 700, mb: 1, textTransform: 'capitalize' }}>{preview.slug}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography component="div" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#334155' }}>{preview.md}</Typography>
        </Paper>
      )}
    </Box>
  );
}
