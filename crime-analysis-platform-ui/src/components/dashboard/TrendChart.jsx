/**
 * TrendChart.jsx
 * Incidents-over-time line chart. Per brief 3.2 item 3 (Dashboards).
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function TrendChart({ data, title = 'Incidents Over Time' }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 320 }}>
      <span className="eyebrow">Trend</span>
      <h3 className="card-title" style={{ marginBottom: 12 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="incidents"
            stroke="#c2410c"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}