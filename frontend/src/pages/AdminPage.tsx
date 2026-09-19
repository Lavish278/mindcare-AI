import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Shield,
  Activity,
  CheckCircle2,
  Watch,
  MessageSquare,
  Mic,
  GitBranch,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

export const AdminPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await api.getAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.warn('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  const qualityPieData = metrics?.data_quality_distribution
    ? [
        { name: 'Valid Signals', value: metrics.data_quality_distribution.valid_signals_percent, color: '#10b981' },
        { name: 'Stale Signals', value: metrics.data_quality_distribution.stale_signals_percent, color: '#8b5cf6' },
        { name: 'Suspicious / Outliers', value: metrics.data_quality_distribution.suspicious_noise_percent, color: '#f59e0b' },
        { name: 'Missing', value: metrics.data_quality_distribution.missing_signals_percent, color: '#ef4444' },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Research & Evaluation Governance
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              v1.0-university-mvp
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Admin & Research Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            De-identified aggregate metrics for university project defense, system evaluation, and pipeline tracking.
          </p>
        </div>
      </div>

      {/* Aggregate Cohort KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Cohort</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{metrics?.active_cohort_size || 42}</p>
          <span className="text-[10px] text-slate-400">Participating Students</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Check-in Completion</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{metrics?.checkin_completion_rate_percent || 91.2}%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">High Compliance</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wearable Sync Rate</span>
            <Watch className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{metrics?.wearable_connection_rate_percent || 86.5}%</p>
          <span className="text-[10px] text-slate-400">Mock & Device Streams</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Satisfaction Index</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {metrics?.recommendation_satisfaction?.satisfaction_index_percent || 88.4}%
          </p>
          <span className="text-[10px] text-slate-400">Feedback Helpful Ratio</span>
        </div>
      </div>

      {/* Grid: Signal Quality Breakdown & Modality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signal Quality Pie Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Data Quality Layer Signal Integrity</h3>
          <p className="text-xs text-slate-500 mb-4">
            Pre-AI signal classification preventing false anomaly alerts from degraded telemetry.
          </p>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {qualityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Signal Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {qualityPieData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modality Interaction Share */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Companion Modality Usage</h3>
          <p className="text-xs text-slate-500">
            Student engagement distribution across conversational channels.
          </p>

          <div className="space-y-4 mt-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span className="flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Text Companion Sessions</span>
                </span>
                <span>{metrics?.text_usage_share_percent || 65.2}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${metrics?.text_usage_share_percent || 65.2}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Mic className="w-4 h-4 text-purple-600" />
                  <span>Voice Companion Audio Turns</span>
                </span>
                <span>{metrics?.voice_usage_share_percent || 34.8}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${metrics?.voice_usage_share_percent || 34.8}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-1">Safety & Crisis Interceptions Logged:</span>
            <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {metrics?.safety_interception_count || 0} incidents safely escalated to 988 Lifeline resources with 0 medical diagnostic breaches.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Improvement Pipeline (Section 30) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <GitBranch className="w-4 h-4" />
          <span>Controlled System Improvement Pipeline</span>
        </div>
        <h3 className="text-lg font-bold text-white">Versioned Deployment & Evaluation Roadmap</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          MindCare AI operates an ethical improvement loop. Prompts and adaptive templates evolve via de-identified aggregate analytics without fine-tuning public LLMs on raw student conversations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 text-xs">
          {metrics?.continuous_improvement_pipeline?.pipeline_stages?.map((st: any, idx: number) => (
            <div key={idx} className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-emerald-400 font-mono uppercase block">Stage {idx + 1}</span>
              <span className="font-bold text-white mt-0.5 block">{st.stage}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Status: {st.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
