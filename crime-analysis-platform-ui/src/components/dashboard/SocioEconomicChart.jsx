/**
 * SocioEconomicChart.jsx
 * Scatter overlay: socio-economic indicator vs. total incidents per
 * district, per brief item 3 ("socio-economic correlation overlay").
 * This is explicitly a statistical correlation, not ML — n=10 districts
 * is a small sample, so the caveat is shown directly in the UI rather
 * than buried, per the source script's own note.
 */
import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DISTRICT_SOCIOECONOMIC_DATA,
  INDICATOR_OPTIONS,
  getCorrelation,
} from '../../data/socioEconomicData';

export default function SocioEconomicChart() {
  const [indicatorKey, setIndicatorKey] = useState('literacyRate');

  const indicatorLabel = INDICATOR_OPTIONS.find((o) => o.key === indicatorKey)?.label;
  const correlation = useMemo(() => getCorrelation(indicatorKey), [indicatorKey]);

  const strength =
    Math.abs(correlation) >= 0.6 ? 'strong' : Math.abs(correlation) >= 0.3 ? 'moderate' : 'weak';
  const direction = correlation >= 0 ? 'positive' : 'negative';

  return (
    <div className="card" style={{ flex: 1, minWidth: 320 }}>
      <span className="eyebrow">Correlation</span>
      <h3 className="card-title" style={{ marginBottom: 8 }}>Socio-Economic Correlation Overlay</h3>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {INDICATOR_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setIndicatorKey(opt.key)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              border: indicatorKey === opt.key ? '1px solid #c2410c' : '1px solid #e5e7eb',
              background: indicatorKey === opt.key ? '#ffedd5' : '#fff',
              color: indicatorKey === opt.key ? '#c2410c' : '#374151',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey={indicatorKey}
            name={indicatorLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis type="number" dataKey="totalIncidents" name="Total Incidents" stroke="#6b7280" fontSize={12} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => [value, name]}
            labelFormatter={() => ''}
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, fontSize: 12 }}>
                  <strong>{d.name}</strong>
                  <div>{indicatorLabel}: {d[indicatorKey]}</div>
                  <div>Total incidents: {d.totalIncidents}</div>
                </div>
              );
            }}
          />
          <Scatter data={DISTRICT_SOCIOECONOMIC_DATA} fill="#c2410c" />
        </ScatterChart>
      </ResponsiveContainer>

      <p style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>
        Pearson r = <strong>{correlation.toFixed(3)}</strong> — a {strength} {direction} relationship.
      </p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
        Statistical correlation (not ML), n=10 districts — a small sample. Indicators are
        synthetic approximations, not real Census data. Treat as illustrative, not a rigorous finding.
      </p>
    </div>
  );
}