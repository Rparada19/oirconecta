import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Save, Delete, ExpandMore, Edit, PostAdd, Category } from '@mui/icons-material';
import { getConfig, saveConfig } from '../../services/configService';
import {
  etiquetaProductoCatalogo,
  groupProductosPorMarcaCatalog,
  sortProductosPorMarcaCatalog,
  plataformaCatalogoKey,
  plataformaCatalogoLabel,
  plataformasKeysSorted,
  esProductoAccesorio,
} from '../../utils/marketplaceProduct';
import ProductoCatalogoForm from './ProductoCatalogoForm';

const MAX_FICHA_BYTES = 4 * 1024 * 1024;

/** Acordeones del catálogo: tarjetas suaves, sin “tubo” plano a todo el ancho. */
const catalogAccordionSx = {
  border: 'none',
  borderRadius: '20px',
  overflow: 'hidden',
  bgcolor: '#ffffff',
  boxShadow: '0 2px 14px rgba(39, 47, 80, 0.06), 0 1px 3px rgba(8, 89, 70, 0.04)',
  transition: 'box-shadow 0.22s ease, transform 0.2s ease',
  '&:before': { display: 'none' },
  '&.Mui-expanded': {
    boxShadow: '0 8px 28px rgba(39, 47, 80, 0.1), 0 2px 8px rgba(8, 89, 70, 0.06)',
  },
  '&:hover:not(.Mui-expanded)': {
    boxShadow: '0 4px 20px rgba(39, 47, 80, 0.08), 0 1px 4px rgba(8, 89, 70, 0.05)',
  },
};

const catalogSummarySx = {
  px: { xs: 2, sm: 2.5 },
  py: 1.25,
  minHeight: 58,
  background: 'linear-gradient(180deg, #ffffff 0%, #f6faf8 100%)',
  borderBottom: '1px solid rgba(8, 89, 70, 0.07)',
  '& .MuiAccordionSummary-content': {
    alignItems: 'center',
    gap: { xs: 1.25, sm: 2 },
    my: 1,
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    transition: 'transform 0.2s ease, color 0.2s ease',
    color: '#085946',
  },
  '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
    color: '#064a3a',
  },
};

const catalogDetailsSx = {
  px: { xs: 2, sm: 2.5 },
  pb: 2.5,
  pt: 2,
  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f4 100%)',
};

const countChipSx = {
  height: 26,
  fontWeight: 600,
  fontSize: '0.75rem',
  borderColor: 'rgba(8, 89, 70, 0.22)',
  bgcolor: 'rgba(255, 255, 255, 0.85)',
  color: '#0a5c49',
  '& .MuiChip-label': { px: 1.25 },
};

/** Evita que el texto largo desborde celdas y campos en rejilla flex. */
const fieldSx = {
  maxWidth: '100%',
  '& .MuiInputBase-root': { maxWidth: '100%' },
  '& .MuiInputBase-input': { overflowWrap: 'anywhere', wordBreak: 'break-word' },
  '& .MuiInputBase-inputMultiline': { overflowWrap: 'anywhere', wordBreak: 'break-word' },
};

function makeEmptyDraft() {
  return {
    id: `prod_${Date.now()}`,
    descripcion: '',
    fichasTecnicas: [],
    tecnologia: '',
    plataforma: '',
    marca: '',
    alimentacionAudifono: '',
    valor: null,
    imagenes: [],
    anosGarantia: null,
    proveedor: '',
    activo: true,
    tipoCatalogo: 'AUDIFONO',
  };
}

const ProductosPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [addExpanded, setAddExpanded] = useState(false);
  const [draft, setDraft] = useState(() => makeEmptyDraft());
  /** Por cada cajón de marca, qué botón de plataforma está seleccionado (clave interna). */
  const [plataformaPorMarca, setPlataformaPorMarca] = useState({});
  /** Solo una sección de marca abierta a la vez; al entrar ninguna desplegada. */
  const [expandedMarcaKey, setExpandedMarcaKey] = useState(null);
  /** Producto en edición (diálogo). */
  const [editProduct, setEditProduct] = useState(null);

  const gruposMarca = useMemo(
    () => groupProductosPorMarcaCatalog(config?.marketplace?.productos),
    [config?.marketplace?.productos],
  );

  useEffect(() => {
    if (expandedMarcaKey == null) return;
    const exists = gruposMarca.some((g) => g.key === expandedMarcaKey);
    if (!exists) setExpandedMarcaKey(null);
  }, [gruposMarca, expandedMarcaKey]);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  useEffect(() => {
    if (addExpanded) {
      setDraft(makeEmptyDraft());
    }
  }, [addExpanded]);

  const handleSaveCatalog = () => {
    const next = {
      ...config,
      marketplace: {
        ...config.marketplace,
        productos: sortProductosPorMarcaCatalog(config.marketplace?.productos),
      },
    };
    const res = saveConfig(next);
    if (res.success) setConfig(next);
    setSnackbar({
      open: true,
      message: res.success ? 'Catálogo guardado' : 'Error al guardar',
      severity: res.success ? 'success' : 'error',
    });
  };

  const handleSaveNewProduct = () => {
    const newProd = { ...draft, id: draft.id || `prod_${Date.now()}` };
    const merged = [...(config.marketplace?.productos || []), newProd];
    const next = {
      ...config,
      marketplace: {
        ...config.marketplace,
        productos: sortProductosPorMarcaCatalog(merged),
      },
    };
    const res = saveConfig(next);
    if (res.success) {
      setConfig(next);
      setAddExpanded(false);
      setSnackbar({ open: true, message: 'Producto guardado', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleSaveEditDialog = () => {
    if (!editProduct) return;
    const next = {
      ...config,
      marketplace: {
        ...config.marketplace,
        productos: sortProductosPorMarcaCatalog(
          (config.marketplace?.productos || []).map((p) => (p.id === editProduct.id ? editProduct : p)),
        ),
      },
    };
    const res = saveConfig(next);
    if (res.success) {
      setConfig(next);
      setEditProduct(null);
      setSnackbar({
        open: true,
        message: `Cambios guardados: ${etiquetaProductoCatalogo(editProduct)}`,
        severity: 'success',
      });
    } else {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  if (!config) {
    return (
      <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Cargando…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f4f2 0%, #f8fafc 100%)' }}>
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 60% at 5% 50%, rgba(13,122,92,0.38) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 80% at 95% 20%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(135deg, #063c2c 0%, #085946 40%, #1a2240 75%, #272F50 100%)',
        color: '#fff', pt: 4, pb: 4,
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5,
                borderRadius: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.80)' }}>CRM · CATÁLOGO</Typography>
              </Box>
              <Typography component="h1" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff' }}>
                Productos y{' '}
                <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Catálogo
                </Box>
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.68)', fontSize: '0.9375rem' }}>
                Catálogo para cotización y facturación vinculable a campañas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button startIcon={<ArrowBack />} onClick={() => navigate('/portal-crm')}
                sx={{ color: '#fff', fontWeight: 700, px: 2.5, py: 1.25, borderRadius: '12px',
                  border: '1.5px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)',
                  '&:hover': { background: 'rgba(255,255,255,0.18)' } }}>
                Portal
              </Button>
              <Button startIcon={<Save />} onClick={handleSaveCatalog}
                sx={{ color: '#085946', fontWeight: 700, px: 2.5, py: 1.25, borderRadius: '12px',
                  background: '#fff', '&:hover': { background: 'rgba(255,255,255,0.90)' } }}>
                Guardar todo
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          Use <strong>Agregar producto</strong> y elija si es <strong>audífono</strong> o <strong>accesorio</strong>. En cada marca verá pestañas por{' '}
          <strong>plataforma</strong> para audífonos y una pestaña <strong>Accesorios</strong> para ese tipo de ítems. Para editar un producto ya creado use{' '}
          <strong>Editar</strong>. Los servicios facturables siguen en <strong>Configuración</strong> → Marketplace.
        </Typography>
        <Card
          sx={{
            border: '1px solid rgba(8, 89, 70, 0.08)',
            borderRadius: 4,
            maxWidth: { xs: '100%', lg: 920 },
            mx: 'auto',
            width: '100%',
            overflow: 'visible',
            boxShadow: '0 8px 32px rgba(39, 47, 80, 0.06)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
            <Stack spacing={2}>
              <Accordion
              expanded={addExpanded}
              onChange={(_, expanded) => setAddExpanded(expanded)}
              disableGutters
              elevation={0}
              sx={catalogAccordionSx}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={catalogSummarySx}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'rgba(8, 89, 70, 0.12)',
                    color: '#085946',
                    borderRadius: '12px',
                  }}
                >
                  <PostAdd sx={{ fontSize: 22 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: '#085946', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                    Agregar producto
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    Nuevo ítem al catálogo CRM
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={catalogDetailsSx}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Complete los datos y pulse <strong>Guardar</strong> para añadir el producto al catálogo y guardarlo en este equipo.
                </Typography>
                <ProductoCatalogoForm
                  value={draft}
                  onChange={setDraft}
                  fieldSx={fieldSx}
                  maxFichaBytes={MAX_FICHA_BYTES}
                  setSnackbar={setSnackbar}
                />
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={(
                    <Switch
                      size="small"
                      checked={!!draft.activo}
                      onChange={(e) => setDraft((d) => ({ ...d, activo: e.target.checked }))}
                    />
                  )}
                  label="Activo en catálogo"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  <Button variant="outlined" onClick={() => setAddExpanded(false)}>
                    Cancelar
                  </Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveNewProduct} sx={{ bgcolor: '#085946' }}>
                    Guardar
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>

            {gruposMarca.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
                Aún no hay productos en el catálogo.
              </Typography>
            )}

            {gruposMarca.map(({ key: marcaKey, label: marcaLabel, items }) => {
              const plats = plataformasKeysSorted(items);
              const selectedRaw = plataformaPorMarca[marcaKey];
              const selectedPlat = plats.includes(selectedRaw) ? selectedRaw : plats[0];
              const visibles = items.filter((p) => plataformaCatalogoKey(p) === selectedPlat);
              const nAcc = items.filter(esProductoAccesorio).length;
              const nAud = items.length - nAcc;
              const chipLabel =
                nAcc > 0 && nAud > 0
                  ? `${nAud} aud. · ${nAcc} acc.`
                  : nAcc > 0
                    ? `${nAcc} accesorio${nAcc === 1 ? '' : 's'}`
                    : `${items.length} audífono${items.length === 1 ? '' : 's'}`;

              return (
                <Accordion
                  key={marcaKey}
                  expanded={expandedMarcaKey === marcaKey}
                  onChange={(_, expanded) => {
                    setExpandedMarcaKey(expanded ? marcaKey : null);
                  }}
                  disableGutters
                  elevation={0}
                  sx={catalogAccordionSx}
                >
                  <AccordionSummary expandIcon={<ExpandMore />} sx={catalogSummarySx}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(39, 47, 80, 0.08)',
                        color: '#272F50',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      {(marcaLabel || '?').slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#085946',
                        flex: 1,
                        minWidth: 0,
                        fontSize: '1rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {marcaLabel}
                    </Typography>
                    <Chip
                      label={chipLabel}
                      size="small"
                      variant="outlined"
                      sx={{ ...countChipSx, flexShrink: 0 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails sx={catalogDetailsSx}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 0.5 }}>
                      <Category sx={{ fontSize: 18, color: 'rgba(8, 89, 70, 0.45)', mt: 0.15 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.02em', display: 'block' }}>
                          Plataformas y accesorios
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', opacity: 0.92, mt: 0.25 }}>
                          Audífonos por plataforma; pestaña <strong>Accesorios</strong> para pilas, estuches, domótica, etc.
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {plats.map((pk) => (
                        <Button
                          key={pk}
                          size="small"
                          variant={selectedPlat === pk ? 'contained' : 'outlined'}
                          onClick={() => setPlataformaPorMarca((prev) => ({ ...prev, [marcaKey]: pk }))}
                          sx={{
                            textTransform: 'none',
                            ...(selectedPlat === pk ? { bgcolor: '#085946', color: '#fff', '&:hover': { bgcolor: '#064a3a' } } : {}),
                          }}
                        >
                          {plataformaCatalogoLabel(pk)}
                        </Button>
                      ))}
                    </Box>

                    {visibles.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay productos en esta plataforma.
                      </Typography>
                    ) : (
                      visibles.map((prod) => (
                        <Paper
                          key={prod.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            borderRadius: 2.5,
                            borderColor: 'rgba(8, 89, 70, 0.1)',
                            boxShadow: '0 1px 4px rgba(39, 47, 80, 0.04)',
                            '&:last-of-type': { mb: 0 },
                            bgcolor: '#fff',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                              gap: 1,
                              columnGap: 2,
                            }}
                          >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, minWidth: 0, flex: '1 1 160px' }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  minWidth: 0,
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere',
                                  pr: 0.5,
                                }}
                              >
                                {etiquetaProductoCatalogo(prod)}
                              </Typography>
                              <Chip
                                label={esProductoAccesorio(prod) ? 'Accesorio' : 'Audífono'}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  bgcolor: esProductoAccesorio(prod) ? 'rgba(39, 47, 80, 0.08)' : 'rgba(8, 89, 70, 0.1)',
                                  color: esProductoAccesorio(prod) ? '#272F50' : '#085946',
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0, ml: 'auto', flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => setEditProduct({ ...prod })}
                                sx={{ bgcolor: '#272F50' }}
                              >
                                Editar
                              </Button>
                              <FormControlLabel
                                control={(
                                  <Switch
                                    size="small"
                                    checked={!!prod.activo}
                                    onChange={(e) => {
                                      setConfig((prev) => {
                                        const prods = [...(prev.marketplace?.productos || [])];
                                        const idx = prods.findIndex((x) => x.id === prod.id);
                                        if (idx < 0) return prev;
                                        prods[idx] = { ...prods[idx], activo: e.target.checked };
                                        return { ...prev, marketplace: { ...prev.marketplace, productos: prods } };
                                      });
                                    }}
                                  />
                                )}
                                label="Activo"
                                sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', whiteSpace: 'nowrap' } }}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setConfig((prev) => ({
                                    ...prev,
                                    marketplace: {
                                      ...prev.marketplace,
                                      productos: (prev.marketplace?.productos || []).filter((x) => x.id !== prod.id),
                                    },
                                  }));
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={Boolean(editProduct)}
        onClose={() => setEditProduct(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ bgcolor: '#272F50', color: '#fff', fontWeight: 700 }}>Editar producto</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editProduct && (
            <>
              <ProductoCatalogoForm
                value={editProduct}
                onChange={setEditProduct}
                fieldSx={fieldSx}
                maxFichaBytes={MAX_FICHA_BYTES}
                setSnackbar={setSnackbar}
              />
              <FormControlLabel
                sx={{ mt: 2 }}
                control={(
                  <Switch
                    size="small"
                    checked={!!editProduct.activo}
                    onChange={(e) => setEditProduct((p) => ({ ...p, activo: e.target.checked }))}
                  />
                )}
                label="Activo en catálogo"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditProduct(null)}>Cancelar</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveEditDialog} sx={{ bgcolor: '#085946' }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductosPage;
