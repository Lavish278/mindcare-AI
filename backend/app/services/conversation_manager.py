"""
MindCare AI — Conversation Manager
Governs conversational flow, turn-taking, topic continuity, question moderation,
and voice personality formatting. Ensures the companion is calm, warm, patient,
reassuring, and soft-spoken without acting like an interrogating question-answer bot.
"""
from typing import Dict, Any, List, Optional
import re


VOICE_PERSONA_GUIDELINES = """
VOICE COMPANION PERSONA GUIDELINES:
- Tone: Calm, warm, mature, reassuring, soft-spoken, patient, natural conversational pacing.
- Emotional presence: Supportive, empathetic, and present, but not dramatic or clinical.
- Conversational pacing: 
  * Acknowledge what the user just said before introducing new thoughts.
  * Keep spoken responses concise (2 to 4 sentences in spoken turns) so the user doesn't feel lectured.
  * Avoid asking more than ONE question per turn.
  * If the user answered your previous question, build directly on their response rather than repeating or ignoring it.
  * Know when to simply listen and validate feelings, rather than immediately pushing advice.
  * Allow topic changes gracefully.
- Safety & Non-Diagnostic Constraint:
  * NEVER diagnose mental or physical illnesses (depression, anxiety, arrhythmia).
  * Distinguish non-diagnostic wellness indicators from medical evaluations.
"""


class ConversationManager:
    """
    Manages conversational intelligence for both text and voice channels.
    Provides prompt conditioning and handles offline mock dialogue generation.
    """

    @classmethod
    def prepare_dialogue_prompt(
        cls,
        messages: List[Dict[str, Any]],
        context_str: str,
        modality: str = "voice"
    ) -> str:
        """
        Builds instructions for the LLM that blend conversational history,
        persona guidelines, and context cues.
        """
        modality_instruction = ""
        if modality == "voice":
            modality_instruction = (
                "MODALITY NOTE: You are currently speaking via voice companion. "
                "Keep your response concise, spoken-friendly (avoid markdown asterisks or bullet points), "
                "and maintain a calm, soft-spoken tone with warm, unhurried pacing."
            )

        prompt_sections = [
            VOICE_PERSONA_GUIDELINES,
            modality_instruction,
            context_str,
            "CONVERSATION HISTORY:"
        ]

        # Format recent history turns
        for m in messages[-8:]:
            role = "USER" if m.get("role") == "user" else "MINDCARE COMPANION"
            content = m.get("content", "").strip()
            prompt_sections.append(f"{role}: {content}")

        prompt_sections.append("MINDCARE COMPANION (Respond naturally in voice persona):")
        return "\n\n".join(prompt_sections)

    @classmethod
    def generate_adaptive_voice_reply(
        cls,
        current_text: str,
        history: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates an offline/mock response that embodies all ConversationManager
        principles (topic tracking, acknowledging prior turn, single follow-up, etc.)
        when cloud LLM is in mock mode.
        """
        user_text = current_text.strip().lower()
        active_mode = context.get("active_mode", "AWAKE")
        name = context.get("display_name", "Friend")
        checkin = context.get("latest_checkin") or {}
        wearable = context.get("wearable_state") or {}

        # Mode hint
        mode_phrase = ""
        if active_mode == "EXERCISE":
            mode_phrase = " I notice you've been active today, so remember to hydrate and allow your heart rate to settle down gently."
        elif active_mode == "SLEEP":
            mode_phrase = " Since it's nighttime resting hours, let's keep things low-key and soothing."

        # Detect last assistant question from history to recognize if user answered it
        last_bot_msg = None
        for m in reversed(history if history else []):
            if m.get("role") == "assistant":
                last_bot_msg = m.get("content", "")
                break

        # Case 1: Answering a preparation or stress question
        if (last_bot_msg and ("prepare" in last_bot_msg.lower() or "priority" in last_bot_msg.lower())) or "prepare" in user_text:
            if any(w in user_text for w in ["not enough", "haven't", "unprepared", "overwhelmed", "too much", "lot", "prepare", "time"]):
                return {
                    "message": (
                        f"That makes complete sense, {name}. When preparation feels incomplete, our nervous system naturally spikes into high alert.{mode_phrase} "
                        "Instead of trying to cover everything at once, could we pick just one essential piece to focus on for the next twenty minutes?"
                    ),
                    "suggested_followups": [
                        "Let's focus on the first part",
                        "I'd rather do a quick breathing exercise first",
                        "Can you help me outline a checklist?"
                    ]
                }

        # Case 2: Stress / Academic / Work
        if any(w in user_text for w in ["stress", "anxious", "deadline", "interview", "exam", "pressure"]):
            return {
                "message": (
                    f"I hear how heavy that feels right now, {name}. It is completely natural to feel tight when there's an important moment ahead.{mode_phrase} "
                    "Is it the event itself that is weighing on you most, or do you feel like you haven't had enough space to prepare?"
                ),
                "suggested_followups": [
                    "I haven't prepared enough",
                    "It's the fear of messing up",
                    "Can we do a short calming exercise?"
                ]
            }

        # Case 3: Fatigue / Sleep
        if any(w in user_text for w in ["sleep", "tired", "exhausted", "drowsy", "insomnia", "woke up"]):
            return {
                "message": (
                    "Thank you for letting me know. Low energy colors everything we experience during the day, making even small tasks feel steeper.{mode_phrase} "
                    "Did you manage to get any restful rest last night, or was your mind racing?"
                ),
                "suggested_followups": [
                    "My mind was racing all night",
                    "I got about 5 hours",
                    "Any tips for winding down tonight?"
                ]
            }

        # Case 4: Exercise / Movement
        if any(w in user_text for w in ["workout", "exercise", "walk", "gym", "run", "movement"]):
            hr_val = wearable.get("heart_rate")
            hr_text = f" Your band shows your heart rate around {hr_val} bpm." if hr_val else ""
            return {
                "message": (
                    f"That's great that you got some physical movement in, {name}!{hr_text} "
                    "Physical activity is wonderful for clearing cortisol and helping your mind reset. "
                    "How are your muscles and breathing feeling right now?"
                ),
                "suggested_followups": [
                    "Feeling energized and clear",
                    "A bit tired but accomplished",
                    "What's a good post-workout stretch?"
                ]
            }

        # Case 5: Greetings / Check-in
        if any(w in user_text for w in ["hello", "hi", "hey", "good morning", "good evening"]):
            return {
                "message": (
                    f"Hello {name}, I'm right here with you. I'm tuned into your {active_mode.lower()} context and ready to listen.{mode_phrase} "
                    "How has your headspace felt today?"
                ),
                "suggested_followups": [
                    "I'd like to talk through my day",
                    "Can we do my daily check-in?",
                    "How are my wellness indicators looking?"
                ]
            }

        # Default supportive conversational reflection
        return {
            "message": (
                f"I appreciate you sharing that with me, {name}. Taking a moment to speak things out loud is often the first step in creating clarity.{mode_phrase} "
                "How are you feeling in your body as you talk through this?"
            ),
            "suggested_followups": [
                "My shoulders feel quite tense",
                "I feel a bit more relaxed now",
                "Can you recommend a micro-break activity?"
            ]
        }
