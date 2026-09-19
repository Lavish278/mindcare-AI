# MindCare AI — REST API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive Documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication & Profile (`/auth`)

### `POST /auth/register`
Creates a new student account and returns a JWT access token.
```json
// Request Body
{
  "email": "student@university.edu",
  "password": "SecurePassword123!",
  "display_name": "Jordan Taylor"
}
```

### `POST /auth/login`
Authenticates existing credentials or initializes demo session.
```json
// Request Body
{
  "email": "student@mindcare.demo",
  "password": "DemoPassword2026!"
}
```

### `GET /auth/me`
Fetches authenticated user profile and active consent flags. Header: `Authorization: Bearer <token>`.

### `PUT /auth/privacy`
Updates granular consent permissions (AI data, wearable streaming, analytics).

---

## 2. AI Wellness Companion (`/chat`)

### `POST /chat/message`
Sends a message to the AI Companion. Automatically evaluates crisis intent before LLM generation.
```json
// Request Body
{
  "message": "I'm feeling anxious about my upcoming thesis defense.",
  "conversation_id": "optional-uuid",
  "current_mode": "AWAKE"
}

// Response
{
  "conversation_id": "conv-123",
  "message": "It is completely understandable to experience heightened stress before a major academic defense...",
  "suggested_followups": [
    "Guide me through a 2-minute breathing exercise",
    "What can I do to stop overthinking?"
  ],
  "safety_interception": false,
  "wellness_disclaimer": "MindCare AI provides non-diagnostic wellness insights."
}
```

---

## 3. Voice Companion (`/voice`)

### `POST /voice/process`
Submits spoken audio transcript from microphone for empathetic audio response generation.
```json
// Request Body
{
  "user_speech_text": "I just completed a 30-minute walk and feel much more relaxed.",
  "current_mode": "EXERCISE"
}
```

---

## 4. Psychosocial Check-ins (`/checkins`)

### `GET /checkins/questions?check_in_type=midday`
Returns adaptive questions dynamically tailored to recent stress and sleep patterns.

### `POST /checkins/submit`
Logs a midday or evening check-in and updates the personal reference model.
```json
// Request Body
{
  "check_in_type": "midday",
  "mood_score": 8,
  "stress_score": 4,
  "energy_score": 7,
  "notes": "Focused morning session.",
  "qa_answers": []
}
```

### `GET /checkins/indicators`
Returns current non-diagnostic wellness indicators:
```json
{
  "mood_wellness_indicator": "8/10",
  "stress_wellness_indicator": "4/10",
  "energy_indicator": "7/10",
  "disclaimer": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
}
```

---

## 5. Wearable Biosensors (`/wearables`)

### `GET /wearables/status`
Returns connection state, battery level, and supported biometric sensors.

### `POST /wearables/connect`
Initializes connection to wearable provider (default: `MockWearableProvider`).

### `POST /wearables/mode`
Switches physiological mode (`AWAKE`, `SLEEP`, or `EXERCISE`).

### `GET /wearables/readings`
Fetches current heart rate snapshot with data quality tag (`VALID`, `SUSPICIOUS`, `MISSING`, `STALE`) and contextual anomaly evaluation.

### `POST /wearables/simulate-anomaly`
Demonstrates contextual evaluation without hardware:
- `sleep_high_hr`: Elevated nocturnal HR $\rightarrow$ flags `UNUSUAL`.
- `exercise_normal_spike`: 148 bpm during workout $\rightarrow$ evaluated as `NORMAL`.
- `data_stale`: Stale sensor stream $\rightarrow$ flags `STALE`, halts false alerts.

---

## 6. Recommendations & Feedback (`/recommendations`)

### `GET /recommendations`
Returns top micro-interventions weighted by current stress, mode, and historical user feedback.

### `POST /recommendations/feedback`
Captures user rating (`YES`, `SOMEWHAT`, `NO`) and qualitative notes.

---

## 7. Research & Admin Governance (`/admin`)

### `GET /admin/metrics`
Returns aggregated, de-identified project metrics (cohort size, completion rate, signal quality distribution, continuous improvement version tracking).
