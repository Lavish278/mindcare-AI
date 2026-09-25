"""
MindCare AI — Unified Voice Companion Engine
Orchestrates the complete voice interaction lifecycle:
Audio/Speech -> STT -> Safety Interception -> Context Builder ->
Conversation Manager -> MindCare AI -> Shared DB Conversation Memory -> TTS
"""
import uuid
import base64
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.core.database import DatabaseManager
from app.core.config import settings
from app.safety.detector import SafetyDetector
from app.services.context_builder import ContextBuilder
from app.services.conversation_manager import ConversationManager
from app.voice.stt import get_stt_provider
from app.voice.tts import get_tts_provider
from app.ai.gemini_provider import GeminiAIProvider
from app.ai.mock_provider import MockAIProvider


class VoiceCompanionEngine:
    """
    Unified voice conversational processing pipeline.
    Ensures identical context-awareness, safety standards, and memory
    between Text and Voice interfaces.
    """

    def __init__(self):
        self.stt_provider = get_stt_provider()
        self.tts_provider = get_tts_provider()
        self.ai_provider = (
            GeminiAIProvider()
            if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY
            else MockAIProvider()
        )

    def process_turn(
        self,
        user_id: str,
        speech_text: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        conversation_id: Optional[str] = None,
        current_mode: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes a complete voice conversation turn with multi-modal context
        and shared conversation history persistence.
        """
        # 1. Transcribe audio if raw audio is provided
        stt_metadata = {}
        if not speech_text and audio_bytes:
            stt_result = self.stt_provider.transcribe(audio_bytes)
            speech_text = stt_result.get("text", "").strip()
            stt_metadata = {
                "confidence": stt_result.get("confidence", 0.0),
                "stt_provider": stt_result.get("provider", "STT")
            }

        speech_text = (speech_text or "").strip()

        # Handle empty/inaudible turn
        if not speech_text:
            return {
                "transcription": "",
                "reply_text": "I didn't quite catch that. Whenever you're ready, feel free to tap the microphone and speak again.",
                "audio_base64": None,
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "safety_interception": False,
                "suggested_followups": [
                    "I'm feeling stressed about exams",
                    "Can we do a short breathing exercise?",
                    "How are my wellness indicators today?"
                ]
            }

        # 2. Safety Interception Gate (Identical to Text Chat)
        is_crisis, safety_payload = SafetyDetector.evaluate(speech_text)
        if is_crisis and safety_payload:
            event_id = str(uuid.uuid4())
            DatabaseManager.set("safety_events", event_id, {
                "id": event_id,
                "user_id": user_id,
                "modality": "voice",
                "risk_level": safety_payload.get("risk_level", "CRITICAL"),
                "trigger_category": safety_payload.get("category", "crisis_statement"),
                "user_message_sample": speech_text[:150],
                "action_taken": "SURFACED_CRISIS_HOTLINES",
                "resources_presented": [r.get("name") for r in safety_payload.get("resources", [])],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

            # Synthesize crisis audio response
            tts_res = self.tts_provider.synthesize(safety_payload["message"])

            return {
                "transcription": speech_text,
                "reply_text": safety_payload["message"],
                "audio_base64": tts_res.get("audio_base64"),
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "safety_interception": True,
                "safety_details": safety_payload,
                "resources_presented": [r.get("name") for r in safety_payload.get("resources", [])],
                "suggested_followups": ["Call 988 Lifeline", "Text HOME to 741741", "Reach out to someone you trust"],
                "wellness_disclaimer": safety_payload.get("disclaimer")
            }

        # 3. Retrieve or Create Shared Conversation History
        conv_id = conversation_id or f"conv-{user_id}"
        conv = DatabaseManager.get("conversations", conv_id)
        if not conv:
            conv = {
                "id": conv_id,
                "user_id": user_id,
                "title": "Wellness Dialogue",
                "messages": [],
                "context_mode": current_mode or "AWAKE",
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        # 4. Context Builder: Pull multi-modal context (Check-ins, Wearables, Baselines)
        full_context = ContextBuilder.build_context(
            user_id=user_id,
            user_profile=user_profile,
            current_mode=current_mode
        )
        context_prompt_block = ContextBuilder.format_prompt_context(full_context)

        # Append user voice message to shared memory (Note: Do NOT store raw audio)
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": speech_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "modality": "voice",
                "mode": full_context.get("active_mode"),
                **stt_metadata
            }
        }
        conv["messages"].append(user_msg)

        # 5. Conversation Manager & MindCare AI Engine Response Generation
        if settings.AI_PROVIDER == "gemini" and self.ai_provider.is_configured():
            prompt_str = ConversationManager.prepare_dialogue_prompt(
                messages=conv["messages"],
                context_str=context_prompt_block,
                modality="voice"
            )
            ai_result = self.ai_provider.generate_chat_response(
                messages=[{"role": "user", "content": prompt_str}],
                user_context=full_context,
                current_mode=full_context.get("active_mode", "AWAKE")
            )
            reply_text = ai_result.get("message", "")
            followups = ai_result.get("suggested_followups", [])
        else:
            # High-fidelity offline dialogue model
            ai_result = ConversationManager.generate_adaptive_voice_reply(
                current_text=speech_text,
                history=conv["messages"],
                context=full_context
            )
            reply_text = ai_result.get("message", "")
            followups = ai_result.get("suggested_followups", [])

        # 6. Save Assistant Response in Shared Memory
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": reply_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "modality": "voice",
                "provider": "MindCare AI Voice Companion",
                "persona": "calm, warm, reassuring"
            }
        }
        conv["messages"].append(assistant_msg)
        conv["updated_at"] = datetime.now(timezone.utc).isoformat()
        DatabaseManager.set("conversations", conv_id, conv)

        # 7. Text-to-Speech Synthesis
        tts_res = self.tts_provider.synthesize(reply_text)

        return {
            "transcription": speech_text,
            "reply_text": reply_text,
            "audio_base64": tts_res.get("audio_base64"),
            "conversation_id": conv_id,
            "safety_interception": False,
            "suggested_followups": followups,
            "voice_persona": tts_res.get("voice_persona"),
            "context_snapshot": {
                "active_mode": full_context.get("active_mode"),
                "latest_checkin": full_context.get("latest_checkin"),
                "wearable_state": full_context.get("wearable_state")
            }
        }


# Global singleton instance
voice_companion_engine = VoiceCompanionEngine()
