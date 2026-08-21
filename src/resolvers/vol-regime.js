const { getLatestData, getHistoricalData, getRegimeStats } = require('../db/vol-regime');

const resolvers = {
  Query: {
    volRegime: async (_parent, { days } = {}) => {
      const window = Number.isFinite(days) && days > 0 ? days : 252;
      const [latestData, history, stats] = await Promise.all([
        getLatestData(),
        getHistoricalData(window),
        getRegimeStats(),
      ]);
      return { latestData, history, stats };
    },
  },
};

module.exports = resolvers;
