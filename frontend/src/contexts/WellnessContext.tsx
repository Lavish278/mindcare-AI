import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WellnessIndicators, SafetyDetails } from '../types';
import { api } from '../services/api';

interface WellnessContextType {
  indicators: WellnessIndicators | null;
  refreshIndicators: () => Promise<void>;
  crisisAlert: SafetyDetails | null;
  triggerCrisis: (details: SafetyDetails) => void;
  dismissCrisis: () => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export const WellnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [indicators, setIndicators] = useState<WellnessIndicators | null>({
    mood_wellness_indicator: '7/10',
    stress_wellness_indicator: '4/10',
    energy_indicator: '6/10',
    disclaimer: 'WELLNESS INDICATORS — NOT MEDICAL DIAGNOSES'
  });
  const [crisisAlert, setCrisisAlert] = useState<SafetyDetails | null>(null);

  const refreshIndicators = async () => {
    try {
      const data = await api.getWellnessIndicators();
      setIndicators(data);
    } catch (err) {
      console.warn('Could not fetch wellness indicators:', err);
    }
  };

  useEffect(() => {
    refreshIndicators();
  }, []);

  const triggerCrisis = (details: SafetyDetails) => {
    setCrisisAlert(details);
  };

  const dismissCrisis = () => {
    setCrisisAlert(null);
  };

  return (
    <WellnessContext.Provider value={{ indicators, refreshIndicators, crisisAlert, triggerCrisis, dismissCrisis }}>
      {children}
    </WellnessContext.Provider>
  );
};

export const useWellness = () => {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error('useWellness must be used within a WellnessProvider');
  return ctx;
};
