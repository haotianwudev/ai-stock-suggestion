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

## Sample GraphQL Queries

### Covered Tickers with Scores
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

### AI Agent Signals
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
```

### Sophie Analysis
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
```

### Batch Stock Data
```graphql
# Get company facts, prices and Sophie analysis for multiple tickers
query GetBatchStocksWithAnalysis {
  batchStocks(tickers: ["AAPL", "MSFT", "TSLA"]) {
    ticker
    company {
      name
      sector
    }
    prices {
      biz_date
      close
    }
    latestSophieAnalysis {
      overall_score
      signal
    }
  }
}
```

[Rest of the README content remains unchanged...]
