import { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, Chip, Stack, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

const FALLBACK = null;
const C = {
  navy: '#272F50', verde: '#085946', oro: '#C9A86A',
  blanco: '#FBFAF8', gris: '#6B7280', grisClaro: '#A1A7B1',
};

function pickImage(profile) {
  if (profile.fotoPerfilUrl) return profile.fotoPerfilUrl;
  if (profile.bannerUrl) return profile.bannerUrl;
  if (Array.isArray(profile.photoUrls) && profile.photoUrls[0]) return profile.photoUrls[0];
  return FALLBACK;
}

function pickProfession(profile) {
  if (profile.profession && profile.profession.nombre) {
    return profile.generoFicha === 'FEMENINO' && profile.profession.nombreFemenino
      ? profile.profession.nombreFemenino
      : profile.profession.nombre;
  }
  return profile.profesion || 'Profesional auditivo';
}

function pickCity(profile) {
  if (profile.city && profile.city.nombre) return profile.city.nombre;
  const principal = (profile.workplaces || []).find((w) => w.esPrincipal) || (profile.workplaces || [])[0];
  return principal && principal.ciudad ? principal.ciudad : null;
}

function pickName(profile) {
  if (profile.nombreConsultorio) return profile.nombreConsultorio;
  if (profile.account && profile.account.nombre) return profile.account.nombre;
  return 'Profesional verificado';
}

const DirectoryCardV2 = memo(function DirectoryCardV2({ profile }) {
  const img = pickImage(profile);
  const ciudad = pickCity(profile);
  const profesion = pickProfession(profile);
  const nombre = pickName(profile);
  const rating = Number(profile.ratingAvg) || 0;
  const reviewsCount = profile.reviewsCount || 0;
  const isFeatured = !!profile.isFeatured;
  const isSponsored = !!profile.isSponsored;
  const polizas = Array.isArray(profile.polizasAceptadas) ? profile.polizasAceptadas : [];

  return (
    <Card
      component={RouterLink}
      to={`/directorio/profesional/${profile.id}`}
      elevation={0}
      sx={{
        textDecoration: 'none', color: 'inherit',
        display: 'flex', flexDirection: 'column',
        position: 'relative', borderRadius: '10px',
        overflow: 'hidden', bgcolor: '#fff', height: '100%',
        border: `1px solid ${C.grisClaro}33`,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 16px 36px ${C.navy}18`,
          borderColor: `${C.navy}33`,
          '& .dirv2-cover': { transform: 'scale(1.04)' },
        },
      }}
    >
      <Box sx={{
        position: 'relative', aspectRatio: '4 / 3', width: '100%',
        overflow: 'hidden',
        background: img
          ? 'transparent'
          : `linear-gradient(135deg, ${C.verde}15 0%, ${C.navy}18 100%)`,
      }}>
        {img ? (
          <Box
            className="dirv2-cover"
            component="img"
            src={img} alt={nombre} loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            sx={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ) : (
          <Box sx={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1.5,
          }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(39,47,80,0.10)',
            }}>
              <PersonOutlineRoundedIcon sx={{ fontSize: 30, color: C.verde }} />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.6875rem', fontWeight: 600,
              color: C.gris, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Perfil verificado
            </Typography>
          </Box>
        )}

        {/* Badges flotantes */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ position: 'absolute', top: 10, left: 10 }}
        >
          {isSponsored && (
            <Chip
              size="small"
              icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 16 }} />}
              label="Patrocinado"
              sx={{
                bgcolor: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                fontWeight: 700,
                fontSize: 11,
                color: 'secondary.main',
                '& .MuiChip-icon': { color: 'secondary.main' },
              }}
            />
          )}
          {isFeatured && !isSponsored && (
            <Chip
              size="small"
              icon={<VerifiedRoundedIcon sx={{ fontSize: 16 }} />}
              label="Destacado"
              sx={{
                bgcolor: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(6px)',
                fontWeight: 700,
                fontSize: 11,
                color: 'primary.main',
                '& .MuiChip-icon': { color: 'primary.main' },
              }}
            />
          )}
        </Stack>

        {rating > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: 'rgba(15,25,35,0.78)',
              color: '#fff',
              borderRadius: 8,
              px: 1.25,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backdropFilter: 'blur(6px)',
            }}
          >
            <StarRoundedIcon sx={{ fontSize: 16, color: '#FFC85C' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {rating.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: 11, opacity: 0.8 }}>
              ({reviewsCount})
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 600, fontSize: '1.0625rem',
          color: C.navy, lineHeight: 1.25, letterSpacing: '-0.005em',
          display: '-webkit-box',
          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', mb: 0.5,
        }}>
          {nombre}
        </Typography>

        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.8125rem', fontWeight: 600,
          color: C.verde, letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>
          {profesion}
        </Typography>

        {ciudad && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
            <PlaceRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {ciudad}
            </Typography>
          </Stack>
        )}

        {polizas.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.5 }}>
            {polizas.slice(0, 2).map((p) => (
              <Chip
                key={p}
                label={p}
                size="small"
                sx={{
                  fontSize: 10.5,
                  height: 22,
                  bgcolor: 'grey.50',
                  color: 'text.secondary',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: 'grey.100',
                }}
              />
            ))}
            {polizas.length > 2 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                +{polizas.length - 2}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Card>
  );
});

export default DirectoryCardV2;
