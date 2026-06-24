/**
 * Kit de primitivos editoriales OírConecta — reutilizar en todas las páginas
 * públicas para garantizar consistencia visual sin reescribir lo mismo.
 *
 * Componentes:
 *   <PageHero />               Hero estándar con eyebrow, H1 con italic accent y bajada
 *   <SectionEyebrow />         Línea + label uppercase (verde/oro)
 *   <SectionTitle />           H2 Playfair con palabra italic destacada
 *   <EditorialIntro />         Bloque texto con drop cap opcional
 *   <PullQuote />              Cita italic grande estilo magazine
 *   <SignatureMark />          Pequeño marcador editorial (— №01, ※, etc.)
 *   <CTAArrowLink />           Enlace con flecha y underline animado
 */
import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';
import { Swoosh, BigQuote } from '../brand/BrandMark';
import { useReveal } from '../../hooks/useReveal';

export const C = {
  navy: '#272F50',
  navyDark: '#1B2240',
  verde: '#085946',
  oro: '#C9A86A',
  oroSuave: '#E0C28A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
  border: '#E5E0D6',
};

// ─── SectionEyebrow ─────────────────────────────────────────────────────────

export function SectionEyebrow({ children, color = C.navy, dash = C.oro, sx }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.75} sx={sx}>
      <Box sx={{ width: 32, height: 2, bgcolor: dash }} />
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
        textTransform: 'uppercase', color,
      }}>
        {children}
      </Typography>
    </Stack>
  );
}

// ─── SectionTitle ───────────────────────────────────────────────────────────

export function SectionTitle({ before, accent, after, accentColor = C.verde, size = 'lg', component = 'h2', sx }) {
  const sizes = {
    sm: { xs: '1.75rem', md: '2.25rem' },
    md: { xs: '2rem', md: '3rem' },
    lg: { xs: '2.25rem', md: '3.5rem', lg: '4rem' },
    xl: { xs: '2.75rem', md: '4.5rem', lg: '5.5rem' },
  };
  return (
    <Typography component={component} sx={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: sizes[size], fontWeight: 500,
      color: C.navy, lineHeight: 1.02, letterSpacing: '-0.025em',
      ...sx,
    }}>
      {before}{before && accent ? ' ' : ''}
      {accent && (
        <Box component="span" sx={{ fontStyle: 'italic', color: accentColor }}>
          {accent}
        </Box>
      )}
      {after && (accent || before) ? ' ' : ''}{after}
    </Typography>
  );
}

// ─── PageHero ───────────────────────────────────────────────────────────────

export function PageHero({
  eyebrow,
  titleBefore,
  titleAccent,
  titleAfter,
  intro,
  image,
  imageAlt,
  imageTag,
  imageCaption,
  cta,         // { label, to }
  ctaSecondary, // { label, to }
  variant = 'image-right', // image-right | image-below | no-image
  bgcolor = C.blanco,
}) {
  const t = useReveal({ threshold: 0.1 });
  const i = useReveal({ threshold: 0.15 });

  return (
    <Box component="section" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor,
      pt: { xs: 12, md: 14 }, pb: { xs: 8, md: variant === 'image-right' ? 0 : 12 },
      minHeight: { md: variant === 'image-right' ? '78vh' : 'auto' },
      display: 'flex', alignItems: 'center',
    }}>
      {/* Swoosh signature de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', top: { xs: '50%', md: '8%' }, left: { xs: -200, md: -120 },
        width: { xs: 520, md: 720 }, opacity: 0.05, pointerEvents: 'none',
        transform: 'rotate(-8deg)',
      }}>
        <Swoosh width="100%" color={C.navy} accent={C.oro} />
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {variant === 'image-right' ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            alignItems: 'center', gap: { xs: 6, md: 0 },
          }}>
            <Box ref={t.ref} sx={{
              pr: { md: 8 }, pl: { md: 1 },
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
            }}>
              {eyebrow && (
                <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 4 }}>
                  {eyebrow}
                </SectionEyebrow>
              )}
              <SectionTitle
                component="h1"
                before={titleBefore}
                accent={titleAccent}
                after={titleAfter}
                size="xl"
                sx={{ mb: { xs: 3, md: 4 } }}
              />
              {intro && (
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: { xs: '1.125rem', md: '1.3125rem' }, lineHeight: 1.55,
                  color: C.gris, mb: { xs: 4, md: 5 }, maxWidth: 580,
                }}>
                  {intro}
                </Typography>
              )}
              {(cta || ctaSecondary) && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }}>
                  {cta && <CTAArrowLink to={cta.to} label={cta.label} primary />}
                  {ctaSecondary && <CTAArrowLink to={ctaSecondary.to} label={ctaSecondary.label} />}
                </Stack>
              )}
            </Box>

            {image && (
              <Box ref={i.ref} sx={{
                position: 'relative',
                height: { xs: 420, sm: 500, md: '78vh' },
                maxHeight: { md: 720 },
                mx: { xs: -3, md: 0 },
                mr: { md: 'calc(-1 * (100vw - 100%) / 2 - 0px)' },
                overflow: 'hidden',
              }}>
                <Box
                  component="img"
                  src={image}
                  alt={imageAlt || ''}
                  loading="eager"
                  sx={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transform: i.visible ? 'scale(1)' : 'scale(1.07)',
                    transition: 'transform 1.5s cubic-bezier(0.2,0.7,0.2,1)',
                  }}
                />
                {imageCaption && (
                  <Box aria-hidden sx={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(180deg, transparent 55%, ${C.navy}aa 100%)`,
                  }} />
                )}
                {imageCaption && (
                  <Box sx={{
                    position: 'absolute', left: { xs: 16, md: 32 }, right: { xs: 16, md: 32 },
                    bottom: { xs: 16, md: 32 }, color: '#fff',
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.4,
                    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                  }}>
                    {imageCaption}
                  </Box>
                )}
                {imageTag && (
                  <Box sx={{
                    position: 'absolute', top: { xs: 16, md: 32 }, right: { xs: 16, md: 32 },
                    bgcolor: 'rgba(255,255,255,0.92)', color: C.navy,
                    px: 2, py: 0.75, borderRadius: '4px',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                  }}>
                    {imageTag}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          // image-below o no-image: layout centrado, más editorial-magazine
          <Box ref={t.ref} sx={{
            maxWidth: 920,
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
          }}>
            {eyebrow && (
              <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 4 }}>
                {eyebrow}
              </SectionEyebrow>
            )}
            <SectionTitle
              component="h1"
              before={titleBefore}
              accent={titleAccent}
              after={titleAfter}
              size="xl"
              sx={{ mb: { xs: 3, md: 4 } }}
            />
            {intro && (
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.125rem', md: '1.3rem' }, lineHeight: 1.55,
                color: C.gris, mb: 4, maxWidth: 640,
              }}>
                {intro}
              </Typography>
            )}
            {(cta || ctaSecondary) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }}>
                {cta && <CTAArrowLink to={cta.to} label={cta.label} primary />}
                {ctaSecondary && <CTAArrowLink to={ctaSecondary.to} label={ctaSecondary.label} />}
              </Stack>
            )}

            {image && variant === 'image-below' && (
              <Box ref={i.ref} sx={{
                mt: { xs: 6, md: 10 },
                borderRadius: '12px', overflow: 'hidden',
                aspectRatio: '21/9', maxHeight: 540,
                boxShadow: `0 24px 60px ${C.navy}22`,
              }}>
                <Box component="img" src={image} alt={imageAlt || ''} loading="eager"
                  sx={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transform: i.visible ? 'scale(1)' : 'scale(1.05)',
                    transition: 'transform 1.4s cubic-bezier(0.2,0.7,0.2,1)',
                  }} />
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

// ─── CTAArrowLink ───────────────────────────────────────────────────────────

export function CTAArrowLink({ to, label, primary, onClick }) {
  if (primary) {
    return (
      <Box
        component={to ? RouterLink : 'button'}
        to={to}
        onClick={onClick}
        type={onClick ? 'button' : undefined}
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1.05rem', fontWeight: 700,
          color: C.navy, textDecoration: 'none', border: 'none', background: 'none',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 1.25,
          pb: 0.5,
          borderBottom: `2px solid ${C.navy}`,
          transition: 'gap 0.3s ease, color 0.3s ease, border-color 0.3s ease',
          '&:hover': { gap: 2, color: C.verde, borderColor: C.verde },
        }}
      >
        {label}
        <ArrowForward sx={{ fontSize: 20 }} />
      </Box>
    );
  }
  return (
    <Box
      component={to ? RouterLink : 'button'}
      to={to}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.95rem', fontWeight: 600,
        color: C.gris, textDecoration: 'none', border: 'none', background: 'none',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 1,
        transition: 'color 0.3s ease',
        '&:hover': { color: C.navy },
      }}
    >
      {label} →
    </Box>
  );
}

// ─── EditorialIntro (con drop cap opcional) ─────────────────────────────────

export function EditorialIntro({ children, dropCap, color = C.navy }) {
  return (
    <Typography sx={{
      fontFamily: '"DM Sans", sans-serif',
      fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: 1.65,
      color,
      ...(dropCap && {
        '&::first-letter': {
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '4rem', fontWeight: 700, color: C.verde,
          float: 'left', lineHeight: 0.85, mr: 1.5, mt: 0.5,
        },
      }),
    }}>
      {children}
    </Typography>
  );
}

// ─── PullQuote ──────────────────────────────────────────────────────────────

export function PullQuote({ children, author, bgcolor = C.cremaCalida }) {
  return (
    <Box sx={{
      position: 'relative', py: { xs: 6, md: 9 },
      px: { xs: 3, md: 6 }, bgcolor,
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <Box aria-hidden sx={{
        position: 'absolute', top: -10, left: 4, opacity: 0.18,
      }}>
        <BigQuote color={C.oro} size={180} />
      </Box>
      <Box sx={{ position: 'relative', maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
        <Typography component="blockquote" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontStyle: 'italic', fontWeight: 400,
          fontSize: { xs: '1.5rem', md: '2.1rem' }, lineHeight: 1.25,
          color: C.navy, m: 0,
        }}>
          “{children}”
        </Typography>
        {author && (
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: C.gris, mt: 3,
          }}>
            — {author}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── SignatureMark ──────────────────────────────────────────────────────────

export function SignatureMark({ children, color = C.oro, sx }) {
  return (
    <Typography sx={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: 'italic', fontSize: '0.95rem', color, ...sx,
    }}>
      {children}
    </Typography>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────

export function EditorialSection({ children, bgcolor = C.blanco, py = { xs: 7, md: 12 }, id }) {
  return (
    <Box component="section" id={id} sx={{ bgcolor, py, position: 'relative', overflow: 'hidden' }}>
      <Container maxWidth="xl">
        {children}
      </Container>
    </Box>
  );
}
