import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ContextMode, WearableStatus, WearableReadings, AnomalyEvaluation } from '../types';
import { api } from '../services/api';

interface WearableContextType {
  status: WearableStatus | null;
  readings: WearableReadings | null;
  currentMode: ContextMode;
  anomalyEvaluation: AnomalyEvaluation | null;
  syncing: boolean;
  sync: () => Promise<void>;
  setMode: (mode: ContextMode) => Promise<void>;
  connectDemoBand: () => Promise<void>;
  disconnect: () => Promise<void>;
  simulateAnomalyScenario: (scenario: string) => Promise<void>;
  ingestReading: (data: { heart_rate: number; context_mode?: string; steps?: number; battery_level?: number; device_name?: string }) => Promise<any>;
}

const WearableContext = createContext<WearableContextType | undefined>(undefined);

export const WearableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [readings, setReadings] = useState<WearableReadings | null>(null);
  const [currentMode, setCurrentMode] = useState<ContextMode>('AWAKE');
  const [anomalyEvaluation, setAnomalyEvaluation] = useState<AnomalyEvaluation | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchWearableState = async () => {
    try {
      const [st, rd, md] = await Promise.all([
        api.getWearableStatus(),
        api.getWearableReadings(),
        api.getWearableMode(),
      ]);
      setStatus(st);
      setReadings(rd);
      if (rd.anomaly_evaluation) {
        setAnomalyEvaluation(rd.anomaly_evaluation);
      }
      if (md?.mode) {
        setCurrentMode(md.mode as ContextMode);
      }
    } catch (err) {
      console.warn('Error querying wearable state, fallback values used:', err);
    }
  };

  useEffect(() => {
    fetchWearableState();
    // Poll every 25 seconds for dynamic demonstration
    const interval = setInterval(fetchWearableState, 25000);
    return () => clearInterval(interval);
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      await api.syncWearable();
      await fetchWearableState();
    } finally {
      setSyncing(false);
    }
  };

  const setMode = async (mode: ContextMode) => {
    setCurrentMode(mode);
    try {
      await api.setWearableMode(mode);
      await fetchWearableState();
    } catch (err) {
      console.error('Failed to set mode:', err);
    }
  };

  const connectDemoBand = async () => {
    setSyncing(true);
    try {
      await api.connectWearable('mock');
      await fetchWearableState();
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    try {
      await api.disconnectWearable();
      setStatus({ status: 'DISCONNECTED', device_name: null, last_synced: null });
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const simulateAnomalyScenario = async (scenario: string) => {
    setSyncing(true);
    try {
      const res = await api.simulateAnomaly(scenario);
      if (res.readings) {
        setReadings(res.readings);
      }
      if (res.anomaly_evaluation) {
        setAnomalyEvaluation(res.anomaly_evaluation);
        if (res.anomaly_evaluation.current_mode) {
          setCurrentMode(res.anomaly_evaluation.current_mode);
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const ingestReading = async (data: {
    heart_rate: number;
    context_mode?: string;
    steps?: number;
    battery_level?: number;
    device_name?: string;
  }) => {
    setSyncing(true);
    try {
      const res = await api.ingestWearableReading(data);
      if (res.reading) {
        setReadings(res.reading);
      }
      if (res.anomaly_evaluation) {
        setAnomalyEvaluation(res.anomaly_evaluation);
        if (res.anomaly_evaluation.current_mode) {
          setCurrentMode(res.anomaly_evaluation.current_mode);
        }
      }
      await fetchWearableState();
      return res;
    } finally {
      setSyncing(false);
    }
  };

  return (
    <WearableContext.Provider
      value={{
        status,
        readings,
        currentMode,
        anomalyEvaluation,
        syncing,
        sync,
        setMode,
        connectDemoBand,
        disconnect,
        simulateAnomalyScenario,
        ingestReading,
      }}
    >
      {children}
    </WearableContext.Provider>
  );
};

export const useWearable = () => {
  const ctx = useContext(WearableContext);
  if (!ctx) throw new Error('useWearable must be used within a WearableProvider');
  return ctx;
};
