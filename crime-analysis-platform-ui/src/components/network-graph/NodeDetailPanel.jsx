/**
 * NodeDetailPanel.jsx
 * Side panel shown when a node is clicked in the graph — surfaces that
 * entity's case history by pulling every edge it's connected to out of
 * the same graphData. Once a real incidents-crud endpoint exists, swap
 * the "connections" list for an actual case-history API call keyed by
 * the node id; this derives it from the graph data as a placeholder.
 */
import React, { useMemo } from 'react';

const TYPE_LABELS = {
  offender: 'Offender',
  victim: 'Victim',
  incident: 'Incident',
};

const RELATION_LABELS = {
  co_offender: 'Co-offender in shared incident(s)',
  co_victim: 'Co-victim in shared incident(s)',
  offender_victim: 'Offender ↔ Victim link',
  shared_address: 'Shares an address',
  shared_identifier: 'Shares a phone/ID field',
  mo_similar: 'Similar modus operandi (MO)',
};

export default function NodeDetailPanel({ node, graphData, onClose }) {
  const connections = useMemo(() => {
    if (!node || !graphData) return [];
    return graphData.edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .map((e) => {
        const otherId = e.source === node.id ? e.target : e.source;
        const otherNode = graphData.nodes.find((n) => n.id === otherId);
        return { edge: e, otherNode };
      });
  }, [node, graphData]);

  if (!node) return null;

  return (
    <div
      style={{
        width: 300,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{TYPE_LABELS[node.type] ?? node.type}</div>
          <h3 style={{ margin: '2px 0 0', fontSize: 17 }}>{node.label}</h3>
          {node.incident_count != null && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
              {node.incident_count} linked incident{node.incident_count === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <h4 style={{ fontSize: 13, color: '#374151', marginTop: 16, marginBottom: 8 }}>
        Connections ({connections.length})
      </h4>

      {connections.length === 0 && (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>No linked entities found.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {connections.map(({ edge, otherNode }, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              padding: '8px 10px',
              background: '#f9fafb',
              borderRadius: 6,
              border: '1px solid #f3f4f6',
            }}
          >
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {otherNode?.label ?? edge.source === node.id ? edge.target : edge.source}
            </div>
            <div style={{ color: '#6b7280', marginTop: 2 }}>
              {RELATION_LABELS[edge.relation_type] ?? edge.relation_type}
              {edge.relation_type === 'mo_similar'
                ? ` — ${Math.round(edge.weight * 100)}% similarity`
                : ` — ${edge.weight} shared occurrence${edge.weight === 1 ? '' : 's'}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
