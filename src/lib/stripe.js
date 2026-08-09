const Stripe = require('stripe');

// Lazy, mirrors the lazy-JWKS pattern in src/auth/verify.js -- built on first
// use rather than at module load, so the server can still boot before
// STRIPE_SECRET_KEY is configured.
let stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

module.exports = { getStripe };
