# Wearable Biosensor Integration Guide (Plan B)

## 1. Provider Abstraction Architecture

MindCare AI treats smartwatch hardware as interchangeable data providers through the `WearableProvider` interface. This decoupling prevents vendor lock-in and allows seamless switching between mock demonstration streams and physical production APIs.

```python
class WearableProvider(ABC):
    @abstractmethod
    def connect(self, user_id: str, auth_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]: ...
    @abstractmethod
    def disconnect(self, user_id: str) -> bool: ...
    @abstractmethod
    def get_latest_readings(self, user_id: str) -> Dict[str, Any]: ...
    @abstractmethod
    def get_heart_rate_timeseries(self, user_id: str, hours: int = 24) -> List[Dict[str, Any]]: ...
    @abstractmethod
    def get_sleep_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]: ...
    @abstractmethod
    def get_activity_data(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]: ...
```

---

## 2. MockWearableProvider

The built-in `MockWearableProvider` provides realistic physiological telemetry out-of-the-box:
- **Diurnal Rhythm**: Sinusoidal circadian variation (60–75 bpm during daytime rest, 56–64 bpm during sleep, 120–160 bpm during workout windows).
- **Sleep Architecture**: 7-day sleep records with accurate proportions of Deep Sleep (18–24%), REM Sleep (20–26%), and Light Sleep (50–60%).
- **Activity & Step Cadence**: Realistic step accumulation with active minute tracking and calorie expenditure estimation.
- **Demonstration Scenarios**: Injectable states via `/api/v1/wearables/simulate-anomaly` to verify contextual anomaly handling.

---

## 3. Data Quality Gate

Before wearable telemetry reaches the AI or anomaly layers, the `DataQualityValidator` evaluates signal integrity:

| Status | Trigger Condition | System Action |
|---|---|---|
| `VALID` | Signal passes physiological range and timestamp freshness checks. | Ingested into anomaly engine. |
| `SUSPICIOUS` | HR &lt; 30 bpm, HR &gt; 240 bpm, or instantaneous jump &gt; 55 bpm without exercise. | Displayed with warning; anomaly engine suppresses false alarm. |
| `STALE` | Last packet timestamp &gt; 2 hours old. | Alert user to re-sync or adjust band fit. |
| `MISSING` | Null sensor values or payload disconnect. | Prompt user to reconnect band. |

---

## 4. Contextual Anomaly Engine

Medical thresholds (e.g. static 100 bpm tachycardia cutoffs) fail in everyday wellness scenarios. MindCare AI utilizes a contextual matrix:

$$
\text{Anomaly State} = f(\text{Reading}, \text{Personal Reference}, \text{Context Mode}, \text{Quality})
$$

### Context Rules:
1. **Exercise Mode**:
   - Current HR: 145 bpm.
   - Evaluation: `NORMAL`.
   - Rationale: High heart rate is the expected physiological response to aerobic movement.
2. **Sleep Mode**:
   - Current HR: 104 bpm.
   - Evaluation: `UNUSUAL` / `SUSTAINED_ANOMALY`.
   - Rationale: Exceeds personal sleep reference (54–68 bpm). Prompt gentle non-diagnostic self-reflection (room temperature, late caffeine).
3. **Degraded Signal**:
   - Signal tagged as `STALE` or `SUSPICIOUS`.
   - Evaluation: `NORMAL` (suppressed).
   - Rationale: Degraded signals never trigger alarming notifications.

---

## 5. Integrating Physical Smartwatches (Future Scope)

To connect Fitbit, Apple Health, or Garmin:
1. Implement a class inheriting `WearableProvider` (e.g. `FitbitProvider`).
2. Implement OAuth2 authorization code flow with the vendor cloud.
3. Map vendor JSON payloads to MindCare's standardized Pydantic entities.
4. Set `WEARABLE_PROVIDER=fitbit` in `.env`.
