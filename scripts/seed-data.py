"""
MindCare AI — Seed & Demonstration Data Generator
Populates rich baseline scenarios for thesis demonstration.
"""
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from datetime import datetime, timezone, timedelta
from app.core.database import DatabaseManager
from app.services.checkin_service import CheckInService
from app.services.reference_service import PersonalReferenceService
from app.services.recommendation_service import RecommendationService
from app.wearable.mock_provider import mock_wearable_service


def seed():
    print("🌱 Seeding MindCare AI Demonstration Data...")
    user_id = "demo-user-123"

    # 1. User
    DatabaseManager.set("users", user_id, {
        "id": user_id,
        "uid": user_id,
        "email": "alex.chen@university.demo",
        "display_name": "Alex Chen",
        "role": "user",
        "onboarding_completed": True,
        "wellness_preferences": {
            "goals": ["Stress Reduction", "Sleep Hygiene", "Academic Focus"],
            "notification_frequency": "twice_daily"
        },
        "privacy_consent": {
            "ai_conversation_data": True,
            "wellness_data": True,
            "wearable_data": True,
            "notifications_enabled": True,
            "analytics_participation": True
        },
        "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    })

    # 2. Historical Check-ins
    checkin_samples = [
        {"type": "midday", "mood": 7, "stress": 4, "energy": 6, "notes": "Solid morning study group session."},
        {"type": "evening", "mood": 8, "stress": 3, "energy": 7, "notes": "Evening walk helped unwind."},
        {"type": "midday", "mood": 6, "stress": 6, "energy": 5, "notes": "Midterm review took a lot of focus."},
        {"type": "evening", "mood": 7, "stress": 4, "energy": 6, "notes": "Had dinner with roommates."}
    ]
    for sample in checkin_samples:
        CheckInService.submit_checkin(
            user_id=user_id,
            check_in_type=sample["type"],
            mood_score=sample["mood"],
            stress_score=sample["stress"],
            energy_score=sample["energy"],
            notes=sample["notes"]
        )

    # 3. Personal Reference
    PersonalReferenceService.update_reference_with_data(
        user_id=user_id,
        days_observed=7,
        hr_samples=[68, 70, 72, 71, 69, 74, 70],
        sleep_hours=[7.4, 7.1, 6.8, 7.5, 7.3, 8.0, 7.2],
        stress_scores=[4, 5, 3, 4, 3, 4, 4],
        mood_scores=[7, 8, 7, 8, 8, 7, 8]
    )

    # 4. Recommendation feedback
    RecommendationService.submit_feedback(
        user_id=user_id,
        recommendation_id="rec-box-breathing",
        category="breathing",
        helpful="YES",
        comment="4x4 box breathing helped lower muscle tension before an exam."
    )

    # 5. Connect wearable
    mock_wearable_service.connect(user_id)

    print("✅ Seed data populated successfully for student Alex Chen.")


if __name__ == "__main__":
    seed()
