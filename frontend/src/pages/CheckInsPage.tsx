import React, { useState, useEffect } from 'react';
import { CalendarCheck, Sun, Moon, Sparkles, Check, Clock, ChevronRight, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWellness } from '../contexts/WellnessContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import type { CheckInRecord, CheckInQuestion } from '../types';

export const CheckInsPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshIndicators } = useWellness();

  const [activeTab, setActiveTab] = useState<'midday' | 'evening' | 'history'>('midday');
  const [questions, setQuestions] = useState<CheckInQuestion[]>([]);
  const [moodScore, setMoodScore] = useState(7);
  const [stressScore, setStressScore] = useState(4);
  const [energyScore, setEnergyScore] = useState(6);
  const [notes, setNotes] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<CheckInRecord | null>(null);
  const [history, setHistory] = useState<CheckInRecord[]>([]);

  useEffect(() => {
    if (activeTab === 'midday' || activeTab === 'evening') {
      const loadQuestions = async () => {
        try {
          const data = await api.getAdaptiveQuestions(activeTab);
          setQuestions(data.questions || []);
        } catch (err) {
          console.warn('Failed to load adaptive questions:', err);
        }
      };
      loadQuestions();
    } else if (activeTab === 'history') {
      const loadHistory = async () => {
        try {
          const data = await api.getCheckInHistory();
          setHistory(data);
        } catch (err) {
          console.warn('Failed to load check-in history:', err);
        }
      };
      loadHistory();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formattedQA = questions.map((q) => ({
      question_id: q.id,
      question_text: q.text,
      category: q.category,
      answer_text: answers[q.id] || 'Completed via slider scales'
    }));

    try {
      const res = await api.submitCheckIn({
        check_in_type: activeTab,
        mood_score: moodScore,
        stress_score: stressScore,
        energy_score: energyScore,
        notes: notes,
        qa_answers: formattedQA
      });

      setSubmittedResult(res.check_in);
      await refreshIndicators();
    } catch (err) {
      console.error('Check-in submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => { setActiveTab('midday'); setSubmittedResult(null); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'midday'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Midday Check-in (~12 PM)</span>
        </button>

        <button
          onClick={() => { setActiveTab('evening'); setSubmittedResult(null); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'evening'
              ? 'bg-white text-purple-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Moon className="w-4 h-4 text-purple-600" />
          <span>Before-Bed Check-in</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>History</span>
        </button>
      </div>

      {/* History View */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Psychosocial Check-in Logs</h3>
          <p className="text-xs text-slate-500">Records of your twice-daily emotional and stress reflections.</p>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No previous check-ins found. Complete your midday or evening check-in above.
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {history.map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                        rec.check_in_type === 'midday' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {rec.check_in_type}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">WELLNESS INDICATOR</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 my-2 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mood</span>
                      <span className="font-bold text-emerald-700">{rec.mood_score}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Stress</span>
                      <span className="font-bold text-amber-700">{rec.stress_score}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Energy</span>
                      <span className="font-bold text-blue-700">{rec.energy_score}/10</span>
                    </div>
                  </div>
                  {rec.notes && <p className="text-slate-600 italic mt-1">"{rec.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submitted Result Confirmation */}
      {submittedResult && activeTab !== 'history' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900">Check-in Recorded Successfully!</h3>
          <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">{submittedResult.summary}</p>

          <div className="mt-6 bg-white p-4 rounded-2xl border border-emerald-100 inline-flex space-x-6 text-xs text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Mood Score</span>
              <span className="text-lg font-extrabold text-emerald-700">{submittedResult.mood_score}/10</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Stress Score</span>
              <span className="text-lg font-extrabold text-amber-600">{submittedResult.stress_score}/10</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Energy Score</span>
              <span className="text-lg font-extrabold text-blue-600">{submittedResult.energy_score}/10</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setSubmittedResult(null)}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl"
            >
              Done / Submit Another
            </button>
          </div>
        </div>
      )}

      {/* Form Submission */}
      {!submittedResult && activeTab !== 'history' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 capitalize">
                {activeTab === 'midday' ? 'Midday Check-in (2–4 Minutes)' : 'Before-Bed Wind-Down (3–5 Minutes)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'midday'
                  ? 'Reflect on your morning mental state, study pressure, and emotional balance.'
                  : 'Synthesize your day, acknowledge accomplishments, and set a restful tone for sleep.'}
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-semibold font-mono">
              Adaptive Qs
            </span>
          </div>

          {/* Slider 1: Mood */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">
                1. Emotional State & Mood: <span className="text-emerald-700 font-extrabold">{moodScore}/10</span>
              </label>
              <span className="text-[11px] text-slate-400">1 = Very Low, 10 = Great</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Slider 2: Stress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">
                2. Academic / Personal Stress: <span className="text-amber-600 font-extrabold">{stressScore}/10</span>
              </label>
              <span className="text-[11px] text-slate-400">1 = Calm, 10 = Very Stressed</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={stressScore}
              onChange={(e) => setStressScore(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Slider 3: Energy */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">
                3. Physical & Mental Energy: <span className="text-blue-600 font-extrabold">{energyScore}/10</span>
              </label>
              <span className="text-[11px] text-slate-400">1 = Exhausted, 10 = Fully Energized</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={energyScore}
              onChange={(e) => setEnergyScore(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Adaptive Dynamic Questions */}
          {questions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Adaptive Questions</p>
              {questions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">{q.text}</label>
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Type your brief thoughts..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Optional Reflection Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Personal Journal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notable events, social connections, or reflections from today..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              {submitting ? 'Submitting & Computing Indicators...' : 'Submit Check-in & Update Reference'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
