from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid


class PrivacyConsent(BaseModel):
    ai_conversation_data: bool = True
    wellness_data: bool = True
    wearable_data: bool = True
    notifications_enabled: bool = True
    analytics_participation: bool = True
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    role: str = "user"  # "user", "admin", "researcher"
    onboarding_completed: bool = False
    wellness_preferences: Dict[str, Any] = Field(default_factory=dict)
    privacy_consent: PrivacyConsent = Field(default_factory=PrivacyConsent)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = "Wellness Chat"
    messages: List[ChatMessage] = Field(default_factory=list)
    context_mode: str = "AWAKE"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CheckInAnswer(BaseModel):
    question_id: str
    question_text: str
    category: str
    answer_text: str
    numeric_value: Optional[float] = None


class CheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    check_in_type: str  # "midday" or "evening"
    mood_score: int  # 1 to 10
    stress_score: int  # 1 to 10
    energy_score: int  # 1 to 10
    notes: Optional[str] = ""
    qa_answers: List[CheckInAnswer] = Field(default_factory=list)
    wellness_indicator_label: str = "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
    summary: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WearableReading(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    heart_rate: int
    context_mode: str = "AWAKE"  # "AWAKE", "SLEEP", "EXERCISE"
    data_quality: str = "VALID"  # "VALID", "SUSPICIOUS", "MISSING", "STALE"
    source: str = "MockWearableProvider v1.0"
    device_name: str = "MindCare Demo Band"
    battery_level: int = 88


class ActivitySession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    activity_type: str  # "walking", "running", "yoga", "cycling", "rest"
    duration_minutes: int
    steps: int
    calories_burned: int
    avg_heart_rate: int
    max_heart_rate: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SleepRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # YYYY-MM-DD
    total_duration_hours: float
    deep_sleep_hours: float
    rem_sleep_hours: float
    light_sleep_hours: float
    sleep_efficiency_percent: int
    resting_sleep_hr: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PersonalReferenceRange(BaseModel):
    user_id: str
    days_observed: int = 1
    stability_tier: str = "initial"  # "initial" (1-2d), "improved" (1w), "stable" (2-4w), "continuous" (>4w)
    disclaimer: str = "Personal Reference Range — Individualized physiological pattern, NOT a medical baseline or diagnosis."
    rest_hr_min: int = 60
    rest_hr_max: int = 82
    rest_hr_avg: int = 70
    sleep_hr_avg: int = 62
    exercise_hr_typical_max: int = 155
    typical_daily_steps: int = 8200
    typical_sleep_hours: float = 7.2
    typical_stress_avg: float = 4.5
    typical_mood_avg: float = 7.0
    last_computed: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnomalyEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    state: str  # "NORMAL", "UNUSUAL", "SUSTAINED_ANOMALY", "SAFETY_EVENT"
    metric: str  # "heart_rate", "stress_pattern", "sleep_deficit"
    current_value: float
    reference_expected: str
    context_mode: str
    explanation: str
    actionable_recommendation: Optional[str] = None
    data_quality: str = "VALID"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Recommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str  # "breathing", "relaxation", "mindfulness", "journaling", "short_breaks", "light_activity", "sleep_routine"
    title: str
    description: str
    duration_minutes: int
    action_steps: List[str]
    rationale: str
    context_trigger: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RecommendationFeedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recommendation_id: str
    category: str
    helpful: str  # "YES", "SOMEWHAT", "NO"
    comment: Optional[str] = ""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SafetyEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    risk_level: str  # "HIGH", "CRITICAL"
    trigger_category: str  # "crisis_self_harm", "medical_emergency_statement", "extreme_distress"
    user_message_sample: str
    action_taken: str
    resources_presented: List[str]
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AppVersionInfo(BaseModel):
    version: str = "1.0.0"
    stage: str = "v1.0-university-mvp"
    release_date: str = "2026-09-19"
    features: List[str] = [
        "Conversational AI Wellness Companion",
        "Mock Wearable Provider with real-time sync",
        "Tri-Mode Engine (Awake, Sleep, Exercise)",
        "Non-diagnostic Personal Reference Modeling",
        "Contextual Anomaly Engine",
        "Midday & Evening Adaptive Check-ins",
        "Crisis Safety Interception & Hotline Dispatch",
        "De-identified Research Analytics Dashboard"
    ]

