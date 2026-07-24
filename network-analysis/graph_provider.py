"""
network-analysis/graph_provider.py
Owner: Network & Link Analysis Engineer
"""


def assemble_force_graph(links_data: list, repeat_counts: dict = None) -> dict:
    """
    Transforms relational links records into a node-link JSON structure
    tailored for react-force-graph.

    :param links_data: List of dicts representing rows from the links table.
    :param repeat_counts: Dict mapping offender_id -> incident_count (e.g., {"OFF123": 4}).
    :return: Dict in the exact JSON contract shape: {"nodes": [...], "edges": [...]}
    """
    repeat_counts = repeat_counts or {}
    nodes_dict = {}
    edges = []

    for link in links_data:
        a_id = str(link['entity_a_id'])
        a_type = link['entity_a_type']
        b_id = str(link['entity_b_id'])
        b_type = link['entity_b_type']

        # Construct Node A if not present
        if a_id not in nodes_dict:
            node_a = {
                "id": a_id,
                "type": a_type,
                "label": f"{a_type.capitalize()} {a_id}"
            }
            if a_type == "offender":
                node_a["incident_count"] = repeat_counts.get(a_id, 1)
            nodes_dict[a_id] = node_a

        # Construct Node B if not present
        if b_id not in nodes_dict:
            node_b = {
                "id": b_id,
                "type": b_type,
                "label": f"{b_type.capitalize()} {b_id}"
            }
            if b_type == "offender":
                node_b["incident_count"] = repeat_counts.get(b_id, 1)
            nodes_dict[b_id] = node_b

        # Format Edge
        edges.append({
            "source": a_id,
            "target": b_id,
            "relation_type": link['relation_type'],
            "weight": link['weight']
        })

    return {
        "nodes": list(nodes_dict.values()),
        "edges": edges
    }