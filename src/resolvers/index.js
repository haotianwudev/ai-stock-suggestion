const stockResolvers = require('./stock');

// Base resolvers
const baseResolvers = {
  Query: {
    hello: () => "Hello, GraphQL World!"
  }
};

// Merge resolvers
module.exports = [baseResolvers, stockResolvers]; 