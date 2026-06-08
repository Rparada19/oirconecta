/**
 * Diálogo para recortar / centrar / comprimir una imagen antes de subirla.
 *
 * - Soporta zoom + drag (con rueda y touch)
 * - Aspect ratio configurable (1:1 para perfil, 3:1 para banner)
 * - Output: Blob JPEG calidad 0.9, lado mayor cap a outputMaxPx (default 1600)
 *   → recorta + comprime automáticamente. Cualquier imagen original
 *   (incluso 20 MB) sale por debajo de 1 MB.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Slider, Typography, IconButton, CircularProgress, Stack,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import Cropper from 'react-easy-crop';

const ACCENT = '#085946';
const NAVY = '#272F50';

/**
 * Lee un File a dataURL.
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Genera el Blob recortado.
 */
async function getCroppedBlob(srcDataUrl, pixelCrop, rotation = 0, maxDim = 1600, quality = 0.9) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = srcDataUrl;
  });

  // Canvas intermedio: tamaño del recorte
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  if (rotation) {
    // Si hay rotación, hacemos un canvas más grande, rotamos, y luego recortamos.
    const rad = (rotation * Math.PI) / 180;
    const safe = Math.max(img.width, img.height) * 2;
    const rotated = document.createElement('canvas');
    rotated.width = safe;
    rotated.height = safe;
    const rctx = rotated.getContext('2d');
    rctx.translate(safe / 2, safe / 2);
    rctx.rotate(rad);
    rctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.drawImage(rotated, pixelCrop.x - (safe - img.width) / 2, pixelCrop.y - (safe - img.height) / 2,
      pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  } else {
    ctx.drawImage(
      img,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );
  }

  // Escalado final si excede maxDim
  let finalCanvas = canvas;
  const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
  if (scale < 1) {
    finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.round(canvas.width * scale);
    finalCanvas.height = Math.round(canvas.height * scale);
    finalCanvas.getContext('2d').drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);
  }

  return new Promise((resolve) => {
    finalCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

export default function PhotoCropperDialog({
  open, file, onClose, onCropped,
  aspect = 1, outputMaxPx = 1600, title = 'Ajustar imagen',
}) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && file) {
      readFileAsDataURL(file).then(setSrc);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } else {
      setSrc(null);
    }
  }, [open, file]);

  const onCropComplete = useCallback((_area, areaPx) => {
    setPixelCrop(areaPx);
  }, []);

  const handleConfirm = async () => {
    if (!src || !pixelCrop) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(src, pixelCrop, rotation, outputMaxPx, 0.9);
      onCropped(blob);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={processing ? undefined : onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1.1rem' }}>{title}</Typography>
          <IconButton onClick={onClose} disabled={processing}><CloseRoundedIcon /></IconButton>
        </Stack>
        <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Arrastra para mover · usa el slider o la rueda para zoom · gira si hace falta
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: String(aspect), bgcolor: '#0f1923', borderRadius: '10px', overflow: 'hidden' }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              showGrid
              objectFit="contain"
            />
          )}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ mt: 2.5, px: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, width: '100%' }}>
            <ZoomInRoundedIcon sx={{ color: ACCENT }} />
            <Slider value={zoom} min={1} max={4} step={0.05}
              onChange={(_, v) => setZoom(Number(v))}
              sx={{ color: ACCENT }} />
          </Stack>
          <Button startIcon={<RotateRightRoundedIcon />}
            onClick={() => setRotation((r) => (r + 90) % 360)}
            sx={{ color: ACCENT, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}>
            Girar 90°
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={processing}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={processing || !pixelCrop}
          sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
          {processing ? <CircularProgress size={20} color="inherit" /> : 'Usar esta imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
