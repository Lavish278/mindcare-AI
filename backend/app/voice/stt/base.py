"""
MindCare AI — Speech-to-Text (STT) Provider Abstraction
Decouples voice audio transcription from specific vendor implementations (Whisper, Gemini, Mock).
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class SpeechToTextProvider(ABC):
    """Abstract interface for Speech-to-Text providers."""

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/wav",
        language_hint: Optional[str] = "en"
    ) -> Dict[str, Any]:
        """
        Transcribes speech audio bytes into text.
        Returns dictionary with keys:
          - text: str
          - confidence: float
          - language: str
          - provider: str
          - is_empty: bool
        """
        pass
