# Network & Link Analysis Module — `network-analysis/`

## Overview

The `network-analysis/` module sits between raw relational incident data and the visual graph on the frontend. It is responsible for:

1. Transforming raw incident co-occurrences and entity metadata into canonical graph edges.
2. Producing output formatted to the `react-force-graph` JSON contract.
3. Integrating Modus Operandi (MO) similarity results from QuickML as an additional edge type.

---

## Folder Structure

```
network-analysis/
├── link_builder/
│   ├── __init__.py
│   └── main.py             # Core edge extraction & weight aggregation logic
├── mo_similarity/
│   ├── __init__.py
│   └── quickml_client.py   # Client wrapper for QuickML MO similarity search
├── graph_provider.py        # Assembles nodes and edges into force-graph JSON schema
├── test_pipeline.py         # Standalone local integration test runner
├── requirements.txt         # Python dependencies
└── README.md                # Integration guide
```

---

## Core Principles & Specifications

### Canonical Edge Ordering Rule

To prevent duplicate bidirectional edges (e.g., storing both `(A, B)` and `(B, A)`), all entity pairs are sorted lexicographically before edge creation, such that:

```
entity_a_id < entity_b_id
```

### Relation Types

| `relation_type` | Meaning |
|---|---|
| `co_offender` | Multiple offenders co-occurring in the same incident |
| `co_victim` | Multiple victims co-occurring in the same incident |
| `offender_victim` | An offender connected to a victim within an incident |
| `shared_address` | Two entities sharing an identical address field |
| `shared_identifier` | Two entities sharing an identical phone/ID field — *only generated if that field exists in the dataset* |
| `mo_similar` | Narrative/MO similarity between two **incidents**, sourced from QuickML |

> Note: `mo_similar` connects **incident-to-incident**, not offender-to-incident — it reflects that two cases share a similar modus operandi based on FIR narrative text, independent of whether they share an offender.

### Weight Semantics

`weight` means different things depending on `relation_type`, and the frontend should scale accordingly rather than applying one linear scale to all edges:

- **`co_offender`, `co_victim`, `offender_victim`, `shared_address`, `shared_identifier`** — `weight` is an **integer co-occurrence count** (≥ 1).
- **`mo_similar`** — `weight` is a **normalized float similarity score** (0.75–1.0, given the client-side cutoff below).

---

## Output Contract (`react-force-graph`)

The visual graph expects data in the following JSON structure:

```json
{
  "nodes": [
    {
      "id": "OFF_101",
      "type": "offender",
      "label": "Offender OFF_101",
      "incident_count": 3
    },
    {
      "id": "VIC_205",
      "type": "victim",
      "label": "Victim VIC_205"
    },
    {
      "id": "INC_004",
      "type": "incident",
      "label": "Incident INC_004"
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
      "target": "VIC_205",
      "relation_type": "offender_victim",
      "weight": 1
    },
    {
      "source": "INC_004",
      "target": "INC_009",
      "relation_type": "mo_similar",
      "weight": 0.88
    }
  ]
}
```

`incident_count` is only meaningful on `offender` nodes (it's the repeat-offender signal); `victim` and `incident` nodes omit it rather than carrying a value that doesn't apply to them.

---

## Integration Notes for Team Members

### 🎨 For the Frontend Engineer (`components/network-graph/`)

- **Data input:** call the endpoint that returns `assemble_force_graph()` output and pass it directly into `<ForceGraph2D graphData={graphData} />` or `<ForceGraph3D />`.
- **Node sizing:** scale node radius off `incident_count` where present, with a sane default for nodes that don't carry it: `nodeVal={(node) => node.incident_count ?? 1}`.
- **Node coloring:** group colors by `type` (`offender`, `victim`, `incident`).
- **Link styling:**
  - Map link width or particle speed to `weight` — but see **Weight Semantics** above before writing the scaling function, since a co-occurrence count and a similarity score aren't on the same scale.
  - Distinguish `relation_type` visually — e.g., render `mo_similar` edges as dashed or animated lines, since they represent a probabilistic similarity rather than a confirmed shared entity.

### 🗄️ For the Team Lead (`data-model/` & Data Store)

- **`links` table schema** — ensure the table contains:

| Column | Type |
|---|---|
| `entity_a_id` | VARCHAR |
| `entity_a_type` | VARCHAR |
| `entity_b_id` | VARCHAR |
| `entity_b_type` | VARCHAR |
| `relation_type` | VARCHAR |
| `weight` | FLOAT |

- **Input contract for `build_links()`:** a list of dictionaries with keys `incident_id`, `offender_id`, `victim_id`, `address`, and `identifier`. `address` and `identifier` are optional — the builder only generates `shared_address`/`shared_identifier` edges when that field is present in the dataset. A query joining/flattening the relational `offenders`/`victims` tables into this flat shape needs to happen upstream of `build_links()` — confirm ownership of that join with the Team Lead rather than assuming it's provided.

### 🤖 For the ML Engineer (`mo-similarity` / QuickML)

- **Request payload** sent by `QuickMLSimilarityClient`:

```json
{ "incident_id": "INC_001", "top_k": 5 }
```

- **Expected response format:**

```json
{
  "matches": [
    { "incident_id": "INC_004", "score": 0.88 }
  ]
}
```

- Matches with `score < 0.75` are filtered out client-side in `quickml_client.py` before they reach `graph_provider.py`, so no low-confidence `mo_similar` edges are ever rendered. This threshold is a constant in that file — adjust it there, not on the QuickML side, if the demo needs tuning.

### ⚙️ For DevOps / Automation Lead (`catalyst-config/`)

- **Cron execution:** `build_links()` is stateless and idempotent — safe to schedule as a nightly batch job via Catalyst Cron to rebuild and refresh link weights across all incidents.
- **Incremental execution:** can also be wired to a Catalyst Signal firing on a `new_incident_inserted` event, for near-real-time updates between nightly rebuilds.
- **Running locally:** `test_pipeline.py` must be run from within the `network-analysis/` directory (or with `network-analysis/` on `PYTHONPATH`), since it imports `link_builder.main` and `mo_similarity.quickml_client` as packages.