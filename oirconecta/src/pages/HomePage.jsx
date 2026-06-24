import React from 'react';
import { Helmet } from 'react-helmet';
import Box from '@mui/material/Box';
import Header from '../components/Header';
import Hero from '../components/Hero';
import SearchEngine from '../components/SearchEngine';
import HomeUserPathsSection from '../components/home/HomeUserPathsSection';
import HomeDiscoverySection from '../components/home/HomeDiscoverySection';
import HomePonteEnSusOidosSection from '../components/home/HomePonteEnSusOidosSection';
import HomeManifestoSection from '../components/home/HomeManifestoSection';
import HomeComparadorSection from '../components/home/HomeComparadorSection';
import RecommendationOfMonthSection from '../components/RecommendationOfMonthSection';
import HomeProfessionalsSpotlight from '../components/home/HomeProfessionalsSpotlight';
import AuditionGuideSection from '../components/AuditionGuideSection';
import HomeVideoSection from '../components/HomeVideoSection';
import TestimonialsSection from '../components/TestimonialsSection';
import HomeB2BSection from '../components/home/HomeB2BSection';
import Footer from '../components/Footer';
import PreviewSlot from '../components/marketing/PreviewSlot';

export default function HomePage() {
  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Helmet>
        <title>OírConecta | Audífonos, profesionales y salud auditiva en Colombia</title>
        <meta name="description" content="Encuentra audífonos, implantes y profesionales auditivos en Colombia. Compara marcas, conoce precios de referencia y agenda con especialistas verificados." />
        <link rel="canonical" href="https://oirconecta.com/" />
        <meta property="og:title" content="OírConecta | Audífonos, profesionales y salud auditiva en Colombia" />
        <meta property="og:description" content="Compara marcas de audífonos, conoce precios de referencia y conecta con profesionales auditivos verificados en Colombia." />
        <meta property="og:url" content="https://oirconecta.com/" />
      </Helmet>
      <Header />
      <PreviewSlot slotId="HOMEPAGE_TAKEOVER" slotLabel="Takeover de homepage (hero)" minHeight={200} />
      <PreviewSlot slotId="BANNER_HERO" slotLabel="Banner hero rotativo" minHeight={140} />
      <Hero />
      <HomeUserPathsSection />
      <Box id="busqueda-profesionales" sx={{ scrollMarginTop: 96 }}>
        <SearchEngine />
      </Box>
      <PreviewSlot slotId="EXIT_INTENT" slotLabel="Exit-intent overlay" minHeight={80} />
      <HomeComparadorSection />
      <HomeDiscoverySection />
      <HomeManifestoSection />
      <HomePonteEnSusOidosSection />
      <RecommendationOfMonthSection />
      <HomeProfessionalsSpotlight />
      <AuditionGuideSection />
      <HomeVideoSection />
      <TestimonialsSection />
      <HomeB2BSection />
      <PreviewSlot slotId="WEB_PUSH_TOAST" slotLabel="Notificación toast" minHeight={80} />
      <PreviewSlot slotId="FLOATING_CTA_MOBILE" slotLabel="CTA flotante mobile (solo en mobile)" minHeight={70} />
      <Footer />
    </Box>
  );
}
