# Network & Link Analysis Engine

## Overview
The `network-analysis/` module sits between raw relational incident data and the visual graph on the frontend. It is responsible for:
1. Transforming raw incident co-occurrences and entity metadata into canonical graph edges.
2. Formatted outputs meeting the `react-force-graph` JSON contract.
3. Integrating Modus Operandi (MO) vector similarity metrics from QuickML.

---

## Folder Structure

network-analysis/
├── link_builder/
│   └── main.py          # Core edge extraction & weight aggregation logic
├── mo_similarity/
│   └── quickml_client.py # Client wrapper for QuickML MO similarity search
├── graph_provider.py     # Assembles nodes and edges into force-graph JSON schema
├── test_pipeline.py      # Standalone local integration test runner
└── README.md             # Integration guide

---

## Core Principles & Specifications

### Canonical Edge Ordering Rule
To prevent duplicate bidirectional edges (e.g., storing both (A, B) and (B, A)), all pair IDs are sorted lexicographically prior to edge creation:
entity_a_id < entity_b_id

### Relation Types
* `co_offender`: Multiple offenders co-occurring in the same incident.
* `offender_victim`: Offender connected to a victim within an incident.
* `shared_address`: Two entities sharing identical physical address fields.
* `mo_similar`: Embeddings/MO similarity derived from QuickML narrative analysis.

---

## Output Contract (`react-force-graph`)

The visual graph expects data in the following JSON structure:

{
  "nodes": [
    {
      "id": "OFF_101",
      "type": "offender",
      "label": "Offender OFF_101",
      "incident_count": 3
    },
    {
      "id": "INC_004",
      "type": "incident",
      "label": "Incident INC_004",
      "incident_count": 1
    }
  ],
  "edges": [
    {
      "source": "OFF_101",
      "target": "OFF_102",
      "relation_type": "co_offender",
      "weight": 1
    },
    {
      "source": "OFF_101",
      "target": "INC_004",
      "relation_type": "mo_similar",
      "weight": 0.88
    }
  ]
}

---

## Integration Notes for Team Members

### 🎨 1. For the Frontend Engineer (`components/network-graph/`)
* **Data Input:** Call the API returning `assemble_force_graph()` or pass the graph JSON directly into `<ForceGraph2D graphData={graphData} />` or `<ForceGraph3D />`.
* **Node Sizing:** Use the `incident_count` node property to dynamically scale node radiuses: `nodeVal={(node) => node.incident_count}`.
* **Node Coloring:** Group node colors by `type` (`offender`, `victim`, `incident`).
* **Link Styling:**
  * Style link line width or particle speed using `weight`.
  * Differentiate `relation_type` using colors or dashed lines (e.g., render `mo_similar` edges with dashed lines or particles).

### 🗄️ 2. For the Team Lead (`data-model/` & Data Store)
* **Table Schema (`links`):** Ensure the target database table contains the following columns:
  * `entity_a_id` (VARCHAR)
  * `entity_a_type` (VARCHAR)
  * `entity_b_id` (VARCHAR)
  * `entity_b_type` (VARCHAR)
  * `relation_type` (VARCHAR)
  * `weight` (INT / FLOAT)
* **Input Contract for `build_links()`:** Supply a list of dictionaries with the keys: `incident_id`, `offender_id`, `victim_id`, and `address`.

### 🤖 3. For the ML Engineer (`mo-similarity` / QuickML)
* **API Payload:** `QuickMLSimilarityClient` POSTs to your endpoint:
  { "incident_id": "INC_001", "top_k": 5 }
* **Expected Response Format:**
  {
    "matches": [
      { "incident_id": "INC_004", "score": 0.88 }
    ]
  }
* Thresholds below `0.75` are automatically filtered out by default to avoid showing noisy connections.

### ⚙️ 4. For DevOps / Automation Lead (`catalyst-config/`)
* **Cron Execution:** `build_links()` is stateless and idempotent. Schedule it as a nightly batch job via Catalyst Cron to rebuild/update link weights across all incidents.
* **Incremental Execution:** Can also be connected to a Catalyst Signal firing on `new_incident_inserted` events.