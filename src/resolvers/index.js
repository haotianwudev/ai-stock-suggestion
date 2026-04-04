const stockResolvers = require('./stock');
const investmentClockResolvers = require('./investment-clock');

// Base resolvers
const baseResolvers = {
  Query: {
    hello: () => "Hello, GraphQL World!"
  }
};

// Merge resolvers
module.exports = [baseResolvers, stockResolvers, investmentClockResolvers];