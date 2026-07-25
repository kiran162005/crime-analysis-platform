/**
 * mockNetworkGraphData.js
 * Matches the EXACT contract documented in network-analysis/README.md
 * and produced by graph_provider.py's assemble_force_graph():
 *   { nodes: [{id, type, label, incident_count?}], edges: [{source, target, relation_type, weight}] }
 *
 * Swap `fetchNetworkGraph()` for a real call to their endpoint once it's
 * deployed — keep this exact shape, nothing downstream needs to change.
 */

const mockNetworkGraphData = {
  nodes: [
    { id: 'OFF_101', type: 'offender', label: 'Offender OFF_101', incident_count: 4 },
    { id: 'OFF_102', type: 'offender', label: 'Offender OFF_102', incident_count: 2 },
    { id: 'OFF_205', type: 'offender', label: 'Offender OFF_205', incident_count: 1 },
    { id: 'VIC_205', type: 'victim', label: 'Victim VIC_205' },
    { id: 'VIC_310', type: 'victim', label: 'Victim VIC_310' },
    { id: 'VIC_412', type: 'victim', label: 'Victim VIC_412' },
    { id: 'INC_004', type: 'incident', label: 'Incident INC_004' },
    { id: 'INC_009', type: 'incident', label: 'Incident INC_009' },
    { id: 'INC_017', type: 'incident', label: 'Incident INC_017' },
  ],
  edges: [
    { source: 'OFF_101', target: 'OFF_102', relation_type: 'co_offender', weight: 2 },
    { source: 'OFF_101', target: 'VIC_205', relation_type: 'offender_victim', weight: 1 },
    { source: 'OFF_101', target: 'VIC_310', relation_type: 'offender_victim', weight: 1 },
    { source: 'OFF_102', target: 'VIC_310', relation_type: 'offender_victim', weight: 1 },
    { source: 'OFF_205', target: 'VIC_412', relation_type: 'offender_victim', weight: 1 },
    { source: 'OFF_101', target: 'OFF_205', relation_type: 'shared_address', weight: 1 },
    { source: 'VIC_205', target: 'VIC_310', relation_type: 'shared_identifier', weight: 1 },
    { source: 'INC_004', target: 'INC_009', relation_type: 'mo_similar', weight: 0.88 },
    { source: 'INC_009', target: 'INC_017', relation_type: 'mo_similar', weight: 0.79 },
  ],
};

/** Mock async fetch — replace body with a real fetch() to the
 *  Network Engineer's endpoint once it's deployed behind API Gateway. */
export async function fetchNetworkGraph() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockNetworkGraphData), 300);
  });
}

export default mockNetworkGraphData;
