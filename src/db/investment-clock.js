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
      CAST(unrate_value AS FLOAT)       AS "unrateValue"
    FROM investment_clock_data
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
      CAST(unrate_value AS FLOAT)       AS "unrateValue"
    FROM investment_clock_data
    WHERE biz_date >= CURRENT_DATE - ($1 || ' months')::INTERVAL
    ORDER BY biz_date ASC
  `, [months]);
  return result.rows;
}

module.exports = { getLatestEvaluation, getLatestData, getHistoricalData };
