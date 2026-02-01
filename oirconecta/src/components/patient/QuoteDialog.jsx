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
  Paper,
} from '@mui/material';
import { Save, Close, Delete, Image as ImageIcon } from '@mui/icons-material';
import { createQuote, updateQuote } from '../../services/productService';
import { getCampaigns, MARCAS } from '../../services/campaignService';

const QuoteDialog = ({ open, onClose, patientEmail, onSuccess, patientData, quoteId, editQuote }) => {
  const isEdit = Boolean(quoteId && editQuote);
  const [campaigns, setCampaigns] = useState([]);
  const [formData, setFormData] = useState({
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
    patientName: '',
    patientEmail: '',
    patientPhone: '',
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    getCampaigns().then(setCampaigns);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editQuote) {
      const md = editQuote.metadata || {};
      setFormData({
        brand: editQuote.brand || editQuote.productName || '',
        quantity: editQuote.quantity ?? 1,
        technology: md.technology || editQuote.model?.split(' - ')[0] || '',
        platform: md.platform || editQuote.model?.split(' - ')[1] || '',
        rechargeable: (md.rechargeable || 'NO').toUpperCase().slice(0, 2),
        campaignId: md.campaignId || '',
        warrantyYears: md.warrantyYears ?? 1,
        seguroPerdidaRobo: (md.seguroPerdidaRobo || 'NO').toUpperCase().slice(0, 2),
        seguroRotura: (md.seguroRotura || 'NO').toUpperCase().slice(0, 2),
        unitPrice: editQuote.unitPrice ?? 0,
        notes: editQuote.notes || '',
        patientName: patientData?.nombre || patientData?.patientName || '',
        patientEmail: patientEmail || patientData?.email || editQuote.patientEmail || '',
        patientPhone: patientData?.telefono || patientData?.patientPhone || '',
      });
      setImages(md.images?.map((img, i) => ({ id: i, file: {}, preview: img.data || img, name: img.name || `img-${i}` })) || []);
    } else {
      const emailToSet = patientEmail || patientData?.email || '';
      const nameToSet = patientData?.nombre || patientData?.patientName || '';
      const phoneToSet = patientData?.telefono || patientData?.patientPhone || '';
      if (nameToSet || emailToSet || phoneToSet) {
        setFormData((prev) => ({
          ...prev,
          patientName: nameToSet,
          patientEmail: emailToSet,
          patientPhone: phoneToSet,
        }));
      }
    }
  }, [open, patientData, patientEmail, isEdit, editQuote]);

  const campaignsByBrand = formData.brand
    ? campaigns.filter((c) => (c.fabricante || '').trim() === formData.brand)
    : [];
  const selectedCampaign = campaigns.find((c) => String(c.id) === String(formData.campaignId));
  const discount = selectedCampaign ? (selectedCampaign.descuentoAprobado ?? 0) : 0;
  const subtotal = formData.unitPrice * formData.quantity;
  const discountAmount = (subtotal * discount) / 100;
  const valuePerUnit = formData.unitPrice > 0 ? formData.unitPrice * (1 - discount / 100) : 0;
  const totalValue = valuePerUnit * formData.quantity;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]:
          field === 'quantity' || field === 'unitPrice' || field === 'warrantyYears'
            ? (parseFloat(value) || (field === 'warrantyYears' ? 1 : 0))
            : value,
      };
      if (field === 'brand') {
        const currentCampaign = campaigns.find((c) => String(c.id) === String(prev.campaignId));
        if (currentCampaign && (currentCampaign.fabricante || '').trim() !== value) {
          next.campaignId = '';
        }
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
        setImages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), file, preview: reader.result, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

  const validate = () => {
    const e = {};
    if (!formData.brand?.trim()) e.brand = 'La marca es obligatoria';
    if (!formData.technology?.trim()) e.technology = 'La tecnología es obligatoria';
    if (!formData.platform?.trim()) e.platform = 'La plataforma es obligatoria';
    if (formData.unitPrice <= 0) e.unitPrice = 'El valor unitario debe ser mayor a 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    const emailToUse = formData.patientEmail || patientEmail || patientData?.email || '';
    if (!isEdit && !emailToUse?.trim()) {
      alert('Error: No se encontró el email del paciente. Verifica que el perfil tenga un email válido.');
      return;
    }
    if (!validate()) return;

    const imageData = images.map((img) => ({
      name: img.name,
      data: img.preview,
      type: img.file.type,
    }));

    const quoteData = {
      productName: formData.brand,
      brand: formData.brand,
      model: `${formData.technology} - ${formData.platform}`,
      category: 'hearing-aid',
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalPrice: totalValue,
      discount,
      warrantyYears: formData.warrantyYears,
      notes: formData.notes,
      metadata: {
        technology: formData.technology,
        platform: formData.platform,
        warrantyYears: formData.warrantyYears,
        rechargeable: formData.rechargeable,
        seguroPerdidaRobo: formData.seguroPerdidaRobo,
        seguroRotura: formData.seguroRotura,
        campaignId: formData.campaignId || null,
        campaignNombre: selectedCampaign?.nombre || '',
        fabricante: selectedCampaign?.fabricante || '',
        campaignVigencia:
          selectedCampaign?.fechaInicio && selectedCampaign?.fechaFin
            ? `${selectedCampaign.fechaInicio} - ${selectedCampaign.fechaFin}`
            : '',
        images: imageData,
        patientName: formData.patientName,
        patientEmail: emailToUse,
        patientPhone: formData.patientPhone,
      },
    };

    try {
      const result = isEdit ? await updateQuote(quoteId, quoteData) : await createQuote(emailToUse, quoteData);
      if (result.success) {
        onSuccess?.(result.product);
        handleClose();
      } else {
        alert('Error al guardar la cotización: ' + (result.error || 'Error desconocido'));
      }
    } catch (e) {
      alert('Error al guardar la cotización: ' + (e?.message || 'Error desconocido'));
    }
  };

  const handleClose = () => {
    setFormData({
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
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      patientPhone: formData.patientPhone,
    });
    setImages([]);
    setErrors({});
    onClose();
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return '—';
    try {
      const f = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${f(start)} - ${f(end)}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
        {isEdit ? 'Editar cotización' : 'Nueva Cotización'}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Sección 1: Producto ofertado */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mb: 1 }}>
              Producto ofertado
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Marca</InputLabel>
              <Select
                value={formData.brand}
                label="Marca"
                onChange={handleChange('brand')}
                error={!!errors.brand}
              >
                {MARCAS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
              {errors.brand && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.brand}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Número de audífonos</InputLabel>
              <Select
                value={formData.quantity}
                label="Número de audífonos"
                onChange={handleChange('quantity')}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tecnología"
              value={formData.technology}
              onChange={handleChange('technology')}
              error={!!errors.technology}
              helperText={errors.technology}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plataforma"
              value={formData.platform}
              onChange={handleChange('platform')}
              error={!!errors.platform}
              helperText={errors.platform}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Recargable</InputLabel>
              <Select
                value={formData.rechargeable}
                label="Recargable"
                onChange={handleChange('rechargeable')}
              >
                <MenuItem value="SI">Sí</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sección 2: Información de marketing */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>
              Información de marketing
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Campaña de marketing</InputLabel>
              <Select
                value={formData.campaignId}
                label="Campaña de marketing"
                onChange={handleChange('campaignId')}
                disabled={!formData.brand}
              >
                <MenuItem value="">
                  <em>{formData.brand ? 'Ninguna' : 'Seleccione primero una marca'}</em>
                </MenuItem>
                {campaignsByBrand.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedCampaign && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nombre de la campaña"
                  value={selectedCampaign.nombre}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fabricante"
                  value={selectedCampaign.fabricante || '—'}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha de vigencia de la campaña"
                  value={formatDateRange(selectedCampaign.fechaInicio, selectedCampaign.fechaFin)}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Grid>
            </>
          )}

          {/* Sección 3: Información de producto */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>
              Información de producto
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Años de garantía</InputLabel>
              <Select
                value={formData.warrantyYears}
                label="Años de garantía"
                onChange={handleChange('warrantyYears')}
              >
                <MenuItem value={1}>1 año</MenuItem>
                <MenuItem value={2}>2 años</MenuItem>
                <MenuItem value={3}>3 años</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Seguro por pérdida o robo</InputLabel>
              <Select
                value={formData.seguroPerdidaRobo}
                label="Seguro por pérdida o robo"
                onChange={handleChange('seguroPerdidaRobo')}
              >
                <MenuItem value="SI">Sí</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Seguro por rotura</InputLabel>
              <Select
                value={formData.seguroRotura}
                label="Seguro por rotura"
                onChange={handleChange('seguroRotura')}
              >
                <MenuItem value="SI">Sí</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#86899C', mb: 1 }}>
              Imágenes del producto
            </Typography>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="quote-image-upload"
              multiple
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="quote-image-upload">
              <Button variant="outlined" component="span" startIcon={<ImageIcon />} fullWidth sx={{ mb: 1 }}>
                Agregar imágenes
              </Button>
            </label>
            {images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {images.map((img) => (
                  <Paper
                    key={img.id}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <img
                      src={img.preview}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(img.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>

          {/* Sección 4: Cotización */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>
              Cotización
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor unitario"
              type="number"
              value={formData.unitPrice || ''}
              onChange={handleChange('unitPrice')}
              error={!!errors.unitPrice}
              helperText={errors.unitPrice}
              required
              InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Descuento aprobado (%)"
              value={selectedCampaign ? discount : 0}
              InputProps={{ readOnly: true, endAdornment: <Typography sx={{ ml: 1 }}>%</Typography> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor por unidad"
              value={valuePerUnit > 0 ? valuePerUnit.toLocaleString() : '0'}
              InputProps={{ readOnly: true, startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor total"
              value={totalValue > 0 ? totalValue.toLocaleString() : '0'}
              InputProps={{ readOnly: true, startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            />
          </Grid>

          {/* Sección 5: Comentarios */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#272F50', mt: 2, mb: 1 }}>
              Comentarios
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Comentarios adicionales..."
              value={formData.notes}
              onChange={handleChange('notes')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined" startIcon={<Close />}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<Save />} sx={{ bgcolor: '#085946' }}>
          Guardar cotización
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuoteDialog;
