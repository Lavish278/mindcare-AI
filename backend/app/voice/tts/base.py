"""
MindCare AI — Text-to-Speech (TTS) Provider Abstraction
Decouples voice audio synthesis from specific cloud vendors.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class TextToSpeechProvider(ABC):
    """Abstract interface for Text-to-Speech providers."""

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes text into natural speech audio.
        Returns:
          - audio_bytes: Optional[bytes]
          - audio_base64: Optional[str]
          - mime_type: str
          - provider: str
          - client_speech_recommended: bool
          - voice_persona: Dict[str, Any]
        """
        pass
