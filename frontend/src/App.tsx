import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { WearableProvider } from './contexts/WearableContext';
import { WellnessProvider } from './contexts/WellnessContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CrisisModal } from './components/CrisisModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { VoicePage } from './pages/VoicePage';
import { CheckInsPage } from './pages/CheckInsPage';
import { WearablesPage } from './pages/WearablesPage';
import { InsightsPage } from './pages/InsightsPage';
import { ProgressPage } from './pages/ProgressPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';

// Main Application Layout with Navigation & Crisis Modal
const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-slate-800">
      <Navbar onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <CrisisModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WearableProvider>
        <WellnessProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Authenticated Dashboard Routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/voice" element={<VoicePage />} />
                <Route path="/checkins" element={<CheckInsPage />} />
                <Route path="/wearables" element={<WearablesPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/settings/privacy" element={<PrivacyPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </WellnessProvider>
      </WearableProvider>
    </AuthProvider>
  );
};

export default App;
