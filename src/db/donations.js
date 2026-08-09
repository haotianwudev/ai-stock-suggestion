const db = require('./supabase');

// Only the Stripe webhook (checkout.session.completed) calls this, after
// signature verification -- never trust the client-side success redirect.
// The insert is a data-modifying CTE keyed on the unique stripe_session_id,
// so a webhook redelivery is a no-op rather than double-counting -- same
// idempotency shape as attestLiked in db/engagement.js.
async function recordDonation({ userId, amountCents, currency, stripeSessionId, stripePaymentIntentId }) {
  const result = await db.query(
    `WITH ins AS (
       INSERT INTO donations (user_id, amount_cents, currency, stripe_session_id, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (stripe_session_id) DO NOTHING
       RETURNING amount_cents
     )
     UPDATE profiles SET
       donated_cents = donated_cents + COALESCE((SELECT amount_cents FROM ins), 0),
       tier = CASE
         WHEN donated_cents + COALESCE((SELECT amount_cents FROM ins), 0) >= 19999 THEN GREATEST(tier, 7)
         WHEN donated_cents + COALESCE((SELECT amount_cents FROM ins), 0) >= 9999  THEN GREATEST(tier, 6)
         WHEN donated_cents + COALESCE((SELECT amount_cents FROM ins), 0) >= 2999  THEN GREATEST(tier, 5)
         WHEN donated_cents + COALESCE((SELECT amount_cents FROM ins), 0) >= 999   THEN GREATEST(tier, 4)
         ELSE tier
       END
     WHERE id = $1
     RETURNING donated_cents AS "donatedCents", tier`,
    [userId, amountCents, currency, stripeSessionId, stripePaymentIntentId]
  );
  return result.rows[0];
}

module.exports = { recordDonation };
