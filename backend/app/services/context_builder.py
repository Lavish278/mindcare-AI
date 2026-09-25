"""
MindCare AI — Unified Context Builder
Synthesizes relevant multi-modal user context (conversation history, recent check-ins,
wellness indicators, wearable biosensors, personal reference range, and recommendation feedback)
into a structured, non-diagnostic prompt context without overloading token budgets.
"""
from typing import Dict, Any, List, Optional
from app.core.database import DatabaseManager
from app.services.mode_service import ModeService
from app.services.reference_service import PersonalReferenceService


class ContextBuilder:
    """
    Selects and packages relevant user context for both Text and Voice AI companions.
    Ensures identical intelligence and context-awareness across all conversation modalities.
    """

    @classmethod
    def build_context(
        cls,
        user_id: str,
        user_profile: Optional[Dict[str, Any]] = None,
        current_mode: Optional[str] = None,
        max_history_turns: int = 6
    ) -> Dict[str, Any]:
        """
        Gathers high-value context signals:
        1. User profile and wellness goals
        2. Active Context Mode (AWAKE, SLEEP, EXERCISE)
        3. Latest Psychosocial Check-in (Mood, Stress, Energy)
        4. Wearable Biosensors (Heart Rate, Signal Quality, Steps)
        5. Personal Reference Range (not a generic medical threshold)
        6. Recent Recommendation Feedback
        """
        # 1. Profile & Goals
        profile = user_profile or DatabaseManager.get("users", user_id) or {}
        display_name = profile.get("display_name", "Friend")
        wellness_goals = profile.get("wellness_preferences", {}).get("goals", [
            "Stress Management",
            "Sleep Hygiene",
            "Mindful Focus"
        ])

        # 2. Context Mode
        if not current_mode:
            current_mode = ModeService.get_current_mode(user_id).get("mode", "AWAKE")

        # 3. Recent Check-in
        recent_checkins = DatabaseManager.query(
            "check_ins",
            filters={"user_id": user_id},
            order_by="timestamp",
            descending=True,
            limit=1
        )
        latest_checkin = recent_checkins[0] if recent_checkins else None
        checkin_summary = None
        if latest_checkin:
            checkin_summary = {
                "check_in_type": latest_checkin.get("check_in_type"),
                "mood_indicator": f"{latest_checkin.get('mood_score')}/10",
                "stress_indicator": f"{latest_checkin.get('stress_score')}/10",
                "energy_indicator": f"{latest_checkin.get('energy_score')}/10",
                "notes": latest_checkin.get("notes", "")
            }

        # 4. Wearable Biometrics
        latest_readings = DatabaseManager.query(
            "wearable_readings",
            filters={"user_id": user_id},
            order_by="timestamp",
            descending=True,
            limit=1
        )
        wearable_summary = None
        if latest_readings:
            r = latest_readings[0]
            wearable_summary = {
                "heart_rate": r.get("heart_rate"),
                "data_quality": r.get("data_quality", "VALID"),
                "device_name": r.get("device_name", "Wearable Biosensor"),
                "context_mode": r.get("context_mode", current_mode)
            }

        # 5. Personal Reference Range
        ref_profile = PersonalReferenceService.get_user_reference(user_id)
        ref_summary = {
            "tier_label": ref_profile.get("tier_label", "Initial Reference"),
            "typical_rest_hr": f"{ref_profile.get('rest_hr_range', {}).get('min', 60)}-{ref_profile.get('rest_hr_range', {}).get('max', 82)} bpm",
            "typical_stress_avg": ref_profile.get("typical_stress_avg", 4.6),
            "typical_sleep_duration": f"{ref_profile.get('typical_sleep_duration_hours', 7.3)} hrs",
            "disclaimer": "Personal Reference Range (Non-Diagnostic)"
        }

        # 6. Recommendation Feedback
        recent_feedback = DatabaseManager.query(
            "recommendation_feedback",
            filters={"user_id": user_id},
            order_by="timestamp",
            descending=True,
            limit=3
        )
        feedback_summary = [
            {"category": f.get("category"), "helpful": f.get("helpful")}
            for f in recent_feedback
        ]

        return {
            "user_id": user_id,
            "display_name": display_name,
            "wellness_goals": wellness_goals,
            "active_mode": current_mode,
            "latest_checkin": checkin_summary,
            "wearable_state": wearable_summary,
            "personal_reference": ref_summary,
            "recent_feedback": feedback_summary
        }

    @classmethod
    def format_prompt_context(cls, context_dict: Dict[str, Any]) -> str:
        """
        Converts the context dictionary into a concise, natural prompt block for the LLM.
        """
        lines = [
            f"USER CONTEXT SNAPSHOT (Confidential wellness indicators for personalization):",
            f"- User Name: {context_dict.get('display_name', 'Friend')}",
            f"- Active Physiological Context Mode: {context_dict.get('active_mode', 'AWAKE')}",
            f"- Primary Wellness Goals: {', '.join(context_dict.get('wellness_goals', []))}",
        ]

        checkin = context_dict.get("latest_checkin")
        if checkin:
            lines.append(
                f"- Recent Psychosocial Check-in: Mood {checkin.get('mood_indicator')}, "
                f"Stress {checkin.get('stress_indicator')}, Energy {checkin.get('energy_indicator')}. "
                f"Notes: '{checkin.get('notes', 'None')}'"
            )

        wearable = context_dict.get("wearable_state")
        if wearable:
            lines.append(
                f"- Current Biosensor Telemetry: HR {wearable.get('heart_rate')} bpm "
                f"(Quality: {wearable.get('data_quality')}, Mode: {wearable.get('context_mode')})"
            )

        ref = context_dict.get("personal_reference")
        if ref:
            lines.append(
                f"- Personal Baseline Calibration: {ref.get('tier_label')} "
                f"(Resting HR range: {ref.get('typical_rest_hr')}, Typical sleep: {ref.get('typical_sleep_duration')})"
            )

        feedback = context_dict.get("recent_feedback")
        if feedback:
            favs = [f"{f.get('category')} ({f.get('helpful')})" for f in feedback]
            lines.append(f"- Past Micro-Action Feedback: {', '.join(favs)}")

        return "\n".join(lines)
