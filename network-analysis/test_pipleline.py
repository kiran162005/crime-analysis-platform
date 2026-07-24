"""
network-analysis/test_pipeline.py
End-to-End Local Test Runner for Network & Link Analysis Pipeline
"""

import json
from link_builder.main import build_links
from mo_similarity.quickml_client import QuickMLSimilarityClient
from graph_provider import assemble_force_graph

# 1. Mock Synthetic Incidents Dataset (from ML Engineer's schema)
MOCK_INCIDENTS = [
    {"incident_id": "INC_001", "offender_id": "OFF_101", "victim_id": "VIC_501", "address": "M.G. Road, District A"},
    {"incident_id": "INC_001", "offender_id": "OFF_102", "victim_id": None, "address": "M.G. Road, District A"},
    {"incident_id": "INC_002", "offender_id": "OFF_101", "victim_id": "VIC_502", "address": "Indiranagar, District B"},
    {"incident_id": "INC_003", "offender_id": "OFF_101", "victim_id": "VIC_503", "address": "M.G. Road, District A"},
    {"incident_id": "INC_004", "offender_id": "OFF_103", "victim_id": "VIC_501", "address": "Koramangala, District A"}
]

# 2. Mock Repeat Offender Counts (Step 3 view query result)
MOCK_REPEAT_COUNTS = {
    "OFF_101": 3,
    "OFF_102": 1,
    "OFF_103": 1
}


def run_pipeline_test():
    print("=== 1. Testing Link Builder ===")
    base_edges = build_links(MOCK_INCIDENTS)
    print(f"Generated {len(base_edges)} relational edges.")

    print("\n=== 2. Testing MO Similarity Formatting ===")
    client = QuickMLSimilarityClient(endpoint_url="https://mock-quickml.local")
    mock_quickml_matches = [{"incident_id": "INC_004", "score": 0.88}]
    mo_edges = client.format_mo_edges("OFF_101", "offender", mock_quickml_matches)
    print(f"Generated {len(mo_edges)} MO similarity edges.")

    print("\n=== 3. Assembling Force-Graph JSON ===")
    all_edges = base_edges + mo_edges
    force_graph_json = assemble_force_graph(all_edges, MOCK_REPEAT_COUNTS)

    print("\n=== Pipeline Output (Formatted for react-force-graph) ===")
    print(json.dumps(force_graph_json, indent=2))

    # Basic Sanity Checks
    assert "nodes" in force_graph_json and "edges" in force_graph_json
    print("\n✅ TEST PASSED: Graph JSON contract valid!")


if __name__ == "__main__":
    run_pipeline_test()