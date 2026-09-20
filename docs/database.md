# MindCare AI — Database & Storage Specification

## 1. Overview

MindCare AI utilizes a NoSQL document data model designed for Google Cloud Firestore. The schema enforces strict document isolation, audit tracking, and role-based access control.

To ensure zero friction during local university presentations, the platform features a dual-backend persistence architecture:
1. **Google Cloud Firestore (Production / Cloud Mode)**: Configured via `FIREBASE_PROJECT_ID` or Service Account JSON.
2. **Local Firestore Mirror (Demo Mode)**: A thread-safe, JSON-persisted document store replicating Firestore collection/document APIs (`set`, `get`, `query`, `update`, `delete`).

---

## 2. Collection Schemas

### `users`
Represents student accounts, profile preferences, and consent flags.
```json
{
  "id": "uuid-or-auth-uid",
  "uid": "uuid-or-auth-uid",
  "email": "student@university.edu",
  "display_name": "Alex Chen",
  "role": "user",
  "onboarding_completed": true,
  "wellness_preferences": {
    "goals": ["Stress Reduction", "Sleep Hygiene"],
    "notification_frequency": "twice_daily"
  },
  "privacy_consent": {
    "ai_conversation_data": true,
    "wellness_data": true,
    "wearable_data": true,
    "notifications_enabled": true,
    "analytics_participation": true,
    "updated_at": "2026-09-19T08:30:00Z"
  },
  "created_at": "2026-09-19T08:30:00Z"
}
```

### `check_ins`
Stores twice-daily subjective emotional evaluations and non-diagnostic indicators.
```json
{
  "id": "checkin-uuid",
  "user_id": "user-uuid",
  "check_in_type": "midday",
  "mood_score": 8,
  "stress_score": 4,
  "energy_score": 7,
  "notes": "Had a productive morning group study.",
  "qa_answers": [
    {
      "question_id": "midday_mood",
      "question_text": "How would you rate your emotional balance?",
      "category": "mood",
      "answer_text": "Completed via slider (8/10)"
    }
  ],
  "wellness_indicators": {
    "mood_wellness_indicator": "8/10",
    "stress_wellness_indicator": "4/10",
    "energy_indicator": "7/10",
    "label": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
  },
  "summary": "Midday Check-in: Reflects a calm, grounded personal state.",
  "timestamp": "2026-09-19T12:15:00Z"
}
```

### `personal_reference`
Holds the individualized reference ranges computed over time.
```json
{
  "id": "user-uuid",
  "user_id": "user-uuid",
  "days_observed": 7,
  "stability_tier": "improved",
  "tier_label": "Improved Reference (Week 1)",
  "disclaimer": "Personal Reference Range — Individualized physiological pattern, NOT a medical baseline or diagnosis.",
  "rest_hr_range": { "min": 58, "max": 83, "avg": 70 },
  "sleep_hr_range": { "min": 52, "max": 65, "avg": 60 },
  "exercise_hr_range": { "min": 110, "max": 175, "avg": 145 },
  "typical_daily_steps": 8500,
  "typical_sleep_duration_hours": 7.3,
  "typical_stress_avg": 4.2,
  "typical_mood_avg": 7.4,
  "confidence_score": 0.80,
  "last_computed": "2026-09-19T08:30:00Z"
}
```

### `wearable_readings`
Real-time physiological biometric samples tagged with data quality and context mode.
```json
{
  "id": "reading-timestamp",
  "user_id": "user-uuid",
  "heart_rate": 72,
  "context_mode": "AWAKE",
  "data_quality": "VALID",
  "quality_rationale": "Signal passes all physiological integrity checks.",
  "source": "MockWearableProvider v1.0",
  "battery_level": 87,
  "timestamp": "2026-09-19T13:45:00Z"
}
```

### `feedback`
Captures user evaluation of suggested wellness micro-actions to adapt the recommendation engine.
```json
{
  "id": "feedback-uuid",
  "user_id": "user-uuid",
  "recommendation_id": "rec-box-breathing",
  "category": "breathing",
  "helpful": "YES",
  "comment": "Helped ease shoulder tension before presentation.",
  "timestamp": "2026-09-19T14:00:00Z"
}
```

### `safety_events`
Audit log of crisis statements and physical emergency alerts intercepted by the safety layer.
```json
{
  "id": "event-uuid",
  "user_id": "user-uuid",
  "risk_level": "CRITICAL",
  "trigger_category": "crisis_self_harm",
  "user_message_sample": "I feel like ending it all tonight",
  "action_taken": "SURFACED_CRISIS_HOTLINES",
  "resources_presented": ["988 Suicide & Crisis Lifeline", "Crisis Text Line"],
  "timestamp": "2026-09-19T14:05:00Z"
}
```

---

## 3. Indexes & Security
- Query index configuration: Defined in `firebase/firestore.indexes.json`.
- Authorization rules: Documented in `firebase/firestore.rules`.

