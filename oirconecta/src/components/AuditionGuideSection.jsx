import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  VolumeUpOutlined, GroupsOutlined, NotificationsActiveOutlined,
  PhoneInTalkOutlined, ArrowForward,
} from '@mui/icons-material';
import { useReveal } from '../hooks/useReveal';

const C = {
  navy: '#272F50',
  verde: '#085946',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  border: '#E5E0D6',
};

const SIGNALS = [
  { Icon: VolumeUpOutlined, n: '01',
    title: 'Subes mucho el volumen',
    text: 'Del televisor, la radio o el celular, y aun así cuesta entender lo que dicen.' },
  { Icon: GroupsOutlined, n: '02',
    title: 'Te cuesta seguir conversaciones',
    text: 'Sobre todo si hay varias personas o ruido al fondo —restaurante, familia reunida, oficina abierta.' },
  { Icon: NotificationsActiveOutlined, n: '03',
    title: 'Te avisan que “no escuchaste”',
    text: 'El timbre, una llamada, o cuando alguien te habla mientras estás de espaldas.' },
  { Icon: PhoneInTalkOutlined, n: '04',
    title: 'Evitas hablar por teléfono',
    text: 'Se vuelve agotador adivinar palabras sin ver los labios de quien habla.' },
];

function SignalRow({ s, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });
  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        py: { xs: 3, md: 4 },
        borderTop: `1px solid ${C.border}`,
        display: 'grid',
        gridTemplateColumns: { xs: '40px 1fr', md: '80px 60px 1fr auto' },
        gap: { xs: 2, md: 4 }, alignItems: 'flex-start',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
        '&:hover .oc-num': { color: C.oro },
        '&:hover .oc-icon-wrap': { borderColor: C.navy, color: C.navy },
      }}
    >
      <Typography className="oc-num" sx={{
        gridRow: { xs: '1 / span 2', md: 'auto' },
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.5rem', md: '2.25rem' }, fontWeight: 600,
        color: `${C.navy}66`, lineHeight: 1,
        transition: 'color 0.3s ease',
      }}>
        {s.n}
      </Typography>
      <Box className="oc-icon-wrap" sx={{
        display: { xs: 'none', md: 'flex' },
        width: 48, height: 48, borderRadius: '50%',
        border: `1.5px solid ${C.arena}`, color: C.gris,
        alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}>
        <s.Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography component="h3" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.25rem', md: '1.75rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.2, mb: 1,
          letterSpacing: '-0.01em',
        }}>
          {s.title}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '0.95rem', md: '1.05rem' },
          color: C.gris, lineHeight: 1.55, maxWidth: 560,
        }}>
          {s.text}
        </Typography>
      </Box>
      {/* Marca de continuidad editorial — solo en desktop */}
      <Typography sx={{
        display: { xs: 'none', md: 'block' },
        fontFamily: '"Playfair Display", Georgia, serif',
        fontStyle: 'italic', fontSize: '0.85rem', color: `${C.navy}55`,
        whiteSpace: 'nowrap',
      }}>
        — sucede más de lo que crees.
      </Typography>
    </Box>
  );
}

export default function AuditionGuideSection() {
  const header = useReveal({ threshold: 0.2 });
  const cta = useReveal({ threshold: 0.4 });

  return (
    <Box id="aprender-audicion" component="section" aria-label="Señales de alerta auditiva" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.blanco, scrollMarginTop: 96,
      py: { xs: 8, md: 14 },
    }}>
      <Container maxWidth="lg">
        {/* Header asimétrico */}
        <Box ref={header.ref} sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: { xs: 4, md: 6 }, alignItems: 'end',
          mb: { xs: 5, md: 9 },
          opacity: header.visible ? 1 : 0,
          transform: header.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 3 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: C.navy,
              }}>
                Guía sencilla · Cuatro pistas
              </Typography>
            </Stack>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.25rem', md: '3.5rem', lg: '4rem' }, fontWeight: 500,
              color: C.navy, lineHeight: 1, letterSpacing: '-0.025em',
            }}>
              Señales{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde }}>
                que muchos
              </Box>{' '}
              posponen.
            </Typography>
          </Box>
          <Box sx={{ pb: { md: 1.5 } }}>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.2rem' }, lineHeight: 1.55,
              color: C.gris, maxWidth: 540,
            }}>
              Si te identificas con dos o más, una valoración auditiva es el
              primer paso —sin presión, sin venta forzada. Solo claridad sobre
              lo que está pasando.
            </Typography>
          </Box>
        </Box>

        {/* Lista de señales en lugar de grid de cards (más editorial) */}
        <Box sx={{ borderBottom: `1px solid ${C.border}` }}>
          {SIGNALS.map((s, i) => (
            <SignalRow key={s.n} s={s} delay={i * 0.08} />
          ))}
        </Box>

        {/* CTA al buzón de contacto */}
        <Box ref={cta.ref} sx={{
          mt: { xs: 5, md: 8 },
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          gap: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between',
          opacity: cta.visible ? 1 : 0,
          transform: cta.visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.25rem', md: '1.5rem' }, fontStyle: 'italic',
            color: C.navy, lineHeight: 1.35, maxWidth: 520,
          }}>
            Si reconociste a alguien que amas, déjanos contactarlo en sus términos.
          </Typography>
          <Box
            component={RouterLink}
            to="/contacto"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1.25,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.9rem', fontWeight: 700, color: '#fff',
              textDecoration: 'none', whiteSpace: 'nowrap',
              bgcolor: C.navy, px: 3.25, py: 1.65, borderRadius: '6px',
              letterSpacing: '0.04em',
              boxShadow: `0 10px 28px ${C.navy}33`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#1B2240', gap: 2,
                boxShadow: `0 14px 32px ${C.navy}44`, transform: 'translateY(-2px)',
              },
            }}
          >
            Solicitar una valoración
            <ArrowForward sx={{ fontSize: 18 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
