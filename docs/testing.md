# MindCare AI — Quality Assurance & Testing Strategy

## 1. Test Suite Architecture

MindCare AI includes automated testing suites across backend services, API contracts, safety interception, and frontend bundling.

```
backend/tests/
├── conftest.py                       # Test isolation fixture resetting local store
├── test_safety.py                   # Crisis keyword & emergency intent unit tests
├── test_wearable_and_anomaly.py      # MockWearableProvider, DataQualityValidator, Mode & Anomaly tests
├── test_checkins_and_reference.py   # CheckInService, Adaptive questions, Personal Reference tiers
└── test_api_endpoints.py            # End-to-end FastAPI TestClient integration tests
```

---

## 2. Test Execution Matrix

| Test Suite | File | Tests Run | Pass Rate |
|---|---|---|---|
| **Safety Interceptor** | `tests/test_safety.py` | 3 | 100% |
| **Wearables & Context Engine** | `tests/test_wearable_and_anomaly.py` | 4 | 100% |
| **Check-ins & Reference Range**| `tests/test_checkins_and_reference.py` | 4 | 100% |
| **API Endpoints & Integration** | `tests/test_api_endpoints.py` | 6 | 100% |
| **Total Automated Tests** | | **17 Tests** | **100% PASS** |

---

## 3. Running Backend Tests

Using the Python virtual environment:
```powershell
# Navigate to backend directory
cd backend

# Execute pytest suite with verbose output
.\.venv\Scripts\python.exe -m pytest tests -v
```

Expected output:
```text
======================= 17 passed, 2 warnings in 0.62s ========================
```

---

## 4. Running Frontend Verification

```powershell
# Navigate to frontend directory
cd frontend

# Verify TypeScript compilation and production build
npm run build
```

Expected output:
```text
✓ 2235 modules transformed.
dist/index.html                   1.03 kB
dist/assets/index.css             35.04 kB
dist/assets/index.js              741.21 kB
✓ built in 16.58s
```

