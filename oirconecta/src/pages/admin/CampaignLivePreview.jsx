/**
 * Live preview del anuncio mientras se crea la campaña.
 * Estilo "Facebook Ads Manager": panel lateral derecho que se actualiza
 * en tiempo real con los valores del formulario.
 */

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const NAVY = '#272F50';
const ACCENT = '#085946';
const GOLD = '#C9A86A';

const PLACEHOLDER_IMG = (
  <Box sx={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #cbd5e1 25%, #e2e8f0 50%, #cbd5e1 75%)',
    backgroundSize: '20px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#64748b', fontSize: '0.75rem', fontWeight: 700,
  }}>
    Sin creatividad
  </Box>
);

function FakeBrowser({ children }) {
  return (
    <Box sx={{
      width: '100%', borderRadius: '8px', overflow: 'hidden',
      border: '1px solid #cbd5e1', bgcolor: '#fff',
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    }}>
      <Box sx={{
        bgcolor: '#f1f5f9', px: 1.5, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 1,
        borderBottom: '1px solid #e5e7eb',
      }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {['#fb7185', '#fbbf24', '#34d399'].map((c) => (
            <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, bgcolor: '#fff', borderRadius: '4px', px: 1, py: 0.25,
          display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem', color: '#94a3b8' }}>
          <LanguageRoundedIcon sx={{ fontSize: 12 }} />
          oirconecta.com
        </Box>
      </Box>
      {children}
    </Box>
  );
}

function CreativeMedia({ url, type, sx }) {
  if (!url) return PLACEHOLDER_IMG;
  if (type === 'video') {
    return <Box component="video" src={url} autoPlay muted playsInline loop
      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...sx }} />;
  }
  return <Box component="img" src={url} alt=""
    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...sx }} />;
}

// ─── Mocks por tipo ───

function PopupMock({ form, advertiser }) {
  return (
    <FakeBrowser>
      <Box sx={{ position: 'relative', height: 280, bgcolor: '#f8fafc', overflow: 'hidden' }}>
        {/* Página fake al fondo */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
          <Box sx={{ height: 30, bgcolor: NAVY }} />
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '40%', mb: 1, borderRadius: 1 }} />
            <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '80%', mb: 0.5, borderRadius: 1 }} />
            <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '70%', borderRadius: 1 }} />
          </Box>
        </Box>
        {/* Backdrop oscuro */}
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(4,26,18,0.6)' }} />
        {/* Popup */}
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '70%', aspectRatio: '600/400',
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          <Box sx={{
            position: 'absolute', bottom: 4, left: 4,
            bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
            px: 0.5, py: 0.125, borderRadius: '3px',
            fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Publicidad
          </Box>
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function BannerFooterMock({ form }) {
  return (
    <FakeBrowser>
      <Box sx={{ height: 280, bgcolor: '#fafbfc', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1.5, flex: 1 }}>
          <Box sx={{ height: 8, bgcolor: '#e2e8f0', width: '40%', mb: 1, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '90%', mb: 0.5, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '85%', mb: 0.5, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '70%', borderRadius: 1 }} />
        </Box>
        {/* Footer banner */}
        <Box sx={{ width: '85%', height: 50, mx: 'auto', mb: 1.5, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          <Box sx={{
            position: 'absolute', top: 2, right: 2,
            bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', px: 0.5, py: 0.125, borderRadius: '2px',
            fontSize: '0.5rem', textTransform: 'uppercase',
          }}>Pub</Box>
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function BannerHeroMock({ form }) {
  return (
    <FakeBrowser>
      <Box sx={{ height: 280, bgcolor: '#fff' }}>
        <Box sx={{ bgcolor: NAVY, height: 30 }} />
        {/* Hero banner */}
        <Box sx={{ width: '92%', height: 80, mx: 'auto', mt: 1.5, borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
          <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          <Box sx={{
            position: 'absolute', top: 2, right: 4,
            bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', px: 0.5, borderRadius: '2px',
            fontSize: '0.5rem', textTransform: 'uppercase',
          }}>Pub</Box>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '50%', mb: 1, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '85%', mb: 0.5, borderRadius: 1 }} />
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function BannerSidebarMock({ form }) {
  return (
    <FakeBrowser>
      <Box sx={{ height: 320, bgcolor: '#fff', display: 'flex', p: 1.5, gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '50%', mb: 1, borderRadius: 1 }} />
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ height: 4, bgcolor: '#e2e8f0', width: `${70 + (i * 3) % 25}%`, mb: 0.5, borderRadius: 1 }} />
          ))}
        </Box>
        <Box sx={{ width: 75, height: 280, borderRadius: '4px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          <Box sx={{
            position: 'absolute', top: 2, right: 2,
            bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', px: 0.5, borderRadius: '2px',
            fontSize: '0.5rem',
          }}>Pub</Box>
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function BrandCardMock({ form, advertiser }) {
  return (
    <FakeBrowser>
      <Box sx={{ p: 1.5, bgcolor: '#fafbfc', height: 280 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ height: 50, bgcolor: '#e2e8f0' }} />
              <Box sx={{ p: 0.5 }}>
                <Box sx={{ height: 4, bgcolor: '#cbd5e1', width: '70%', mb: 0.5, borderRadius: 0.5 }} />
                <Box sx={{ height: 3, bgcolor: '#e2e8f0', width: '90%', borderRadius: 0.5 }} />
              </Box>
            </Box>
          ))}
          {/* Brand card protagonista */}
          <Box sx={{
            bgcolor: '#fff', borderRadius: '4px', overflow: 'hidden', position: 'relative',
            border: `1.5px solid ${GOLD}80`, boxShadow: `0 4px 12px ${GOLD}30`,
          }}>
            <Box sx={{ height: 50, position: 'relative' }}>
              <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
              <Box sx={{
                position: 'absolute', top: 1, right: 1,
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', px: 0.5, borderRadius: '2px',
                fontSize: '0.5rem', textTransform: 'uppercase',
              }}>Pub</Box>
            </Box>
            <Box sx={{ p: 0.5 }}>
              <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {advertiser?.nombre || 'Marca'}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: NAVY }}>
                {form.nombre || 'Tu campaña'}
              </Typography>
            </Box>
          </Box>
          {[0, 1].map((i) => (
            <Box key={`b-${i}`} sx={{ bgcolor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <Box sx={{ height: 50, bgcolor: '#e2e8f0' }} />
              <Box sx={{ p: 0.5 }}>
                <Box sx={{ height: 4, bgcolor: '#cbd5e1', width: '70%', mb: 0.5, borderRadius: 0.5 }} />
                <Box sx={{ height: 3, bgcolor: '#e2e8f0', width: '90%', borderRadius: 0.5 }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function WebPushToastMock({ form, advertiser }) {
  return (
    <FakeBrowser>
      <Box sx={{ height: 280, bgcolor: '#fafbfc', position: 'relative' }}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '40%', mb: 1, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '80%', mb: 0.5, borderRadius: 1 }} />
        </Box>
        {/* Toast */}
        <Box sx={{
          position: 'absolute', bottom: 12, right: 12,
          width: 130, bgcolor: '#fff', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          p: 1, display: 'flex', gap: 1, alignItems: 'center',
        }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
            <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: NAVY }}>
              {advertiser?.nombre || 'Anunciante'}
            </Typography>
            <Typography sx={{ fontSize: '0.5rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.nombre || 'Mensaje de la campaña'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </FakeBrowser>
  );
}

function NewsletterMock({ form, advertiser }) {
  return (
    <Box sx={{
      width: '100%', borderRadius: '8px', overflow: 'hidden',
      border: '1px solid #e5e7eb', bgcolor: '#fff', maxWidth: 280, mx: 'auto',
    }}>
      <Box sx={{ bgcolor: NAVY, color: '#fff', p: 1, fontSize: '0.7rem', fontWeight: 700 }}>
        OírConecta · Newsletter
      </Box>
      <Box sx={{ p: 1 }}>
        <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '70%', mb: 0.5, borderRadius: 1 }} />
        <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '90%', mb: 0.5, borderRadius: 1 }} />
        <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '80%', mb: 1.5, borderRadius: 1 }} />
        {/* Bloque sponsor */}
        <Box sx={{ border: `1.5px dashed ${GOLD}`, p: 1, borderRadius: '6px', bgcolor: '#fffbeb' }}>
          <Box sx={{ height: 50, mb: 0.5, borderRadius: '4px', overflow: 'hidden' }}>
            <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          </Box>
          <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: GOLD, mb: 0.25, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Patrocinado por {advertiser?.nombre || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: NAVY, mb: 0.5 }}>
            {form.nombre || 'Tu mensaje aquí'}
          </Typography>
          <Box sx={{ display: 'inline-block', bgcolor: ACCENT, color: '#fff', px: 1, py: 0.25, borderRadius: '3px', fontSize: '0.55rem', fontWeight: 700 }}>
            Ver más
          </Box>
        </Box>
        <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '70%', mt: 1, borderRadius: 1 }} />
      </Box>
    </Box>
  );
}

function MobileStickyMock({ form }) {
  return (
    <Box sx={{
      width: 200, mx: 'auto',
      borderRadius: '18px', overflow: 'hidden',
      border: '4px solid #1f2937', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
      bgcolor: '#fff',
    }}>
      <Box sx={{ height: 12, bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 50, height: 6, bgcolor: '#1f2937', borderRadius: '0 0 6px 6px' }} />
      </Box>
      <Box sx={{ height: 240, position: 'relative', bgcolor: '#fafbfc' }}>
        <Box sx={{ p: 1 }}>
          <Box sx={{ height: 6, bgcolor: '#cbd5e1', width: '60%', mb: 0.5, borderRadius: 1 }} />
          <Box sx={{ height: 4, bgcolor: '#e2e8f0', width: '90%', mb: 0.5, borderRadius: 1 }} />
        </Box>
        {/* Sticky footer ad */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, overflow: 'hidden', borderTop: '1px solid #e5e7eb' }}>
          <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
          <Box sx={{ position: 'absolute', top: 2, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', px: 0.5, borderRadius: '2px', fontSize: '0.5rem' }}>Pub</Box>
        </Box>
      </Box>
    </Box>
  );
}

function GenericMock({ form, advertiser, actionLabel }) {
  return (
    <Box sx={{
      width: '100%', borderRadius: '10px', overflow: 'hidden',
      border: '1px solid #e5e7eb', bgcolor: '#fff',
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    }}>
      <Box sx={{ aspectRatio: '16/9', position: 'relative' }}>
        <CreativeMedia url={form.creativeUrl} type={form.creativeType} />
        <Box sx={{
          position: 'absolute', top: 6, right: 6,
          bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
          px: 0.75, py: 0.25, borderRadius: '4px',
          fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Publicidad
        </Box>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
          {advertiser?.nombre || 'Anunciante'}
        </Typography>
        <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '0.9rem', mb: 0.5 }}>
          {form.nombre || 'Nombre de la campaña'}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
          {actionLabel || form.actionType || 'Selecciona un tipo de acción'}
        </Typography>
        {form.destinationUrl && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, color: ACCENT, fontSize: '0.75rem', fontWeight: 700 }}>
            <span>{form.destinationUrl}</span>
            <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// ─── Wrapper ───

export default function CampaignLivePreview({ form, advertisers, catalog }) {
  const advertiser = advertisers?.find((a) => a.id === form.advertiserId);
  const action = catalog?.find((c) => c.code === form.actionType);
  const actionLabel = action?.label;

  let Mock;
  switch (form.actionType) {
    case 'POPUP_BIENVENIDA':
    case 'EXIT_INTENT':
    case 'MOBILE_INTERSTICIAL':
      Mock = PopupMock; break;
    case 'BANNER_FOOTER':
    case 'COMPARADOR_BANNER':
    case 'BLOG_PATROCINADOR':
      Mock = BannerFooterMock; break;
    case 'BANNER_HERO':
    case 'HOMEPAGE_TAKEOVER':
      Mock = BannerHeroMock; break;
    case 'BANNER_SIDEBAR':
      Mock = BannerSidebarMock; break;
    case 'BRAND_CARD_DIRECTORY':
    case 'SPONSORED_PROFESSIONAL':
    case 'SEARCH_INLINE_AD':
    case 'SEARCH_DESTACADO':
      Mock = BrandCardMock; break;
    case 'WEB_PUSH_TOAST':
    case 'FLOATING_CTA_MOBILE':
      Mock = WebPushToastMock; break;
    case 'NEWSLETTER_SPONSOR':
    case 'NEWSLETTER_MENCION':
    case 'NEWSLETTER_DEDICADO':
    case 'EMAIL_BIENVENIDA_PROF':
      Mock = NewsletterMock; break;
    case 'MOBILE_STICKY_FOOTER':
      Mock = MobileStickyMock; break;
    default:
      Mock = (props) => <GenericMock {...props} actionLabel={actionLabel} />;
  }

  return (
    <Box sx={{
      position: 'sticky', top: 0,
      bgcolor: '#f1f5f9', borderRadius: '12px', p: 2,
      border: '1px solid #e5e7eb', minHeight: 320,
    }}>
      <Typography sx={{
        fontSize: '0.7rem', fontWeight: 800, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
      }}>
        Vista previa en vivo
      </Typography>

      <Mock form={form} advertiser={advertiser} />

      {!form.actionType && (
        <Typography sx={{ mt: 2, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
          Selecciona un tipo de acción para ver cómo se renderiza.
        </Typography>
      )}
      {form.actionType && !form.creativeUrl && (
        <Typography sx={{ mt: 2, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
          Sube una creatividad para ver el anuncio terminado.
        </Typography>
      )}
    </Box>
  );
}
