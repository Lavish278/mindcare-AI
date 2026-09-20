import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_firebase, DatabaseManager
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.voice import router as voice_router
from app.api.checkins import router as checkins_router
from app.api.wearables import router as wearables_router
from app.api.recommendations import router as recommendations_router
from app.api.progress import router as progress_router
from app.api.admin import router as admin_router
from app.models.entities import AppVersionInfo

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mindcare.main")


def seed_initial_demo_data():
    """Seeds rich demo data if store is empty for frictionless evaluation."""
    users = DatabaseManager.query("users")
    if not users:
        logger.info("Seeding demo user and initial check-ins...")
        # 1. Demo User
        DatabaseManager.set("users", "demo-user-123", {
            "id": "demo-user-123",
            "uid": "demo-user-123",
            "email": "student@mindcare.demo",
            "display_name": "Alex Chen",
            "role": "user",
            "onboarding_completed": True,
            "wellness_preferences": {
                "goals": ["Stress Reduction", "Sleep Quality", "Academic Focus"],
                "notification_frequency": "twice_daily"
            },
            "privacy_consent": {
                "ai_conversation_data": True,
                "wellness_data": True,
                "wearable_data": True,
                "notifications_enabled": True,
                "analytics_participation": True
            }
        })

        # 2. Initial Personal Reference
        from app.services.reference_service import PersonalReferenceService
        PersonalReferenceService.get_user_reference("demo-user-123")

        # 3. App Version record
        DatabaseManager.set("app_versions", "v1.0.0", AppVersionInfo().model_dump())


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MindCare AI backend services...")
    init_firebase()
    seed_initial_demo_data()
    yield
    logger.info("Shutting down MindCare AI backend services.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-ready backend for MindCare AI — Smart Mental Wellness Companion. "
        "Integrates Plan A (AI Companion, Psychosocial Check-ins) and Plan B (Wearable Biosensors, Mode Engine, Anomaly Detection)."
    ),
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
prefix = settings.API_PREFIX
app.include_router(auth_router, prefix=prefix)
app.include_router(chat_router, prefix=prefix)
app.include_router(voice_router, prefix=prefix)
app.include_router(checkins_router, prefix=prefix)
app.include_router(wearables_router, prefix=prefix)
app.include_router(recommendations_router, prefix=prefix)
app.include_router(progress_router, prefix=prefix)
app.include_router(admin_router, prefix=prefix)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "wearable_provider": settings.WEARABLE_PROVIDER,
        "database_firestore": DatabaseManager.is_firestore_active(),
        "disclaimer": "MindCare AI provides non-diagnostic wellness insights."
    }

