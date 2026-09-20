from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.database import DatabaseManager


class AdaptiveQuestioningService:
    """
    Dynamically tailors check-in questionnaires using recent historical check-ins
    and wearable sleep/activity metrics so the user does not repeat the exact same questions.
    """

    MIDDAY_BASE_QUESTIONS = [
        {
            "id": "midday_mood",
            "category": "mood",
            "text": "How would you rate your emotional balance and mood so far today?",
            "type": "scale_1_10"
        },
        {
            "id": "midday_stress",
            "category": "stress",
            "text": "What level of academic or personal workload pressure are you noticing right now?",
            "type": "scale_1_10"
        },
        {
            "id": "midday_energy",
            "category": "energy",
            "text": "How is your physical and mental energy holding up as midday arrives?",
            "type": "scale_1_10"
        }
    ]

    EVENING_BASE_QUESTIONS = [
        {
            "id": "evening_overall_mood",
            "category": "mood",
            "text": "Looking back over your entire day, how was your overall emotional state?",
            "type": "scale_1_10"
        },
        {
            "id": "evening_stress_unwind",
            "category": "stress",
            "text": "How much tension or lingering worry is present as you prepare to wind down?",
            "type": "scale_1_10"
        },
        {
            "id": "evening_positive_reflection",
            "category": "reflection",
            "text": "What was one small positive experience, connection, or moment of gratitude today?",
            "type": "text"
        },
        {
            "id": "evening_tomorrow_outlook",
            "category": "outlook",
            "text": "How are you feeling about your responsibilities or schedule for tomorrow?",
            "type": "text"
        }
    ]

    @classmethod
    def get_checkin_questions(cls, user_id: str, checkin_type: str = "midday") -> List[Dict[str, Any]]:
        # Fetch previous check-in history
        recent_checkins = DatabaseManager.query(
            "check_ins",
            filters={"user_id": user_id},
            order_by="timestamp",
            descending=True,
            limit=3
        )

        base_qs = cls.MIDDAY_BASE_QUESTIONS.copy() if checkin_type == "midday" else cls.EVENING_BASE_QUESTIONS.copy()

        # Inject adaptive question based on past records
        if recent_checkins:
            last = recent_checkins[0]
            if last.get("stress_score", 0) >= 7:
                base_qs.append({
                    "id": "adaptive_high_stress_followup",
                    "category": "adaptive_coping",
                    "text": "In your previous check-in, you reported heightened stress. Did any of your coping strategies or pauses help soften that load?",
                    "type": "text"
                })
            elif last.get("energy_score", 0) <= 4:
                base_qs.append({
                    "id": "adaptive_low_energy_followup",
                    "category": "adaptive_vitality",
                    "text": "Your energy was running low earlier. Were you able to take a restorative rest or nourishing meal?",
                    "type": "text"
                })
            else:
                base_qs.append({
                    "id": "adaptive_social_support",
                    "category": "adaptive_social",
                    "text": "Did you connect with a supportive friend, colleague, or loved one today?",
                    "type": "text"
                })

        return base_qs

