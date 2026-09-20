from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.analytics.research import ResearchAnalyticsEngine
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Research & Admin Dashboard"])


@router.get("/metrics")
def get_research_metrics(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns aggregate, de-identified project metrics for university evaluation
    and research governance.
    """
    return ResearchAnalyticsEngine.get_aggregated_metrics()

