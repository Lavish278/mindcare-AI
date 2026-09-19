from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class AIProvider(ABC):
    """Abstract interface for Conversational AI & Mental Wellness LLM services."""

    @abstractmethod
    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None,
        current_mode: str = "AWAKE"
    ) -> Dict[str, Any]:
        """Generate conversational response with contextual wellness suggestions."""
        pass

    @abstractmethod
    def generate_wellness_insights(
        self,
        checkin_history: List[Dict[str, Any]],
        wearable_summary: Dict[str, Any],
        personal_reference: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Synthesize non-diagnostic wellness insights correlating habits and subjective state."""
        pass

    @abstractmethod
    def generate_adaptive_questions(
        self,
        recent_checkins: List[Dict[str, Any]],
        recent_sleep: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Generate dynamic check-in follow-up questions grounded in user history."""
        pass
