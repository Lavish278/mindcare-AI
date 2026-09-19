import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium border border-slate-200">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span>WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-600 mb-6">
      <div className="flex items-center space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-semibold text-slate-700 tracking-wide uppercase text-[11px]">
          WELLNESS SUPPORT NOTICE
        </span>
        <span className="hidden md:inline text-slate-300">|</span>
        <p className="hidden md:inline text-slate-600">
          MindCare AI provides self-monitoring insights and lifestyle suggestions. It does not diagnose medical conditions or substitute clinical care.
        </p>
      </div>
      <span className="text-[10px] bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded font-mono">
        Non-Diagnostic
      </span>
    </div>
  );
};
