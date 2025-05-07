const db = require('../db');

// Stock resolvers
const stockResolvers = {
  Query: {
    latestValuations: async (_, { ticker }) => {
      try {
        const result = await db.query(
          `SELECT DISTINCT ON (valuation_method)
           ticker, valuation_method, intrinsic_value, market_cap, gap, signal,
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date
           FROM valuation
           WHERE ticker = $1
           ORDER BY valuation_method, biz_date DESC`,
          [ticker]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching latest valuations:', error);
        throw new Error('Failed to fetch latest valuations');
      }
    },

    searchStocks: async (_, { query }) => {
      if (query.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      try {
        const result = await db.query(
          `SELECT ticker, name FROM company_facts 
           WHERE ticker ILIKE $1 OR name ILIKE $1
           LIMIT 50`,
          [`%${query}%`]
        );
        return result.rows;
      } catch (error) {
        console.error('Error searching stocks:', error);
        throw new Error('Failed to search stocks');
      }
    },

    latestFundamentals: async (_, { ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted
           FROM fundamentals
           WHERE ticker = $1
           ORDER BY biz_date DESC
           LIMIT 1`,
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          biz_date: result.rows[0].biz_date_formatted
        };
      } catch (error) {
        console.error('Error fetching latest fundamentals:', error);
        throw new Error('Failed to fetch latest fundamentals');
      }
    },

    latestSentiment: async (_, { ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted
           FROM sentiment
           WHERE ticker = $1
           ORDER BY biz_date DESC
           LIMIT 1`,
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          biz_date: result.rows[0].biz_date_formatted
        };
      } catch (error) {
        console.error('Error fetching latest sentiment:', error);
        throw new Error('Failed to fetch latest sentiment');
      }
    },

    latestTechnicals: async (_, { ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted
           FROM technicals
           WHERE ticker = $1
           ORDER BY biz_date DESC
           LIMIT 1`,
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          biz_date: result.rows[0].biz_date_formatted
        };
      } catch (error) {
        console.error('Error fetching latest technicals:', error);
        throw new Error('Failed to fetch latest technicals');
      }
    },

    latestAgentSignal: async (_, { ticker, agent }) => {
      try {
        const result = await db.query(
          `SELECT *, 
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted
           FROM ai_analysis
           WHERE ticker = $1 AND agent = $2
           ORDER BY biz_date DESC
           LIMIT 1`,
          [ticker, agent]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          biz_date: result.rows[0].biz_date_formatted
        };
      } catch (error) {
        console.error('Error fetching latest agent signal:', error);
        throw new Error('Failed to fetch latest agent signal');
      }
    },

    latestSophieAnalysis: async (_, { ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
           TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted,
           TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at_formatted,
           TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at_formatted
           FROM sophie_analysis
           WHERE ticker = $1
           ORDER BY biz_date DESC
           LIMIT 1`,
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          biz_date: result.rows[0].biz_date_formatted,
          created_at: result.rows[0].created_at_formatted,
          updated_at: result.rows[0].updated_at_formatted
        };
      } catch (error) {
        console.error('Error fetching latest Sophie analysis:', error);
        throw new Error('Failed to fetch latest Sophie analysis');
      }
    },

    batchStocks: async (_, { tickers, start_date, end_date }) => {
      try {
        if (!tickers || tickers.length === 0) {
          throw new Error('At least one ticker must be provided');
        }

        // First get company facts for all tickers
        const tickerParams = tickers.map((_, i) => `$${i + 1}`).join(',');
        const companiesResult = await db.query(
          `SELECT * FROM company_facts WHERE ticker IN (${tickerParams})`,
          tickers
        );

        // Then get prices for all tickers
        let pricesQuery = `SELECT ticker, 
                         TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted,
                         open, high, low, close, volume
                         FROM prices 
                         WHERE ticker IN (${tickerParams})`;
        const pricesParams = [...tickers];
        
        if (start_date && end_date) {
          pricesQuery += ' AND biz_date BETWEEN $' + (tickers.length + 1) + ' AND $' + (tickers.length + 2);
          pricesParams.push(start_date, end_date);
        } else if (start_date) {
          pricesQuery += ' AND biz_date >= $' + (tickers.length + 1);
          pricesParams.push(start_date);
        } else if (end_date) {
          pricesQuery += ' AND biz_date <= $' + (tickers.length + 1);
          pricesParams.push(end_date);
        } else {
          pricesQuery += ' AND biz_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        }
        
        pricesQuery += ' ORDER BY ticker, biz_date DESC';
        const pricesResult = await db.query(pricesQuery, pricesParams);
        
        // Group prices by ticker
        const pricesByTicker = {};
        pricesResult.rows.forEach(row => {
          if (!pricesByTicker[row.ticker]) {
            pricesByTicker[row.ticker] = [];
          }
          pricesByTicker[row.ticker].push({
            biz_date: row.biz_date_formatted,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume
          });
        });
        
        // Get Sophie analysis for all tickers
        const sophieResults = await Promise.all(
          tickers.map(ticker => 
            db.query(
              `SELECT *,
               TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted,
               TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at_formatted,
               TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as updated_at_formatted
               FROM sophie_analysis
               WHERE ticker = $1
               ORDER BY biz_date DESC
               LIMIT 1`,
              [ticker]
            )
          )
        );

        // Combine company facts with prices and Sophie analysis
        return companiesResult.rows.map((company, index) => {
          const sophieRow = sophieResults[index].rows[0];
          return {
            ticker: company.ticker,
            company,
            prices: pricesByTicker[company.ticker] || [],
            latestSophieAnalysis: sophieRow ? {
              ...sophieRow,
              biz_date: sophieRow.biz_date_formatted,
              created_at: sophieRow.created_at_formatted,
              updated_at: sophieRow.updated_at_formatted
            } : null
          };
        });
      } catch (error) {
        console.error('Error fetching batch stocks:', error);
        throw new Error('Failed to fetch batch stock data');
      }
    },

    coveredTickers: async (_, { top }) => {
      try {
        let query = `
          SELECT 
            sa.ticker,
            sa.overall_score as score
          FROM sophie_analysis sa
          JOIN company_facts cf ON sa.ticker = cf.ticker
          WHERE sa.biz_date = (
            SELECT MAX(biz_date) 
            FROM sophie_analysis 
            WHERE ticker = sa.ticker
          )
          ORDER BY sa.overall_score DESC
        `;
        
        if (top) {
          query += ` LIMIT ${top}`;
        }

        const result = await db.query(query);
        return result.rows;
      } catch (error) {
        console.error('Error fetching covered tickers:', error);
        throw new Error('Failed to fetch covered tickers');
      }
    },

    stock: async (_, { ticker }) => {
      try {
        // We just need to verify the stock exists
        const result = await db.query(
          'SELECT ticker FROM company_facts WHERE ticker = $1',
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null; // Stock not found
        }
        
        // Return an object with the ticker for child resolvers to use
        return { ticker };
      } catch (error) {
        console.error('Error fetching stock:', error);
        throw new Error('Failed to fetch stock data');
      }
    },
  },
  
  Stock: {
    company: async ({ ticker }) => {
      try {
        const result = await db.query(
          'SELECT * FROM company_facts WHERE ticker = $1',
          [ticker]
        );
        
        if (result.rows.length === 0) {
          throw new Error(`Company facts not found for ticker: ${ticker}`);
        }
        
        return result.rows[0];
      } catch (error) {
        console.error('Error fetching company facts:', error);
        throw new Error('Failed to fetch company information');
      }
    },
    
    prices: async ({ ticker }, { start_date, end_date }) => {
      try {
        let queryText = `SELECT *,
                        TO_CHAR(biz_date, 'YYYY-MM-DD') as biz_date_formatted
                        FROM prices WHERE ticker = $1`;
        const queryParams = [ticker];
        
        if (start_date && end_date) {
          queryText += ' AND biz_date BETWEEN $2 AND $3';
          queryParams.push(start_date, end_date);
        } else if (start_date) {
          queryText += ' AND biz_date >= $2';
          queryParams.push(start_date);
        } else if (end_date) {
          queryText += ' AND biz_date <= $2';
          queryParams.push(end_date);
        } else {
          // If no dates are provided, get the most recent prices (last 30 days)
          queryText += ' AND biz_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        }
        
        queryText += ' ORDER BY biz_date DESC';
        
        const result = await db.query(queryText, queryParams);
        return result.rows.map(row => ({
          ...row,
          biz_date: row.biz_date_formatted
        }));
      } catch (error) {
        console.error('Error fetching prices:', error);
        throw new Error('Failed to fetch price data');
      }
    },
    
    news: async ({ ticker }, { limit = 100 }) => {
      try {
        const result = await db.query(
          `SELECT *,
          TO_CHAR(date, 'YYYY-MM-DD') as date_formatted
          FROM company_news WHERE ticker = $1 ORDER BY date DESC LIMIT $2`,
          [ticker, limit]
        );
        
        return result.rows.map(row => ({
          ...row,
          date: row.date_formatted
        }));
      } catch (error) {
        console.error('Error fetching company news:', error);
        throw new Error('Failed to fetch news data');
      }
    },

    financialMetrics: async ({ ticker }) => {
      try {
        const result = await db.query(
          `SELECT *, 
           TO_CHAR(report_period, 'YYYY-MM-DD') as report_period_formatted
           FROM financial_metrics 
           WHERE ticker = $1
           ORDER BY report_period DESC`,
          [ticker]
        );
        
        return result.rows.map(row => ({
          ...row,
          report_period: row.report_period_formatted
        }));
      } catch (error) {
        console.error('Error fetching financial metrics:', error);
        throw new Error('Failed to fetch financial metrics');
      }
    },

    financialMetricsLatest: async ({ ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
           TO_CHAR(report_period, 'YYYY-MM-DD') as report_period_formatted
           FROM financial_metrics 
           WHERE ticker = $1
           ORDER BY report_period DESC
           LIMIT 1`,
          [ticker]
        );
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return {
          ...result.rows[0],
          report_period: result.rows[0].report_period_formatted
        };
      } catch (error) {
        console.error('Error fetching latest financial metrics:', error);
        throw new Error('Failed to fetch latest financial metrics');
      }
    },
  },
};

module.exports = stockResolvers;
