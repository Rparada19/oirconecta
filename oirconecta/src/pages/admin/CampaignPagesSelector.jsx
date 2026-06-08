/**
 * Selector "Páginas de publicación" con vista agrupada.
 * Sustituye el dropdown "Donde aparece" del config viejo.
 *
 * value (pagesConfig):
 *   { mode: 'all' | 'types' | 'specific',
 *     types: string[], specificPaths: string[], excludePaths: string[] }
 *
 * - "Todas las páginas" → mode='all'. Al activarlo, todos los demás
 *   checkboxes quedan deshabilitados visualmente.
 * - Selección por tipo → mode='types'. Checkboxes agrupados en categorías.
 *   Tipos con :param son "dinámicos" (aplican a páginas futuras).
 * - Conteos en vivo provienen de /admin/pages (PageRegistry).
 *
 * Reglas duras:
 *   - HOMEPAGE_TAKEOVER fuerza specific=['/'].
 *   - POPUP_BIENVENIDA + mode='all' → warning.
 *   - mode='specific' vacío → mensaje de validación.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, FormControlLabel, Checkbox, Stack, Chip, Alert, Button,
  TextField,
} from '@mui/material';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { adminFetch } from './adminAuth';

const ACCENT = '#085946';
const NAVY = '#272F50';

const DEFAULT_VALUE = { mode: 'all', types: [], specificPaths: [], excludePaths: [] };

// Agrupación de tipos por categoría
const GROUPS = [
  { title: 'Inicio y búsqueda', types: ['home', 'busqueda'] },
  { title: 'Directorio', types: ['directorio', 'directorio_profesion', 'directorio_ciudad', 'perfil_profesional'] },
  { title: 'Blog y contenido', types: ['blog_listado', 'blog_articulo', 'blog_categoria', 'blog_tag'] },
  { title: 'Audífonos e implantes', types: ['audifonos_listado', 'audifonos_marca', 'implantes_listado', 'implantes_marca'] },
  { title: 'Comparador', types: ['comparador', 'comparador_resultados'] },
  { title: 'Marketplace', types: ['marketplace', 'marketplace_producto'] },
  { title: 'Acciones', types: ['agendar', 'nosotros', 'servicios', 'contacto'] },
  { title: 'Otras', types: ['pagina_estatica'] },
];

// Tipos que son "dinámicos" — contienen :param en su pattern
const DYNAMIC_TYPES = new Set([
  'directorio_profesion', 'directorio_ciudad', 'perfil_profesional',
  'blog_articulo', 'blog_categoria', 'blog_tag',
  'audifonos_marca', 'implantes_marca', 'marketplace_producto',
]);

export default function CampaignPagesSelector({ value, onChange, actionType }) {
  const cfg = value || DEFAULT_VALUE;
  const [pageTypes, setPageTypes] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [registeredPaths, setRegisteredPaths] = useState(new Set());
  const [pathInput, setPathInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  // HOMEPAGE_TAKEOVER forzado a specific=['/']
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
    adminFetch('/api/marketing/admin/pages?limit=2000').then((r) => {
      if (r?.data?.success) {
        const items = r.data.data.items || [];
        setRegisteredPaths(new Set(items.filter((p) => p.active).map((p) => p.path)));
        setTypeCounts(r.data.data.byType || {});
      }
    });
    // Polling cada 60s para detectar páginas nuevas mientras el form está abierto
    const t = setInterval(() => {
      adminFetch('/api/marketing/admin/pages?limit=2000').then((r) => {
        if (r?.data?.success) {
          const items = r.data.data.items || [];
          setRegisteredPaths(new Set(items.filter((p) => p.active).map((p) => p.path)));
          setTypeCounts(r.data.data.byType || {});
        }
      });
    }, 60000);
    return () => clearInterval(t);
  }, []);

  if (actionType === 'HOMEPAGE_TAKEOVER') {
    return (
      <Alert severity="info" sx={{ borderRadius: '8px' }}>
        <strong>Takeover de homepage:</strong> esta campaña ocupa exclusivamente la <code>/</code> (home).
        Selector bloqueado para garantizar exclusividad.
      </Alert>
    );
  }

  const showPopupWarning = actionType === 'POPUP_BIENVENIDA' && cfg.mode === 'all';
  const missingPaths = (cfg.specificPaths || [])
    .filter((p) => registeredPaths.size > 0 && !registeredPaths.has(p));

  // Total de páginas seleccionadas (estimación)
  const selectedCount = useMemo(() => {
    if (cfg.mode === 'all') return registeredPaths.size || '∞';
    if (cfg.mode === 'specific') return (cfg.specificPaths || []).length;
    // mode='types' → suma de instancias por tipo + advertencia dinámicas
    let n = 0;
    (cfg.types || []).forEach((t) => { n += typeCounts[t] || 0; });
    return n;
  }, [cfg, typeCounts, registeredPaths]);

  const setAllMode = (checked) => {
    if (checked) onChange({ ...cfg, mode: 'all' });
    else onChange({ ...cfg, mode: 'types' });
  };

  const toggleType = (type) => {
    const set = new Set(cfg.types || []);
    if (set.has(type)) set.delete(type); else set.add(type);
    onChange({ ...cfg, mode: 'types', types: Array.from(set) });
  };

  const labelOf = (type) => pageTypes.find((t) => t.type === type)?.label || type;

  const addPath = (path, key = 'specificPaths') => {
    const clean = (path || '').trim();
    if (!clean) return;
    const list = cfg[key] || [];
    if (list.includes(clean)) return;
    onChange({ ...cfg, mode: key === 'specificPaths' ? 'specific' : cfg.mode, [key]: [...list, clean] });
  };
  const removePath = (path, key = 'specificPaths') => {
    onChange({ ...cfg, [key]: (cfg[key] || []).filter((p) => p !== path) });
  };

  // Detectar tipos nuevos no agrupados (que vengan del backend en el futuro)
  const groupedTypes = new Set(GROUPS.flatMap((g) => g.types));
  const extraTypes = pageTypes.filter((t) => !groupedTypes.has(t.type)).map((t) => t.type);

  return (
    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Páginas de publicación
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>
          Páginas seleccionadas: <strong style={{ color: ACCENT }}>{selectedCount}</strong>
        </Typography>
      </Stack>

      {showPopupWarning && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '6px', fontSize: '0.8125rem' }}>
          El pop-up en <strong>todas las páginas</strong> puede afectar la experiencia. Considera limitarlo.
        </Alert>
      )}

      <FormControlLabel
        sx={{ mb: 1 }}
        control={<Checkbox checked={cfg.mode === 'all'}
          onChange={(e) => setAllMode(e.target.checked)}
          sx={{ '&.Mui-checked': { color: ACCENT } }} />}
        label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
          Todas las páginas del sitio (actuales y futuras)
        </Typography>} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2,
        opacity: cfg.mode === 'all' ? 0.4 : 1, pointerEvents: cfg.mode === 'all' ? 'none' : 'auto' }}>
        {GROUPS.map((g) => (
          <Box key={g.title}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: NAVY, mb: 0.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {g.title}
            </Typography>
            <Stack spacing={0.25}>
              {g.types.map((t) => {
                const count = typeCounts[t] || 0;
                const checked = (cfg.types || []).includes(t);
                const dynamic = DYNAMIC_TYPES.has(t);
                return (
                  <FormControlLabel key={t}
                    sx={{ ml: 0, '& .MuiFormControlLabel-label': { width: '100%' } }}
                    control={<Checkbox size="small" checked={checked}
                      onChange={() => toggleType(t)}
                      sx={{ '&.Mui-checked': { color: ACCENT }, py: 0.25 }} />}
                    label={<Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.8125rem', flex: 1 }}>{labelOf(t)}</Typography>
                      {count > 0 && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>({count})</Typography>
                      )}
                      {dynamic && (
                        <Chip label="dinámica" size="small"
                          sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontSize: '0.6rem', height: 16, fontWeight: 700 }} />
                      )}
                    </Stack>} />
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

      {extraTypes.length > 0 && cfg.mode !== 'all' && (
        <Box sx={{ mt: 1.5, p: 1, borderRadius: '6px', bgcolor: '#fef3c7' }}>
          <Typography sx={{ fontSize: '0.7rem', color: '#a16207', fontWeight: 700 }}>
            Tipos nuevos detectados:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
            {extraTypes.map((t) => (
              <Chip key={t} label={labelOf(t)} size="small" clickable
                onClick={() => toggleType(t)}
                icon={<Chip label="nuevo" size="small" sx={{ height: 14, fontSize: '0.55rem', bgcolor: '#fbbf24', color: '#fff' }} />}
                sx={{ bgcolor: '#fff', fontSize: '0.7rem' }} />
            ))}
          </Stack>
        </Box>
      )}

      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 1.5, fontStyle: 'italic' }}>
        Los tipos marcados como <strong>dinámica</strong> también aplican a páginas de ese tipo que se creen en el futuro.
      </Typography>

      {/* Paths específicos extra (siempre disponibles aunque mode='types') */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 1 }}>
          Páginas específicas adicionales
        </Typography>
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
      </Box>

      {/* Excluir */}
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 1 }}>
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
