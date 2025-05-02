const { query } = require('../db');

// Stock resolvers
const stockResolvers = {
  Query: {
    stock: async (_, { ticker }) => {
      try {
        // We just need to verify the stock exists
        const result = await query(
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
        const result = await query(
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
    
    prices: async ({ ticker }, { biz_date }) => {
      try {
        // If biz_date is provided, filter by that date, otherwise get recent prices
        let queryText = 'SELECT * FROM prices WHERE ticker = $1';
        const queryParams = [ticker];
        
        if (biz_date) {
          queryText += ' AND biz_date = $2';
          queryParams.push(biz_date);
        } else {
          // If no date is provided, get the most recent prices (last 30 days)
          queryText += ' AND biz_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        }
        
        queryText += ' ORDER BY biz_date DESC';
        
        const result = await query(queryText, queryParams);
        return result.rows;
      } catch (error) {
        console.error('Error fetching prices:', error);
        throw new Error('Failed to fetch price data');
      }
    },
    
    news: async ({ ticker }) => {
      try {
        const result = await query(
          'SELECT * FROM company_news WHERE ticker = $1 ORDER BY date DESC',
          [ticker]
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error fetching company news:', error);
        throw new Error('Failed to fetch news data');
      }
    },
  },
};

module.exports = stockResolvers; 