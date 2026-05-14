import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Delete, PictureAsPdf } from '@mui/icons-material';
import { MARCAS, ALIMENTACION_AUDIFONO } from '../../services/campaignService';
import {
  marcaProductoSelectValue,
  TIPO_CATALOGO_AUDIFONO,
  TIPO_CATALOGO_ACCESORIO,
  tipoCatalogoNorm,
} from '../../utils/marketplaceProduct';

/**
 * Formulario de un ítem del catálogo marketplace (config local).
 * @param {{ value: object, onChange: (next: object) => void, fieldSx?: object, maxFichaBytes: number, setSnackbar: (s: { open: boolean, message: string, severity: string }) => void }} props
 */
export default function ProductoCatalogoForm({ value: prod, onChange, fieldSx, maxFichaBytes, setSnackbar }) {
  const patch = (updates) => onChange({ ...prod, ...updates });
  const tipo = tipoCatalogoNorm(prod);
  const esAcc = tipo === TIPO_CATALOGO_ACCESORIO;

  return (
    <Grid container spacing={2} sx={{ width: '100%', '& > .MuiGrid-item': { minWidth: 0 } }}>
      <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
        <FormControl fullWidth size="small" sx={fieldSx}>
          <InputLabel>Tipo de producto</InputLabel>
          <Select
            label="Tipo de producto"
            value={tipo}
            onChange={(e) => {
              const t = e.target.value;
              patch({
                tipoCatalogo: t,
                ...(t === TIPO_CATALOGO_ACCESORIO ? { alimentacionAudifono: '' } : {}),
              });
            }}
          >
            <MenuItem value={TIPO_CATALOGO_AUDIFONO}>Audífono</MenuItem>
            <MenuItem value={TIPO_CATALOGO_ACCESORIO}>Accesorio</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
        <FormControl fullWidth size="small" sx={fieldSx}>
          <InputLabel>Marca</InputLabel>
          <Select
            label="Marca"
            value={marcaProductoSelectValue(prod.marca)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') patch({ marca: '' });
              else if (v === '__OTRA__') {
                const cur = (prod.marca || '').trim();
                patch({ marca: MARCAS.includes(cur) ? '' : cur });
              } else patch({ marca: v });
            }}
          >
            <MenuItem value="">
              <em>Sin marca</em>
            </MenuItem>
            {MARCAS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
            <MenuItem value="__OTRA__">Otra marca</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {marcaProductoSelectValue(prod.marca) === '__OTRA__' && (
        <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
          <TextField
            fullWidth
            size="small"
            label="Nombre de la marca"
            value={MARCAS.includes((prod.marca || '').trim()) ? '' : (prod.marca || '')}
            sx={fieldSx}
            onChange={(e) => patch({ marca: e.target.value })}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label={esAcc ? 'Referencia / modelo' : 'Tecnología'}
          value={prod.tecnologia || ''}
          sx={fieldSx}
          onChange={(e) => patch({ tecnologia: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label={esAcc ? 'Compatibilidad (opcional)' : 'Plataforma'}
          value={prod.plataforma || ''}
          sx={fieldSx}
          onChange={(e) => patch({ plataforma: e.target.value })}
          helperText={esAcc ? 'Los accesorios se listan en la pestaña «Accesorios» de la marca.' : undefined}
        />
      </Grid>
      {!esAcc && (
        <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Recargable / Batería</InputLabel>
            <Select
              label="Recargable / Batería"
              value={prod.alimentacionAudifono || ''}
              onChange={(e) => patch({ alimentacionAudifono: e.target.value || '' })}
              displayEmpty
            >
              <MenuItem value="">
                <em>Sin especificar</em>
              </MenuItem>
              {ALIMENTACION_AUDIFONO.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      <Grid item xs={12} sm={4} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Valor"
          value={prod.valor ?? ''}
          sx={fieldSx}
          onChange={(e) => patch({ valor: e.target.value ? Number(e.target.value) : null })}
        />
      </Grid>
      <Grid item xs={12} sm={4} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Años de garantía"
          value={prod.anosGarantia ?? ''}
          sx={fieldSx}
          onChange={(e) => patch({ anosGarantia: e.target.value ? Number(e.target.value) : null })}
        />
      </Grid>
      <Grid item xs={12} sm={4} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label="Proveedor"
          value={prod.proveedor || ''}
          sx={fieldSx}
          onChange={(e) => patch({ proveedor: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sx={{ minWidth: 0 }}>
        <TextField
          fullWidth
          size="small"
          label="Descripción"
          multiline
          rows={2}
          value={prod.descripcion || ''}
          sx={fieldSx}
          onChange={(e) => patch({ descripcion: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          Fichas técnicas (PDF o imagen, máx. 4 MB c/u)
        </Typography>
        <Button size="small" variant="outlined" component="label" sx={{ mr: 1 }}>
          Adjuntar ficha
          <input
            type="file"
            hidden
            accept="application/pdf,image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files?.length) return;
              const tasks = [];
              for (const file of Array.from(files)) {
                if (file.size > maxFichaBytes) {
                  setSnackbar({
                    open: true,
                    message: `Archivo demasiado grande: ${file.name} (máx. 4 MB)`,
                    severity: 'warning',
                  });
                  continue;
                }
                tasks.push(
                  new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = () => resolve({
                      id: `ft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                      nombre: file.name,
                      tipo: file.type || 'application/octet-stream',
                      data: r.result,
                    });
                    r.readAsDataURL(file);
                  }),
                );
              }
              Promise.all(tasks).then((items) => {
                patch({
                  fichasTecnicas: [...(prod.fichasTecnicas || []), ...items],
                });
              });
              e.target.value = '';
            }}
          />
        </Button>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {(prod.fichasTecnicas || []).map((ft, fi) => (
            <Chip
              key={ft.id || fi}
              size="small"
              icon={(ft.tipo || '').includes('pdf') ? <PictureAsPdf fontSize="small" /> : undefined}
              label={ft.nombre || 'Ficha'}
              onClick={() => {
                if (ft.data) window.open(ft.data, '_blank', 'noopener,noreferrer');
              }}
              onDelete={() => {
                patch({
                  fichasTecnicas: (prod.fichasTecnicas || []).filter((_, idx) => idx !== fi),
                });
              }}
              clickable={Boolean(ft.data)}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Imágenes</Typography>
        <Button size="small" variant="outlined" component="label">
          Cargar imagen
          <input
            type="file"
            hidden
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) {
                const readers = Array.from(files).map(
                  (f) => new Promise((res) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result);
                    r.readAsDataURL(f);
                  }),
                );
                Promise.all(readers).then((urls) => {
                  patch({ imagenes: [...(prod.imagenes || []), ...urls] });
                });
              }
            }}
          />
        </Button>
        {(prod.imagenes || []).length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {(prod.imagenes || []).map((img, ii) => (
              <Box key={ii} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={img}
                  alt=""
                  sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: '#fff',
                    '&:hover': { bgcolor: '#fff' },
                  }}
                  onClick={() => {
                    patch({
                      imagenes: (prod.imagenes || []).filter((_, idx) => idx !== ii),
                    });
                  }}
                >
                  <Delete fontSize="small" color="error" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
