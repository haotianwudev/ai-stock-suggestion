const { gql } = require('apollo-server');

const quantTrendingSchema = gql`
  type QuantTrendingItem {
    id: Int!
    source: String!
    title: String!
    url: String!
    description: String
    author: String
    heatScore: Float!
    rawScore: Float!
    tags: [String!]!
    publishedAt: String
    fetchedAt: String!
  }

  type QuantTrendingResult {
    items: [QuantTrendingItem!]!
    lastUpdated: String
    total: Int!
  }

  extend type Query {
    quantTrending(source: String, limit: Int): QuantTrendingResult!
  }
`;

module.exports = quantTrendingSchema;
