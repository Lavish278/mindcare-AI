"""
MindCare AI — Gemini Speech-to-Text Provider
Leverages Gemini multimodal audio capabilities via google-genai SDK for cloud transcription.
"""
import logging
from typing import Dict, Any, Optional
from app.voice.stt.base import SpeechToTextProvider
from app.voice.stt.mock_stt import MockSpeechToTextProvider
from app.core.config import settings

logger = logging.getLogger("mindcare.voice.stt.gemini")


class GeminiSpeechToTextProvider(SpeechToTextProvider):
    """
    Transcribes audio using Google GenAI SDK.
    Falls back gracefully to MockSpeechToTextProvider if unconfigured or unreachable.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = None
        self._fallback = MockSpeechToTextProvider()
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini STT Provider initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize GenAI client for STT: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/wav",
        language_hint: Optional[str] = "en"
    ) -> Dict[str, Any]:
        if not audio_bytes or len(audio_bytes) < 4:
            return {
                "text": "",
                "confidence": 0.0,
                "language": language_hint or "en",
                "provider": "GeminiSTT",
                "is_empty": True
            }

        if not self.is_configured():
            return self._fallback.transcribe(audio_bytes, mime_type, language_hint)

        try:
            from google.genai import types

            response = self.client.models.generate_content(
                model=settings.AI_MODEL_NAME,
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    (
                        "Please transcribe the spoken audio verbatim. "
                        "Return ONLY the exact spoken words with no additional commentary, quotes, or markdown."
                    )
                ]
            )
            transcription = response.text.strip() if response.text else ""
            return {
                "text": transcription,
                "confidence": 0.95,
                "language": language_hint or "en",
                "provider": "GeminiSTT",
                "is_empty": len(transcription) == 0
            }
        except Exception as e:
            logger.error(f"Gemini audio transcription error: {e}. Falling back to mock provider.")
            return self._fallback.transcribe(audio_bytes, mime_type, language_hint)
