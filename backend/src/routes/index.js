/**
 * OirConecta Backend - Router principal
 */

const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const leadsRoutes = require('./leads.routes');
const patientsRoutes = require('./patients.routes');
const appointmentsRoutes = require('./appointments.routes');
const blockedSlotsRoutes = require('./blockedSlots.routes');
const campaignsRoutes = require('./campaigns.routes');
const productsRoutes = require('./products.routes');
const maintenancesRoutes = require('./maintenances.routes');
const interactionsRoutes = require('./interactions.routes');
const consultationsRoutes = require('./consultations.routes');
const directoryRoutes = require('./directory.routes');
const directoryReviewsRoutes = require('./directoryReviews.routes');
const directoryDiscoveryRoutes = require('./directoryDiscovery.routes');
const blogRoutes = require('./blog.routes');
const marketplaceRoutes = require('./marketplace.routes');
const shopRoutes = require('./shop.routes');
const comparadorRoutes = require('./comparador.routes');
const publicConfigRoutes = require('./publicConfig.routes');
const newsletterRoutes = require('./newsletter.routes');
const subscriptionRoutes = require('./subscription.routes');

// Registrar rutas
router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/blocked-slots', blockedSlotsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/products', productsRoutes);
router.use('/maintenances', maintenancesRoutes);
router.use('/interactions', interactionsRoutes);
router.use('/consultations', consultationsRoutes);
router.use('/directory', directoryRoutes);
// Endpoints F1 (reseñas, reportes, descubrimiento) bajo el mismo prefijo `/directory`.
router.use('/directory', directoryReviewsRoutes);
router.use('/directory', directoryDiscoveryRoutes);
router.use('/blog', blogRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/shop', shopRoutes);
router.use('/comparador', comparadorRoutes);
router.use('/public', publicConfigRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/subscriptions', subscriptionRoutes);

// Info de la API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OirConecta API v1',
    endpoints: {
      auth: '/api/auth',
      leads: '/api/leads',
      patients: '/api/patients',
      appointments: '/api/appointments',
      'blocked-slots': '/api/blocked-slots',
      campaigns: '/api/campaigns',
      products: '/api/products',
      maintenances: '/api/maintenances',
      interactions: '/api/interactions',
      consultations: '/api/consultations',
      directory: '/api/directory',
      'directory-search': 'GET /api/directory/search',
      'directory-register': 'POST /api/directory/register',
      'directory-auth-login': 'POST /api/directory/auth/login',
      'directory-me': 'GET|PATCH /api/directory/me',
      'directory-me-inquiries': 'GET /api/directory/me/inquiries',
      'directory-me-inquiry': 'PATCH /api/directory/me/inquiries/:inquiryId',
      'directory-profile-public': 'GET /api/directory/profiles/:profileId',
      'directory-profile-inquiry': 'POST /api/directory/profiles/:profileId/inquiry',
      'directory-profile-whatsapp-stat': 'POST /api/directory/profiles/:profileId/stats/whatsapp',
      'directory-admin-profiles': 'GET /api/directory/admin/profiles',
      'directory-admin-profile-status': 'PATCH /api/directory/admin/profiles/:accountId',
      'public-retail-config': 'GET /api/public/retail-config',
    },
  });
});

module.exports = router;
