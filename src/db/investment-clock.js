const db = require('../db');

async function getLatestEvaluation() {
  const result = await db.query(`
    SELECT
      TO_CHAR(biz_date, 'YYYY-MM-DD') AS "bizDate",
      final_phase                      AS "finalPhase",
      CAST(phase_confidence AS FLOAT)  AS "phaseConfidence",
      phase_direction                  AS "phaseDirection",
      reasoning,
      outlook,
      key_indicators                   AS "keyIndicators",
      risks,
      best_asset                       AS "bestAsset",
      recommended_sectors              AS "recommendedSectors",
      gemini_research_summary          AS "geminiResearchSummary",
      phase_probabilities              AS "phaseProbabilities",
      monitoring_triggers              AS "monitoringTriggers",
      sector_rationale                 AS "sectorRationale"
    FROM investment_clock_evaluation
    ORDER BY biz_date DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

async function getLatestData() {
  const result = await db.query(`
    WITH lagged AS (
      SELECT
        biz_date,
        growth_z_score, inflation_z_score, data_phase, clock_angle,
        gdp_value,    LAG(gdp_value,    12) OVER (ORDER BY biz_date) AS gdp_prev,
        cpi_value,    LAG(cpi_value,    12) OVER (ORDER BY biz_date) AS cpi_prev,
        indpro_value, LAG(indpro_value, 12) OVER (ORDER BY biz_date) AS indpro_prev,
        tcu_value,
        unrate_value, LAG(unrate_value, 12) OVER (ORDER BY biz_date) AS unrate_prev,
        cli_value,    LAG(cli_value,    12) OVER (ORDER BY biz_date) AS cli_prev,
        icsa_value,   LAG(icsa_value,   12) OVER (ORDER BY biz_date) AS icsa_prev,
        cpi_yoy,
        cpi_mom_ann
      FROM investment_clock_data
    )
    SELECT
      TO_CHAR(biz_date, 'YYYY-MM-DD')   AS "bizDate",
      CAST(growth_z_score AS FLOAT)      AS "growthZScore",
      CAST(inflation_z_score AS FLOAT)   AS "inflationZScore",
      data_phase                         AS "dataPhase",
      CAST(clock_angle AS FLOAT)         AS "clockAngle",
      CAST(gdp_value AS FLOAT)           AS "gdpValue",
      CAST(cpi_value AS FLOAT)           AS "cpiValue",
      CAST(indpro_value AS FLOAT)        AS "indproValue",
      CAST(tcu_value AS FLOAT)           AS "tcuValue",
      CAST(unrate_value AS FLOAT)        AS "unrateValue",
      CAST(cli_value AS FLOAT)           AS "cliValue",
      CAST(icsa_value AS FLOAT)          AS "icsaValue",
      CAST(cpi_yoy AS FLOAT)            AS "cpiYoy",
      CAST(cpi_mom_ann AS FLOAT)         AS "cpiMomAnn",
      CASE WHEN gdp_prev    IS NOT NULL AND gdp_prev    <> 0
        THEN CAST(ROUND(((gdp_value    - gdp_prev)    / gdp_prev    * 100)::numeric, 2) AS FLOAT) END AS "gdpYoyPct",
      CASE WHEN cpi_prev    IS NOT NULL AND cpi_prev    <> 0
        THEN CAST(ROUND(((cpi_value    - cpi_prev)    / cpi_prev    * 100)::numeric, 2) AS FLOAT) END AS "cpiYoyPct",
      CASE WHEN indpro_prev IS NOT NULL AND indpro_prev <> 0
        THEN CAST(ROUND(((indpro_value - indpro_prev) / indpro_prev * 100)::numeric, 2) AS FLOAT) END AS "indproYoyPct",
      CASE WHEN cli_prev IS NOT NULL
        THEN CAST(ROUND((cli_value - cli_prev)::numeric, 2) AS FLOAT) END AS "cliYoyChange",
      CASE WHEN icsa_prev IS NOT NULL AND icsa_prev <> 0
        THEN CAST(ROUND(((icsa_value - icsa_prev) / icsa_prev * 100)::numeric, 1) AS FLOAT) END AS "icsaYoyPct",
      CASE WHEN unrate_prev IS NOT NULL
        THEN CAST(ROUND((unrate_value - unrate_prev)::numeric, 1) AS FLOAT) END AS "unrateYoyChange"
    FROM lagged
    ORDER BY biz_date DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

async function getHistoricalData(months = 24) {
  const result = await db.query(`
    SELECT
      TO_CHAR(biz_date, 'YYYY-MM-DD')  AS "bizDate",
      CAST(growth_z_score AS FLOAT)     AS "growthZScore",
      CAST(inflation_z_score AS FLOAT)  AS "inflationZScore",
      data_phase                        AS "dataPhase",
      CAST(clock_angle AS FLOAT)        AS "clockAngle",
      CAST(gdp_value AS FLOAT)          AS "gdpValue",
      CAST(cpi_value AS FLOAT)          AS "cpiValue",
      CAST(indpro_value AS FLOAT)       AS "indproValue",
      CAST(tcu_value AS FLOAT)          AS "tcuValue",
      CAST(unrate_value AS FLOAT)       AS "unrateValue",
      CAST(cli_value AS FLOAT)          AS "cliValue",
      CAST(icsa_value AS FLOAT)         AS "icsaValue",
      CAST(cpi_yoy AS FLOAT)           AS "cpiYoy",
      CAST(cpi_mom_ann AS FLOAT)        AS "cpiMomAnn"
    FROM investment_clock_data
    WHERE biz_date >= CURRENT_DATE - ($1 || ' months')::INTERVAL
    ORDER BY biz_date ASC
  `, [months]);
  return result.rows;
}

module.exports = { getLatestEvaluation, getLatestData, getHistoricalData };
