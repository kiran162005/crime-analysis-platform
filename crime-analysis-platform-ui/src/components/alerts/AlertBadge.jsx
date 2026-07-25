/**
 * AlertBadge.jsx
 * Small severity chip driven by spike_ratio — same severity banding as
 * HotspotLayer.jsx, kept consistent across the app.
 */
import React from 'react';

function severity(spikeRatio) {
  if (spikeRatio >= 2.5) return { label: 'Severe', color: '#b91c1c', bg: '#fee2e2' };
  if (spikeRatio >= 1.7) return { label: 'Moderate', color: '#c2410c', bg: '#ffedd5' };
  return { label: 'Mild', color: '#a16207', bg: '#fef9c3' };
}

export default function AlertBadge({ spikeRatio }) {
  const { label, color, bg } = severity(spikeRatio);
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 999,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {label} · {spikeRatio.toFixed(1)}x
    </span>
  );
}