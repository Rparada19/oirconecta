import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { buildTheme } from './theme';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NosotrosPage from './pages/NosotrosPage';
import ServiciosPage from './pages/ServiciosPage';
import AudifonosPage from './pages/AudifonosPage';
import ImplantesPage from './pages/ImplantesPage';
import ContactoPage from './pages/ContactoPage';
import EcommercePage from './pages/EcommercePage';
import AdminPage from './pages/AdminPage';
import AudifonosWidexPage from './pages/AudifonosWidexPage';
import AudifonosOticonPage from './pages/AudifonosOticonPage';
import AudifonosSigniaPage from './pages/AudifonosSigniaPage';
import AudifonosPhonakPage from './pages/AudifonosPhonakPage';
import AudifonosResoundPage from './pages/AudifonosResoundPage';
import AudifonosStarkeyPage from './pages/AudifonosStarkeyPage';
import AudifonosBeltonePage from './pages/AudifonosBeltonePage';
import AudifonosRextonPage from './pages/AudifonosRextonPage';
import AudifonosAudioservicePage from './pages/AudifonosAudioservicePage';
import AudifonosBernafonPage from './pages/AudifonosBernafonPage';
import AudifonosHansatonPage from './pages/AudifonosHansatonPage';
import AudifonosSonicPage from './pages/AudifonosSonicPage';
import AudifonosUnitronPage from './pages/AudifonosUnitronPage';
import ImplantesCochlearPage from './pages/ImplantesCochlearPage';
import ImplantesAdvancedBionicsPage from './pages/ImplantesAdvancedBionicsPage';
import ImplantesMedelPage from './pages/ImplantesMedelPage';
import ProfessionalProfileDemoPage from './pages/ProfessionalProfileDemoPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import OtologosPage from './pages/OtologosPage';
import AudiologasPage from './pages/AudiologasPage';
import AgendamientoPage from './pages/AgendamientoPage';
import LegalPage from './pages/LegalPage';
import LoginCRMPage from './pages/LoginCRMPage';
import PortalCRMPage from './pages/PortalCRMPage';
import DashboardPage from './pages/crm/DashboardPage';
import CitasPage from './pages/crm/CitasPage';
import LeadsPage from './pages/crm/LeadsPage';
import PacientesPage from './pages/crm/PacientesPage';
import CampanasPage from './pages/crm/CampanasPage';
import ReportesPage from './pages/crm/ReportesPage';
import ConfiguracionPage from './pages/crm/ConfiguracionPage';
import AccionesDiaPage from './pages/crm/AccionesDiaPage';
import DirectoryReviewPage from './pages/crm/DirectoryReviewPage';
import MiDirectorioPage from './pages/directorio/MiDirectorioPage';
import LoginDirectorioPage from './pages/LoginDirectorioPage';
import RegistroProfesionalPage from './pages/RegistroProfesionalPage';
import DirectorioResultadosPage from './pages/DirectorioResultadosPage';
import DirectorioListadoPage from './pages/DirectorioListadoPage';
import DirectorioProfesionSlugPage from './pages/DirectorioProfesionSlugPage';
import DirectorioProfesionalPage from './pages/DirectorioProfesionalPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/crm/ProtectedRoute';
import ProtectedRouteByRole from './components/crm/ProtectedRouteByRole';
import ProtectedDirectoryRoute from './components/directorio/ProtectedDirectoryRoute';
import './utils/clearAllData'; // Carga la función global clearAllOirConectaData()

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

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={routerBasename()}>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profesionales/otologos" element={<OtologosPage />} />
          <Route path="/profesionales/audiologos" element={<AudiologasPage />} />
          <Route path="/directorio/profesional/:profileId" element={<DirectorioProfesionalPage />} />
          <Route path="/directorio/listado" element={<DirectorioListadoPage />} />
          <Route path="/directorio/profesion/:slug" element={<DirectorioProfesionSlugPage />} />
          <Route path="/directorio" element={<DirectorioResultadosPage />} />

          {/* Ruta del perfil profesional demo */}
          <Route path="/profesional/demo" element={<ProfessionalProfileDemoPage />} />
          {/* Ruta dinámica para perfiles de profesionales */}
          <Route path="/profesionales/otologos/:id" element={<ProfessionalProfilePage />} />
          {/* Ruta dinámica para perfiles de audiólogas */}
          <Route path="/profesionales/audiologos/:id" element={<ProfessionalProfilePage />} />
          
          {/* Ruta de agendamiento */}
          <Route path="/agendar" element={<AgendamientoPage />} />
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
          
          {/* Portal y rutas CRM (protegidas) */}
          <Route path="/portal-crm" element={<ProtectedRoute><PortalCRMPage /></ProtectedRoute>} />
          <Route path="/portal-crm/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/portal-crm/acciones-dia" element={<ProtectedRoute><AccionesDiaPage /></ProtectedRoute>} />
          <Route path="/portal-crm/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
          <Route path="/portal-crm/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
          <Route path="/portal-crm/pacientes" element={<ProtectedRoute><PacientesPage /></ProtectedRoute>} />
          <Route path="/portal-crm/campanas" element={<ProtectedRoute><CampanasPage /></ProtectedRoute>} />
          <Route path="/portal-crm/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
          <Route path="/portal-crm/configuracion" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><ConfiguracionPage /></ProtectedRouteByRole>} />
          <Route path="/portal-crm/directorio-revision" element={<ProtectedRouteByRole allowedRoles={['ADMIN']}><DirectoryReviewPage /></ProtectedRouteByRole>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
