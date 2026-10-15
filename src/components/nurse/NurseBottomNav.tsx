import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ClipboardList, Bell, User } from 'lucide-react';

interface NurseBottomNavProps {
  onOpenAlerts: () => void;
}

export const NurseBottomNav: React.FC<NurseBottomNavProps> = ({ onOpenAlerts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAlertsForRole } = useStore();

  const alerts = getAlertsForRole('nurse');
  const alertCount = alerts.length;

  const isRoundsActive = location.pathname === '/rounds' || location.pathname.startsWith('/patients');

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => navigate('/rounds')}
        className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition-colors ${
          isRoundsActive
            ? 'text-wardTeal-700 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <ClipboardList className={`w-5 h-5 mb-0.5 ${isRoundsActive ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[11px]">Rounds</span>
      </button>

      <button
        onClick={onOpenAlerts}
        className="relative flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
      >
        <Bell className="w-5 h-5 mb-0.5" />
        {alertCount > 0 && (
          <span className="absolute top-1 right-2 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-600 rounded-full border border-white">
            {alertCount}
          </span>
        )}
        <span className="text-[11px]">Alerts</span>
      </button>

      <button
        onClick={() => navigate('/login')}
        className="flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[11px]">Shift / Switch</span>
      </button>
    </nav>
  );
};
