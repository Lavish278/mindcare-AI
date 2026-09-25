"""
MindCare AI — Local Fallback Text-to-Speech Provider
Generates clean audio payloads or provides client-side Web Speech parameters
ensuring voice interaction never breaks even if cloud TTS is unavailable or offline.
"""
import io
import wave
import struct
import math
import base64
from typing import Dict, Any, Optional
from app.voice.tts.base import TextToSpeechProvider


class LocalFallbackTTSProvider(TextToSpeechProvider):
    """
    Local fallback TTS provider.
    Synthesizes a gentle, harmonic chime audio indicator and returns
    calibrated acoustic parameters (rate, pitch, preferred natural voices)
    for high-fidelity client playback.
    """

    def __init__(self):
        self.default_persona = {
            "name": "MindCare Serena (Calm Companion)",
            "tone": "calm, warm, mature, reassuring, soft-spoken, patient",
            "rate": 0.92,
            "pitch": 1.0,
            "volume": 1.0,
            "preferred_browser_voices": [
                "Google US English",
                "Samantha",
                "Microsoft Jenny Online (Natural)",
                "Natural",
                "Serena"
            ]
        }

    def _generate_soft_chime_wav(self, duration_sec: float = 0.4) -> bytes:
        """Generates a pleasant 432 Hz warm harmonic sound wave."""
        sample_rate = 16000
        num_samples = int(sample_rate * duration_sec)
        wav_io = io.BytesIO()

        with wave.open(wav_io, "wb") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)

            for i in range(num_samples):
                t = float(i) / sample_rate
                # Decay envelope
                envelope = math.exp(-3.5 * t / duration_sec)
                # 432Hz fundamental + 864Hz soft harmonic
                value = (math.sin(2.0 * math.pi * 432.0 * t) * 0.7 +
                         math.sin(2.0 * math.pi * 864.0 * t) * 0.3) * envelope
                sample = int(value * 12000.0)
                wav_file.writeframes(struct.pack("<h", sample))

        return wav_io.getvalue()

    def synthesize(
        self,
        text: str,
        voice_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        config = {**self.default_persona, **(voice_config or {})}

        # Generate lightweight audio bytes
        audio_bytes = self._generate_soft_chime_wav()
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "audio_bytes": audio_bytes,
            "audio_base64": f"data:audio/wav;base64,{audio_b64}",
            "mime_type": "audio/wav",
            "provider": "LocalFallbackTTS",
            "client_speech_recommended": True,
            "voice_persona": config
        }
