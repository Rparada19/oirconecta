import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, IconButton, Stack, InputBase } from '@mui/material';
import {
  Menu as MenuIcon, Close as CloseIcon, Search as SearchIcon,
  ArrowForward, WhatsApp, ExpandLess, ExpandMore,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import { PROFESIONES_CATALOGO } from '../utils/profesionFilter';
import { directoryProfesionToSlug } from '../utils/directoryPresentation';
import { getWhatsAppHref } from '../config/publicSite';

const C = {
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

// ─────────────────────────────────────────────────────────────────────────────
// Datos de marca y menu

const BRANDS_AUDIFONOS = [
  { name: 'Widex',       slug: 'widex',        color: '#1A1A1A' },
  { name: 'Oticon',      slug: 'oticon',       color: '#6E2585' },
  { name: 'Phonak',      slug: 'phonak',       color: '#008C45' },
  { name: 'Signia',      slug: 'signia',       color: '#DC143C' },
  { name: 'ReSound',     slug: 'resound',      color: '#C9342B' },
  { name: 'Starkey',     slug: 'starkey',      color: '#F0B400' },
  { name: 'Beltone',     slug: 'beltone',      color: '#2E7D32' },
  { name: 'Rexton',      slug: 'rexton',       color: '#F0B400' },
  { name: 'Bernafon',    slug: 'bernafon',     color: '#C9342B' },
  { name: 'AudioService', slug: 'audioservice', color: '#FCD303' },
  { name: 'Hansaton',    slug: 'hansaton',     color: '#003DA5' },
  { name: 'Unitron',     slug: 'unitron',      color: '#0066B2' },
  { name: 'Sonic',       slug: 'sonic',        color: '#2D2D2D' },
];

const BRANDS_IMPLANTES = [
  { name: 'Cochlear',         slug: 'cochlear',          color: '#F0B400' },
  { name: 'Advanced Bionics', slug: 'advanced-bionics',  color: '#003DA5' },
  { name: 'MED-EL',           slug: 'medel',             color: '#C9342B' },
];

const PROFESIONES_MENU = PROFESIONES_CATALOGO.map((p) => ({
  label: p, to: `/directorio/profesion/${directoryProfesionToSlug(p)}`,
}));

const CIUDADES_TOP = [
  { label: 'Bogotá', slug: 'bogota' },
  { label: 'Medellín', slug: 'medellin' },
  { label: 'Cali', slug: 'cali' },
  { label: 'Barranquilla', slug: 'barranquilla' },
];

const BLOG_CATEGORIAS = [
  { label: 'Guías y educación',     to: '/blog?categoria=guias' },
  { label: 'Comparativas',          to: '/blog?categoria=comparativas' },
  { label: 'Tecnología y novedades', to: '/blog?categoria=tecnologia' },
  { label: 'Casos y testimonios',   to: '/blog?categoria=casos' },
  { label: 'Glosario auditivo',     to: '/blog?categoria=glosario' },
];

const NAV = [
  { key: 'audifonos',    label: 'Audífonos',         to: '/audifonos',         hasMega: true },
  { key: 'implantes',    label: 'Implantes',         to: '/implantes',         hasMega: true },
  { key: 'directorio',   label: 'Directorio',        to: '/directorio/listado', hasMega: true },
  { key: 'simulador',    label: 'Ponte en sus oídos', to: '/ponte-en-sus-oidos', badge: 'Nuevo', italic: true },
  { key: 'blog',         label: 'Blog',              to: '/blog',              hasMega: true },
];

// ─────────────────────────────────────────────────────────────────────────────

function useScrollState() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

// ─────────────────────────────────────────────────────────────────────────────

function MegaPanel({ open, children, onMouseEnter, onMouseLeave }) {
  return (
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        position: 'absolute', left: 0, right: 0, top: '100%',
        bgcolor: '#fff', color: C.navy,
        boxShadow: `0 24px 60px ${C.navy}1f`,
        borderTop: `1px solid ${C.border}`,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.25s ease, transform 0.3s ease',
        zIndex: 5,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {children}
      </Container>
    </Box>
  );
}

function MegaAudifonos({ navigate, onClose }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { md: '5fr 7fr 4fr' }, gap: 6,
    }}>
      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Por tipo
        </Typography>
        <Stack spacing={1.25}>
          {['Retroauricular (RIC / BTE)', 'Intracanal (ITC / ITE)', 'Invisibles (CIC / IIC)', 'Recargables', 'Resistentes al agua'].map((t) => (
            <Box key={t} component={RouterLink} to="/audifonos" onClick={onClose} sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
              color: C.navy, textDecoration: 'none',
              transition: 'color 0.2s', '&:hover': { color: C.verde },
            }}>
              {t}
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 1.5 }}>
            Tienda
          </Typography>
          <Box component={RouterLink} to="/ecommerce" onClick={onClose} sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem', fontWeight: 700,
            color: C.navy, textDecoration: 'none',
            '&:hover': { gap: 1.5, color: C.verde },
            transition: 'all 0.25s ease',
          }}>
            <ShoppingBagOutlined sx={{ fontSize: 18 }} />
            Accesorios y consumibles
            <ArrowForward sx={{ fontSize: 14 }} />
          </Box>
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Marcas disponibles en Colombia
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5,
        }}>
          {BRANDS_AUDIFONOS.map((b) => (
            <Box
              key={b.slug}
              component={RouterLink}
              to={`/audifonos/${b.slug}`}
              onClick={onClose}
              sx={{
                display: 'flex', alignItems: 'center',
                px: 1.75, py: 1.25, borderRadius: '8px',
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
                fontWeight: 700, color: C.navy, textDecoration: 'none',
                border: `1px solid ${C.border}`,
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: b.color, color: b.color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 18px ${C.navy}14`,
                },
              }}
            >
              <Box sx={{ width: 3, height: 18, bgcolor: b.color, mr: 1.5, borderRadius: '999px' }} />
              {b.name}
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Te recomendamos
        </Typography>
        <Box
          component={RouterLink}
          to="/blog/guia-elegir-primer-audifono"
          onClick={onClose}
          sx={{
            display: 'block', textDecoration: 'none', color: 'inherit',
            borderRadius: '10px', overflow: 'hidden',
            border: `1px solid ${C.border}`,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-3px)', '& img': { transform: 'scale(1.04)' } },
          }}
        >
          <Box sx={{ aspectRatio: '16/9', overflow: 'hidden' }}>
            <Box component="img" src="/img/blog/audifono-receiver-ric.jpg" alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 0.6s ease' }} />
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.verde, mb: 0.5 }}>
              Guía
            </Typography>
            <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.25, color: C.navy }}>
              Cómo elegir tu primer audífono sin que te vendan humo.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function MegaImplantes({ navigate, onClose }) {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: { md: '1fr 1fr 1fr' }, gap: 6,
    }}>
      {BRANDS_IMPLANTES.map((b) => (
        <Box
          key={b.slug}
          component={RouterLink}
          to={`/implantes/${b.slug}`}
          onClick={onClose}
          sx={{
            display: 'block', textDecoration: 'none', color: 'inherit',
            p: 3, borderRadius: '10px', border: `1px solid ${C.border}`,
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: b.color, transform: 'translateY(-3px)', boxShadow: `0 16px 32px ${C.navy}14` },
          }}
        >
          <Box sx={{ width: 4, height: 28, bgcolor: b.color, borderRadius: '999px', mb: 2 }} />
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: C.navy, mb: 0.5 }}>
            {b.name}
          </Typography>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: C.gris, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Ver soluciones implantables
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function MegaDirectorio({ navigate, onClose }) {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: { md: '4fr 4fr 5fr' }, gap: 6,
    }}>
      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Por especialidad
        </Typography>
        <Stack spacing={1.25}>
          {PROFESIONES_MENU.map((p) => (
            <Box key={p.to} component={RouterLink} to={p.to} onClick={onClose} sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
              color: C.navy, textDecoration: 'none',
              transition: 'color 0.2s', '&:hover': { color: C.verde },
            }}>
              {p.label}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Ciudades principales
        </Typography>
        <Stack spacing={1.25}>
          {CIUDADES_TOP.map((c) => (
            <Box key={c.slug} component={RouterLink} to={`/directorio/ciudad/${c.slug}`} onClick={onClose} sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
              color: C.navy, textDecoration: 'none',
              transition: 'color 0.2s', '&:hover': { color: C.verde },
            }}>
              {c.label}
            </Box>
          ))}
          <Box component={RouterLink} to="/directorio/listado" onClick={onClose} sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', fontWeight: 700,
            color: C.verde, textDecoration: 'none', mt: 1,
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            '&:hover': { gap: 1.25 }, transition: 'gap 0.25s ease',
          }}>
            Ver todas las ciudades <ArrowForward sx={{ fontSize: 14 }} />
          </Box>
        </Stack>
      </Box>

      <Box
        component={RouterLink}
        to="/directorio/listado"
        onClick={onClose}
        sx={{
          display: 'block', textDecoration: 'none', color: 'inherit',
          borderRadius: '10px', overflow: 'hidden', position: 'relative',
          minHeight: 220, bgcolor: C.navy, color: '#fff',
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-3px)' },
        }}
      >
        <Box component="img" src="/img/directorio-profesionales-audicion.jpg" alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
        <Box sx={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${C.navy}99 0%, ${C.navy} 100%)`,
        }} />
        <Box sx={{ position: 'relative', p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 220 }}>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 1 }}>
            Red verificada
          </Typography>
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2, mb: 1.5 }}>
            Profesionales auditivos en toda Colombia.
          </Typography>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', fontWeight: 700, color: C.oro, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            Explorar el directorio <ArrowForward sx={{ fontSize: 14 }} />
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function MegaBlog({ navigate, onClose }) {
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: { md: '4fr 5fr 5fr' }, gap: 6,
    }}>
      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Categorías
        </Typography>
        <Stack spacing={1.25}>
          {BLOG_CATEGORIAS.map((c) => (
            <Box key={c.to} component={RouterLink} to={c.to} onClick={onClose} sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
              color: C.navy, textDecoration: 'none',
              transition: 'color 0.2s', '&:hover': { color: C.verde },
            }}>
              {c.label}
            </Box>
          ))}
          <Box component={RouterLink} to="/blog" onClick={onClose} sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', fontWeight: 700,
            color: C.verde, textDecoration: 'none', mt: 1,
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            '&:hover': { gap: 1.25 }, transition: 'gap 0.25s ease',
          }}>
            Ver todos los artículos <ArrowForward sx={{ fontSize: 14 }} />
          </Box>
        </Stack>
      </Box>

      <Box>
        <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.oro, mb: 2 }}>
          Los más leídos
        </Typography>
        <Stack spacing={2.25}>
          {[
            { titulo: 'Cómo elegir tu primer audífono', slug: 'guia-elegir-primer-audifono', cover: '/img/blog/audifono-receiver-ric.jpg' },
            { titulo: 'Tipos de pérdida auditiva', slug: 'tipos-de-perdida-auditiva', cover: '/img/clinica-audiologia-tratamiento.jpg' },
            { titulo: 'Cuándo cambiar de audífono', slug: 'vida-util-audifono', cover: '/img/audifono-tecnologia-moderna.jpg' },
          ].map((a) => (
            <Box
              key={a.slug}
              component={RouterLink}
              to={`/blog/${a.slug}`}
              onClick={onClose}
              sx={{
                display: 'flex', gap: 1.5, alignItems: 'center', textDecoration: 'none', color: 'inherit',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateX(4px)', '& .oc-blog-title': { color: C.verde } },
              }}
            >
              <Box sx={{ width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <Box component="img" src={a.cover} alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </Box>
              <Typography className="oc-blog-title" sx={{
                fontFamily: '"Playfair Display", Georgia, serif', fontSize: '0.95rem',
                fontWeight: 600, color: C.navy, lineHeight: 1.3,
                transition: 'color 0.2s',
              }}>
                {a.titulo}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box
        component={RouterLink}
        to="/blog/menopausia-audicion"
        onClick={onClose}
        sx={{
          display: 'block', textDecoration: 'none', color: 'inherit',
          borderRadius: '10px', overflow: 'hidden',
          border: `1px solid ${C.border}`, height: '100%',
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'translateY(-3px)', '& img': { transform: 'scale(1.04)' } },
        }}
      >
        <Box sx={{ aspectRatio: '4/3', overflow: 'hidden' }}>
          <Box component="img" src="/img/directorio-profesionales-audicion.jpg" alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.6s ease' }} />
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.oro, mb: 0.75 }}>
            Último publicado
          </Typography>
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.25, color: C.navy, mb: 1 }}>
            Menopausia y audición: lo que está pasando en tus oídos.
          </Typography>
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', fontWeight: 700, color: C.verde, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            Leer artículo <ArrowForward sx={{ fontSize: 14 }} />
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE FULL-SCREEN OVERLAY

function MobileMenu({ open, onClose, navigate, onOpenSearch }) {
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    if (!open) setExpanded(null);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (to) => { navigate(to); onClose(); };

  const SECTIONS = [
    { key: 'audifonos', label: 'Audífonos', children: BRANDS_AUDIFONOS.map((b) => ({ label: b.name, to: `/audifonos/${b.slug}` })) },
    { key: 'implantes', label: 'Implantes', children: BRANDS_IMPLANTES.map((b) => ({ label: b.name, to: `/implantes/${b.slug}` })) },
    { key: 'directorio', label: 'Directorio', children: [
      ...PROFESIONES_MENU,
      ...CIUDADES_TOP.map((c) => ({ label: `Ciudad: ${c.label}`, to: `/directorio/ciudad/${c.slug}` })),
      { label: 'Ver todos los profesionales', to: '/directorio/listado' },
    ] },
    { key: 'simulador', label: 'Ponte en sus oídos', to: '/ponte-en-sus-oidos' },
    { key: 'tienda', label: 'Tienda', to: '/ecommerce' },
    { key: 'blog', label: 'Blog', children: [
      { label: 'Todos los artículos', to: '/blog' },
      ...BLOG_CATEGORIAS,
    ] },
    { key: 'nosotros', label: 'Nosotros', to: '/nosotros' },
    { key: 'contacto', label: 'Contacto', to: '/contacto' },
  ];

  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 1500,
      bgcolor: C.cremaCalida, color: C.navy,
      transform: open ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.45s cubic-bezier(0.7,0,0.2,1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP bar fija — logo + cerrar */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 2, borderBottom: `1px solid ${C.border}`,
        pt: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      }}>
        <Box component={RouterLink} to="/" onClick={onClose}
          sx={{ display: 'flex', alignItems: 'center' }}>
          <Box component="img" src="/logo-oirconecta.png" alt="OírConecta" sx={{ height: 32 }} />
        </Box>
        <IconButton onClick={onClose} aria-label="Cerrar menú"
          sx={{ color: C.navy, width: 44, height: 44 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* QUICK ACCESS chip strip — search · contacto · WhatsApp */}
      <Box sx={{
        flexShrink: 0, px: 2.5, py: 2,
        borderBottom: `1px solid ${C.border}`,
        bgcolor: '#fff',
      }}>
        <Stack direction="row" spacing={1.25}>
          <Box
            onClick={onOpenSearch}
            sx={{
              flex: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 1.25,
              bgcolor: `${C.arena}55`, borderRadius: '8px',
              px: 1.5, py: 1.25, minHeight: 44,
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: C.gris,
            }}
          >
            <SearchIcon sx={{ fontSize: 18 }} /> Buscar…
          </Box>
          <Box
            component="a"
            href={getWhatsAppHref()}
            target="_blank" rel="noopener noreferrer"
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: '8px',
              bgcolor: '#25D366', color: '#fff', textDecoration: 'none',
            }}
            aria-label="Contactar por WhatsApp"
          >
            <WhatsApp />
          </Box>
        </Stack>
      </Box>

      {/* NAV scrollable */}
      <Box sx={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        px: 2.5, py: 3,
      }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.24em', textTransform: 'uppercase', color: C.gris, mb: 1.5,
        }}>
          Navegar
        </Typography>

        <Stack spacing={0}>
          {SECTIONS.map((s) => {
            const isOpen = expanded === s.key;
            const hasChildren = !!s.children?.length;
            return (
              <Box key={s.key}>
                <Box
                  onClick={() => {
                    if (hasChildren) setExpanded(isOpen ? null : s.key);
                    else go(s.to);
                  }}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.75, cursor: 'pointer', minHeight: 48,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <Typography sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: { xs: '1.625rem', sm: '1.875rem' }, fontWeight: 500,
                    color: C.navy,
                    fontStyle: s.key === 'simulador' ? 'italic' : 'normal',
                    lineHeight: 1.1, display: 'inline-flex', alignItems: 'center', gap: 1.25,
                  }}>
                    {s.label}
                    {s.key === 'simulador' && (
                      <Box component="span" sx={{
                        fontFamily: '"DM Sans", sans-serif', fontSize: '0.55rem',
                        fontWeight: 700, letterSpacing: '0.15em',
                        bgcolor: C.oro, color: C.navy, px: 0.85, py: 0.3, borderRadius: '4px',
                        verticalAlign: 'middle', lineHeight: 1,
                      }}>NUEVO</Box>
                    )}
                  </Typography>
                  {hasChildren && (
                    <Box sx={{
                      width: 32, height: 32, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: C.gris,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s ease',
                    }}>
                      <ExpandMore />
                    </Box>
                  )}
                </Box>
                {hasChildren && isOpen && (
                  <Stack spacing={0} sx={{
                    pl: 1.5, pb: 1.5,
                    animation: 'oc-fade 0.3s ease',
                    '@keyframes oc-fade': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                  }}>
                    {s.children.map((c) => (
                      <Box key={c.to} onClick={() => go(c.to)} sx={{
                        py: 1.25, cursor: 'pointer', minHeight: 40,
                        fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
                        color: C.gris,
                        '&:active': { color: C.verde, transform: 'translateX(2px)' },
                        transition: 'all 0.15s ease',
                      }}>
                        {c.label}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>

        {/* Utility links al final */}
        <Stack spacing={0.5} sx={{ mt: 4, pt: 3, borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'Soy profesional · únete a la red', to: '/registro-profesional' },
            { label: 'Iniciar sesión profesional', to: '/login-directorio' },
          ].map((u) => (
            <Box key={u.to} onClick={() => go(u.to)} sx={{
              py: 1.25, cursor: 'pointer', minHeight: 40,
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem',
              color: C.gris,
            }}>
              → {u.label}
            </Box>
          ))}
        </Stack>

        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic',
          fontSize: '0.95rem', color: `${C.navy}66`, mt: 4, mb: 12, textAlign: 'center',
        }}>
          Escucha. Conecta. Vive mejor.
        </Typography>
      </Box>

      {/* CTA fija al fondo */}
      <Box sx={{
        flexShrink: 0,
        position: 'sticky', bottom: 0,
        bgcolor: '#fff',
        borderTop: `1px solid ${C.border}`,
        px: 2.5, py: 2,
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        boxShadow: `0 -8px 20px ${C.navy}10`,
      }}>
        <Box
          component={RouterLink}
          to="/directorio/listado" onClick={onClose}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25,
            bgcolor: C.navy, color: '#fff', borderRadius: '8px',
            px: 3, py: 1.85, textDecoration: 'none',
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem', fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: `0 8px 20px ${C.navy}22`,
          }}
        >
          Encontrar especialista <ArrowForward sx={{ fontSize: 18 }} />
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH OVERLAY

function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const onKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && q.trim()) {
      navigate(`/directorio/listado?q=${encodeURIComponent(q.trim())}`);
      onClose();
    }
  }, [q, navigate, onClose]);

  const QUICK = [
    { label: 'Audiólogo en Bogotá', to: '/directorio/ciudad/bogota' },
    { label: 'Audífonos Widex', to: '/audifonos/widex' },
    { label: 'Implantes Cochlear', to: '/implantes/cochlear' },
    { label: 'Ponte en sus oídos', to: '/ponte-en-sus-oidos' },
    { label: 'Cómo elegir tu primer audífono', to: '/blog/guia-elegir-primer-audifono' },
    { label: 'Tienda · Accesorios y consumibles', to: '/ecommerce' },
  ];

  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 1600,
      bgcolor: 'rgba(27,34,64,0.92)',
      backdropFilter: 'blur(14px)',
      opacity: open ? 1 : 0,
      pointerEvents: open ? 'auto' : 'none',
      transition: 'opacity 0.3s ease',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      pt: { xs: 8, md: 18 }, px: 3,
    }} onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()} sx={{
        width: '100%', maxWidth: 720,
        transform: open ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'transform 0.35s ease',
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{
          bgcolor: '#fff', borderRadius: '12px', px: 3, py: 2,
          boxShadow: `0 24px 60px ${C.navy}55`,
        }}>
          <SearchIcon sx={{ color: C.gris, fontSize: 24 }} />
          <InputBase
            inputRef={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar audiólogo, marca, ciudad o artículo…"
            sx={{
              flex: 1,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '1.2rem', md: '1.5rem' }, fontStyle: 'italic',
              color: C.navy,
            }}
          />
          <IconButton onClick={onClose} aria-label="Cerrar" sx={{ color: C.gris }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ mt: 3, color: '#fff' }}>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '0.65rem', fontWeight: 700,
            letterSpacing: '0.24em', textTransform: 'uppercase', color: C.oro, mb: 1.5,
          }}>
            Sugerencias
          </Typography>
          <Stack spacing={1.25}>
            {QUICK.map((s) => (
              <Box
                key={s.to}
                onClick={() => { navigate(s.to); onClose(); }}
                sx={{
                  cursor: 'pointer',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.1rem', md: '1.35rem' }, fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.85)',
                  '&:hover': { color: '#fff' },
                  transition: 'color 0.2s',
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                }}
              >
                → {s.label}
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.55)', mt: 4, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          ESC para cerrar · Enter para buscar
        </Typography>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER PRINCIPAL

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrollState();
  const [openMega, setOpenMega] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef(null);

  // Detectar páginas con hero oscuro: la home (transparent en top sobre hero claro,
  // se ve negro). Sobre fondo claro siempre dark navy.
  const useDarkText = true;

  // Atajo Cmd+K para abrir search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openMegaNow = (key) => {
    clearTimeout(closeTimer.current);
    setOpenMega(key);
  };
  const closeMegaSoon = () => {
    closeTimer.current = setTimeout(() => setOpenMega(null), 150);
  };

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      {/* Pre-header strip — en móvil solo deja el WhatsApp corto a la derecha */}
      <Box sx={{
        bgcolor: C.navy, color: '#fff',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.72rem', py: 0.75,
        pt: 'calc(env(safe-area-inset-top, 0px) + 6px)',
      }}>
        <Container maxWidth="xl" sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 2,
        }}>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic', fontSize: '0.78rem', color: C.oro,
            display: { xs: 'none', sm: 'block' },
          }}>
            Escucha. Conecta. Vive mejor.
          </Typography>
          <Stack direction="row" spacing={{ xs: 2, sm: 3 }} alignItems="center" sx={{ ml: 'auto' }}>
            <Box
              component="a"
              href={getWhatsAppHref()}
              target="_blank" rel="noopener noreferrer"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75,
                color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { color: '#fff' }, transition: 'color 0.2s' }}
            >
              <WhatsApp sx={{ fontSize: 14 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Línea de orientación
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                WhatsApp
              </Box>
            </Box>
            <Box
              component={RouterLink}
              to="/registro-profesional"
              sx={{
                color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                display: { xs: 'none', md: 'inline' },
                '&:hover': { color: '#fff' }, transition: 'color 0.2s',
              }}
            >
              ¿Eres profesional? Únete a la red
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Header principal */}
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 1100,
          bgcolor: scrolled ? 'rgba(251,250,248,0.96)' : C.blanco,
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          color: C.navy,
          borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
          transition: 'background 0.3s ease, border-color 0.3s ease, padding 0.3s ease',
          py: scrolled ? 1 : 1.75,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {/* LOGO */}
            <Box component={RouterLink} to="/"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Box component="img" src="/logo-oirconecta.png" alt="OírConecta"
                sx={{ height: scrolled ? 36 : 44, transition: 'height 0.3s ease', display: 'block' }} />
            </Box>

            {/* NAV desktop */}
            <Stack
              direction="row" spacing={0}
              sx={{ ml: 4, display: { xs: 'none', lg: 'flex' }, flex: 1 }}
            >
              {NAV.map((n) => {
                const active = isActive(n.to);
                const open = openMega === n.key;
                return (
                  <Box
                    key={n.key}
                    onMouseEnter={() => n.hasMega && openMegaNow(n.key)}
                    onMouseLeave={() => n.hasMega && closeMegaSoon()}
                    sx={{ position: 'static' }}
                  >
                    <Box
                      component={RouterLink}
                      to={n.to}
                      sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 1,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.92rem', fontWeight: 600,
                        color: C.navy, textDecoration: 'none',
                        px: 2, py: 1.5,
                        position: 'relative',
                        fontStyle: n.italic ? 'italic' : 'normal',
                        '&::after': {
                          content: '""', position: 'absolute',
                          left: 16, right: 16, bottom: 6, height: 2,
                          bgcolor: C.navy,
                          transform: (active || open) ? 'scaleX(1)' : 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        },
                        '&:hover::after': { transform: 'scaleX(1)' },
                      }}
                    >
                      {n.label}
                      {n.badge && (
                        <Box component="span" sx={{
                          fontFamily: '"DM Sans", sans-serif', fontSize: '0.55rem',
                          fontWeight: 700, letterSpacing: '0.15em',
                          bgcolor: C.oro, color: C.navy,
                          px: 0.75, py: 0.25, borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}>{n.badge}</Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>

            {/* RIGHT ACTIONS */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
              <IconButton onClick={() => setSearchOpen(true)} aria-label="Buscar (Cmd+K)"
                sx={{ color: C.navy }}>
                <SearchIcon />
              </IconButton>
              <IconButton
                component={RouterLink}
                to="/ecommerce"
                aria-label="Ir a la tienda"
                sx={{ color: C.navy }}
              >
                <ShoppingBagOutlined />
              </IconButton>
              <Box
                component={RouterLink}
                to="/directorio/listado"
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  alignItems: 'center', gap: 1,
                  bgcolor: C.navy, color: '#fff',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.875rem', fontWeight: 700,
                  px: 2.5, py: 1.25, borderRadius: '6px',
                  textDecoration: 'none', letterSpacing: '0.02em',
                  boxShadow: `0 6px 16px ${C.navy}22`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: C.navyDark,
                    boxShadow: `0 10px 22px ${C.navy}33`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Encontrar especialista
                <ArrowForward sx={{ fontSize: 16 }} />
              </Box>

              {/* Mobile menu trigger */}
              <IconButton
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                sx={{ color: C.navy, display: { xs: 'inline-flex', lg: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          </Box>
        </Container>

        {/* MEGA PANELS — fuera del Container para ocupar 100% del header */}
        <MegaPanel
          open={openMega === 'audifonos'}
          onMouseEnter={() => openMegaNow('audifonos')}
          onMouseLeave={closeMegaSoon}
        >
          <MegaAudifonos navigate={navigate} onClose={() => setOpenMega(null)} />
        </MegaPanel>

        <MegaPanel
          open={openMega === 'implantes'}
          onMouseEnter={() => openMegaNow('implantes')}
          onMouseLeave={closeMegaSoon}
        >
          <MegaImplantes navigate={navigate} onClose={() => setOpenMega(null)} />
        </MegaPanel>

        <MegaPanel
          open={openMega === 'directorio'}
          onMouseEnter={() => openMegaNow('directorio')}
          onMouseLeave={closeMegaSoon}
        >
          <MegaDirectorio navigate={navigate} onClose={() => setOpenMega(null)} />
        </MegaPanel>

        <MegaPanel
          open={openMega === 'blog'}
          onMouseEnter={() => openMegaNow('blog')}
          onMouseLeave={closeMegaSoon}
        >
          <MegaBlog navigate={navigate} onClose={() => setOpenMega(null)} />
        </MegaPanel>
      </Box>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navigate={navigate}
        onOpenSearch={() => { setMobileOpen(false); setTimeout(() => setSearchOpen(true), 200); }}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
