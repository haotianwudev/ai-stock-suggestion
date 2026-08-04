const { gql } = require('apollo-server');

const authSchema = gql`
  type User {
    id: ID!
    email: String
  }

  extend type Query {
    me: User
  }
`;

module.exports = authSchema;
