/**
 * Dashboard.jsx
 * Top-level page: map on the left, KPI cards + charts on the right.
 * Clicking a district on the map filters the KPI cards and charts to
 * that district — this is the "core interaction" the brief calls out.
 * Everything here runs on mock data; swap `getDistrictData` for a real
 * API call (services/api.js) once the district-summary endpoint exists.
 */
import React, { useState, useMemo, useEffect } from 'react';
import DistrictChoroplethMap from '../components/maps/DistrictChoroplethMap';
import sampleIncidentData from '../components/maps/sampleIncidentData';
import KpiCards from '../components/dashboard/KpiCards';
import TrendChart from '../components/dashboard/TrendChart';
import CrimeTypeBarChart from '../components/dashboard/CrimeTypeBarChart';
import SocioEconomicChart from '../components/dashboard/SocioEconomicChart';
import AlertFeed from '../components/alerts/AlertFeed';
import { fetchAlerts } from '../data/mockAlertData';
import { getDistrictData } from '../data/mockDashboardData';
import mockHotspotData from '../data/mockHotspotData';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isDistrictLocked = user?.role === 'officer' && user?.district;

  const [selectedDistrict, setSelectedDistrict] = useState(
    isDistrictLocked ? { name: user.district } : null
  );
  const [showHotspots, setShowHotspots] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // District Officers only ever see alerts for their own district — same
  // "don't show-then-hide" principle applied to the dashboard/map above.
  useEffect(() => {
    let cancelled = false;
    setAlertsLoading(true);
    const districtFilter = isDistrictLocked ? user.district : null;
    fetchAlerts(districtFilter).then((data) => {
      if (!cancelled) {
        setAlerts(data);
        setAlertsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isDistrictLocked, user]);

  // If a District Officer's account is locked to a district, don't let
  // the UI drift away from it — this is the "reflect it cleanly, don't
  // show-then-hide" requirement from the brief.
  useEffect(() => {
    if (isDistrictLocked) {
      setSelectedDistrict({ name: user.district });
    }
  }, [isDistrictLocked, user]);

  const dashboardData = useMemo(
    () => getDistrictData(selectedDistrict?.name),
    [selectedDistrict]
  );

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Karnataka Crime Analytics</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
            Showing:{' '}
            <strong style={{ color: '#111827' }}>{dashboardData.districtName}</strong>
            {selectedDistrict && !isDistrictLocked && (
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
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
          <div>
            <strong style={{ color: '#111827' }}>{user?.name}</strong> ({user?.role})
          </div>
          {(user?.role === 'investigator' || user?.role === 'admin') && (
            <Link
              to="/network-graph"
              style={{ fontSize: 12, color: '#2563eb', display: 'block', marginTop: 4 }}
            >
              Open network graph →
            </Link>
          )}
          <button
            onClick={logout}
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#6b7280',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px', minWidth: 400 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#374151',
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
            />
            Show red-zone hotspots
          </label>
          <DistrictChoroplethMap
            incidentData={sampleIncidentData}
            selectedDistrict={selectedDistrict?.name}
            onDistrictSelect={(district) => setSelectedDistrict(district)}
            hotspots={mockHotspotData}
            showHotspots={showHotspots}
            onHotspotSelect={(spot) => console.log('Hotspot clicked:', spot)}
            height="560px"
          />
          <div style={{ marginTop: 16 }}>
            <AlertFeed alerts={alerts} loading={alertsLoading} />
          </div>
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
            <SocioEconomicChart />
          </div>
        </div>
      </div>
    </div>
  );
}