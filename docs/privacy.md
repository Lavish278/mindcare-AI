# Privacy, Consent & Governance Architecture

## 1. Core Privacy Commitments

MindCare AI is engineered with privacy-by-design principles tailored for university student populations:

1. **No External LLM Training**: Student conversation logs are never used to train public generative models.
2. **Granular Opt-In Consent**: Users independently toggle permissions for AI conversation history, wearable biometric synchronization, and research analytics.
3. **Data Portability**: Full JSON export of personal wellness data available on demand (`/settings/privacy`).
4. **Document-Level Tenant Isolation**: Strict Firestore security rules ensure students can never query another user's private records.

---

## 2. Granular Consent Matrix

| Permission Key | Default | Purpose | User Control |
|---|---|---|---|
| `ai_conversation_data` | `true` | Allows chat session continuity and contextual recall during companion dialogue. | Can be revoked at any time. |
| `wellness_data` | `true` | Retains check-in ratings to graph weekly mood and stress trends. | Can be revoked at any time. |
| `wearable_data` | `true` | Allows streaming heart rate and sleep telemetry to compute personal reference range. | Can be disconnected with one click. |
| `analytics_participation`| `true` | Contributes to de-identified aggregate cohort statistics for academic evaluation. | Fully optional opt-in. |

---

## 3. De-Identification for Academic Research

For university thesis evaluation and admin dashboards:
- Only aggregate metrics are queried (`count`, `average`, `distribution percentage`).
- Individual user identifiers (`uid`, email, IP) are scrubbed.
- Sensitive qualitative reflection notes and chat contents are completely omitted from research panels.
