from typing import Dict, Any
from datetime import datetime, timezone

# In-memory mode state mapping user_id -> mode details
_user_modes: Dict[str, Dict[str, Any]] = {}


class ModeService:
    """
    Context Engine managing user physiological modes:
    - AWAKE: Resting or standard daily non-exercise activities.
    - SLEEP: Sleep interval; nocturnal baselines and recovery metrics applied.
    - EXERCISE: Intentional physical activity; elevated heart rates are expected and NOT flagged as anomalies.
    """

    VALID_MODES = ["AWAKE", "SLEEP", "EXERCISE"]

    @classmethod
    def get_current_mode(cls, user_id: str) -> Dict[str, Any]:
        if user_id not in _user_modes:
            _user_modes[user_id] = {
                "mode": "AWAKE",
                "manual_override": False,
                "detected_via": "default_initialization",
                "last_changed": datetime.now(timezone.utc).isoformat()
            }
        return _user_modes[user_id]

    @classmethod
    def set_mode(cls, user_id: str, new_mode: str, manual_override: bool = True) -> Dict[str, Any]:
        upper_mode = new_mode.upper()
        if upper_mode not in cls.VALID_MODES:
            upper_mode = "AWAKE"

        _user_modes[user_id] = {
            "mode": upper_mode,
            "manual_override": manual_override,
            "detected_via": "user_manual_override" if manual_override else "activity_detection",
            "last_changed": datetime.now(timezone.utc).isoformat()
        }
        return _user_modes[user_id]

    @classmethod
    def evaluate_automatic_mode(cls, user_id: str, hr: int, steps_recent: int, is_night: bool) -> str:
        """
        Determines physiological mode from sensor signals if manual override is inactive.
        """
        state = cls.get_current_mode(user_id)
        if state.get("manual_override", False):
            return state["mode"]

        if steps_recent > 80 or hr > 125:
            new_mode = "EXERCISE"
        elif is_night and hr < 75 and steps_recent < 5:
            new_mode = "SLEEP"
        else:
            new_mode = "AWAKE"

        cls.set_mode(user_id, new_mode, manual_override=False)
        return new_mode
