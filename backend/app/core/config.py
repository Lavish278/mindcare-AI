from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "MindCare AI — Smart Mental Wellness Companion"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Security & Auth
    SECRET_KEY: str = "mindcare-ai-dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""
    FIREBASE_DATABASE_URL: str = ""
    USE_FIREBASE_EMULATOR: bool = False

    # AI Service Configuration
    AI_PROVIDER: str = "mock"  # "gemini" or "mock"
    GEMINI_API_KEY: str = ""
    AI_MODEL_NAME: str = "gemini-2.5-flash"
    AI_MAX_TOKENS: int = 1024
    AI_TEMPERATURE: float = 0.7

    # Voice Service Configuration
    VOICE_PROVIDER: str = "mock"  # "web_speech" or "mock"
    STT_PROVIDER: str = "mock"  # "gemini", "whisper", or "mock"
    TTS_PROVIDER: str = "mock"  # "gemini", "local", or "mock"
    VOICE_MODE: str = "standard"  # "standard" or "realtime"
    REALTIME_VOICE_ENABLED: bool = True

    # Wearable Service Configuration
    WEARABLE_PROVIDER: str = "mock"  # "mock" or "external"

    # Physiological Baseline & Contextual Anomaly Thresholds (Configurable)
    HR_REST_LOW_THRESHOLD: int = 48
    HR_REST_HIGH_THRESHOLD: int = 100
    HR_SLEEP_HIGH_THRESHOLD: int = 85
    HR_EXERCISE_MAX_NORMAL: int = 185
    SLEEP_MIN_DURATION_HOURS: float = 5.0
    STRESS_HIGH_THRESHOLD: int = 8  # Scale 1-10

    # Safety Crisis Configuration
    SAFETY_ALERT_EMAIL: str = "safety-team@mindcare.internal"
    CRISIS_LIFELINE_PHONE: str = "988"
    CRISIS_TEXT_LINE: str = "HOME to 741741"
    CRISIS_INTERNATIONAL_URL: str = "https://findahelpline.com"


settings = Settings()

