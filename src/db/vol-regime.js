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
  CAST(vrp_variance AS FLOAT)          AS "vrpVariance",
  CAST(downside_variance_share AS FLOAT) AS "downsideVarianceShare",
  CAST(fwd_realized_vol_21d AS FLOAT)  AS "fwdRealizedVol21d",
  CAST(fwd_earned_premium AS FLOAT)    AS "fwdEarnedPremium",
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
      CAST(ROUND(AVG(vrp_variance)::numeric, 2) AS FLOAT) AS "avgVrpVariance",
      CAST(ROUND(AVG(downside_variance_share)::numeric, 3) AS FLOAT) AS "avgDownsideVarianceShare",
      CAST(ROUND(AVG(vix)::numeric, 2) AS FLOAT)      AS "avgVix",
      CAST(ROUND(AVG(vix_rank)::numeric, 4) AS FLOAT) AS "avgVixRank",
      CAST(ROUND((100.0 * COUNT(*) / SUM(COUNT(*)) OVER ())::numeric, 1) AS FLOAT) AS "pctOfDays"
    FROM vol_regime_data
    GROUP BY regime
    ORDER BY "avgVrp" DESC
  `);
  return result.rows;
}

/**
 * Does today's VRP level actually predict the premium a seller collects 21
 * sessions later? Static full-sample quintiles of vrp_z against the
 * forward-realized outcome — the honest answer to "should I time entries off
 * how rich the premium looks."
 */
async function getVrpQuintileStats() {
  const result = await db.query(`
    WITH ranked AS (
      SELECT
        vrp_z, fwd_earned_premium,
        NTILE(5) OVER (ORDER BY vrp_z) AS quintile
      FROM vol_regime_data
      WHERE vrp_z IS NOT NULL AND fwd_earned_premium IS NOT NULL
    )
    SELECT
      quintile                                                  AS "quintile",
      COUNT(*)::INT                                             AS "days",
      CAST(ROUND(MIN(vrp_z)::numeric, 3) AS FLOAT)               AS "vrpZMin",
      CAST(ROUND(MAX(vrp_z)::numeric, 3) AS FLOAT)               AS "vrpZMax",
      CAST(ROUND(AVG(fwd_earned_premium)::numeric, 3) AS FLOAT)  AS "avgForwardEarned",
      CAST(ROUND((100.0 * AVG((fwd_earned_premium > 0)::int))::numeric, 1) AS FLOAT) AS "hitRatePct"
    FROM ranked
    GROUP BY quintile
    ORDER BY quintile
  `);
  return result.rows;
}

/**
 * P(regime 21 sessions from now | regime today) — the risk-relevant cut.
 * VRP level barely predicts the earned premium (see getVrpQuintileStats), but
 * the regime label predicts transition into Crisis quite differently
 * depending on where you start.
 */
async function getRegimeTransitions() {
  const result = await db.query(`
    WITH transitions AS (
      SELECT
        regime AS from_regime,
        LEAD(regime, 21) OVER (ORDER BY biz_date) AS to_regime
      FROM vol_regime_data
    )
    SELECT
      from_regime                                              AS "fromRegime",
      to_regime                                                AS "toRegime",
      COUNT(*)::INT                                            AS "count",
      CAST(ROUND((COUNT(*) * 1.0 / SUM(COUNT(*)) OVER (PARTITION BY from_regime))::numeric, 4) AS FLOAT) AS "probability"
    FROM transitions
    WHERE to_regime IS NOT NULL
    GROUP BY from_regime, to_regime
    ORDER BY from_regime, "probability" DESC
  `);
  return result.rows;
}

module.exports = {
  getLatestData, getHistoricalData, getRegimeStats,
  getVrpQuintileStats, getRegimeTransitions,
};
