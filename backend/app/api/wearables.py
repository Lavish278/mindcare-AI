from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
from datetime import datetime, timezone

from app.schemas.api_schemas import ConnectWearableRequest, ModeChangeRequest, SimulateAnomalyRequest
from app.api.auth import get_current_user
from app.wearable.mock_provider import mock_wearable_service
from app.services.mode_service import ModeService
from app.services.anomaly_service import ContextualAnomalyEngine
from app.core.database import DatabaseManager

router = APIRouter(prefix="/wearables", tags=["Wearable Device & Biometrics"])


@router.get("/status")
def get_device_status(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    status = mock_wearable_service.get_connection_status(user_id)
    # Default auto-connect demo device if new user
    if status.get("status") == "DISCONNECTED":
        status = mock_wearable_service.connect(user_id)
    return status


@router.post("/connect")
def connect_device(req: ConnectWearableRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    connected = mock_wearable_service.connect(user_id)
    return {"status": "success", "device": connected}


@router.post("/disconnect")
def disconnect_device(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    mock_wearable_service.disconnect(user_id)
    return {"status": "disconnected"}


@router.get("/mode")
def get_current_mode(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    return ModeService.get_current_mode(user_id)


@router.post("/mode")
def set_mode(req: ModeChangeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    result = ModeService.set_mode(user_id, req.mode, manual_override=req.manual_override)
    return result


@router.post("/sync")
def sync_data(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    readings = mock_wearable_service.get_latest_readings(user_id)
    # Record reading in database
    doc_id = f"reading-{int(datetime.now(timezone.utc).timestamp())}"
    DatabaseManager.set("wearable_readings", doc_id, {
        "id": doc_id,
        "user_id": user_id,
        **readings
    })
    return {
        "status": "synchronized",
        "synced_readings_count": 1,
        "current_heart_rate": readings["heart_rate"],
        "context_mode": readings["context_mode"],
        "data_quality": readings["data_quality"],
        "last_synced": datetime.now(timezone.utc).isoformat()
    }


@router.get("/readings")
def get_latest_readings(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    readings = mock_wearable_service.get_latest_readings(user_id)

    # Evaluate contextual anomaly
    anomaly_eval = ContextualAnomalyEngine.evaluate_heart_rate(
        user_id=user_id,
        current_hr=readings["heart_rate"],
        data_quality=readings.get("data_quality", "VALID"),
        duration_minutes=10
    )

    return {
        **readings,
        "anomaly_evaluation": anomaly_eval
    }


@router.get("/timeseries")
def get_timeseries(hours: int = 24, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    return mock_wearable_service.get_heart_rate_timeseries(user_id, hours=hours)


@router.get("/sleep")
def get_sleep(days: int = 7, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    return mock_wearable_service.get_sleep_data(user_id, days=days)


@router.get("/activity")
def get_activity(days: int = 7, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    activities = mock_wearable_service.get_activity_data(user_id, days=days)
    sessions = mock_wearable_service.get_exercise_sessions(user_id)
    return {"daily_activity": activities, "exercise_sessions": sessions}


@router.post("/simulate-anomaly")
def simulate_anomaly(req: SimulateAnomalyRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    mock_wearable_service.set_simulation_scenario(user_id, req.anomaly_scenario)

    # Sync mode to match scenario
    if req.anomaly_scenario == "sleep_high_hr":
        ModeService.set_mode(user_id, "SLEEP", manual_override=True)
    elif req.anomaly_scenario == "exercise_normal_spike":
        ModeService.set_mode(user_id, "EXERCISE", manual_override=True)
    elif req.anomaly_scenario == "awake_prolonged_tachycardia":
        ModeService.set_mode(user_id, "AWAKE", manual_override=True)

    readings = mock_wearable_service.get_latest_readings(user_id)
    eval_result = ContextualAnomalyEngine.evaluate_heart_rate(
        user_id=user_id,
        current_hr=readings["heart_rate"],
        data_quality=readings["data_quality"]
    )

    return {
        "scenario_activated": req.anomaly_scenario,
        "readings": readings,
        "anomaly_evaluation": eval_result
    }
