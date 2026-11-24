# MedSynth: Privacy-Preserving Generative Framework for Synthetic Medical Data Augmentation

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB.svg?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB.svg?logo=python)](https://python.org)
[![Status](https://img.shields.io/badge/Phase-I_Foundation-emerald.svg)]()

> **Project Reference:** Visvesvaraya Technological University (VTU) B.E. in Artificial Intelligence & Machine Learning.  
> Based on the project specification in `Projectmain(1).pdf`.

---

## 1. Overview

**MedSynth** addresses the critical *Healthcare Data Privacy Paradox*: while state-of-the-art clinical AI models require vast datasets to generalize, strict legal privacy mandates (HIPAA, GDPR) create &ldquo;data silos&rdquo; that inhibit cross-institutional research and clinical collaboration.

Rather than relying on vulnerable heuristic anonymization (which remains prone to high-dimensional linkage and re-identification attacks), MedSynth learns the underlying mathematical distributions of real patient records to generate synthetic **&ldquo;digital twins&rdquo;** with provable **Differential Privacy (DP)** mathematical guarantees.

### Core Capabilities
- **Tabular Clinical Data (EHR):** MedGAN architecture pairing GANs with autoencoders to preserve complex correlations across discrete variables (medications, ICD diagnosis codes, laboratory measurements).
- **Medical Imaging:** Latent Diffusion models (RoentGen architecture) for conditional text-to-radiograph synthesis (e.g. chest X-rays for rare pathologies).
- **Mathematical Privacy:** Bounded Differential Privacy ($(\epsilon, \delta)$-DP) via DP-SGD gradient clipping and calibrated Gaussian noise injection.
- **Clinical Utility Benchmarking:** Quantitative evaluation using Fréchet Inception Distance (FID), Structural Similarity Index (SSIM), and two-sample Kolmogorov–Smirnov (KS) tests.

---

## 2. Project Architecture

```
medsynth/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI modular endpoints
│   │   │   ├── health.py    # Health check & system diagnostics
│   │   │   ├── dashboard.py # Live summary telemetry
│   │   │   └── router.py    # Aggregated /api router
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Business logic & telemetry services
│   │   ├── config.py        # Settings via pydantic-settings
│   │   └── main.py          # Application entry point & CORS configuration
│   ├── storage/             # Isolated local storage directories
│   │   ├── datasets/        # Seed clinical records (EHR & X-ray)
│   │   ├── generated/       # Exported synthetic cohorts
│   │   └── models/          # Trained generator checkpoints
│   ├── tests/               # Pytest suite
│   ├── .venv/               # Python virtual environment
│   └── requirements.txt     # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (Sidebar, TopNavbar, MetricCard, etc.)
│   │   ├── layouts/         # Dashboard layout wrapper
│   │   ├── pages/           # All 9 module views
│   │   ├── services/        # Typed API client with auto-reconnect
│   │   └── types/           # TypeScript interfaces for API & Navigation
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Quick Start Guide

### Prerequisites
- **Python**: 3.10+ (Verified on Python 3.14)
- **Node.js**: v20+ (Verified on Node.js v24.18.0 with npm 11.16.0)

### 3.1 Backend Setup & Execution

1. Navigate to the backend directory and activate the virtual environment:
   ```bash
   cd backend
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. Install dependencies (already installed in `.venv`):
   ```bash
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```bash
   uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Run tests:
   ```bash
   pytest tests
   ```

- **Backend API URL:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Dashboard Summary Endpoint:** [http://127.0.0.1:8000/api/dashboard/summary](http://127.0.0.1:8000/api/dashboard/summary)

---

### 3.2 Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

- **Frontend URL:** [http://localhost:5173](http://localhost:5173)

---

## 4. Verification & Testing Status

- [x] Backend test suite passed: `backend/tests/test_health.py` & `backend/tests/test_dashboard.py` (2 passed in 0.13s).
- [x] Frontend TypeScript compilation and production bundle build verified with zero errors (`tsc -b && vite build`).
- [x] CORS origin configured for `http://localhost:5173` and `http://127.0.0.1:5173`.
- [x] Live connection state indicator with automatic telemetry polling and latency calculation.
- [x] All 9 research navigation modules established with honest empty states and Phase-I specification blueprints.
