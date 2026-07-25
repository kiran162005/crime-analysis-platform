/**
 * KpiCards.jsx
 * Row of summary stat cards. Uses the shared .card class and monospaced
 * data-value treatment from theme.css for a consistent "instrument
 * panel" feel across every numeric readout in the app.
 */
import React from 'react';

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const { totalIncidents, activeAlerts, repeatOffenderCases, momChangePercent } = kpis;
  const changeColor = momChangePercent > 0 ? '#dc2626' : '#16a34a';
  const changeSign = momChangePercent > 0 ? '+' : '';

  const items = [
    { label: 'Total Incidents', value: totalIncidents.toLocaleString(), color: 'var(--color-text)' },
    { label: 'Month-over-Month', value: `${changeSign}${momChangePercent}%`, color: changeColor },
    { label: 'Active Alerts', value: activeAlerts, color: 'var(--color-text)' },
    { label: 'Repeat-Offender Cases', value: repeatOffenderCases, color: 'var(--color-text)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      {items.map((item) => (
        <div key={item.label} className="card" style={{ flex: '1 1 180px' }}>
          <span className="eyebrow">{item.label}</span>
          <div className="data-value" style={{ fontSize: 26, color: item.color }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}