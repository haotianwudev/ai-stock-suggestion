const { gql } = require('apollo-server');

const volRegimeSchema = gql`
  type VolRegimeDataPoint {
    bizDate: String!
    spxClose: Float
    vix: Float
    vix3m: Float
    realizedVol20d: Float
    realizedVol10d: Float
    vrp: Float
    vrpZ: Float
    vrpPercentile: Float
    vrpVariance: Float
    downsideVarianceShare: Float
    fwdRealizedVol21d: Float
    fwdEarnedPremium: Float
    vixRank: Float
    termSlope: Float
    termStructure: String
    regime: String!
    regimeScore: Float
  }

  "Historical behaviour of one regime across the full sample."
  type VolRegimeStat {
    regime: String!
    days: Int!
    avgVrp: Float
    avgVrpVariance: Float
    avgDownsideVarianceShare: Float
    avgVix: Float
    avgVixRank: Float
    pctOfDays: Float
  }

  "Full-sample static quintile of vrp_z vs. the premium actually earned over the following 21 sessions."
  type VrpQuintileStat {
    quintile: Int!
    days: Int!
    vrpZMin: Float
    vrpZMax: Float
    avgForwardEarned: Float
    hitRatePct: Float
  }

  "P(regime 21 sessions from now = toRegime | regime today = fromRegime)."
  type RegimeTransition {
    fromRegime: String!
    toRegime: String!
    count: Int!
    probability: Float!
  }

  type VolRegimeResult {
    latestData: VolRegimeDataPoint
    history: [VolRegimeDataPoint!]!
    stats: [VolRegimeStat!]!
    vrpQuintiles: [VrpQuintileStat!]!
    transitions: [RegimeTransition!]!
  }

  extend type Query {
    "Precomputed daily variance-risk-premium / volatility-regime signals."
    volRegime(days: Int): VolRegimeResult!
  }
`;

module.exports = volRegimeSchema;
