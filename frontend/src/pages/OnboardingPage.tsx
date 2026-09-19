import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Bell, Shield, Watch, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [goals, setGoals] = useState<string[]>(['Stress Reduction', 'Better Sleep']);
  const [notificationFrequency, setNotificationFrequency] = useState('twice_daily');
  const [aiConsent, setAiConsent] = useState(true);
  const [wearableConsent, setWearableConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const availableGoals = [
    'Stress Reduction',
    'Better Sleep',
    'Exam / Study Focus',
    'Emotional Balance',
    'Mindful Movement',
    'Burnout Prevention'
  ];

  const toggleGoal = (g: string) => {
    setGoals(prev => prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await api.completeOnboarding({
        display_name: displayName || user?.display_name || 'Alex Chen',
        wellness_goals: goals,
        notification_frequency: notificationFrequency,
        ai_data_consent: aiConsent,
        wearable_data_consent: wearableConsent,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {step}/4
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {step === 1 && 'Welcome & Identity'}
              {step === 2 && 'Wellness Goals'}
              {step === 3 && 'Privacy & Permissions'}
              {step === 4 && 'Companion Readiness'}
            </span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold">MindCare Onboarding</span>
        </div>

        {/* STEP 1: Identity & Welcome */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome to MindCare AI</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your supportive, non-diagnostic digital companion for academic and personal wellness.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">What should your companion call you?</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.display_name || "Alex Chen"}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Next: Select Wellness Goals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Wellness Preferences */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Wellness Priorities</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select areas where you'd like gentle micro-guidance and reflection.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {availableGoals.map((g) => {
                const selected = goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={`p-3 rounded-xl border text-xs text-left font-medium transition-all ${
                      selected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{g}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Check-in Routine Prompt</label>
              <select
                value={notificationFrequency}
                onChange={(e) => setNotificationFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700"
              >
                <option value="twice_daily">Twice Daily (Midday ~12 PM & Evening Bedtime)</option>
                <option value="once_daily">Once Daily (Evening Reflection only)</option>
                <option value="on_demand">On-Demand (Only when I open the app)</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2"
              >
                <span>Next: Privacy Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Privacy & Data Consent */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Privacy & Data Consent</h2>
              <p className="text-xs text-slate-500 mt-1">
                You hold complete ownership of your data. Toggle permissions below.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-800">AI Conversation Continuity</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Allows companion memory during active sessions. Never used to train public LLMs.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConsent}
                  onChange={(e) => setAiConsent(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-800">Wearable Biosensor Synchronization</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permits streaming heart rate, sleep duration, and activity to compute your Personal Reference Range.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={wearableConsent}
                  onChange={(e) => setWearableConsent(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              <strong>Non-Diagnostic Commitment:</strong> MindCare AI generates wellness indicators and does not provide clinical diagnoses.
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2"
              >
                <span>Review & Finish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Ready to Enter Dashboard */}
        {step === 4 && (
          <div className="text-center space-y-6 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Companion is Ready!</h2>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                We've initialized your Personal Reference calibration profile and connected the Demo Wearable band.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Companion Name:</span>
                <span className="font-semibold">{displayName || user?.display_name || 'Alex Chen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Reference Status:</span>
                <span className="text-emerald-700 font-semibold">Tier 1 (Days 1–2 Observation)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Context Mode:</span>
                <span className="text-blue-700 font-semibold">AWAKE MODE</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Entering Dashboard...' : 'Enter MindCare Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
