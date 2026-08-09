const { AuthenticationError, UserInputError } = require('apollo-server');
const { getStripe } = require('../lib/stripe');

function requireUser(context) {
  if (!context.user) {
    throw new AuthenticationError('You must be signed in to do that.');
  }
  return context.user;
}

// App-level sanity bounds on a single Checkout Session -- $1 floor, $10,000
// ceiling. Stripe's own per-currency minimum still applies underneath this.
const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 1000000;

const donationsResolvers = {
  Mutation: {
    createDonationCheckout: async (parent, { amountCents }, context) => {
      const user = requireUser(context);

      if (!Number.isInteger(amountCents) || amountCents < MIN_DONATION_CENTS || amountCents > MAX_DONATION_CENTS) {
        throw new UserInputError(
          `Donation amount must be between $${MIN_DONATION_CENTS / 100} and $${MAX_DONATION_CENTS / 100}.`
        );
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: user.id,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: { name: 'Donation to SOPHIE' },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/donate?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/donate?canceled=true`,
      });

      return { checkoutUrl: session.url };
    },
  },
};

module.exports = donationsResolvers;
