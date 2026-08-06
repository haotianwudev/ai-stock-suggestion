const { gql } = require('apollo-server');

const authSchema = gql`
  type User {
    id: ID!
    email: String
    displayName: String
    avatarUrl: String
    youtubeSubscribed: Boolean!
    tier: Int!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    updateProfile(displayName: String!, avatarUrl: String!): User!
    setYoutubeSubscribed(subscribed: Boolean!): User!
  }
`;

module.exports = authSchema;
