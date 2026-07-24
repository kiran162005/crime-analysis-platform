"""
network-analysis/mo-similarity/quickml_client.py
Owner: Network & Link Analysis Engineer
"""

import requests

SIMILARITY_THRESHOLD = 0.75


class QuickMLSimilarityClient:
    def __init__(self, endpoint_url: str, api_key: str = None):
        self.endpoint_url = endpoint_url
        self.api_key = api_key

    def get_similar_incidents(self, incident_id: str, threshold: float = SIMILARITY_THRESHOLD) -> list:
        """
        Calls QuickML REST endpoint to retrieve similar cases for an incident_id.
        Filters out matches below the cutoff score.
        """
        payload = {
            "incident_id": incident_id,
            "top_k": 5
        }
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = requests.post(self.endpoint_url, json=payload, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()

            raw_matches = data.get("matches", [])
            return [
                match for match in raw_matches 
                if match.get("score", 0.0) >= threshold and match.get("incident_id") != incident_id
            ]
        except Exception as err:
            print(f"[QuickML Client Warning] Similarity lookup failed for {incident_id}: {err}")
            return []

    def format_mo_edges(self, target_entity_id: str, target_entity_type: str, similar_matches: list) -> list:
        """
        Converts QuickML similarity matches into edge dicts matching the links schema.
        """
        mo_edges = []
        for match in similar_matches:
            mo_edges.append({
                "entity_a_id": str(target_entity_id),
                "entity_a_type": target_entity_type,
                "entity_b_id": str(match["incident_id"]),
                "entity_b_type": "incident",
                "relation_type": "mo_similar",
                "weight": round(match["score"], 2)
            })
        return mo_edges