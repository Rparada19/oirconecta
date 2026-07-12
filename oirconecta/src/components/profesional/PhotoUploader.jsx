/**
 * Upload de imagen para el profesional. Reemplaza el TextField de URL.
 * Sube a Cloudinary vía /api/directory/me/upload y devuelve la URL pública.
 *
 * Props:
 *  - value: URL actual (string | null)
 *  - onChange: (url, meta) => void
 *  - label: texto del placeholder
 *  - aspectRatio: '1/1' (default) | '3/1' (banner)
 *  - maxMB: tamaño máximo en MB
 */

import React, { useRef, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CropRoundedIcon from '@mui/icons-material/CropRounded';
import { directoryApi } from '../../services/directoryAccountApi';
import PhotoCropperDialog from './PhotoCropperDialog';

const ACCENT = '#085946';

// Convierte "1/1" o "3/1" a número (aspect para el cropper)
function parseAspect(ratio) {
  if (typeof ratio === 'number') return ratio;
  if (typeof ratio === 'string' && ratio.includes('/')) {
    const [w, h] = ratio.split('/').map((n) => parseFloat(n.trim()));
    if (w > 0 && h > 0) return w / h;
  }
  return 1;
}

export default function PhotoUploader({
  value, onChange, label = 'Subir imagen',
  aspectRatio = '1/1', maxMB = 8, hint,
}) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [cropperFile, setCropperFile] = useState(null);

  /**
   * El cropper genera un Blob (JPEG comprimido y limitado a 1600px).
   * Esto resuelve dos cosas a la vez:
   *  - Centrar / encuadrar
   *  - Bajar el peso si la original supera maxMB
   */
  const uploadBlob = async (blob) => {
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      const filename = `foto-${Date.now()}.jpg`;
      fd.append('file', blob, filename);
      const r = await directoryApi.post('/api/directory/me/upload', fd);
      if (r?.data?.success) {
        onChange(r.data.data.url, r.data.data);
        setCropperFile(null);
      } else {
        const msg = r?.error || r?.data?.error || 'Error al subir';
        setError(msg);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Error de red');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setError(null);
    // Siempre abrimos el cropper para que el usuario pueda ajustar.
    // Si la imagen pesa mucho, el cropper la comprime al exportar.
    setCropperFile(file);
  };

  const clear = (e) => { e.stopPropagation(); onChange('', null); };

  return (
    <>
    <Box>
      <Box
        onClick={() => !busy && fileRef.current?.click()}
        sx={{
          position: 'relative', cursor: busy ? 'wait' : 'pointer',
          width: '100%', aspectRatio,
          borderRadius: '12px', overflow: 'hidden',
          border: value ? '1px solid rgba(8,89,70,0.18)' : '2px dashed rgba(8,89,70,0.35)',
          bgcolor: value ? '#000' : 'rgba(8,89,70,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          '&:hover': value ? {} : { borderColor: ACCENT, bgcolor: 'rgba(8,89,70,0.08)' },
        }}
      >
        {value ? (
          <>
            <Box component="img" src={value} alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
              <IconButton onClick={clear} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#b91c1c',
                  '&:hover': { bgcolor: '#fff' } }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: ACCENT,
                  '&:hover': { bgcolor: '#fff' } }}>
                <CloudUploadOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            {busy && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#fff' }} />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {busy ? (
              <CircularProgress size={28} sx={{ color: ACCENT }} />
            ) : (
              <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: ACCENT, mb: 1 }} />
            )}
            <Typography sx={{ fontWeight: 700, color: ACCENT, fontSize: '0.9rem' }}>
              {busy ? 'Subiendo…' : label}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
              Click para elegir · JPG, PNG, WEBP · podrás ajustar antes de subir
            </Typography>
          </Box>
        )}
        <input ref={fileRef} type="file" hidden
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          onChange={(e) => handleFile(e.target.files?.[0])} />
      </Box>
      {hint && (
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>{hint}</Typography>
      )}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}

    </Box>
    {/* Fuera del Box padre con onClick: los clicks del Portal MUI propagan
        virtualmente al ancestro y volvían a abrir el file picker. */}
    <PhotoCropperDialog
      open={!!cropperFile}
      file={cropperFile}
      aspect={parseAspect(aspectRatio)}
      onClose={() => setCropperFile(null)}
      onCropped={uploadBlob}
    />
    </>
  );
}
