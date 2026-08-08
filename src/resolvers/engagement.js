const { AuthenticationError } = require('apollo-server');
const {
  attestLiked,
  getLikedArticleSlugs,
  toggleBookmark,
  getBookmarkedArticleSlugs,
} = require('../db/engagement');

function requireUser(context) {
  if (!context.user) {
    throw new AuthenticationError('You must be signed in to do that.');
  }
  return context.user;
}

const engagementResolvers = {
  Query: {
    myLikedArticleSlugs: async (parent, args, context) => {
      if (!context.user) return [];
      return getLikedArticleSlugs(context.user.id);
    },
    myBookmarkedArticleSlugs: async (parent, args, context) => {
      if (!context.user) return [];
      return getBookmarkedArticleSlugs(context.user.id);
    },
  },

  Mutation: {
    attestLiked: async (parent, { articleSlug }, context) => {
      const user = requireUser(context);
      return attestLiked(user.id, articleSlug);
    },

    toggleBookmark: async (parent, { articleSlug }, context) => {
      const user = requireUser(context);
      return toggleBookmark(user.id, articleSlug);
    },
  },
};

module.exports = engagementResolvers;
