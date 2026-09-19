import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Wind,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Send,
  Check
} from 'lucide-react';
import { BreathingWidget } from '../components/BreathingWidget';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import type { RecommendationItem } from '../types';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackState, setFeedbackState] = useState<Record<string, { rating: string; comment: string; submitted: boolean }>>({});

  useEffect(() => {
    const loadRecs = async () => {
      try {
        const data = await api.getRecommendations(6, 5);
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.warn('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecs();
  }, []);

  const handleRatingSelect = (recId: string, rating: 'YES' | 'SOMEWHAT' | 'NO') => {
    setFeedbackState((prev) => ({
      ...prev,
      [recId]: {
        rating,
        comment: prev[recId]?.comment || '',
        submitted: false
      }
    }));
  };

  const handleFeedbackSubmit = async (rec: RecommendationItem) => {
    const current = feedbackState[rec.id];
    if (!current?.rating) return;

    try {
      await api.submitRecommendationFeedback(rec.id, rec.category, current.rating, current.comment);
      setFeedbackState((prev) => ({
        ...prev,
        [rec.id]: {
          ...current,
          submitted: true
        }
      }));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Personalized Wellness Recommendations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted micro-actions tailored to your subjective stress, energy, and wearable context.
          </p>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold font-mono">
          Adaptive Feedback Loop
        </span>
      </div>

      {/* Featured Interactive Tool: 4x4 Box Breathing */}
      <BreathingWidget />

      {/* Recommendation Catalog */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Suggested Practices For You Today
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading personalized recommendations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const fb = feedbackState[rec.id];
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase">
                        {rec.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{rec.duration_minutes} mins</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.description}</p>

                    <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Action Steps
                      </span>
                      <ol className="space-y-1 text-xs text-slate-700 list-decimal list-inside">
                        {rec.action_steps.map((step, idx) => (
                          <li key={idx} className="leading-snug">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 italic">
                      Rationale: {rec.rationale}
                    </p>
                  </div>

                  {/* Feedback Loop (Section 23) */}
                  <div className="pt-3 border-t border-slate-100">
                    {fb?.submitted ? (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Feedback logged! MindCare will personalize future recommendations.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Did this help you?</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleRatingSelect(rec.id, 'YES')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                                fb?.rating === 'YES'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRatingSelect(rec.id, 'SOMEWHAT')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                                fb?.rating === 'SOMEWHAT'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <Meh className="w-3 h-3" />
                              <span>Somewhat</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRatingSelect(rec.id, 'NO')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                                fb?.rating === 'NO'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>No</span>
                            </button>
                          </div>
                        </div>

                        {fb?.rating && (
                          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100">
                            <input
                              type="text"
                              value={fb.comment}
                              onChange={(e) =>
                                setFeedbackState((prev) => ({
                                  ...prev,
                                  [rec.id]: { ...prev[rec.id], comment: e.target.value }
                                }))
                              }
                              placeholder="Optional comments on how it felt..."
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleFeedbackSubmit(rec)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
                            >
                              <span>Save</span>
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
