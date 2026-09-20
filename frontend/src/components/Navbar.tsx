import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, RefreshCw, AlertCircle, LogOut, User, Menu } from 'lucide-react';
import { ModeBadge } from './ModeBadge';
import { useAuth } from '../contexts/AuthContext';
import { useWearable } from '../contexts/WearableContext';
import { useWellness } from '../contexts/WellnessContext';

export const Navbar: React.FC<{ onToggleMobileMenu?: () => void }> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { syncing, sync, status } = useWearable();
  const { triggerCrisis } = useWellness();
  const navigate = useNavigate();

  const handleCrisisClick = () => {
    triggerCrisis({
      risk_level: 'SUPPORT',
      category: 'user_requested_crisis_support',
      title: 'Immediate Crisis Support Resources',
      message: 'Here are immediate, confidential 24/7 human crisis support resources. MindCare AI provides wellness self-monitoring and cannot provide emergency medical intervention.',
      resources: [
        { name: '988 Suicide & Crisis Lifeline', phone: '988', details: 'Free, confidential 24/7 across US & Canada' },
        { name: 'Crisis Text Line', sms: 'Text HOME to 741741', details: 'Free 24/7 counseling via SMS' },
        { name: 'Find A Helpline', website: 'https://findahelpline.com', details: 'International support directory' }
      ],
      disclaimer: 'MindCare AI is an automated digital companion, not an emergency healthcare provider.'
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs text-white">
              <Heart className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base">MindCare</span>
                <span className="text-emerald-600 font-bold text-base">AI</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                  MVP v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Smart Mental Wellness Companion</p>
            </div>
          </Link>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mode Switcher */}
          <ModeBadge />

          {/* Sync Wearable Button */}
          <button
            onClick={sync}
            disabled={syncing}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            title="Synchronize wearable biosensors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Band'}</span>
          </button>

          {/* Crisis Hotline Quick Button */}
          <button
            onClick={handleCrisisClick}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
            title="Immediate Crisis & Lifeline Resources"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Need Help? 988</span>
            <span className="md:hidden">988</span>
          </button>

          {/* User profile dropdown or demo login */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.display_name || 'Alex Chen'}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user.role || 'Student'}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

