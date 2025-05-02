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

Open the GraphQL Playground at `http://localhost:4000` and try these queries:

### 1. Fetch Company Information
```graphql
query GetCompanyFacts {
  stock(ticker: "AAPL") {
    company {
      ticker
      name
      sector
      industry
    }
  }
}
```

### 2. Fetch Stock Prices
```graphql
# Get prices for a specific date
query GetPricesByDate {
  stock(ticker: "MSFT") {
    prices(biz_date: "2023-04-15") {
      biz_date
      open
      high
      low
      close
      volume
    }
  }
}

# Get prices within a date range
query GetPricesByRange {
  stock(ticker: "AAPL") {
    prices(start_date: "2023-01-01", end_date: "2023-03-31") {
      biz_date
      close
      volume
    }
  }
}

# Get all prices after a certain date
query GetPricesAfterDate {
  stock(ticker: "TSLA") {
    prices(start_date: "2023-06-01") {
      biz_date
      close
    }
  }
}

# Get all prices before a certain date
query GetPricesBeforeDate {
  stock(ticker: "GOOGL") {
    prices(end_date: "2022-12-31") {
      biz_date
      close
    }
  }
}

# Get recent prices (last 30 days - default when no dates provided)
query GetRecentPrices {
  stock(ticker: "AMZN") {
    prices {
      biz_date
      close
    }
  }
}

# Get consolidated data
query GetCompanyFacts {
  stock(ticker: "AAPL") {
    company {
      ticker
      name
      sector
      industry
    }
    prices(start_date: "2024-01-01", end_date: "2024-03-31") {
      biz_date
      close
      volume
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

### 3. Fetch Company News
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

-- Sample data insertion
INSERT INTO company_facts (ticker, name, sector, industry) VALUES
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics'),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software'),
('TSLA', 'Tesla, Inc.', 'Automotive', 'Electric Vehicles');
```

## API Documentation

Once the server is running, you can access the full GraphQL schema documentation in the Playground at `http://localhost:4000`.
