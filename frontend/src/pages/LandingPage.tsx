import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Watch, ShieldCheck, Sparkles, Activity, ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    await loginAsDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Heart className="w-4 h-4 fill-white/20" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">MindCare <span className="text-emerald-600">AI</span></span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              University Project MVP
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDemoClick}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-700" />
              <span>Launch Demo Mode</span>
            </button>
            <Link
              to="/login"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Mental Wellness & Wearable Biosensors Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            A companion that listens to your thoughts & <span className="text-emerald-600">understands your body</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
            MindCare AI unifies supportive conversational AI with context-aware wearable biosensors.
            By interpreting physiological heart rate, sleep, and activity against your personalized reference,
            it helps you build sustainable wellness habits without medical claims or diagnostic labels.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-2xs transition-all"
            >
              Create Student Account
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 italic">
            WELLNESS SUPPORT PLATFORM — Non-diagnostic self-reflection and lifestyle support.
          </p>
        </div>

        {/* Two-Part Architecture (Plan A & Plan B) */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan A Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Plan A</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Subjective Self-Monitoring</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">AI Wellness Companion</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Empathetic text and voice conversations grounded in psychological self-reflection.
              Features twice-daily adaptive check-ins, mood/stress/energy tracking, and personalized habit guidance.
            </p>
            <ul className="mt-5 space-y-2 text-xs text-slate-700">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Text & Voice AI with calm, non-judgmental personality</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Midday (~12 PM) & Evening reflection check-ins</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Dedicated Safety Layer with 988 Crisis Hotline Interception</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Adaptive questioning based on recent history</span>
              </li>
            </ul>
          </div>

          {/* Plan B Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
              <Watch className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Plan B</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Objective Physiological Stream</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Wearable Biosensor Integration</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Provider abstraction with realistic mock streaming. Connects continuous heart rate, sleep architecture,
              and step metrics into a tri-mode context engine (Awake, Sleep, Exercise).
            </p>
            <ul className="mt-5 space-y-2 text-xs text-slate-700">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>Tri-Mode Engine: AWAKE, SLEEP, and EXERCISE modes</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>Personal Reference Range (Not generic medical baselines)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>Data Quality Layer: VALID, SUSPICIOUS, MISSING, STALE</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>Contextual Anomaly Engine (Exercise HR is NOT flagged)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ethical Boundaries & Privacy Section */}
        <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Ethical AI & Privacy First Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Designed with strict non-diagnostic boundaries and student privacy protection.
            </h3>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              MindCare AI is strictly a wellness support tool. It does not diagnose clinical depression, anxiety disorders,
              or cardiovascular pathology. Personal conversations are never fed into external general AI training sets,
              and students maintain granular opt-in control over biometric synchronization and data deletion.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Granular Privacy Toggles</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Automatic 988 Crisis Escalation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>De-identified Research Governance</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <p>© 2026 MindCare AI — University Final-Year Engineering Project.</p>
        <p className="mt-1">Non-diagnostic digital wellness companion. Developed for local academic demonstration.</p>
      </footer>
    </div>
  );
};
