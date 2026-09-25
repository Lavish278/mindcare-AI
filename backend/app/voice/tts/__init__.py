"""
Text-to-Speech provider registry.
"""
from app.core.config import settings
from app.voice.tts.base import TextToSpeechProvider
from app.voice.tts.mock_tts import MockTextToSpeechProvider
from app.voice.tts.gemini_tts import GeminiTextToSpeechProvider
from app.voice.tts.local_fallback import LocalFallbackTTSProvider


def get_tts_provider(provider_type: str = None) -> TextToSpeechProvider:
    choice = (provider_type or getattr(settings, "TTS_PROVIDER", "mock")).lower()
    if choice == "gemini" and settings.GEMINI_API_KEY:
        return GeminiTextToSpeechProvider()
    if choice == "local" or choice == "fallback":
        return LocalFallbackTTSProvider()
    return MockTextToSpeechProvider()
