import re
from typing import Dict, Any, Tuple, Optional
from app.safety.resources import EMERGENCY_RESOURCES, NON_DIAGNOSTIC_DISCLAIMER

# Regex patterns for crisis detection
CRISIS_PATTERNS = [
    r"\b(suicide|kill\s+myself|end(ing)?\s+(my\s+life|it\s+all)|want\s+to\s+die|hang\s+myself|shoot\s+myself)\b",
    r"\b(cut\s+myself|self\s*harm|slit\s+my\s+wrists|overdose|take\s+all\s+my\s+pills)\b",
    r"\b(better\s+off\s+dead|no\s+reason\s+to\s+live|goodbye\s+cruel\s+world|no\s+point\s+in\s+living)\b",
    r"\b(can'?t\s+take\s+this\s+anymore\s+wanna\s+die|ending\s+it\s+all\s+tonight)\b"
]

MEDICAL_EMERGENCY_PATTERNS = [
    r"\b(severe\s+chest\s+pain|crushing\s+chest|cannot\s+breathe\s+at\s+all|stroke\s+symptoms)\b",
    r"\b(overdosed|swallowed\s+poison|severe\s+allergic\s+reaction|anaphylaxis)\b"
]


class SafetyDetector:
    """
    Dedicated safety module. Evaluates incoming text for acute psychiatric crisis
    or immediate physical emergencies before conversational AI processing.
    """

    @classmethod
    def evaluate(cls, user_text: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        if not user_text or not user_text.strip():
            return False, None

        normalized = user_text.lower().strip()

        # 1. Check for acute self-harm / suicide intent
        for pattern in CRISIS_PATTERNS:
            if re.search(pattern, normalized, re.IGNORECASE):
                return True, {
                    "risk_level": "CRITICAL",
                    "category": "crisis_self_harm",
                    "title": "Immediate Support Available",
                    "message": (
                        "I hear how much pain you are experiencing right now, and I want you to be safe. "
                        "Because MindCare AI is an automated wellness companion and cannot provide crisis counseling or medical emergency assistance, "
                        "please connect immediately with someone who can help support you through this."
                    ),
                    "resources": [
                        EMERGENCY_RESOURCES["us_canada_crisis_lifeline"],
                        EMERGENCY_RESOURCES["crisis_text_line"],
                        EMERGENCY_RESOURCES["international_helpline"]
                    ],
                    "disclaimer": NON_DIAGNOSTIC_DISCLAIMER
                }

        # 2. Check for physical medical emergency
        for pattern in MEDICAL_EMERGENCY_PATTERNS:
            if re.search(pattern, normalized, re.IGNORECASE):
                return True, {
                    "risk_level": "CRITICAL",
                    "category": "physical_medical_emergency",
                    "title": "Medical Emergency Assistance Required",
                    "message": (
                        "This sounds like a potential medical emergency. MindCare AI cannot evaluate medical emergencies or diagnose conditions. "
                        "Please seek immediate medical attention or contact emergency medical services right away."
                    ),
                    "resources": [
                        EMERGENCY_RESOURCES["emergency_services"]
                    ],
                    "disclaimer": NON_DIAGNOSTIC_DISCLAIMER
                }

        return False, None
