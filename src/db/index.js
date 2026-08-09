require('dotenv').config();
const { Pool } = require('pg');

// Create a pool instance to manage PostgreSQL connections
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
console.log('Connecting to:', process.env.DB_HOST);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute SQL query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
// Logging the full query text on every call adds real per-request overhead
// (synchronous stdout writes) on hot paths like the profile lookup that runs
// on nearly every authenticated page load. Only log queries slow enough to
// actually matter for debugging.
const SLOW_QUERY_MS = 200;

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    if (duration > SLOW_QUERY_MS) {
      console.log('Slow query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  pool // Exporting the pool for direct access if needed
};
