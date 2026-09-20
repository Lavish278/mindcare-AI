import random
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

from app.wearable.base import WearableProvider
from app.wearable.quality import DataQualityValidator


class MockWearableProvider(WearableProvider):
    """
    Realistic Mock Wearable Provider. Generates physiological timeseries with circadian rhythm,
    mode-appropriate biometric dynamics, and simulated workout sessions.
    Allows testing full Plan B without hardware or vendor credentials.
    """

    def __init__(self):
        # In-memory device state
        self._connected_users: Dict[str, Dict[str, Any]] = {}
        # Override for demo anomaly simulations
        self._simulation_scenarios: Dict[str, str] = {}
        # Live incoming readings ingested from real external smartwatches/sensors
        self._live_readings: Dict[str, Dict[str, Any]] = {}
        self._custom_timeseries: Dict[str, List[Dict[str, Any]]] = {}

    def ingest_reading(self, user_id: str, reading_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Ingests live telemetry from an external physical wearable, sensor, or mobile companion app."""
        now = datetime.now(timezone.utc)
        ts = reading_payload.get("timestamp") or now.isoformat()
        hr = reading_payload.get("heart_rate", 70)
        device_name = reading_payload.get("device_name", "Physical Smartwatch")
        
        # 1. Evaluate data quality
        raw_eval = {"heart_rate": hr, "timestamp": ts, "context_mode": reading_payload.get("context_mode", "AWAKE")}
        quality_status, quality_rationale = DataQualityValidator.evaluate_heart_rate(raw_eval)

        # 2. Context Mode determination
        context_mode = reading_payload.get("context_mode")
        from app.services.mode_service import ModeService
        if not context_mode:
            context_mode = ModeService.evaluate_automatic_mode(
                user_id=user_id,
                hr=hr,
                steps_recent=reading_payload.get("steps", 0) or 0,
                is_night=(now.hour >= 23 or now.hour <= 6)
            )
        else:
            ModeService.set_mode(user_id, context_mode, manual_override=True)

        stored = {
            "heart_rate": hr,
            "timestamp": ts,
            "context_mode": context_mode,
            "data_quality": quality_status,
            "quality_rationale": quality_rationale,
            "battery_level": reading_payload.get("battery_level", 90),
            "device_name": device_name,
            "source": reading_payload.get("source", "Live Hardware Ingestion")
        }

        self._live_readings[user_id] = stored
        self._connected_users[user_id] = {
            "device_id": reading_payload.get("device_id", f"LIVE-{user_id[:6].upper()}"),
            "device_name": device_name,
            "battery_level": reading_payload.get("battery_level", 90),
            "connected_at": now.isoformat(),
            "last_synced": ts,
            "status": "CONNECTED",
            "firmware_version": "Live Stream v1.0",
            "supported_metrics": ["heart_rate", "steps", "battery", "quality"]
        }

        if user_id not in self._custom_timeseries:
            self._custom_timeseries[user_id] = []

        try:
            t_obj = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            time_label = t_obj.strftime("%H:%M")
        except Exception:
            time_label = now.strftime("%H:%M")

        self._custom_timeseries[user_id].append({
            "timestamp": time_label,
            "heart_rate": hr,
            "context_mode": context_mode,
            "data_quality": quality_status
        })

        return stored

    def set_simulation_scenario(self, user_id: str, scenario: str):
        """Allows demo UI to test specific physiological contexts."""
        self._simulation_scenarios[user_id] = scenario
        # Reset live reading override when running simulated demo scenario
        if scenario != "default" and user_id in self._live_readings:
            del self._live_readings[user_id]

    def connect(self, user_id: str, auth_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        info = {
            "device_id": f"DEMO-BAND-{user_id[:6].upper()}",
            "device_name": "MindCare Biosensor Band Pro",
            "battery_level": 89,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "last_synced": datetime.now(timezone.utc).isoformat(),
            "status": "CONNECTED",
            "firmware_version": "v3.12.4-sim",
            "supported_metrics": ["heart_rate", "steps", "sleep", "active_minutes", "spo2_est"]
        }
        self._connected_users[user_id] = info
        return info

    def disconnect(self, user_id: str) -> bool:
        if user_id in self._connected_users:
            del self._connected_users[user_id]
            return True
        return False

    def get_connection_status(self, user_id: str) -> Dict[str, Any]:
        if user_id in self._connected_users:
            return self._connected_users[user_id]
        return {
            "status": "DISCONNECTED",
            "device_name": None,
            "last_synced": None,
            "supported_metrics": []
        }

    def get_latest_readings(self, user_id: str) -> Dict[str, Any]:
        # Priority 1: Live Hardware Ingested Reading if present
        if user_id in self._live_readings:
            return self._live_readings[user_id]

        now = datetime.now(timezone.utc)
        scenario = self._simulation_scenarios.get(user_id, "default")
        current_mode = "AWAKE"

        # Baseline HR calculation based on current hour and scenario
        hour = now.hour
        if 23 <= hour or hour <= 6:
            current_mode = "SLEEP"
            base_hr = 62 + random.randint(-4, 4)
        else:
            current_mode = "AWAKE"
            base_hr = 72 + random.randint(-5, 8)

        # Scenario adjustments for interactive demonstration
        if scenario == "sleep_high_hr":
            current_mode = "SLEEP"
            base_hr = 104  # Elevated HR during sleep (Unusual anomaly)
        elif scenario == "exercise_normal_spike":
            current_mode = "EXERCISE"
            base_hr = 148  # High HR during exercise (Appropriate, NOT anomaly)
        elif scenario == "awake_prolonged_tachycardia":
            current_mode = "AWAKE"
            base_hr = 118  # Elevated while resting awake
        elif scenario == "data_stale":
            # Simulate stale sensor
            reading_time = (now - timedelta(hours=3)).isoformat()
            reading = {
                "heart_rate": base_hr,
                "timestamp": reading_time,
                "context_mode": current_mode
            }
            status, reason = DataQualityValidator.evaluate_heart_rate(reading)
            return {
                "heart_rate": base_hr,
                "timestamp": reading_time,
                "context_mode": current_mode,
                "data_quality": status,
                "quality_rationale": reason,
                "battery_level": 74,
                "device_name": "MindCare Biosensor Band Pro"
            }

        reading = {
            "heart_rate": base_hr,
            "timestamp": now.isoformat(),
            "context_mode": current_mode
        }
        status, reason = DataQualityValidator.evaluate_heart_rate(reading)

        return {
            "heart_rate": base_hr,
            "timestamp": now.isoformat(),
            "context_mode": current_mode,
            "data_quality": status,
            "quality_rationale": reason,
            "battery_level": 87,
            "device_name": "MindCare Biosensor Band Pro"
        }

    def get_heart_rate_timeseries(self, user_id: str, hours: int = 24) -> List[Dict[str, Any]]:
        readings = []
        now = datetime.now(timezone.utc)
        scenario = self._simulation_scenarios.get(user_id, "default")

        for i in range(hours, 0, -1):
            t = now - timedelta(hours=i)
            hr_time = t.hour

            # Default circadian rhythm
            if 23 <= hr_time or hr_time <= 6:
                mode = "SLEEP"
                val = 60 + int(random.uniform(-4, 5))
                if scenario == "sleep_high_hr" and i < 6:
                    val = 102 + random.randint(-3, 6)
            elif 17 <= hr_time <= 18:
                mode = "EXERCISE"
                val = 142 + int(random.uniform(-8, 12))
            else:
                mode = "AWAKE"
                val = 71 + int(random.uniform(-6, 9))
                if scenario == "awake_prolonged_tachycardia" and i < 4:
                    val = 115 + random.randint(-4, 7)

            readings.append({
                "timestamp": t.strftime("%H:00"),
                "heart_rate": val,
                "context_mode": mode,
                "data_quality": "VALID"
            })

        # If live hardware readings have been received, append the recent points
        if user_id in self._custom_timeseries and self._custom_timeseries[user_id]:
            readings.extend(self._custom_timeseries[user_id][-10:])

        return readings

    def get_sleep_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        sleep_records = []
        today = datetime.now(timezone.utc).date()

        for d in range(days, 0, -1):
            rec_date = today - timedelta(days=d)
            # Semi-randomized realistic distribution
            total_duration = round(random.uniform(6.5, 8.4), 1)
            deep = round(total_duration * random.uniform(0.18, 0.24), 1)
            rem = round(total_duration * random.uniform(0.20, 0.26), 1)
            light = round(total_duration - deep - rem, 1)
            efficiency = random.randint(82, 94)
            resting_hr = random.randint(58, 65)

            sleep_records.append({
                "date": rec_date.strftime("%a %d"),
                "total_duration_hours": total_duration,
                "deep_sleep_hours": deep,
                "rem_sleep_hours": rem,
                "light_sleep_hours": light,
                "sleep_efficiency_percent": efficiency,
                "resting_sleep_hr": resting_hr,
                "data_quality": "VALID"
            })
        return sleep_records

    def get_activity_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        activity_records = []
        today = datetime.now(timezone.utc).date()

        for d in range(days, 0, -1):
            rec_date = today - timedelta(days=d)
            steps = random.randint(6400, 11800)
            active_min = int(steps / 110)
            cals = int(steps * 0.042) + 1400

            activity_records.append({
                "date": rec_date.strftime("%a %d"),
                "steps": steps,
                "active_minutes": active_min,
                "calories_burned": cals,
                "target_steps": 10000,
                "data_quality": "VALID"
            })
        return activity_records

    def get_exercise_sessions(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        return [
            {
                "id": "ex-1",
                "activity_type": "Outdoor Brisk Walk",
                "duration_minutes": 35,
                "steps": 3820,
                "calories_burned": 178,
                "avg_heart_rate": 118,
                "max_heart_rate": 134,
                "timestamp": (now - timedelta(hours=18)).strftime("%Y-%m-%d %H:%M")
            },
            {
                "id": "ex-2",
                "activity_type": "Evening Yoga & Mobility",
                "duration_minutes": 25,
                "steps": 420,
                "calories_burned": 95,
                "avg_heart_rate": 84,
                "max_heart_rate": 98,
                "timestamp": (now - timedelta(days=1, hours=2)).strftime("%Y-%m-%d %H:%M")
            },
            {
                "id": "ex-3",
                "activity_type": "Jogging Workout",
                "duration_minutes": 28,
                "steps": 4120,
                "calories_burned": 290,
                "avg_heart_rate": 146,
                "max_heart_rate": 168,
                "timestamp": (now - timedelta(days=2, hours=4)).strftime("%Y-%m-%d %H:%M")
            }
        ]


# Singleton instance of MockWearableProvider
mock_wearable_service = MockWearableProvider()

