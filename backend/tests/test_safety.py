import pytest
from app.safety.detector import SafetyDetector


def test_crisis_detection_flags_suicidal_ideation():
    test_phrases = [
        "I want to kill myself",
        "I feel like ending my life tonight",
        "There's no point in living anymore",
        "I might cut myself"
    ]
    for phrase in test_phrases:
        is_crisis, payload = SafetyDetector.evaluate(phrase)
        assert is_crisis is True, f"Failed to detect crisis in: '{phrase}'"
        assert payload["risk_level"] == "CRITICAL"
        assert payload["category"] == "crisis_self_harm"
        assert len(payload["resources"]) >= 2
        assert "988" in str(payload["resources"])


def test_medical_emergency_detection():
    test_phrases = [
        "I have severe chest pain and cannot breathe at all",
        "I overdosed on pills help"
    ]
    for phrase in test_phrases:
        is_crisis, payload = SafetyDetector.evaluate(phrase)
        assert is_crisis is True, f"Failed to detect medical emergency in: '{phrase}'"
        assert payload["risk_level"] == "CRITICAL"
        assert payload["category"] == "physical_medical_emergency"


def test_normal_wellness_statements_are_not_flagged():
    normal_phrases = [
        "I am feeling very tired after studying for finals",
        "My stress level is high today because of my thesis deadline",
        "Can you recommend a quick breathing exercise?",
        "I went for a brisk 30 minute walk and my heart rate was 140",
        "I feel sad that my project didn't go well today"
    ]
    for phrase in normal_phrases:
        is_crisis, payload = SafetyDetector.evaluate(phrase)
        assert is_crisis is False, f"False positive crisis on normal phrase: '{phrase}'"
        assert payload is None

