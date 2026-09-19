export type ContextMode = 'AWAKE' | 'SLEEP' | 'EXERCISE';
export type DataQuality = 'VALID' | 'SUSPICIOUS' | 'MISSING' | 'STALE';
export type AnomalyState = 'NORMAL' | 'UNUSUAL' | 'SUSTAINED_ANOMALY' | 'SAFETY_EVENT';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  display_name: string;
  role: string;
  onboarding_completed: boolean;
  wellness_preferences?: {
    goals?: string[];
    notification_frequency?: string;
  };
  privacy_consent: {
    ai_conversation_data: boolean;
    wellness_data: boolean;
    wearable_data: boolean;
    notifications_enabled: boolean;
    analytics_participation: boolean;
  };
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WellnessIndicators {
  mood_wellness_indicator: string;
  stress_wellness_indicator: string;
  energy_indicator: string;
  last_checkin_type?: string;
  timestamp?: string;
  disclaimer: string;
}

export interface CheckInQuestion {
  id: string;
  category: string;
  text: string;
  type: string;
}

export interface CheckInRecord {
  id: string;
  user_id: string;
  check_in_type: 'midday' | 'evening';
  mood_score: number;
  stress_score: number;
  energy_score: number;
  notes?: string;
  qa_answers?: Array<{
    question_id: string;
    question_text: string;
    category: string;
    answer_text: string;
  }>;
  wellness_indicators?: Record<string, any>;
  summary?: string;
  timestamp: string;
}

export interface WearableStatus {
  status: 'CONNECTED' | 'DISCONNECTED';
  device_name: string | null;
  battery_level?: number;
  last_synced: string | null;
  supported_metrics?: string[];
}

export interface AnomalyEvaluation {
  state: AnomalyState;
  is_anomaly: boolean;
  current_mode: ContextMode;
  data_quality: DataQuality;
  explanation: string;
  recommendation: string;
}

export interface WearableReadings {
  heart_rate: number;
  timestamp: string;
  context_mode: ContextMode;
  data_quality: DataQuality;
  quality_rationale?: string;
  battery_level?: number;
  device_name?: string;
  anomaly_evaluation?: AnomalyEvaluation;
}

export interface HeartRatePoint {
  timestamp: string;
  heart_rate: number;
  context_mode: ContextMode;
  data_quality: DataQuality;
}

export interface SleepRecord {
  date: string;
  total_duration_hours: number;
  deep_sleep_hours: number;
  rem_sleep_hours: number;
  light_sleep_hours: number;
  sleep_efficiency_percent: number;
  resting_sleep_hr: number;
}

export interface ActivityDay {
  date: string;
  steps: number;
  active_minutes: number;
  calories_burned: number;
  target_steps: number;
}

export interface ExerciseSession {
  id: string;
  activity_type: string;
  duration_minutes: number;
  steps: number;
  calories_burned: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  timestamp: string;
}

export interface PersonalReference {
  user_id: string;
  days_observed: number;
  stability_tier: string;
  tier_label: string;
  tier_description: string;
  disclaimer: string;
  rest_hr_range: { min: number; max: number; avg: number };
  sleep_hr_range: { min: number; max: number; avg: number };
  exercise_hr_range: { min: number; max: number; avg: number };
  typical_daily_steps: number;
  typical_sleep_duration_hours: number;
  typical_stress_avg: number;
  typical_mood_avg: number;
  confidence_score: number;
  last_computed: string;
}

export interface RecommendationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  duration_minutes: number;
  action_steps: string[];
  rationale: string;
}

export interface SafetyResource {
  name: string;
  phone?: string;
  sms?: string;
  website?: string;
  details?: string;
  instructions?: string;
}

export interface SafetyDetails {
  risk_level: string;
  category: string;
  title: string;
  message: string;
  resources: SafetyResource[];
  disclaimer: string;
}
