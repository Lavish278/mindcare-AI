# MindCare AI — Safety & Crisis Escalation Protocol

## 1. Safety Architecture Overview

The safety system functions as an autonomous gatekeeper positioned upstream of the conversational LLM and recommendation engines.

```mermaid
sequenceDiagram
    actor Student as Student User
    participant Gateway as API Gateway
    participant Safety as SafetyDetector
    participant DB as Audit Log
    participant UI as Client UI
    participant AI as LLM / Mock Provider

    Student->>Gateway: POST /chat/message ("I want to end my life")
    Gateway->>Safety: Evaluate Text Integrity
    Note over Safety: Regex & Intent Classifier checks for crisis patterns
    Safety-->>Gateway: Risk Level: CRITICAL (crisis_self_harm)
    Gateway->>DB: Log Audit Event (safety_events collection)
    Gateway-->>UI: Return Safety Interception Payload (988 Hotlines)
    Note over UI: Normal Chat halts; Emergency Crisis Modal opens
    Note over AI: LLM generation is completely bypassed
```

---

## 2. Detection Criteria & Triggers

The `SafetyDetector` operates across two major emergency domains:

### 1. Psychiatric Crisis & Self-Harm
- Phrases indicating suicide ideation, self-harm, cutting, intentional overdose, or hopeless desperation.
- Action:
  1. Immediately halts normal conversational flow.
  2. Bypasses generative LLM processing to prevent hallucinations or unsafe affirmations.
  3. Displays confidential, free, 24/7 human crisis resources.

### 2. Acute Physical Medical Emergencies
- Phrases mentioning crushing chest pain, anaphylaxis, overdose, severe trauma, or acute breathing cessation.
- Action:
  1. Emphasizes that MindCare AI is an automated companion and cannot provide emergency medical care.
  2. Directs the user to dial 911 (or local emergency medical services) or proceed to the nearest emergency department.

---

## 3. Verified Emergency Lifeline Directory

| Resource Name | Contact | Coverage | Description |
|---|---|---|---|
| **988 Suicide & Crisis Lifeline** | Call or Text `988` | USA & Canada | Free, confidential 24/7 support with trained crisis counselors. |
| **Crisis Text Line** | Text `HOME` to `741741` | USA, UK, Canada | Free 24/7 crisis support via SMS. |
| **Samaritans** | Call `116 123` | UK & Ireland | Free 24/7 confidential listening service. |
| **KIRAN Helpline** | Call `1800-599-0019` | India | 24/7 National Mental Health Helpline. |
| **Find A Helpline** | `https://findahelpline.com` | International | Global directory covering support hotlines in over 130 countries. |

---

## 4. Separation from Recommendation Logic

Safety logic is strictly decoupled from wellness recommendations:
- Routine wellness recommendations handle sleep routines, box breathing, and desk stretches.
- Safety events trigger explicit UI modals and audit records without conflating lifestyle tips with crisis intervention.
- The wearable biosensor stream never claims to detect a heart attack or medical emergency.
