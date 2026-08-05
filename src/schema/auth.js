const { gql } = require('apollo-server');

const authSchema = gql`
  type User {
    id: ID!
    email: String
    displayName: String
    avatarUrl: String
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    updateProfile(displayName: String!, avatarUrl: String!): User!
  }
`;

module.exports = authSchema;
