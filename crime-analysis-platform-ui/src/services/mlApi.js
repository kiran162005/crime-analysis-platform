/**
 * services/mlApi.js
 * Real integration point for the ML service's /hotspots and /anomalies
 * endpoints (see appsail-python/app.py). Two responsibilities:
 *   1. Call the actual endpoints (once an `incidents` array is available
 *      from the Team Lead's incidents-crud endpoint — not yet wired here).
 *   2. Transform their exact response shape into what our existing
 *      HotspotLayer / AlertFeed components already expect, so swapping
 *      mock data for the live call later is a one-line change, not a
 *      component rewrite.
 */
import { districtName, crimeTypeName } from './lookupTables';

// Set this once the ML service is deployed and reachable.
const ML_API_BASE_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:9000';

/**
 * POST /hotspots — real call. Needs an `incidents` array shaped like
 * [{ CaseMasterID, latitude, longitude, IncidentFromDate, CrimeMinorHeadID, DistrictID }, ...]
 * which should come from the Team Lead's incidents endpoint.
 */
export async function fetchHotspotsFromApi(incidents) {
  const res = await fetch(`${ML_API_BASE_URL}/hotspots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidents }),
  });
  if (!res.ok) throw new Error(`Hotspot API error: ${res.status}`);
  return res.json(); // { hotspots: [...], noise_count, total, params }
}

/** POST /anomalies — same incidents-array requirement as above. */
export async function fetchAnomaliesFromApi(incidents) {
  const res = await fetch(`${ML_API_BASE_URL}/anomalies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidents }),
  });
  if (!res.ok) throw new Error(`Anomalies API error: ${res.status}`);
  return res.json(); // { anomalies: [...], total, flagged_count, params }
}

/**
 * Converts a raw /hotspots API response into the shape HotspotLayer.jsx
 * already expects: { id, lat, lng, label, spikeRatio, note }.
 * "spikeRatio" here is a proxy — cluster size relative to the largest
 * cluster in the batch — since the real API doesn't return a spike
 * ratio directly. Revisit this once real cluster sizes are seen; the
 * mapping was invented for visual severity banding, not from the ML
 * team's spec.
 */
export function transformHotspotsResponse(apiResponse) {
  const { hotspots = [] } = apiResponse;
  const maxSize = Math.max(1, ...hotspots.map((h) => h.size));

  return hotspots.map((h) => ({
    id: `cluster-${h.cluster_id}`,
    lat: h.centroid_lat,
    lng: h.centroid_lon,
    label: `${crimeTypeName(h.top_crime_subhead)}${
      h.top_district != null ? `, ${districtName(h.top_district)}` : ''
    }`,
    spikeRatio: 1 + (h.size / maxSize) * 2, // proxy scale, see note above
    note: `${h.size} incidents, avg hour ${h.avg_hour}`,
  }));
}

/**
 * Converts a raw /anomalies API response into the shape AlertFeed.jsx
 * already expects: { id, district, crimeType, spikeRatio, timestamp, note }.
 * anomaly_score is a decision_function output (more negative = more
 * anomalous) — NOT the same scale as a spike ratio. This proxy just
 * ranks flagged anomalies and buckets severity by rank percentile;
 * revisit the exact thresholds once real score distributions are seen.
 */
export function transformAnomaliesResponse(apiResponse) {
  const { anomalies = [] } = apiResponse;
  const sorted = [...anomalies].sort((a, b) => a.anomaly_score - b.anomaly_score);

  return sorted.map((a, i) => {
    const percentile = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    // Most anomalous (lowest score, percentile ~0) = highest severity proxy.
    const spikeRatioProxy = 2.8 - percentile * 1.4; // maps to Severe..Mild bands in AlertBadge

    return {
      id: `anomaly-${a.case_id ?? i}`,
      district: districtName(a.district_id),
      crimeType: crimeTypeName(a.crime_subhead),
      spikeRatio: spikeRatioProxy,
      timestamp: new Date().toISOString(), // API doesn't return one; using fetch time as placeholder
      note: `Unusual for this district/time — deviation score ${a.hour_deviation}`,
    };
  });
}