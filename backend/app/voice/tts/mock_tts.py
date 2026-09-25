"""
MindCare AI — Mock Text-to-Speech Provider
Provides testable synthesis for offline execution, automated tests, and thesis defense.
"""
from typing import Dict, Any, Optional
from app.voice.tts.local_fallback import LocalFallbackTTSProvider


class MockTextToSpeechProvider(LocalFallbackTTSProvider):
    """Mock TTS provider subclassing the robust local fallback implementation."""

    def synthesize(
        self,
        text: str,
        voice_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        result = super().synthesize(text, voice_config)
        result["provider"] = "MockTTSProvider"
        return result
