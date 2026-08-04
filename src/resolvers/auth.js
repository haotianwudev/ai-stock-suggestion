const authResolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context.user) return null;
      return { id: context.user.id, email: context.user.email };
    },
  },
};

module.exports = authResolvers;
