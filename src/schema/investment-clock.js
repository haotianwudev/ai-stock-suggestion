const { gql } = require('apollo-server');

const investmentClockSchema = gql`
  type InvestmentClockDataPoint {
    bizDate: String!
    growthZScore: Float!
    inflationZScore: Float!
    dataPhase: String!
    clockAngle: Float!
    gdpValue: Float
    cpiValue: Float
    indproValue: Float
    tcuValue: Float
    unrateValue: Float
  }

  type InvestmentClockEvaluation {
    bizDate: String!
    finalPhase: String!
    phaseConfidence: Float
    phaseDirection: String
    reasoning: String
    outlook: String
    keyIndicators: [String!]
    risks: [String!]
    bestAsset: String
    recommendedSectors: [String!]
    geminiResearchSummary: String
  }

  type InvestmentClockResult {
    current: InvestmentClockEvaluation
    latestData: InvestmentClockDataPoint
    history: [InvestmentClockDataPoint!]!
  }

  extend type Query {
    investmentClock: InvestmentClockResult!
  }
`;

module.exports = investmentClockSchema;
