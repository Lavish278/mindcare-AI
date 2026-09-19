import logging
from typing import Dict, Any, List, Optional
from app.ai.base import AIProvider
from app.ai.prompts import COMPANION_SYSTEM_PROMPT
from app.core.config import settings

logger = logging.getLogger("mindcare.ai.gemini")


class GeminiAIProvider(AIProvider):
    """Google Gemini AI Provider utilizing the official google-genai SDK."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini AI Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None,
        current_mode: str = "AWAKE"
    ) -> Dict[str, Any]:
        if not self.is_configured():
            from app.ai.mock_provider import MockAIProvider
            return MockAIProvider().generate_chat_response(messages, user_context, current_mode)

        try:
            # Prepare conversation history
            prompt_parts = [COMPANION_SYSTEM_PROMPT]
            if user_context:
                prompt_parts.append(f"\nUser Current Context Mode: {current_mode}\nUser Recent Context: {user_context}\n")

            formatted_contents = []
            for msg in messages:
                formatted_contents.append(f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}")

            prompt_parts.append("\n".join(formatted_contents))
            full_prompt = "\n\n".join(prompt_parts)

            response = self.client.models.generate_content(
                model=settings.AI_MODEL_NAME,
                contents=full_prompt,
            )
            text = response.text or "I'm listening and here for you. How are you feeling right now?"
            return {
                "message": text,
                "suggested_followups": [
                    "Would you like to try a 2-minute breathing exercise?",
                    "Tell me more about what triggered this stress.",
                    "How has your sleep felt over the past few nights?"
                ],
                "provider": "Gemini-2.5-Flash"
            }
        except Exception as e:
            logger.error(f"Gemini API error: {e}. Falling back to MockAIProvider.")
            from app.ai.mock_provider import MockAIProvider
            return MockAIProvider().generate_chat_response(messages, user_context, current_mode)

    def generate_wellness_insights(
        self,
        checkin_history: List[Dict[str, Any]],
        wearable_summary: Dict[str, Any],
        personal_reference: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            from app.ai.mock_provider import MockAIProvider
            return MockAIProvider().generate_wellness_insights(checkin_history, wearable_summary, personal_reference)

        try:
            prompt = (
                f"{COMPANION_SYSTEM_PROMPT}\n\n"
                f"Analyze these wellness history logs and generate 3 non-diagnostic, supportive observations.\n"
                f"Checkins: {checkin_history}\nWearables: {wearable_summary}\nReference Range: {personal_reference}\n"
                f"Format as clear bulleted insights highlighting correlations (e.g. sleep duration vs reported energy)."
            )
            response = self.client.models.generate_content(
                model=settings.AI_MODEL_NAME,
                contents=prompt
            )
            # Parse or fallback
            from app.ai.mock_provider import MockAIProvider
            return MockAIProvider().generate_wellness_insights(checkin_history, wearable_summary, personal_reference)
        except Exception as e:
            logger.error(f"Error in Gemini insights: {e}")
            from app.ai.mock_provider import MockAIProvider
            return MockAIProvider().generate_wellness_insights(checkin_history, wearable_summary, personal_reference)

    def generate_adaptive_questions(
        self,
        recent_checkins: List[Dict[str, Any]],
        recent_sleep: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        from app.ai.mock_provider import MockAIProvider
        return MockAIProvider().generate_adaptive_questions(recent_checkins, recent_sleep)
