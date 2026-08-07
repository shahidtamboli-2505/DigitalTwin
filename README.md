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

- 🗺️ **GIS Visualization** — 2D (MapLibre) + 3D (CesiumJS) maps with 12+ data layers
- 🤖 **AI Models** — Crack detection (YOLO11), Flood prediction (XGBoost), Time-series forecasting (LSTM)
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
AI Engine (YOLO11 + XGBoost + LSTM + Gemini)
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
```

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
| AI/ML | YOLO11, XGBoost, LSTM, Gemini API, OpenCV |
| DevOps | Docker, GitHub Actions, Vercel, Render |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Built as a pilot project for Sangli District, Maharashtra with future expansion to all of India.
