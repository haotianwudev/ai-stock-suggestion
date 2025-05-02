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
    news: [CompanyNews!]!
    financialMetrics: [FinancialMetrics!]!
    financialMetricsLatest: FinancialMetrics
  }

  type StockSearchResult {
    ticker: String!
    name: String!
  }

  type Query {
    stock(ticker: String!): Stock
    searchStocks(query: String!): [StockSearchResult!]!
  }
`;

module.exports = typeDefs;
