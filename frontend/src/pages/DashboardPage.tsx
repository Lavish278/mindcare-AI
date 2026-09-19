import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Smile,
  Zap,
  Moon,
  Footprints,
  Activity,
  CalendarCheck,
  MessageSquare,
  Mic,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { useAuth } from '../contexts/AuthContext';
import { useWearable } from '../contexts/WearableContext';
import { useWellness } from '../contexts/WellnessContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { AnomalyAlert } from '../components/AnomalyAlert';
import { api } from '../services/api';
import type { HeartRatePoint } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { readings, currentMode, anomalyEvaluation, status } = useWearable();
  const { indicators } = useWellness();
  const [timeseries, setTimeseries] = useState<HeartRatePoint[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    const loadTimeseries = async () => {
      try {
        const data = await api.getHeartRateTimeseries(12);
        setTimeseries(data);
      } catch (err) {
        console.warn('Failed to load HR timeseries:', err);
      } finally {
        setLoadingCharts(false);
      }
    };
    loadTimeseries();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Disclaimer */}
      <DisclaimerBanner />

      {/* Greeting & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.display_name || 'Alex'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is your physiological rhythm and subjective wellness summary for today.
          </p>
        </div>

        {/* Quick Launcher Actions */}
        <div className="flex items-center space-x-2">
          <Link
            to="/checkins"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Complete Today's Check-in</span>
          </Link>
          <Link
            to="/chat"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chat AI</span>
          </Link>
          <Link
            to="/voice"
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            title="Voice Companion"
          >
            <Mic className="w-4 h-4 text-purple-600" />
          </Link>
        </div>
      </div>

      {/* Contextual Anomaly Banner */}
      <AnomalyAlert evaluation={anomalyEvaluation} />

      {/* Today's Non-Diagnostic Wellness Indicators Overview (Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Mood Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Mood Indicator</span>
            <Smile className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">{indicators?.mood_wellness_indicator || '7/10'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Calm & Balanced</p>
        </div>

        {/* Stress Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Stress Indicator</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">{indicators?.stress_wellness_indicator || '4/10'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Moderate academic load</p>
        </div>

        {/* Energy Indicator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Energy Vitality</span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">{indicators?.energy_indicator || '6/10'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Steady afternoon stamina</p>
        </div>

        {/* Heart Rate (Wearable) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">{readings?.heart_rate || 71}</span>
            <span className="text-xs font-semibold text-slate-500">bpm</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${readings?.data_quality === 'VALID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[10px] text-slate-500">{readings?.data_quality || 'VALID'} Signal</span>
          </div>
        </div>

        {/* Sleep Duration */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Last Sleep</span>
            <Moon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">7.4</span>
            <span className="text-xs font-semibold text-slate-500">hrs</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">88% Sleep Efficiency</p>
        </div>

        {/* Activity Steps */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Steps</span>
            <Footprints className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-slate-900">8,420</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">84% of 10k goal</p>
        </div>
      </div>

      {/* Main Grid: Biometric Rhythm Chart & Contextual Mode Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 12-Hour Heart Rate Timeseries Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">12-Hour Physiological Rhythm</h3>
              <p className="text-xs text-slate-500">Continuous heart rate plotted across diurnal context.</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Resting Reference (60–82 bpm)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {loadingCharts ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading timeseries...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[50, 160]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} bpm`, 'Heart Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="heart_rate"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#059669' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Col: Personal Reference Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Personal Reference</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                Tier 1 (Days 1–2)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Individualized Pattern Range</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your baseline calibrates to you over time, avoiding arbitrary generic medical cutoffs.
            </p>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Resting HR Range</span>
                  <span className="text-emerald-700 font-bold">60 – 82 bpm</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Average: 71 bpm (Awake Mode)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Sleep Restorative HR</span>
                  <span className="text-purple-700 font-bold">54 – 68 bpm</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Average: 61 bpm (Sleep Mode)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Typical Exercise Peak</span>
                  <span className="text-amber-700 font-bold">Up to 165 bpm</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Appropriate for moderate workouts</p>
              </div>
            </div>
          </div>

          <Link
            to="/progress"
            className="mt-6 flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-800 pt-3 border-t border-slate-100"
          >
            <span>View Full Progression Calibration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Section: Active Wellness Recommendation & Insights Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Action */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Suggested Wellness Habit</span>
          </div>
          <h4 className="text-lg font-bold">4x4 Box Breathing Pause</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            A quick 3-minute breath pacing interval to down-regulate afternoon cognitive fatigue and balance sympathetic tone.
          </p>
          <div className="mt-4 flex items-center space-x-3">
            <Link
              to="/recommendations"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              Start Breathing Practice
            </Link>
            <span className="text-xs text-slate-400">Duration: 3 mins</span>
          </div>
        </div>

        {/* Latest Contextual Correlation Insight */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Latest Correlation Insight</span>
          </div>
          <h4 className="text-base font-bold text-slate-900">Sleep Duration vs. Afternoon Energy</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            "Your reported stress was higher today than your recent personal pattern. Days with morning deadline pressure correlated with an average 6 bpm rise in mid-afternoon resting heart rate."
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 italic">Non-diagnostic correlation</span>
            <Link to="/insights" className="text-emerald-600 font-semibold hover:underline flex items-center space-x-1">
              <span>Explore all insights</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
