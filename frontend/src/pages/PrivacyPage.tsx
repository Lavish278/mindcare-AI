import React, { useState } from 'react';
import { ShieldCheck, Lock, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const PrivacyPage: React.FC = () => {
  const { user, updateConsent } = useAuth();
  const consent = user?.privacy_consent || {
    ai_conversation_data: true,
    wellness_data: true,
    wearable_data: true,
    notifications_enabled: true,
    analytics_participation: true,
  };

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleToggle = async (key: keyof typeof consent) => {
    setSaving(true);
    setSuccessMsg('');
    try {
      await updateConsent({ [key]: !consent[key] });
      setSuccessMsg('Privacy preferences updated successfully.');
    } catch (err) {
      console.error('Failed to update consent:', err);
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = () => {
    const dataStr = JSON.stringify(user, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindcare-wellness-data-${user?.id || 'demo'}.json`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Privacy & Consent Governance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          MindCare AI is built with privacy-by-design. You maintain complete control over data streaming and retention.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Consent Toggles Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Granular Data Permissions
        </h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="pr-4">
              <span className="font-bold text-xs text-slate-900 block">AI Conversation Continuity</span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Retains chat reflections within your private session context. Conversations are never fed to public foundation models.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.ai_conversation_data}
              onChange={() => handleToggle('ai_conversation_data')}
              disabled={saving}
              className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="pr-4">
              <span className="font-bold text-xs text-slate-900 block">Psychosocial Check-in Storage</span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Stores your twice-daily subjective mood, stress, and energy ratings to calculate personal trends.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.wellness_data}
              onChange={() => handleToggle('wellness_data')}
              disabled={saving}
              className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="pr-4">
              <span className="font-bold text-xs text-slate-900 block">Wearable Biosensor Metrics</span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Enables streaming heart rate, sleep stages, and activity steps from your smartwatch to compute your Personal Reference Range.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.wearable_data}
              onChange={() => handleToggle('wearable_data')}
              disabled={saving}
              className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="pr-4">
              <span className="font-bold text-xs text-slate-900 block">De-Identified Research Participation</span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Allows aggregated statistical analysis for university project evaluation. No identifying data or raw conversations are ever shared.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.analytics_participation}
              onChange={() => handleToggle('analytics_participation')}
              disabled={saving}
              className="w-4 h-4 accent-emerald-600 mt-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Data Export and Portability */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Data Portability & Export
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Download a complete, machine-readable JSON copy of all profile information, check-in history, and personal reference parameters.
        </p>
        <button
          onClick={exportUserData}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export My Personal Wellness Data (JSON)</span>
        </button>
      </div>
    </div>
  );
};

