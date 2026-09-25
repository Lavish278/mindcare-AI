"""
MindCare AI — Mock Speech-to-Text Provider
Provides high-fidelity offline transcription for development, unit testing, and thesis defense.
"""
from typing import Dict, Any, Optional
from app.voice.stt.base import SpeechToTextProvider


class MockSpeechToTextProvider(SpeechToTextProvider):
    """
    Mock STT provider for offline demonstration and testing.
    Can return realistic student wellness statements or decode simple mock test signals.
    """

    def __init__(self, predefined_text: Optional[str] = None):
        self.predefined_text = predefined_text
        self._sample_utterances = [
            "I'm feeling somewhat overwhelmed by my upcoming exam schedule.",
            "I took a short walk earlier and my energy feels a bit better.",
            "Can you suggest a calm breathing exercise to help me focus?",
            "I've been having trouble sleeping because my mind keeps racing.",
            "I'm feeling good today and just wanted to do a quick check in."
        ]
        self._counter = 0

    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/wav",
        language_hint: Optional[str] = "en"
    ) -> Dict[str, Any]:
        # 1. Empty / null audio check
        if not audio_bytes or len(audio_bytes) < 4:
            return {
                "text": "",
                "confidence": 0.0,
                "language": language_hint or "en",
                "provider": "MockSTTProvider",
                "is_empty": True
            }

        # 2. Check for explicit error simulation signal
        if b"SIMULATE_STT_ERROR" in audio_bytes:
            raise RuntimeError("Simulated speech recognition network or hardware failure.")

        # 3. Check for embedded utf-8 text signal (useful for testing audio payload bridges)
        try:
            decoded = audio_bytes.decode("utf-8").strip()
            if decoded.startswith("TEST_STT:"):
                text = decoded.replace("TEST_STT:", "").strip()
                return {
                    "text": text,
                    "confidence": 0.98,
                    "language": language_hint or "en",
                    "provider": "MockSTTProvider",
                    "is_empty": len(text) == 0
                }
        except Exception:
            pass

        # 4. Use predefined or cycle through sample utterances
        if self.predefined_text:
            text = self.predefined_text
        else:
            text = self._sample_utterances[self._counter % len(self._sample_utterances)]
            self._counter += 1

        return {
            "text": text,
            "confidence": 0.95,
            "language": language_hint or "en",
            "provider": "MockSTTProvider",
            "is_empty": False
        }
