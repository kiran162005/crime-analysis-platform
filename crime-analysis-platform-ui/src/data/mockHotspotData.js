/**
 * mockHotspotData.js
 * Mock high-risk hotspots for the red-zone layer. spikeRatio = how many
 * times above that area's baseline incident rate the recent window is.
 * Swap for a real fetch to the hotspot-detection endpoint later — keep
 * this exact shape.
 */
const mockHotspotData = [
  {
    id: 'hs-1',
    lat: 12.9716,
    lng: 77.5946,
    label: 'Majestic, Bengaluru Urban',
    spikeRatio: 2.8,
    note: 'Chain snatching spike over last 2 weeks',
  },
  {
    id: 'hs-2',
    lat: 12.9351,
    lng: 77.6245,
    label: 'Koramangala, Bengaluru Urban',
    spikeRatio: 1.9,
    note: 'Vehicle theft cluster near tech parks',
  },
  {
    id: 'hs-3',
    lat: 12.3052,
    lng: 76.6552,
    label: 'Mysuru City Center',
    spikeRatio: 2.1,
    note: 'Burglary spike during festival season',
  },
  {
    id: 'hs-4',
    lat: 15.8497,
    lng: 74.4977,
    label: 'Belagavi Central',
    spikeRatio: 1.6,
    note: 'Fraud complaints trending up',
  },
  {
    id: 'hs-5',
    lat: 17.3297,
    lng: 76.8343,
    label: 'Kalaburagi Old Town',
    spikeRatio: 2.4,
    note: 'Assault cases above seasonal baseline',
  },
  {
    id: 'hs-6',
    lat: 15.1394,
    lng: 76.9214,
    label: 'Ballari Market Area',
    spikeRatio: 1.7,
    note: 'Repeat-offender activity flagged',
  },
];

export default mockHotspotData;
