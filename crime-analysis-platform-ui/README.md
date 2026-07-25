# Frontend — Karnataka SCRB Crime Analytics Platform

Owner: Frontend Engineer. Covers everything under `frontend/` (aka
`crime-analysis-platform-ui/`).

## Status

All 6 build items from the project brief are complete: district
drill-down map, hotspot/red-zone layer, dashboards (trend, breakdown,
socio-economic overlay), network graph, Ask SCRB chat panel, and
role-gated routing. Details and known gaps are below.

## Setup

```powershell
npm install
```

`.env.example` should be copied to `.env`, with the ML service URL filled
in once the ML Engineer deploys `appsail-python/` to Catalyst AppSail:

```powershell
copy .env.example .env
```

Then:

```powershell
npm start
```

## Required npm packages

```powershell
npm install leaflet react-leaflet recharts react-router-dom react-force-graph-2d
```

## Demo accounts (mock auth — see "Known gaps" below)

| Role | Email | Behavior |
|---|---|---|
| SCRB Admin | admin@scrb.gov.in | Full access, all districts, network graph, admin route |
| District Officer | officer.mysuru@scrb.gov.in | Locked to Mysuru — no district switching, no network graph |
| Investigator | investigator@scrb.gov.in | Statewide dashboard + network graph access |

Any password works — this is a local mock, not real authentication.

## Complete file map

```
src/
├── App.js                                  — routes, wraps app in AuthProvider
├── index.js                                — imports styles/theme.css
├── styles/
│   └── theme.css                           — design tokens, fonts, .card/.eyebrow/.badge-pill classes
├── auth/
│   ├── AuthContext.jsx                     — current user/role context
│   └── ProtectedRoute.jsx                  — role-gated route wrapper
├── services/
│   ├── auth.js                             — mock login (to be swapped for real auth once built by Team Lead)
│   ├── mlApi.js                            — real ML API calls + transforms (/hotspots, /anomalies, /socioeconomic, /chat)
│   └── lookupTables.js                     — real DistrictID/CrimeSubHeadID -> name maps (from gen.py)
├── components/
│   ├── layout/
│   │   └── AppHeader.jsx                   — shared navy header, shield emblem, nav, role pill
│   ├── maps/
│   │   ├── DistrictChoroplethMap.jsx       — Leaflet choropleth, core drill-down interaction
│   │   ├── HotspotLayer.jsx                — pulsing red-zone markers
│   │   └── sampleIncidentData.js           — mock per-district incident counts for choropleth coloring
│   ├── dashboard/
│   │   ├── KpiCards.jsx
│   │   ├── TrendChart.jsx
│   │   ├── CrimeTypeBarChart.jsx
│   │   └── SocioEconomicChart.jsx          — scatter overlay, real /socioeconomic contract
│   ├── network-graph/
│   │   ├── ForceGraph.jsx                  — react-force-graph-2d, real Network Engineer contract
│   │   └── NodeDetailPanel.jsx
│   ├── alerts/
│   │   ├── AlertBadge.jsx
│   │   └── AlertFeed.jsx
│   └── ask-scrb/
│       ├── MessageBubble.jsx               — chat bubble, source citations, simulated-response badge
│       └── ChatPanel.jsx                   — floating chat widget, real /chat contract + graceful fallback
├── data/
│   ├── mockDashboardData.js                — KPI/trend/crime-type mock, keyed by district
│   ├── mockHotspotData.js                  — shaped like real /hotspots response
│   ├── mockAlertData.js                    — shaped like real /anomalies response
│   ├── mockNetworkGraphData.js             — shaped like real graph_provider.py output
│   ├── socioEconomicData.js                — shaped like real /socioeconomic response
│   └── mockChatResponses.js                — simulated Ask SCRB answers, used only if the live service is unreachable
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx                       — main page: map, KPIs, charts, alerts, chat launcher
    └── NetworkGraph.jsx                    — investigations page, gated to investigator/admin
```

Root of the UI project (next to `package.json`):
```
.env.example                                — template; to be copied to .env with the real URL filled in
.env                                        — created locally, gitignored — not to be committed
```

## Architecture notes — what's real vs. mock

| Feature | Data source | Status |
|---|---|---|
| District map | `sampleIncidentData.js` (mock) | Ready to swap for real incidents endpoint |
| Hotspot layer | Mock, shaped like real `/hotspots` | One-line swap once ML service deployed |
| Alerts feed | Mock, shaped like real `/anomalies` | One-line swap once ML service deployed |
| Socio-economic overlay | Mock, shaped like real `/socioeconomic` | One-line swap once ML service deployed |
| Network graph | Mock, shaped like real `graph_provider.py` output | One-line swap once Network Engineer deploys endpoint |
| Ask SCRB chat | **Real, live call** to `/chat` | Deployed and reachable; currently blocked by a CORS config gap on the backend (see below) |
| Auth / roles | Local mock (`services/auth.js`) | Real Authentication owned by Team Lead per the brief (item 3.1.4) |

Each "swap" above means replacing the mock data import with the matching
`fetch...FromApi()` function already written in `services/mlApi.js`, with
real `incidents` data passed through. No component rewrites are needed —
this was intentional, so integration is fast once real endpoints exist.

## Ask SCRB — live integration behavior

The chat panel calls the real, deployed `/chat` endpoint
(`appsail-python/app.py`, confirmed working by the ML Engineer). Three
outcomes are handled distinctly:

1. **Service reachable, real answer returned** — shown normally, with
   source citations from QuickML's RAG retrieval (expandable "Show N
   sources" toggle).
2. **Service unreachable** (network-level failure, e.g. CORS blocking
   the request, or the URL in `.env` still being the placeholder) — a
   clearly labeled **simulated** answer is shown instead, sourced from
   `mockChatResponses.js`, so the panel still demonstrates the intended
   UX rather than showing a dead error.
3. **Service reachable but returns a real error** (e.g. the token-expiry
   502 described below) — the actual error message is shown, not masked
   by a simulated answer, since that's a genuine backend problem worth
   surfacing honestly.

## Known gaps (owned elsewhere, worth knowing for Q&A)

- **CORS is not yet enabled on the ML service.** The deployed `/chat`
  endpoint currently rejects browser requests from `localhost:3000` with
  a CORS policy error (missing `Access-Control-Allow-Origin` header).
  This has been flagged to the ML Engineer — needs `flask-cors` added to
  `app.py` and redeployed. Until then, Ask SCRB will show simulated
  answers (see above) rather than real ones.
- **Real auth doesn't exist yet** — owned by the Team Lead per the
  brief. The current login is a local mock.
- **The chat backend uses a personal OAuth token** that expires roughly
  hourly — already flagged by the ML Engineer in their own
  `PROGRESS.md`. Once CORS is fixed, expect this as an occasional real
  502 error until it's replaced with a proper service credential.
- **The synthetic dataset only covers 10 districts** (not all ~30
  Karnataka districts) — the choropleth map will show "no data" for
  districts outside that set once wired to real data.
- **District/crime-type ID lookups** (`lookupTables.js`) are sourced
  from `ml-training/synthetic-data-gen/gen.py` — correct for the
  synthetic dataset, but should be reconfirmed if real data ever
  replaces it.