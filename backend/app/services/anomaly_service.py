from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.services.reference_service import PersonalReferenceService
from app.services.mode_service import ModeService


class ContextualAnomalyEngine:
    """
    Context-aware physiological evaluation engine.
    Assesses biometric readings against personal reference bounds, active contextual mode,
    recent physical activity, and data quality integrity.
    """

    @classmethod
    def evaluate_heart_rate(
        cls,
        user_id: str,
        current_hr: int,
        data_quality: str = "VALID",
        duration_minutes: int = 5,
        recent_stress_score: Optional[int] = None
    ) -> Dict[str, Any]:
        ref = PersonalReferenceService.get_user_reference(user_id)
        mode_info = ModeService.get_current_mode(user_id)
        current_mode = mode_info.get("mode", "AWAKE")

        # 1. Quality Gate: Ignore poor quality data
        if data_quality in ["SUSPICIOUS", "MISSING", "STALE"]:
            return {
                "state": "NORMAL",
                "is_anomaly": False,
                "current_mode": current_mode,
                "data_quality": data_quality,
                "explanation": f"Data marked as {data_quality}. No anomaly determination made from degraded signals.",
                "recommendation": "Adjust wearable band placement on your wrist to restore signal quality."
            }

        # 2. Contextual Evaluation based on Mode
        if current_mode == "EXERCISE":
            # During exercise, heart rates up to 185 bpm are normal physiological responses
            if current_hr <= settings.HR_EXERCISE_MAX_NORMAL:
                return {
                    "state": "NORMAL",
                    "is_anomaly": False,
                    "current_mode": "EXERCISE",
                    "data_quality": data_quality,
                    "explanation": (
                        f"Current heart rate of {current_hr} bpm is fully expected for active physical movement. "
                        "Exercise naturally elevates cardiac output."
                    ),
                    "recommendation": "Maintain adequate hydration and take short recovery rests as needed."
                }
            else:
                return {
                    "state": "UNUSUAL",
                    "is_anomaly": True,
                    "current_mode": "EXERCISE",
                    "data_quality": data_quality,
                    "explanation": (
                        f"Current heart rate of {current_hr} bpm is near the peak threshold for vigorous exertion. "
                        "Consider easing your workout pace."
                    ),
                    "recommendation": "Slow down your cadence, drink water, and transition into a gentle walking cooldown."
                }

        elif current_mode == "SLEEP":
            sleep_ref_max = ref["sleep_hr_range"]["max"]
            if current_hr > settings.HR_SLEEP_HIGH_THRESHOLD or current_hr > sleep_ref_max + 18:
                state = "SUSTAINED_ANOMALY" if duration_minutes >= 15 else "UNUSUAL"
                return {
                    "state": state,
                    "is_anomaly": True,
                    "current_mode": "SLEEP",
                    "data_quality": data_quality,
                    "explanation": (
                        f"Your heart rate is {current_hr} bpm during Sleep Mode, which is noticeably higher than your "
                        f"personal sleep reference range ({ref['sleep_hr_range']['min']}–{ref['sleep_hr_range']['max']} bpm). "
                        "Late meals, evening caffeine, thermal discomfort, or restless dreams can elevate nocturnal heart rates."
                    ),
                    "recommendation": (
                        "Non-diagnostic observation: Check room temperature, ensure airflow, "
                        "and consider a few slow diaphragmatic breaths if awake."
                    )
                }
            else:
                return {
                    "state": "NORMAL",
                    "is_anomaly": False,
                    "current_mode": "SLEEP",
                    "data_quality": data_quality,
                    "explanation": f"Heart rate of {current_hr} bpm is within your expected nocturnal restorative range.",
                    "recommendation": "Rest peacefully."
                }

        else:  # AWAKE MODE
            rest_max = ref["rest_hr_range"]["max"]
            rest_min = ref["rest_hr_range"]["min"]

            if current_hr > rest_max + 20 or current_hr > settings.HR_REST_HIGH_THRESHOLD:
                state = "SUSTAINED_ANOMALY" if duration_minutes >= 20 else "UNUSUAL"
                stress_note = ""
                if recent_stress_score and recent_stress_score >= 7:
                    stress_note = f" (Your recent check-in reported elevated stress at {recent_stress_score}/10)."

                return {
                    "state": state,
                    "is_anomaly": True,
                    "current_mode": "AWAKE",
                    "data_quality": data_quality,
                    "explanation": (
                        f"Your resting heart rate of {current_hr} bpm is elevated relative to your personal reference "
                        f"({rest_min}–{rest_max} bpm){stress_note}. Acute work pressure, coffee consumption, or fatigue often produce temporary spikes."
                    ),
                    "recommendation": (
                        "Take a short 3-minute break from your current task. "
                        "Try our guided Box Breathing exercise to stimulate your parasympathetic recovery."
                    )
                }
            elif current_hr < rest_min - 14 and current_hr < settings.HR_REST_LOW_THRESHOLD:
                return {
                    "state": "UNUSUAL",
                    "is_anomaly": True,
                    "current_mode": "AWAKE",
                    "data_quality": data_quality,
                    "explanation": f"Resting heart rate of {current_hr} bpm is lower than your personal baseline range.",
                    "recommendation": "Ensure you are warm and gently stretch or walk around."
                }
            else:
                return {
                    "state": "NORMAL",
                    "is_anomaly": False,
                    "current_mode": "AWAKE",
                    "data_quality": data_quality,
                    "explanation": f"Current heart rate of {current_hr} bpm sits comfortably inside your personal reference pattern ({rest_min}–{rest_max} bpm).",
                    "recommendation": "You are in a balanced resting state."
                }
