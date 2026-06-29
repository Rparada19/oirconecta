/**
 * Barra unificada de acciones del paciente en la ficha pública.
 *
 * 7 acciones priorizadas: Agendar (primaria) · Llamar · WhatsApp · Email
 * · Ver en mapa · Compartir · Favorito. Cada una dispara tracking público
 * (anónimo) y abre la acción real (tel:, wa.me, mailto:, Google Maps,
 * navigator.share, localStorage).
 */
import React, { useEffect, useState } from 'react';
import {
  Box, Button, Tooltip, Snackbar, Alert, Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  CalendarMonth, Phone, Email,
  PlaceOutlined, ShareOutlined, FavoriteBorder, Favorite,
  ContentCopyOutlined, WhatsApp as WhatsAppIcon, FacebookOutlined, MailOutline,
} from '@mui/icons-material';
import { trackContactEvent } from '../../services/directoryTracking';
import { isFavorite as readFav, toggleFavorite } from '../../utils/favoriteProfiles';

function buildMapsUrl({ mapsLugar, direccion, ciudad, nombre }) {
  if (mapsLugar) return mapsLugar;
  const parts = [nombre, direccion, ciudad, 'Colombia'].filter(Boolean).join(', ');
  if (!parts) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

export default function PatientActionBar({
  profileId,
  nombre,
  ciudad,
  direccion,
  mapsLugar,
  telHref,
  waHref,
  mailtoHref,
  agendarProps,           // { component, to, onClick } o { onClick }
}) {
  const [favorite, setFavorite] = useState(false);
  const [shareAnchor, setShareAnchor] = useState(null);
  const [snack, setSnack] = useState(null);

  useEffect(() => { setFavorite(readFav(profileId)); }, [profileId]);

  const mapsUrl = buildMapsUrl({ mapsLugar, direccion, ciudad, nombre });

  const onMap = () => {
    trackContactEvent(profileId, 'map');
    if (mapsUrl) window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const onFavorite = () => {
    const now = toggleFavorite(profileId);
    setFavorite(now);
    trackContactEvent(profileId, 'favorite');
    setSnack({ severity: now ? 'success' : 'info', msg: now ? 'Guardado en favoritos' : 'Quitado de favoritos' });
  };

  const onShareClick = (e) => {
    trackContactEvent(profileId, 'share');
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Mira el perfil de ${nombre || 'este profesional'} en OírConecta`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: nombre || 'OírConecta', text, url }).catch(() => {});
      return;
    }
    setShareAnchor(e.currentTarget);
  };

  const copyLink = async () => {
    setShareAnchor(null);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSnack({ severity: 'success', msg: 'Enlace copiado' });
    } catch {
      setSnack({ severity: 'error', msg: 'No se pudo copiar' });
    }
  };
  const shareWa = () => {
    setShareAnchor(null);
    const text = `Mira el perfil de ${nombre || 'este profesional'} en OírConecta: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const shareFb = () => {
    setShareAnchor(null);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };
  const shareEmail = () => {
    setShareAnchor(null);
    window.location.href = `mailto:?subject=${encodeURIComponent(nombre || 'OírConecta')}&body=${encodeURIComponent(`Te paso este perfil: ${window.location.href}`)}`;
  };

  // Estilos compartidos
  const sxAction = {
    minWidth: 0, px: 1.5, py: 1, borderRadius: 1.5,
    textTransform: 'none', fontWeight: 700, fontSize: 12.5,
    color: '#272F50', bgcolor: '#fff', border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(15,23,35,0.04)',
    '&:hover': { bgcolor: '#f6f7fb', borderColor: '#cbd5e1' },
  };

  return (
    <Box sx={{
      display: 'flex', gap: 1, flexWrap: 'wrap',
      mb: 2.5, mt: 1,
    }}>
      {/* Agendar — primaria */}
      <Button
        {...(agendarProps || {})}
        variant="contained"
        startIcon={<CalendarMonth />}
        sx={{
          textTransform: 'none', fontWeight: 800, fontSize: 13,
          bgcolor: '#085946', borderRadius: 1.5, py: 1, px: 2,
          boxShadow: '0 2px 8px rgba(8,89,70,0.25)',
          '&:hover': { bgcolor: '#064a38' },
        }}
      >
        Agendar
      </Button>

      {telHref && (
        <Button component="a" href={telHref}
          onClick={() => trackContactEvent(profileId, 'call')}
          startIcon={<Phone sx={{ color: '#4054B2' }} />}
          sx={sxAction}>
          Llamar
        </Button>
      )}

      {waHref && (
        <Button component="a" href={waHref} target="_blank" rel="noopener noreferrer"
          onClick={() => trackContactEvent(profileId, 'whatsapp')}
          startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
          sx={sxAction}>
          WhatsApp
        </Button>
      )}

      {mailtoHref && (
        <Button component="a" href={mailtoHref}
          onClick={() => trackContactEvent(profileId, 'email')}
          startIcon={<Email sx={{ color: '#8b5cf6' }} />}
          sx={sxAction}>
          Email
        </Button>
      )}

      {mapsUrl && (
        <Tooltip title={direccion || 'Abrir en Google Maps'}>
          <Button onClick={onMap}
            startIcon={<PlaceOutlined sx={{ color: '#0099CC' }} />}
            sx={sxAction}>
            Mapa
          </Button>
        </Tooltip>
      )}

      <Button onClick={onShareClick}
        startIcon={<ShareOutlined sx={{ color: '#f59e0b' }} />}
        sx={sxAction}>
        Compartir
      </Button>

      <Tooltip title={favorite ? 'Quitar de favoritos' : 'Guardar como favorito'}>
        <Button onClick={onFavorite}
          startIcon={favorite
            ? <Favorite sx={{ color: '#ef4444' }} />
            : <FavoriteBorder sx={{ color: '#ef4444' }} />}
          sx={{
            ...sxAction,
            ...(favorite ? { bgcolor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' } : null),
          }}>
          {favorite ? 'Favorito' : 'Guardar'}
        </Button>
      </Tooltip>

      <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={() => setShareAnchor(null)}>
        <MenuItem onClick={copyLink}>
          <ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copiar enlace" />
        </MenuItem>
        <MenuItem onClick={shareWa}>
          <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} /></ListItemIcon>
          <ListItemText primary="WhatsApp" />
        </MenuItem>
        <MenuItem onClick={shareFb}>
          <ListItemIcon><FacebookOutlined fontSize="small" sx={{ color: '#1877F2' }} /></ListItemIcon>
          <ListItemText primary="Facebook" />
        </MenuItem>
        <MenuItem onClick={shareEmail}>
          <ListItemIcon><MailOutline fontSize="small" sx={{ color: '#8b5cf6' }} /></ListItemIcon>
          <ListItemText primary="Correo" />
        </MenuItem>
      </Menu>

      <Snackbar open={!!snack} autoHideDuration={2200} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Box>
  );
}
