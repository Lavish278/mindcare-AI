import pytest
from datetime import datetime, timezone, timedelta

from app.wearable.mock_provider import MockWearableProvider
from app.wearable.quality import DataQualityValidator
from app.services.mode_service import ModeService
from app.services.anomaly_service import ContextualAnomalyEngine
from app.services.reference_service import PersonalReferenceService


def test_mock_wearable_provider_generation():
    provider = MockWearableProvider()
    conn = provider.connect("test-user-1")
    assert conn["status"] == "CONNECTED"
    assert "MindCare" in conn["device_name"]

    readings = provider.get_latest_readings("test-user-1")
    assert 40 <= readings["heart_rate"] <= 200
    assert readings["data_quality"] in ["VALID", "SUSPICIOUS", "STALE"]

    timeseries = provider.get_heart_rate_timeseries("test-user-1", hours=12)
    assert len(timeseries) == 12

    sleep_data = provider.get_sleep_data("test-user-1", days=5)
    assert len(sleep_data) == 5
    for s in sleep_data:
        assert s["total_duration_hours"] > 0

    activity_data = provider.get_activity_data("test-user-1", days=7)
    assert len(activity_data) == 7


def test_data_quality_validator_rules():
    # 1. Valid HR reading
    valid_reading = {
        "heart_rate": 72,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "context_mode": "AWAKE"
    }
    status, _ = DataQualityValidator.evaluate_heart_rate(valid_reading)
    assert status == "VALID"

    # 2. Biologically impossible / outlier
    impossible_reading = {
        "heart_rate": 285,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    status, reason = DataQualityValidator.evaluate_heart_rate(impossible_reading)
    assert status == "SUSPICIOUS"
    assert "outside biologically viable" in reason

    # 3. Missing reading
    missing_reading = {"heart_rate": None}
    status, _ = DataQualityValidator.evaluate_heart_rate(missing_reading)
    assert status == "MISSING"

    # 4. Stale reading (>2 hours ago)
    stale_time = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    stale_reading = {"heart_rate": 70, "timestamp": stale_time}
    status, _ = DataQualityValidator.evaluate_heart_rate(stale_reading)
    assert status == "STALE"


def test_mode_transitions():
    ModeService.set_mode("test-mode-user", "EXERCISE", manual_override=True)
    m = ModeService.get_current_mode("test-mode-user")
    assert m["mode"] == "EXERCISE"
    assert m["manual_override"] is True

    ModeService.set_mode("test-mode-user", "SLEEP", manual_override=True)
    m2 = ModeService.get_current_mode("test-mode-user")
    assert m2["mode"] == "SLEEP"


def test_contextual_anomaly_evaluation():
    user_id = "test-anomaly-user"
    PersonalReferenceService.get_user_reference(user_id)

    # 1. EXERCISE MODE: Elevated HR (e.g. 145 bpm) MUST NOT be flagged as an anomaly
    ModeService.set_mode(user_id, "EXERCISE", manual_override=True)
    res_exercise = ContextualAnomalyEngine.evaluate_heart_rate(
        user_id=user_id,
        current_hr=145,
        data_quality="VALID"
    )
    assert res_exercise["state"] == "NORMAL"
    assert res_exercise["is_anomaly"] is False
    assert "exercise" in res_exercise["explanation"].lower() or "movement" in res_exercise["explanation"].lower()

    # 2. SLEEP MODE: Elevated HR (e.g. 102 bpm) MUST be flagged as UNUSUAL / ANOMALY
    ModeService.set_mode(user_id, "SLEEP", manual_override=True)
    res_sleep = ContextualAnomalyEngine.evaluate_heart_rate(
        user_id=user_id,
        current_hr=102,
        data_quality="VALID",
        duration_minutes=20
    )
    assert res_sleep["is_anomaly"] is True
    assert res_sleep["state"] in ["UNUSUAL", "SUSTAINED_ANOMALY"]
    assert "sleep" in res_sleep["explanation"].lower()

    # 3. Degraded signal (STALE / SUSPICIOUS): Engine must NOT trigger false alerts
    ModeService.set_mode(user_id, "AWAKE", manual_override=True)
    res_stale = ContextualAnomalyEngine.evaluate_heart_rate(
        user_id=user_id,
        current_hr=120,
        data_quality="STALE"
    )
    assert res_stale["is_anomaly"] is False
    assert res_stale["state"] == "NORMAL"
