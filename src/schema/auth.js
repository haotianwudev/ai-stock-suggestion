const { gql } = require('apollo-server');

const authSchema = gql`
  type User {
    id: ID!
    email: String
    displayName: String
    avatarUrl: String
    youtubeSubscribed: Boolean!
    likedCount: Int!
    donatedCents: Int!
    tier: Int!
    preferredVideoSource: String!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    updateProfile(displayName: String!, avatarUrl: String!): User!
    setYoutubeSubscribed(subscribed: Boolean!): User!
    setPreferredVideoSource(source: String!): User!
  }
`;

module.exports = authSchema;
