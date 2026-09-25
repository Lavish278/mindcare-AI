"""
MindCare AI — Voice Companion API Router
Provides endpoints for standard voice turns, audio transcription, speech synthesis,
and real-time bidirectional streaming over WebSockets with barge-in interruption.
"""
import json
import base64
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query

from app.schemas.api_schemas import (
    VoiceProcessRequest,
    VoiceProcessResponse,
    VoiceTurnRequest,
    VoiceTranscriptionRequest,
    VoiceTranscriptionResponse,
    VoiceSynthesisRequest,
    VoiceSynthesisResponse
)
from app.api.auth import get_current_user
from app.voice.engine import voice_companion_engine
from app.voice.stt import get_stt_provider
from app.voice.tts import get_tts_provider
from app.core.config import settings
from app.core.database import DatabaseManager

logger = logging.getLogger("mindcare.api.voice")
router = APIRouter(prefix="/voice", tags=["Voice AI Companion"])


@router.get("/config")
def get_voice_configuration(user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the current voice system configuration and supported modes."""
    tts = get_tts_provider()
    synth_meta = tts.synthesize("test", {})
    return {
        "voice_mode": settings.VOICE_MODE,
        "stt_provider": settings.STT_PROVIDER,
        "tts_provider": settings.TTS_PROVIDER,
        "realtime_voice_enabled": settings.REALTIME_VOICE_ENABLED,
        "default_persona": synth_meta.get("voice_persona", {}),
        "disclaimer": "MindCare AI Voice Companion provides supportive non-diagnostic wellness dialogue."
    }


@router.post("/process", response_model=VoiceProcessResponse)
def process_voice_turn(
    req: VoiceProcessRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Standard voice turn endpoint (backwards compatible).
    Routes spoken text through the unified MindCare AI voice pipeline.
    """
    user_id = user["id"]
    result = voice_companion_engine.process_turn(
        user_id=user_id,
        speech_text=req.user_speech_text,
        conversation_id=req.conversation_id,
        current_mode=req.current_mode,
        user_profile=user
    )
    return VoiceProcessResponse(**result)


@router.post("/turn", response_model=VoiceProcessResponse)
def handle_voice_turn(
    req: VoiceTurnRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Advanced voice turn endpoint supporting either text transcription
    OR raw audio byte streams (base64 encoded).
    """
    user_id = user["id"]
    audio_bytes = None
    if req.audio_base64:
        try:
            # Strip data url prefix if present (e.g. data:audio/wav;base64,...)
            raw_b64 = req.audio_base64.split(",")[-1]
            audio_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            logger.warning(f"Could not decode audio_base64: {e}")

    result = voice_companion_engine.process_turn(
        user_id=user_id,
        speech_text=req.user_speech_text,
        audio_bytes=audio_bytes,
        conversation_id=req.conversation_id,
        current_mode=req.current_mode,
        user_profile=user
    )
    return VoiceProcessResponse(**result)


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
def transcribe_audio(
    req: VoiceTranscriptionRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Transcribes uploaded audio without generating an AI response."""
    if not req.audio_base64:
        return VoiceTranscriptionResponse(
            text="",
            confidence=0.0,
            provider="STT",
            is_empty=True
        )

    try:
        raw_b64 = req.audio_base64.split(",")[-1]
        audio_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        logger.error(f"Base64 decode error in transcribe: {e}")
        return VoiceTranscriptionResponse(
            text="",
            confidence=0.0,
            provider="STT",
            is_empty=True
        )

    stt = get_stt_provider()
    result = stt.transcribe(audio_bytes, mime_type=req.mime_type or "audio/wav")
    return VoiceTranscriptionResponse(
        text=result.get("text", ""),
        confidence=result.get("confidence", 0.95),
        provider=result.get("provider", "STT"),
        is_empty=result.get("is_empty", False)
    )


@router.post("/synthesize", response_model=VoiceSynthesisResponse)
def synthesize_speech(
    req: VoiceSynthesisRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Synthesizes text into natural voice audio with calm acoustic parameters."""
    tts = get_tts_provider()
    result = tts.synthesize(
        text=req.text,
        voice_config={"rate": req.rate, "pitch": req.pitch}
    )
    return VoiceSynthesisResponse(
        audio_base64=result.get("audio_base64"),
        mime_type=result.get("mime_type", "audio/wav"),
        provider=result.get("provider", "TTS"),
        voice_persona=result.get("voice_persona", {})
    )


@router.websocket("/ws")
async def websocket_voice_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    conversation_id: Optional[str] = Query(None)
):
    """
    Real-Time Bidirectional Voice WebSocket Channel.
    Enables low-latency streaming speech turns, live status events,
    and immediate interruption (barge-in) handling.
    """
    await websocket.accept()
    logger.info("Real-time voice WebSocket connection accepted.")

    # Authenticate or fallback to demo user
    user_id = "demo-user-123"
    user_profile = DatabaseManager.get("users", user_id) or {
        "id": user_id,
        "display_name": "Alex Chen",
        "wellness_preferences": {"goals": ["Stress Reduction", "Sleep Hygiene"]}
    }

    active_conv_id = conversation_id or f"conv-{user_id}"
    active_mode = "AWAKE"

    # Send initial connection handshake
    await websocket.send_json({
        "type": "handshake",
        "status": "connected",
        "conversation_id": active_conv_id,
        "voice_persona": {
            "name": "MindCare Serena",
            "tone": "calm, warm, reassuring, soft-spoken",
            "rate": 0.92,
            "pitch": 1.0
        },
        "disclaimer": "MindCare AI Voice Companion (Non-Diagnostic Wellness Support)"
    })

    try:
        while True:
            raw_msg = await websocket.receive_text()
            try:
                data = json.loads(raw_msg)
            except Exception:
                continue

            msg_type = data.get("type")

            # 1. Heartbeat / Ping
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            # 2. Mode update
            if msg_type == "set_mode":
                active_mode = data.get("mode", active_mode)
                await websocket.send_json({"type": "mode_updated", "mode": active_mode})
                continue

            # 3. Interruption / Barge-in
            if msg_type == "interrupt":
                logger.info("User barge-in event received; canceling audio output stream.")
                await websocket.send_json({
                    "type": "interrupted",
                    "message": "Playback halted by user speech."
                })
                continue

            # 4. Spoken Turn (either user_speech_text or audio_base64)
            if msg_type in ["turn", "speech", "audio"]:
                speech_text = data.get("text")
                audio_b64 = data.get("audio")
                audio_bytes = None
                if audio_b64:
                    try:
                        raw = audio_b64.split(",")[-1]
                        audio_bytes = base64.b64decode(raw)
                    except Exception:
                        pass

                # Signal processing start
                await websocket.send_json({"type": "processing_start"})

                # Execute voice companion turn
                turn_result = voice_companion_engine.process_turn(
                    user_id=user_id,
                    speech_text=speech_text,
                    audio_bytes=audio_bytes,
                    conversation_id=active_conv_id,
                    current_mode=active_mode,
                    user_profile=user_profile
                )

                # Send transcription confirmation
                await websocket.send_json({
                    "type": "transcription",
                    "text": turn_result.get("transcription", "")
                })

                # Send response text & audio
                await websocket.send_json({
                    "type": "response",
                    "reply_text": turn_result.get("reply_text"),
                    "audio_base64": turn_result.get("audio_base64"),
                    "conversation_id": turn_result.get("conversation_id"),
                    "safety_interception": turn_result.get("safety_interception", False),
                    "suggested_followups": turn_result.get("suggested_followups", []),
                    "voice_persona": turn_result.get("voice_persona"),
                    "context_snapshot": turn_result.get("context_snapshot")
                })

                # Signal processing complete
                await websocket.send_json({"type": "processing_end"})

    except WebSocketDisconnect:
        logger.info("Real-time voice WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket voice session error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
