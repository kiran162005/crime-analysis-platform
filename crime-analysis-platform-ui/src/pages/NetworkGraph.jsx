/**
 * pages/NetworkGraph.jsx
 * Investigations page — the Investigator role's distinguishing feature.
 * Runs on mock data matching the Network Engineer's exact documented
 * contract; swap fetchNetworkGraph() for their real endpoint when live.
 */
import React, { useEffect, useState } from 'react';
import ForceGraph from '../components/network-graph/ForceGraph';
import NodeDetailPanel from '../components/network-graph/NodeDetailPanel';
import { fetchNetworkGraph } from '../data/mockNetworkGraphData';
import AppHeader from '../components/layout/AppHeader';

const LEGEND_ITEMS = [
  { label: 'Offender', color: '#dc2626' },
  { label: 'Victim', color: '#2563eb' },
  { label: 'Incident', color: '#6b7280' },
];

export default function NetworkGraph() {
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
    <div style={{ minHeight: '100vh' }}>
      <AppHeader />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <span className="eyebrow">Investigations</span>
          <h1 style={{ margin: 0, fontSize: 26 }}>Network & Link Analysis</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Offenders, victims, and incidents connected by shared entities and MO similarity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text)', marginBottom: 12 }}>
          {LEGEND_ITEMS.map((item) => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          ))}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, borderTop: '2px dashed #a855f7', display: 'inline-block' }} />
            MO similarity (probabilistic)
          </span>
        </div>

        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading graph…</p>}

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
    </div>
  );
}