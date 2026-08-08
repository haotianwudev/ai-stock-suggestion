const { gql } = require('apollo-server');
const stockSchema = require('./stock');
const investmentClockSchema = require('./investment-clock');
const quantTrendingSchema = require('./quant-trending');
const authSchema = require('./auth');
const forumSchema = require('./forum');
const engagementSchema = require('./engagement');

// Define base GraphQL schema
const baseTypeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    _empty: Boolean
  }
`;

// Merge schemas
module.exports = [baseTypeDefs, stockSchema, investmentClockSchema, quantTrendingSchema, authSchema, forumSchema, engagementSchema];