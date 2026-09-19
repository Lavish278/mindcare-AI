from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List
from app.schemas.api_schemas import RecommendationFeedbackRequest
from app.api.auth import get_current_user
from app.services.recommendation_service import RecommendationService
from app.services.mode_service import ModeService

router = APIRouter(prefix="/recommendations", tags=["Wellness Recommendations"])


@router.get("")
def list_recommendations(
    stress: int = Query(5, ge=1, le=10),
    energy: int = Query(5, ge=1, le=10),
    user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = user["id"]
    current_mode = ModeService.get_current_mode(user_id)["mode"]
    recs = RecommendationService.get_recommendations(
        user_id=user_id,
        current_stress=stress,
        current_energy=energy,
        current_mode=current_mode
    )
    return {"recommendations": recs, "active_mode": current_mode}


@router.post("/feedback")
def submit_feedback(req: RecommendationFeedbackRequest, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    saved = RecommendationService.submit_feedback(
        user_id=user_id,
        recommendation_id=req.recommendation_id,
        category=req.category,
        helpful=req.helpful,
        comment=req.comment or ""
    )
    return {"status": "success", "feedback": saved}
