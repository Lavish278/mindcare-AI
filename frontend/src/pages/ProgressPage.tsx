import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  CalendarCheck,
  CheckCircle2,
  Activity,
  Heart,
  Moon,
  Footprints,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import type { PersonalReference } from '../types';

export const ProgressPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [reference, setReference] = useState<PersonalReference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [sum, ref] = await Promise.all([
          api.getProgressSummary(),
          api.getPersonalReference(),
        ]);
        setSummary(sum);
        setReference(ref);
      } catch (err) {
        console.warn('Failed to load progress summary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Progress & Longitudinal Patterns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Observational wellness trajectories and personal reference range evolution.
          </p>
        </div>
        <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-semibold font-mono">
          Non-Diagnostic Patterns
        </span>
      </div>

      {/* Weekly Aggregated Milestone Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Mood</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {summary?.weekly_metrics?.average_mood || '7.2'}/10
          </p>
          <span className="text-[10px] text-slate-400">Past 7 Days</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Stress</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {summary?.weekly_metrics?.average_stress || '4.5'}/10
          </p>
          <span className="text-[10px] text-slate-400">Past 7 Days</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Sleep</span>
          <p className="text-xl font-extrabold text-purple-700 mt-1">
            {summary?.weekly_metrics?.average_sleep_hours || '7.3'} hrs
          </p>
          <span className="text-[10px] text-slate-400">Restorative Rest</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Steps</span>
          <p className="text-xl font-extrabold text-blue-700 mt-1">
            {summary?.weekly_metrics?.average_daily_steps?.toLocaleString() || '8,450'}
          </p>
          <span className="text-[10px] text-slate-400">Daily Movement</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Check-in Rate</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {summary?.weekly_metrics?.checkin_completion_rate || '92%'}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Consistent</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Habit Helpfulness</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">
            {summary?.weekly_metrics?.recommendation_helpfulness || '87%'}
          </p>
          <span className="text-[10px] text-slate-400">Positive Feedback</span>
        </div>
      </div>

      {/* Personal Reference System (Section 14) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Individual Calibration
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {reference?.tier_label || 'Initial Reference (Days 1–2)'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Personal Reference System</h3>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-semibold border border-emerald-200">
            Confidence: {Math.round((reference?.confidence_score || 0.65) * 100)}%
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mb-6">
          {reference?.disclaimer ||
            'Personal Reference Range — Individualized physiological pattern, NOT a medical baseline or diagnosis.'}
        </p>

        {/* Tier progression visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50">
            <span className="font-bold text-emerald-900 block">Tier 1: Days 1–2</span>
            <p className="text-[11px] text-emerald-700 mt-1">Initial Reference Calibration</p>
            <span className="mt-2 text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold inline-block">
              Active Stage
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 opacity-80">
            <span className="font-bold text-slate-800 block">Tier 2: Week 1</span>
            <p className="text-[11px] text-slate-500 mt-1">Improved Pattern Sensitivity</p>
            <span className="mt-2 text-[10px] text-slate-400 block font-mono">Day 3 to 7</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 opacity-80">
            <span className="font-bold text-slate-800 block">Tier 3: Weeks 2–4</span>
            <p className="text-[11px] text-slate-500 mt-1">Stable Multi-Week Baseline</p>
            <span className="mt-2 text-[10px] text-slate-400 block font-mono">Day 8 to 28</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 opacity-80">
            <span className="font-bold text-slate-800 block">Tier 4: Long Term</span>
            <p className="text-[11px] text-slate-500 mt-1">Continuously Adapted Rhythm</p>
            <span className="mt-2 text-[10px] text-slate-400 block font-mono">&gt; 30 Days</span>
          </div>
        </div>
      </div>

      {/* 7-Day Longitudinal Mood vs. Stress Trajectory */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Subjective Trajectory</h3>
            <p className="text-xs text-slate-500">Comparing self-reported mood and stress indicators across the week.</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Mood (1-10)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Stress (1-10)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary?.daily_trends || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[1, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#059669' }}
              />
              <Line
                type="monotone"
                dataKey="stress"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
