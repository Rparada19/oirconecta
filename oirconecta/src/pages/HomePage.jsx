import React from 'react';
import Box from '@mui/material/Box';
import Header from '../components/Header';
import Hero from '../components/Hero';
import SearchEngine from '../components/SearchEngine';
import HomeUserPathsSection from '../components/home/HomeUserPathsSection';
import HomeDiscoverySection from '../components/home/HomeDiscoverySection';
import RecommendationOfMonthSection from '../components/RecommendationOfMonthSection';
import HomeProfessionalsSpotlight from '../components/home/HomeProfessionalsSpotlight';
import AuditionGuideSection from '../components/AuditionGuideSection';
import HomeVideoSection from '../components/HomeVideoSection';
import TestimonialsSection from '../components/TestimonialsSection';
import HomeB2BSection from '../components/home/HomeB2BSection';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Hero />
      <HomeUserPathsSection />
      <Box id="busqueda-profesionales" sx={{ scrollMarginTop: 96 }}>
        <SearchEngine />
      </Box>
      <HomeDiscoverySection />
      <RecommendationOfMonthSection />
      <HomeProfessionalsSpotlight />
      <AuditionGuideSection />
      <HomeVideoSection />
      <TestimonialsSection />
      <HomeB2BSection />
      <Footer />
    </Box>
  );
}
