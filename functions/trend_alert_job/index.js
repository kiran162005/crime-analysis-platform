'use strict';
const catalyst = require('zcatalyst-sdk-node');

// --- Tunables ---
const LOOKBACK_DAYS = 14;       // window used to compute the "normal" baseline
const SPIKE_THRESHOLD = 1.5;    // current-period count >= 1.5x baseline avg triggers an alert
const MIN_BASELINE_SAMPLE = 3;  // don't alert off a baseline with too few historical days

/**
 * Job function — triggered nightly via Job Scheduling.
 * Recomputes trend deltas per (district, crime_type) and writes:
 *   - risk_scores: updated predicted_risk_score for the slice
 *   - alerts: a new row when today's count spikes vs the rolling baseline
 *
 * Idempotent: safe to re-run manually — it always recomputes from source data,
 * it doesn't increment anything.
 */
module.exports = async (jobData, context) => {
  try {
    const catalystApp = catalyst.initialize(context, { scope: 'admin' });
    const zcql = catalystApp.zcql();

    // 1. Pull today's incidents (grouped by district + crime_type) and the
    //    baseline window's incidents in two queries, then aggregate in memory.
    //    (ZCQL GROUP BY works, but doing the date-window math in JS keeps the
    //    query simple and avoids timezone edge cases in ZCQL date functions.)
    const todayRows = await fetchAllRows(
      zcql,
      `SELECT district, crime_type, incident_id FROM incidents
       WHERE date_time >= '${isoDaysAgo(1)}'`,
      'incidents'
    );

    const baselineRows = await fetchAllRows(
      zcql,
      `SELECT district, crime_type, incident_id, date_time FROM incidents
       WHERE date_time >= '${isoDaysAgo(LOOKBACK_DAYS)}'
         AND date_time < '${isoDaysAgo(1)}'`,
      'incidents'
    );

    // 2. Aggregate: today's count per (district, crime_type)
    const todayCounts = countBy(todayRows, (r) => sliceKey(r.district, r.crime_type));

    // 3. Aggregate: baseline daily average per (district, crime_type)
    const baselineCounts = countBy(baselineRows, (r) => sliceKey(r.district, r.crime_type));
    const baselineAverages = {};
    for (const key of Object.keys(baselineCounts)) {
      baselineAverages[key] = baselineCounts[key] / LOOKBACK_DAYS;
    }

    // 4. Walk every slice seen today (a slice with zero history just won't have
    //    a baseline entry — treat that as "no alert", not divide-by-zero).
    const riskScoreUpserts = [];
    const alertInserts = [];
    const today = new Date().toISOString();

    for (const key of Object.keys(todayCounts)) {
      const [district, crimeType] = key.split('::');
      const currentCount = todayCounts[key];
      const baselineAvg = baselineAverages[key] || 0;
      const baselineSampleDays = baselineCounts[key] ? LOOKBACK_DAYS : 0;

      // Simple, explainable risk score: normalize current count against baseline.
      // This is intentionally rule-based, not a model — don't let this get
      // presented as "the ML risk score" in the pitch, that's Zia AutoML's job.
      // (No model_version column on this table, so that tag lives only in this
      // comment/your docs — not in the data itself.)
      const predictedRiskScore = baselineAvg > 0
        ? round2(currentCount / baselineAvg)
        : round2(currentCount); // no history yet — flag proportional to raw count

      // Schema: risk_scores(district, crime_type, prediction_date, predicted_score)
      // predicted_score is a double column — send a number, not a string.
      riskScoreUpserts.push({
        district,
        crime_type: crimeType,
        prediction_date: today,
        predicted_score: predictedRiskScore
      });

      const hasEnoughHistory = baselineSampleDays >= MIN_BASELINE_SAMPLE;
      const spikeRatio = baselineAvg > 0 ? currentCount / baselineAvg : null;

      if (hasEnoughHistory && spikeRatio !== null && spikeRatio >= SPIKE_THRESHOLD) {
        // Schema: alerts(alert_id, district, crime_type, spike_ratio, generated_at)
        // spike_ratio is a double column — send a number, not a string.
        // alert_id isn't auto-generated (that's ROWID's job) — build a readable
        // business key so it's traceable back to the slice/day that raised it.
        alertInserts.push({
          alert_id: `${district}_${crimeType}_${today.slice(0, 10)}`.replace(/\s+/g, '_'),
          district,
          crime_type: crimeType,
          spike_ratio: round2(spikeRatio),
          generated_at: today
        });
      }
    }

    // 5. Write results. Bulk insert caps at 200 rows — chunk defensively even
    //    though a hackathon dataset won't get near that.
    if (riskScoreUpserts.length > 0) {
      await insertInChunks(catalystApp, 'risk_scores', riskScoreUpserts);
    }
    if (alertInserts.length > 0) {
      await insertInChunks(catalystApp, 'alerts', alertInserts);
    }

    console.log(
      `trend_alert_job: ${Object.keys(todayCounts).length} slices scored, ` +
      `${alertInserts.length} alerts raised`
    );

    context.closeWithSuccess();
  } catch (error) {
    console.error('trend_alert_job failed:', error);
    context.closeWithFailure();
  }
};

// ---------- helpers ----------

function sliceKey(district, crimeType) {
  return `${district}::${crimeType}`;
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 19).replace('T', ' '); // ZCQL-friendly 'YYYY-MM-DD HH:MM:SS'
}

/**
 * ZCQL caps at 300 rows/query. Paginate with LIMIT offset, count until a page
 * comes back short of PAGE_SIZE. Unwraps the table-name wrapper on every row.
 */
async function fetchAllRows(zcql, baseQuery, tableName) {
  const PAGE_SIZE = 300;
  let offset = 0;
  let all = [];
  while (true) {
    const paged = `${baseQuery} LIMIT ${offset}, ${PAGE_SIZE}`;
    const result = await zcql.executeZCQLQuery(paged);
    const rows = result.map((r) => r[tableName]).filter(Boolean);
    all = all.concat(rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

/**
 * insertRows() caps at 200 rows per call — chunk any larger batch.
 */
async function insertInChunks(catalystApp, tableName, rows, chunkSize = 200) {
  const table = catalystApp.datastore().table(tableName);
  for (let i = 0; i < rows.length; i += chunkSize) {
    await table.insertRows(rows.slice(i, i + chunkSize));
  }
}