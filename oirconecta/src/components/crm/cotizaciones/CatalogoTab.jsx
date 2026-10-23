/**
 * Catálogo de productos para cotizar: crear, editar, importar desde Excel
 * y relacionar cada producto con las campañas disponibles.
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Typography, Button, Chip, Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Autocomplete, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Alert,
} from '@mui/material';
import { Add, Edit, DeleteOutline, UploadFile, Download, Inventory2 } from '@mui/icons-material';
import { api } from '../../../services/apiClient';

const cop = (n) => `$ ${Math.round(n || 0).toLocaleString('es-CO')}`;
const ICONOS = ['onda', 'bateria', 'celular', 'bluetooth', 'ia', 'agua', 'chip', 'oido', 'enfoque', 'hoja', 'tv', 'ajustes', 'estuche', 'check'];

const vacio = {
  tipo: 'AUDIFONO', marca: 'Widex', nombre: '', tecnologia: '', plataforma: '', linea: '', sub: '', etiqueta: '',
  imagen: '', valor: 0, anosGarantia: 2, recargable: 'SI', atributosTxt: '', campaignIds: [],
};

const atributosATexto = (a) => (Array.isArray(a) ? a.map((x) => `${x.t}${x.d ? `: ${x.d}` : ''}`).join('\n') : '');
const textoAAtributos = (txt, prev = []) => String(txt || '').split(/\n|\|/).map((l) => l.trim()).filter(Boolean).slice(0, 6)
  .map((l, j) => {
    const [t, ...rest] = l.split(':');
    return { i: prev[j]?.i || ICONOS[j] || 'check', t: t.trim(), d: rest.join(':').trim() };
  });

/** Quita el fondo blanco, recorta y reduce la foto del producto. */
function prepImagen(file) {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onerror = rej;
    r.onload = () => {
      const im = new Image(); im.onerror = rej;
      im.onload = () => {
        const sc = Math.min(1, 520 / Math.max(im.width, im.height));
        const w = Math.round(im.width * sc); const h = Math.round(im.height * sc);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
        const id = x.getImageData(0, 0, w, h); const a = id.data;
        let minX = w; let minY = h; let maxX = 0; let maxY = 0;
        for (let i = 0; i < a.length; i += 4) {
          const m = Math.min(a[i], a[i + 1], a[i + 2]);
          a[i + 3] = Math.min(a[i + 3], Math.max(0, Math.min(255, ((255 - m) * 255) / 28)));
          if (a[i + 3] > 10) { const p = i / 4; const px = p % w; const py = (p / w) | 0; minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
        }
        x.putImageData(id, 0, 0);
        if (maxX <= minX || maxY <= minY) return res(c.toDataURL('image/png'));
        const c2 = document.createElement('canvas'); c2.width = maxX - minX + 1; c2.height = maxY - minY + 1;
        c2.getContext('2d').drawImage(c, minX, minY, c2.width, c2.height, 0, 0, c2.width, c2.height);
        res(c2.toDataURL('image/webp', 0.85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

const COLUMNAS = ['Marca', 'Nombre', 'Tecnología', 'Plataforma', 'Línea', 'Subtítulo', 'Etiqueta', 'Valor', 'Años garantía', 'Recargable', 'Atributos', 'Campañas'];

function descargarPlantilla(campanas) {
  const ejemplo = {
    Marca: 'Widex', Nombre: 'Widex Allure 330', 'Tecnología': '330', Plataforma: 'Allure', 'Línea': 'RIC R D · Chip W1',
    'Subtítulo': 'RIC R D · Plataforma 2025', Etiqueta: 'Lo más reciente', Valor: 9500000, 'Años garantía': 2, Recargable: 'SI',
    Atributos: 'Chip W1: Más velocidad y memoria | PureSound + ZeroDelay: Sonido natural',
    'Campañas': campanas[0]?.nombre || '',
  };
  const ws = XLSX.utils.json_to_sheet([ejemplo], { header: COLUMNAS });
  ws['!cols'] = COLUMNAS.map((c) => ({ wch: c === 'Atributos' ? 60 : 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
  if (campanas.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(campanas.map((c) => ({ 'Campañas disponibles': c.nombre, Descuento: `${c.descuentoAprobado}%` }))), 'Campañas');
  }
  XLSX.writeFile(wb, 'plantilla-catalogo-oirconecta.xlsx');
}

export default function CatalogoTab({ catalogo, onChanged, notify }) {
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importRes, setImportRes] = useState(null);
  const fileRef = useRef(null);
  const productos = catalogo?.productos || [];
  const campanas = catalogo?.campanas || [];

  const abrir = (p) => setEdit(p ? {
    ...vacio, ...p, atributosTxt: atributosATexto(p.atributos), campaignIds: (p.campanas || []).map((c) => c.id),
  } : { ...vacio });

  const guardar = async () => {
    if (!edit.marca.trim() || !edit.nombre.trim()) return notify('Marca y nombre son obligatorios.', 'warning');
    setSaving(true);
    const prevAtr = productos.find((p) => p.id === edit.id)?.atributos || [];
    const body = {
      tipo: edit.tipo, marca: edit.marca, nombre: edit.nombre, tecnologia: edit.tecnologia, plataforma: edit.plataforma,
      linea: edit.linea, sub: edit.sub, etiqueta: edit.etiqueta, imagen: edit.imagen || null, valor: Number(edit.valor) || 0,
      anosGarantia: Number(edit.anosGarantia) || 2, recargable: edit.recargable,
      atributos: textoAAtributos(edit.atributosTxt, prevAtr), campaignIds: edit.campaignIds,
    };
    const { error } = edit.id ? await api.put(`/api/crm/catalogo/${edit.id}`, body) : await api.post('/api/crm/catalogo', body);
    setSaving(false);
    if (error) return notify(`No se pudo guardar: ${error}`, 'error');
    notify(edit.id ? 'Producto actualizado.' : 'Producto creado.');
    setEdit(null); onChanged();
  };

  const quitar = async (p) => {
    const { error } = await api.delete(`/api/crm/catalogo/${p.id}`);
    if (error) return notify(`No se pudo quitar: ${error}`, 'error');
    notify('Producto retirado del catálogo.'); onChanged();
  };

  const importar = async (file) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const get = (r, ...keys) => { for (const k of keys) { const hit = Object.keys(r).find((x) => x.trim().toLowerCase() === k.toLowerCase()); if (hit && r[hit] !== '') return r[hit]; } return ''; };
      const filas = rows.map((r) => ({
        marca: String(get(r, 'Marca')).trim(), nombre: String(get(r, 'Nombre', 'Producto')).trim(),
        tecnologia: String(get(r, 'Tecnología', 'Tecnologia', 'Nivel')).trim() || null,
        plataforma: String(get(r, 'Plataforma')).trim() || null, linea: String(get(r, 'Línea', 'Linea')).trim() || null,
        sub: String(get(r, 'Subtítulo', 'Subtitulo')).trim() || null, etiqueta: String(get(r, 'Etiqueta')).trim() || null,
        valor: Number(String(get(r, 'Valor', 'Precio')).replace(/[^\d.]/g, '')) || 0,
        anosGarantia: Number(get(r, 'Años garantía', 'Anos garantia', 'Garantía')) || 2,
        recargable: String(get(r, 'Recargable') || 'SI').toUpperCase().startsWith('N') ? 'NO' : 'SI',
        atributos: textoAAtributos(get(r, 'Atributos')),
        campanas: String(get(r, 'Campañas', 'Campanas', 'Campaña')).split(';').map((x) => x.trim()).filter(Boolean),
      })).filter((f) => f.marca || f.nombre);
      if (!filas.length) return notify('El archivo no tiene filas con Marca y Nombre.', 'warning');
      const { data, error } = await api.post('/api/crm/catalogo/importar', { filas });
      if (error) return notify(`No se pudo importar: ${error}`, 'error');
      setImportRes(data.data); onChanged();
    } catch {
      notify('No se pudo leer el archivo. Usa la plantilla en Excel o CSV.', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Typography sx={{ color: '#64748b', fontSize: '0.88rem' }}>
          {productos.length} producto(s) · las campañas relacionadas definen el descuento al cotizar.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button size="small" startIcon={<Download />} onClick={() => descargarPlantilla(campanas)} sx={{ textTransform: 'none', fontWeight: 700 }}>Plantilla Excel</Button>
          <Button size="small" variant="outlined" startIcon={<UploadFile />} onClick={() => fileRef.current?.click()} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>Importar catálogo</Button>
          <input ref={fileRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files[0] && importar(e.target.files[0])} />
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => abrir(null)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>Nuevo producto</Button>
        </Stack>
      </Stack>

      {importRes && (
        <Alert severity={importRes.errores.length ? 'warning' : 'success'} onClose={() => setImportRes(null)} sx={{ mb: 2 }}>
          Importación lista: {importRes.creados} nuevo(s), {importRes.actualizados} actualizado(s)
          {importRes.errores.length ? ` · ${importRes.errores.length} fila(s) con error: ${importRes.errores.map((e) => `fila ${e.fila} (${e.error})`).join(', ')}` : ''}.
        </Alert>
      )}

      <Box sx={{ borderRadius: '16px', bgcolor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' } }}>
                <TableCell>Producto</TableCell><TableCell>Tecnología</TableCell><TableCell align="right">Valor unitario</TableCell>
                <TableCell>Campañas</TableCell><TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                  <Inventory2 sx={{ display: 'block', mx: 'auto', mb: 1 }} />Aún no hay productos. Crea uno o importa tu catálogo en Excel.
                </TableCell></TableRow>
              ) : productos.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {p.imagen ? <Box component="img" src={p.imagen} alt="" sx={{ maxWidth: 38, maxHeight: 38, objectFit: 'contain' }} /> : <Inventory2 sx={{ color: '#94a3b8', fontSize: 20 }} />}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.nombre}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{p.marca}{p.etiqueta ? ` · ${p.etiqueta}` : ''}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem' }}>{[p.plataforma, p.tecnologia].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{cop(p.valor)}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                      {p.campanas.length === 0 ? <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sin campaña</Typography>
                        : p.campanas.map((c) => (
                          <Chip key={c.id} size="small" label={`${c.nombre} · ${c.descuentoAprobado}%`}
                            sx={{ fontSize: '0.72rem', fontWeight: 700, bgcolor: c.vigente ? 'rgba(64,84,178,0.10)' : '#f1f5f9', color: c.vigente ? '#4054B2' : '#94a3b8' }} />
                        ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => abrir(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Retirar del catálogo"><IconButton size="small" onClick={() => quitar(p)}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={Boolean(edit)} onClose={() => setEdit(null)} fullWidth maxWidth="md">
        {edit && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{edit.id ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ height: 150, borderRadius: '12px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', mb: 1 }}>
                    {edit.imagen ? <Box component="img" src={edit.imagen} alt="" sx={{ maxWidth: '85%', maxHeight: 130, objectFit: 'contain' }} />
                      : <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', px: 2, textAlign: 'center' }}>Sin foto</Typography>}
                  </Box>
                  <Button component="label" fullWidth size="small" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Subir foto
                    <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                      const f = e.target.files[0]; if (!f) return;
                      try { const url = await prepImagen(f); setEdit((x) => ({ ...x, imagen: url })); } catch { notify('No se pudo leer esa imagen. Usa JPG o PNG.', 'error'); }
                    }} />
                  </Button>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>El fondo blanco se quita solo.</Typography>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Marca" value={edit.marca} onChange={(e) => setEdit({ ...edit, marca: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={8}><TextField fullWidth size="small" label="Nombre del producto" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} /></Grid>
                    <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="Plataforma" value={edit.plataforma || ''} onChange={(e) => setEdit({ ...edit, plataforma: e.target.value })} /></Grid>
                    <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="Tecnología" value={edit.tecnologia || ''} onChange={(e) => setEdit({ ...edit, tecnologia: e.target.value })} /></Grid>
                    <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Valor unitario" value={edit.valor} onChange={(e) => setEdit({ ...edit, valor: e.target.value })} /></Grid>
                    <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Años garantía" value={edit.anosGarantia} onChange={(e) => setEdit({ ...edit, anosGarantia: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Línea (portada)" value={edit.linea || ''} onChange={(e) => setEdit({ ...edit, linea: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Subtítulo" value={edit.sub || ''} onChange={(e) => setEdit({ ...edit, sub: e.target.value })} /></Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Etiqueta" value={edit.etiqueta || ''} onChange={(e) => setEdit({ ...edit, etiqueta: e.target.value })} /></Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline minRows={3} label="Atributos (uno por línea, «Título: descripción», máx. 6)"
                    value={edit.atributosTxt} onChange={(e) => setEdit({ ...edit, atributosTxt: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete multiple options={campanas} getOptionLabel={(c) => `${c.nombre} · ${c.descuentoAprobado}%${c.vigente ? '' : ' (no vigente)'}`}
                    value={campanas.filter((c) => edit.campaignIds.includes(c.id))} isOptionEqualToValue={(a, b) => a.id === b.id}
                    onChange={(_, v) => setEdit({ ...edit, campaignIds: v.map((c) => c.id) })}
                    renderInput={(params) => <TextField {...params} size="small" label="Campañas en las que aplica" placeholder="Elige campañas" />} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEdit(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
              <Button variant="contained" onClick={guardar} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export { ICONOS };
