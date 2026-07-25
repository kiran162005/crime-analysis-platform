/**
 * ForceGraph.jsx
 * Renders the {nodes, edges} contract from network-analysis/graph_provider.py
 * using react-force-graph. Styling follows the Integration Notes in that
 * module's README exactly:
 *   - node size scales off incident_count (offenders only; default 1 for others)
 *   - node color groups by `type`
 *   - link width/style reflects `weight`, but co-occurrence counts and
 *     mo_similar's normalized similarity score are NOT on the same scale,
 *     so they're handled separately
 *   - mo_similar edges render dashed, since they represent probabilistic
 *     similarity rather than a confirmed shared entity
 */
import React, { useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NODE_COLORS = {
  offender: '#dc2626', // red
  victim: '#2563eb', // blue
  incident: '#6b7280', // gray
};

// Co-occurrence-based relation types share one linear weight scale
// (weight = integer count, typically 1-5ish).
const COOCCURRENCE_RELATIONS = new Set([
  'co_offender',
  'co_victim',
  'offender_victim',
  'shared_address',
  'shared_identifier',
]);

function linkWidthFor(edge) {
  if (edge.relation_type === 'mo_similar') {
    // weight here is a 0.75-1.0 similarity score — scale separately.
    return 1 + (edge.weight - 0.75) * 8; // ~1px to ~3px across the threshold range
  }
  if (COOCCURRENCE_RELATIONS.has(edge.relation_type)) {
    return 1 + Math.min(edge.weight, 5); // cap so one huge outlier doesn't dominate
  }
  return 1;
}

function linkColorFor(edge) {
  return edge.relation_type === 'mo_similar' ? '#a855f7' : '#94a3b8'; // purple vs slate
}

export default function ForceGraph({ graphData, onNodeSelect = () => {}, height = 560 }) {
  const fgRef = useRef();

  // react-force-graph's own prop name for the edge array is `links`,
  // not `edges` — remap here so the contract from network-analysis/
  // doesn't need to change to fit this specific library's API.
  const formattedData = useMemo(
    () => ({
      nodes: graphData?.nodes ?? [],
      links: (graphData?.edges ?? []).map((e) => ({ ...e })),
    }),
    [graphData]
  );

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={formattedData}
        height={height}
        nodeId="id"
        nodeLabel={(node) => `${node.label}${node.incident_count ? ` (${node.incident_count} incidents)` : ''}`}
        nodeVal={(node) => node.incident_count ?? 1}
        nodeColor={(node) => NODE_COLORS[node.type] ?? '#9ca3af'}
        linkWidth={linkWidthFor}
        linkColor={linkColorFor}
        linkLineDash={(edge) => (edge.relation_type === 'mo_similar' ? [4, 3] : null)}
        linkDirectionalParticles={(edge) => (edge.relation_type === 'mo_similar' ? 2 : 0)}
        linkDirectionalParticleWidth={2}
        onNodeClick={(node) => onNodeSelect(node)}
        cooldownTicks={100}
      />
    </div>
  );
}
