from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class WearableProvider(ABC):
    """Abstract interface for wearable device providers (smartwatches, rings, bands)."""

    @abstractmethod
    def connect(self, user_id: str, auth_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Establish connection with device/vendor cloud."""
        pass

    @abstractmethod
    def disconnect(self, user_id: str) -> bool:
        """Disconnect and revoke active token."""
        pass

    @abstractmethod
    def get_connection_status(self, user_id: str) -> Dict[str, Any]:
        """Query connection status, battery, last sync timestamp."""
        pass

    @abstractmethod
    def get_latest_readings(self, user_id: str) -> Dict[str, Any]:
        """Fetch real-time snapshot of current physiological readings."""
        pass

    @abstractmethod
    def get_heart_rate_timeseries(self, user_id: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Fetch heart rate readings over the given window."""
        pass

    @abstractmethod
    def get_sleep_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch sleep duration, stages, and quality."""
        pass

    @abstractmethod
    def get_activity_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch step counts, active minutes, and estimated energy expenditure."""
        pass

    @abstractmethod
    def get_exercise_sessions(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch recent workouts or exercise bouts."""
        pass

