/**
 * mockAlertData.js
 * The mock payload below is shaped EXACTLY like a real /anomalies API
 * response from appsail-python/app.py, then run through
 * transformAnomaliesResponse() — the same function that'll process the
 * real response. When the ML service is live, replace mockRawResponse
 * with fetchAnomaliesFromApi(incidents) and nothing else changes.
 */
import { transformAnomaliesResponse } from '../services/mlApi';

const mockRawAnomaliesApiResponse = {
  anomalies: [
    { case_id: 5001, district_id: 1, crime_subhead: 6, hour: 3, district_crime_share: 0.02, hour_deviation: 3.1, anomaly_score: -0.42 },
    { case_id: 5002, district_id: 2, crime_subhead: 4, hour: 14, district_crime_share: 0.01, hour_deviation: 2.8, anomaly_score: -0.35 },
    { case_id: 5003, district_id: 6, crime_subhead: 7, hour: 23, district_crime_share: 0.04, hour_deviation: 2.5, anomaly_score: -0.31 },
    { case_id: 5004, district_id: 1, crime_subhead: 5, hour: 2, district_crime_share: 0.03, hour_deviation: 2.2, anomaly_score: -0.24 },
    { case_id: 5005, district_id: 4, crime_subhead: 9, hour: 10, district_crime_share: 0.05, hour_deviation: 1.9, anomaly_score: -0.18 },
    { case_id: 5006, district_id: 7, crime_subhead: 7, hour: 1, district_crime_share: 0.06, hour_deviation: 1.7, anomaly_score: -0.12 },
  ],
  total: 6480,
  flagged_count: 6,
  params: { contamination: 0.02 },
};

const mockAlertData = transformAnomaliesResponse(mockRawAnomaliesApiResponse);

/** Mock async fetch, filterable by district (pass null for all). */
export async function fetchAlerts(district = null) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = district
        ? mockAlertData.filter((a) => a.district === district)
        : mockAlertData;
      resolve(data);
    }, 200);
  });
}

export default mockAlertData;