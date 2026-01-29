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
const campaignsRoutes = require('./campaigns.routes');
const productsRoutes = require('./products.routes');

// Registrar rutas
router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/products', productsRoutes);

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
      campaigns: '/api/campaigns',
      products: '/api/products',
    },
  });
});

module.exports = router;
