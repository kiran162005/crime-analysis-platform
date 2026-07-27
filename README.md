# AI-Driven Crime Analytics & Visualization Platform

Turning fragmented, Excel-based crime records into a proactive intelligence platform for Karnataka State Police (KSP).

*Challenge 02 — AI-Driven Crime Analytics & Visualization Platform*

## Table of Contents

- [The Problem](#the-problem)
- [What's Genuinely ML vs. Rule-Based](#whats-genuinely-ml-vs-rule-based)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Machine Learning Details](#machine-learning-details)
- [Local Development](#local-development)
- [Team](#team)
- [Deployment](#deployment)

## The Problem

Karnataka State Police's current crime records are managed in independent silos, heavily reliant on manual Excel-based reporting. This leaves:

- No integrated, automated analytics — data trapped in disconnected spreadsheets
- No AI-driven pattern discovery across behavioral, spatial, or network data
- Fragmented reporting reaching the State Crime Records Bureau (SCRB)
- Purely reactive policing, with no tooling for proactive resource deployment

This platform consolidates incident, offender, and victim data into one system, and layers genuine machine learning and AI on top — spatiotemporal hotspot detection, predictive risk scoring, anomaly detection, and a natural-language query assistant over case records.

## What's Genuinely ML vs. Rule-Based

We're upfront about this distinction — it's a strength, not something to gloss over.

| Capability | Nature | Powered by |
|---|---|---|
| Hotspot detection (spatiotemporal clustering) | Genuine ML — DBSCAN | Catalyst AppSail (Flask + scikit-learn) |
| Predictive risk scoring | Genuine ML — regression | Catalyst Zia AutoML |
| Anomaly detection | Genuine ML — Isolation Forest | Catalyst AppSail (Flask + scikit-learn) |
| "Ask SCRB" query assistant | Genuine AI — LLM + RAG | Catalyst QuickML (GLM-4.7 Flash) |
| Socio-economic correlation | Statistical, not ML | Catalyst AppSail |
| Trend-alert threshold | Rule-based — rolling average | Catalyst Cron / Functions |
| Network/link graph construction | Rule-based — shared-entity edges | Catalyst Functions + Data Store |

## Architecture

Built entirely on Catalyst — every backend capability maps to a named Catalyst service.

```
                        Frontend (React)
                  Catalyst Web Client Hosting
                            │
                  Catalyst API Gateway
                            │
            ┌───────────────┴───────────────┐
            │                                │
 Catalyst Functions (Basic I/O)      Catalyst AppSail (Flask)
 • incident/victim/station/          • /hotspots      (DBSCAN)
   links-crud                        • /anomalies     (Isolation Forest)
 • authentication                    • /socioeconomic (correlation)
 • alerts, risk-score                • /chat          (QuickML RAG proxy)
            │                                │
            └───────────────┬────────────────┘
                            │
            Catalyst Data Store (relational)
            Catalyst NoSQL (FIR narrative text)
                            │
            Catalyst QuickML — Knowledge Base + RAG
                "Ask SCRB" — GLM-4.7 Flash
                            │
                Catalyst Zia AutoML
                Risk-scoring model

Automation: Catalyst Cron, Signals + Event Functions, Circuits
Reporting:  Catalyst SmartBrowz (PDF intelligence reports)
Alerts:     Catalyst Push Notifications, Catalyst Mail
CI/CD:      Catalyst Pipelines
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Catalyst Web Client Hosting) |
| Maps | Leaflet.js |
| Charts | Recharts |
| Network graph | react-force-graph |
| Backend logic | Catalyst Functions (Python 3.11, Basic I/O) |
| ML microservice | Catalyst AppSail — Flask, scikit-learn, pandas, numpy |
| Relational data | Catalyst Data Store |
| Unstructured data | Catalyst NoSQL |
| Tabular ML | Catalyst Zia AutoML |
| LLM / RAG | Catalyst QuickML (GLM-4.7 Flash) |
| Auth | Catalyst Authentication |
| Automation | Catalyst Cron, Signals, Circuits |
| Reports | Catalyst SmartBrowz |
| CI/CD | Catalyst Pipelines |

## Project Structure

```
crime-analysis-platform/
├── crime-analysis-platform-ui/   # React frontend
├── crime-analysis-slate/         # Catalyst Slate app
├── functions/                    # Catalyst Functions (Basic I/O)
│   ├── incident-crud/
│   ├── victim-crud/
│   ├── station-crud/
│   ├── links-crud/
│   ├── authentication/
│   ├── alerts/
│   ├── risk-score/
│   └── crime_analysis_platform_function/
├── appsail-python/                # ML microservice (Flask)
│   ├── app.py                     # /hotspots, /anomalies, /socioeconomic, /chat
│   ├── district_indicators.py
│   └── requirements.txt
├── ml-training/                   # ML development & data prep
│   ├── synthetic-data-gen/        # 18k synthetic incidents
│   ├── risk-scoring/              # feature engineering for Zia AutoML
│   ├── rag-index-builder/         # QuickML Knowledge Base prep
│   └── socio-economic/            # correlation analysis
├── catalyst.json
├── catalyst-user-rules.json       # API Gateway routing
├── PROGRESS.md                    # live team progress tracker
└── README.md
```

## API Endpoints

### AppSail — `appsail-python/app.py`

**`POST /hotspots`** — spatiotemporal crime hotspot detection
```json
{"incidents": [{"CaseMasterID", "latitude", "longitude", "IncidentFromDate", "CrimeMinorHeadID", "DistrictID"}]}
```
Query params: `min_size` (default 500), `eps` (default 0.6), `min_samples` (default 25)

**`POST /anomalies`** — flags incidents deviating from normal district/crime-type/hour patterns
```json
{"incidents": [{"CaseMasterID", "DistrictID", "CrimeMinorHeadID", "IncidentFromDate", "GravityOffenceID"}]}
```
Query params: `contamination` (default 0.02)

**`POST /socioeconomic`** — district-level crime/indicator correlation
```json
{"incidents": [{"CaseMasterID", "DistrictID"}]}
```

**`POST /chat`** — "Ask SCRB" natural-language query
```json
{"query": "What chain snatching incidents have been reported in Bengaluru?"}
```
Returns `{"answer": "...", "sources": [...]}`

**`GET /health`** — liveness check

### Functions — behind API Gateway
CRUD endpoints for `incidents`, `victims`, `stations`, `links` — routed via `catalyst-user-rules.json`.

## Machine Learning Details

- **Synthetic dataset:** 18,000 incidents across 10 Karnataka districts, matching the real KSP schema, with 6 deliberately planted spatiotemporal hotspots and 60 repeat offenders threaded across districts.
- **Hotspot detection:** DBSCAN correctly recovers all 6 planted hotspots.
- **Risk scoring:** Zia AutoML regression, MAE 0.555 — beats a naive rolling-average baseline by ~20–35%.
- **Anomaly detection:** Isolation Forest flags ~2% of incidents as deviating from district/crime-type/hour norms.
- **RAG assistant:** QuickML indexed on FIR narratives, tested with real and adversarial queries — correctly declines out-of-scope questions instead of hallucinating.

**Honesty notes:** all incident data is synthetic, generated for this hackathon. Socio-economic indicators are illustrative approximations, not real Census data. n=10 districts is a small sample — correlation results are illustrative, not statistically rigorous.

## Local Development

**Frontend**
```bash
cd crime-analysis-platform-ui
npm install && npm start
```

**AppSail (ML service)**
```bash
cd appsail-python
pip install -r requirements.txt
python app.py        # runs on port 9000
```

**Functions**
```bash
catalyst serve
```

**Deploy**
```bash
catalyst deploy
```

## Team

| Role | Responsibilities |
|---|---|
| Backend & Data Architect | Data Store schema, Authentication, CRUD Functions, API Gateway |
| Frontend Engineer | React client, maps, dashboards, network graph, chat UI |
| Network & Link Analysis Engineer | Link-building logic, repeat-offender tracking, MO similarity |
| ML/AI Engineer | Hotspot detection, risk scoring, anomaly detection, QuickML RAG |
| DevOps / Automation & Presentation Lead | Cron, Signals, Circuits, SmartBrowz, Pipelines, pitch deck |


## Deployment

Deployed exclusively on Zoho Catalyst — Web Client Hosting, AppSail, Functions, API Gateway, Slate, Data Store, QuickML, and Zia AutoML.

| Service | Link |
|---|---|
| Web Client |(https://crime-analysis-platform-60079412156.development.catalystserverless.in/app/index.html) |
| AppSail (ML service) |(https://crime-analysis-api-50044230287.development.catalystappsail.in) |
