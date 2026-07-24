"""
network-analysis/test_pipeline.py
End-to-End Local Test Runner for Network & Link Analysis Pipeline
"""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure network-analysis folder is in python path
sys.path.append(str(Path(__file__).resolve().parent))

from link_builder.main import build_links
from mo_similarity.quickml_client import QuickMLSimilarityClient
from graph_provider import assemble_force_graph

# Mock Synthetic Incidents Dataset
MOCK_INCIDENTS = [
    {"incident_id": "INC_001", "offender_id": "OFF_101", "victim_id": "VIC_501", "address": "M.G. Road", "identifier": "9900011100"},
    {"incident_id": "INC_001", "offender_id": "OFF_102", "victim_id": "VIC_502", "address": "M.G. Road", "identifier": "9900011100"},
    {"incident_id": "INC_002", "offender_id": "OFF_101", "victim_id": "VIC_502", "address": "Indiranagar", "identifier": "8800022200"},
    {"incident_id": "INC_003", "offender_id": "OFF_101", "victim_id": "VIC_503", "address": "M.G. Road", "identifier": "9900011100"},
    {"incident_id": "INC_004", "offender_id": "OFF_103", "victim_id": "VIC_501", "address": "Koramangala", "identifier": "7700033300"}
]

# Mock Repeat Offender Counts (Step 3 view query result)
MOCK_REPEAT_COUNTS = {
    "OFF_101": 3,
    "OFF_102": 1,
    "OFF_103": 1
}


def run_pipeline_test():
    print("=== 1. Testing Link Builder ===")
    base_edges = build_links(MOCK_INCIDENTS)
    print(f"Generated {len(base_edges)} relational edges.")

    rel_types = set(e["relation_type"] for e in base_edges)
    print(f"Detected relation types: {rel_types}")
    assert "co_offender" in rel_types, "Missing co_offender relation"
    assert "co_victim" in rel_types, "Missing co_victim relation"
    assert "offender_victim" in rel_types, "Missing offender_victim relation"
    assert "shared_address" in rel_types, "Missing shared_address relation"
    assert "shared_identifier" in rel_types, "Missing shared_identifier relation"

    print("\n=== 2. Testing MO Similarity Client (Mocked API Call) ===")
    client = QuickMLSimilarityClient(endpoint_url="https://mock-quickml.local/similarity")

    mock_api_response = {
        "matches": [
            {"incident_id": "INC_004", "score": 0.88},  # Valid match
            {"incident_id": "INC_001", "score": 0.99},  # Self match (should be filtered out)
            {"incident_id": "INC_005", "score": 0.60}   # Low score <0.75 (should be filtered out)
        ]
    }

    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.json.return_value = mock_api_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        # Fetch similarity matches for INC_001
        similar_matches = client.get_similar_incidents("INC_001")
        assert len(similar_matches) == 1, f"Expected 1 filtered match, got {len(similar_matches)}"
        assert similar_matches[0]["incident_id"] == "INC_004"

        mo_edges = client.format_mo_edges("INC_001", similar_matches)
        print(f"Generated {len(mo_edges)} MO similarity edges.")

    print("\n=== 3. Assembling Force-Graph JSON ===")
    all_edges = base_edges + mo_edges
    force_graph_json = assemble_force_graph(all_edges, MOCK_REPEAT_COUNTS)

    print("\n=== 4. Running Deep Assertions ===")
    # Assertion 1: Canonical ordering held everywhere
    for e in force_graph_json["edges"]:
        assert e["source"] <= e["target"], f"Canonical ordering violated: {e['source']} > {e['target']}"

    # Assertion 2: OFF_101 correctly carries incident_count == 3
    off_101 = next(n for n in force_graph_json["nodes"] if n["id"] == "OFF_101")
    assert off_101.get("incident_count") == 3, f"Expected incident_count 3, got {off_101.get('incident_count')}"

    # Assertion 3: Victim nodes do NOT carry incident_count
    vic_501 = next(n for n in force_graph_json["nodes"] if n["id"] == "VIC_501")
    assert "incident_count" not in vic_501, f"Victim node should not carry incident_count: {vic_501}"

    # Assertion 4: Incident nodes do NOT carry incident_count
    inc_004 = next(n for n in force_graph_json["nodes"] if n["id"] == "INC_004")
    assert "incident_count" not in inc_004, f"Incident node should not carry incident_count: {inc_004}"

    print("✅ ALL STRICT ASSERTIONS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_pipeline_test()