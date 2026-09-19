from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.schemas.api_schemas import RegisterRequest, LoginRequest, AuthResponse, OnboardingRequest, PrivacySettingsUpdateRequest
from app.core.security import create_access_token, decode_access_token
from app.core.database import DatabaseManager
from app.models.entities import UserProfile, PrivacyConsent

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency to extract user from Authorization Bearer token with demo fallback."""
    if not authorization or not authorization.startswith("Bearer "):
        # Return default demo user so all features are interactive immediately
        demo_user = DatabaseManager.get("users", "demo-user-123")
        if not demo_user:
            demo_profile = {
                "id": "demo-user-123",
                "uid": "demo-user-123",
                "email": "student@mindcare.demo",
                "display_name": "Alex Chen",
                "role": "user",
                "onboarding_completed": True,
                "wellness_preferences": {"stress_management": True, "sleep_hygiene": True},
                "privacy_consent": {
                    "ai_conversation_data": True,
                    "wellness_data": True,
                    "wearable_data": True,
                    "notifications_enabled": True,
                    "analytics_participation": True
                },
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            DatabaseManager.set("users", "demo-user-123", demo_profile)
            return demo_profile
        return demo_user

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    uid = payload.get("sub")
    user = DatabaseManager.get("users", uid)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return user


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    # Check if user already exists
    existing = DatabaseManager.query("users", filters={"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    uid = str(uuid.uuid4())
    user_data = {
        "id": uid,
        "uid": uid,
        "email": req.email,
        "display_name": req.display_name,
        "role": "user",
        "onboarding_completed": False,
        "wellness_preferences": {},
        "privacy_consent": {
            "ai_conversation_data": True,
            "wellness_data": True,
            "wearable_data": True,
            "notifications_enabled": True,
            "analytics_participation": True
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    DatabaseManager.set("users", uid, user_data)
    token = create_access_token({"sub": uid, "email": req.email})
    return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    users = DatabaseManager.query("users", filters={"email": req.email})
    if not users:
        # Auto-create or login for smooth demonstration
        uid = str(uuid.uuid4())
        user_data = {
            "id": uid,
            "uid": uid,
            "email": req.email,
            "display_name": req.email.split("@")[0].capitalize(),
            "role": "user",
            "onboarding_completed": True,
            "wellness_preferences": {"focus": "stress_reduction"},
            "privacy_consent": {
                "ai_conversation_data": True,
                "wellness_data": True,
                "wearable_data": True,
                "notifications_enabled": True,
                "analytics_participation": True
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        DatabaseManager.set("users", uid, user_data)
    else:
        user_data = users[0]

    token = create_access_token({"sub": user_data["id"], "email": user_data["email"]})
    return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return user


@router.post("/onboarding")
def complete_onboarding(req: OnboardingRequest, user: Dict[str, Any] = Depends(get_current_user)):
    uid = user["id"]
    updates = {
        "display_name": req.display_name,
        "onboarding_completed": True,
        "wellness_preferences": {
            "goals": req.wellness_goals,
            "notification_frequency": req.notification_frequency
        },
        "privacy_consent": {
            "ai_conversation_data": req.ai_data_consent,
            "wellness_data": True,
            "wearable_data": req.wearable_data_consent,
            "notifications_enabled": req.notification_frequency != "none",
            "analytics_participation": True
        }
    }
    updated = DatabaseManager.update("users", uid, updates)
    return {"status": "success", "user": updated}


@router.put("/privacy")
def update_privacy_settings(req: PrivacySettingsUpdateRequest, user: Dict[str, Any] = Depends(get_current_user)):
    uid = user["id"]
    current_consent = user.get("privacy_consent", {})
    updates = {
        "ai_conversation_data": req.ai_conversation_data if req.ai_conversation_data is not None else current_consent.get("ai_conversation_data", True),
        "wellness_data": req.wellness_data if req.wellness_data is not None else current_consent.get("wellness_data", True),
        "wearable_data": req.wearable_data if req.wearable_data is not None else current_consent.get("wearable_data", True),
        "notifications_enabled": req.notifications_enabled if req.notifications_enabled is not None else current_consent.get("notifications_enabled", True),
        "analytics_participation": req.analytics_participation if req.analytics_participation is not None else current_consent.get("analytics_participation", True),
    }
    updated = DatabaseManager.update("users", uid, {"privacy_consent": updates})
    return {"status": "success", "privacy_consent": updates}
