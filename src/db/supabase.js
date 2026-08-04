require('dotenv').config();
const { Pool } = require('pg');

// Second, separate Postgres instance (Supabase) — holds auth/profiles/forum data only.
// Kept fully independent from src/db/index.js (market data) per the v1 decision to
// isolate user-owned data rather than consolidate into one database.
const connectionString = `postgres://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}/${process.env.SUPABASE_DB_NAME}`;
console.log('Connecting to Supabase DB:', process.env.SUPABASE_DB_HOST);

const pool = new Pool({
  connectionString,
  // Disable for local Postgres (e.g. Supabase CLI's local dev stack) via
  // SUPABASE_DB_SSL=false; real Supabase projects require SSL.
  ssl: process.env.SUPABASE_DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Supabase client', err);
  process.exit(-1);
});

/**
 * Execute SQL query with parameters against the Supabase database
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed Supabase query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error executing Supabase query', { text, error });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  pool
};
