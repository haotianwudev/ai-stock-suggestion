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
    cliValue: Float
    icsaValue: Float
    cpiYoy: Float
    cpiMomAnn: Float
    t5yieValue: Float
    ppiYoy: Float
    gdpYoyPct: Float
    cpiYoyPct: Float
    indproYoyPct: Float
    cliYoyChange: Float
    icsaYoyPct: Float
    unrateYoyChange: Float
  }

  type PhaseProbability {
    phase: String!
    probability: Float!
  }

  type MonitoringTrigger {
    indicator: String!
    threshold: String!
    meaning: String!
  }

  type SectorRationale {
    etf: String!
    rationale: String!
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
    phaseProbabilities: [PhaseProbability!]
    monitoringTriggers: [MonitoringTrigger!]
    sectorRationale: [SectorRationale!]
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
