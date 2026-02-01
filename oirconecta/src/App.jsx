import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturesSection from './components/FeaturesSection';
import ServicesSection from './components/ServicesSection';
import TestimonialsSection from './components/TestimonialsSection';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import LoginCRMPage from './pages/LoginCRMPage';
import PortalCRMPage from './pages/PortalCRMPage';
import DashboardPage from './pages/crm/DashboardPage';
import CitasPage from './pages/crm/CitasPage';
import LeadsPage from './pages/crm/LeadsPage';
import PacientesPage from './pages/crm/PacientesPage';
import CampanasPage from './pages/crm/CampanasPage';
import ReportesPage from './pages/crm/ReportesPage';
import ConfiguracionPage from './pages/crm/ConfiguracionPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/crm/ProtectedRoute';
import './utils/clearAllData'; // Carga la función global clearAllOirConectaData()






function Home() {
  return (
    <>
      <Header />
      <Hero />
      <FeaturesSection />
      <ServicesSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/contacto" element={<ContactoPage />} />
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
          
          {/* Ruta del perfil profesional demo */}
          <Route path="/profesional/demo" element={<ProfessionalProfileDemoPage />} />
          {/* Ruta dinámica para perfiles de profesionales */}
          <Route path="/profesionales/otologos/:id" element={<ProfessionalProfilePage />} />
          {/* Ruta dinámica para perfiles de audiólogas */}
          <Route path="/profesionales/audiologos/:id" element={<ProfessionalProfilePage />} />
          
          {/* Ruta de agendamiento */}
          <Route path="/agendar" element={<AgendamientoPage />} />
          
          {/* Login CRM (sin proteger) */}
          <Route path="/login-crm" element={<LoginCRMPage />} />
          <Route path="/crm-login" element={<LoginCRMPage />} />
          
          {/* Portal y rutas CRM (protegidas) */}
          <Route path="/portal-crm" element={<ProtectedRoute><PortalCRMPage /></ProtectedRoute>} />
          <Route path="/portal-crm/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/portal-crm/citas" element={<ProtectedRoute><CitasPage /></ProtectedRoute>} />
          <Route path="/portal-crm/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
          <Route path="/portal-crm/pacientes" element={<ProtectedRoute><PacientesPage /></ProtectedRoute>} />
          <Route path="/portal-crm/campanas" element={<ProtectedRoute><CampanasPage /></ProtectedRoute>} />
          <Route path="/portal-crm/reportes" element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
          <Route path="/portal-crm/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />

        </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
