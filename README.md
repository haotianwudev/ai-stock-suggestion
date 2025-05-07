# GraphQL Stock Suggestion Server

A Node.js GraphQL server that provides stock data including company information, prices, and news from a PostgreSQL database.

## Prerequisites

- Node.js (v14.x or higher)
- PostgreSQL (v12.x or higher)
- npm or yarn

## Project Structure

```
.
├── src/
│   ├── db/         # Database connection and queries
│   ├── models/     # Data models
│   ├── resolvers/  # GraphQL resolvers
│   └── schema/     # GraphQL type definitions
├── .env            # Environment variables (create this file locally)
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-stock-suggestion-server.git
   cd ai-stock-suggestion-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=4000

   # Database Configuration
   DB_USER=your_postgres_username
   DB_HOST=localhost
   DB_NAME=stock_suggestion
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   ```

4. Set up the PostgreSQL database:
   - Create a database named `stock_suggestion`
   - Run the SQL schema provided in the "Database Schema" section below

## Running the Server

### Development Mode (with hot-reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The GraphQL server will be available at `http://localhost:4000` (or the PORT you specified in your .env file).

## GraphQL API Examples

### 1. Covered Tickers with Scores
```graphql
# Get all covered tickers with their latest Sophie scores
query GetCoveredTickers {
  coveredTickers {
    ticker
    score
  }
}

# Get top 10 highest scoring tickers
query GetTopTickers {
  coveredTickers(top: 10) {
    ticker
    score
  }
}

# Sample Response:
{
  "data": {
    "coveredTickers": [
      {
        "ticker": "AAPL",
        "score": 85.5
      },
      {
        "ticker": "MSFT", 
        "score": 82.3
      },
      {
        "ticker": "GOOGL",
        "score": 78.9
      }
    ]
  }
}
```

### 2. AI Agent Signals
```graphql
# Get the latest signal for a specific ticker and agent
query GetLatestAgentSignal {
  latestAgentSignal(ticker: "AAPL", agent: "warren_buffett") {
    ticker
    agent
    signal
    confidence
    reasoning
    biz_date
  }
}

# Sample Response:
{
  "data": {
    "latestAgentSignal": {
      "ticker": "AAPL",
      "agent": "warren_buffett",
      "signal": "bearish",
      "confidence": 75.00,
      "reasoning": "While Apple (AAPL) demonstrates a strong economic moat...",
      "biz_date": "2025-05-04"
    }
  }
}
```

### 3. Sophie Analysis
```graphql
# Get the latest Sophie analysis for a ticker
query GetLatestSophieAnalysis {
  latestSophieAnalysis(ticker: "AAPL") {
    id
    ticker
    biz_date
    signal
    confidence
    overall_score
    reasoning
    short_term_outlook
    medium_term_outlook
    long_term_outlook
    bullish_factors
    bearish_factors
    risks
    model_name
    model_display_name
    created_at
    updated_at
  }
}

# Sample Response:
{
  "data": {
    "latestSophieAnalysis": {
      "id": 2,
      "ticker": "AAPL",
      "biz_date": "2025-05-04",
      "signal": "neutral",
      "confidence": 55.00,
      "overall_score": 48.00,
      "reasoning": "AAPL presents a mixed picture across valuation, technicals, sentiment, and fundamentals. Valuation metrics (DCF, owner_earnings, residual_income) suggest the stock is overvalued, while EV/EBITDA is neutral. Technical indicators are bearish, with momentum and volatility signaling downside risk. Sentiment is slightly bullish due to positive news flow, but insider trading shows net selling. Fundamentals are neutral with strong profitability but high valuation multiples and modest growth.",
      "short_term_outlook": "Bearish due to technical weakness and high valuation multiples. Potential for short-term downside.",
      "medium_term_outlook": "Neutral as sentiment and fundamentals balance out. Growth prospects may improve but valuation remains a concern.",
      "long_term_outlook": "Neutral to slightly bullish if AAPL can sustain profitability and improve growth, but current valuation limits upside.",
      "bullish_factors": [
        "Strong profitability (high ROE, net margin, operating margin)",
        "Positive news sentiment",
        "Stable free cash flow per share",
        "Long-term brand strength and ecosystem advantages"
      ],
      "bearish_factors": [
        "Overvalued based on DCF, owner earnings, and residual income",
        "Bearish technical signals (momentum, volatility)",
        "High P/E, P/B, and P/S ratios",
        "Modest revenue and earnings growth",
        "Net insider selling"
      ],
      "risks": [
        "Macroeconomic slowdown impacting consumer spending",
        "Increased competition in hardware/services",
        "Regulatory risks (app store, antitrust)",
        "Valuation contraction if growth disappoints",
        "Technical breakdown leading to further downside"
      ],
      "model_name": "deepseek-chat",
      "model_display_name": "DEEPSEEK",
      "created_at": "2025-05-05T00:45:11.621Z",
      "updated_at": "2025-05-05T00:45:11.621Z"
    }
  }
}
```

### 4. Batch Stock Data
```graphql
# Get company facts and prices for multiple tickers
query GetBatchStocks {
  batchStocks(tickers: ["AAPL", "MSFT", "TSLA"]) {
    ticker
    company {
      name
      sector
      industry
    }
    prices {
      biz_date
      close
    }
  }
}

# Get batch data with date range
query GetBatchStocksWithDates {
  batchStocks(
    tickers: ["GOOGL", "AMZN"]
    start_date: "2024-01-01"
    end_date: "2024-03-31"
  ) {
    ticker
    company {
      name
    }
    prices {
      biz_date
      close
    }
  }
}

# Sample Response:
{
  "data": {
    "batchStocks": [
      {
        "ticker": "AAPL",
        "company": {
          "name": "Apple Inc.",
          "sector": "Technology",
          "industry": "Consumer Electronics"
        },
        "prices": [
          {
            "biz_date": "2024-03-31",
            "close": 172.28
          },
          {
            "biz_date": "2024-03-28",
            "close": 171.48
          }
        ]
      },
      {
        "ticker": "MSFT",
        "company": {
          "name": "Microsoft Corporation",
          "sector": "Technology",
          "industry": "Software"
        },
        "prices": [
          {
            "biz_date": "2024-03-31",
            "close": 420.72
          },
          {
            "biz_date": "2024-03-28",
            "close": 421.65
          }
        ]
      }
    ]
  }
}
```

### 5. Fetch Company News
```graphql
query GetCompanyNews {
  stock(ticker: "TSLA") {
    company {
      name
    }
    news {
      title
      date
      source
      url
    }
  }
}
```

## Connecting from a Next.js Frontend

Here's how to connect to your GraphQL API from a Next.js frontend using Apollo Client:

```javascript
// /lib/apollo-client.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000', // Your GraphQL server endpoint
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
```

```javascript
// _app.js
import { ApolloProvider } from '@apollo/client';
import client from '../lib/apollo-client';

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
```

```javascript
// Example component usage
import { gql, useQuery } from '@apollo/client';

const GET_STOCK = gql`
  query GetStock($ticker: String!) {
    stock(ticker: $ticker) {
      company {
        name
        sector
      }
      prices(biz_date: "2023-04-15") {
        close
      }
    }
  }
`;

function StockComponent() {
  const { loading, error, data } = useQuery(GET_STOCK, {
    variables: { ticker: "AAPL" },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>{data.stock.company.name}</h2>
      <p>Sector: {data.stock.company.sector}</p>
      <p>Latest price: {data.stock.prices[0]?.close}</p>
    </div>
  );
}
```

## Database Schema

Create the following tables in your PostgreSQL database:

```sql
-- Company Facts Table
CREATE TABLE company_facts (
    ticker VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cik VARCHAR(20),
    industry VARCHAR(255),
    sector VARCHAR(255)
);

-- Prices Table
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES company_facts(ticker),
    biz_date DATE NOT NULL,
    open NUMERIC(10,2) NOT NULL,
    high NUMERIC(10,2) NOT NULL,
    low NUMERIC(10,2) NOT NULL,
    close NUMERIC(10,2) NOT NULL,
    volume INTEGER NOT NULL,
    UNIQUE(ticker, biz_date)
);

-- Company News Table
CREATE TABLE company_news (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES company_facts(ticker),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    source VARCHAR(100),
    date TIMESTAMP NOT NULL,
    url TEXT,
    sentiment VARCHAR(10),
    UNIQUE(ticker, title, date)
);

-- Financial Metrics Table
CREATE TABLE financial_metrics (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES company_facts(ticker),
    report_period VARCHAR(20) NOT NULL,
    period VARCHAR(10) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    market_cap NUMERIC(20,2),
    enterprise_value NUMERIC(20,2),
    price_to_earnings_ratio NUMERIC(10,2),
    price_to_book_ratio NUMERIC(10,2),
    price_to_sales_ratio NUMERIC(10,2),
    enterprise_value_to_ebitda_ratio NUMERIC(10,2),
    enterprise_value_to_revenue_ratio NUMERIC(10,2),
    free_cash_flow_yield NUMERIC(10,2),
    peg_ratio NUMERIC(10,2),
    gross_margin NUMERIC(10,2),
    operating_margin NUMERIC(10,2),
    net_margin NUMERIC(10,2),
    return_on_equity NUMERIC(10,2),
    return_on_assets NUMERIC(10,2),
    return_on_invested_capital NUMERIC(10,2),
    asset_turnover NUMERIC(10,2),
    inventory_turnover NUMERIC(10,2),
    receivables_turnover NUMERIC(10,2),
    days_sales_outstanding NUMERIC(10,2),
    operating_cycle NUMERIC(10,2),
    working_capital_turnover NUMERIC(10,2),
    current_ratio NUMERIC(10,2),
    quick_ratio NUMERIC(10,2),
    cash_ratio NUMERIC(10,2),
    operating_cash_flow_ratio NUMERIC(10,2),
    debt_to_equity NUMERIC(10,2),
    debt_to_assets NUMERIC(10,2),
    interest_coverage NUMERIC(10,2),
    revenue_growth NUMERIC(10,2),
    earnings_growth NUMERIC(10,2),
    book_value_growth NUMERIC(10,2),
    earnings_per_share_growth NUMERIC(10,2),
    free_cash_flow_growth NUMERIC(10,2),
    operating_income_growth NUMERIC(10,2),
    ebitda_growth NUMERIC(10,2),
    payout_ratio NUMERIC(10,2),
    earnings_per_share NUMERIC(10,2),
    book_value_per_share NUMERIC(10,2),
    free_cash_flow_per_share NUMERIC(10,2),
    UNIQUE(ticker, report_period)
);

-- Sample data insertion
INSERT INTO company_facts (ticker, name, sector, industry) VALUES
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics'),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software'),
('TSLA', 'Tesla, Inc.', 'Automotive', 'Electric Vehicles');
```

## API Documentation

Once the server is running, you can access the full GraphQL schema documentation in the Playground at `http://localhost:4000`.

[Rest of the README content remains unchanged...]
