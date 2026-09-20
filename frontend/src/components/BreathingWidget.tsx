import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

export const BreathingWidget: React.FC = () => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          // Transition to next phase
          if (phase === 'Inhale') {
            setPhase('Hold');
            return 4;
          } else if (phase === 'Hold') {
            setPhase('Exhale');
            return 4;
          } else if (phase === 'Exhale') {
            setPhase('Pause');
            return 4;
          } else {
            setPhase('Inhale');
            setCyclesCompleted((c) => c + 1);
            return 4;
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, phase]);

  const reset = () => {
    setActive(false);
    setPhase('Inhale');
    setSeconds(4);
  };

  const getScaleClass = () => {
    if (!active) return 'scale-90 opacity-70';
    if (phase === 'Inhale') return 'scale-125 transition-transform duration-[4000ms] ease-out';
    if (phase === 'Hold') return 'scale-125';
    if (phase === 'Exhale') return 'scale-90 transition-transform duration-[4000ms] ease-in';
    return 'scale-90';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
        <Wind className="w-4 h-4" />
        <span>4x4 Box Breathing Assistant</span>
      </div>
      <p className="text-xs text-slate-500 mb-6 max-w-xs">
        Stimulate parasympathetic recovery by pacing your breath in equal 4-second intervals.
      </p>

      {/* Visual Animated Breathing Sphere */}
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <div
          className={`absolute w-36 h-36 rounded-full bg-emerald-100/70 border-2 border-emerald-300 transform transition-all ${getScaleClass()}`}
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-xl font-bold text-emerald-800">{active ? phase : 'Ready'}</span>
          <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{active ? seconds : 4}s</span>
          {active && (
            <span className="text-[10px] text-emerald-600 font-medium mt-1">
              Cycle {cyclesCompleted + 1}
            </span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-3 mt-6">
        <button
          onClick={() => setActive(!active)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-colors ${
            active
              ? 'bg-slate-800 text-white hover:bg-slate-900'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{active ? 'Pause Exercise' : 'Start 4x4 Breathing'}</span>
        </button>
        <button
          onClick={reset}
          className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

