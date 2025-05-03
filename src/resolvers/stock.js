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
    
    news: async ({ ticker }) => {
      try {
        const result = await db.query(
          `SELECT *,
          TO_CHAR(date, 'YYYY-MM-DD') as date_formatted
          FROM company_news WHERE ticker = $1 ORDER BY date DESC`,
          [ticker]
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
