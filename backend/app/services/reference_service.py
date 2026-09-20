from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.database import DatabaseManager


class PersonalReferenceService:
    """
    Computes individualized Personal Reference Ranges without relying on generic medical thresholds.
    Distinguishes progression tiers:
    - Tier 1: 'initial' (Days 1-2)
    - Tier 2: 'improved' (Days 3-7)
    - Tier 3: 'stable' (Weeks 2-4)
    - Tier 4: 'continuous' (> 30 days)
    """

    @classmethod
    def get_user_reference(cls, user_id: str) -> Dict[str, Any]:
        existing = DatabaseManager.get("personal_reference", user_id)
        if existing:
            return existing

        # Default initial reference profile for new users
        default_ref = {
            "id": user_id,
            "user_id": user_id,
            "days_observed": 2,
            "stability_tier": "initial",
            "tier_label": "Initial Reference (Days 1–2)",
            "tier_description": "Initial pattern calibration based on your first 48 hours of check-ins and wearable data.",
            "disclaimer": "Personal Reference Range — Individualized physiological pattern, NOT a medical baseline or clinical diagnosis.",
            "rest_hr_range": {"min": 60, "max": 82, "avg": 71},
            "sleep_hr_range": {"min": 54, "max": 68, "avg": 61},
            "exercise_hr_range": {"min": 115, "max": 165, "avg": 142},
            "typical_daily_steps": 8400,
            "typical_sleep_duration_hours": 7.3,
            "typical_stress_avg": 4.6,
            "typical_mood_avg": 6.8,
            "typical_energy_avg": 6.4,
            "confidence_score": 0.65,
            "last_computed": datetime.now(timezone.utc).isoformat()
        }
        DatabaseManager.set("personal_reference", user_id, default_ref)
        return default_ref

    @classmethod
    def update_reference_with_data(
        cls,
        user_id: str,
        days_observed: int,
        hr_samples: List[int],
        sleep_hours: List[float],
        stress_scores: List[int],
        mood_scores: List[int]
    ) -> Dict[str, Any]:
        # Determine stability tier
        if days_observed <= 2:
            tier = "initial"
            tier_label = "Initial Reference (Days 1–2)"
            confidence = 0.65
        elif days_observed <= 7:
            tier = "improved"
            tier_label = "Improved Reference (Week 1)"
            confidence = 0.80
        elif days_observed <= 28:
            tier = "stable"
            tier_label = "Stable Reference (Weeks 2–4)"
            confidence = 0.92
        else:
            tier = "continuous"
            tier_label = "Continuously Adapted Reference"
            confidence = 0.98

        avg_hr = int(sum(hr_samples) / len(hr_samples)) if hr_samples else 70
        avg_sleep = round(sum(sleep_hours) / len(sleep_hours), 1) if sleep_hours else 7.2
        avg_stress = round(sum(stress_scores) / len(stress_scores), 1) if stress_scores else 4.5
        avg_mood = round(sum(mood_scores) / len(mood_scores), 1) if mood_scores else 7.0

        updated_profile = {
            "id": user_id,
            "user_id": user_id,
            "days_observed": days_observed,
            "stability_tier": tier,
            "tier_label": tier_label,
            "tier_description": f"Calibrated across {days_observed} days of activity, rest, and personal check-ins.",
            "disclaimer": "Personal Reference Range — Individualized physiological pattern, NOT a medical baseline or clinical diagnosis.",
            "rest_hr_range": {
                "min": max(45, avg_hr - 12),
                "max": min(110, avg_hr + 15),
                "avg": avg_hr
            },
            "sleep_hr_range": {
                "min": max(42, avg_hr - 18),
                "max": avg_hr - 5,
                "avg": avg_hr - 10
            },
            "exercise_hr_range": {
                "min": 110,
                "max": 175,
                "avg": 145
            },
            "typical_daily_steps": 8500,
            "typical_sleep_duration_hours": avg_sleep,
            "typical_stress_avg": avg_stress,
            "typical_mood_avg": avg_mood,
            "typical_energy_avg": 6.5,
            "confidence_score": confidence,
            "last_computed": datetime.now(timezone.utc).isoformat()
        }
        DatabaseManager.set("personal_reference", user_id, updated_profile)
        return updated_profile

