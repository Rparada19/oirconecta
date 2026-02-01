import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Divider,
  IconButton,
  Chip,
  Paper,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Save, Close, Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { recordSale } from '../../services/productService';
import { getCampaigns, MARCAS } from '../../services/campaignService';

const TIPOS_ACCESORIO = [
  'Baterías',
  'Olivas',
  'Kit de mantenimiento',
  'Estuche',
  'Limpiador',
  'Otro',
];

const formatDateRange = (start, end) => {
  if (!start || !end) return '—';
  try {
    const f = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${f(start)} - ${f(end)}`;
  } catch {
    return `${start} - ${end}`;
  }
};

const SaleDialog = ({ open, onClose, patientEmail, onSuccess, patientData }) => {
  const [tipoVenta, setTipoVenta] = useState('audifonos'); // 'consulta' | 'accesorio' | 'audifonos'
  const [campaigns, setCampaigns] = useState([]);
  const [errors, setErrors] = useState({});

  // Consulta
  const [consulta, setConsulta] = useState({ descripcion: '', valor: 0, fecha: new Date().toISOString().split('T')[0], notas: '' });

  // Accesorios (varios ítems por venta)
  const [accesoriosItems, setAccesoriosItems] = useState([]);
  const [nuevoAccesorio, setNuevoAccesorio] = useState({
    tipo: 'Baterías',
    nombreOtro: '',
    cantidad: 1,
    valorUnitario: 0,
    descuento: 0,
  });
  const [accesoriosNotas, setAccesoriosNotas] = useState('');

  // Audífonos (misma estructura que cotización)
  const [audifonos, setAudifonos] = useState({
    brand: '',
    quantity: 1,
    technology: '',
    platform: '',
    rechargeable: 'NO',
    campaignId: '',
    warrantyYears: 1,
    seguroPerdidaRobo: 'NO',
    seguroRotura: 'NO',
    unitPrice: 0,
    notes: '',
    adaptationDate: '',
    warrantyEndDate: '',
    firstControlDate: '',
    firstMaintenanceDate: '',
    facturarConsulta: false,
    valorConsulta: 0,
    descripcionConsulta: '',
    patientName: '',
    patientEmail: '',
    patientPhone: '',
  });
  const [images, setImages] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [newAccessory, setNewAccessory] = useState({ name: '', price: 0 });

  useEffect(() => {
    if (open) getCampaigns().then(setCampaigns);
  }, [open]);

  useEffect(() => {
    if (open && patientData) {
      const nombre = patientData.nombre || patientData.patientName || '';
      const email = patientEmail || patientData.email || patientData.patientEmail || '';
      const telefono = patientData.telefono || patientData.patientPhone || '';
      setAudifonos((prev) => ({ ...prev, patientName: nombre, patientEmail: email, patientPhone: telefono }));
    }
  }, [open, patientData, patientEmail]);

  const campaignsByBrand = audifonos.brand ? campaigns.filter((c) => (c.fabricante || '').trim() === audifonos.brand) : [];
  const selectedCampaign = campaigns.find((c) => String(c.id) === String(audifonos.campaignId));
  const discountAud = selectedCampaign ? (selectedCampaign.descuentoAprobado ?? 0) : 0;
  const subtotalAud = audifonos.unitPrice * audifonos.quantity;
  const valuePerUnitAud = audifonos.unitPrice > 0 ? audifonos.unitPrice * (1 - discountAud / 100) : 0;
  const totalAudifonos = valuePerUnitAud * audifonos.quantity;
  const accessoriesTotal = accessories.reduce((s, a) => s + (a.price || 0), 0);
  const totalAudifonosConExtras = totalAudifonos + (audifonos.facturarConsulta ? audifonos.valorConsulta : 0) + accessoriesTotal;

  const subtotalNuevoAcc = (() => {
    const sub = nuevoAccesorio.cantidad * nuevoAccesorio.valorUnitario;
    return sub - (sub * nuevoAccesorio.descuento) / 100;
  })();

  const totalAccesorios = accesoriosItems.reduce((sum, it) => sum + (it.subtotal || 0), 0);

  const handleChangeAudifonos = (field) => (e) => {
    const v = e.target.value;
    setAudifonos((prev) => {
      const next = { ...prev, [field]: ['quantity', 'unitPrice', 'warrantyYears', 'valorConsulta'].includes(field) ? (parseFloat(v) || (field === 'warrantyYears' ? 1 : 0)) : v };
      if (field === 'brand') {
        const cur = campaigns.find((c) => String(c.id) === String(prev.campaignId));
        if (cur && (cur.fabricante || '').trim() !== v) next.campaignId = '';
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, { id: Date.now() + Math.random(), file, preview: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const handleRemoveImage = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

  const handleAddAccessory = () => {
    if (!newAccessory.name.trim() || newAccessory.price <= 0) return;
    setAccessories((prev) => [...prev, { id: Date.now(), ...newAccessory }]);
    setNewAccessory({ name: '', price: 0 });
  };
  const handleDeleteAccessory = (id) => setAccessories((prev) => prev.filter((a) => a.id !== id));

  const handleAddAccesorioItem = () => {
    if (nuevoAccesorio.tipo === 'Otro' && !nuevoAccesorio.nombreOtro?.trim()) return;
    if (nuevoAccesorio.cantidad <= 0 || nuevoAccesorio.valorUnitario <= 0) return;
    const sub = nuevoAccesorio.cantidad * nuevoAccesorio.valorUnitario;
    const subtotal = sub - (sub * nuevoAccesorio.descuento) / 100;
    const nombre = nuevoAccesorio.tipo === 'Otro' ? nuevoAccesorio.nombreOtro.trim() : nuevoAccesorio.tipo;
    setAccesoriosItems((prev) => [...prev, {
      id: Date.now(),
      tipo: nuevoAccesorio.tipo,
      nombre,
      cantidad: nuevoAccesorio.cantidad,
      valorUnitario: nuevoAccesorio.valorUnitario,
      descuento: nuevoAccesorio.descuento,
      subtotal,
    }]);
    setNuevoAccesorio({ tipo: 'Baterías', nombreOtro: '', cantidad: 1, valorUnitario: 0, descuento: 0 });
    setErrors((prev) => ({ ...prev, accesorioItem: '' }));
  };
  const handleDeleteAccesorioItem = (id) => setAccesoriosItems((prev) => prev.filter((a) => a.id !== id));

  const validate = () => {
    const e = {};
    if (tipoVenta === 'consulta') {
      if (!consulta.descripcion?.trim()) e.descripcion = 'La descripción es obligatoria';
      if (consulta.valor <= 0) e.valor = 'El valor debe ser mayor a 0';
    } else if (tipoVenta === 'accesorio') {
      if (accesoriosItems.length === 0) e.accesorioItem = 'Agregue al menos un accesorio';
    } else {
      if (!audifonos.brand?.trim()) e.brand = 'La marca es obligatoria';
      if (!audifonos.technology?.trim()) e.technology = 'La tecnología es obligatoria';
      if (!audifonos.platform?.trim()) e.platform = 'La plataforma es obligatoria';
      if (audifonos.unitPrice <= 0) e.unitPrice = 'El valor unitario debe ser mayor a 0';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    const email = audifonos.patientEmail || patientEmail || patientData?.email || '';
    if (!email?.trim()) {
      alert('No se encontró el email del paciente. Verifica que el perfil tenga un email válido.');
      return;
    }
    if (!validate()) return;

    const saleDate = new Date().toISOString().split('T')[0];

    if (tipoVenta === 'consulta') {
      const result = await recordSale(email, {
        productName: 'Consulta',
        brand: '',
        model: consulta.descripcion || '',
        category: 'service',
        quantity: 1,
        unitPrice: consulta.valor,
        totalPrice: consulta.valor,
        discount: 0,
        saleDate: consulta.fecha || saleDate,
        notes: consulta.notas || '',
        metadata: {
          descripcionConsulta: consulta.descripcion,
          fechaConsulta: consulta.fecha,
          patientName: audifonos.patientName,
          patientEmail: email,
          patientPhone: audifonos.patientPhone,
        },
      });
      if (result.success) {
        onSuccess?.(result.product);
        handleClose();
      } else alert('Error al guardar la venta: ' + (result.error || 'Error desconocido'));
      return;
    }

    if (tipoVenta === 'accesorio') {
      const result = await recordSale(email, {
        productName: accesoriosItems.length === 1 ? accesoriosItems[0].nombre : 'Accesorios',
        brand: '',
        model: accesoriosItems.map((it) => it.nombre).join(', '),
        category: 'accessory',
        quantity: accesoriosItems.reduce((s, it) => s + it.cantidad, 0),
        unitPrice: 0,
        totalPrice: totalAccesorios,
        discount: 0,
        saleDate,
        notes: accesoriosNotas || '',
        metadata: {
          accesoriosItems: accesoriosItems.map(({ id, ...r }) => r),
          patientName: audifonos.patientName,
          patientEmail: email,
          patientPhone: audifonos.patientPhone,
        },
      });
      if (result.success) {
        onSuccess?.(result.product);
        handleClose();
      } else alert('Error al guardar la venta: ' + (result.error || 'Error desconocido'));
      return;
    }

    // Audífonos
    const warrantyStart = audifonos.adaptationDate || saleDate;
    const we = audifonos.warrantyEndDate || (warrantyStart ? (() => {
      const d = new Date(warrantyStart);
      d.setFullYear(d.getFullYear() + audifonos.warrantyYears);
      return d.toISOString().split('T')[0];
    })() : null);

    const imageData = images.map((img) => ({ name: img.name, data: img.preview, type: img.file.type }));

    const result = await recordSale(email, {
      productName: audifonos.brand,
      brand: audifonos.brand,
      model: `${audifonos.technology} - ${audifonos.platform}`,
      category: 'hearing-aid',
      quantity: audifonos.quantity,
      unitPrice: audifonos.unitPrice,
      totalPrice: totalAudifonosConExtras,
      discount: discountAud,
      saleDate,
      adaptationDate: audifonos.adaptationDate || null,
      warrantyStartDate: warrantyStart || null,
      warrantyEndDate: we || null,
      notes: audifonos.notes || '',
      metadata: {
        technology: audifonos.technology,
        platform: audifonos.platform,
        warrantyYears: audifonos.warrantyYears,
        rechargeable: audifonos.rechargeable,
        seguroPerdidaRobo: audifonos.seguroPerdidaRobo,
        seguroRotura: audifonos.seguroRotura,
        campaignId: audifonos.campaignId || null,
        campaignNombre: selectedCampaign?.nombre || '',
        fabricante: selectedCampaign?.fabricante || '',
        campaignVigencia: selectedCampaign?.fechaInicio && selectedCampaign?.fechaFin ? `${selectedCampaign.fechaInicio} - ${selectedCampaign.fechaFin}` : '',
        images: imageData,
        firstControlDate: audifonos.firstControlDate || null,
        firstMaintenanceDate: audifonos.firstMaintenanceDate || null,
        accessories,
        valorConsulta: audifonos.facturarConsulta ? audifonos.valorConsulta : null,
        descripcionConsulta: audifonos.facturarConsulta ? audifonos.descripcionConsulta : '',
        patientName: audifonos.patientName,
        patientEmail: email,
        patientPhone: audifonos.patientPhone,
      },
    });

    if (result.success) {
      onSuccess?.(result.product);
      handleClose();
    } else alert('Error al guardar la venta: ' + (result.error || 'Error desconocido'));
  };

  const handleClose = () => {
    setTipoVenta('audifonos');
    setConsulta({ descripcion: '', valor: 0, fecha: new Date().toISOString().split('T')[0], notas: '' });
    setAccesoriosItems([]);
    setNuevoAccesorio({ tipo: 'Baterías', nombreOtro: '', cantidad: 1, valorUnitario: 0, descuento: 0 });
    setAccesoriosNotas('');
    setAudifonos((prev) => ({
      brand: '',
      quantity: 1,
      technology: '',
      platform: '',
      rechargeable: 'NO',
      campaignId: '',
      warrantyYears: 1,
      seguroPerdidaRobo: 'NO',
      seguroRotura: 'NO',
      unitPrice: 0,
      notes: '',
      adaptationDate: '',
      warrantyEndDate: '',
      firstControlDate: '',
      firstMaintenanceDate: '',
      facturarConsulta: false,
      valorConsulta: 0,
      descripcionConsulta: '',
      patientName: prev.patientName,
      patientEmail: prev.patientEmail,
      patientPhone: prev.patientPhone,
    }));
    setImages([]);
    setAccessories([]);
    setNewAccessory({ name: '', price: 0 });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
        Nueva Venta
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de venta</InputLabel>
              <Select
                value={tipoVenta}
                label="Tipo de venta"
                onChange={(e) => setTipoVenta(e.target.value)}
              >
                <MenuItem value="consulta">Consulta</MenuItem>
                <MenuItem value="accesorio">Accesorio</MenuItem>
                <MenuItem value="audifonos">Audífonos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* --- CONSULTA --- */}
          {tipoVenta === 'consulta' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mb: 1 }}>
                  Facturar consulta
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción / Motivo"
                  multiline
                  rows={2}
                  value={consulta.descripcion}
                  onChange={(e) => setConsulta((c) => ({ ...c, descripcion: e.target.value }))}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor consulta"
                  type="number"
                  value={consulta.valor || ''}
                  onChange={(e) => setConsulta((c) => ({ ...c, valor: parseFloat(e.target.value) || 0 }))}
                  error={!!errors.valor}
                  helperText={errors.valor}
                  required
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha"
                  type="date"
                  value={consulta.fecha}
                  onChange={(e) => setConsulta((c) => ({ ...c, fecha: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={2}
                  value={consulta.notas}
                  onChange={(e) => setConsulta((c) => ({ ...c, notas: e.target.value }))}
                />
              </Grid>
            </>
          )}

          {/* --- ACCESORIOS (varios) --- */}
          {tipoVenta === 'accesorio' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mb: 1 }}>
                  Facturar accesorios
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de accesorio</InputLabel>
                  <Select
                    value={nuevoAccesorio.tipo}
                    label="Tipo de accesorio"
                    onChange={(e) => setNuevoAccesorio((a) => ({ ...a, tipo: e.target.value }))}
                  >
                    {TIPOS_ACCESORIO.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {nuevoAccesorio.tipo === 'Otro' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre del accesorio"
                    value={nuevoAccesorio.nombreOtro}
                    onChange={(e) => setNuevoAccesorio((a) => ({ ...a, nombreOtro: e.target.value }))}
                    placeholder="Ej. Pilas recargables"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={nuevoAccesorio.cantidad}
                  onChange={(e) => setNuevoAccesorio((a) => ({ ...a, cantidad: parseInt(e.target.value, 10) || 1 }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Valor unitario"
                  type="number"
                  value={nuevoAccesorio.valorUnitario || ''}
                  onChange={(e) => setNuevoAccesorio((a) => ({ ...a, valorUnitario: parseFloat(e.target.value) || 0 }))}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Descuento (%)"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={nuevoAccesorio.descuento}
                  onChange={(e) => setNuevoAccesorio((a) => ({ ...a, descuento: parseFloat(e.target.value) || 0 }))}
                  InputProps={{ endAdornment: <Typography sx={{ ml: 1 }}>%</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="caption" sx={{ color: '#86899C' }}>Subtotal</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>${subtotalNuevoAcc.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddAccesorioItem}
                  fullWidth
                  disabled={
                    (nuevoAccesorio.tipo === 'Otro' && !nuevoAccesorio.nombreOtro?.trim()) ||
                    nuevoAccesorio.cantidad <= 0 ||
                    nuevoAccesorio.valorUnitario <= 0
                  }
                >
                  Agregar
                </Button>
              </Grid>
              {errors.accesorioItem && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="error">{errors.accesorioItem}</Typography>
                </Grid>
              )}
              {accesoriosItems.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: '#272F50', mb: 1 }}>Accesorios agregados ({accesoriosItems.length})</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {accesoriosItems.map((it) => (
                      <Paper key={it.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{it.nombre}</Typography>
                          <Typography variant="caption" sx={{ color: '#86899C' }}>
                            {it.cantidad} × ${it.valorUnitario?.toLocaleString()}
                            {it.descuento > 0 && ` − ${it.descuento}%`} = ${it.subtotal?.toLocaleString()}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleDeleteAccesorioItem(it.id)} sx={{ color: '#c62828' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ color: '#86899C', mb: 0.5 }}>Valor total accesorios</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#085946' }}>${totalAccesorios.toLocaleString()}</Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={2}
                  value={accesoriosNotas}
                  onChange={(e) => setAccesoriosNotas(e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* --- AUDÍFONOS (misma estructura que cotización + facturar consulta + accesorios) --- */}
          {tipoVenta === 'audifonos' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 1, mb: 1 }}>
                  Producto ofertado
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Marca</InputLabel>
                  <Select value={audifonos.brand} label="Marca" onChange={handleChangeAudifonos('brand')} error={!!errors.brand}>
                    {MARCAS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                  {errors.brand && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{errors.brand}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Número de audífonos</InputLabel>
                  <Select value={audifonos.quantity} label="Número de audífonos" onChange={handleChangeAudifonos('quantity')}>
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Tecnología" value={audifonos.technology} onChange={handleChangeAudifonos('technology')} error={!!errors.technology} helperText={errors.technology} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Plataforma" value={audifonos.platform} onChange={handleChangeAudifonos('platform')} error={!!errors.platform} helperText={errors.platform} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Recargable</InputLabel>
                  <Select value={audifonos.rechargeable} label="Recargable" onChange={handleChangeAudifonos('rechargeable')}>
                    <MenuItem value="SI">Sí</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Información de marketing</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Campaña de marketing</InputLabel>
                  <Select value={audifonos.campaignId} label="Campaña de marketing" onChange={handleChangeAudifonos('campaignId')} disabled={!audifonos.brand}>
                    <MenuItem value=""><em>{audifonos.brand ? 'Ninguna' : 'Seleccione primero una marca'}</em></MenuItem>
                    {campaignsByBrand.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedCampaign && (
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Nombre de la campaña" value={selectedCampaign.nombre} InputProps={{ readOnly: true }} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Fabricante" value={selectedCampaign.fabricante || '—'} InputProps={{ readOnly: true }} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Fecha de vigencia" value={formatDateRange(selectedCampaign.fechaInicio, selectedCampaign.fechaFin)} InputProps={{ readOnly: true }} size="small" />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Información de producto</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Años de garantía</InputLabel>
                  <Select value={audifonos.warrantyYears} label="Años de garantía" onChange={handleChangeAudifonos('warrantyYears')}>
                    <MenuItem value={1}>1 año</MenuItem>
                    <MenuItem value={2}>2 años</MenuItem>
                    <MenuItem value={3}>3 años</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Seguro pérdida o robo</InputLabel>
                  <Select value={audifonos.seguroPerdidaRobo} label="Seguro pérdida o robo" onChange={handleChangeAudifonos('seguroPerdidaRobo')}>
                    <MenuItem value="SI">Sí</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Seguro por rotura</InputLabel>
                  <Select value={audifonos.seguroRotura} label="Seguro por rotura" onChange={handleChangeAudifonos('seguroRotura')}>
                    <MenuItem value="SI">Sí</MenuItem>
                    <MenuItem value="NO">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#86899C', mb: 1 }}>Imágenes del producto</Typography>
                <input accept="image/*" style={{ display: 'none' }} id="sale-image-upload" multiple type="file" onChange={handleImageUpload} />
                <label htmlFor="sale-image-upload">
                  <Button variant="outlined" component="span" startIcon={<ImageIcon />} fullWidth sx={{ mb: 1 }}>Agregar imágenes</Button>
                </label>
                {images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {images.map((img) => (
                      <Paper key={img.id} sx={{ position: 'relative', width: 100, height: 100, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                        <img src={img.preview} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" onClick={() => handleRemoveImage(img.id)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Cotización (audífonos)</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor unitario"
                  type="number"
                  value={audifonos.unitPrice || ''}
                  onChange={handleChangeAudifonos('unitPrice')}
                  error={!!errors.unitPrice}
                  helperText={errors.unitPrice}
                  required
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Descuento aprobado (%)" value={selectedCampaign ? discountAud : 0} InputProps={{ readOnly: true, endAdornment: <Typography sx={{ ml: 1 }}>%</Typography> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Valor por unidad" value={valuePerUnitAud > 0 ? valuePerUnitAud.toLocaleString() : '0'} InputProps={{ readOnly: true, startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Valor total audífonos" value={totalAudifonos > 0 ? totalAudifonos.toLocaleString() : '0'} InputProps={{ readOnly: true, startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Facturación adicional</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={audifonos.facturarConsulta}
                      onChange={(e) => setAudifonos((a) => ({ ...a, facturarConsulta: e.target.checked }))}
                    />
                  }
                  label="Facturar consulta"
                />
              </Grid>
              {audifonos.facturarConsulta && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Valor consulta"
                      type="number"
                      value={audifonos.valorConsulta || ''}
                      onChange={handleChangeAudifonos('valorConsulta')}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Descripción consulta"
                      value={audifonos.descripcionConsulta}
                      onChange={handleChangeAudifonos('descripcionConsulta')}
                      placeholder="Ej. Evaluación, control, etc."
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#86899C', mb: 1 }}>Accesorios (baterías, olivas, kit, etc.)</Typography>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={5}>
                    <TextField fullWidth label="Nombre" value={newAccessory.name} onChange={(e) => setNewAccessory((a) => ({ ...a, name: e.target.value }))} placeholder="Ej. Baterías, Olivas, Kit mantenimiento" />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Precio" type="number" value={newAccessory.price || ''} onChange={(e) => setNewAccessory((a) => ({ ...a, price: parseFloat(e.target.value) || 0 }))} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddAccessory} fullWidth disabled={!newAccessory.name.trim() || newAccessory.price <= 0}>Agregar</Button>
                  </Grid>
                </Grid>
                {accessories.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {accessories.map((acc) => (
                      <Chip key={acc.id} label={`${acc.name} - $${(acc.price || 0).toLocaleString()}`} onDelete={() => handleDeleteAccessory(acc.id)} sx={{ mr: 1, mb: 1 }} color="primary" />
                    ))}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" sx={{ color: '#86899C', mb: 0.5 }}>Valor total (audífonos + consulta + accesorios)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#085946' }}>${totalAudifonosConExtras.toLocaleString()}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Fechas</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha de adaptación" type="date" value={audifonos.adaptationDate} onChange={handleChangeAudifonos('adaptationDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha finalización garantía" type="date" value={audifonos.warrantyEndDate} onChange={handleChangeAudifonos('warrantyEndDate')} InputLabelProps={{ shrink: true }} helperText="Opcional: si no se ingresa, se calcula por años de garantía" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha primer control" type="date" value={audifonos.firstControlDate} onChange={handleChangeAudifonos('firstControlDate')} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha primer mantenimiento" type="date" value={audifonos.firstMaintenanceDate} onChange={handleChangeAudifonos('firstMaintenanceDate')} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>Comentarios</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} placeholder="Comentarios adicionales..." value={audifonos.notes} onChange={handleChangeAudifonos('notes')} />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined" startIcon={<Close />}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<Save />} sx={{ bgcolor: '#085946' }}>Guardar venta</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleDialog;
