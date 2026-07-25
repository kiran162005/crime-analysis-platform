/**
 * pages/NetworkGraph.jsx
 * Investigations page — the Investigator role's distinguishing feature
 * per the brief ("case-level access to links/network data"). Runs on
 * mock data matching the Network Engineer's exact documented contract;
 * swap fetchNetworkGraph() for their real endpoint when it's live.
 */
import React, { useEffect, useState } from 'react';
import ForceGraph from '../components/network-graph/ForceGraph';
import NodeDetailPanel from '../components/network-graph/NodeDetailPanel';
import { fetchNetworkGraph } from '../data/mockNetworkGraphData';
import { useAuth } from '../auth/AuthContext';

const LEGEND_ITEMS = [
  { label: 'Offender', color: '#dc2626' },
  { label: 'Victim', color: '#2563eb' },
  { label: 'Incident', color: '#6b7280' },
];

export default function NetworkGraph() {
  const { user, logout } = useAuth();
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchNetworkGraph().then((data) => {
      if (!cancelled) {
        setGraphData(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Network & Link Analysis</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            Offenders, victims, and incidents connected by shared entities and MO similarity.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
          <div>
            <strong style={{ color: '#111827' }}>{user?.name}</strong> ({user?.role})
          </div>
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

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#374151', marginBottom: 12 }}>
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: item.color,
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, borderTop: '2px dashed #a855f7', display: 'inline-block' }} />
          MO similarity (probabilistic)
        </span>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>Loading graph…</p>}

      {!loading && graphData && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ForceGraph graphData={graphData} onNodeSelect={setSelectedNode} />
          </div>
          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              graphData={graphData}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
