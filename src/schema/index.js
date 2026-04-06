const { gql } = require('apollo-server');
const stockSchema = require('./stock');
const investmentClockSchema = require('./investment-clock');
const quantTrendingSchema = require('./quant-trending');

// Define base GraphQL schema
const baseTypeDefs = gql`
  type Query {
    hello: String
  }
`;

// Merge schemas
module.exports = [baseTypeDefs, stockSchema, investmentClockSchema, quantTrendingSchema];