import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.ai.base import AIProvider


class MockAIProvider(AIProvider):
    """
    Intelligent Mock AI Companion Provider for offline and demonstration environments.
    Incorporates contextual awareness (modes, recent biometric rhythms, user emotional check-ins)
    and strictly maintains non-diagnostic, supportive communication.
    """

    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None,
        current_mode: str = "AWAKE"
    ) -> Dict[str, Any]:
        user_text = messages[-1].get("content", "").strip() if messages else ""
        lower = user_text.lower()

        # Contextual framing
        mode_context_hint = ""
        if current_mode == "EXERCISE":
            mode_context_hint = " I notice your band is in Exercise Mode with your heart rate naturally elevated from movement."
        elif current_mode == "SLEEP":
            mode_context_hint = " I see you are currently in Sleep Mode. Remember that winding down with minimal screens can help restore your energy."

        # Response templates matching common wellness themes
        if any(w in lower for w in ["stress", "overwhelm", "deadline", "exam", "pressure", "anxious"]):
            reply = (
                f"It sounds like you're carrying a heavy cognitive load right now.{mode_context_hint} "
                "Feeling stretched during demanding periods is very common, but your mind and body need small restorative pockets. "
                "When deadlines cluster, breaking your day into single 25-minute focus intervals followed by 5 minutes of deliberate breathing "
                "can help down-regulate that intense pressure.\n\n"
                "Would you like to step through a gentle 2-minute paced breathing exercise together, or talk through what's on your priority list?"
            )
            followups = [
                "Guide me through a 2-minute breathing exercise",
                "I have too many assignments due this week",
                "What can I do to stop overthinking?"
            ]

        elif any(w in lower for w in ["sleep", "tired", "exhausted", "insomnia", "drowsy", "can't sleep"]):
            reply = (
                "Fatigue deeply affects our mental resilience and emotional bandwidth. "
                "When your sleep is interrupted or shortened, your body's sympathetic nervous system often works overtime to keep you functioning.\n\n"
                "A non-judgmental approach is to focus on resting your physical body even if sleep takes a while to arrive. "
                "Dimming harsh overhead lights 45 minutes before bed and jotting down tomorrow's to-do items can significantly lighten that mental loop.\n\n"
                "How many hours of rest did you get last night, and what does your evening wind-down look like currently?"
            )
            followups = [
                "I got less than 5 hours of sleep",
                "Suggest a relaxing pre-sleep routine",
                "How does poor sleep impact my stress?"
            ]

        elif any(w in lower for w in ["sad", "down", "lonely", "unmotivated", "numb", "empty"]):
            reply = (
                "Thank you for sharing that with me. It takes vulnerability to voice when things feel flat or disheartening. "
                "Please remember that low-energy dips are natural ebbs in our wellness journey rather than personal failures.\n\n"
                "On days when motivation feels elusive, lowering the bar to 'micro-actions'—like drinking a glass of water, opening a window for fresh air, or stepping outside for 5 minutes—gives your brain gentle positive feedback without pressure.\n\n"
                "Is there one small, comforting thing you can give yourself permission to enjoy today?"
            )
            followups = [
                "I find it hard to start tasks today",
                "Give me an easy 5-minute mood-lifting activity",
                "Can you recommend a mindfulness prompt?"
            ]

        elif any(w in lower for w in ["exercise", "walk", "gym", "run", "workout", "active"]):
            reply = (
                "Physical movement is one of the most reliable neurochemical anchors for mood and stress regulation! "
                "Even moderate activity stimulates endorphins, helps clear cortisol, and promotes deeper slow-wave sleep later tonight.\n\n"
                f"With your current context in {current_mode} mode, your physiological system is adapting well. "
                "Be sure to hydrate and allow your heart rate to gently taper down.\n\n"
                "How did your body feel during today's movement?"
            )
            followups = [
                "I felt much clearer after my walk",
                "How does exercise affect my resting heart rate?",
                "What's a good post-workout cool down?"
            ]

        elif any(w in lower for w in ["hello", "hi", "hey", "good morning", "good evening"]):
            reply = (
                f"Hello! It's good to connect with you today. {mode_context_hint}\n\n"
                "MindCare AI is here to offer a supportive space to reflect on how you're feeling, track your daily wellness indicators, and discover balanced routines.\n\n"
                "How has your day been treating you so far?"
            )
            followups = [
                "I'd like to do my midday check-in",
                "How are my wellness indicators looking today?",
                "Tell me about my personal reference range"
            ]

        else:
            reply = (
                f"I hear you, and I appreciate you sharing your thoughts.{mode_context_hint} "
                "Every reflection you log helps build a clearer picture of your personal wellness rhythm. "
                "Remember, wellness is not about maintaining constant perfection, but learning how your mind and body respond to daily life.\n\n"
                "What would be most supportive for you right now—talking through this further, or exploring a quick wellness recommendation?"
            )
            followups = [
                "Show me recommended wellness activities",
                "Let's review my recent stress trends",
                "How does my wearable data tie into my mood?"
            ]

        return {
            "message": reply,
            "suggested_followups": followups,
            "provider": "MockAIProvider (Demonstration Mode)"
        }

    def generate_wellness_insights(
        self,
        checkin_history: List[Dict[str, Any]],
        wearable_summary: Dict[str, Any],
        personal_reference: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        return [
            {
                "id": "ins-1",
                "category": "stress_correlation",
                "title": "Subjective Stress & Diurnal Rhythm",
                "observation": "Your reported stress was higher today than your recent personal pattern.",
                "context": "Days with high morning deadline pressure correlated with an average 6 bpm rise in mid-afternoon resting heart rate.",
                "suggestion": "Consider scheduling a 5-minute screen-free breathing pause at 1:30 PM.",
                "disclaimer": "Non-diagnostic correlation based on personal pattern comparison."
            },
            {
                "id": "ins-2",
                "category": "sleep_correlation",
                "title": "Sleep Duration & Energy Resonance",
                "observation": "Your sleep duration was lower than your recent pattern (6.1h vs 7.2h typical).",
                "context": "On evenings following shorter sleep, afternoon energy ratings dropped by an average of 2.1 points on your 1-10 scale.",
                "suggestion": "Aim for an intentional 20-minute wind-down without digital screens tonight.",
                "disclaimer": "Non-diagnostic correlation based on personal pattern comparison."
            },
            {
                "id": "ins-3",
                "category": "activity_boost",
                "title": "Movement & Mood Uplift",
                "observation": "Your mood improved after your afternoon activity.",
                "context": "Post-walk check-in scores showed a noticeable positive shift in reported calm and clarity.",
                "suggestion": "Continuing your daily 25-minute brisk walk appears to be a strong personal wellness anchor.",
                "disclaimer": "Non-diagnostic correlation based on personal pattern comparison."
            }
        ]

    def generate_adaptive_questions(
        self,
        recent_checkins: List[Dict[str, Any]],
        recent_sleep: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        questions = []

        # Check sleep context
        if recent_sleep and recent_sleep.get("total_duration_hours", 8) < 6.5:
            questions.append({
                "id": "adaptive_sleep_q",
                "category": "sleep_followup",
                "question": "I noticed your rest last night was shorter than your typical pattern. How is your physical energy feeling as you navigate today?",
                "type": "slider_or_text"
            })
        else:
            questions.append({
                "id": "adaptive_morning_q",
                "category": "general_energy",
                "question": "How did waking up this morning feel, and what is your overall readiness level today?",
                "type": "slider_or_text"
            })

        # Check recent stress trend
        recent_high_stress = False
        for c in recent_checkins[:2]:
            if c.get("stress_score", 0) >= 7:
                recent_high_stress = True
                break

        if recent_high_stress:
            questions.append({
                "id": "adaptive_stress_q",
                "category": "stress_followup",
                "question": "You noted elevated tension recently. Have you had a chance to step away from work or studies for a brief pause today?",
                "type": "text"
            })
        else:
            questions.append({
                "id": "adaptive_social_q",
                "category": "social_connection",
                "question": "Have you had any uplifting social interactions or conversations with friends or family today?",
                "type": "text"
            })

        return questions


# Singleton instance
mock_ai_service = MockAIProvider()

