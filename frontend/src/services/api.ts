const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('mindcare_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; display_name: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async completeOnboarding(data: any) {
    const res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updatePrivacy(data: any) {
    const res = await fetch(`${API_BASE}/auth/privacy`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Chat
  async sendChatMessage(message: string, conversationId?: string, currentMode?: string) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        current_mode: currentMode,
      }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getChatHistory() {
    const res = await fetch(`${API_BASE}/chat/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Voice Turn
  async processVoiceTurn(speechText: string, currentMode?: string) {
    const res = await fetch(`${API_BASE}/voice/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_speech_text: speechText,
        current_mode: currentMode,
      }),
    });
    return res.json();
  },

  // Check-ins
  async getAdaptiveQuestions(type: 'midday' | 'evening' = 'midday') {
    const res = await fetch(`${API_BASE}/checkins/questions?check_in_type=${type}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async submitCheckIn(data: any) {
    const res = await fetch(`${API_BASE}/checkins/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getCheckInHistory() {
    const res = await fetch(`${API_BASE}/checkins/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getWellnessIndicators() {
    const res = await fetch(`${API_BASE}/checkins/indicators`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Wearables
  async getWearableStatus() {
    const res = await fetch(`${API_BASE}/wearables/status`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async connectWearable(providerType: string = 'mock') {
    const res = await fetch(`${API_BASE}/wearables/connect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ provider_type: providerType }),
    });
    return res.json();
  },

  async disconnectWearable() {
    const res = await fetch(`${API_BASE}/wearables/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async syncWearable() {
    const res = await fetch(`${API_BASE}/wearables/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getWearableReadings() {
    const res = await fetch(`${API_BASE}/wearables/readings`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getWearableMode() {
    const res = await fetch(`${API_BASE}/wearables/mode`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async setWearableMode(mode: 'AWAKE' | 'SLEEP' | 'EXERCISE') {
    const res = await fetch(`${API_BASE}/wearables/mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode, manual_override: true }),
    });
    return res.json();
  },

  async getHeartRateTimeseries(hours: number = 24) {
    const res = await fetch(`${API_BASE}/wearables/timeseries?hours=${hours}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getSleepData(days: number = 7) {
    const res = await fetch(`${API_BASE}/wearables/sleep?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getActivityData(days: number = 7) {
    const res = await fetch(`${API_BASE}/wearables/activity?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async simulateAnomaly(scenario: string) {
    const res = await fetch(`${API_BASE}/wearables/simulate-anomaly`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ anomaly_scenario: scenario }),
    });
    return res.json();
  },

  async ingestWearableReading(data: {
    heart_rate: number;
    context_mode?: string;
    steps?: number;
    battery_level?: number;
    device_name?: string;
    source?: string;
  }) {
    const res = await fetch(`${API_BASE}/wearables/ingest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Recommendations
  async getRecommendations(stress: number = 5, energy: number = 5) {
    const res = await fetch(`${API_BASE}/recommendations?stress=${stress}&energy=${energy}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async submitRecommendationFeedback(recommendationId: string, category: string, helpful: string, comment?: string) {
    const res = await fetch(`${API_BASE}/recommendations/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        recommendation_id: recommendationId,
        category,
        helpful,
        comment,
      }),
    });
    return res.json();
  },

  // Progress
  async getProgressSummary() {
    const res = await fetch(`${API_BASE}/progress/summary`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getPersonalReference() {
    const res = await fetch(`${API_BASE}/progress/reference`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Admin
  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

