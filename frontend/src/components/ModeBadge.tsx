import React, { useState } from 'react';
import { Sun, Moon, Activity, ChevronDown } from 'lucide-react';
import { useWearable } from '../contexts/WearableContext';
import type { ContextMode } from '../types';

export const ModeBadge: React.FC = () => {
  const { currentMode, setMode } = useWearable();
  const [open, setOpen] = useState(false);

  const modeConfig = {
    AWAKE: {
      label: 'Awake Mode',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      icon: Sun,
      desc: 'Resting & daily routine reference'
    },
    SLEEP: {
      label: 'Sleep Mode',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      icon: Moon,
      desc: 'Nocturnal restoration reference'
    },
    EXERCISE: {
      label: 'Exercise Mode',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Activity,
      desc: 'High HR contextualized as physical exertion'
    }
  };

  const current = modeConfig[currentMode] || modeConfig.AWAKE;
  const IconComponent = current.icon;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:shadow-sm ${current.color}`}
        title="Click to toggle contextual physiological mode"
      >
        <span className={`w-2 h-2 rounded-full ${current.dot} animate-pulse`} />
        <IconComponent className="w-3.5 h-3.5" />
        <span>{current.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contextual Mode Engine</p>
              <p className="text-[11px] text-slate-500">Adapts anomaly interpretation based on current activity.</p>
            </div>
            {(['AWAKE', 'SLEEP', 'EXERCISE'] as ContextMode[]).map((mode) => {
              const cfg = modeConfig[mode];
              const Icon = cfg.icon;
              const isSelected = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setMode(mode);
                    setOpen(false);
                  }}
                  className={`w-full flex items-start space-x-3 p-2.5 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-800">{cfg.label}</span>
                      {isSelected && <span className="text-[10px] bg-wellness-100 text-wellness-800 font-medium px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{cfg.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
