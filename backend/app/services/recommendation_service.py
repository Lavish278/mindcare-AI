from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.core.database import DatabaseManager


class RecommendationService:
    """
    Personalized wellness recommendation engine with adaptive feedback loops.
    Prioritizes interventions tailored to current stress, energy, contextual mode, and past feedback.
    """

    CATALOG = [
        {
            "id": "rec-box-breathing",
            "category": "breathing",
            "title": "4x4 Box Breathing",
            "description": "A regulated breathing cycle used by first responders to activate parasympathetic calm.",
            "duration_minutes": 3,
            "action_steps": [
                "Inhale slowly through your nose for 4 seconds.",
                "Gently hold your breath for 4 seconds.",
                "Exhale smoothly through your mouth for 4 seconds.",
                "Pause with empty lungs for 4 seconds. Repeat 4 cycles."
            ],
            "rationale": "Slow rhythmic respiration signals safety to the autonomic nervous system."
        },
        {
            "id": "rec-54321-grounding",
            "category": "relaxation",
            "title": "5-4-3-2-1 Sensory Grounding",
            "description": "An intentional sensory scan to step out of mental loops and anchor into physical space.",
            "duration_minutes": 4,
            "action_steps": [
                "Notice 5 things you can see around you.",
                "Notice 4 things you can physically touch.",
                "Listen for 3 distinct sounds in your environment.",
                "Notice 2 things you can smell.",
                "Identify 1 positive thing you appreciate about yourself right now."
            ],
            "rationale": "Redirects cognitive focus from rumination back to immediate sensory reality."
        },
        {
            "id": "rec-posture-release",
            "category": "light_activity",
            "title": "Desk Neck & Shoulder Release",
            "description": "Physical micro-movement to ease tension built up during screen work and study sessions.",
            "duration_minutes": 5,
            "action_steps": [
                "Roll your shoulders backwards 5 times in slow, wide circles.",
                "Gently tilt your right ear toward your right shoulder for 15 seconds. Switch sides.",
                "Interlace your fingers behind your back and open your chest.",
                "Shake your hands and arms loosely to release residual stiffness."
            ],
            "rationale": "Somatic movement increases circulation and relieves postural tension."
        },
        {
            "id": "rec-thought-download",
            "category": "journaling",
            "title": "Uncluttering Thought Download",
            "description": "A quick 5-minute free-write to clear cognitive overwhelm onto paper.",
            "duration_minutes": 5,
            "action_steps": [
                "Grab a blank notebook or document.",
                "Write down everything demanding your attention right now without editing.",
                "Circle just ONE item you will handle next.",
                "Tell yourself the remaining items are safely captured for later."
            ],
            "rationale": "Externalizing working memory reduces mental fatigue and anxiety."
        },
        {
            "id": "rec-digital-sunset",
            "category": "sleep_routine",
            "title": "Evening Digital Sunset",
            "description": "A gentle buffer between high-intensity screen stimulation and restorative sleep.",
            "duration_minutes": 15,
            "action_steps": [
                "Switch devices to 'Do Not Disturb' and dim bright lighting.",
                "Prepare tomorrow's clothes or bag to eliminate morning friction.",
                "Sip a cup of warm herbal tea or read 5 pages of a calming book.",
                "Practice 3 deep sighs before laying down."
            ],
            "rationale": "Reduces blue light exposure and eases the transition into slow-wave restorative sleep."
        },
        {
            "id": "rec-sunlight-walk",
            "category": "short_breaks",
            "title": "Natural Daylight Horizon Break",
            "description": "Step outside or to an open window to reset your circadian alertness.",
            "duration_minutes": 5,
            "action_steps": [
                "Step away from all backlit displays.",
                "Look into the distance across the horizon for 3-5 minutes.",
                "Take 5 intentional, expansive breaths in the open air."
            ],
            "rationale": "Distant viewing relaxes the ciliary muscles of the eyes while natural photons stimulate dopamine."
        }
    ]

    @classmethod
    def get_recommendations(
        cls,
        user_id: str,
        current_stress: int = 5,
        current_energy: int = 5,
        current_mode: str = "AWAKE"
    ) -> List[Dict[str, Any]]:
        # Fetch user's historical feedback to personalize
        past_feedback = DatabaseManager.query("feedback", filters={"user_id": user_id})

        # Score categories
        cat_scores = {
            "breathing": 1.0,
            "relaxation": 1.0,
            "mindfulness": 1.0,
            "journaling": 1.0,
            "short_breaks": 1.0,
            "light_activity": 1.0,
            "sleep_routine": 1.0
        }

        # Apply past feedback adjustments
        for fb in past_feedback:
            cat = fb.get("category", "")
            h = fb.get("helpful", "")
            if cat in cat_scores:
                if h == "YES":
                    cat_scores[cat] += 0.5
                elif h == "NO":
                    cat_scores[cat] -= 0.4

        # Adjust for current context
        if current_stress >= 7:
            cat_scores["breathing"] += 1.5
            cat_scores["relaxation"] += 1.2
            cat_scores["journaling"] += 1.0

        if current_energy <= 4:
            cat_scores["short_breaks"] += 1.2
            cat_scores["relaxation"] += 1.0

        if current_mode == "SLEEP":
            cat_scores["sleep_routine"] += 2.5
            cat_scores["breathing"] += 1.5

        # Sort catalog by category score
        scored_catalog = sorted(
            cls.CATALOG,
            key=lambda x: cat_scores.get(x["category"], 1.0),
            reverse=True
        )

        return scored_catalog[:4]

    @classmethod
    def submit_feedback(
        cls,
        user_id: str,
        recommendation_id: str,
        category: str,
        helpful: str,
        comment: str = ""
    ) -> Dict[str, Any]:
        fb_id = str(uuid.uuid4())
        record = {
            "id": fb_id,
            "user_id": user_id,
            "recommendation_id": recommendation_id,
            "category": category,
            "helpful": helpful,  # YES, SOMEWHAT, NO
            "comment": comment,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        DatabaseManager.set("feedback", fb_id, record)
        return record
