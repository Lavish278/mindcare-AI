from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Auth schemas
class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


# Onboarding & Profile schemas
class OnboardingRequest(BaseModel):
    display_name: str
    wellness_goals: List[str]
    notification_frequency: str = "twice_daily"
    ai_data_consent: bool = True
    wearable_data_consent: bool = True


class PrivacySettingsUpdateRequest(BaseModel):
    ai_conversation_data: Optional[bool] = None
    wellness_data: Optional[bool] = None
    wearable_data: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    analytics_participation: Optional[bool] = None


# Chat schemas
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    current_mode: Optional[str] = "AWAKE"


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    suggested_followups: List[str] = Field(default_factory=list)
    safety_interception: bool = False
    safety_details: Optional[Dict[str, Any]] = None
    wellness_disclaimer: str = "MindCare AI offers supportive non-diagnostic wellness insights, not medical diagnoses or emergency care."


# Voice schemas
class VoiceTranscriptionRequest(BaseModel):
    audio_base64: Optional[str] = None
    transcript_text: Optional[str] = None


class VoiceProcessRequest(BaseModel):
    user_speech_text: str
    current_mode: Optional[str] = "AWAKE"


class VoiceProcessResponse(BaseModel):
    reply_text: str
    audio_url: Optional[str] = None
    safety_interception: bool = False
    resources_presented: Optional[List[str]] = None


# Check-in schemas
class SubmitCheckInRequest(BaseModel):
    check_in_type: str  # "midday" or "evening"
    mood_score: int  # 1-10
    stress_score: int  # 1-10
    energy_score: int  # 1-10
    notes: Optional[str] = ""
    qa_answers: List[Dict[str, Any]] = Field(default_factory=list)


# Wearable schemas
class ConnectWearableRequest(BaseModel):
    provider_type: str = "mock"  # "mock", "fitbit", "apple_health"
    device_name: Optional[str] = "MindCare Demo Band"


class IngestWearableReadingRequest(BaseModel):
    heart_rate: int
    timestamp: Optional[str] = None
    context_mode: Optional[str] = None  # "AWAKE", "SLEEP", "EXERCISE" (or None for auto-detection)
    steps: Optional[int] = None
    battery_level: Optional[int] = 95
    device_name: Optional[str] = "Physical Smartwatch"
    device_id: Optional[str] = "LIVE-DEVICE-01"
    source: Optional[str] = "Live Hardware Ingestion"


class ModeChangeRequest(BaseModel):
    mode: str  # "AWAKE", "SLEEP", "EXERCISE"
    manual_override: bool = True


class WearableSyncResponse(BaseModel):
    status: str
    synced_readings_count: int
    current_heart_rate: int
    context_mode: str
    data_quality: str
    last_synced: str


# Recommendation schemas
class RecommendationFeedbackRequest(BaseModel):
    recommendation_id: str
    category: str
    helpful: str  # "YES", "SOMEWHAT", "NO"
    comment: Optional[str] = ""


# Anomaly simulation for demo
class SimulateAnomalyRequest(BaseModel):
    anomaly_scenario: str  # "sleep_high_hr", "awake_prolonged_tachycardia", "exercise_normal_spike", "extreme_stress"

