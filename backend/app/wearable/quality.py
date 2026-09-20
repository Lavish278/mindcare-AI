from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta
import math


class DataQualityValidator:
    """
    Validates physiological data streams before ingestion into the AI and anomaly detection layers.
    Classifies readings into: VALID, SUSPICIOUS, MISSING, or STALE.
    """

    @classmethod
    def evaluate_heart_rate(cls, reading: Dict[str, Any], recent_history: List[Dict[str, Any]] = None) -> Tuple[str, str]:
        """
        Validate single heart rate reading.
        Returns: (quality_status, rationale)
        """
        hr = reading.get("heart_rate")
        ts_str = reading.get("timestamp")

        # 1. Missing check
        if hr is None:
            return "MISSING", "Heart rate value is null or omitted."

        # 2. Invalid range check (physiological human limits)
        if not isinstance(hr, (int, float)) or hr < 30 or hr > 240:
            return "SUSPICIOUS", f"Heart rate value {hr} bpm is outside biologically viable boundaries (30-240 bpm)."

        # 3. Timestamp check
        if ts_str:
            try:
                # Parse timestamp
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)

                # Future timestamp check
                if ts > now + timedelta(minutes=5):
                    return "SUSPICIOUS", "Timestamp is in the future."

                # Stale check (>2 hours old)
                if now - ts > timedelta(hours=2):
                    return "STALE", f"Data timestamp is {int((now - ts).total_seconds() / 60)} minutes old."
            except Exception:
                return "SUSPICIOUS", "Malformed ISO timestamp format."

        # 4. Spike / Noise check against recent history
        if recent_history and len(recent_history) > 0:
            last_hr = recent_history[-1].get("heart_rate")
            if last_hr and abs(hr - last_hr) > 55 and reading.get("context_mode") != "EXERCISE":
                return "SUSPICIOUS", f"Sudden uncharacteristic shift of {abs(hr - last_hr)} bpm within consecutive readings."

        return "VALID", "Signal passes all physiological integrity checks."

    @classmethod
    def evaluate_sleep_record(cls, sleep_data: Dict[str, Any]) -> Tuple[str, str]:
        """Validate sleep metrics."""
        duration = sleep_data.get("total_duration_hours")
        if duration is None:
            return "MISSING", "Sleep duration is absent."

        if duration < 0.5 or duration > 20:
            return "SUSPICIOUS", f"Sleep duration of {duration}h is atypical or represents sensor artifact."

        deep = sleep_data.get("deep_sleep_hours", 0)
        rem = sleep_data.get("rem_sleep_hours", 0)
        light = sleep_data.get("light_sleep_hours", 0)

        if (deep + rem + light) > duration * 1.2:
            return "SUSPICIOUS", "Sum of sleep stages exceeds recorded sleep duration."

        return "VALID", "Sleep record conforms to physiological expectations."

    @classmethod
    def evaluate_activity_record(cls, activity_data: Dict[str, Any]) -> Tuple[str, str]:
        """Validate daily activity or workout session."""
        steps = activity_data.get("steps")
        if steps is None:
            return "MISSING", "Step count missing."

        if steps < 0 or steps > 100000:
            return "SUSPICIOUS", f"Step count {steps} exceeds plausible single-day movement limit."

        return "VALID", "Activity data is valid."

