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
import AppHeader from '../components/layout/AppHeader';
import ChatPanel from '../components/ask-scrb/ChatPanel';
import ReportGenerator from '../components/reports/ReportGenerator';

export default function Dashboard() {
  const { user } = useAuth();
  const isDistrictLocked = user?.role === 'officer' && user?.district;

  const [selectedDistrict, setSelectedDistrict] = useState(
    isDistrictLocked ? { name: user.district } : null
  );
  const [showHotspots, setShowHotspots] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

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
  // the UI drift away from it — "reflect it cleanly, don't show-then-hide."
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
    <div style={{ minHeight: '100vh' }}>
      <AppHeader />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="eyebrow">District Overview</span>
            <h1 style={{ margin: 0, fontSize: 26 }}>{dashboardData.districtName}</h1>
          </div>
          {selectedDistrict && !isDistrictLocked && (
            <button
              onClick={() => setSelectedDistrict(null)}
              style={{
                fontSize: 12,
                color: 'var(--color-accent)',
                background: 'var(--color-accent-soft)',
                border: '1px solid var(--color-accent)',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Back to statewide view
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px', minWidth: 400 }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--color-text-muted)',
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
              <ReportGenerator />
            </div>
          </div>
        </div>
      </div>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 6px 20px rgba(194, 65, 12, 0.4)',
            cursor: 'pointer',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          aria-label="Open Ask SCRB chat"
          title="Ask SCRB"
        >
          💬
        </button>
      )}

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}