"""
network-analysis/link-builder/main.py
Owner: Network & Link Analysis Engineer
"""

from itertools import combinations
from collections import defaultdict


def format_edge(entity_a_id: str, entity_a_type: str, entity_b_id: str, entity_b_type: str, relation_type: str) -> dict:
    """
    Normalizes entity order lexicographically (entity_a_id < entity_b_id)
    to enforce a canonical edge direction and prevent duplicate reverse rows.
    """
    str_a, str_b = str(entity_a_id), str(entity_b_id)
    if str_a < str_b:
        return {
            "entity_a_id": str_a,
            "entity_a_type": entity_a_type,
            "entity_b_id": str_b,
            "entity_b_type": entity_b_type,
            "relation_type": relation_type
        }
    else:
        return {
            "entity_a_id": str_b,
            "entity_a_type": entity_b_type,
            "entity_b_id": str_a,
            "entity_b_type": entity_a_type,
            "relation_type": relation_type
        }


def build_links(incidents: list) -> list:
    """
    Core function that builds co-offender, offender-victim, and shared-address edges.
    
    :param incidents: List of dicts, e.g.,
                      [{"incident_id": "1", "offender_id": "O1", "victim_id": "V1", "address": "123 St"}]
    :return: List of formatted edge dicts ready for database insertion.
    """
    incident_groups = defaultdict(list)
    address_groups = defaultdict(list)

    # 1. Group entities by incident and address
    for inc in incidents:
        inc_id = inc.get('incident_id')
        offender_id = inc.get('offender_id')
        victim_id = inc.get('victim_id')
        address = inc.get('address')

        if offender_id:
            incident_groups[inc_id].append((offender_id, 'offender'))
            if address:
                address_groups[address].append((offender_id, 'offender'))

        if victim_id:
            incident_groups[inc_id].append((victim_id, 'victim'))
            if address:
                address_groups[address].append((victim_id, 'victim'))

    # Accumulate weights across multiple co-occurrences
    edge_map = {}

    def record_edge(e1, e2, relation_type):
        e1_id, e1_type = e1
        e2_id, e2_type = e2
        
        # Skip self-loops
        if e1_id == e2_id:
            return

        edge_data = format_edge(e1_id, e1_type, e2_id, e2_type, relation_type)
        key = (edge_data["entity_a_id"], edge_data["entity_b_id"], edge_data["relation_type"])

        if key in edge_map:
            edge_map[key]["weight"] += 1
        else:
            edge_data["weight"] = 1
            edge_map[key] = edge_data

    # 2. Pairwise co-occurrence per incident
    for inc_id, entities in incident_groups.items():
        unique_entities = list(set(entities))
        for e1, e2 in combinations(unique_entities, 2):
            rel_type = "co_offender" if (e1[1] == "offender" and e2[1] == "offender") else "offender_victim"
            record_edge(e1, e2, rel_type)

    # 3. Pairwise shared-address links
    for addr, entities in address_groups.items():
        unique_entities = list(set(entities))
        for e1, e2 in combinations(unique_entities, 2):
            record_edge(e1, e2, "shared_address")

    return list(edge_map.values())