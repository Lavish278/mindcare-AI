from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
from app.schemas.api_schemas import SubmitCheckInRequest
from app.api.auth import get_current_user
from app.services.checkin_service import CheckInService
from app.services.adaptive_service import AdaptiveQuestioningService

router = APIRouter(prefix="/checkins", tags=["Psychosocial Check-ins"])


@router.get("/questions")
def get_adaptive_questions(
    check_in_type: str = Query("midday", pattern="^(midday|evening)$"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    questions = AdaptiveQuestioningService.get_checkin_questions(
        user_id=user["id"],
        checkin_type=check_in_type
    )
    return {"check_in_type": check_in_type, "questions": questions}


@router.post("/submit")
def submit_checkin(req: SubmitCheckInRequest, user: Dict[str, Any] = Depends(get_current_user)):
    result = CheckInService.submit_checkin(
        user_id=user["id"],
        check_in_type=req.check_in_type,
        mood_score=req.mood_score,
        stress_score=req.stress_score,
        energy_score=req.energy_score,
        notes=req.notes or "",
        qa_answers=req.qa_answers
    )
    return {"status": "success", "check_in": result}


@router.get("/history")
def get_history(limit: int = 14, user: Dict[str, Any] = Depends(get_current_user)):
    history = CheckInService.get_history(user["id"], limit=limit)
    return history


@router.get("/indicators")
def get_wellness_indicators(user: Dict[str, Any] = Depends(get_current_user)):
    history = CheckInService.get_history(user["id"], limit=1)
    if history:
        latest = history[0]
        return {
            "mood_wellness_indicator": f"{latest.get('mood_score', 7)}/10",
            "stress_wellness_indicator": f"{latest.get('stress_score', 4)}/10",
            "energy_indicator": f"{latest.get('energy_score', 6)}/10",
            "last_checkin_type": latest.get("check_in_type", "midday"),
            "timestamp": latest.get("timestamp"),
            "disclaimer": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
        }
    return {
        "mood_wellness_indicator": "7/10",
        "stress_wellness_indicator": "4/10",
        "energy_indicator": "6/10",
        "last_checkin_type": "baseline",
        "timestamp": None,
        "disclaimer": "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES"
    }
