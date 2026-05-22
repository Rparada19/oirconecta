/**
 * Abstracción de pasarela de pago.
 *
 * Cada proveedor implementa:
 *   - createIntent(order) -> { reference, redirectUrl, status }
 *       status: 'PENDING' | 'PAID' | 'FAILED'
 *       redirectUrl: si el proveedor requiere redirigir al checkout hosteado (null si no).
 *   - parseWebhook(req) -> { reference, status } | null
 *       Traduce el evento del proveedor a { reference, status } normalizado.
 *
 * Para conectar una pasarela real (Wompi, Mercado Pago, PayU, ePayco):
 *   1. Crear un objeto provider con createIntent/parseWebhook.
 *   2. Registrarlo en PROVIDERS.
 *   3. Definir PAYMENT_PROVIDER=<clave> en el entorno.
 */

// ── Proveedor stub (desarrollo / sin pasarela conectada) ──
// No mueve dinero. Marca el intento como PENDING; el pago se confirma vía webhook
// (o manualmente desde el admin cambiando el estado del pedido).
const stubProvider = {
  name: 'stub',
  async createIntent(order) {
    return {
      reference: `STUB-${order.numero}-${Date.now()}`,
      redirectUrl: null, // sin redirección: el checkout queda PENDIENTE_PAGO
      status: 'PENDING',
    };
  },
  parseWebhook(req) {
    const { reference, status } = req.body || {};
    if (!reference) return null;
    const map = { approved: 'PAID', paid: 'PAID', declined: 'FAILED', failed: 'FAILED' };
    return { reference, status: map[String(status).toLowerCase()] || 'PENDING' };
  },
};

const PROVIDERS = {
  stub: stubProvider,
  // wompi: wompiProvider,
  // mercadopago: mercadoPagoProvider,
};

function getPaymentProvider() {
  const key = (process.env.PAYMENT_PROVIDER || 'stub').toLowerCase();
  return PROVIDERS[key] || stubProvider;
}

module.exports = { getPaymentProvider };
