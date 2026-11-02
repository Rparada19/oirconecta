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
  verde: '#4054B2',
  oro: '#4C7DF0',
  oroSuave: '#9DB8FF',
  arena: '#D5DDF0',
  cremaCalida: '#EEF2FC',
  blanco: '#F6F8FD',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
  border: '#E1E6F2',
};

// ─── SectionEyebrow ─────────────────────────────────────────────────────────

export function SectionEyebrow({ children, color = C.navy, dash = C.oro, sx }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.75} sx={sx}>
      <Box sx={{ width: 32, height: 2, bgcolor: dash }} />
      <Typography sx={{
        fontFamily: '"Gotham", sans-serif',
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
      fontFamily: '"Gotham", sans-serif',
      fontSize: sizes[size], fontWeight: 800,
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
  bgcolor, // ignorado: el diseño 2027 usa hero azul profundo en todas las páginas
}) {
  const t = useReveal({ threshold: 0.1 });
  const i = useReveal({ threshold: 0.15 });

  return (
    <Box component="section" sx={{
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(120% 90% at 80% 20%, #2C3E8F 0%, #1B2550 55%, #141B3D 100%)',
      color: '#fff',
      pt: { xs: 8, md: 11 }, pb: { xs: 8, md: 11 },
      display: 'flex', alignItems: 'center',
    }}>
      {/* Swoosh signature de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', top: { xs: '50%', md: '8%' }, left: { xs: -200, md: -120 },
        width: { xs: 520, md: 720 }, opacity: 0.05, pointerEvents: 'none',
        transform: 'rotate(-8deg)',
      }}>
        <Swoosh width="100%" color="#9DB8FF" accent={C.oro} />
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {variant === 'image-right' ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            alignItems: 'center', gap: { xs: 6, md: 4 },
          }}>
            <Box ref={t.ref} sx={{
              pr: { md: 8 }, pl: { md: 1 },
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
            }}>
              {eyebrow && (
                <SectionEyebrow color="#9DB8FF" dash="#4C7DF0" sx={{ mb: 4 }}>
                  {eyebrow}
                </SectionEyebrow>
              )}
              <SectionTitle
                component="h1"
                before={titleBefore}
                accent={titleAccent}
                after={titleAfter}
                size="xl"
                accentColor="#9DB8FF"
                sx={{ mb: { xs: 3, md: 4 }, color: '#fff', fontWeight: 900, textWrap: 'balance' }}
              />
              {intro && (
                <Typography sx={{
                  fontFamily: '"Gotham", sans-serif',
                  fontSize: { xs: '1.125rem', md: '1.3125rem' }, lineHeight: 1.55,
                  color: '#C3CDE6', mb: { xs: 4, md: 5 }, maxWidth: 580,
                }}>
                  {intro}
                </Typography>
              )}
              {(cta || ctaSecondary) && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }}>
                  {cta && <CTAArrowLink to={cta.to} label={cta.label} primary light />}
                  {ctaSecondary && <CTAArrowLink to={ctaSecondary.to} label={ctaSecondary.label} light />}
                </Stack>
              )}
            </Box>

            {image && (
              <Box ref={i.ref} sx={{
                position: 'relative',
                height: { xs: 360, sm: 440, md: 520 },
                borderRadius: '28px',
                boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
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
                    fontFamily: '"Gotham", sans-serif',
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
                    px: 2, py: 0.75, borderRadius: '999px',
                    fontFamily: '"Gotham", sans-serif',
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
              <SectionEyebrow color="#9DB8FF" dash="#4C7DF0" sx={{ mb: 4 }}>
                {eyebrow}
              </SectionEyebrow>
            )}
            <SectionTitle
              component="h1"
              before={titleBefore}
              accent={titleAccent}
              after={titleAfter}
              size="xl"
              accentColor="#9DB8FF"
              sx={{ mb: { xs: 3, md: 4 }, color: '#fff', fontWeight: 900, textWrap: 'balance' }}
            />
            {intro && (
              <Typography sx={{
                fontFamily: '"Gotham", sans-serif',
                fontSize: { xs: '1.125rem', md: '1.3rem' }, lineHeight: 1.55,
                color: '#C3CDE6', mb: 4, maxWidth: 640,
              }}>
                {intro}
              </Typography>
            )}
            {(cta || ctaSecondary) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }}>
                {cta && <CTAArrowLink to={cta.to} label={cta.label} primary light />}
                {ctaSecondary && <CTAArrowLink to={ctaSecondary.to} label={ctaSecondary.label} light />}
              </Stack>
            )}

            {image && variant === 'image-below' && (
              <Box ref={i.ref} sx={{
                mt: { xs: 6, md: 10 },
                borderRadius: '28px', overflow: 'hidden',
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

export function CTAArrowLink({ to, label, primary, onClick, light }) {
  const base = {
    fontFamily: '"Gotham", sans-serif', textDecoration: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, minHeight: 48,
    borderRadius: 999, transition: 'all 0.25s ease',
    '&:focus-visible': { outline: '3px solid #9DB8FF', outlineOffset: 3 },
  };
  if (primary) {
    return (
      <Box component={to ? RouterLink : 'button'} to={to} onClick={onClick} type={onClick ? 'button' : undefined}
        sx={{
          ...base, fontSize: '1rem', fontWeight: 700, px: 3.25, py: 1.75, border: 'none',
          bgcolor: light ? '#4C7DF0' : '#1B2550', color: '#fff',
          '&:hover': { bgcolor: light ? '#fff' : '#4054B2', color: light ? '#1B2550' : '#fff', gap: 1.5 },
        }}>
        {label}
        <ArrowForward sx={{ fontSize: 18 }} />
      </Box>
    );
  }
  return (
    <Box component={to ? RouterLink : 'button'} to={to} onClick={onClick} type={onClick ? 'button' : undefined}
      sx={{
        ...base, fontSize: '0.95rem', fontWeight: 700, px: 3, py: 1.5, background: 'none',
        color: light ? '#fff' : '#1B2550',
        border: light ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid #DDE3F3',
        '&:hover': { borderColor: light ? '#fff' : '#1B2550' },
      }}>
      {label}
    </Box>
  );
}

// ─── EditorialIntro (con drop cap opcional) ─────────────────────────────────

export function EditorialIntro({ children, dropCap, color = C.navy }) {
  return (
    <Typography sx={{
      fontFamily: '"Gotham", sans-serif',
      fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: 1.65,
      color,
      ...(dropCap && {
        '&::first-letter': {
          fontFamily: '"Gotham", sans-serif',
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
          fontFamily: '"Gotham", sans-serif',
          fontStyle: 'italic', fontWeight: 400,
          fontSize: { xs: '1.5rem', md: '2.1rem' }, lineHeight: 1.25,
          color: C.navy, m: 0,
        }}>
          “{children}”
        </Typography>
        {author && (
          <Typography sx={{
            fontFamily: '"Gotham", sans-serif',
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
      fontFamily: '"Gotham", sans-serif',
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
