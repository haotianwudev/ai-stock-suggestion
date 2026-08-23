const {
  getLatestSnapshot,
  getSnapshotHistory,
  getDivergence,
  getOpenInterestFlow,
  getStrikeFlow,
} = require('../db/option-snapshot');

const resolvers = {
  Query: {
    optionSnapshot: async (_parent, args = {}) => {
      const historySessions = args.historySessions ?? 120;
      const divergenceWindow = args.divergenceWindow ?? 20;

      const [current, history, divergence, flow, strikeFlow] = await Promise.all([
        getLatestSnapshot(),
        getSnapshotHistory(historySessions),
        getDivergence(divergenceWindow),
        getOpenInterestFlow(),
        getStrikeFlow(),
      ]);

      // The table is empty until the ETL's first run, and stays thin for weeks after. Every
      // field below is nullable by design so the UI can render a "building history" state
      // rather than an error -- an empty result here is the expected early condition, not a
      // failure.
      return {
        current,
        history: history || [],
        divergence,
        flow,
        strikeFlow: strikeFlow || [],
      };
    },
  },
};

module.exports = resolvers;
