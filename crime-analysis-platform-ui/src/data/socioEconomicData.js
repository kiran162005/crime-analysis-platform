/**
 * data/socioEconomicData.js
 * Real data from ml-training/socio-economic/district_socioeconomic_correlation.csv
 * — synthetic indicators (not real Census figures) correlated against
 * synthetic incident counts, computed via Pearson correlation, n=10
 * districts. This is a statistical overlay, not ML — say so in the UI.
 */

export const DISTRICT_SOCIOECONOMIC_DATA = [
  { districtId: 1, name: 'Bengaluru Urban', populationDensity: 4381, literacyRate: 87.7, urbanizationPct: 91.0, totalIncidents: 5146, crimeRateProxy: 1174.62 },
  { districtId: 2, name: 'Mysuru', populationDensity: 481, literacyRate: 72.6, urbanizationPct: 46.6, totalIncidents: 2106, crimeRateProxy: 4378.38 },
  { districtId: 3, name: 'Mangaluru (Dakshina Kannada)', populationDensity: 460, literacyRate: 88.6, urbanizationPct: 46.4, totalIncidents: 2216, crimeRateProxy: 4817.39 },
  { districtId: 4, name: 'Belagavi', populationDensity: 316, literacyRate: 73.9, urbanizationPct: 27.9, totalIncidents: 806, crimeRateProxy: 2550.63 },
  { districtId: 5, name: 'Hubballi-Dharwad', populationDensity: 401, literacyRate: 79.4, urbanizationPct: 58.1, totalIncidents: 842, crimeRateProxy: 2099.75 },
  { districtId: 6, name: 'Kalaburagi', populationDensity: 316, literacyRate: 63.7, urbanizationPct: 32.9, totalIncidents: 2356, crimeRateProxy: 7455.70 },
  { districtId: 7, name: 'Ballari', populationDensity: 332, literacyRate: 67.4, urbanizationPct: 39.6, totalIncidents: 2146, crimeRateProxy: 6463.86 },
  { districtId: 8, name: 'Tumakuru', populationDensity: 268, literacyRate: 74.5, urbanizationPct: 24.6, totalIncidents: 817, crimeRateProxy: 3048.51 },
  { districtId: 9, name: 'Shivamogga', populationDensity: 246, literacyRate: 81.3, urbanizationPct: 30.9, totalIncidents: 824, crimeRateProxy: 3349.59 },
  { districtId: 10, name: 'Davanagere', populationDensity: 331, literacyRate: 75.7, urbanizationPct: 34.9, totalIncidents: 741, crimeRateProxy: 2238.67 },
];

/** Pearson correlation coefficient — mirrors scipy.stats.pearsonr's `r`. */
export function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  return num / Math.sqrt(denomX * denomY);
}

export const INDICATOR_OPTIONS = [
  { key: 'populationDensity', label: 'Population Density' },
  { key: 'literacyRate', label: 'Literacy Rate (%)' },
  { key: 'urbanizationPct', label: 'Urbanization (%)' },
];

export function getCorrelation(indicatorKey) {
  const xs = DISTRICT_SOCIOECONOMIC_DATA.map((d) => d[indicatorKey]);
  const ys = DISTRICT_SOCIOECONOMIC_DATA.map((d) => d.totalIncidents);
  return pearsonCorrelation(xs, ys);
}