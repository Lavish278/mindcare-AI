import React from 'react';
import { Phone, MessageSquare, Globe, AlertTriangle, X } from 'lucide-react';
import { useWellness } from '../contexts/WellnessContext';

export const CrisisModal: React.FC = () => {
  const { crisisAlert, dismissCrisis } = useWellness();

  if (!crisisAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 relative">
        <button
          onClick={dismissCrisis}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{crisisAlert.title || 'Immediate Support Available'}</h3>
            <p className="text-xs text-red-600 font-semibold tracking-wide uppercase">Dedicated Crisis Protocol</p>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed mb-6 bg-red-50/60 p-3.5 rounded-xl border border-red-100">
          {crisisAlert.message}
        </p>

        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free, Confidential 24/7 Lifelines</h4>

          <a
            href="tel:988"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">988 Suicide & Crisis Lifeline</p>
                <p className="text-xs text-slate-500">Call or Text 988 (USA & Canada)</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              Call 988
            </span>
          </a>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Crisis Text Line</p>
                <p className="text-xs text-slate-500">Text HOME to 741741 to connect with a counselor</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
              Text 741741
            </span>
          </div>

          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Find A Helpline (International)</p>
                <p className="text-xs text-slate-500">Free, confidential support in over 130 countries</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
              Visit Site
            </span>
          </a>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <p className="italic">
            MindCare AI is an automated wellness companion, not emergency medical services. If you are in immediate danger, please call 911 or visit your nearest emergency room.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={dismissCrisis}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            I Understand / Return to App
          </button>
        </div>
      </div>
    </div>
  );
};
