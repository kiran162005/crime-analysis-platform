# Crime Analysis Platform — Developer Guide

Repo: `kiran162005/crime-analysis-platform`
Purpose: AI-driven crime analytics & visualization platform for Karnataka SCRB, built on **Zoho Catalyst**.

This document consolidates everything across the repo's own READMEs, code comments, and configs into one place so you can find "where does X live and how does it talk to Y" fast. It reflects the actual code as of the current `main` branch, not just the aspirational README.

---

## 1. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │   React Frontend (Vite/CRA)  │
                        │  crime-analysis-platform-ui  │
                        └───────────────┬──────────────┘
                                        │ REST (fetch)
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
   ┌──────────▼─────────┐   ┌───────────▼───────────┐   ┌─────────▼─────────┐
   │ Catalyst Functions  │   │  Catalyst AppSail      │   │ Catalyst Slate     │
   │ (functions/*)        │   │  (appsail-python)      │   │ (crime-analysis-   │
   │ 9 Python/Node        │   │  Flask ML microservice │   │  slate) — embed-   │
   │ serverless functions │   │  /hotspots /anomalies  │   │  dable dashboard   │
   │ = CRUD + auth +      │   │  /socioeconomic /chat  │   │  used as the PDF   │
   │  alerts + reports    │   └───────────┬────────────┘   │  source page       │
   └──────────┬───────────┘               │                └────────────────────┘
              │                            │ proxies to
              │                 ┌──────────▼──────────┐
              │                 │  Catalyst QuickML     │
              │                 │  RAG (Ask SCRB)        │
              │                 └────────────────────────┘
              │
   ┌──────────▼───────────────────────────────┐
   │ Catalyst Data Store (tables: incidents,    │
   │ victims, stations, links, alerts,          │
   │ user_roles)                                │
   └──────────┬──────────────────────────────────┘
              │ row_inserted event
   ┌──────────▼───────────────────┐      ┌───────────────────────────┐
   │ Signals: spike-check-signal   │      │ network-analysis/          │
   │ (Python fn) → writes to       │      │ standalone module that     │
   │ `alerts` table on crime spike │      │ builds the offender/victim/│
   └────────────────────────────────┘      │ incident graph for the     │
                                            │ network-graph UI page      │
                                            └────────────────────────────┘
```

Everything is wired together through **`catalyst.json`** at the repo root — that file is the source of truth for what gets deployed and where each piece's source folder is:

```json
{
  "functions": { "source": "functions", "targets": [9 function names] },
  "client":    { "source": "crime-analysis-platform-ui", "plugin": "zcatalyst-cli-plugin-react" },
  "appsail":   [{ "source": "appsail-python", "name": "crime-analysis-api" }],
  "slate":     [{ "name": "crime-analysis-slate", "source": "crime-analysis-slate" }],
  "apig":      { "enabled": true }
}
```

---

## 2. Repo Structure

```
crime-analysis-platform/
├── catalyst.json                    # deployment manifest — what gets built/deployed and from where
├── catalyst-pipelines.yaml          # CI/CD pipeline: installs Node 20 + Python 3.11 + catalyst CLI, then `catalyst deploy`
├── catalyst-user-rules.json         # Catalyst IAM role rules
├── setup-guide.md                   # onboarding steps per role (source for section 6 below)
├── Project_Structure.md             # earlier/aspirational folder layout (partially superseded by what's below)
│
├── crime-analysis-platform-ui/      # React frontend (the main dashboard)
├── crime-analysis-slate/            # Catalyst Slate — lightweight embeddable dashboard, used as PDF report source
├── functions/                       # 9 Catalyst serverless functions (Python + 1 Node)
├── appsail-python/                  # Flask ML microservice (hotspots, anomalies, socioeconomic, Ask SCRB chat)
├── network-analysis/                # standalone module: builds the offender/victim/incident link graph
├── ml-training/                     # offline scripts: synthetic data gen, risk feature engineering, RAG index build
└── docs/
    └── security-plan.md             # auth model, roles, route protection plan (partially aspirational — see gaps)
```

---

## 3. Frontend — `crime-analysis-platform-ui/`

React app (CRA + `react-scripts`, despite Vite being mentioned in the top README — check `package.json`, it's CRA-based: `react-scripts start/build/test`). Deployed via `zcatalyst-cli-plugin-react`.

**Key libraries:** `leaflet` / `react-leaflet` (maps), `recharts` (charts), `react-force-graph-2d` (network graph), `react-router-dom` (routing).

### File map (what to touch for what)

| Path | Purpose |
|---|---|
| `src/App.js` | Routes, wraps app in `AuthProvider` |
| `src/auth/AuthContext.jsx` | Current user/role context — **currently mock**, see gaps |
| `src/auth/ProtectedRoute.jsx` | Role-gated route wrapper |
| `src/services/auth.js` | Mock login — swap when Team Lead ships real Catalyst auth |
| `src/services/mlApi.js` | Real fetch calls + response transforms for `/hotspots`, `/anomalies`, `/socioeconomic`, `/chat` |
| `src/services/lookupTables.js` | DistrictID / CrimeSubHeadID → human-readable name maps (sourced from `ml-training/synthetic-data-gen/gen.py`) |
| `src/components/layout/AppHeader.jsx` | Shared header/nav |
| `src/components/maps/DistrictChoroplethMap.jsx` | Core district drill-down map (Leaflet) |
| `src/components/maps/HotspotLayer.jsx` | Red-zone/hotspot markers overlay |
| `src/components/dashboard/*.jsx` | KPI cards, trend chart, crime-type bar chart, socio-economic scatter |
| `src/components/network-graph/ForceGraph.jsx` | Renders `react-force-graph-2d` from `network-analysis/graph_provider.py`'s output contract |
| `src/components/alerts/AlertFeed.jsx`, `AlertBadge.jsx` | Anomaly/spike alert feed |
| `src/components/ask-scrb/ChatPanel.jsx`, `MessageBubble.jsx` | Floating chat widget wired to the live `/chat` endpoint, with a mock-fallback path |
| `src/data/mock*.js` | Mock data **shaped exactly like the real API responses** — swapping mock→real is a one-line import change per the pattern below |
| `src/pages/Login.jsx`, `Dashboard.jsx`, `NetworkGraph.jsx` | Top-level pages |

### What's real vs. mock right now

| Feature | Source | Status |
|---|---|---|
| District map | Mock (`sampleIncidentData.js`) | Ready to swap for real incidents endpoint |
| Hotspot layer | Mock, shaped like real `/hotspots` | One-line swap once wired to incidents data |
| Alerts feed | Mock, shaped like real `/anomalies` | One-line swap |
| Socio-economic overlay | Mock, shaped like real `/socioeconomic` | One-line swap |
| Network graph | Mock, shaped like real `graph_provider.py` output | One-line swap |
| **Ask SCRB chat** | **Real, live call to `/chat`** | Deployed and functional, but currently blocked by a CORS gap (see §7) |
| Auth / roles | Local mock (`services/auth.js`) | Real auth is Team Lead's item, not yet wired |

The intentional design pattern: every mock data file in `src/data/` is shaped identically to what the real endpoint returns, so switching from mock to live data is swapping the import in the consuming component — no component rewrites needed.

---

## 4. Catalyst Slate — `crime-analysis-slate/`

A minimal Vite+React app, separate from the main frontend. Its main current purpose is to serve as the **hosted dashboard URL that `report-generator` screenshots into a PDF** (see §5.5). Not yet fleshed out beyond the Vite template — check `crime-analysis-slate/src/` before assuming it has real components.

---

## 5. Backend — `functions/` (Catalyst Functions)

All Python functions follow the same shape: `main.py` (Flask-style `handler(request)`) + `datastore.py` (Data Store access) + `catalyst-config.json` (stack: `python_3_11`, deployment name, execution entrypoint) + `requirements.txt`.

Common CRUD pattern (`incident-crud`, `links-crud`, `station-crud`, `victim-crud`): path is `/<resource>` or `/<resource>/<id>`, methods GET/POST/PUT/DELETE map to list/get/create/update-by-id/delete-by-id. Data Store lookups use the business-key column (e.g. `incident_id`) via ZCQL to first resolve the internal `ROWID`, since Catalyst's `update_row`/`delete_rows` require ROWID, not the business key.

### 5.1 `incident-crud/` & similar CRUD functions
- Table: `incidents` (fields referenced: `incident_id`, `crime_type`, `crime_description`, `date_time`, `district`)
- Same pattern repeats for `links` (table is singular `link` internally — see its `datastore.py` comment), `stations`, `victims`.

### 5.2 `authentication/`
- `GET /me` → returns the currently-logged-in Catalyst user + their row from `user_roles` (role/district/assigned_cases).
- **Does not perform login/signup itself** — that's client-side via Catalyst's own `catalyst.auth.signIn/signUp`, owned by the Frontend Engineer.
- Uses two SDK init scopes: user-scoped (`req=request`) for identity, admin-scoped (`scope="admin"`) for the Data Store read.
- Code comment flags `get_current_user()` as **unverified against a real Python SDK sample** — confirm this call works before relying on it; only the JS equivalent (`getCurrentUser()`) is confirmed.

### 5.3 `alerts/`
- `GET /alerts` → lists all alerts, most recent first. Read-only — no acknowledge/update workflow exists yet (there's no confirmed schema for it).

### 5.4 `risk-score/`
- **Stub only.** `main.py` is `from datastore import *` / `return get_risk_score()`, and `datastore.py`'s `get_risk_score()` just `return []`. No real logic implemented — this is the function most likely to need work before demo/production.

### 5.5 `report-generator/`
- `GET /report?url=<dashboard-url>` → uses Catalyst **SmartBrowz** to convert a dashboard URL (defaults to the Slate URL) to PDF, stores it via **File Store** (not Stratus — Stratus needs an Early Access request to Zoho support, not viable on a hackathon timeline), returns file details.
- `?test=1` bypasses the live dashboard and converts a trivial static HTML string instead, to isolate whether SmartBrowz itself or the target page is the failure point.
- Code comment flags the exact shape of SmartBrowz's return value as **unverified** — confirm on first real test.

### 5.6 `spike-check-signal/`
- Triggered by a **Catalyst Signal** on `incidents` `row_inserted`.
- Payload shape confirmed from a real test event: `payload["events"][i]["event_config"]["data"]` holds the inserted row's columns.
- For each event, calls `datastore.check_and_raise_alert(app, district, crime_type)` — if a spike is detected, presumably writes to the `alerts` table (check `datastore.py` in that folder for the actual threshold logic).
- Uses `context.close_with_success()` / `close_with_failure()` — **not** `context.close()`, which doesn't exist on this SDK.

### 5.7 `trend_alert_job/`
- The one **Node.js** function (`index.js`, not Python) — presumably a scheduled Cron job for trend-based alerting. Check `index.js` directly for its logic; it wasn't covered by the Python-focused code comments elsewhere in the repo.

---

## 6. ML Microservice — `appsail-python/` (Flask on Catalyst AppSail)

Single Flask app (`app.py`), stateless request/response — no persisted state or DB connection of its own; everything comes in via the POST body.

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Health/identity string |
| `/hotspots` | POST | DBSCAN clustering on `{incidents: [...]}` (needs `latitude`, `longitude`, `IncidentFromDate`, `CrimeMinorHeadID`). Weights crime-type dummy features ×2.5 so co-located-but-different-crime-type hotspots don't merge. Params: `min_size`, `eps`, `min_samples` (query string). |
| `/anomalies` | POST | IsolationForest on district/crime-type rarity + hour-of-day deviation. Needs `DistrictID`, `CrimeMinorHeadID`, `IncidentFromDate`, `GravityOffenceID`. Param: `contamination`. |
| `/socioeconomic` | POST | Correlates per-district incident counts against embedded `DISTRICT_INDICATORS` (population density, literacy, urbanization — **synthetic, n=10 districts**, not real Census data). |
| `/chat` | POST | "Ask SCRB" — proxies query to **Catalyst QuickML RAG** server-side (keeps the auth token off the client). Confirmed working as of 2026-07-25 against the real `rag_chunks` knowledge base. |
| `/health` | GET | `{"status": "ok"}` |

Deployed as AppSail service name `crime-analysis-api` per `catalyst.json`.

**Local dev on Windows:** `catalyst serve` targets the Linux `python3` runtime and fails locally with `'python3' is not recognized`. Workaround: `cd appsail-python && python app.py` directly (uses `X_ZOHO_CATALYST_LISTEN_PORT` env var or falls back to port 9000).

---

## 7. Network & Link Analysis — `network-analysis/`

Standalone module (not yet wired into `catalyst.json` as a deployed function — check whether it's been folded into one of the `functions/` targets, or is still run as a batch/cron job separately).

```
network-analysis/
├── link_builder/main.py       # Core edge extraction & weight aggregation
├── mo_similarity/quickml_client.py  # QuickML MO (modus operandi) similarity client
├── graph_provider.py           # Assembles nodes+edges into react-force-graph JSON contract
├── test_pipleline.py           # standalone integration test (note: filename typo, "pipleline")
└── requirements.txt
```

**Canonical edge rule:** entity pairs are sorted (`entity_a_id < entity_b_id`) before edge creation, to avoid storing both `(A,B)` and `(B,A)`.

**Relation types:** `co_offender`, `co_victim`, `offender_victim`, `shared_address`, `shared_identifier` (integer co-occurrence-count weights), and `mo_similar` (incident-to-incident, float similarity 0.75–1.0 weight, sourced from QuickML — matches below 0.75 are filtered client-side in `quickml_client.py`, so tune the threshold there).

**Output contract** (what the frontend's `ForceGraph.jsx` expects):
```json
{
  "nodes": [{"id": "OFF_101", "type": "offender", "label": "...", "incident_count": 3}],
  "edges": [{"source": "OFF_101", "target": "VIC_205", "relation_type": "offender_victim", "weight": 1}]
}
```

**Required `links` table schema:** `entity_a_id`, `entity_a_type`, `entity_b_id`, `entity_b_type`, `relation_type`, `weight` — all owned by whoever manages the Data Store.

**Input contract for `build_links()`:** list of dicts with `incident_id`, `offender_id`, `victim_id`, optional `address`/`identifier`. The join/flatten from the relational `offenders`/`victims` tables into this shape has to happen upstream — not part of this module.

**Scheduling:** stateless and idempotent — safe as a nightly Catalyst Cron rebuild, or triggered incrementally off a `new_incident_inserted` Signal.

**Running locally:** must run from inside `network-analysis/` (or with it on `PYTHONPATH`), since `test_pipleline.py` imports `link_builder.main` and `mo_similarity.quickml_client` as packages.

---

## 8. Offline / Training Scripts — `ml-training/`

| Folder | Purpose |
|---|---|
| `synthetic-data-gen/gen.py` | Generates the synthetic incident dataset (10 Karnataka districts) — the source of truth for `lookupTables.js`'s ID→name maps on the frontend |
| `risk-scoring/feature_engineering.py` + `risk_features.csv` | Feature engineering for the (currently stubbed) risk-score function |
| `socio-economic/socio_economic_correlation.py` + CSV | Offline version of the logic mirrored in `/socioeconomic` |
| `rag-index-builder/prep_rag_index.py` + `rag_chunks.*` | Builds the chunked text corpus fed into Catalyst QuickML's RAG knowledge base, which `/chat` queries |

These are not deployed — they're prep/training scripts you run manually to regenerate data files consumed elsewhere.

---

## 9. Setup — Local Dev

Condensed from `setup-guide.md`; see that file for the full troubleshooting section.

**Prerequisites:** Git, Node.js LTS, Python **3.11** specifically (Catalyst SDK requires ≥3.10; don't use 3.9), Zoho Catalyst CLI (`npm install -g zcatalyst-cli`).

```bash
git clone <repo-url>
cd crime-analysis-platform
catalyst login              # each dev uses their own Zoho account
catalyst project:use        # select "crime-analysis-platform"
```

**Per-module setup** — only install what you're working on:

```bash
# Frontend
cd crime-analysis-platform-ui && npm install && npm start

# Slate
cd crime-analysis-slate && npm install && npm run dev

# A Catalyst Function (Python)
cd functions/<function-name>
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt

# AppSail ML service
cd appsail-python
pip install -r requirements.txt
python app.py     # NOT `catalyst serve` on Windows — see §6
```

**Env vars:** never commit `.env`; copy `.env.example` → `.env` and fill in locally. Frontend needs `REACT_APP_ML_API_URL` pointed at the deployed AppSail URL (defaults to `http://localhost:9000` otherwise). AppSail's `/chat` needs `CATALYST_ACCESS_TOKEN` set locally (loaded via `python-dotenv`).

**Git workflow:** feature branches off `main` (`feature/frontend`, `feature/functions`, `feature/ml`, `feature/network`, `feature/devops`), PR to merge, never commit directly to `main`.

---

## 10. Deployment

`catalyst-pipelines.yaml` defines the CI pipeline: installs Node 20, Python 3.11, and the Catalyst CLI on an Ubuntu runner, then runs a single `catalyst deploy --project ... --org ... --token ...` which deploys everything declared in `catalyst.json`'s targets in one shot (no need to `cd` into each function folder).

---

## 11. Known Gaps & Things to Fix First

Pulled directly from code comments and the frontend README's own "Known gaps" section — these are the real blockers, not hypothetical ones:

1. **CORS not enabled on the ML service.** `/chat` currently rejects browser requests from `localhost:3000` (missing `Access-Control-Allow-Origin`). Fix: add `flask-cors` to `appsail-python/app.py` and redeploy. Until fixed, Ask SCRB silently falls back to simulated mock answers.
2. **`/chat`'s QuickML auth is a personal OAuth token** (Self Client flow, ~1hr expiry, manual refresh) — not a proper service credential. Flagged as a pre-deploy blocker. Expect intermittent 502s.
3. **`risk-score` function is an empty stub** (`return []`) — no real scoring logic implemented yet.
4. **Real authentication doesn't exist.** `services/auth.js` on the frontend is a local mock (any password works for the 3 demo accounts); `authentication/main.py`'s `get_current_user()` call is unverified against the real Python SDK.
5. **`report-generator`'s SmartBrowz result shape is unverified** — confirm actual return structure (bytes vs. stream vs. dict) on first real test.
6. **Synthetic dataset only covers 10 of ~30 Karnataka districts** — expect "no data" gaps on the choropleth once wired to anything broader.
7. **File Store used instead of Stratus** for report storage, purely because Stratus requires an Early Access request — revisit if that access comes through.
8. **`network-analysis/` isn't confirmed wired into `catalyst.json`** as a deployed target — verify whether it's folded into an existing function or still standalone/manual.

---

## 12. Quick Reference — "I want to change X, where do I go?"

| I want to... | Go to |
|---|---|
| Add a field to an incident | `functions/incident-crud/datastore.py` (Data Store table) + `main.py` if it needs special handling, then the frontend forms/types that consume it |
| Change hotspot clustering behavior | `appsail-python/app.py`, `detect_hotspots()` — tune `eps`, `min_samples`, `min_cluster_size` params or the crime-type weighting |
| Change anomaly sensitivity | `appsail-python/app.py`, `detect_anomalies_endpoint()` — `contamination` param |
| Add a new dashboard chart | `crime-analysis-platform-ui/src/components/dashboard/`, wire data via `src/services/` |
| Change network graph edge logic | `network-analysis/link_builder/main.py` (edges) or `mo_similarity/quickml_client.py` (similarity threshold, currently 0.75) |
| Fix the risk-score stub | `functions/risk-score/datastore.py` — currently returns `[]`, needs real logic (see `ml-training/risk-scoring/feature_engineering.py` for the intended features) |
| Change PDF report generation | `functions/report-generator/datastore.py` (SmartBrowz call) |
| Add/change an alert rule | `functions/spike-check-signal/datastore.py` (`check_and_raise_alert`) |
| Change district/crime-type ID→name mappings | `ml-training/synthetic-data-gen/gen.py` (source) → `crime-analysis-platform-ui/src/services/lookupTables.js` (consumer) |
