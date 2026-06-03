/**
 * Seed planes y crea trial 90d para TODOS los DirectoryProfile sin suscripción.
 * Idempotente: solo crea sub para perfiles que no la tienen aún.
 *
 * Uso: node scripts/seed_subscriptions.js
 */
require('dotenv').config();
const subService = require('../src/services/subscription.service');

(async () => {
  await subService.ensurePlans();
  console.log('✓ Planes verificados (TRIAL_90D, MENSUAL, ANUAL)');
  const result = await subService.backfillTrialsAll();
  console.log(`✓ Backfill: ${result.created} trials creados de ${result.totalScanned} perfiles escaneados.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
