/**
 * KpiCards.jsx
 * Row of summary stat cards at the top of the dashboard. Purely
 * presentational — receives already-computed numbers via `kpis`.
 */
import React from 'react';

const cardStyle = {
  flex: '1 1 180px',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '16px 18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const labelStyle = { fontSize: 13, color: '#6b7280', marginBottom: 6 };
const valueStyle = { fontSize: 26, fontWeight: 700, color: '#111827' };

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const {
    totalIncidents,
    activeAlerts,
    repeatOffenderCases,
    momChangePercent,
  } = kpis;

  const changeColor = momChangePercent > 0 ? '#dc2626' : '#16a34a';
  const changeSign = momChangePercent > 0 ? '+' : '';

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <div style={cardStyle}>
        <div style={labelStyle}>Total Incidents</div>
        <div style={valueStyle}>{totalIncidents.toLocaleString()}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Month-over-Month</div>
        <div style={{ ...valueStyle, color: changeColor }}>
          {changeSign}
          {momChangePercent}%
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Active Alerts</div>
        <div style={valueStyle}>{activeAlerts}</div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Repeat-Offender Cases</div>
        <div style={valueStyle}>{repeatOffenderCases}</div>
      </div>
    </div>
  );
}
