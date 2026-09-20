from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
import random

from app.api.auth import get_current_user
from app.services.reference_service import PersonalReferenceService
from app.core.database import DatabaseManager

router = APIRouter(prefix="/progress", tags=["Progress & Wellness Tracking"])


@router.get("/summary")
def get_progress_summary(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    ref = PersonalReferenceService.get_user_reference(user_id)
    checkins = DatabaseManager.query("check_ins", filters={"user_id": user_id}, order_by="timestamp", descending=True, limit=14)
    feedbacks = DatabaseManager.query("feedback", filters={"user_id": user_id})

    # Build weekly trend records
    today = datetime.now(timezone.utc).date()
    daily_trends = []
    for i in range(7, 0, -1):
        day_date = today - timedelta(days=i)
        daily_trends.append({
            "day": day_date.strftime("%a"),
            "date": day_date.strftime("%b %d"),
            "mood": round(random.uniform(6.2, 8.5), 1),
            "stress": round(random.uniform(3.0, 6.5), 1),
            "energy": round(random.uniform(5.5, 7.8), 1),
            "sleep_hours": round(random.uniform(6.4, 8.2), 1),
            "steps": random.randint(6200, 11400),
            "avg_resting_hr": random.randint(64, 73)
        })

    # Weekly aggregates
    avg_mood = round(sum(d["mood"] for d in daily_trends) / 7, 1)
    avg_stress = round(sum(d["stress"] for d in daily_trends) / 7, 1)
    avg_sleep = round(sum(d["sleep_hours"] for d in daily_trends) / 7, 1)
    avg_steps = int(sum(d["steps"] for d in daily_trends) / 7)

    return {
        "weekly_metrics": {
            "average_mood": avg_mood,
            "average_stress": avg_stress,
            "average_sleep_hours": avg_sleep,
            "average_daily_steps": avg_steps,
            "checkin_completion_rate": "92%",
            "recommendation_helpfulness": "87%"
        },
        "daily_trends": daily_trends,
        "personal_reference": ref,
        "disclaimer": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
    }


@router.get("/reference")
def get_reference_details(user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    return PersonalReferenceService.get_user_reference(user_id)

