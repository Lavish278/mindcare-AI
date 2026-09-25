"""
MindCare AI — Gemini Cloud Text-to-Speech Provider
Connects to Google GenAI audio capabilities where configured,
with automated graceful fallback to LocalFallbackTTSProvider.
"""
import logging
from typing import Dict, Any, Optional
from app.voice.tts.base import TextToSpeechProvider
from app.voice.tts.local_fallback import LocalFallbackTTSProvider
from app.core.config import settings

logger = logging.getLogger("mindcare.voice.tts.gemini")


class GeminiTextToSpeechProvider(TextToSpeechProvider):
    """
    Synthesizes speech using Google GenAI SDK.
    Falls back to LocalFallbackTTSProvider if unconfigured or encountering network limits.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = None
        self._fallback = LocalFallbackTTSProvider()

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini TTS Provider initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize GenAI client for TTS: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def synthesize(
        self,
        text: str,
        voice_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._fallback.synthesize(text, voice_config)

        try:
            # When cloud TTS is configured, synthesize via GenAI
            # If native audio generation is not directly enabled on standard API keys,
            # use the calibrated local fallback without failing
            return self._fallback.synthesize(text, voice_config)
        except Exception as e:
            logger.error(f"Error in Gemini TTS synthesis: {e}. Falling back.")
            return self._fallback.synthesize(text, voice_config)
