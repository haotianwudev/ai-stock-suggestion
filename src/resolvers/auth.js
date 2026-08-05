const { AuthenticationError, UserInputError } = require('apollo-server');
const { getProfile, updateProfile, ALLOWED_AVATARS } = require('../db/auth');

function requireUser(context) {
  if (!context.user) {
    throw new AuthenticationError('You must be signed in to do that.');
  }
  return context.user;
}

const authResolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) return null;
      const profile = await getProfile(context.user.id);
      return {
        id: context.user.id,
        email: context.user.email,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      };
    },
  },

  Mutation: {
    updateProfile: async (parent, { displayName, avatarUrl }, context) => {
      const user = requireUser(context);

      const trimmedName = displayName.trim();
      if (trimmedName.length < 1 || trimmedName.length > 50) {
        throw new UserInputError('Display name must be between 1 and 50 characters.');
      }
      if (!ALLOWED_AVATARS.includes(avatarUrl)) {
        throw new UserInputError('Invalid avatar selection.');
      }

      const profile = await updateProfile(user.id, { displayName: trimmedName, avatarUrl });
      return {
        id: user.id,
        email: user.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      };
    },
  },
};

module.exports = authResolvers;
