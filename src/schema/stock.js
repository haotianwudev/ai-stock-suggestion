const { gql } = require('apollo-server');

// Define GraphQL schema for stocks
const typeDefs = gql`
  type CompanyFacts {
    ticker: String!
    name: String!
    cik: String
    industry: String
    sector: String
  }

  type Price {
    biz_date: String!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Int!
  }

  type CompanyNews {
    title: String!
    author: String!
    source: String
    date: String!
    url: String
    sentiment: String
  }

  type Stock {
    company: CompanyFacts!
    prices(biz_date: String!): [Price!]!
    news: [CompanyNews!]!
  }

  type Query {
    stock(ticker: String!): Stock
  }
`;

module.exports = typeDefs; 