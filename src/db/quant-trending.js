const db = require('./index');

async function getTrendingItems(source = null, limit = 50) {
  let query;
  let params;

  if (source) {
    query = `
      SELECT
        id,
        source,
        title,
        url,
        description,
        author,
        CAST(heat_score AS FLOAT) AS "heatScore",
        CAST(raw_score  AS FLOAT) AS "rawScore",
        tags,
        TO_CHAR(published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "publishedAt",
        TO_CHAR(fetched_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "fetchedAt"
      FROM quant_trending_items
      WHERE source = $1
      ORDER BY heat_score DESC
      LIMIT $2
    `;
    params = [source, limit];
  } else {
    query = `
      SELECT
        id,
        source,
        title,
        url,
        description,
        author,
        CAST(heat_score AS FLOAT) AS "heatScore",
        CAST(raw_score  AS FLOAT) AS "rawScore",
        tags,
        TO_CHAR(published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "publishedAt",
        TO_CHAR(fetched_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "fetchedAt"
      FROM quant_trending_items
      ORDER BY heat_score DESC
      LIMIT $1
    `;
    params = [limit];
  }

  const result = await db.query(query, params);
  return result.rows;
}

async function getLastUpdated() {
  const result = await db.query(
    `SELECT TO_CHAR(MAX(fetched_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "lastUpdated"
     FROM quant_trending_items`
  );
  return result.rows[0]?.lastUpdated || null;
}

module.exports = { getTrendingItems, getLastUpdated };
