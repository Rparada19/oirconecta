import React, { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from './utils/analytics';
import { initConsent } from './utils/cookieConsent';
import CookieConsentBanner from './components/CookieConsentBanner';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { buildTheme } from './theme';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/crm/ProtectedRoute';
import ProtectedRouteByRole from './components/crm/ProtectedRouteByRole';
import ProtectedDirectoryRoute from './components/directorio/ProtectedDirectoryRoute';
import './utils/clearAllData';

// Páginas públicas (lazy)
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'));
const ServiciosPage = lazy(() => import('./pages/ServiciosPage'));
const AudifonosPage = lazy(() => import('./pages/AudifonosPage'));
const ImplantesPage = lazy(() => import('./pages/ImplantesPage'));
const ContactoPage = lazy(() => import('./pages/ContactoPage'));
const EcommercePage = lazy(() => import('./pages/EcommercePage'));
const ComparadorPage = lazy(() => import('./pages/ComparadorPage'));
const PonteEnSusOidosPage = lazy(() => import('./pages/PonteEnSusOidosPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProtectedAdminRoute = lazy(() => import('./pages/admin/ProtectedAdminRoute'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AgendamientoPage = lazy(() => import('./pages/AgendamientoPage'));
const AgendarControlPage = lazy(() => import('./pages/AgendarControlPage'));
const OtologosPage = lazy(() => import('./pages/OtologosPage'));
const AudiologasPage = lazy(() => import('./pages/AudiologasPage'));
const RegistroProfesionalPage = lazy(() => import('./pages/RegistroProfesionalPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ConfirmAppointmentPage = lazy(() => import('./pages/ConfirmAppointmentPage'));
const RescheduleAppointmentPage = lazy(() => import('./pages/RescheduleAppointmentPage'));
const CancelAppointmentPage = lazy(() => import('./pages/CancelAppointmentPage'));

// Audífonos por marca (lazy)
const AudifonosWidexPage = lazy(() => import('./pages/AudifonosWidexPage'));
const AudifonosOticonPage = lazy(() => import('./pages/AudifonosOticonPage'));
const AudifonosSigniaPage = lazy(() => import('./pages/AudifonosSigniaPage'));
const AudifonosPhonakPage = lazy(() => import('./pages/AudifonosPhonakPage'));
const AudifonosResoundPage = lazy(() => import('./pages/AudifonosResoundPage'));
const AudifonosStarkeyPage = lazy(() => import('./pages/AudifonosStarkeyPage'));
const AudifonosBeltonePage = lazy(() => import('./pages/AudifonosBeltonePage'));
const AudifonosRextonPage = lazy(() => import('./pages/AudifonosRextonPage'));
const AudifonosAudioservicePage = lazy(() => import('./pages/AudifonosAudioservicePage'));
const AudifonosBernafonPage = lazy(() => import('./pages/AudifonosBernafonPage'));
const AudifonosHansatonPage = lazy(() => import('./pages/AudifonosHansatonPage'));
const AudifonosSonicPage = lazy(() => import('./pages/AudifonosSonicPage'));
const AudifonosUnitronPage = lazy(() => import('./pages/AudifonosUnitronPage'));
const ImplantesCochlearPage = lazy(() => import('./pages/ImplantesCochlearPage'));
const ImplantesAdvancedBionicsPage = lazy(() => import('./pages/ImplantesAdvancedBionicsPage'));
const ImplantesMedelPage = lazy(() => import('./pages/ImplantesMedelPage'));

// Directorio público (lazy)
const ProfessionalProfileDemoPage = lazy(() => import('./pages/ProfessionalProfileDemoPage'));
const ProfessionalProfilePage = lazy(() => import('./pages/ProfessionalProfilePage'));
const DirectorioResultadosPage = lazy(() => import('./pages/DirectorioResultadosPage'));
const DirectorioListadoPage = lazy(() => import('./pages/DirectorioListadoPage'));
const FavoritosPage = lazy(() => import('./pages/FavoritosPage'));
const DirectorioProfesionSlugPage = lazy(() => import('./pages/DirectorioProfesionSlugPage'));
const DirectorioProfesionalPage = lazy(() => import('./pages/DirectorioProfesionalPage'));
const DirectorioProfesionalPageV2 = lazy(() => import('./pages/DirectorioProfesionalPageV2'));
const DejarResenaPage = lazy(() => import('./pages/DejarResenaPage'));
const InvitaPage = lazy(() => import('./pages/InvitaPage'));
// F1: directorio Airbnb-grade
const DirectorioAirbnbPage = lazy(() => import('./pages/DirectorioAirbnbPage'));
const DirectorioCiudadPage = lazy(() => import('./pages/DirectorioCiudadPage'));
const DirectorioProfesionPage = lazy(() => import('./pages/DirectorioProfesionPage'));

// Autenticaciones (lazy)
const LoginCRMPage = lazy(() => import('./pages/LoginCRMPage'));
const LoginDirectorioPage = lazy(() => import('./pages/LoginDirectorioPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));

// Portal CRM (lazy)
const PortalCRMPage = lazy(() => import('./pages/PortalCRMPage'));
const CrmShell = lazy(() => import('./components/crm/CrmShell'));
const DashboardPage = lazy(() => import('./pages/crm/DashboardPage'));
const CitasPage = lazy(() => import('./pages/crm/CitasPage'));
const AgendaOirconectaPage = lazy(() => import('./pages/crm/AgendaOirconectaPage'));
const LeadsPage = lazy(() => import('./pages/crm/LeadsPage'));
const PacientesPage = lazy(() => import('./pages/crm/PacientesPage'));
const ControlesPage = lazy(() => import('./pages/crm/ControlesPage'));
const WhatsAppInboxPage = lazy(() => import('./pages/crm/WhatsAppInboxPage'));
const CampanasPage = lazy(() => import('./pages/crm/CampanasPage'));
const ReportesPage = lazy(() => import('./pages/crm/ReportesPage'));
const ConfiguracionPage = lazy(() => import('./pages/crm/ConfiguracionPage'));
const AccionesDiaPage = lazy(() => import('./pages/crm/AccionesDiaPage'));
const ProductosPage = lazy(() => import('./pages/crm/ProductosPage'));
const MiDirectorioPage = lazy(() => import('./pages/directorio/MiDirectorioPage'));

// Portal Profesional (lazy)
const ProfesionalLayout = lazy(() => import('./pages/profesional/ProfesionalLayout'));
const ProfesionalDashboardPage = lazy(() => import('./pages/profesional/ProfesionalDashboardPage'));
const ProfesionalPerfilPage = lazy(() => import('./pages/profesional/ProfesionalPerfilPage'));
const ProfesionalWizardPage = lazy(() => import('./pages/profesional/ProfesionalWizardPage'));
const ProfesionalConsultasPage = lazy(() => import('./pages/profesional/ProfesionalConsultasPage'));
const ProfesionalServiciosPage = lazy(() => import('./pages/profesional/ProfesionalServiciosPage'));
const ProfesionalSuscripcionPage = lazy(() => import('./pages/profesional/ProfesionalSuscripcionPage'));
const ProfesionalAgendaPage = lazy(() => import('./pages/profesional/ProfesionalAgendaPage'));
const ProfesionalIAPage = lazy(() => import('./pages/profesional/ProfesionalIAPage'));
const ProfesionalAnunciatePage = lazy(() => import('./pages/profesional/ProfesionalAnunciatePage'));

// Portal Admin (lazy)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'));
const AdminProfesionalesPage = lazy(() => import('./pages/admin/AdminProfesionalesPage'));
const AdminMarketplacePage = lazy(() => import('./pages/admin/AdminMarketplacePage'));
const AdminPedidosPage = lazy(() => import('./pages/admin/AdminPedidosPage'));
const AdminComparadorPage = lazy(() => import('./pages/admin/AdminComparadorPage'));
const AdminNewsletterPage = lazy(() => import('./pages/admin/AdminNewsletterPage'));
const AdminContactosPage = lazy(() => import('./pages/admin/AdminContactosPage'));
const AdminSuscripcionesPage = lazy(() => import('./pages/admin/AdminSuscripcionesPage'));
const AdminIAPage = lazy(() => import('./pages/admin/AdminIAPage'));
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage'));
const AdminComunicacionesPage = lazy(() => import('./pages/admin/AdminComunicacionesPage'));
const CrmPlantillasPage = lazy(() => import('./pages/crm/PlantillasPage'));
const AdminWhatsAppPage = lazy(() => import('./pages/admin/AdminWhatsAppPage'));
const AdminInsightsPage = lazy(() => import('./pages/admin/AdminInsightsPage'));
const SalesDiaPage = lazy(() => import('./pages/admin/sales/SalesDiaPage'));
const SalesLeadsPage = lazy(() => import('./pages/admin/sales/SalesLeadsPage'));
const SalesLeadDetailPage = lazy(() => import('./pages/admin/sales/SalesLeadDetailPage'));
const SalesReportesPage = lazy(() => import('./pages/admin/sales/SalesReportesPage'));
const CambiarClavePage = lazy(() => import('./pages/profesional/CambiarClavePage'));
const PopupBienvenida = lazy(() => import('./components/marketing/PopupBienvenida'));
const PreviewModeIndicator = lazy(() => import('./components/marketing/PreviewModeIndicator'));

const theme = buildTheme(createTheme);

/**
 * Subcarpeta de despliegue (Vite `base`). Debe coincidir con la URL real (ej. /mi-app/directorio).
 * Valores como `./` o `/` → sin basename (raíz del sitio).
 */
function routerBasename() {
  let base = import.meta.env.BASE_URL;
  if (base == null || base === '' || base === '/' || base === './') return undefined;
  base = String(base).replace(/^\.\//, '/');
  if (base === '/') return undefined;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}


function NotFound() {
  return (
    <Box component="main" sx={{ p: 4, minHeight: '60vh', bgcolor: 'background.default' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        No encontramos esta página
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480 }}>
        Si entraste desde un enlace antiguo o la app está en una subcarpeta, vuelve al inicio.
      </Typography>
      <Button variant="contained" color="primary" component={RouterLink} to="/">
        Ir al inicio
      </Button>
    </Box>
  );
}

function PageLoader() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={40} thickness={4} />
    </Box>
  );
}

// D1 — Envía page_view cada vez que cambia la ruta. Se monta DENTRO del Router
// para tener acceso a useLocation().
function AnalyticsRouteTracker() {
  const location = useLocation();
  useEffect(() => { initConsent(); initAnalytics(); }, []);
  useEffect(() => {
    trackPageView(location.pathname + location.search);
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={routerBasename()}>
        <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <AnalyticsRouteTracker />
        <PreviewModeIndicator />
        <PopupBienvenida />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/ponte-en-sus-oidos" element={<PonteEnSusOidosPage />} />
          <Route path="/simulador-audicion" element={<PonteEnSusOidosPage />} />
          <Route path="/servicios" element={<ServiciosPage />} />
          <Route path="/audifonos" element={<AudifonosPage />} />
          <Route path="/audifonos/widex" element={<AudifonosWidexPage />} />
          <Route path="/audifonos/oticon" element={<AudifonosOticonPage />} />
          <Route path="/audifonos/signia" element={<AudifonosSigniaPage />} />
          <Route path="/audifonos/phonak" element={<AudifonosPhonakPage />} />
          <Route path="/audifonos/resound" element={<AudifonosResoundPage />} />
          <Route path="/audifonos/starkey" element={<AudifonosStarkeyPage />} />
          <Route path="/audifonos/beltone" element={<AudifonosBeltonePage />} />
          <Route path="/audifonos/rexton" element={<AudifonosRextonPage />} />
          <Route path="/audifonos/audioservice" element={<AudifonosAudioservicePage />} />
          <Route path="/audifonos/bernafon" element={<AudifonosBernafonPage />} />
          <Route path="/audifonos/hansaton" element={<AudifonosHansatonPage />} />
          <Route path="/audifonos/sonic" element={<AudifonosSonicPage />} />
          <Route path="/audifonos/unitron" element={<AudifonosUnitronPage />} />
          <Route path="/implantes" element={<ImplantesPage />} />
          <Route path="/implantes/cochlear" element={<ImplantesCochlearPage />} />
          <Route path="/implantes/advanced-bionics" element={<ImplantesAdvancedBionicsPage />} />
          <Route path="/implantes/medel" element={<ImplantesMedelPage />} />
          <Route path="/ecommerce" element={<EcommercePage />} />
          <Route path="/comparador" element={<ComparadorPage />} />
          <Route path="/admin" element={<ProtectedAdminRoute requireFullAdmin><AdminPage /></ProtectedAdminRoute>} />
          <Route path="/profesionales/otologos" element={<OtologosPage />} />
          <Route path="/profesionales/audiologos" element={<AudiologasPage />} />
          <Route path="/directorio/profesional/:profileId" element={<DirectorioProfesionalPageV2 />} />
          <Route path="/directorio/profesional/:profileId/legacy" element={<DirectorioProfesionalPage />} />
          <Route path="/directorio/profesional/:profileId/v2" element={<DirectorioProfesionalPageV2 />} />
          <Route path="/directorio/listado" element={<DirectorioListadoPage />} />
          <Route path="/favoritos" element={<FavoritosPage />} />
          {/* F1: rutas nuevas tipo Airbnb. La legacy queda accesible en /directorio-clasico. */}
          <Route path="/directorio/ciudad/:slug" element={<DirectorioCiudadPage />} />
          <Route path="/directorio/profesion/:slug" element={<DirectorioProfesionPage />} />
          <Route path="/directorio" element={<DirectorioAirbnbPage />} />
          <Route path="/directorio-clasico" element={<DirectorioResultadosPage />} />

          {/* Ruta del perfil profesional demo */}
          <Route path="/profesional/demo" element={<ProfessionalProfileDemoPage />} />
          {/* Ruta dinámica para perfiles de profesionales */}
          <Route path="/profesionales/otologos/:id" element={<ProfessionalProfilePage />} />
          {/* Ruta dinámica para perfiles de audiólogas */}
          <Route path="/profesionales/audiologos/:id" element={<ProfessionalProfilePage />} />
          
          {/* Ruta de agendamiento */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/agendar" element={<AgendamientoPage />} />
          <Route path="/agendar-control/:token" element={<AgendarControlPage />} />
          <Route path="/agendar/confirmar" element={<ConfirmAppointmentPage />} />
          <Route path="/agendar/reagendar" element={<RescheduleAppointmentPage />} />
          <Route path="/agendar/cancelar" element={<CancelAppointmentPage />} />
          <Route path="/registro-profesional" element={<RegistroProfesionalPage />} />
          <Route path="/login-directorio" element={<LoginDirectorioPage />} />
          <Route
            path="/mi-directorio"
            element={
              <ProtectedDirectoryRoute>
                <MiDirectorioPage />
              </ProtectedDirectoryRoute>
            }
          />

          {/* Login CRM (sin proteger) */}
          <Route path="/login-crm" element={<LoginCRMPage />} />
          <Route path="/crm-login" element={<LoginCRMPage />} />
          
          {/* Portal y rutas CRM (protegidas) — envueltas por el shell del CRM */}
          <Route path="/portal-crm" element={<ProtectedRoute><CrmShell /></ProtectedRoute>}>
            {/* Home del CRM ahora es "Acciones del día"; el viejo PortalCRMPage
                queda accesible en /portal-crm/inicio para no romper enlaces. */}
            <Route index element={<Navigate to="acciones-dia" replace />} />
            <Route path="inicio" element={<PortalCRMPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="acciones-dia" element={<AccionesDiaPage />} />
            <Route path="citas" element={<CitasPage />} />
            <Route path="agenda" element={<AgendaOirconectaPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="pacientes" element={<PacientesPage />} />
            <Route path="controles" element={<ControlesPage />} />
            <Route path="whatsapp" element={<WhatsAppInboxPage />} />
            <Route path="plantillas" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><CrmPlantillasPage /></ProtectedRouteByRole>} />
            <Route path="campanas" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><CampanasPage /></ProtectedRouteByRole>} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="configuracion" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><ConfiguracionPage /></ProtectedRouteByRole>} />
            <Route path="productos" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><ProductosPage /></ProtectedRouteByRole>} />
          </Route>

          {/* Cambio de clave forzado (fuera del shell) */}
          <Route path="/portal-profesional/cambiar-clave" element={<CambiarClavePage />} />

          {/* Wizard onboarding — full-screen, sin layout */}
          <Route path="/portal-profesional/wizard" element={<ProfesionalWizardPage />} />

          {/* Dejar reseña post-cita — pública con token */}
          <Route path="/dejar-resena/:token" element={<DejarResenaPage />} />

          {/* Landing referral pública */}
          <Route path="/invita/:code" element={<InvitaPage />} />

          {/* Portal del Profesional (directorio) */}
          <Route path="/portal-profesional" element={<ProfesionalLayout />}>
            <Route index element={<ProfesionalDashboardPage />} />
            <Route path="perfil" element={<ProfesionalPerfilPage />} />
            <Route path="servicios" element={<ProfesionalServiciosPage />} />
            <Route path="consultas" element={<ProfesionalConsultasPage />} />
            <Route path="suscripcion" element={<ProfesionalSuscripcionPage />} />
            <Route path="agenda" element={<ProfesionalAgendaPage />} />
            <Route path="ia" element={<ProfesionalIAPage />} />
            <Route path="anunciate" element={<ProfesionalAnunciatePage />} />
          </Route>

          {/* Portal Administración del sitio — auth independiente del CRM */}
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/portal-admin" element={<AdminLayout />}>
            <Route index element={<ProtectedAdminRoute requireFullAdmin><AdminDashboardPage /></ProtectedAdminRoute>} />
            <Route path="blog" element={<ProtectedAdminRoute requireFullAdmin><AdminBlogPage /></ProtectedAdminRoute>} />
            <Route path="profesionales" element={<ProtectedAdminRoute requireFullAdmin><AdminProfesionalesPage /></ProtectedAdminRoute>} />
            <Route path="marketplace" element={<ProtectedAdminRoute requireFullAdmin><AdminMarketplacePage /></ProtectedAdminRoute>} />
            <Route path="pedidos" element={<ProtectedAdminRoute requireFullAdmin><AdminPedidosPage /></ProtectedAdminRoute>} />
            <Route path="comparador" element={<ProtectedAdminRoute requireFullAdmin><AdminComparadorPage /></ProtectedAdminRoute>} />
            <Route path="newsletter" element={<ProtectedAdminRoute requireFullAdmin><AdminNewsletterPage /></ProtectedAdminRoute>} />
            <Route path="contactos" element={<ProtectedAdminRoute requireFullAdmin><AdminContactosPage /></ProtectedAdminRoute>} />
            <Route path="suscripciones" element={<ProtectedAdminRoute requireFullAdmin><AdminSuscripcionesPage /></ProtectedAdminRoute>} />
            <Route path="ia" element={<ProtectedAdminRoute requireFullAdmin><AdminIAPage /></ProtectedAdminRoute>} />
            <Route path="marketing" element={<ProtectedAdminRoute requireFullAdmin><AdminMarketingPage /></ProtectedAdminRoute>} />
            <Route path="marketing/insights" element={<ProtectedAdminRoute requireFullAdmin><AdminInsightsPage /></ProtectedAdminRoute>} />
            <Route path="comunicaciones" element={<ProtectedAdminRoute requireFullAdmin><AdminComunicacionesPage /></ProtectedAdminRoute>} />
            <Route path="whatsapp" element={<ProtectedAdminRoute requireFullAdmin><AdminWhatsAppPage /></ProtectedAdminRoute>} />
            {/* CRM Sales — captación outbound de profesionales (ADMIN + EJECUTIVO_COMERCIAL) */}
            <Route path="sales" element={<ProtectedAdminRoute requireSales><SalesDiaPage /></ProtectedAdminRoute>} />
            <Route path="sales/leads" element={<ProtectedAdminRoute requireSales><SalesLeadsPage /></ProtectedAdminRoute>} />
            <Route path="sales/leads/:id" element={<ProtectedAdminRoute requireSales><SalesLeadDetailPage /></ProtectedAdminRoute>} />
            <Route path="sales/reportes" element={<ProtectedAdminRoute requireSales><SalesReportesPage /></ProtectedAdminRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingWhatsApp />
        <CookieConsentBanner />
        </Suspense>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
