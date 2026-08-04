const { gql } = require('apollo-server');

const forumSchema = gql`
  type ForumCategory {
    id: ID!
    slug: String!
    name: String!
    description: String
    sortOrder: Int!
  }

  type ForumThread {
    id: ID!
    categoryId: ID
    categorySlug: String
    contentType: String
    contentSlug: String
    title: String!
    authorId: ID
    authorDisplayName: String
    authorAvatarUrl: String
    status: String!
    pinned: Boolean!
    locked: Boolean!
    createdAt: String!
    updatedAt: String!
    postCount: Int!
  }

  type ForumThreadList {
    items: [ForumThread!]!
    totalCount: Int!
  }

  type ForumPost {
    id: ID!
    threadId: ID!
    parentPostId: ID
    authorId: ID!
    authorDisplayName: String
    authorAvatarUrl: String
    body: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    editedAt: String
  }

  type ForumPostList {
    items: [ForumPost!]!
    totalCount: Int!
  }

  extend type Query {
    forumCategories: [ForumCategory!]!
    forumThreads(categorySlug: String, limit: Int = 20, offset: Int = 0): ForumThreadList!
    forumThread(id: ID!): ForumThread
    forumPosts(threadId: ID!, limit: Int = 50, offset: Int = 0): ForumPostList!
    articleComments(contentSlug: String!): ForumThread
  }

  extend type Mutation {
    createForumThread(categoryId: ID!, title: String!, body: String!): ForumThread!
    postComment(contentSlug: String!, title: String!, body: String!): ForumPost!
    replyToPost(threadId: ID!, parentPostId: ID, body: String!): ForumPost!
    editPost(id: ID!, body: String!): ForumPost!
    deletePost(id: ID!): Boolean!
  }
`;

module.exports = forumSchema;
