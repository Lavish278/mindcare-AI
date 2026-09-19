import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  CalendarCheck,
  Watch,
  Sparkles,
  TrendingUp,
  Compass,
  ShieldCheck,
  BarChart3,
  X
} from 'lucide-react';
import { DisclaimerBanner } from './DisclaimerBanner';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Companion', icon: MessageSquare, badge: 'Text' },
    { to: '/voice', label: 'Voice Companion', icon: Mic, badge: 'Voice' },
    { to: '/checkins', label: 'Check-ins', icon: CalendarCheck, badge: '2x/Day' },
    { to: '/wearables', label: 'Wearable Biosensors', icon: Watch, badge: 'Plan B' },
    { to: '/insights', label: 'Wellness Insights', icon: Sparkles },
    { to: '/progress', label: 'Progress & Patterns', icon: TrendingUp },
    { to: '/recommendations', label: 'Recommendations', icon: Compass },
    { to: '/settings/privacy', label: 'Privacy & Consent', icon: ShieldCheck },
    { to: '/admin', label: 'Research & Admin', icon: BarChart3, badge: 'Thesis' },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between py-5 px-3">
      <div>
        <div className="flex items-center justify-between px-3 mb-4 lg:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-200/60'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-2 pt-4 border-t border-slate-100">
        <DisclaimerBanner compact />
        <div className="mt-3 text-[11px] text-slate-400 text-center">
          Final-Year Thesis Prototype
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-57px)] flex-shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-64 bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
