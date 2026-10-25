/**
 * Carga masiva del catálogo: se arrastran fotos y fichas técnicas sueltas
 * (JPG, PNG o PDF). Cada archivo se analiza (¿foto o ficha?, ¿de qué
 * producto?), se agrupa por producto y se muestra una revisión antes de
 * guardar, donde se corrige lo necesario y se ponen los precios.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  Dialog, Box, Typography, Button, IconButton, Stack, Chip, TextField, LinearProgress, Checkbox,
  Tooltip, MenuItem, Alert,
} from '@mui/material';
import { Close, CloudUpload, Star, StarBorder, DeleteOutline, Description, AddPhotoAlternate } from '@mui/icons-material';
import { api } from '../../../services/apiClient';
import { prepImagen, dataUrlABlob } from '../../../utils/imagenProducto';

const ACEPTA = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const CONCURRENCIA = 3;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const claveDe = (p) => norm(p?.nombre || [p?.marca, p?.plataforma, p?.tecnologia].filter(Boolean).join(' '));
const cop = (n) => `$ ${Math.round(n || 0).toLocaleString('es-CO')}`;

export default function CargaMasivaDialog({ open, onClose, onSaved, catalogo, notify }) {
  const [items, setItems] = useState([]); // { id, file, preview, estado, res, error }
  const [grupos, setGrupos] = useState(null); // revisión
  const [sueltas, setSueltas] = useState([]); // fotos sin producto
  const [guardando, setGuardando] = useState(null); // { hechos, total }
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);
  const productos = catalogo?.productos || [];

  const pendientes = items.filter((i) => i.estado === 'pendiente' || i.estado === 'analizando').length;
  const listos = items.filter((i) => i.estado === 'listo').length;

  const reset = () => { setItems([]); setGrupos(null); setSueltas([]); setGuardando(null); };
  const cerrar = () => { if (guardando) return; reset(); onClose(); };

  const analizarCola = async (nuevos) => {
    const cola = [...nuevos];
    const trabajar = async () => {
      while (cola.length) {
        const it = cola.shift();
        setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, estado: 'analizando' } : x)));
        const fd = new FormData(); fd.append('file', it.file);
        const { data, error } = await api.upload('/api/crm/catalogo/analizar', fd);
        setItems((xs) => xs.map((x) => (x.id === it.id
          ? (error ? { ...x, estado: 'error', error } : { ...x, estado: 'listo', res: data.data })
          : x)));
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCIA }, trabajar));
  };

  const agregarArchivos = (files) => {
    const validos = [...files].filter((f) => ACEPTA.includes(f.type));
    if (validos.length < files.length) notify('Se omitieron archivos que no son JPG, PNG, WEBP o PDF.', 'warning');
    if (!validos.length) return;
    const nuevos = validos.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null, estado: 'pendiente',
    }));
    setItems((xs) => [...xs, ...nuevos]);
    setGrupos(null);
    analizarCola(nuevos);
  };

  /** Arma un grupo por producto con lo que se leyó de cada archivo. */
  const armarRevision = () => {
    const mapa = new Map();
    const sinProducto = [];
    const porNombre = new Map(productos.map((p) => [norm(p.nombre), p]));
    const asegurar = (clave, p) => {
      if (!mapa.has(clave)) {
        const existente = porNombre.get(clave);
        mapa.set(clave, {
          clave, incluir: true, existenteId: existente?.id || null, existenteNombre: existente?.nombre || null,
          marca: p.marca || existente?.marca || '', nombre: p.nombre || existente?.nombre || '', plataforma: p.plataforma || '',
          tecnologia: p.tecnologia || '', linea: '', sub: '', etiqueta: '', recargable: 'SI', atributos: [],
          valor: existente?.valor || '', fotos: [], fichas: [],
        });
      }
      return mapa.get(clave);
    };
    // Primero las fichas: traen los datos completos del producto.
    for (const it of items.filter((i) => i.estado === 'listo' && i.res.tipo === 'ficha')) {
      const p = it.res.producto || {};
      const g = asegurar(claveDe(p) || norm(it.file.name.replace(/\.[^.]+$/, '')), p);
      for (const k of ['marca', 'nombre', 'plataforma', 'tecnologia', 'linea', 'sub', 'etiqueta', 'recargable']) if (!g[k] && p[k]) g[k] = p[k];
      if (!g.atributos.length && p.atributos?.length) g.atributos = p.atributos;
      if (it.res.ficha) g.fichas.push(it.res.ficha);
    }
    for (const it of items.filter((i) => i.estado === 'listo' && i.res.tipo === 'foto')) {
      const p = it.res.producto || {};
      const clave = claveDe(p);
      if (!clave) { sinProducto.push(it.id); continue; }
      // Si la foto dice solo la familia ("Allure"), se une al grupo que la contenga.
      const destino = mapa.has(clave) ? clave : [...mapa.keys()].find((k) => k.includes(clave) || clave.includes(k));
      const g = destino ? mapa.get(destino) : asegurar(clave, p);
      g.fotos.push({ itemId: it.id, principal: g.fotos.length === 0, color: it.res.color });
    }
    setGrupos([...mapa.values()]);
    setSueltas(sinProducto);
  };

  const setG = (i, k, v) => setGrupos((gs) => gs.map((g, j) => (j === i ? { ...g, [k]: v } : g)));
  const itemPorId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const asignarSuelta = (itemId, destino) => {
    setSueltas((xs) => xs.filter((x) => x !== itemId));
    if (destino === '__nuevo') {
      setGrupos((gs) => [...gs, { clave: `nuevo-${itemId}`, incluir: true, existenteId: null, marca: '', nombre: '', plataforma: '', tecnologia: '', linea: '', sub: '', etiqueta: '', recargable: 'SI', atributos: [], valor: '', fotos: [{ itemId, principal: true }], fichas: [] }]);
    } else {
      setGrupos((gs) => gs.map((g) => (g.clave === destino ? { ...g, fotos: [...g.fotos, { itemId, principal: g.fotos.length === 0 }] } : g)));
    }
  };

  const guardar = async () => {
    const elegidos = grupos.filter((g) => g.incluir);
    if (elegidos.some((g) => !g.marca.trim() || !g.nombre.trim())) return notify('Cada producto necesita marca y nombre.', 'warning');
    const totalFotos = elegidos.reduce((s, g) => s + g.fotos.length, 0);
    setGuardando({ hechos: 0, total: totalFotos + 1 });
    const payload = [];
    for (const g of elegidos) {
      const fotos = [];
      for (const f of g.fotos) {
        try {
          const it = itemPorId.get(f.itemId);
          const dataUrl = await prepImagen(it.file);
          const fd = new FormData(); fd.append('file', await dataUrlABlob(dataUrl), `${norm(g.nombre) || 'foto'}.webp`);
          const { data, error } = await api.upload('/api/crm/catalogo/foto', fd);
          if (!error) fotos.push({ url: data.data.url, principal: f.principal, color: f.color || '' });
        } catch { /* una foto que no se procesa no detiene el resto */ }
        setGuardando((x) => ({ ...x, hechos: x.hechos + 1 }));
      }
      payload.push({
        existenteId: g.existenteId || undefined, marca: g.marca, nombre: g.nombre, plataforma: g.plataforma, tecnologia: g.tecnologia,
        linea: g.linea, sub: g.sub, etiqueta: g.etiqueta, recargable: g.recargable, atributos: g.atributos,
        valor: Number(String(g.valor).replace(/[^\d]/g, '')) || 0, fotos, fichas: g.fichas,
      });
    }
    const { data, error } = await api.post('/api/crm/catalogo/lote', { items: payload });
    setGuardando(null);
    if (error) return notify(`No se pudo guardar: ${error}`, 'error');
    const r = data.data;
    notify(`Catálogo actualizado: ${r.creados} nuevo(s), ${r.actualizados} actualizado(s)${r.errores.length ? `, ${r.errores.length} con error` : ''}.`, r.errores.length ? 'warning' : 'success');
    reset(); onSaved();
  };

  return (
    <Dialog open={open} onClose={cerrar} fullScreen>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8fafc' }}>
        <Box sx={{ px: 3, py: 2, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Carga masiva del catálogo</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
              {grupos ? 'Revisa cada producto, completa los precios y guarda.' : 'Arrastra fotos y fichas técnicas sueltas. Se clasifican y se agrupan por producto.'}
            </Typography>
          </Box>
          <IconButton onClick={cerrar} aria-label="Cerrar" disabled={Boolean(guardando)}><Close /></IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {!grupos && (
            <>
              <Box
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); agregarArchivos(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                sx={{
                  border: `2px dashed ${arrastrando ? '#4054B2' : '#cbd5e1'}`, borderRadius: '16px', bgcolor: arrastrando ? 'rgba(64,84,178,0.06)' : '#fff',
                  p: 5, textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
                }}>
                <CloudUpload sx={{ fontSize: 44, color: '#4054B2' }} />
                <Typography sx={{ fontWeight: 800, mt: 1 }}>Arrastra aquí las fotos y fichas técnicas</Typography>
                <Typography sx={{ fontSize: '0.84rem', color: '#64748b' }}>JPG, PNG, WEBP o PDF · hasta 15 MB cada uno · pueden ir mezclados y sueltos</Typography>
                <input ref={inputRef} hidden type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ''; }} />
              </Box>

              {items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{listos} de {items.length} archivos analizados</Typography>
                    {pendientes > 0 && <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>Analizando…</Typography>}
                  </Stack>
                  <LinearProgress variant="determinate" value={(items.filter((i) => ['listo', 'error'].includes(i.estado)).length / items.length) * 100} sx={{ mb: 2, borderRadius: 4, height: 6 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
                    {items.map((it) => (
                      <Box key={it.id} sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', p: 1, opacity: it.estado === 'pendiente' ? 0.55 : 1 }}>
                        <Box sx={{ height: 90, borderRadius: '8px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', overflow: 'hidden', mb: 0.75 }}>
                          {it.preview ? <Box component="img" src={it.preview} alt="" sx={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }} /> : <Description sx={{ color: '#94a3b8', fontSize: 34 }} />}
                        </Box>
                        <Typography noWrap sx={{ fontSize: '0.72rem', color: '#64748b' }}>{it.file.name}</Typography>
                        {it.estado === 'listo' ? (
                          <>
                            <Chip size="small" label={it.res.tipo === 'ficha' ? 'Ficha técnica' : it.res.tipo === 'foto' ? 'Foto' : 'No reconocido'}
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.5, bgcolor: it.res.tipo === 'ficha' ? 'rgba(124,58,237,0.12)' : it.res.tipo === 'foto' ? 'rgba(64,84,178,0.12)' : '#f1f5f9' }} />
                            <Typography noWrap sx={{ fontSize: '0.74rem', fontWeight: 700, mt: 0.25 }}>{it.res.producto?.nombre || it.res.producto?.plataforma || 'Producto sin identificar'}</Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: '0.72rem', color: it.estado === 'error' ? '#dc2626' : '#94a3b8', mt: 0.5 }}>
                            {it.estado === 'error' ? `Error: ${it.error}` : it.estado === 'analizando' ? 'Analizando…' : 'En cola'}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {grupos && (
            <Stack spacing={1.5}>
              {grupos.length === 0 && <Alert severity="info">No se reconoció ningún producto. Asigna las fotos manualmente abajo.</Alert>}
              {grupos.map((g, i) => (
                <Box key={g.clave} sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', p: 2, opacity: g.incluir ? 1 : 0.5 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ minWidth: { md: 280 }, flexWrap: 'wrap', rowGap: 1 }}>
                      {g.fotos.length === 0 && (
                        <Box sx={{ width: 84, height: 84, borderRadius: '10px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center' }}>
                          <AddPhotoAlternate sx={{ color: '#94a3b8' }} />
                        </Box>
                      )}
                      {g.fotos.map((f, k) => (
                        <Box key={f.itemId} sx={{ position: 'relative', width: 84, height: 84, borderRadius: '10px', bgcolor: '#f1f5fb', border: f.principal ? '2px solid #4054B2' : '1px solid #e5e7eb', overflow: 'hidden' }}>
                          <Box component="img" src={itemPorId.get(f.itemId)?.preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <IconButton size="small" onClick={() => setG(i, 'fotos', g.fotos.map((x, j) => ({ ...x, principal: j === k })))}
                            sx={{ position: 'absolute', left: 2, top: 2, p: 0.25, bgcolor: 'rgba(255,255,255,.85)' }} aria-label="Foto principal">
                            {f.principal ? <Star sx={{ fontSize: 16, color: '#f59e0b' }} /> : <StarBorder sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <IconButton size="small" onClick={() => {
                            const resto = g.fotos.filter((_, j) => j !== k);
                            if (f.principal && resto[0]) resto[0] = { ...resto[0], principal: true };
                            setG(i, 'fotos', resto);
                          }} sx={{ position: 'absolute', right: 2, top: 2, p: 0.25, bgcolor: 'rgba(255,255,255,.85)' }} aria-label="Quitar foto">
                            <DeleteOutline sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mb: 1.25 }}>
                        <TextField size="small" label="Marca" value={g.marca} onChange={(e) => setG(i, 'marca', e.target.value)} sx={{ width: { sm: 140 } }} />
                        <TextField size="small" label="Nombre del producto" value={g.nombre} onChange={(e) => setG(i, 'nombre', e.target.value)} sx={{ flex: 1 }} />
                        <TextField size="small" label="Tecnología" value={g.tecnologia} onChange={(e) => setG(i, 'tecnologia', e.target.value)} sx={{ width: { sm: 110 } }} />
                        <TextField size="small" label="Valor unitario" value={g.valor} placeholder="Ej. 8314000" onChange={(e) => setG(i, 'valor', e.target.value)}
                          sx={{ width: { sm: 150 } }} helperText={Number(String(g.valor).replace(/[^\d]/g, '')) ? cop(Number(String(g.valor).replace(/[^\d]/g, ''))) : ''} />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }} alignItems="center">
                        {g.existenteId
                          ? <Chip size="small" color="info" label={`Se suma a «${g.existenteNombre}»`} />
                          : <Chip size="small" label="Producto nuevo" />}
                        {g.fichas.map((f) => <Chip key={f.nombre} size="small" icon={<Description />} label={f.nombre} />)}
                        {g.atributos.length > 0 && <Chip size="small" variant="outlined" label={`${g.atributos.length} atributos leídos`} />}
                        {g.fichas.length === 0 && <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8' }}>Sin ficha técnica</Typography>}
                        <Box sx={{ flex: 1 }} />
                        <Tooltip title={g.incluir ? 'Se guardará' : 'No se guardará'}>
                          <Stack direction="row" alignItems="center">
                            <Checkbox size="small" checked={g.incluir} onChange={(e) => setG(i, 'incluir', e.target.checked)} />
                            <Typography sx={{ fontSize: '0.8rem' }}>Guardar</Typography>
                          </Stack>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              ))}

              {sueltas.length > 0 && (
                <Box sx={{ bgcolor: '#fff', border: '1px dashed #f59e0b', borderRadius: '14px', p: 2 }}>
                  <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Fotos sin producto ({sueltas.length})</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 1.5 }}>No se pudo saber de qué modelo son. Indica a cuál producto pertenecen.</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 1.5 }}>
                    {sueltas.map((id) => (
                      <Box key={id}>
                        <Box sx={{ height: 100, borderRadius: '10px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', mb: 0.75, overflow: 'hidden' }}>
                          <Box component="img" src={itemPorId.get(id)?.preview} alt="" sx={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }} />
                        </Box>
                        <TextField select fullWidth size="small" label="Producto" value="" onChange={(e) => asignarSuelta(id, e.target.value)}>
                          {grupos.map((g) => <MenuItem key={g.clave} value={g.clave}>{g.nombre || g.clave}</MenuItem>)}
                          <MenuItem value="__nuevo">Producto nuevo…</MenuItem>
                        </TextField>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </Box>

        <Box sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {guardando ? (
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.84rem', mb: 0.5 }}>Procesando fotos y guardando… {guardando.hechos}/{guardando.total}</Typography>
              <LinearProgress variant="determinate" value={(guardando.hechos / guardando.total) * 100} sx={{ borderRadius: 4, height: 6 }} />
            </Box>
          ) : grupos ? (
            <>
              <Button onClick={() => setGrupos(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Volver a los archivos</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={guardar} disabled={!grupos.some((g) => g.incluir)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                Guardar {grupos.filter((g) => g.incluir).length} producto(s)
              </Button>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b', flex: 1 }}>
                {items.length ? `${items.filter((i) => i.res?.tipo === 'ficha').length} ficha(s) · ${items.filter((i) => i.res?.tipo === 'foto').length} foto(s)` : 'Aún no hay archivos.'}
              </Typography>
              <Button variant="contained" onClick={armarRevision} disabled={!listos || pendientes > 0}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                {pendientes > 0 ? 'Analizando…' : 'Revisar productos'}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
