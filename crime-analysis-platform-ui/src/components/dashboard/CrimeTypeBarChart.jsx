/**
 * CrimeTypeBarChart.jsx
 * Crime-type breakdown bar chart. Per brief 3.2 item 3 (Dashboards).
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const BAR_COLORS = ['#7f2704', '#c3480b', '#f5701b', '#fd9856', '#fdbf8c', '#fee2c8'];

export default function CrimeTypeBarChart({ data, title = 'Crime Type Breakdown' }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 16,
        flex: 1,
        minWidth: 320,
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#111827' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="type" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.type} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
