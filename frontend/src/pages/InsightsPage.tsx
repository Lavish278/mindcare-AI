import React from 'react';
import { Sparkles, TrendingUp, Moon, Activity, Smile, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const InsightsPage: React.FC = () => {
  const insights = [
    {
      id: 1,
      category: 'Stress & Physiological Rhythm',
      icon: Activity,
      iconColor: 'text-amber-600 bg-amber-50',
      observation: 'Your reported stress was higher today than your recent personal pattern.',
      context: 'Check-in stress rating reached 8/10 during morning assignment prep. Wearable resting heart rate showed an average 6 bpm elevation above your 71 bpm baseline between 10:30 AM and 1:00 PM.',
      suggestion: 'Incorporate a structured 4-minute box breathing pause or a short screen-free walk around campus.',
      confidence: 'High personal pattern correlation',
      disclaimer: 'Non-diagnostic pattern observation. Stress ratings reflect self-reported subjective perception.'
    },
    {
      id: 2,
      category: 'Sleep & Daytime Energy',
      icon: Moon,
      iconColor: 'text-purple-600 bg-purple-50',
      observation: 'Your sleep duration was lower than your recent pattern.',
      context: 'Last night recorded 6.1 hours of rest compared to your 7.3-hour personal reference average. Midday energy self-report reflected a 2.1 point drop in stamina.',
      suggestion: 'Dim bedroom lighting 30 minutes before sleep tonight and engage in a soothing tea or reading routine.',
      confidence: 'Validated historical habit trend',
      disclaimer: 'Non-diagnostic observation. Does not diagnose insomnia or clinical sleep disorders.'
    },
    {
      id: 3,
      category: 'Movement & Mood Uplift',
      icon: Smile,
      iconColor: 'text-emerald-600 bg-emerald-50',
      observation: 'Your mood improved noticeably after your afternoon activity.',
      context: 'Following yesterday\'s 25-minute brisk walk, your evening check-in mood rating increased from 5/10 to 8/10, alongside a gentle downshift in resting heart rate.',
      suggestion: 'Keep preserving your 20-30 minute afternoon outdoor walk as a core wellness anchor.',
      confidence: 'Consistent personal wellness correlation',
      disclaimer: 'Observational lifestyle correlation; physical movement stimulates endogenous endorphin balance.'
    },
    {
      id: 4,
      category: 'Activity Milestones',
      icon: TrendingUp,
      iconColor: 'text-blue-600 bg-blue-50',
      observation: 'Your physical activity increased by 18% over the past 3 days.',
      context: 'Average daily step count reached 8,940 steps compared to last week\'s 7,550 steps. Sleep efficiency showed a matching +4% improvement.',
      suggestion: 'Maintain this balanced activity cadence and remember to stay well-hydrated throughout your day.',
      confidence: 'Wearable biometric trend',
      disclaimer: 'Measured via wearable accelerometer telemetry.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <DisclaimerBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Personal Wellness Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contextual correlations synthesizing your psychosocial check-ins and wearable biosensor streams.
          </p>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold font-mono">
          Non-Causal Insights
        </span>
      </div>

      <div className="space-y-4 mt-6">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${item.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.observation}</h3>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {item.confidence}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                {item.context}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Actionable Habit: {item.suggestion}</span>
                </div>
                <Link
                  to="/recommendations"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-emerald-700"
                >
                  <span>Try recommendation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-400 italic">
                {item.disclaimer}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
