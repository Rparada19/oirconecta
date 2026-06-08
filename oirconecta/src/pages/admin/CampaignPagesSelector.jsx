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

export default function CampaignPagesSelector({ value, onChange, actionType }) {
  const cfg = value || DEFAULT_VALUE;
  const [pageTypes, setPageTypes] = useState([]);
  const [registeredPaths, setRegisteredPaths] = useState(new Set());
  const [pathInput, setPathInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  // Forzar specific=['/'] para HOMEPAGE_TAKEOVER
  useEffect(() => {
    if (actionType === 'HOMEPAGE_TAKEOVER') {
      if (cfg.mode !== 'specific' || !cfg.specificPaths?.includes('/')) {
        onChange({ mode: 'specific', types: [], specificPaths: ['/'], excludePaths: [] });
      }
    }
    // eslint-disable-next-line
  }, [actionType]);

  useEffect(() => {
    adminFetch('/api/marketing/public/page-types').then((r) => {
      if (r?.data?.success) setPageTypes(r.data.data || []);
    });
    // Carga paths registrados para validar "ya no existe"
    adminFetch('/api/marketing/admin/pages?limit=2000').then((r) => {
      if (r?.data?.success) {
        const set = new Set((r.data.data.items || []).filter((p) => p.active).map((p) => p.path));
        setRegisteredPaths(set);
      }
    });
  }, []);

  // Bloqueo total para HOMEPAGE_TAKEOVER
  if (actionType === 'HOMEPAGE_TAKEOVER') {
    return (
      <Alert severity="info" sx={{ borderRadius: '8px' }}>
        <strong>Takeover de homepage:</strong> esta campaña ocupa exclusivamente la <code>/</code> (home).
        El selector queda bloqueado para garantizar la exclusividad del formato.
      </Alert>
    );
  }

  const showPopupWarning = actionType === 'POPUP_BIENVENIDA' && cfg.mode === 'all';
  const missingPaths = (cfg.specificPaths || []).filter((p) => registeredPaths.size > 0 && !registeredPaths.has(p));

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

      {showPopupWarning && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '6px' }}>
          El pop-up en <strong>todas las páginas</strong> puede afectar la experiencia. Considera limitarlo a la home o al directorio.
        </Alert>
      )}

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
            {(cfg.specificPaths || []).map((p) => {
              const missing = missingPaths.includes(p);
              return (
                <Chip key={p} label={missing ? `${p} (eliminada)` : p} size="small" onDelete={() => removePath(p)}
                  sx={{
                    bgcolor: missing ? '#fee2e2' : `${ACCENT}15`,
                    color: missing ? '#b91c1c' : NAVY,
                    fontFamily: 'monospace', fontSize: '0.7rem'
                  }} />
              );
            })}
          </Stack>
          {missingPaths.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: '6px', fontSize: '0.8125rem' }}>
              {missingPaths.length} página(s) ya no existe(n) en el portal. Quítalas o reemplázalas.
            </Alert>
          )}
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
