const { gql } = require('apollo-server');

const schema = gql`
  """
  One session's SPX option-surface summary, with each headline metric ranked against its own
  stored history. Rank fields are null until at least 20 sessions exist -- ranking against a
  handful of observations produces a confident-looking number carrying no information.
  """
  type OptionSnapshot {
    bizDate: String!
    spot: Float
    refExpiration: String
    refDte: Int

    atmIv: Float
    put25Iv: Float
    call25Iv: Float
    rr25: Float
    fly25: Float
    normalizedSkew: Float

    "d(IV vol pts)/d(ln K/S) at the money on the reference cycle. Negative for equity indices."
    atmSkewSlope: Float
    """
    Skew Stickiness Ratio: realised move in ATM IV per unit log-spot, divided by the skew that
    was in place. ~1 sticky strike, ~0 sticky delta, >1 the surface repriced rather than shifted.
    Null on the first stored session and on days the index barely moved (the ratio is numerically
    meaningless when the denominator approaches zero). Platform-specific normalisation — see the
    ETL docs before comparing against a published SSR.
    """
    ssr: Float

    frontAtmIv: Float
    backAtmIv: Float
    termSlope: Float

    pcrVolume: Float
    pcrOi: Float
    totalVolume: Float
    totalOpenInterest: Float

    netGexM: Float
    callWall: Float
    putWall: Float

    expirationCount: Int
    contractCount: Int

    "Sessions stored. Drives the 'building history (n/20)' state in the UI."
    sampleSize: Int!
    normalizedSkewRank: Float
    rr25Rank: Float
    fly25Rank: Float
    atmIvRank: Float
    netGexRank: Float
    pcrOiRank: Float
  }

  "A single session in the summary history, for sparklines and trend reads."
  type OptionSnapshotPoint {
    bizDate: String!
    spot: Float
    atmIv: Float
    rr25: Float
    fly25: Float
    normalizedSkew: Float
    atmSkewSlope: Float
    ssr: Float
    netGexM: Float
    pcrVolume: Float
    pcrOi: Float
  }

  """
  Joint direction of price and skew over the trailing window -- the read a single snapshot
  structurally cannot produce.

  WALL_OF_WORRY       price up, skew steepening    -- hedged participation
  EUPHORIA            price up, skew flattening    -- same rally, protection stripped out
  FEAR_CONFIRMING     price down, skew steepening  -- hedging into weakness
  CAPITULATION_RELIEF price down, skew flattening  -- protection sold into the decline
  """
  type SkewDivergence {
    sessions: Int!
    fromDate: String
    toDate: String
    priceChange: Float
    priceChangePct: Float
    skewChange: Float
    state: String
  }

  """
  Session-over-session open-interest change by side.

  BUILDING  net OI rose materially against the day's volume -- new positions opened
  CLOSING   net OI fell -- an unwind or short cover wearing the same volume signature
  CHURNING  heavy trading, flat net positioning
  """
  type OpenInterestFlow {
    bizDate: String
    priorDate: String
    "1 until a second session lands; the state fields stay null below 2."
    sessionsAvailable: Int!
    callOiChange: Float
    putOiChange: Float
    callOi: Float
    putOi: Float
    callVolume: Float
    putVolume: Float
    callState: String
    putState: String
    """
    Fraction of the current session's stored contracts that also exist in the prior session.
    Changes and volume are measured only over that intersection, since a contract with no prior
    row cannot be differenced. Near 1 in steady state; a low value means the flow read covers
    only part of the book.
    """
    comparableShare: Float
  }

  "Per-strike open-interest movers between the last two stored sessions."
  type StrikeFlow {
    expiration: String!
    optType: String!
    strike: Float!
    openInterest: Float
    oiChange: Float
    volume: Float
  }

  type OptionSnapshotResult {
    current: OptionSnapshot
    history: [OptionSnapshotPoint!]!
    divergence: SkewDivergence
    flow: OpenInterestFlow
    strikeFlow: [StrikeFlow!]!
  }

  extend type Query {
    "Stored SPX option-surface history. Empty until the daily ETL has run at least once."
    optionSnapshot(historySessions: Int, divergenceWindow: Int): OptionSnapshotResult!
  }
`;

module.exports = schema;
