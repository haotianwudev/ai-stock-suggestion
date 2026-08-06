const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');
const {
  getCategories,
  getThreads,
  getThreadById,
  getThreadByContent,
  getPostsForThread,
  getPostById,
  getPostOwnerAndThread,
  getThreadLockStatus,
  createThread,
  getOrCreateThreadForContent,
  createPost,
  updatePostBody,
  deletePostById,
} = require('../db/forum');
const { getProfile } = require('../db/auth');

// Tier 3+ isn't reachable through any self-service flow yet (subscribing only
// gets you to tier 2) -- commenting is intentionally locked to everyone
// except manually-granted tier 9 accounts until a real tier-3 feature ships.
const MIN_COMMENT_TIER = 3;

function requireUser(context) {
  if (!context.user) {
    throw new AuthenticationError('You must be signed in to do that.');
  }
  return context.user;
}

async function requireCommentTier(context) {
  const user = requireUser(context);
  const profile = await getProfile(user.id);
  const tier = profile?.tier ?? 1;
  if (tier < MIN_COMMENT_TIER) {
    throw new ForbiddenError('Commenting is limited to premium members for now.');
  }
  return user;
}

const forumResolvers = {
  Query: {
    forumCategories: async () => getCategories(),

    forumThreads: async (parent, { categorySlug, limit, offset }) =>
      getThreads({ categorySlug, limit, offset }),

    forumThread: async (parent, { id }) => getThreadById(id),

    forumPosts: async (parent, { threadId, limit, offset }) =>
      getPostsForThread(threadId, { limit, offset }),

    articleComments: async (parent, { contentSlug }) =>
      getThreadByContent('article', contentSlug),
  },

  Mutation: {
    createForumThread: async (parent, { categoryId, title, body }, context) => {
      const user = await requireCommentTier(context);
      const threadId = await createThread({ categoryId, title, authorId: user.id });
      await createPost({ threadId, parentPostId: null, authorId: user.id, body });
      return getThreadById(threadId);
    },

    postComment: async (parent, { contentSlug, title, body }, context) => {
      const user = await requireCommentTier(context);
      const threadId = await getOrCreateThreadForContent('article', contentSlug, title, user.id);
      const locked = await getThreadLockStatus(threadId);
      if (locked) {
        throw new ForbiddenError('This discussion is locked.');
      }
      const postId = await createPost({ threadId, parentPostId: null, authorId: user.id, body });
      return getPostById(postId);
    },

    replyToPost: async (parent, { threadId, parentPostId, body }, context) => {
      const user = await requireCommentTier(context);
      const locked = await getThreadLockStatus(threadId);
      if (locked === null) {
        throw new UserInputError('Thread not found.');
      }
      if (locked) {
        throw new ForbiddenError('This discussion is locked.');
      }
      const postId = await createPost({ threadId, parentPostId, authorId: user.id, body });
      return getPostById(postId);
    },

    editPost: async (parent, { id, body }, context) => {
      const user = requireUser(context);
      const post = await getPostOwnerAndThread(id);
      if (!post) {
        throw new UserInputError('Post not found.');
      }
      if (post.authorId !== user.id) {
        throw new ForbiddenError("You can't edit someone else's post.");
      }
      return updatePostBody(id, body);
    },

    deletePost: async (parent, { id }, context) => {
      const user = requireUser(context);
      const post = await getPostOwnerAndThread(id);
      if (!post) {
        throw new UserInputError('Post not found.');
      }
      if (post.authorId !== user.id) {
        throw new ForbiddenError("You can't delete someone else's post.");
      }
      await deletePostById(id);
      return true;
    },
  },
};

module.exports = forumResolvers;
