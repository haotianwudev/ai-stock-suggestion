const { getLatestEvaluation, getLatestData, getHistoricalData } = require('../db/investment-clock');

const investmentClockResolvers = {
  Query: {
    investmentClock: async () => {
      try {
        const [current, latestData, history] = await Promise.all([
          getLatestEvaluation(),
          getLatestData(),
          getHistoricalData(24),
        ]);

        // JSONB columns come back as JS objects from pg — convert arrays for GraphQL
        if (current) {
          current.keyIndicators = Array.isArray(current.keyIndicators) ? current.keyIndicators : [];
          current.risks = Array.isArray(current.risks) ? current.risks : [];
          current.recommendedSectors = Array.isArray(current.recommendedSectors) ? current.recommendedSectors : [];
        }

        return { current, latestData, history };
      } catch (error) {
        console.error('Error fetching investment clock data:', error);
        throw new Error('Failed to fetch investment clock data');
      }
    },
  },
};

module.exports = investmentClockResolvers;
