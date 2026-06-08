/**
 * Diálogo "Vista previa del portal" para administración.
 * Abre un iframe apuntando al portal público con ?preview_mode=true.
 * Permite alternar viewport Desktop ↔ Mobile y elegir página (home,
 * directorio, blog).
 */

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, ToggleButtonGroup,
  ToggleButton, Typography, Stack, MenuItem, TextField,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const ACCENT = '#085946';
const NAVY = '#272F50';

const PAGES = [
  { value: '/',                         label: 'Home' },
  { value: '/directorio',               label: 'Directorio' },
  { value: '/directorio/profesion/audiologia',           label: 'Directorio · Audiología' },
  { value: '/directorio/profesion/otorrinolaringologia', label: 'Directorio · ORL' },
  { value: '/blog',                     label: 'Blog' },
  { value: '/audifonos',                label: 'Audífonos' },
  { value: '/comparador-ia',            label: 'Comparador' },
  { value: '/agendar',                  label: 'Agendar' },
];

const VIEWPORTS = {
  desktop: { w: '100%',  h: '100%', icon: <DesktopWindowsRoundedIcon /> },
  mobile:  { w: 390,     h: 800,    icon: <PhoneIphoneRoundedIcon /> },
};

export default function MarketingPreviewDialog({ open, onClose, focusSlot, campaign }) {
  const [device, setDevice] = useState('desktop');
  const [page, setPage] = useState('/');

  // Si la campaña tiene pagesConfig.specificPaths, usa la primera como default
  React.useEffect(() => {
    if (open && campaign?.pagesConfig?.specificPaths?.length) {
      setPage(campaign.pagesConfig.specificPaths[0]);
    }
  }, [open, campaign]);

  const base = (typeof window !== 'undefined' ? window.location.origin : 'https://oirconecta.com');
  let url = `${base}${page}${page.includes('?') ? '&' : '?'}preview_mode=true`;
  if (focusSlot) url += `&focus_slot=${encodeURIComponent(focusSlot)}`;
  const vp = VIEWPORTS[device];

  const isCampaignPreview = !!campaign;
  const headerLabel = isCampaignPreview
    ? `Vista previa: ${campaign.nombre}`
    : focusSlot
      ? `Vista previa del slot: ${focusSlot}`
      : 'Vista previa del portal';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
      PaperProps={{ sx: { borderRadius: '14px', height: '92vh' } }}>
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid #e5e7eb' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1.1rem' }}>
                {headerLabel}
              </Typography>
              {isCampaignPreview && (
                <Box sx={{
                  px: 1, py: 0.25, borderRadius: '4px',
                  bgcolor: campaign.isActive ? '#dcfce7' : '#fef3c7',
                  color: campaign.isActive ? '#15803d' : '#a16207',
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
                }}>
                  {campaign.isActive ? 'EN VIVO' : 'PREVIA — no publicada'}
                </Box>
              )}
            </Stack>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {focusSlot ? `Slot ${focusSlot} resaltado en verde pulsante · resto en gris` : 'Slots vacíos en gris · slots activos con badge verde'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField select size="small" value={page} onChange={(e) => setPage(e.target.value)}
              sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
              {PAGES.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <ToggleButtonGroup exclusive value={device} onChange={(_, v) => v && setDevice(v)} size="small">
              <ToggleButton value="desktop" sx={{ px: 1.5 }}>
                <DesktopWindowsRoundedIcon fontSize="small" sx={{ mr: 0.5 }} /> Desktop
              </ToggleButton>
              <ToggleButton value="mobile" sx={{ px: 1.5 }}>
                <PhoneIphoneRoundedIcon fontSize="small" sx={{ mr: 0.5 }} /> Mobile
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton component="a" href={url} target="_blank" rel="noreferrer" title="Abrir en pestaña">
              <OpenInNewRoundedIcon />
            </IconButton>
            <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          width: vp.w, height: vp.h,
          maxWidth: '100%', mt: device === 'mobile' ? 3 : 0,
          mb: device === 'mobile' ? 3 : 0,
          boxShadow: device === 'mobile' ? '0 12px 40px rgba(0,0,0,0.25)' : 'none',
          borderRadius: device === 'mobile' ? '24px' : 0,
          overflow: 'hidden', bgcolor: '#fff',
        }}>
          <iframe
            key={`${url}-${device}`}
            src={url}
            title="Preview del portal"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
