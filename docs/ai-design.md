# Conversational AI Architecture & Design Specification

## 1. Principles of Supportive Wellness AI

MindCare AI is designed to serve as an empathetic sounding board and habit coach rather than a clinical authority.

### Core Tenets:
1. **Reflective Validation Before Solutioning**: The AI acknowledges emotional weight before recommending activities.
2. **Context-Aware Grounding**: Incorporates the user's active mode (`AWAKE`, `SLEEP`, or `EXERCISE`) and wearable telemetry into conversational turns.
3. **Strict Non-Diagnostic Boundary**: System prompts forbid diagnosing mental disorders or cardiovascular disease.
4. **Adaptive Questioning**: Check-in questions dynamically evolve based on recent history rather than repeating a static questionnaire.

---

## 2. Prompt Architecture

The system prompt enforces strict safety directives and conversational pacing:

```text
CRITICAL NON-DIAGNOSTIC & SAFETY DIRECTIVES:
1. YOU ARE A SUPPORTIVE DIGITAL WELLNESS COMPANION, NOT A MEDICAL DOCTOR OR PSYCHIATRIST.
2. NEVER DIAGNOSE any condition, such as depression, generalized anxiety disorder, bipolar disorder, arrhythmia, or hypertension.
3. CLEARLY DISTINGUISH wellness indicators (e.g. self-reported stress score, resting heart rate range) from clinical medical data.
4. If the user mentions physical illness, severe pain, or queries whether they have a disease, gently remind them that you provide lifestyle and wellness support and encourage them to consult a qualified healthcare professional.
5. If the user expresses feelings of hopelessness, self-harm, or suicidal thoughts, prioritize empathy, safety, and recommend professional human crisis resources.
6. Tone: Calm, warm, patient, non-judgmental, reassuring, and grounded.
```

---

## 3. Adaptive Questioning Algorithm

Static daily questionnaires suffer from high abandonment rates. MindCare AI's `AdaptiveQuestioningService` tailors questions dynamically:

```mermaid
flowchart TD
    Start["User Launches Check-in"] --> LoadHistory["Fetch Last 3 Check-ins & Sleep Record"]
    LoadHistory --> EvalStress{"Recent Stress Score >= 7?"}
    
    EvalStress -->|Yes| InjectStressFollowup["Inject Coping Strategy & Pressure Follow-up Question"]
    EvalStress -->|No| EvalSleep{"Last Sleep Duration < 6.5h?"}
    
    EvalSleep -->|Yes| InjectSleepFollowup["Inject Daytime Physical Energy & Rest Follow-up Question"]
    EvalSleep -->|No| InjectSocialFollowup["Inject Social Support & Gratitude Question"]
    
    InjectStressFollowup --> RenderForm["Render Dynamic Adaptive Questionnaire"]
    InjectSleepFollowup --> RenderForm
    InjectSocialFollowup --> RenderForm
```

---

## 4. Voice Persona & Synthesis

- **Cadence**: 0.94x speech rate (patient and deliberate).
- **Pitch**: 1.0 (natural conversational equilibrium).
- **Tone**: Reassuring, soft-spoken, active listener.
- **Microphone Pipeline**: Native Web Speech API with fallback typed-voice simulation.
- **Audio Output**: Client-side speech synthesis with immediate safety cutoff if crisis keywords are uttered.
