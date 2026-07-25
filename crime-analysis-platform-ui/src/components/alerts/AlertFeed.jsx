/**
 * AlertFeed.jsx
 * Scrollable recent-alerts list. Accepts already-fetched `alerts` so the
 * parent page controls district filtering (District Officers only ever
 * receive their own district's alerts — see Dashboard.jsx).
 */
import React from 'react';
import AlertBadge from './AlertBadge';

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AlertFeed({ alerts = [], loading = false }) {
  return (
    <div className="card">
      <span className="eyebrow">Live Feed</span>
      <h3 className="card-title" style={{ marginBottom: 12 }}>
        Recent Alerts {alerts.length > 0 && `(${alerts.length})`}
      </h3>

      {loading && <p style={{ fontSize: 13, color: '#9ca3af' }}>Loading alerts…</p>}

      {!loading && alerts.length === 0 && (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>No active alerts.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {alert.crimeType} — {alert.district}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{alert.note}</div>
              </div>
              <AlertBadge spikeRatio={alert.spikeRatio} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{timeAgo(alert.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}