const {
  getLatestData, getHistoricalData, getRegimeStats,
  getVrpQuintileStats, getRegimeTransitions,
} = require('../db/vol-regime');

const resolvers = {
  Query: {
    volRegime: async (_parent, { days } = {}) => {
      const window = Number.isFinite(days) && days > 0 ? days : 252;
      const [latestData, history, stats, vrpQuintiles, transitions] = await Promise.all([
        getLatestData(),
        getHistoricalData(window),
        getRegimeStats(),
        getVrpQuintileStats(),
        getRegimeTransitions(),
      ]);
      return { latestData, history, stats, vrpQuintiles, transitions };
    },
  },
};

module.exports = resolvers;
