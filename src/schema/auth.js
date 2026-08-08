const { gql } = require('apollo-server');

const authSchema = gql`
  type User {
    id: ID!
    email: String
    displayName: String
    avatarUrl: String
    youtubeSubscribed: Boolean!
    likedCount: Int!
    tier: Int!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    updateProfile(displayName: String!, avatarUrl: String!): User!
    setYoutubeSubscribed(subscribed: Boolean!): User!
    attestLiked: User!
  }
`;

module.exports = authSchema;
