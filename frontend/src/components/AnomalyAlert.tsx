import React from 'react';
import { AlertCircle, CheckCircle2, Info, Activity } from 'lucide-react';
import type { AnomalyEvaluation } from '../types';

export const AnomalyAlert: React.FC<{ evaluation: AnomalyEvaluation | null }> = ({ evaluation }) => {
  if (!evaluation) return null;

  const isAnomaly = evaluation.is_anomaly;

  if (!isAnomaly) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-emerald-800 uppercase tracking-wide">Physiological State: Normal</span>
            <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[10px]">
              {evaluation.current_mode} Mode
            </span>
          </div>
          <p className="text-emerald-700 mt-1 leading-relaxed">{evaluation.explanation}</p>
        </div>
      </div>
    );
  }

  const isSustained = evaluation.state === 'SUSTAINED_ANOMALY';

  return (
    <div className={`rounded-xl p-4 border text-xs ${
      isSustained ? 'bg-amber-50/90 border-amber-300' : 'bg-orange-50/80 border-orange-200'
    }`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
          isSustained ? 'text-amber-600' : 'text-orange-500'
        }`} />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Contextual Observation: {evaluation.state.replace('_', ' ')}
            </span>
            <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[10px]">
              {evaluation.current_mode} Mode
            </span>
          </div>
          <p className="text-slate-700 mt-1 leading-relaxed font-normal">{evaluation.explanation}</p>
          {evaluation.recommendation && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center space-x-1.5 text-slate-800 font-medium">
              <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                Suggested Wellness Action:
              </span>
              <span>{evaluation.recommendation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
