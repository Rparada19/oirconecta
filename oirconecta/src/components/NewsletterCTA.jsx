import { Box, Typography } from '@mui/material';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import NewsletterSignup from './NewsletterSignup';

/**
 * Bloque de suscripción para insertar dentro del contenido (final de artículos,
 * secciones de la home, etc.). Tarjeta con gradiente suave + formulario.
 */
export default function NewsletterCTA({
  source = 'blog-cta',
  title = '¿Te sirvió este artículo?',
  subtitle = 'Suscríbete y recibe contenido de salud auditiva cada 15 días, en lenguaje claro.',
}) {
  return (
    <Box
      sx={{
        mt: 6,
        p: { xs: 3, md: 4 },
        borderRadius: 4,
        background:
          'radial-gradient(circle at 15% 0%, rgba(8,89,70,0.10), transparent 55%),' +
          'linear-gradient(135deg, #f4f8f6 0%, #ebf2ee 100%)',
        border: '1px solid rgba(8,89,70,0.12)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <MailOutlineRoundedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        {subtitle}
      </Typography>
      <NewsletterSignup source={source} compact />
    </Box>
  );
}
