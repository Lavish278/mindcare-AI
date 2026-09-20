import React, { useState, useEffect } from 'react';
import {
  Watch,
  RefreshCw,
  Battery,
  ShieldCheck,
  Activity,
  Moon,
  Footprints,
  Flame,
  AlertTriangle,
  Play,
  CheckCircle2,
  Power,
  Radio,
  Terminal,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { useWearable } from '../contexts/WearableContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { AnomalyAlert } from '../components/AnomalyAlert';
import { api } from '../services/api';
import type { HeartRatePoint, SleepRecord, ActivityDay, ExerciseSession } from '../types';

export const WearablesPage: React.FC = () => {
  const {
    status,
    readings,
    currentMode,
    anomalyEvaluation,
    syncing,
    sync,
    connectDemoBand,
    disconnect,
    simulateAnomalyScenario,
    ingestReading
  } = useWearable();

  const [timeseries, setTimeseries] = useState<HeartRatePoint[]>([]);
  const [sleepData, setSleepData] = useState<SleepRecord[]>([]);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [workouts, setWorkouts] = useState<ExerciseSession[]>([]);
  const [activeScenario, setActiveScenario] = useState('default');
  const [simulating, setSimulating] = useState(false);

  // Live Hardware Ingestion Form State
  const [liveHr, setLiveHr] = useState(78);
  const [liveMode, setLiveMode] = useState<'AWAKE' | 'SLEEP' | 'EXERCISE'>('AWAKE');
  const [liveSteps, setLiveSteps] = useState(250);
  const [liveDevice, setLiveDevice] = useState('Apple Watch / WearOS');
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<any>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const loadWearableAnalytics = async () => {
      try {
        const [hr, sl, act] = await Promise.all([
          api.getHeartRateTimeseries(24),
          api.getSleepData(7),
          api.getActivityData(7),
        ]);
        setTimeseries(hr);
        setSleepData(sl);
        setActivityData(act.daily_activity || []);
        setWorkouts(act.exercise_sessions || []);
      } catch (err) {
        console.warn('Failed to load wearable historical streams:', err);
      }
    };
    loadWearableAnalytics();
  }, [syncing]);

  const handleScenarioClick = async (scenario: string) => {
    setActiveScenario(scenario);
    setSimulating(true);
    try {
      await simulateAnomalyScenario(scenario);
    } finally {
      setSimulating(false);
    }
  };

  const handleLiveIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    try {
      const res = await ingestReading({
        heart_rate: Number(liveHr),
        context_mode: liveMode,
        steps: Number(liveSteps),
        device_name: liveDevice,
      });
      setIngestSuccess(res);
      // Refresh timeseries chart
      const updatedHr = await api.getHeartRateTimeseries(24);
      setTimeseries(updatedHr);
    } catch (err) {
      console.error('Failed to ingest live telemetry:', err);
    } finally {
      setIngesting(false);
    }
  };

  const handleCopySnippet = () => {
    const snippet = `curl -X POST http://127.0.0.1:8000/api/v1/wearables/ingest \\
  -H "Content-Type: application/json" \\
  -d '{"heart_rate": ${liveHr}, "context_mode": "${liveMode}", "steps": ${liveSteps}, "device_name": "${liveDevice}"}'`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const isConnected = status?.status === 'CONNECTED';

  return (
    <div className="space-y-6 pb-12">
      <DisclaimerBanner />

      {/* Header & Device Control Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {status?.device_name || 'MindCare Biosensor Band Pro'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isConnected ? 'LIVE STREAMING' : 'DISCONNECTED'}
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Mock Provider
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Provider Abstraction: <span className="font-mono">MockWearableProvider v1.0</span> (Zero hardware required)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <button
                  onClick={sync}
                  disabled={syncing}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Sensor'}</span>
                </button>
                <button
                  onClick={disconnect}
                  className="p-2 border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl text-xs transition-colors"
                  title="Disconnect"
                >
                  <Power className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={connectDemoBand}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Connect Demo Wearable</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Status Ribbon */}
        {isConnected && (
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Battery Level</span>
              <div className="flex items-center space-x-1 font-bold text-slate-800 mt-0.5">
                <Battery className="w-4 h-4 text-emerald-600" />
                <span>{readings?.battery_level || 88}%</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Signal Integrity</span>
              <div className="flex items-center space-x-1 font-bold text-slate-800 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${readings?.data_quality === 'VALID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{readings?.data_quality || 'VALID'}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Context Mode</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{currentMode} Mode</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Last Synchronized</span>
              <span className="text-slate-600 mt-0.5 block font-mono text-[11px]">Just now</span>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Anomaly Engine Banner */}
      <AnomalyAlert evaluation={anomalyEvaluation} />

      {/* Interactive Anomaly Demonstration Simulator */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>University Thesis Defense Demonstration Controls</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Contextual Anomaly Engine Simulator</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject real physiological scenarios to demonstrate how the context engine avoids false medical alerts.
            </p>
          </div>
          {simulating && <span className="text-xs text-emerald-400 animate-pulse">Evaluating scenario...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Scenario 1: Normal Baseline */}
          <button
            onClick={() => handleScenarioClick('default')}
            className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
              activeScenario === 'default'
                ? 'bg-slate-800 border-emerald-500 text-white shadow-2xs'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">1. Normal Awake Baseline</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">NORMAL</span>
            </div>
            <p className="text-[11px] text-slate-400">71 bpm resting HR in Awake Mode.</p>
          </button>

          {/* Scenario 2: Exercise Spike */}
          <button
            onClick={() => handleScenarioClick('exercise_normal_spike')}
            className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
              activeScenario === 'exercise_normal_spike'
                ? 'bg-slate-800 border-amber-500 text-white shadow-2xs'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">2. Exercise Spike</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">NORMAL (Context)</span>
            </div>
            <p className="text-[11px] text-slate-400">148 bpm in Exercise Mode. Contextualized as physical exertion.</p>
          </button>

          {/* Scenario 3: Sleep High HR Anomaly */}
          <button
            onClick={() => handleScenarioClick('sleep_high_hr')}
            className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
              activeScenario === 'sleep_high_hr'
                ? 'bg-slate-800 border-red-500 text-white shadow-2xs'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">3. Sleep Nocturnal Spike</span>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">UNUSUAL</span>
            </div>
            <p className="text-[11px] text-slate-400">104 bpm during Sleep Mode. Flags non-diagnostic observation.</p>
          </button>

          {/* Scenario 4: Stale Sensor Signal */}
          <button
            onClick={() => handleScenarioClick('data_stale')}
            className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
              activeScenario === 'data_stale'
                ? 'bg-slate-800 border-purple-500 text-white shadow-2xs'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">4. Degraded Sensor Data</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">STALE</span>
            </div>
            <p className="text-[11px] text-slate-400">Data &gt; 2 hours old. Data quality gate halts false alarms.</p>
          </button>
        </div>
      </div>

      {/* External Hardware & Live Wearables Ingestion Bridge */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">External Hardware & Live Wearable Ingestion Bridge</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  HTTP / REST Ingest
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stream real-time telemetry from physical smartwatches (Apple Watch, WearOS, Garmin) or IoT biosensors (ESP32).
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200">
            POST /api/v1/wearables/ingest
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form to inject live reading directly from UI */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interactive Telemetry Transmitter</span>
            </h4>
            <form onSubmit={handleLiveIngest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    min="30"
                    max="280"
                    value={liveHr}
                    onChange={(e) => setLiveHr(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Context Mode</label>
                  <select
                    value={liveMode}
                    onChange={(e) => setLiveMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="AWAKE">AWAKE (Resting / Daytime)</option>
                    <option value="SLEEP">SLEEP (Nocturnal Rest)</option>
                    <option value="EXERCISE">EXERCISE (Physical Workout)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Recent Steps</label>
                  <input
                    type="number"
                    min="0"
                    value={liveSteps}
                    onChange={(e) => setLiveSteps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Device Identifier</label>
                  <input
                    type="text"
                    value={liveDevice}
                    onChange={(e) => setLiveDevice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={ingesting}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{ingesting ? 'Transmitting & Analyzing...' : 'Transmit Live Telemetry Reading'}</span>
              </button>
            </form>

            {/* Ingestion Output Flash Card */}
            {ingestSuccess && (
              <div className="mt-4 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs space-y-1 animate-fadeIn">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Telemetry Ingested & Evaluated Live!</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900">
                  <div>
                    <span className="text-emerald-700/70 block">HR:</span>
                    <span className="font-bold">{ingestSuccess.reading?.heart_rate} BPM</span>
                  </div>
                  <div>
                    <span className="text-emerald-700/70 block">Quality Gate:</span>
                    <span className="font-bold">{ingestSuccess.reading?.data_quality}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700/70 block">Anomaly Flag:</span>
                    <span className="font-bold">{ingestSuccess.anomaly_evaluation?.state || 'NORMAL'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Code Integration Guide for External Wearable & IoT Devices */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hardware & Bridge Integration Snippet</span>
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Any companion mobile app, BLE gateway, or ESP32 sensor can push biometrics directly:
              </p>
              <pre className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
{`curl -X POST http://127.0.0.1:8000/api/v1/wearables/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "heart_rate": ${liveHr},
    "context_mode": "${liveMode}",
    "steps": ${liveSteps},
    "device_name": "${liveDevice}"
  }'`}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>
                <strong className="text-white">Python Script:</strong> <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">python scripts/send-wearable-reading.py --stream</code>
              </p>
              <p>
                The platform immediately runs <strong className="text-slate-200">DataQualityValidator</strong> and evaluates readings against personalized baselines in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Physiological Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Heart Rate Timeseries */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">24-Hour Continuous Heart Rate</h3>
              <p className="text-xs text-slate-500">Includes circadian awake, nocturnal sleep, and workout bouts.</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[50, 165]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} bpm`, 'Heart Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Sleep Duration & Stages */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sleep Architecture</h3>
              <p className="text-xs text-slate-500">Deep, REM, and Light restorative duration (Hours).</p>
            </div>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
              Avg 7.3 hrs
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  formatter={(val: any, name: any) => [`${val} hrs`, name]}
                />
                <Bar dataKey="deep_sleep_hours" name="Deep Sleep" stackId="a" fill="#3b82f6" />
                <Bar dataKey="rem_sleep_hours" name="REM Sleep" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="light_sleep_hours" name="Light Sleep" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workouts & Recent Activity Sessions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Recent Exercise Sessions (Plan B)</h3>
        <p className="text-xs text-slate-500 mb-4">
          Movement bouts detected by wearable biosensors. Automatically flags Exercise Mode during workouts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workouts.map((w) => (
            <div key={w.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">{w.activity_type}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {w.duration_minutes} mins
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Heart Rate</span>
                  <span className="font-bold text-slate-900">{w.avg_heart_rate} bpm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Peak Heart Rate</span>
                  <span className="font-bold text-slate-900">{w.max_heart_rate} bpm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Energy Burned</span>
                  <span className="font-bold text-slate-900">{w.calories_burned} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Steps</span>
                  <span className="font-bold text-slate-900">{w.steps}</span>
                </div>
              </div>
              <span className="block text-[10px] text-slate-400 mt-2 font-mono">{w.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
