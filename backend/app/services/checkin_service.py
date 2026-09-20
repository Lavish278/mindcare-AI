from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid
from app.core.database import DatabaseManager
from app.models.entities import CheckIn, CheckInAnswer
from app.services.reference_service import PersonalReferenceService


class CheckInService:
    """
    Handles psychosocial check-ins and non-diagnostic wellness indicators.
    Computes scores on 1-10 scales with clear non-diagnostic disclaimers.
    """

    @classmethod
    def submit_checkin(
        cls,
        user_id: str,
        check_in_type: str,
        mood_score: int,
        stress_score: int,
        energy_score: int,
        notes: str = "",
        qa_answers: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        checkin_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate contextual non-diagnostic summary
        summary = (
            f"{check_in_type.capitalize()} Check-in: Mood evaluated at {mood_score}/10, "
            f"Stress at {stress_score}/10, Energy at {energy_score}/10. "
        )
        if stress_score >= 8:
            summary += "Noticeable stress reported; recovery activities recommended."
        elif mood_score >= 7 and stress_score <= 4:
            summary += "Reflects a calm, grounded personal state."

        record = {
            "id": checkin_id,
            "user_id": user_id,
            "check_in_type": check_in_type,
            "mood_score": max(1, min(10, mood_score)),
            "stress_score": max(1, min(10, stress_score)),
            "energy_score": max(1, min(10, energy_score)),
            "notes": notes,
            "qa_answers": qa_answers or [],
            "wellness_indicators": {
                "mood_wellness_indicator": f"{mood_score}/10",
                "stress_wellness_indicator": f"{stress_score}/10",
                "energy_indicator": f"{energy_score}/10",
                "label": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
            },
            "summary": summary,
            "timestamp": now_iso
        }

        # Store in Firestore / Local Store
        DatabaseManager.set("check_ins", checkin_id, record)

        # Incrementally update personal reference range if applicable
        all_user_checkins = DatabaseManager.query("check_ins", filters={"user_id": user_id})
        days_count = max(2, len(all_user_checkins))
        moods = [c.get("mood_score", 7) for c in all_user_checkins]
        stresses = [c.get("stress_score", 4) for c in all_user_checkins]

        PersonalReferenceService.update_reference_with_data(
            user_id=user_id,
            days_observed=days_count,
            hr_samples=[68, 72, 70, 75],
            sleep_hours=[7.2, 6.8, 7.5],
            stress_scores=stresses,
            mood_scores=moods
        )

        return record

    @classmethod
    def get_history(cls, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        return DatabaseManager.query(
            "check_ins",
            filters={"user_id": user_id},
            order_by="timestamp",
            descending=True,
            limit=limit
        )

