const db = require('../db');

// Shared column projection — the regime panel and the history chart read the
// same shape, so keep one definition rather than two drifting copies.
const REGIME_SELECT = `
  TO_CHAR(biz_date, 'YYYY-MM-DD')     AS "bizDate",
  CAST(spx_close AS FLOAT)             AS "spxClose",
  CAST(vix AS FLOAT)                   AS "vix",
  CAST(vix3m AS FLOAT)                 AS "vix3m",
  CAST(realized_vol_20d AS FLOAT)      AS "realizedVol20d",
  CAST(realized_vol_10d AS FLOAT)      AS "realizedVol10d",
  CAST(vrp AS FLOAT)                   AS "vrp",
  CAST(vrp_z AS FLOAT)                 AS "vrpZ",
  CAST(vrp_percentile AS FLOAT)        AS "vrpPercentile",
  CAST(vix_rank AS FLOAT)              AS "vixRank",
  CAST(term_slope AS FLOAT)            AS "termSlope",
  term_structure                       AS "termStructure",
  regime                               AS "regime",
  CAST(regime_score AS FLOAT)          AS "regimeScore"
`;

async function getLatestData() {
  const result = await db.query(`
    SELECT ${REGIME_SELECT}
    FROM vol_regime_data
    ORDER BY biz_date DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

async function getHistoricalData(days = 252) {
  const result = await db.query(`
    SELECT ${REGIME_SELECT}
    FROM vol_regime_data
    WHERE biz_date >= CURRENT_DATE - ($1 || ' days')::INTERVAL
    ORDER BY biz_date ASC
  `, [days]);
  return result.rows;
}

/**
 * How the current regime has historically paid, measured over the full sample.
 * This is what turns the label into a decision: "Harvest" means little until you
 * see that VRP averaged +6 in that regime versus -3.8 in Crisis.
 */
async function getRegimeStats() {
  const result = await db.query(`
    SELECT
      regime                                   AS "regime",
      COUNT(*)::INT                            AS "days",
      CAST(ROUND(AVG(vrp)::numeric, 2) AS FLOAT)      AS "avgVrp",
      CAST(ROUND(AVG(vix)::numeric, 2) AS FLOAT)      AS "avgVix",
      CAST(ROUND(AVG(vix_rank)::numeric, 4) AS FLOAT) AS "avgVixRank",
      CAST(ROUND((100.0 * COUNT(*) / SUM(COUNT(*)) OVER ())::numeric, 1) AS FLOAT) AS "pctOfDays"
    FROM vol_regime_data
    GROUP BY regime
    ORDER BY "avgVrp" DESC
  `);
  return result.rows;
}

module.exports = { getLatestData, getHistoricalData, getRegimeStats };
