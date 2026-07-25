/**
 * sampleIncidentData.js
 * Mock district -> incident-count data so the map/dashboard shell can be
 * built and demoed before the real API (incidents-crud / district summary
 * endpoint) is ready. Swap for a live fetch to your API Gateway route
 * once the Team Lead's endpoint is up — same shape works either way.
 */
const sampleIncidentData = {
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
  'Udupi': 22,
};

export default sampleIncidentData;
