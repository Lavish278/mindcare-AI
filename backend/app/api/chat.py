from fastapi import APIRouter, Depends
from typing import Dict, Any, List
import uuid
from datetime import datetime, timezone

from app.schemas.api_schemas import ChatRequest, ChatResponse
from app.api.auth import get_current_user
from app.safety.detector import SafetyDetector
from app.core.database import DatabaseManager
from app.core.config import settings
from app.services.mode_service import ModeService
from app.ai.gemini_provider import GeminiAIProvider
from app.ai.mock_provider import MockAIProvider

router = APIRouter(prefix="/chat", tags=["AI Wellness Companion"])

# Instantiate AI provider
ai_provider = GeminiAIProvider() if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY else MockAIProvider()


@router.post("/message", response_model=ChatResponse)
def send_chat_message(req: ChatRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    conv_id = req.conversation_id or str(uuid.uuid4())
    user_mode = req.current_mode or ModeService.get_current_mode(user_id)["mode"]

    # 1. CRITICAL SAFETY EVALUATION
    is_crisis, safety_payload = SafetyDetector.evaluate(req.message)
    if is_crisis and safety_payload:
        # Halt normal conversation flow, record safety event
        event_id = str(uuid.uuid4())
        safety_event = {
            "id": event_id,
            "user_id": user_id,
            "risk_level": safety_payload.get("risk_level", "CRITICAL"),
            "trigger_category": safety_payload.get("category", "crisis_statement"),
            "user_message_sample": req.message[:150],
            "action_taken": "SURFACED_CRISIS_HOTLINES",
            "resources_presented": [r.get("name") for r in safety_payload.get("resources", [])],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        DatabaseManager.set("safety_events", event_id, safety_event)

        return ChatResponse(
            conversation_id=conv_id,
            message=safety_payload["message"],
            suggested_followups=["Call 988 Lifeline", "Text HOME to 741741", "Reach out to a friend or doctor"],
            safety_interception=True,
            safety_details=safety_payload,
            wellness_disclaimer=safety_payload["disclaimer"]
        )

    # 2. Retrieve existing conversation history
    conv = DatabaseManager.get("conversations", conv_id)
    if not conv:
        conv = {
            "id": conv_id,
            "user_id": user_id,
            "title": "Wellness Chat",
            "messages": [],
            "context_mode": user_mode,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    # Append user message
    conv["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": req.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {"mode": user_mode}
    })

    # 3. Generate contextual AI response
    user_context = {
        "display_name": user.get("display_name", "Friend"),
        "wellness_goals": user.get("wellness_preferences", {}).get("goals", []),
        "mode": user_mode
    }
    ai_result = ai_provider.generate_chat_response(
        messages=conv["messages"],
        user_context=user_context,
        current_mode=user_mode
    )

    assistant_msg = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": ai_result["message"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {"provider": ai_result.get("provider", "MindCare AI")}
    }
    conv["messages"].append(assistant_msg)
    DatabaseManager.set("conversations", conv_id, conv)

    return ChatResponse(
        conversation_id=conv_id,
        message=ai_result["message"],
        suggested_followups=ai_result.get("suggested_followups", []),
        safety_interception=False
    )


@router.get("/history")
def get_conversations(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    return DatabaseManager.query(
        "conversations",
        filters={"user_id": user_id},
        order_by="updated_at",
        descending=True,
        limit=10
    )


@router.delete("/history/{conversation_id}")
def delete_conversation(conversation_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    conv = DatabaseManager.get("conversations", conversation_id)
    if conv and conv.get("user_id") == user_id:
        DatabaseManager.delete("conversations", conversation_id)
        return {"status": "deleted"}
    return {"status": "not_found"}

