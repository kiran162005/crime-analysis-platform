# AI-Driven Crime Analytics & Visualization Platform

An intelligent crime analytics platform built using **Zoho Catalyst** to help law enforcement analyze crime patterns, detect hotspots, identify anomalies, visualize criminal networks, and generate AI-powered insights.

---

# Features

- Interactive crime dashboard
- Karnataka district map visualization
- Crime hotspot detection
- AI-based anomaly detection
- Criminal network visualization
- Risk prediction
- Role-based authentication
- AI-powered "Ask SCRB" assistant
- Automated alerts
- PDF Intelligence Reports

---

# Tech Stack

## Frontend

- React
- Vite
- Leaflet.js
- Recharts
- React Force Graph

## Backend

- Zoho Catalyst Functions (Python)
- Catalyst API Gateway

## AI / ML

- Catalyst AppSail
- Scikit-Learn
- DBSCAN
- Isolation Forest

## Database

- Catalyst Data Store
- Catalyst NoSQL
- Catalyst Cache
- Catalyst Stratus

## Catalyst Services

- Authentication
- API Gateway
- Functions
- AppSail
- Signals
- Cron
- Circuits
- SmartBrowz
- QuickML
- Zia AutoML

---

# Project Structure

```text
crime-analysis-platform/

├── appsail-python/
├── crime-analysis-platform-ui/
├── crime-analysis-slate/
├── functions/
├── docs/
├── data/
├── scripts/
├── catalyst.json
├── README.md
└── .gitignore
```

---

# Team Roles

## Team Lead

Responsible for:

- Database Schema
- Catalyst Functions
- Authentication
- API Gateway
- Integration

---

## Frontend Engineer

Responsible for:

- React Dashboard
- Leaflet Maps
- Charts
- Network Graph
- Ask SCRB Chat UI

---

## AI / ML Engineer

Responsible for:

- Hotspot Detection
- Risk Prediction
- Anomaly Detection
- QuickML
- Model Training

---

## Network Analysis Engineer

Responsible for:

- Criminal Link Analysis
- Relationship Graph
- Repeat Offender Detection

---

## DevOps Engineer

Responsible for:

- Deployment
- Cron Jobs
- Signals
- Circuits
- SmartBrowz
- Documentation

---

# Prerequisites

Install:

- Git
- Node.js 22+
- Python 3.11
- Zoho Catalyst CLI

Install Catalyst CLI

```bash
npm install -g zcatalyst-cli
```

---

# Clone Repository

```bash
git clone <repository-url>

cd crime-analysis-platform
```

---

# Catalyst Login

```bash
catalyst login
```

Choose the shared Catalyst Project

```bash
catalyst project:use
```

---

# Setup Instructions

## Frontend

```bash
cd crime-analysis-platform-ui

npm install

npm run dev
```

---

## Slate

```bash
cd crime-analysis-slate

npm install

npm run dev
```

---

## AppSail

```bash
cd appsail-python

pip install -r requirements.txt
```

---

## Functions

```bash
cd functions/crime_analysis_platform_function

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt
```

---

# Git Workflow

Clone repository

Create feature branch

```bash
git checkout -b feature/<module-name>
```

Examples

```
feature/frontend

feature/functions

feature/ml

feature/network

feature/devops
```

Commit

```bash
git add .

git commit -m "Add <feature>"
```

Push

```bash
git push origin feature/<module-name>
```

Create Pull Request

Merge into main after review.

---

# Environment Variables

Never commit

```
.env
```

Use

```
.env.example
```

instead.

---

# Branch Strategy

```
main
```

Stable Production Branch

Feature branches

```
feature/frontend

feature/functions

feature/ml

feature/network

feature/devops
```

---

# Contributors

| Role | Responsibility |
|------|----------------|
| Team Lead | Backend & Integration |
| Frontend Engineer | Dashboard & Maps |
| AI Engineer | ML Models |
| Network Engineer | Link Analysis |
| DevOps Engineer | Deployment & Automation |

---
