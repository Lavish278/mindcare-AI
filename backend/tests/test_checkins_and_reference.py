import pytest
from app.services.checkin_service import CheckInService
from app.services.adaptive_service import AdaptiveQuestioningService
from app.services.reference_service import PersonalReferenceService
from app.services.recommendation_service import RecommendationService


def test_checkin_submission_and_indicators():
    user_id = "test-checkin-user"
    res = CheckInService.submit_checkin(
        user_id=user_id,
        check_in_type="midday",
        mood_score=8,
        stress_score=3,
        energy_score=7,
        notes="Had a productive morning group session."
    )
    assert res["id"] is not None
    assert res["mood_score"] == 8
    assert res["wellness_indicators"]["mood_wellness_indicator"] == "8/10"
    assert "WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES" in res["wellness_indicators"]["label"]

    history = CheckInService.get_history(user_id)
    assert len(history) >= 1
    assert history[0]["mood_score"] == 8


def test_personal_reference_progression():
    user_id = "test-ref-user"
    ref_initial = PersonalReferenceService.get_user_reference(user_id)
    assert ref_initial["stability_tier"] == "initial"
    assert "NOT a medical baseline" in ref_initial["disclaimer"]

    # Update after 5 days of data
    ref_improved = PersonalReferenceService.update_reference_with_data(
        user_id=user_id,
        days_observed=5,
        hr_samples=[66, 68, 70, 72, 69],
        sleep_hours=[7.0, 7.5, 6.8, 7.2, 7.4],
        stress_scores=[4, 5, 3, 4, 3],
        mood_scores=[7, 8, 7, 8, 8]
    )
    assert ref_improved["stability_tier"] == "improved"
    assert ref_improved["confidence_score"] == 0.80

    # Update after 21 days
    ref_stable = PersonalReferenceService.update_reference_with_data(
        user_id=user_id,
        days_observed=21,
        hr_samples=[70] * 21,
        sleep_hours=[7.2] * 21,
        stress_scores=[4] * 21,
        mood_scores=[7] * 21
    )
    assert ref_stable["stability_tier"] == "stable"
    assert ref_stable["confidence_score"] == 0.92


def test_adaptive_questioning_tailoring():
    user_id = "test-adaptive-user"
    # First submit high stress checkin
    CheckInService.submit_checkin(
        user_id=user_id,
        check_in_type="midday",
        mood_score=4,
        stress_score=9,
        energy_score=3,
        notes="Extremely overwhelmed with project presentation"
    )

    questions = AdaptiveQuestioningService.get_checkin_questions(user_id=user_id, checkin_type="evening")
    # Verify adaptive question was added
    has_adaptive = any("stress" in q["text"].lower() or "coping" in q.get("category", "") for q in questions)
    assert has_adaptive is True


def test_recommendation_and_feedback_loop():
    user_id = "test-rec-user"
    recs = RecommendationService.get_recommendations(user_id=user_id, current_stress=9, current_energy=4)
    assert len(recs) > 0
    # Breathing and relaxation should be prioritized under high stress
    top_categories = [r["category"] for r in recs[:2]]
    assert "breathing" in top_categories or "relaxation" in top_categories

    # Submit feedback
    target_rec = recs[0]
    fb = RecommendationService.submit_feedback(
        user_id=user_id,
        recommendation_id=target_rec["id"],
        category=target_rec["category"],
        helpful="YES",
        comment="Box breathing noticeably lowered my muscle tension."
    )
    assert fb["helpful"] == "YES"
    assert fb["user_id"] == user_id
