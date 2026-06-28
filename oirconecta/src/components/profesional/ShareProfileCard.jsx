/**
 * Bloque vibrante para compartir la ficha pública del profesional.
 * Aparece en Consultas (empty state) y en cualquier otra pantalla que
 * quiera empujar al profesional a propagar su perfil.
 */
import React, { useState } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import {
  ContentCopyOutlined, WhatsApp, ShareOutlined,
  EmailOutlined, OpenInNew,
} from '@mui/icons-material';

function buildShareText(profileId) {
  const url = `https://oirconecta.com/directorio/profesional/${profileId}`;
  const text = `Atiendo en OírConecta · agenda y consultas en línea: ${url}`;
  return { url, text };
}

export default function ShareProfileCard({ profile }) {
  const [snack, setSnack] = useState(null);
  const profileId = profile?.id || profile?.profileId || profile?.slug;
  if (!profileId) return null;

  const { url, text } = buildShareText(profileId);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setSnack({ severity: 'success', msg: 'Enlace copiado al portapapeles' });
    } catch {
      setSnack({ severity: 'error', msg: 'No se pudo copiar' });
    }
  };

  const openWa = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  const openMail = () => window.open(`mailto:?subject=${encodeURIComponent('Mi ficha en OírConecta')}&body=${encodeURIComponent(text)}`, '_blank');
  const openNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi ficha en OírConecta', text, url }); } catch {}
    } else copy();
  };
  const openFicha = () => window.open(`/directorio/profesional/${profileId}`, '_blank');

  return (
    <>
      <Box sx={{
        position: 'relative', borderRadius: 3, overflow: 'hidden',
        background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 50%, #085946 100%)',
        color: '#fff', p: { xs: 2.5, sm: 3.25 }, mb: 0,
      }}>
        {/* deco */}
        <Box sx={{
          position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,200,0.25), rgba(110,231,200,0) 70%)',
        }} />
        <Box sx={{
          position: 'absolute', left: -40, bottom: -60, width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(64,84,178,0.30), rgba(64,84,178,0) 70%)',
        }} />

        <Box sx={{ position: 'relative' }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: '#6ee7c8', mb: 0.75,
          }}>
            Comparte tu ficha
          </Typography>
          <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
            La forma más rápida de recibir tus primeras consultas
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.80)', mb: 2.25, maxWidth: 560 }}>
            Comparte el enlace de tu ficha con pacientes actuales y en tus redes.
            Cuando alguien la abra, podrá agendar o escribirte de inmediato.
          </Typography>

          {/* URL pill */}
          <Box
            onClick={copy}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 1.5, px: 1.5, py: 1, mb: 2, cursor: 'pointer',
              maxWidth: '100%', overflow: 'hidden',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
            }}
          >
            <Typography sx={{
              fontSize: 12.5, fontFamily: 'ui-monospace, monospace',
              color: '#e2f5f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: { xs: 220, sm: 360 },
            }}>
              {url}
            </Typography>
            <ContentCopyOutlined sx={{ fontSize: 15, color: '#6ee7c8' }} />
          </Box>

          {/* Acciones */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              onClick={openWa}
              startIcon={<WhatsApp sx={{ fontSize: 17 }} />}
              sx={{
                bgcolor: '#25D366', color: '#fff', fontWeight: 700, textTransform: 'none',
                px: 1.75, py: 0.85, borderRadius: 1.5, fontSize: 12.5,
                '&:hover': { bgcolor: '#1ebe57' },
              }}
            >
              WhatsApp
            </Button>
            <Button
              onClick={openMail}
              startIcon={<EmailOutlined sx={{ fontSize: 17 }} />}
              sx={{
                bgcolor: '#4054B2', color: '#fff', fontWeight: 700, textTransform: 'none',
                px: 1.75, py: 0.85, borderRadius: 1.5, fontSize: 12.5,
                '&:hover': { bgcolor: '#32449a' },
              }}
            >
              Correo
            </Button>
            <Button
              onClick={openNative}
              startIcon={<ShareOutlined sx={{ fontSize: 17 }} />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, textTransform: 'none',
                px: 1.75, py: 0.85, borderRadius: 1.5, fontSize: 12.5,
                border: '1px solid rgba(255,255,255,0.25)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
            >
              Más opciones
            </Button>
            <Button
              onClick={openFicha}
              startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
              sx={{
                color: '#fff', fontWeight: 600, textTransform: 'none',
                px: 1.5, py: 0.85, fontSize: 12.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Ver mi ficha
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={2200}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </>
  );
}
