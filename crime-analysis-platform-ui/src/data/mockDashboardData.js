/**
 * mockDashboardData.js
 * Synthetic data for the dashboard shell, keyed by district so the map's
 * onDistrictSelect can actually filter what's shown here. Swap the
 * `getDistrictData` implementation for a real API call once the Team
 * Lead's district-summary endpoint exists — keep the same return shape
 * so components don't need to change.
 */

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const CRIME_TYPES = ['Theft', 'Assault', 'Burglary', 'Fraud', 'Vandalism', 'Other'];

// Per-district base incident volume (mirrors sampleIncidentData.js totals)
// and a rough crime-type + monthly-trend "shape" per district so filtered
// views actually look different from the state-wide view.
const DISTRICT_BASE = {
  'Bengaluru Urban': 812,
  'Bengaluru Rural': 96,
  Mysuru: 214,
  Belagavi: 187,
  Kalaburagi: 165,
  Ballari: 143,
  Dharwad: 121,
  Tumakuru: 118,
  Shivamogga: 96,
  Davanagere: 92,
  Hassan: 74,
  Mandya: 71,
  Bidar: 68,
  Raichur: 64,
  Vijayapura: 61,
  'Dakshina Kannada': 58,
  Koppal: 47,
  Chitradurga: 45,
  Haveri: 42,
  Bagalkote: 40,
  Chikkamagaluru: 38,
  Kolar: 36,
  'Uttara Kannada': 33,
  Yadgir: 31,
  Gadag: 28,
  Chikkaballapura: 26,
  Ramanagara: 24,
  Chamarajanagara: 19,
  Kodagu: 14,
  Udupi: 22,
};

// Deterministic pseudo-random helper so numbers stay stable across
// re-renders/refreshes instead of jumping around (looks broken otherwise).
function seededFraction(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildTrend(base, seedOffset) {
  return MONTHS.map((month, i) => {
    const wobble = 0.8 + seededFraction(seedOffset + i) * 0.4; // 0.8x - 1.2x
    const growth = 1 + i * 0.03; // slight upward trend into "now"
    return {
      month,
      incidents: Math.round((base / MONTHS.length) * wobble * growth),
    };
  });
}

function buildCrimeTypeBreakdown(base, seedOffset) {
  const weights = [0.32, 0.18, 0.16, 0.14, 0.12, 0.08]; // rough real-world skew
  return CRIME_TYPES.map((type, i) => {
    const wobble = 0.85 + seededFraction(seedOffset + i * 3) * 0.3;
    return {
      type,
      count: Math.max(1, Math.round(base * weights[i] * wobble)),
    };
  });
}

function buildKpis(base, trend) {
  const lastMonth = trend[trend.length - 1].incidents;
  const prevMonth = trend[trend.length - 2].incidents;
  const momChange = prevMonth ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : 0;

  return {
    totalIncidents: base,
    activeAlerts: Math.max(1, Math.round(base * 0.04)),
    repeatOffenderCases: Math.max(0, Math.round(base * 0.06)),
    momChangePercent: momChange,
  };
}

/** Aggregate every district's arrays together for the "All Karnataka" view. */
function buildStateWideData() {
  const totalBase = Object.values(DISTRICT_BASE).reduce((a, b) => a + b, 0);
  const trend = MONTHS.map((month, i) => ({
    month,
    incidents: Object.entries(DISTRICT_BASE).reduce((sum, [name], di) => {
      const wobble = 0.8 + seededFraction(di * 7 + i) * 0.4;
      const growth = 1 + i * 0.03;
      return sum + Math.round((DISTRICT_BASE[name] / MONTHS.length) * wobble * growth);
    }, 0),
  }));

  const crimeTypes = CRIME_TYPES.map((type, i) => {
    const weights = [0.32, 0.18, 0.16, 0.14, 0.12, 0.08];
    return { type, count: Math.round(totalBase * weights[i]) };
  });

  return {
    districtName: 'All Karnataka',
    kpis: buildKpis(totalBase, trend),
    trend,
    crimeTypes,
  };
}

/**
 * getDistrictData(districtName)
 * Pass null/undefined for the statewide aggregate view.
 * Returns { districtName, kpis, trend, crimeTypes }.
 */
export function getDistrictData(districtName) {
  if (!districtName || !DISTRICT_BASE[districtName]) {
    return buildStateWideData();
  }

  const base = DISTRICT_BASE[districtName];
  const seedOffset = districtName.length * 13; // stable per-district seed
  const trend = buildTrend(base, seedOffset);
  const crimeTypes = buildCrimeTypeBreakdown(base, seedOffset);

  return {
    districtName,
    kpis: buildKpis(base, trend),
    trend,
    crimeTypes,
  };
}
