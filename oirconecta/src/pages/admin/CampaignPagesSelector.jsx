/**
 * Selector "¿Dónde publicar?" para campañas de marketing.
 *
 * Tres modos:
 *  - all: en todas las páginas (actuales y futuras)
 *  - types: por tipo de página (blog_articulo, perfil_profesional, etc.)
 *  - specific: paths exactos enumerados
 *
 * Almacena en `value` (campaign.pagesConfig) con forma:
 *   { mode, types: [], specificPaths: [], excludePaths: [] }
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, FormControlLabel, Radio, RadioGroup, Checkbox, FormGroup,
  TextField, Stack, Chip, Alert,
} from '@mui/material';
import { adminFetch } from './adminAuth';

const ACCENT = '#085946';
const NAVY = '#272F50';

const DEFAULT_VALUE = { mode: 'all', types: [], specificPaths: [], excludePaths: [] };

export default function CampaignPagesSelector({ value, onChange }) {
  const cfg = value || DEFAULT_VALUE;
  const [pageTypes, setPageTypes] = useState([]);
  const [pathInput, setPathInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  useEffect(() => {
    adminFetch('/api/marketing/public/page-types').then((r) => {
      if (r?.data?.success) setPageTypes(r.data.data || []);
    });
  }, []);

  const setMode = (mode) => onChange({ ...cfg, mode });
  const toggleType = (type) => {
    const set = new Set(cfg.types || []);
    if (set.has(type)) set.delete(type); else set.add(type);
    onChange({ ...cfg, types: Array.from(set) });
  };
  const addPath = (path, key = 'specificPaths') => {
    const clean = (path || '').trim();
    if (!clean) return;
    const list = cfg[key] || [];
    if (list.includes(clean)) return;
    onChange({ ...cfg, [key]: [...list, clean] });
  };
  const removePath = (path, key = 'specificPaths') => {
    onChange({ ...cfg, [key]: (cfg[key] || []).filter((p) => p !== path) });
  };

  return (
    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ¿Dónde publicar?
      </Typography>

      <RadioGroup value={cfg.mode || 'all'} onChange={(e) => setMode(e.target.value)}>
        <FormControlLabel value="all" control={<Radio size="small" sx={{ '&.Mui-checked': { color: ACCENT } }} />}
          label={<Typography sx={{ fontSize: '0.875rem' }}>
            <strong>Todas las páginas</strong> del portal (actuales y futuras)
          </Typography>} />
        <FormControlLabel value="types" control={<Radio size="small" sx={{ '&.Mui-checked': { color: ACCENT } }} />}
          label={<Typography sx={{ fontSize: '0.875rem' }}>
            <strong>Por tipo de página</strong> (ej. todos los artículos del blog)
          </Typography>} />
        <FormControlLabel value="specific" control={<Radio size="small" sx={{ '&.Mui-checked': { color: ACCENT } }} />}
          label={<Typography sx={{ fontSize: '0.875rem' }}>
            <strong>Páginas específicas</strong> (URLs exactas)
          </Typography>} />
      </RadioGroup>

      {cfg.mode === 'types' && (
        <Box sx={{ mt: 2, pl: 4 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 1, fontWeight: 700 }}>
            Tipos seleccionados ({(cfg.types || []).length})
          </Typography>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
            {pageTypes.map((pt) => (
              <FormControlLabel key={pt.type}
                control={<Checkbox size="small" checked={(cfg.types || []).includes(pt.type)}
                  onChange={() => toggleType(pt.type)}
                  sx={{ '&.Mui-checked': { color: ACCENT } }} />}
                label={<Typography sx={{ fontSize: '0.8125rem' }}>{pt.label}</Typography>} />
            ))}
          </FormGroup>
          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 1 }}>
            Aplica también a páginas de esos tipos que se creen en el futuro (ej: nuevos artículos del blog).
          </Typography>
        </Box>
      )}

      {cfg.mode === 'specific' && (
        <Box sx={{ mt: 2, pl: 4 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField size="small" placeholder="/blog/mi-articulo" fullWidth
              value={pathInput} onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addPath(pathInput); setPathInput(''); } }}
              InputProps={{ sx: { borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8125rem' } }} />
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {(cfg.specificPaths || []).map((p) => (
              <Chip key={p} label={p} size="small" onDelete={() => removePath(p)}
                sx={{ bgcolor: `${ACCENT}15`, color: NAVY, fontFamily: 'monospace', fontSize: '0.7rem' }} />
            ))}
          </Stack>
          {(cfg.specificPaths || []).length === 0 && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: '6px', fontSize: '0.8125rem' }}>
              Debes agregar al menos una página.
            </Alert>
          )}
        </Box>
      )}

      {/* Excluir paths (siempre disponible) */}
      <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 1, fontWeight: 700 }}>
          Excluir páginas (no mostrar aquí aunque encaje arriba)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField size="small" placeholder="/blog/articulo-excluido" fullWidth
            value={excludeInput} onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addPath(excludeInput, 'excludePaths'); setExcludeInput(''); } }}
            InputProps={{ sx: { borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8125rem' } }} />
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {(cfg.excludePaths || []).map((p) => (
            <Chip key={p} label={p} size="small" onDelete={() => removePath(p, 'excludePaths')}
              sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontFamily: 'monospace', fontSize: '0.7rem' }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
