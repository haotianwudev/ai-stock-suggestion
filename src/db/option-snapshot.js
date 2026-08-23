const db = require('../db');

// Minimum sessions before a percentile rank means anything. Below this, ranking a value
// against 3 prior observations produces a confident-looking number with no information in it,
// which is worse than showing nothing -- so the resolvers return null and expose sampleSize
// instead, letting the UI say "building history (4/20)".
const MIN_HISTORY = 20;

// Lookback for the skew-vs-price divergence read. ~1 trading month: long enough for a trend
// to establish, short enough that the current regime hasn't been averaged away.
const DIVERGENCE_WINDOW = 20;

/**
 * Latest daily summary, with each headline metric ranked against its own history.
 *
 * The rank is the point of this table. A raw risk reversal of +3.89 is uninterpretable on its
 * own -- the informative signal is where that level sits against how this surface normally
 * trades, which is exactly what a single-snapshot viewer can never tell you.
 */
async function getLatestSnapshot() {
  const result = await db.query(`
    WITH ranked AS (
      SELECT
        biz_date,
        spot, atm_iv, rr25, fly25, normalized_skew, net_gex_m, pcr_volume, pcr_oi,
        PERCENT_RANK() OVER (ORDER BY normalized_skew) AS ns_rank,
        PERCENT_RANK() OVER (ORDER BY rr25)            AS rr_rank,
        PERCENT_RANK() OVER (ORDER BY fly25)           AS fly_rank,
        PERCENT_RANK() OVER (ORDER BY atm_iv)          AS iv_rank,
        PERCENT_RANK() OVER (ORDER BY net_gex_m)       AS gex_rank,
        PERCENT_RANK() OVER (ORDER BY pcr_oi)          AS pcr_rank,
        COUNT(*)      OVER ()                          AS sample_size
      FROM spx_option_snapshot
    )
    SELECT
      TO_CHAR(s.biz_date, 'YYYY-MM-DD')       AS "bizDate",
      CAST(s.spot AS FLOAT)                   AS "spot",
      TO_CHAR(s.ref_expiration, 'YYYY-MM-DD') AS "refExpiration",
      s.ref_dte                               AS "refDte",
      CAST(s.atm_iv AS FLOAT)                 AS "atmIv",
      CAST(s.put25_iv AS FLOAT)               AS "put25Iv",
      CAST(s.call25_iv AS FLOAT)              AS "call25Iv",
      CAST(s.rr25 AS FLOAT)                   AS "rr25",
      CAST(s.fly25 AS FLOAT)                  AS "fly25",
      CAST(s.normalized_skew AS FLOAT)        AS "normalizedSkew",
      CAST(s.front_atm_iv AS FLOAT)           AS "frontAtmIv",
      CAST(s.back_atm_iv AS FLOAT)            AS "backAtmIv",
      CAST(s.term_slope AS FLOAT)             AS "termSlope",
      CAST(s.pcr_volume AS FLOAT)             AS "pcrVolume",
      CAST(s.pcr_oi AS FLOAT)                 AS "pcrOi",
      CAST(s.total_volume AS FLOAT)           AS "totalVolume",
      CAST(s.total_open_interest AS FLOAT)    AS "totalOpenInterest",
      CAST(s.net_gex_m AS FLOAT)              AS "netGexM",
      CAST(s.call_wall AS FLOAT)              AS "callWall",
      CAST(s.put_wall AS FLOAT)               AS "putWall",
      s.expiration_count                      AS "expirationCount",
      s.contract_count                        AS "contractCount",
      r.sample_size::INT                      AS "sampleSize",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.ns_rank  AS FLOAT) END AS "normalizedSkewRank",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.rr_rank  AS FLOAT) END AS "rr25Rank",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.fly_rank AS FLOAT) END AS "fly25Rank",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.iv_rank  AS FLOAT) END AS "atmIvRank",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.gex_rank AS FLOAT) END AS "netGexRank",
      CASE WHEN r.sample_size >= $1 THEN CAST(r.pcr_rank AS FLOAT) END AS "pcrOiRank"
    FROM spx_option_snapshot s
    JOIN ranked r ON r.biz_date = s.biz_date
    ORDER BY s.biz_date DESC
    LIMIT 1
  `, [MIN_HISTORY]);
  return result.rows[0] || null;
}

/**
 * Summary history for sparklines and the divergence read.
 */
async function getSnapshotHistory(sessions = 120) {
  const result = await db.query(`
    SELECT
      TO_CHAR(biz_date, 'YYYY-MM-DD')  AS "bizDate",
      CAST(spot AS FLOAT)              AS "spot",
      CAST(atm_iv AS FLOAT)            AS "atmIv",
      CAST(rr25 AS FLOAT)              AS "rr25",
      CAST(fly25 AS FLOAT)             AS "fly25",
      CAST(normalized_skew AS FLOAT)   AS "normalizedSkew",
      CAST(net_gex_m AS FLOAT)         AS "netGexM",
      CAST(pcr_volume AS FLOAT)        AS "pcrVolume",
      CAST(pcr_oi AS FLOAT)            AS "pcrOi"
    FROM (
      SELECT * FROM spx_option_snapshot ORDER BY biz_date DESC LIMIT $1
    ) recent
    ORDER BY biz_date ASC
  `, [sessions]);
  return result.rows;
}

/**
 * Skew-vs-price divergence over the trailing window.
 *
 * This is the read a single snapshot structurally cannot produce. A rising market with
 * steepening skew is hedged participation ("wall of worry"); the same rally with flattening
 * skew is the same price action with the protection stripped out. Level alone cannot separate
 * them -- only the joint direction of price and skew can.
 */
async function getDivergence(window = DIVERGENCE_WINDOW) {
  const result = await db.query(`
    WITH bounds AS (
      SELECT * FROM (
        SELECT * FROM spx_option_snapshot ORDER BY biz_date DESC LIMIT $1
      ) w ORDER BY biz_date ASC
    ),
    endpoints AS (
      SELECT
        (SELECT spot            FROM bounds ORDER BY biz_date ASC  LIMIT 1) AS spot_start,
        (SELECT spot            FROM bounds ORDER BY biz_date DESC LIMIT 1) AS spot_end,
        (SELECT normalized_skew FROM bounds ORDER BY biz_date ASC  LIMIT 1) AS skew_start,
        (SELECT normalized_skew FROM bounds ORDER BY biz_date DESC LIMIT 1) AS skew_end,
        (SELECT COUNT(*)        FROM bounds)                                AS n,
        (SELECT TO_CHAR(MIN(biz_date), 'YYYY-MM-DD') FROM bounds)           AS from_date,
        (SELECT TO_CHAR(MAX(biz_date), 'YYYY-MM-DD') FROM bounds)           AS to_date
    )
    SELECT
      n::INT                                              AS "sessions",
      from_date                                           AS "fromDate",
      to_date                                             AS "toDate",
      CAST(spot_end - spot_start AS FLOAT)                 AS "priceChange",
      CAST((spot_end - spot_start) / NULLIF(spot_start,0) * 100 AS FLOAT) AS "priceChangePct",
      CAST(skew_end - skew_start AS FLOAT)                 AS "skewChange"
    FROM endpoints
  `, [window]);

  const row = result.rows[0];
  // A window of one session has no change to measure -- both deltas are zero by construction,
  // which would classify as a spurious regime rather than "not enough data yet".
  if (!row || row.sessions < 2) {
    return { sessions: row ? row.sessions : 0, state: null, fromDate: null, toDate: null,
             priceChange: null, priceChangePct: null, skewChange: null };
  }
  return { ...row, state: classifyDivergence(row.priceChange, row.skewChange) };
}

function classifyDivergence(priceChange, skewChange) {
  if (priceChange == null || skewChange == null) return null;
  const up = priceChange > 0;
  const steepening = skewChange > 0;
  if (up && steepening) return 'WALL_OF_WORRY';
  if (up && !steepening) return 'EUPHORIA';
  if (!up && steepening) return 'FEAR_CONFIRMING';
  return 'CAPITULATION_RELIEF';
}

/**
 * Session-over-session open-interest change, aggregated by side.
 *
 * Volume alone says how much traded; it cannot say whether that trading opened or closed
 * positions. Open interest rising alongside heavy volume is conviction being built; open
 * interest falling on the same volume is an unwind wearing the same clothes. Only the pair
 * separates them, which is why this needs two sessions of stored chain and cannot be derived
 * from any single snapshot.
 */
async function getOpenInterestFlow() {
  const result = await db.query(`
    WITH sessions AS (
      SELECT DISTINCT biz_date FROM spx_option_chain_snapshot ORDER BY biz_date DESC LIMIT 2
    ),
    cur  AS (SELECT MAX(biz_date) AS d FROM sessions),
    prev AS (SELECT MIN(biz_date) AS d FROM sessions),
    joined AS (
      SELECT
        c.opt_type,
        c.open_interest                        AS oi_now,
        COALESCE(p.open_interest, 0)           AS oi_prev,
        c.volume                               AS vol_now
      FROM spx_option_chain_snapshot c
      LEFT JOIN spx_option_chain_snapshot p
        ON  p.biz_date   = (SELECT d FROM prev)
        AND p.expiration = c.expiration
        AND p.root       = c.root
        AND p.opt_type   = c.opt_type
        AND p.strike     = c.strike
      WHERE c.biz_date = (SELECT d FROM cur)
    )
    SELECT
      (SELECT TO_CHAR(d, 'YYYY-MM-DD') FROM cur)  AS "bizDate",
      (SELECT TO_CHAR(d, 'YYYY-MM-DD') FROM prev) AS "priorDate",
      (SELECT COUNT(*) FROM sessions)::INT        AS "sessionsAvailable",
      -- Cast to FLOAT rather than BIGINT: pg returns bigint as a *string* to protect precision,
      -- which would then lean on GraphQL's implicit string->Float coercion. These counts are far
      -- below 2^53, so a double is lossless here and the type crossing the wire is unambiguous.
      CAST(SUM(CASE WHEN opt_type='C' THEN oi_now - oi_prev ELSE 0 END) AS FLOAT) AS "callOiChange",
      CAST(SUM(CASE WHEN opt_type='P' THEN oi_now - oi_prev ELSE 0 END) AS FLOAT) AS "putOiChange",
      CAST(SUM(CASE WHEN opt_type='C' THEN oi_now ELSE 0 END) AS FLOAT)           AS "callOi",
      CAST(SUM(CASE WHEN opt_type='P' THEN oi_now ELSE 0 END) AS FLOAT)           AS "putOi",
      CAST(SUM(CASE WHEN opt_type='C' THEN vol_now ELSE 0 END) AS FLOAT)          AS "callVolume",
      CAST(SUM(CASE WHEN opt_type='P' THEN vol_now ELSE 0 END) AS FLOAT)          AS "putVolume"
    FROM joined
  `);

  const row = result.rows[0];
  if (!row || row.sessionsAvailable < 2) {
    return {
      bizDate: row ? row.bizDate : null,
      priorDate: null,
      sessionsAvailable: row ? row.sessionsAvailable : 0,
      callOiChange: null, putOiChange: null,
      callOi: row ? row.callOi : null, putOi: row ? row.putOi : null,
      callVolume: row ? row.callVolume : null, putVolume: row ? row.putVolume : null,
      callState: null, putState: null,
    };
  }

  return {
    ...row,
    callState: classifyFlow(Number(row.callOiChange), Number(row.callOi), Number(row.callVolume)),
    putState: classifyFlow(Number(row.putOiChange), Number(row.putOi), Number(row.putVolume)),
  };
}

/**
 * Classify one side's flow from the sign of its OI change relative to how much traded.
 *
 * The threshold is expressed against the day's own volume rather than as an absolute contract
 * count, because "10,000 contracts of OI change" means something completely different on a
 * 2,000-lot day than on a 2,000,000-lot one.
 */
function classifyFlow(oiChange, oi, volume) {
  if (!Number.isFinite(oiChange) || !volume) return null;
  const ratio = oiChange / volume;
  if (ratio > 0.15) return 'BUILDING';   // new positions opened
  if (ratio < -0.15) return 'CLOSING';   // positions unwound / covered
  return 'CHURNING';                      // heavy trading, flat net positioning
}

/**
 * Largest per-strike open-interest changes, for the "where did it move" table.
 */
async function getStrikeFlow(limit = 12) {
  const result = await db.query(`
    WITH sessions AS (
      SELECT DISTINCT biz_date FROM spx_option_chain_snapshot ORDER BY biz_date DESC LIMIT 2
    ),
    cur AS (SELECT MAX(biz_date) AS d FROM sessions),
    prev AS (SELECT MIN(biz_date) AS d FROM sessions)
    SELECT
      TO_CHAR(c.expiration, 'YYYY-MM-DD')          AS "expiration",
      c.opt_type                                   AS "optType",
      CAST(c.strike AS FLOAT)                      AS "strike",
      CAST(c.open_interest AS FLOAT)               AS "openInterest",
      CAST(c.open_interest - COALESCE(p.open_interest, 0) AS FLOAT) AS "oiChange",
      CAST(c.volume AS FLOAT)                      AS "volume"
    FROM spx_option_chain_snapshot c
    LEFT JOIN spx_option_chain_snapshot p
      ON  p.biz_date   = (SELECT d FROM prev)
      AND p.expiration = c.expiration
      AND p.root       = c.root
      AND p.opt_type   = c.opt_type
      AND p.strike     = c.strike
    WHERE c.biz_date = (SELECT d FROM cur)
      AND (SELECT COUNT(*) FROM sessions) >= 2
    ORDER BY ABS(c.open_interest - COALESCE(p.open_interest, 0)) DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

module.exports = {
  getLatestSnapshot,
  getSnapshotHistory,
  getDivergence,
  getOpenInterestFlow,
  getStrikeFlow,
  MIN_HISTORY,
};
