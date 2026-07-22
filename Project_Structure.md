
# Project Structure

crime-analysis-platform/
│
├── .gitignore
├── README.md
├── catalyst.json
│
├── appsail-python/                 # AI/ML Microservice
│   ├── app.py
│   ├── requirements.txt
│   ├── clustering/
│   ├── anomaly/
│   ├── models/
│   ├── utils/
│   └── services/
│
├── crime-analysis-platform-ui/     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── auth/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── crime-analysis-slate/           # Catalyst Slate
│
├── functions/
│   └── crime_analysis_platform_function/
│       ├── main.py
│       ├── requirements.txt
│       └── utils/
│
├── docs/
│   ├── architecture.png
│   ├── api-contracts.md
│   ├── database-schema.md
│   └── presentation/
│
├── data/
│   ├── synthetic/
│   └── samples/
│
└── scripts/

---
