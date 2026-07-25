/**
 * lookupTables.js
 * Real DistrictID / CrimeSubHeadID -> name mappings, sourced directly
 * from ml-training/synthetic-data-gen/gen.py (District.csv and
 * CrimeSubHead.csv generation logic) — this is the actual synthetic
 * dataset the whole team is building against, not a placeholder.
 *
 * Note: gen.py's CrimeSubHead.csv column is (confusingly) named
 * "CrimeHeadName" even though it holds the sub-head name — kept the
 * mapping here regardless of that naming quirk in the source data.
 */
export const DISTRICT_ID_TO_NAME = {
  1: 'Bengaluru Urban',
  2: 'Mysuru',
  3: 'Mangaluru (Dakshina Kannada)',
  4: 'Belagavi',
  5: 'Hubballi-Dharwad',
  6: 'Kalaburagi',
  7: 'Ballari',
  8: 'Tumakuru',
  9: 'Shivamogga',
  10: 'Davanagere',
};

export const CRIME_SUBHEAD_ID_TO_NAME = {
  1: 'Murder',
  2: 'Grievous Hurt',
  3: 'Attempt to Murder',
  4: 'House Burglary',
  5: 'Vehicle Theft',
  6: 'Chain Snatching',
  7: 'Assault on Woman',
  8: 'Dowry Harassment',
  9: 'Online Financial Fraud',
  10: 'Phishing / Identity Theft',
  11: 'Drug Peddling',
  12: 'Drug Possession',
  13: 'Rioting',
  14: 'Public Nuisance',
};

// District centroid coordinates from District.csv — useful for map
// defaults/fallbacks if a hotspot lacks its own lat/lon.
export const DISTRICT_ID_TO_CENTROID = {
  1: { lat: 12.9716, lon: 77.5946 },
  2: { lat: 12.2958, lon: 76.6394 },
  3: { lat: 12.9141, lon: 74.8560 },
  4: { lat: 15.8497, lon: 74.4977 },
  5: { lat: 15.3647, lon: 75.1240 },
  6: { lat: 17.3297, lon: 76.8343 },
  7: { lat: 15.1394, lon: 76.9214 },
  8: { lat: 13.3379, lon: 77.1173 },
  9: { lat: 13.9299, lon: 75.5681 },
  10: { lat: 14.4644, lon: 75.9218 },
};

export function districtName(id) {
  return DISTRICT_ID_TO_NAME[id] || `District ${id}`;
}

export function crimeTypeName(id) {
  return CRIME_SUBHEAD_ID_TO_NAME[id] || `Crime Type ${id}`;
}