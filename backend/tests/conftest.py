import pytest
import os
from app.core.database import db_local


@pytest.fixture(autouse=True)
def clean_test_environment():
    """Clear test data from the local store before each test."""
    db_local.data = {
        "users": {},
        "conversations": {},
        "check_ins": {},
        "wearable_readings": {},
        "activity_sessions": {},
        "sleep_records": {},
        "personal_reference": {},
        "recommendations": {},
        "feedback": {},
        "safety_events": {},
        "app_versions": {},
    }
    yield
    # Cleanup afterwards if needed

