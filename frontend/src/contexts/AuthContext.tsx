import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  loginAsDemo: () => Promise<void>;
  updateConsent: (consentUpdates: Partial<UserProfile['privacy_consent']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load existing user session or default to demo user
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('mindcare_token');
        if (token) {
          const profile = await api.getMe();
          setUser(profile);
        } else {
          // Pre-populate with demo user session for instant university evaluation
          const demoProfile: UserProfile = {
            id: 'demo-user-123',
            uid: 'demo-user-123',
            email: 'alex.chen@university.demo',
            display_name: 'Alex Chen',
            role: 'user',
            onboarding_completed: true,
            wellness_preferences: {
              goals: ['Academic Stress Reduction', 'Restorative Sleep', 'Mindful Habits'],
              notification_frequency: 'twice_daily'
            },
            privacy_consent: {
              ai_conversation_data: true,
              wellness_data: true,
              wearable_data: true,
              notifications_enabled: true,
              analytics_participation: true
            },
            created_at: new Date().toISOString()
          };
          setUser(demoProfile);
        }
      } catch (err) {
        console.warn('Auth check error, defaulting to demo user:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('mindcare_token', res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register({ email, password: pass, display_name: name });
    localStorage.setItem('mindcare_token', res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('mindcare_token');
    setUser(null);
  };

  const loginAsDemo = async () => {
    await login('student@mindcare.demo', 'DemoStudent2026!');
  };

  const updateConsent = async (consentUpdates: Partial<UserProfile['privacy_consent']>) => {
    if (!user) return;
    const res = await api.updatePrivacy(consentUpdates);
    setUser(prev => prev ? { ...prev, privacy_consent: res.privacy_consent } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsDemo, updateConsent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
