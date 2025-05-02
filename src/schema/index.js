const { gql } = require('apollo-server');
const stockSchema = require('./stock');

// Define base GraphQL schema
const baseTypeDefs = gql`
  type Query {
    hello: String
  }
`;

// Merge schemas
module.exports = [baseTypeDefs, stockSchema]; 