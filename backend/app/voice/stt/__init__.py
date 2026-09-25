"""
Speech-to-Text provider registry.
"""
from app.core.config import settings
from app.voice.stt.base import SpeechToTextProvider
from app.voice.stt.mock_stt import MockSpeechToTextProvider
from app.voice.stt.gemini_stt import GeminiSpeechToTextProvider


def get_stt_provider(provider_type: str = None) -> SpeechToTextProvider:
    choice = (provider_type or getattr(settings, "STT_PROVIDER", "mock")).lower()
    if choice == "gemini" and settings.GEMINI_API_KEY:
        return GeminiSpeechToTextProvider()
    return MockSpeechToTextProvider()
