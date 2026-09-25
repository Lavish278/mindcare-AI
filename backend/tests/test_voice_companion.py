"""
MindCare AI — Voice Companion & Multi-Modal Dialogue Test Suite
Tests:
- Speech-to-Text provider abstraction (valid, empty, failure)
- Text-to-Speech provider abstraction (synthesis, persona, fallback)
- ContextBuilder & ConversationManager (topic continuity, follow-ups, persona moderation)
- Shared conversation memory across Text Chat and Voice Chat
- Voice safety crisis interception
- Privacy (ephemeral audio, no raw audio stored in database)
- REST & WebSocket voice API endpoints
"""
import pytest
import base64
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import DatabaseManager
from app.voice.stt.mock_stt import MockSpeechToTextProvider
from app.voice.tts.local_fallback import LocalFallbackTTSProvider
from app.voice.tts.mock_tts import MockTextToSpeechProvider
from app.services.context_builder import ContextBuilder
from app.services.conversation_manager import ConversationManager
from app.voice.engine import voice_companion_engine

client = TestClient(app)


def test_stt_provider_valid_empty_and_error():
    stt = MockSpeechToTextProvider()

    # 1. Valid transcription
    valid_bytes = b"TEST_STT: I am feeling somewhat overwhelmed today."
    res_valid = stt.transcribe(valid_bytes)
    assert res_valid["is_empty"] is False
    assert "overwhelmed" in res_valid["text"]
    assert res_valid["confidence"] > 0.9

    # 2. Empty / silent audio
    empty_bytes = b""
    res_empty = stt.transcribe(empty_bytes)
    assert res_empty["is_empty"] is True
    assert res_empty["text"] == ""

    # 3. Simulated failure
    error_bytes = b"SIMULATE_STT_ERROR"
    with pytest.raises(RuntimeError):
        stt.transcribe(error_bytes)


def test_tts_provider_synthesis_and_persona():
    tts = MockTextToSpeechProvider()
    res = tts.synthesize("Take a slow, deep breath and let your shoulders drop.")

    assert res["audio_base64"] is not None
    assert res["mime_type"] == "audio/wav"
    assert "audio_bytes" in res
    assert len(res["audio_bytes"]) > 100

    persona = res["voice_persona"]
    assert persona["rate"] <= 1.0  # Calm, unhurried pacing
    assert "calm" in persona["tone"]


def test_conversation_manager_continuity_and_pacing():
    context = {
        "display_name": "Jordan",
        "active_mode": "AWAKE",
        "latest_checkin": {"mood_indicator": "6/10", "stress_indicator": "7/10"},
        "wearable_state": {"heart_rate": 78}
    }

    # Turn 1: User mentions interview
    turn1 = ConversationManager.generate_adaptive_voice_reply(
        current_text="I am stressed about my job interview tomorrow.",
        history=[],
        context=context
    )
    assert "Jordan" in turn1["message"] or "interview" in turn1["message"].lower()
    assert len(turn1["suggested_followups"]) > 0

    # Turn 2: User answers the previous question
    history = [
        {"role": "user", "content": "I am stressed about my job interview tomorrow."},
        {"role": "assistant", "content": turn1["message"]}
    ]
    turn2 = ConversationManager.generate_adaptive_voice_reply(
        current_text="I haven't had enough time to prepare.",
        history=history,
        context=context
    )
    # The assistant must build on the lack of preparation rather than repeating generic advice
    assert "prepar" in turn2["message"].lower() or "focus" in turn2["message"].lower()


def test_shared_memory_between_text_and_voice():
    user_id = "test-cross-modality-user"
    conv_id = f"conv-{user_id}"

    # Step 1: User sends a message via TEXT CHAT
    text_res = client.post("/api/v1/chat/message", json={
        "conversation_id": conv_id,
        "message": "I've been feeling tension in my neck after studying all morning.",
        "current_mode": "AWAKE"
    })
    assert text_res.status_code == 200

    # Verify message recorded in DB
    conv_db = DatabaseManager.get("conversations", conv_id)
    assert conv_db is not None
    assert len(conv_db["messages"]) == 2  # user + assistant

    # Step 2: User continues the SAME conversation via VOICE TURN
    voice_res = client.post("/api/v1/voice/turn", json={
        "conversation_id": conv_id,
        "user_speech_text": "I tried stretching for five minutes as you suggested.",
        "current_mode": "AWAKE"
    })
    assert voice_res.status_code == 200
    v_data = voice_res.json()
    assert v_data["conversation_id"] == conv_id
    assert v_data["safety_interception"] is False

    # Verify that BOTH modalities exist in the SAME shared conversation history
    conv_updated = DatabaseManager.get("conversations", conv_id)
    assert len(conv_updated["messages"]) == 4  # 2 text turns + 2 voice turns
    roles = [m["role"] for m in conv_updated["messages"]]
    modalities = [m.get("metadata", {}).get("modality") for m in conv_updated["messages"]]

    assert roles == ["user", "assistant", "user", "assistant"]
    assert "voice" in modalities

    # Privacy verification: verify NO raw audio bytes or blobs are persisted in DB
    for msg in conv_updated["messages"]:
        assert "audio_bytes" not in msg
        assert "audio_raw" not in msg


def test_voice_safety_crisis_interception():
    # When user speaks suicidal or self-harm statements in voice mode:
    # Must immediately trigger safety interception, return 988 lifeline, and not diagnose
    voice_res = client.post("/api/v1/voice/turn", json={
        "user_speech_text": "I can't take this anymore, I want to end my life right now.",
        "current_mode": "AWAKE"
    })
    assert voice_res.status_code == 200
    data = voice_res.json()

    assert data["safety_interception"] is True
    assert "988" in data["reply_text"] or "Lifeline" in str(data.get("resources_presented"))
    assert data["wellness_disclaimer"] is not None


def test_voice_config_and_synthesis_endpoints():
    # 1. Config endpoint
    cfg_res = client.get("/api/v1/voice/config")
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert "voice_mode" in cfg
    assert "default_persona" in cfg
    assert "disclaimer" in cfg

    # 2. Direct synthesis endpoint
    synth_res = client.post("/api/v1/voice/synthesize", json={
        "text": "Notice how your breath flows in and out smoothly.",
        "rate": 0.92,
        "pitch": 1.0
    })
    assert synth_res.status_code == 200
    s_data = synth_res.json()
    assert s_data["audio_base64"] is not None
    assert s_data["mime_type"] == "audio/wav"


def test_voice_websocket_handshake_and_interruption():
    with client.websocket_connect("/api/v1/voice/ws") as ws:
        # Handshake
        handshake = ws.receive_json()
        assert handshake["type"] == "handshake"
        assert handshake["status"] == "connected"
        assert "voice_persona" in handshake

        # Ping-Pong
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"

        # Interruption / Barge-in
        ws.send_json({"type": "interrupt"})
        interrupted = ws.receive_json()
        assert interrupted["type"] == "interrupted"

        # Spoken turn via WebSocket
        ws.send_json({
            "type": "turn",
            "text": "Can you give me a quick thought for the day?"
        })
        start_evt = ws.receive_json()
        assert start_evt["type"] == "processing_start"

        trans_evt = ws.receive_json()
        assert trans_evt["type"] == "transcription"

        resp_evt = ws.receive_json()
        assert resp_evt["type"] == "response"
        assert len(resp_evt["reply_text"]) > 10

        end_evt = ws.receive_json()
        assert end_evt["type"] == "processing_end"
