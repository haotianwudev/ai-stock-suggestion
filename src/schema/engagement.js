const { gql } = require('apollo-server');

const engagementSchema = gql`
  type LikeResult {
    wasNewLike: Boolean!
    likedCount: Int!
    tier: Int!
  }

  extend type Query {
    myLikedArticleSlugs: [String!]!
    myBookmarkedArticleSlugs: [String!]!
  }

  extend type Mutation {
    attestLiked(articleSlug: String!): LikeResult!
    toggleBookmark(articleSlug: String!): Boolean!
  }
`;

module.exports = engagementSchema;
