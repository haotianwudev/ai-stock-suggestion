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
    avgVix: Float
    avgVixRank: Float
    pctOfDays: Float
  }

  type VolRegimeResult {
    latestData: VolRegimeDataPoint
    history: [VolRegimeDataPoint!]!
    stats: [VolRegimeStat!]!
  }

  extend type Query {
    "Precomputed daily variance-risk-premium / volatility-regime signals."
    volRegime(days: Int): VolRegimeResult!
  }
`;

module.exports = volRegimeSchema;
