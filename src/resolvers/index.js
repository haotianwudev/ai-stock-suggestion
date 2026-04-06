const stockResolvers = require('./stock');
const investmentClockResolvers = require('./investment-clock');
const quantTrendingResolvers = require('./quant-trending');

// Base resolvers
const baseResolvers = {
  Query: {
    hello: () => "Hello, GraphQL World!"
  }
};

// Merge resolvers
module.exports = [baseResolvers, stockResolvers, investmentClockResolvers, quantTrendingResolvers];