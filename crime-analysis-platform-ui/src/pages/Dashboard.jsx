/**
 * Dashboard.jsx
 * Top-level page: map on the left, KPI cards + charts on the right.
 * Clicking a district on the map filters the KPI cards and charts to
 * that district — this is the "core interaction" the brief calls out.
 * Everything here runs on mock data; swap `getDistrictData` for a real
 * API call (services/api.js) once the district-summary endpoint exists.
 */
import React, { useState, useMemo } from 'react';
import DistrictChoroplethMap from '../components/maps/DistrictChoroplethMap';
import sampleIncidentData from '../components/maps/sampleIncidentData';
import KpiCards from '../components/dashboard/KpiCards';
import TrendChart from '../components/dashboard/TrendChart';
import CrimeTypeBarChart from '../components/dashboard/CrimeTypeBarChart';
import { getDistrictData } from '../data/mockDashboardData';

export default function Dashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const dashboardData = useMemo(
    () => getDistrictData(selectedDistrict?.name),
    [selectedDistrict]
  );

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Karnataka Crime Analytics</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
          Showing:{' '}
          <strong style={{ color: '#111827' }}>{dashboardData.districtName}</strong>
          {selectedDistrict && (
            <button
              onClick={() => setSelectedDistrict(null)}
              style={{
                marginLeft: 10,
                fontSize: 12,
                color: '#c2410c',
                background: 'none',
                border: '1px solid #c2410c',
                borderRadius: 6,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Clear selection
            </button>
          )}
        </p>
      </header>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px', minWidth: 400 }}>
          <DistrictChoroplethMap
            incidentData={sampleIncidentData}
            selectedDistrict={selectedDistrict?.name}
            onDistrictSelect={(district) => setSelectedDistrict(district)}
            height="560px"
          />
        </div>

        <div style={{ flex: '1 1 400px', minWidth: 340 }}>
          <KpiCards kpis={dashboardData.kpis} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TrendChart
              data={dashboardData.trend}
              title={`Incidents Over Time — ${dashboardData.districtName}`}
            />
            <CrimeTypeBarChart
              data={dashboardData.crimeTypes}
              title={`Crime Type Breakdown — ${dashboardData.districtName}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
