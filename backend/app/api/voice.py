from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.schemas.api_schemas import VoiceProcessRequest, VoiceProcessResponse
from app.api.auth import get_current_user
from app.safety.detector import SafetyDetector
from app.ai.mock_provider import MockAIProvider
from app.services.mode_service import ModeService

router = APIRouter(prefix="/voice", tags=["Voice AI Companion"])


@router.post("/process", response_model=VoiceProcessResponse)
def process_voice_turn(req: VoiceProcessRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    speech_text = req.user_speech_text
    current_mode = req.current_mode or ModeService.get_current_mode(user_id)["mode"]

    # 1. Safety verification
    is_crisis, safety_payload = SafetyDetector.evaluate(speech_text)
    if is_crisis and safety_payload:
        return VoiceProcessResponse(
            reply_text=safety_payload["message"],
            safety_interception=True,
            resources_presented=[r.get("name") for r in safety_payload.get("resources", [])]
        )

    # 2. Generate conversational reply
    mock_ai = MockAIProvider()
    response = mock_ai.generate_chat_response(
        messages=[{"role": "user", "content": speech_text}],
        user_context={"display_name": user.get("display_name", "Friend")},
        current_mode=current_mode
    )

    return VoiceProcessResponse(
        reply_text=response["message"],
        safety_interception=False
    )
