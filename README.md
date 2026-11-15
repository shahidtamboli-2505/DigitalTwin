# 🏗️ AI-Powered Digital Twin for Critical Infrastructure

> Real-time monitoring, AI-driven risk assessment, and disaster management for Sangli District, Maharashtra.

![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

A production-ready Digital Twin platform that creates digital representations of physical infrastructure (bridges, dams, roads, hospitals) for real-time monitoring, AI-powered risk prediction, and disaster management in Sangli District.

### Key Features

- 🗺️ **GIS Visualization** — 2D MapLibre map with OSM-sourced assets and a Three.js 3D digital twin (any year's flood can be replayed on the twin)
- 🤖 **AI Models** — Flood-risk prediction (XGBoost, trained on 26 years of daily climate data) and crack classification (OpenCV features + scikit-learn)
- 📅 **Year Analysis** — pick any year from 2000 to today: rainfall, estimated Krishna river level, AI flood probability, district health index, per-asset infrastructure health and year-vs-year comparison
- 🏗️ **Digital Twin** — Real-time sensor monitoring with simulated IoT data
- 🚨 **Alert System** — Multi-channel notifications with escalation workflows
- 📊 **Analytics** — Enterprise dashboard with interactive charts and KPIs
- 🔐 **Security** — JWT auth, RBAC (7 roles), audit logging, OWASP compliant

## 🏛️ Architecture

```
Frontend (React + TypeScript + Vite)
    ↕ REST API + WebSocket
Backend (FastAPI + Python)
    ↕
┌─────────────┬──────────────┬────────────┐
│ PostgreSQL  │   MongoDB    │   Redis    │
│ + PostGIS   │  (Documents) │  (Cache)   │
└─────────────┴──────────────┴────────────┘
    ↕
AI Engine (XGBoost flood model + OpenCV/sklearn crack classifier)
```

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/digital-twin-sangli.git
cd digital-twin-sangli

# 2. Environment
cp .env.example .env
# Fill in your API keys (see .env.example for instructions)

# 3. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev

# 5. AI data pipeline (run from the project root, needs internet once)
python ai/training/build_yearly_dataset.py   # downloads 2000-today daily climate -> ai/datasets/weather/
python ai/training/train_flood_model.py      # trains XGBoost -> ai/models/flood_xgboost.joblib + metrics
python ai/training/build_yearly_dataset.py   # re-score every year with the trained model
```

## 📊 Multi-year climate & flood dataset

`ai/training/build_yearly_dataset.py` downloads daily ERA5 reanalysis (Open-Meteo archive) for
Sangli **and** the upper Krishna catchment (Mahabaleshwar/Koyna) for every year from 2000 to the
current year, then produces `ai/datasets/weather/sangli_yearly.json` (also copied to
`frontend/public/data/` so the UI works without a backend). Per year it contains:

| Field | Meaning |
|-------|---------|
| `rainfall_total_mm`, `monthly_rain_mm` | local rainfall, total and per month |
| `catchment_rain_mm` | upstream Ghat rainfall that drives the Krishna gauge |
| `river_peak_m` | estimated gauge at Irwin Bridge: `9.5 + k × basin 7-day rain`, calibrated to the observed Aug-2019 peak (22.8 m) |
| `flood_risk_days` | days above ERA5-scaled IMD thresholds (35 mm/day, 70 mm/3-day, 130 mm/7-day) |
| `flood_prob_max` | highest daily probability from the XGBoost model |
| `risk_score` / `health_index` | `risk = 50·river + 25·flood-days + 15·AI prob + 10·heat`, `health = 100 − risk` |
| `severity` | catastrophic ≥ 60 · severe ≥ 45 · moderate ≥ 25 · minor |
| `hydrograph`, `daily` | ±7-day peak window and the full daily series |

Backend endpoints: `GET /api/analytics/years`, `GET /api/analytics/years/{year}`,
`GET /api/analytics/years/{a}/compare/{b}`, `GET /api/analytics/flood-history`, `GET /api/ai/models`.

## 📁 Project Structure

```
digital-twin-sangli/
├── frontend/          # React + TypeScript + Vite + TailwindCSS
├── backend/           # FastAPI + SQLAlchemy + Alembic
├── ai/                # AI models, notebooks, datasets
├── data/              # GeoJSON, shapefiles, raster data
├── docker/            # Docker configuration files
├── docs/              # Project documentation
└── .github/           # CI/CD workflows
```

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, MapLibre, CesiumJS, Recharts |
| Backend | Python, FastAPI, SQLAlchemy 2, Alembic, Celery |
| Database | PostgreSQL + PostGIS, MongoDB, Redis |
| AI/ML | XGBoost, scikit-learn, OpenCV, pandas (Open-Meteo ERA5 data) |
| DevOps | Docker, GitHub Actions, Vercel, Render |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Built as a pilot project for Sangli District, Maharashtra with future expansion to all of India.
