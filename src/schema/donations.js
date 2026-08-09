const { gql } = require('apollo-server');

const donationsSchema = gql`
  type DonationCheckoutResult {
    checkoutUrl: String!
  }

  extend type Mutation {
    createDonationCheckout(amountCents: Int!): DonationCheckoutResult!
  }
`;

module.exports = donationsSchema;
