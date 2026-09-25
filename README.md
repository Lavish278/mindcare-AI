# MindCare AI — Smart Mental Wellness Companion

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/pytest-24%20passed%20(100%25)-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

> **University Final-Year Engineering Project**
> A scalable digital mental wellness platform combining conversational AI, voice companion, psychosocial self-monitoring, and context-aware wearable device integration.

---

## 1. Project Purpose & Ethical Boundaries

MindCare AI is a **WELLNESS SUPPORT PLATFORM** designed to help students and knowledge workers observe their subjective emotional states, understand daily biometric rhythms, and build restorative habits.

> [!IMPORTANT]
> **Non-Diagnostic Medical Boundary**:
> - MindCare AI does **NOT** diagnose clinical depression, generalized anxiety disorder, bipolar disorder, cardiac arrhythmias, or any other medical condition.
> - All biometric and emotional indices are explicitly labeled:
>   `"WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"`.
> - Acute crisis statements immediately halt normal conversational processing to surface verified emergency lifelines (988 Lifeline, Crisis Text Line).

---

## 2. Two-Part Architecture

```
mindcare-ai/
├── frontend/                     # React 18 + Vite + TypeScript + Tailwind CSS + Recharts
├── backend/                      # Python 3.12 + FastAPI + Pydantic v2 + Uvicorn
├── firebase/                     # Firestore security rules, indexes, and emulator configuration
├── docs/                         # Exhaustive technical documentation (10 detailed guides)
├── scripts/                      # Startup automation & database seed scripts
├── .env.example                  # Environment configuration template
├── README.md                     # Master project guide
└── docker-compose.yml            # Multi-container orchestration
```

### PLAN A — AI Wellness Companion (Subjective Stream)
- **Landing Page**: Mission statement, architecture overview, privacy commitments, and one-click demo launch.
- **Authentication**: JWT and Firebase Auth architecture with demo user instant access.
- **Onboarding**: 4-step wizard for identity, wellness priorities, check-in schedules, and granular privacy consent.
- **Text & Voice AI Companion**: Empathetic conversational agent aware of current physiological context.
- **Psychosocial Check-ins**: Twice-daily evaluations (Midday ~12 PM and Evening Before-Bed).
- **Adaptive Questioning**: Tailors subsequent questionnaires dynamically based on past stress and sleep history.
- **Personalized Recommendations**: Micro-habits with embedded 4x4 Box Breathing tool and a rating feedback loop (`YES`, `SOMEWHAT`, `NO`).

### PLAN B — Wearable Biosensor Integration (Objective Stream)
- **Provider Abstraction**: Decoupled `WearableProvider` interface ensuring zero vendor lock-in.
- **MockWearableProvider**: Realistic physiological timeseries (circadian HR rhythm, sleep stages, step cadence, workouts) requiring zero physical hardware.
- **Tri-Mode Context Engine**: Differentiates between `AWAKE`, `SLEEP`, and `EXERCISE` contexts.
- **Data Quality Gate**: Screens signals as `VALID`, `SUSPICIOUS`, `MISSING`, or `STALE` before AI ingestion.
- **Contextual Anomaly Engine**: Evaluates physiological readings against individualized baselines (e.g. 148 bpm during exercise is recognized as **NORMAL**, while 104 bpm during sleep is flagged as **UNUSUAL**).
- **Personal Reference Range**: Multi-tier calibration (Initial $\rightarrow$ Improved $\rightarrow$ Stable $\rightarrow$ Continuous) rather than generic medical thresholds.

---

## 3. Quick Start & Local Execution

The project runs completely locally without physical smartwatches or paid external API keys.

### 3.1 Prerequisites
- **Python 3.12+**
- **Node.js 18+** and **npm 10+**
- (Optional) **Docker** and **Docker Compose**

---

### 3.2 Step-by-Step Setup

#### 1. Clone & Configure Environment
```powershell
# Copy environment file
cp .env.example .env
```

#### 2. Start Backend (FastAPI)
```powershell
cd backend

# Create virtual environment and install dependencies
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Launch FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: **`http://127.0.0.1:8000/docs`**

#### 3. Start Frontend (React + Vite)
In a new terminal window:
```powershell
cd frontend

# Install dependencies (already prepared)
npm install

# Start development server
npm run dev
```
Web application will be live at: **`http://localhost:5173`**

---

### 3.3 Docker Compose Run
Alternatively, launch both services with a single command:
```powershell
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## 4. University Final-Year Demonstration Guide

To demonstrate the project during an academic defense:

1. **Open MindCare AI**: Navigate to `http://localhost:5173`.
2. **Launch Demo Mode**: Click **"Explore Interactive Demo"** or **"One-Click University Demo Login (Alex Chen)"**.
3. **Verify Dashboard**:
   - Observe Today's Wellness Cards (Mood 7/10, Stress 4/10, Energy 6/10, HR 71 bpm).
   - Observe the 12-Hour Continuous Heart Rate Chart and Personal Reference Range card.
4. **Engage with AI Companion**:
   - Go to `/chat`. Send: *"I have an upcoming exam and feel stretched."* Observe the empathetic, non-diagnostic reflection.
   - Test Safety Interception: Send: *"I feel like ending my life tonight."* Observe immediate cessation of chat and appearance of the **988 Lifeline Emergency Modal**.
5. **Test Voice Companion**:
   - Go to `/voice`. Click the microphone or click a simulated spoken query. Observe the visualizer and voice playback.
6. **Complete an Adaptive Check-in**:
   - Go to `/checkins`. Submit a Midday Check-in with sliders. Notice the adaptive question tailored to past history.
7. **Demonstrate Plan B Wearables & Tri-Mode Context Engine**:
   - Go to `/wearables`.
   - Click **"2. Exercise Spike"**: Current HR jumps to 148 bpm. Context Mode shifts to `EXERCISE`. Notice the engine classifies the reading as **NORMAL (Contextual Exertion)**.
   - Click **"3. Sleep Nocturnal Spike"**: Current HR jumps to 104 bpm in `SLEEP` mode. Notice the engine flags **UNUSUAL** and suggests checking room temperature.
   - Click **"4. Degraded Sensor Data"**: Signal marked `STALE`. Notice the data quality gate suppresses false alarms.
8. **Try Recommendations & Feedback**:
   - Go to `/recommendations`. Try the interactive **4x4 Box Breathing** tool. Submit feedback (`YES`, `SOMEWHAT`, `NO`).
9. **Inspect Progress & Admin Governance**:
   - Go to `/progress` to view the 7-day longitudinal trajectory.
   - Go to `/admin` to view de-identified cohort statistics and the continuous improvement version pipeline (`v1.0` $\rightarrow$ `v1.1`).

---

## 5. Automated Testing Suite

The repository includes a comprehensive 24-test suite verifying API validation, safety crisis interception, data quality filtering, voice companion turns, and contextual anomaly evaluation:

```powershell
# Run backend tests
cd backend
.\.venv\Scripts\python.exe -m pytest tests -v
```

**Results: 24 Passed (100% Pass Rate in 0.66s)**

```powershell
# Verify frontend production build
cd frontend
npm run build
```

**Results: Clean Rollup bundling with 0 errors.**

---

## 6. Project Documentation Index

Detailed engineering documentation is available in the [`docs/`](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/) directory:
- [docs/VOICE_ARCHITECTURE.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/VOICE_ARCHITECTURE.md): Complete voice companion guide, STT/TTS abstractions, dual modes, and WebSocket barge-in.
- [docs/architecture.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/architecture.md): Plan A & Plan B component specifications.
- [docs/database.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/database.md): Firestore schemas, indexes, and document structures.
- [docs/api.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/api.md): REST API endpoints, request schemas, and sample payloads.
- [docs/wearable-integration.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/wearable-integration.md): Provider abstraction, data quality layer, and anomaly engine.
- [docs/ai-design.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/ai-design.md): System prompts, non-diagnostic guardrails, and adaptive questioning.
- [docs/safety.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/safety.md): Crisis interception architecture and emergency hotline directories.
- [docs/privacy.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/privacy.md): Granular consent, data minimization, and export.
- [docs/testing.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/testing.md): Automated testing matrix and verification results.
- [docs/deployment.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/deployment.md): Docker Compose and Google Cloud Run deployment.
- [docs/project-presentation.md](file:///c:/Users/acer/Downloads/mindcare%20AI%202/docs/project-presentation.md): Slide deck outline and thesis defense presentation script.

---

## 7. Known Limitations & Future Scope
- **Physical Hardware**: The current prototype utilizes `MockWearableProvider` to guarantee reliable demonstration without requiring Bluetooth pairing or commercial developer accounts. Physical Fitbit and Apple HealthKit integration can be added via the established provider abstraction.
- **On-Device Voice**: Speech recognition and text-to-speech currently leverage browser Web Speech APIs and FastAPI; future versions can incorporate on-device Whisper models for offline execution.
- **Longitudinal Cohort Studies**: Extended calibration across hundreds of real student participants over multiple semesters.

---

## 8. License
Developed for Academic Evaluation & Research. Licensed under the MIT License.

