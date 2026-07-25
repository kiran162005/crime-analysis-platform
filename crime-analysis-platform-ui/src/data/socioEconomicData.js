/**
 * data/socioEconomicData.js
 * The mock payload below is shaped EXACTLY like a real /socioeconomic
 * API response from appsail-python/app.py, run through
 * transformSocioeconomicResponse() — the same function that'll process
 * the real response. When the ML service is live, replace
 * mockRawSocioeconomicResponse with fetchSocioeconomicFromApi(incidents)
 * and nothing else changes.
 *
 * Correlation values and the caveat note both come from the backend's
 * own computation now, not a separate JS re-implementation — single
 * source of truth.
 */
import { transformSocioeconomicResponse } from '../services/mlApi';

const mockRawSocioeconomicResponse = {
  districts: [
    { DistrictID: 1, name: 'Bengaluru Urban', population_density: 4381, literacy_rate: 87.7, urbanization_pct: 91.0, total_incidents: 5146, crime_rate_proxy: 1174.62 },
    { DistrictID: 2, name: 'Mysuru', population_density: 481, literacy_rate: 72.6, urbanization_pct: 46.6, total_incidents: 2106, crime_rate_proxy: 4378.38 },
    { DistrictID: 3, name: 'Mangaluru (Dakshina Kannada)', population_density: 460, literacy_rate: 88.6, urbanization_pct: 46.4, total_incidents: 2216, crime_rate_proxy: 4817.39 },
    { DistrictID: 4, name: 'Belagavi', population_density: 316, literacy_rate: 73.9, urbanization_pct: 27.9, total_incidents: 806, crime_rate_proxy: 2550.63 },
    { DistrictID: 5, name: 'Hubballi-Dharwad', population_density: 401, literacy_rate: 79.4, urbanization_pct: 58.1, total_incidents: 842, crime_rate_proxy: 2099.75 },
    { DistrictID: 6, name: 'Kalaburagi', population_density: 316, literacy_rate: 63.7, urbanization_pct: 32.9, total_incidents: 2356, crime_rate_proxy: 7455.70 },
    { DistrictID: 7, name: 'Ballari', population_density: 332, literacy_rate: 67.4, urbanization_pct: 39.6, total_incidents: 2146, crime_rate_proxy: 6463.86 },
    { DistrictID: 8, name: 'Tumakuru', population_density: 268, literacy_rate: 74.5, urbanization_pct: 24.6, total_incidents: 817, crime_rate_proxy: 3048.51 },
    { DistrictID: 9, name: 'Shivamogga', population_density: 246, literacy_rate: 81.3, urbanization_pct: 30.9, total_incidents: 824, crime_rate_proxy: 3349.59 },
    { DistrictID: 10, name: 'Davanagere', population_density: 331, literacy_rate: 75.7, urbanization_pct: 34.9, total_incidents: 741, crime_rate_proxy: 2238.67 },
  ],
  correlations: {
    population_density: 0.294,
    literacy_rate: 0.294,
    urbanization_pct: 0.31,
  },
  note: 'Socio-economic indicators are synthetic approximations for this demo, not real Census data. n=10 districts — treat correlation strength as illustrative, not statistically rigorous.',
};

const { districtData, correlationsByKey, note } = transformSocioeconomicResponse(
  mockRawSocioeconomicResponse
);

export const DISTRICT_SOCIOECONOMIC_DATA = districtData;
export const SOCIOECONOMIC_NOTE = note;

export const INDICATOR_OPTIONS = [
  { key: 'populationDensity', label: 'Population Density' },
  { key: 'literacyRate', label: 'Literacy Rate (%)' },
  { key: 'urbanizationPct', label: 'Urbanization (%)' },
];

/** Looks up the backend-computed correlation for an indicator key. */
export function getCorrelation(indicatorKey) {
  return correlationsByKey[indicatorKey] ?? 0;
}