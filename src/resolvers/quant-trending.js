const { getTrendingItems, getLastUpdated } = require('../db/quant-trending');

const quantTrendingResolvers = {
  Query: {
    quantTrending: async (_, { source = null, limit = 50 }) => {
      try {
        const [items, lastUpdated] = await Promise.all([
          getTrendingItems(source, limit),
          getLastUpdated(),
        ]);

        const normalized = items.map(item => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : [],
        }));

        return {
          items: normalized,
          lastUpdated,
          total: normalized.length,
        };
      } catch (err) {
        throw new Error(`Failed to fetch quant trending: ${err.message}`);
      }
    },
  },
};

module.exports = quantTrendingResolvers;
