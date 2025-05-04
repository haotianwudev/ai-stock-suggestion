const { gql } = require('apollo-server');

// Define GraphQL schema for stocks
const typeDefs = gql`
  type CompanyFacts {
    ticker: String!
    name: String!
    cik: String
    industry: String
    sector: String
    category: String
    exchange: String	
    is_active: Int
    listing_date: String	
    location: String	
    market_cap: Float	
    number_of_employees: Int	
    sec_filings_url: String
    sic_code:String	
    sic_industry:String	
    sic_sector:String	
    website_url:String	
    weighted_average_shares:Int
  }

  type Price {
    biz_date: String!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Int!
  }

  type CompanyNews {
    title: String!
    author: String
    source: String
    date: String!
    url: String
    sentiment: String!
  }

  type FinancialMetrics {
    report_period: String!
    period: String!
    currency: String!
    market_cap: Float
    enterprise_value: Float
    price_to_earnings_ratio: Float
    price_to_book_ratio: Float
    price_to_sales_ratio: Float	
    enterprise_value_to_ebitda_ratio: Float	
    enterprise_value_to_revenue_ratio: Float	
    free_cash_flow_yield: Float	
    peg_ratio: Float
    gross_margin: Float
    operating_margin: Float	
    net_margin: Float	
    return_on_equity: Float	
    return_on_assets: Float	
    return_on_invested_capital: Float	
    asset_turnover: Float	
    inventory_turnover: Float	
    receivables_turnover: Float	
    days_sales_outstanding: Float	
    operating_cycle: Float
    working_capital_turnover: Float	
    current_ratio: Float
    quick_ratio: Float
    cash_ratio: Float
    operating_cash_flow_ratio: Float
    debt_to_equity: Float
    debt_to_assets: Float	
    interest_coverage: Float	
    revenue_growth: Float	
    earnings_growth: Float	
    book_value_growth: Float	
    earnings_per_share_growth: Float	
    free_cash_flow_growth: Float	
    operating_income_growth: Float	
    ebitda_growth: Float	
    payout_ratio: Float	
    earnings_per_share: Float	
    book_value_per_share: Float	
    free_cash_flow_per_share: Float
  }

  type Stock {
    company: CompanyFacts!
    prices(start_date: String, end_date: String): [Price!]!
    news(limit: Int = 100): [CompanyNews!]!
    financialMetrics: [FinancialMetrics!]!
    financialMetricsLatest: FinancialMetrics
  }

  type StockSearchResult {
    ticker: String!
    name: String!
  }

  type Valuation {
    ticker: String!
    valuation_method: String!
    intrinsic_value: Float!
    market_cap: Float!
    gap: Float!
    signal: String!
    biz_date: String!
  }

  type Fundamentals {
    id: Int!
    ticker: String!
    biz_date: String!
    overall_signal: String!
    confidence: Float!
    return_on_equity: Float!
    roe_threshold: Float!
    net_margin: Float!
    net_margin_threshold: Float!
    operating_margin: Float!
    op_margin_threshold: Float!
    profitability_score: Int!
    profitability_signal: String!
    revenue_growth: Float!
    revenue_growth_threshold: Float!
    earnings_growth: Float!
    earnings_growth_threshold: Float!
    book_value_growth: Float!
    book_value_growth_threshold: Float!
    growth_score: Int!
    growth_signal: String!
    current_ratio: Float!
    current_ratio_threshold: Float!
    debt_to_equity: Float!
    debt_to_equity_threshold: Float!
    free_cash_flow_per_share: Float!
    earnings_per_share: Float!
    fcf_conversion_threshold: Float!
    health_score: Int!
    health_signal: String!
    pe_ratio: Float!
    pe_threshold: Float!
    pb_ratio: Float!
    pb_threshold: Float!
    ps_ratio: Float!
    ps_threshold: Float!
    valuation_score: Int!
    valuation_signal: String!
  }

  type Sentiment {
    id: Int!
    ticker: String!
    biz_date: String!
    overall_signal: String!
    confidence: Float!
    insider_total: Int!
    insider_bullish: Int!
    insider_bearish: Int!
    insider_value_total: Float!
    insider_value_bullish: Float!
    insider_value_bearish: Float!
    insider_weight: Float!
    news_total: Int!
    news_bullish: Int!
    news_bearish: Int!
    news_neutral: Int!
    news_weight: Float!
    weighted_bullish: Float!
    weighted_bearish: Float!
  }

  type Technicals {
    id: Int!
    ticker: String!
    biz_date: String!
    signal: String!
    confidence: Float!
    trend_signal: String!
    trend_confidence: Float!
    trend_score: Float!
    trend_adx_threshold: Float!
    trend_ema_crossover_threshold: Boolean!
    ema_8: Float!
    ema_21: Float!
    ema_55: Float!
    adx: Float!
    di_plus: Float!
    di_minus: Float!
    mr_signal: String!
    mr_confidence: Float!
    mr_score: Float!
    mr_z_score_threshold: Float!
    mr_rsi_low_threshold: Float!
    mr_rsi_high_threshold: Float!
    z_score: Float!
    bb_upper: Float!
    bb_lower: Float!
    rsi_14: Float!
    rsi_28: Float!
    momentum_signal: String!
    momentum_confidence: Float!
    momentum_score: Float!
    momentum_min_strength: Float!
    momentum_volume_ratio_threshold: Float!
    mom_1m: Float!
    mom_3m: Float!
    mom_6m: Float!
    volume_ratio: Float!
    volatility_signal: String!
    volatility_confidence: Float!
    volatility_score: Float!
    volatility_low_regime: Float!
    volatility_high_regime: Float!
    volatility_z_threshold: Float!
    hist_vol_21d: Float!
    vol_regime: Float!
    vol_z_score: Float!
    atr_ratio: Float!
    stat_arb_signal: String!
    stat_arb_confidence: Float!
    stat_arb_score: Float!
    stat_arb_hurst_threshold: Float!
    stat_arb_skew_threshold: Float!
    hurst_exp: Float!
    skewness: Float!
    kurtosis: Float!
  }

  type AgentSignal {
    id: Int!
    ticker: String!
    agent: String!
    signal: String!
    confidence: Float!
    reasoning: String
    biz_date: String!
    created_at: String!
    updated_at: String!
  }

  type Query {
    stock(ticker: String!): Stock
    searchStocks(query: String!): [StockSearchResult!]!
    latestValuations(ticker: String!): [Valuation!]!
    latestFundamentals(ticker: String!): Fundamentals
    latestSentiment(ticker: String!): Sentiment
    latestTechnicals(ticker: String!): Technicals
    latestAgentSignal(ticker: String!, agent: String!): AgentSignal
  }
`;

module.exports = typeDefs;
